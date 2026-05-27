import {
  ArrowLeftRight,
  CalendarDays,
  ChevronDown,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SegmentedControl } from './SegmentedControl';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useI18n } from '@/contexts/I18nContext';
import type { SearchFormState, TimeWindow } from '@/types/flight';
import { AIRPORT_OPTIONS, type AirportOption } from '@shared/airports';

interface SearchPanelProps {
  form: SearchFormState;
  updateForm: (updates: Partial<SearchFormState>) => void;
  swapRoute: () => void;
  resetForm: () => void;
  onSearch: () => void;
}

function parseIsoDate(value: string): Date | undefined {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatDateInput(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeAirportQuery(value: string): string {
  return value.trim().toLowerCase();
}

function matchesAirport(option: AirportOption, query: string): boolean {
  const normalizedQuery = normalizeAirportQuery(query);
  if (!normalizedQuery) return true;

  return [option.code, option.name, option.city, ...option.aliases].some(
    (value) => normalizeAirportQuery(value).includes(normalizedQuery)
  );
}

function findExactAirport(value: string): AirportOption | undefined {
  const normalizedValue = normalizeAirportQuery(value);
  return AIRPORT_OPTIONS.find((option) =>
    [option.code, option.name, option.city, ...option.aliases].some(
      (candidate) => normalizeAirportQuery(candidate) === normalizedValue
    )
  );
}

interface AirportFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function AirportField({ id, label, value, onChange }: AirportFieldProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const matches = useMemo(
    () =>
      AIRPORT_OPTIONS.filter((option) => matchesAirport(option, query)).slice(
        0,
        8
      ),
    [query]
  );

  const selectAirport = (option: AirportOption) => {
    onChange(option.code);
    setQuery(option.code);
    setOpen(false);
  };

  const handleBlur = () => {
    const exactMatch = findExactAirport(query);
    if (exactMatch) {
      selectAirport(exactMatch);
      return;
    }

    if (query.trim().length === 3) {
      onChange(query.trim().toUpperCase());
      setQuery(query.trim().toUpperCase());
      return;
    }

    setQuery(value);
    setOpen(false);
  };

  const handleInput = (value: string) => {
    setQuery(value);
    setOpen(true);
  };

  return (
    <div className="relative">
      <input
        id={id}
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onChange={(e) => handleInput(e.target.value)}
        onInput={(e) => handleInput(e.currentTarget.value)}
        aria-label={label}
        autoComplete="off"
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {open && matches.length > 0 && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-30 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-md"
          role="listbox"
        >
          {matches.map((option) => (
            <button
              key={option.code}
              type="button"
              role="option"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectAirport(option)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">
                  {option.city}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {option.name}
                </span>
              </span>
              <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                {option.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface DatePickerFieldProps {
  id: string;
  value: string;
  min?: string;
  label: string;
  onChange: (value: string) => void;
}

function DatePickerField({
  id,
  value,
  min,
  label,
  onChange,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseIsoDate(value);
  const minDate = min ? parseIsoDate(min) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <input
            id={id}
            readOnly
            inputMode="none"
            value={formatDateInput(value)}
            aria-label={label}
            className="h-11 w-full rounded-lg border border-border bg-background px-3 pr-10 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </PopoverTrigger>
        <CalendarDays
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary"
          aria-hidden="true"
        />
      </div>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="w-[min(calc(100vw-2rem),22rem)] p-0"
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          className="[--cell-size:--spacing(10)] sm:[--cell-size:--spacing(8)]"
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(toIsoDate(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function SearchPanel({
  form,
  updateForm,
  swapRoute,
  resetForm,
  onSearch,
}: SearchPanelProps) {
  const { t } = useI18n();

  return (
    <form
      className="rounded-lg border border-border bg-card/95 p-4 shadow-lg shadow-primary/5 backdrop-blur-sm transition-shadow duration-200 focus-within:shadow-xl focus-within:shadow-primary/10 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">{t('search')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('searchDesc')}</p>
      </div>

      {/* Route row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2.5">
        <div className="space-y-2">
          <label
            htmlFor="origin"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('from')}
          </label>
          <AirportField
            id="origin"
            value={form.origin}
            label={t('from')}
            onChange={(value) => updateForm({ origin: value })}
          />
        </div>
        <button
          type="button"
          onClick={swapRoute}
          className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:text-primary active:scale-[0.97]"
          aria-label="Swap route"
        >
          <ArrowLeftRight className="h-4 w-4" />
        </button>
        <div className="space-y-2">
          <label
            htmlFor="destination"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('to')}
          </label>
          <AirportField
            id="destination"
            value={form.destination}
            label={t('to')}
            onChange={(value) => updateForm({ destination: value })}
          />
        </div>
      </div>

      {/* Fields grid */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label
            htmlFor="outboundDate"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('outbound')}
          </label>
          <DatePickerField
            id="outboundDate"
            value={form.outboundDate}
            label={t('outbound')}
            onChange={(value) => updateForm({ outboundDate: value })}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="returnDate"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('return')}
          </label>
          <DatePickerField
            id="returnDate"
            value={form.returnDate}
            min={form.outboundDate}
            label={t('return')}
            onChange={(value) => updateForm({ returnDate: value })}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="passengers"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('passengers')}
          </label>
          <div className="relative">
            <select
              id="passengers"
              value={form.passengers}
              onChange={(e) =>
                updateForm({ passengers: Number(e.target.value) })
              }
              className="h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-10 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value={1}>1 {t('adult')}</option>
              <option value={2}>2 {t('adults')}</option>
              <option value={3}>3 {t('adults')}</option>
              <option value={4}>4 {t('adults')}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="cabin"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('cabin')}
          </label>
          <div className="relative">
            <select
              id="cabin"
              value={form.cabin}
              onChange={(e) =>
                updateForm({ cabin: e.target.value as 'economy' | 'business' })
              }
              className="h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-10 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="economy">{t('economy')}</option>
              <option value="business">{t('business')}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="baggage"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('checkedBaggage')}
          </label>
          <div className="relative">
            <select
              id="baggage"
              value={form.baggage}
              onChange={(e) =>
                updateForm({ baggage: e.target.value as '20' | '23' | 'none' })
              }
              className="h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-10 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="20">20kg</option>
              <option value="23">23kg</option>
              <option value="none">None</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="maxStops"
            className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
          >
            {t('maxStops')}
          </label>
          <div className="relative">
            <select
              id="maxStops"
              value={form.maxStops}
              onChange={(e) =>
                updateForm({ maxStops: e.target.value as 'any' | '0' | '1' })
              }
              className="h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-10 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="any">{t('any')}</option>
              <option value="0">{t('nonStop')}</option>
              <option value="1">{t('oneStop')}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
              aria-hidden="true"
            />
          </div>
        </div>
        <div>
          <SegmentedControl
            label={t('outboundTime')}
            value={form.outboundWindow}
            onChange={(v: TimeWindow) => updateForm({ outboundWindow: v })}
          />
        </div>
        <div>
          <SegmentedControl
            label={t('returnTime')}
            value={form.returnWindow}
            onChange={(v: TimeWindow) => updateForm({ returnWindow: v })}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="submit"
          className="shimmer-action inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-lg font-bold text-primary-foreground shadow-sm transition-all duration-160 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97] sm:flex-1"
        >
          <Search className="h-5 w-5" />
          {t('searchFares')}
        </button>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setTimeout(onSearch, 50);
          }}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-base font-bold text-primary transition-all hover:-translate-y-0.5 hover:border-primary active:scale-[0.97] sm:w-auto"
        >
          <RotateCcw className="h-5 w-5" />
          {t('reset')}
        </button>
      </div>
    </form>
  );
}
