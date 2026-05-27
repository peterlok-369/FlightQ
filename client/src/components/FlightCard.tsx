import { cn } from "@/lib/utils";
import { formatDuration, formatMoney, getInitials } from "@/lib/formatters";
import { getRequiredBagKg } from "@/lib/filters";
import type { Flight, SearchFormState } from "@/types/flight";
import { type MouseEvent, useState } from "react";

interface FlightCardProps {
  flight: Flight;
  baggage: string;
  form?: SearchFormState;
}

/**
 * Derive airline logo URL from airline name or IATA code.
 * Google Flights uses gstatic.com/flights/airline_logos/70px/{CODE}.png
 * We also accept a direct URL from the API response.
 */
function getAirlineLogoUrl(flight: Flight): string {
  if (flight.airlineLogo) return flight.airlineLogo;

  // Map common airline names to IATA codes for logo lookup
  const airlineCodeMap: Record<string, string> = {
    "cathay pacific": "CX",
    "hk express": "UO",
    "japan airlines": "JL",
    "ana": "NH",
    "all nippon airways": "NH",
    "eva air": "BR",
    "china airlines": "CI",
    "peach aviation": "MM",
    "jetstar": "GK",
    "hong kong airlines": "HX",
    "singapore airlines": "SQ",
    "korean air": "KE",
    "asiana airlines": "OZ",
    "united airlines": "UA",
    "delta air lines": "DL",
    "american airlines": "AA",
    "british airways": "BA",
    "qantas": "QF",
    "lufthansa": "LH",
    "air france": "AF",
    "emirates": "EK",
    "qatar airways": "QR",
    "thai airways": "TG",
    "air china": "CA",
    "china eastern": "MU",
    "china southern": "CZ",
    "scoot": "TR",
    "air asia": "AK",
    "cebu pacific": "5J",
    "philippine airlines": "PR",
    "vietnam airlines": "VN",
    "garuda indonesia": "GA",
    "malaysia airlines": "MH",
    "starlux airlines": "JX",
    "tigerair taiwan": "IT",
    "spring airlines": "9C",
  };

  // Try to extract IATA code from flight number (e.g., "CX 564" → "CX")
  const fnMatch = flight.flightNumber.match(/^([A-Z0-9]{2})\s*/);
  if (fnMatch) {
    return `https://www.gstatic.com/flights/airline_logos/70px/${fnMatch[1]}.png`;
  }

  // Try airline name lookup
  const code = airlineCodeMap[flight.airline.toLowerCase()];
  if (code) {
    return `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`;
  }

  return "";
}

export function FlightCard({ flight, baggage, form }: FlightCardProps) {
  const reqBag = getRequiredBagKg(baggage);
  const hasBag = reqBag === 0 || flight.bagKg >= reqBag;
  const bagText = flight.bagKg > 0 ? `${flight.bagKg}kg included` : "No bag";
  const logoUrl = getAirlineLogoUrl(flight);
  const [logoError, setLogoError] = useState(false);
  const updateSpotlight = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--spotlight-x",
      `${event.clientX - rect.left}px`
    );
    event.currentTarget.style.setProperty(
      "--spotlight-y",
      `${event.clientY - rect.top}px`
    );
  };

  return (
    <article
      onMouseMove={updateSpotlight}
      className={cn(
        "flight-card-spotlight group relative grid grid-cols-1 gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md hover:shadow-primary/10 sm:grid-cols-[1.2fr_1.5fr_auto]",
        flight.isBestChoice && "ring-2 ring-primary/50 border-primary/30"
      )}
    >
      {/* Best Choice badge */}
      {flight.isBestChoice && (
        <span className="absolute -top-2.5 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
          ★ Best Choice
        </span>
      )}

      {/* Airline */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-lg bg-primary/10 overflow-hidden">
          {logoUrl && !logoError ? (
            <img
              src={logoUrl}
              alt={flight.airline}
              className="h-9 w-9 object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-sm font-bold text-primary">
              {getInitials(flight.airline)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{flight.airline}</h3>
          <p className="text-sm text-muted-foreground">{flight.flightNumber}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <span className="text-lg font-bold text-foreground">{flight.depart}</span>
          <div className="relative h-0.5 w-full bg-border">
            <span className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-primary bg-card" />
            <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border-2 border-primary bg-card" />
          </div>
          <span className="text-right text-lg font-bold text-foreground">{flight.arrive}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {flight.from} to {flight.to} &middot; {formatDuration(flight.durationMinutes)} &middot;{" "}
          {flight.stopLabel}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
        <div className="sm:text-right">
          <p className="text-base font-bold text-foreground">{formatMoney(flight.price)}</p>
          <p className="text-xs text-muted-foreground">per adult</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap",
            hasBag
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}
        >
          {hasBag ? "✓" : "✗"} {bagText}
        </span>
        <button
          type="button"
          onClick={() => {
            const query = encodeURIComponent(form ? `Flights from ${form.origin} to ${form.destination} on ${form.outboundDate} returning on ${form.returnDate} with ${flight.airline}` : `Flights to ${flight.to} from ${flight.from} with ${flight.airline}`);
            window.open(`https://www.google.com/travel/flights?q=${query}`, "_blank");
          }}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-all duration-160 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 active:scale-[0.97] sm:flex-none"
        >
          Select
        </button>
      </div>
    </article>
  );
}
