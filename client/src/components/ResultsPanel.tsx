import { CalendarX, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDuration, formatMoney } from "@/lib/formatters";
import {
  getRequiredBagKg,
  getUniqueAirlines,
} from "@/lib/filters";

import { useI18n } from "@/contexts/I18nContext";
import { Checkbox } from "./ui/checkbox";
import { FlightCard } from "./FlightCard";
import { SkeletonCard } from "./SkeletonCard";
import type { Flight, SearchFormState, TripDirection } from "@/types/flight";

interface ResultsPanelProps {
  form: SearchFormState;
  updateForm: (updates: Partial<SearchFormState>) => void;
  activeTab: TripDirection;
  setActiveTab: (tab: TripDirection) => void;
  flights: Flight[];
  allFlights: Flight[];
  loading: boolean;
  statusMessage: string;
  onEditSearch?: () => void;
}

export function ResultsPanel({
  form,
  updateForm,
  activeTab,
  setActiveTab,
  flights,
  allFlights,
  loading,
  statusMessage,
  onEditSearch,
}: ResultsPanelProps) {
  const { t } = useI18n();
  const window =
    activeTab === "outbound" ? form.outboundWindow : form.returnWindow;
  const windowLabel = t(window);
  const returnLabel = t(form.returnWindow).toLowerCase();
  const bagLabel =
    form.baggage === "none"
      ? t("noCheckedBag")
      : `${form.baggage}kg ${t("checkedBag")}`;
  const airlineOptions = getUniqueAirlines(allFlights);
  const selectedAirlines = form.airlines;
  const airlineSummary =
    selectedAirlines.length > 0
      ? `${selectedAirlines.length} ${t("selected")}`
      : t("allAirlines");
  const pricedFlights = flights.filter((flight) =>
    Number.isFinite(flight.price),
  );

  // Summary metrics
  const bestPrice = pricedFlights.length
    ? formatMoney(
        pricedFlights.reduce((a, b) => (b.price < a.price ? b : a)).price,
      )
    : "—";
  const fastestTime = flights.length
    ? formatDuration(
        flights.reduce((a, b) =>
          b.durationMinutes < a.durationMinutes ? b : a,
        ).durationMinutes,
      )
    : "—";
  const reqBag = getRequiredBagKg(form.baggage);
  const bagCount = flights.filter(
    (f) => reqBag === 0 || f.bagKg >= reqBag,
  ).length;

  // Determine "Best Choice" — lowest score wins (weighted: price 40%, duration 30%, baggage match 30%)
  const bestChoiceId = (() => {
    if (flights.length === 0) return "";
    const maxPrice = Math.max(...pricedFlights.map((f) => f.price), 0);
    const maxDuration = Math.max(...flights.map((f) => f.durationMinutes || 0));
    let bestId = flights[0].id;
    let bestScore = Infinity;
    for (const f of flights) {
      const priceScore =
        maxPrice > 0 && Number.isFinite(f.price) ? f.price / maxPrice : 1;
      const durationScore =
        maxDuration > 0 ? (f.durationMinutes || maxDuration) / maxDuration : 0;
      const bagScore = reqBag === 0 || f.bagKg >= reqBag ? 0 : 1;
      const score = priceScore * 0.4 + durationScore * 0.3 + bagScore * 0.3;
      if (score < bestScore) {
        bestScore = score;
        bestId = f.id;
      }
    }
    return bestId;
  })();

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card/95 shadow-lg backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col gap-2 p-3 pb-0 sm:gap-3 sm:p-5 sm:pb-0 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            {form.origin.toUpperCase()} {t("toLabel")}{" "}
            {form.destination.toUpperCase()}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">
            {windowLabel} {t("outboundLabel")}, {returnLabel} {t("returnLabel")}
            , {bagLabel}
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {onEditSearch && (
            <button
              type="button"
              onClick={onEditSearch}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs font-bold text-primary transition-all hover:border-primary active:scale-[0.97] sm:h-11 sm:px-3 sm:text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("editSearch")}
            </button>
          )}
          <div className="inline-flex h-9 max-w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-xs font-bold text-muted-foreground sm:h-11 sm:px-3">
            <span className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">{statusMessage}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border px-3 py-3 sm:px-5 sm:pb-4 sm:pt-4">
        {(["outbound", "return"] as TripDirection[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "h-9 flex-1 rounded-lg border px-3 text-xs font-bold transition-all duration-160 sm:h-11 sm:flex-none sm:px-3.5 sm:text-sm",
              activeTab === tab
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50",
            )}
          >
            {tab === "outbound" ? t("outboundTab") : t("returnTab")}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-2 border-b border-border bg-muted/30 px-3 py-3 sm:gap-3 sm:px-5 sm:py-4">
        <div>
          <strong className="text-sm font-bold text-foreground sm:text-base">
            {bestPrice}
          </strong>
          <span className="mt-0.5 block text-[10px] font-bold uppercase leading-tight text-muted-foreground sm:text-xs">
            {t("lowestFare")}
          </span>
        </div>
        <div>
          <strong className="text-sm font-bold text-foreground sm:text-base">
            {fastestTime}
          </strong>
          <span className="mt-0.5 block text-[10px] font-bold uppercase leading-tight text-muted-foreground sm:text-xs">
            {t("fastestOption")}
          </span>
        </div>
        <div>
          <strong className="text-sm font-bold text-foreground sm:text-base">
            {bagCount} {t("withBags")}
          </strong>
          <span className="mt-0.5 block text-[10px] font-bold uppercase leading-tight text-muted-foreground sm:text-xs">
            {t("baggageMatches")}
          </span>
        </div>
      </div>

      {/* Filter & Sort bar */}
      <div className="grid grid-cols-1 gap-2 border-b border-border px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-5 sm:py-3">
        <select
          value={form.sortBy}
          onChange={(e) => updateForm({ sortBy: e.target.value as any })}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 sm:order-2 sm:h-11 sm:w-auto"
        >
          <option value="price_asc">Price ↑ Lowest</option>
          <option value="price_desc">Price ↓ Highest</option>
          <option value="time_asc">Duration Fastest</option>
          <option value="dep_asc">Departure Earliest</option>
          <option value="dep_desc">Departure Latest</option>
        </select>
        <details className="group min-w-0 sm:order-1">
          <summary
            className="h-10 w-full list-none rounded-lg border border-border bg-background text-left text-sm font-bold text-foreground transition-all hover:border-primary/60 sm:h-11 [&::-webkit-details-marker]:hidden"
            aria-label={t("airlines")}
          >
            <span className="flex h-full items-center justify-between gap-3 px-3">
              <span className="min-w-0">
                <span className="block text-xs uppercase text-muted-foreground">
                  {t("airlines")}
                </span>
                <span className="block truncate">{airlineSummary}</span>
              </span>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-primary transition-transform duration-160 group-open:rotate-180" />
            </span>
          </summary>
          <fieldset
            className="mt-2 grid min-w-0 grid-cols-2 gap-2"
            aria-label={t("airlines")}
          >
            <legend className="sr-only">{t("airlines")}</legend>
            <label
              className={cn(
                "col-span-2 inline-flex h-11 max-w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-all hover:border-primary/60",
                selectedAirlines.length === 0 &&
                  "border-primary bg-primary/10 text-primary",
              )}
            >
              <Checkbox
                checked={selectedAirlines.length === 0}
                onCheckedChange={() => updateForm({ airlines: [] })}
                aria-label={t("allAirlines")}
              />
              <span className="truncate">{t("allAirlines")}</span>
            </label>

            {airlineOptions.map((airline) => {
              const checked = selectedAirlines.includes(airline);
              return (
                <label
                  key={airline}
                  className={cn(
                    "inline-flex h-11 max-w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-all hover:border-primary/60",
                    checked && "border-primary bg-primary/10 text-primary",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      updateForm({
                        airlines: isChecked
                          ? [...selectedAirlines, airline]
                          : selectedAirlines.filter((item) => item !== airline),
                      });
                    }}
                    aria-label={airline}
                  />
                  <span className="truncate">{airline}</span>
                </label>
              );
            })}
          </fieldset>
        </details>
      </div>

      {/* Results list */}
      <div className="space-y-3 p-4 sm:p-5" aria-live="polite">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : flights.length > 0 ? (
          flights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={{ ...flight, isBestChoice: flight.id === bestChoiceId }}
              baggage={form.baggage}
              form={form}
            />
          ))
        ) : (
          <div className="grid min-h-[260px] place-items-center gap-2.5 p-7 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-bold text-foreground">
              {t("noFlightsTitle")}
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("noFlightsDesc")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
