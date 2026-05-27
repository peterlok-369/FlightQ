import { ChevronDown } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import type { TimeWindow } from "@/types/flight";

interface SegmentedControlProps {
  label: string;
  value: TimeWindow;
  onChange: (value: TimeWindow) => void;
}

export function SegmentedControl({ label, value, onChange }: SegmentedControlProps) {
  const { t } = useI18n();

  const OPTIONS: { value: TimeWindow; label: string }[] = [
    { value: "any", label: t("any") },
    { value: "morning", label: t("morning") },
    { value: "afternoon", label: t("afternoon") },
    { value: "evening", label: t("evening") },
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as TimeWindow)}
          className="h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-10 text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          aria-label={label}
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
