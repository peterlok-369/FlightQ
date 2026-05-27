import type { Flight, TimeWindow, TimeWindowConfig } from "@/types/flight";

export const TIME_WINDOWS: Record<TimeWindow, TimeWindowConfig> = {
  any: { label: "Any", start: 0, end: 24 },
  morning: { label: "Morning", start: 6, end: 12 },
  afternoon: { label: "Afternoon", start: 12, end: 18 },
  evening: { label: "Evening", start: 18, end: 24 },
};

function hourOf(time: string): number {
  const [h] = String(time).split(":").map(Number);
  return Number.isFinite(h) ? h : 0;
}

export function inTimeWindow(flight: Flight, window: TimeWindow): boolean {
  if (window === "any") return true;
  const w = TIME_WINDOWS[window];
  const h = hourOf(flight.depart);
  return h >= w.start && h < w.end;
}

export function inStopLimit(flight: Flight, maxStops: string): boolean {
  if (maxStops === "any") return true;
  return flight.stops <= Number(maxStops);
}

export function hasBaggage(flight: Flight, requiredKg: number): boolean {
  if (requiredKg === 0) return true;
  return flight.bagKg >= requiredKg;
}

export function getRequiredBagKg(baggage: string): number {
  return baggage === "none" ? 0 : Number(baggage);
}

export type SortBy =
  | "price_asc"
  | "price_desc"
  | "time_asc"
  | "dep_asc"
  | "dep_desc";

function comparePrice(a: number, b: number, direction: "asc" | "desc") {
  const aHasPrice = Number.isFinite(a);
  const bHasPrice = Number.isFinite(b);

  if (aHasPrice && bHasPrice) {
    return direction === "asc" ? a - b : b - a;
  }

  if (aHasPrice) return -1;
  if (bHasPrice) return 1;
  return 0;
}

export function sortFlights(flights: Flight[], sortBy: SortBy): Flight[] {
  return [...flights].sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return comparePrice(a.price, b.price, "asc");
      case "price_desc":
        return comparePrice(a.price, b.price, "desc");
      case "time_asc":
        return a.durationMinutes - b.durationMinutes;
      case "dep_asc":
        return a.depart.localeCompare(b.depart);
      case "dep_desc":
        return b.depart.localeCompare(a.depart);
      default:
        return comparePrice(a.price, b.price, "asc");
    }
  });
}

export function getUniqueAirlines(flights: Flight[]): string[] {
  return Array.from(
    new Set(flights.map((f) => f.airline).filter(Boolean)),
  ).sort();
}

export function filterFlights(
  flights: Flight[],
  window: TimeWindow,
  maxStops: string,
  baggage: string,
  airlines: string[] = [],
  sortBy: SortBy = "price_asc",
): Flight[] {
  const reqBag = getRequiredBagKg(baggage);
  const selectedAirlines = new Set(airlines);
  const filtered = flights
    .filter((f) => inTimeWindow(f, window))
    .filter((f) => inStopLimit(f, maxStops))
    .filter((f) => baggage === "none" || f.bagKg >= reqBag || f.bagKg === 0)
    .filter(
      (f) => selectedAirlines.size === 0 || selectedAirlines.has(f.airline),
    );
  return sortFlights(filtered, sortBy);
}
