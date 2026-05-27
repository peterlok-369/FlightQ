export interface Flight {
  id: string;
  airline: string;
  airlineLogo?: string;
  flightNumber: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  durationMinutes: number;
  stops: number;
  stopLabel: string;
  price: number;
  bagKg: number;
  isBestChoice?: boolean;
}

export type TripDirection = "outbound" | "return";

export type TimeWindow = "any" | "morning" | "afternoon" | "evening";

export interface TimeWindowConfig {
  label: string;
  start: number;
  end: number;
}

export type ApiProvider = "demo" | "rapidapi" | "serpapi";

export interface SearchFormState {
  origin: string;
  destination: string;
  outboundDate: string;
  returnDate: string;
  passengers: number;
  cabin: "economy" | "business";
  baggage: "20" | "23" | "none";
  maxStops: "any" | "0" | "1";
  outboundWindow: TimeWindow;
  returnWindow: TimeWindow;
  airlines: string[];
  sortBy: "price_asc" | "price_desc" | "time_asc" | "dep_asc" | "dep_desc";
}

export interface SearchState {
  form: SearchFormState;
  apiProvider: ApiProvider;
  apiKey: string;
  activeTab: TripDirection;
  flights: { outbound: Flight[]; return: Flight[] };
  loading: boolean;
  statusMessage: string;
}
