import type { Flight, SearchFormState } from "@/types/flight";
import { inferBag, normaliseTime, parseDuration, stopLabel } from "./formatters";
import { MOCK_OUTBOUND, MOCK_RETURN } from "./mockData";

interface FlightResults {
  outbound: Flight[];
  return: Flight[];
}

interface RapidFlightResults extends FlightResults {
  requestCount: number;
}

interface FetchFlightsResult {
  flights: FlightResults;
  message: string;
  requestCount?: number;
}

const RAPID_HOST = "google-flights2.p.rapidapi.com";
const USE_RAPID_PROXY = import.meta.env.VITE_USE_RAPIDAPI_PROXY === "true";
const MAX_RAPID_PRICE_CHECKS = 4;

const PRICE_KEYS = [
  "price",
  "raw_price",
  "extracted_price",
  "total_price",
  "price_total",
  "priceTotal",
  "totalPrice",
  "fare",
  "fare_price",
  "farePrice",
  "amount",
  "value",
  "raw",
  "formatted",
  "display",
  "text",
];

const PRICE_CONTAINER_KEYS = [
  "booking_options",
  "bookingOptions",
  "bookingOptionsList",
  "fares",
  "fare",
  "price",
  "prices",
  "pricing",
  "purchase_links",
  "purchaseLinks",
];

function isPriceKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[_\s-]/g, "");
  return (
    normalized.includes("price") ||
    normalized.includes("fare") ||
    normalized.includes("cost") ||
    normalized.includes("amount") ||
    normalized === "raw" ||
    normalized === "value" ||
    normalized === "formatted"
  );
}

function hasCurrencyMarker(value: string): boolean {
  return /(?:HK\$|HKD|US\$|USD|S\$|SGD|NT\$|TWD|CNY|RMB|JPY|¥|円|KRW|₩|\$|€|£)/i.test(
    value,
  );
}

function parseMoneyString(value: string, requireCurrency: boolean): number {
  const text = value.replace(/\u00a0/g, " ").trim();
  if (!text || (requireCurrency && !hasCurrencyMarker(text))) return NaN;

  const matches = text.match(/\d[\d,]*(?:\.\d+)?/g);
  if (!matches?.length) return NaN;

  const parsed = matches
    .map((match) => Number(match.replace(/,/g, "")))
    .filter((number) => Number.isFinite(number) && number > 0);

  return parsed.length ? parsed[0] : NaN;
}

function getCaseInsensitiveValue(record: Record<string, unknown>, key: string) {
  const foundKey = Object.keys(record).find(
    (candidate) => candidate.toLowerCase() === key.toLowerCase(),
  );
  return foundKey ? record[foundKey] : undefined;
}

function firstFinitePrice(values: number[]): number {
  const finite = values.filter((value) => Number.isFinite(value) && value > 0);
  return finite.length ? Math.min(...finite) : NaN;
}

export function parseFlightPrice(
  value: unknown,
  contextKey = "",
  depth = 0,
): number {
  if (depth > 5 || value == null) return NaN;

  const inPriceContext = isPriceKey(contextKey);

  if (typeof value === "number") {
    return inPriceContext && Number.isFinite(value) && value > 0 ? value : NaN;
  }

  if (typeof value === "string") {
    return parseMoneyString(value, !inPriceContext);
  }

  if (Array.isArray(value)) {
    return firstFinitePrice(
      value.map((item) => parseFlightPrice(item, contextKey, depth + 1)),
    );
  }

  if (typeof value !== "object") return NaN;

  const record = value as Record<string, unknown>;

  for (const key of PRICE_KEYS) {
    const candidate = getCaseInsensitiveValue(record, key);
    const parsed = parseFlightPrice(candidate, key, depth + 1);
    if (Number.isFinite(parsed)) return parsed;
  }

  const contextualPrices = Object.entries(record)
    .filter(([key]) => isPriceKey(key))
    .map(([key, candidate]) => parseFlightPrice(candidate, key, depth + 1));
  const contextualPrice = firstFinitePrice(contextualPrices);
  if (Number.isFinite(contextualPrice)) return contextualPrice;

  const currencyTextPrices = Object.entries(record)
    .filter(([, candidate]) => typeof candidate === "string")
    .map(([key, candidate]) => parseFlightPrice(candidate, key, depth + 1));
  const currencyTextPrice = firstFinitePrice(currencyTextPrices);
  if (Number.isFinite(currencyTextPrice)) return currencyTextPrice;

  const nestedPrices = PRICE_CONTAINER_KEYS.map((key) =>
    parseFlightPrice(getCaseInsensitiveValue(record, key), key, depth + 1),
  );
  return firstFinitePrice(nestedPrices);
}

// ─── RapidAPI Response Mapper ───────────────────────────────────────────────────

function extractRapidFlights(data: any) {
  const itineraries = data?.data?.itineraries || data?.data || {};
  const topFlights =
    itineraries.topFlights ||
    itineraries.best_flights ||
    data?.data?.topFlights ||
    [];
  const otherFlights =
    itineraries.otherFlights ||
    itineraries.other_flights ||
    data?.data?.otherFlights ||
    [];

  return {
    itineraries,
    allFlights: [...topFlights, ...otherFlights],
  };
}

function hourOfRapidItem(item: any): number {
  const first = item?.flights?.[0] || {};
  const rawTime = first.departure_airport?.time || item?.departure_time || "";
  const normalized = normaliseTime(rawTime);
  const [hour] = normalized.split(":").map(Number);
  return Number.isFinite(hour) ? hour : 0;
}

function rapidItemMatchesCurrentFilters(
  item: any,
  form: SearchFormState,
): boolean {
  const segments = item?.flights || [];
  const first = segments[0] || {};
  const stops = Math.max(segments.length - 1, 0);
  const windowStart =
    form.outboundWindow === "morning"
      ? 6
      : form.outboundWindow === "afternoon"
        ? 12
        : 18;
  const windowEnd =
    form.outboundWindow === "morning"
      ? 12
      : form.outboundWindow === "afternoon"
        ? 18
        : 24;
  const departHour = hourOfRapidItem(item);
  const matchesTimeWindow =
    form.outboundWindow === "any" ||
    (departHour >= windowStart && departHour < windowEnd);
  const airline = first.airline || "";
  const bagKg = inferBag(airline);
  const requiredBagKg = form.baggage === "none" ? 0 : Number(form.baggage);

  return (
    matchesTimeWindow &&
    (form.maxStops === "any" || stops <= Number(form.maxStops)) &&
    (form.baggage === "none" || bagKg >= requiredBagKg || bagKg === 0) &&
    (form.airlines.length === 0 || form.airlines.includes(airline))
  );
}

function getRapidSelectionToken(item: any): string {
  return item?.next_token || item?.nextToken || item?.booking_token || "";
}

async function fetchRapidNextFlightsPrice(
  nextToken: string,
  apiKey: string,
): Promise<number> {
  const params = new URLSearchParams({
    next_token: nextToken,
    currency: "HKD",
    language_code: "en-US",
    country_code: "US",
  });

  const res = await fetchRapidEndpoint("getNextFlights", params, apiKey);

  if (!res.ok) return NaN;

  const data = await res.json();
  const { allFlights } = extractRapidFlights(data);
  const flightPrices = allFlights.map((item) => parseFlightPrice(item));
  const flightPrice = firstFinitePrice(flightPrices);
  if (Number.isFinite(flightPrice)) return flightPrice;

  const bookingContainers = [
    data?.data?.booking_options,
    data?.data?.bookingOptions,
    data?.data?.bookingDetails,
    data?.data?.booking_details,
    data?.data?.prices,
  ];
  return firstFinitePrice(
    bookingContainers.map((value) => parseFlightPrice(value)),
  );
}

async function resolveMissingRapidPrices(
  flights: any[],
  form: SearchFormState,
  apiKey: string,
): Promise<{ prices: Map<string, number>; requestCount: number }> {
  const visibleFlights = flights.filter((item) =>
    rapidItemMatchesCurrentFilters(item, form),
  );
  const alreadyHasVisiblePrices = visibleFlights.some((item) =>
    Number.isFinite(parseFlightPrice(item)),
  );

  if (alreadyHasVisiblePrices) {
    return { prices: new Map(), requestCount: 0 };
  }

  const candidates = visibleFlights
    .filter((item) => !Number.isFinite(parseFlightPrice(item)))
    .map((item) => ({ item, token: getRapidSelectionToken(item) }))
    .filter(({ token }) => token)
    .slice(0, MAX_RAPID_PRICE_CHECKS);

  if (candidates.length === 0) {
    return { prices: new Map(), requestCount: 0 };
  }

  const resolved = await Promise.all(
    candidates.map(async ({ token }) => ({
      token,
      price: await fetchRapidNextFlightsPrice(token, apiKey).catch(() => NaN),
    })),
  );
  const prices = new Map<string, number>();
  for (const { token, price } of resolved) {
    if (Number.isFinite(price)) prices.set(token, price);
  }

  return { prices, requestCount: candidates.length };
}

function mapRapidFlights(
  flights: any[],
  direction: string,
  form: SearchFormState,
  priceOverrides = new Map<string, number>(),
): Flight[] {
  if (!Array.isArray(flights)) return [];
  return flights.map((item: any, i: number) => {
    // Each itinerary has a `flights` array of leg segments
    const segments = item.flights || [];
    const first = segments[0] || {};
    const last = segments.at(-1) || first;
    const stops = Math.max(segments.length - 1, 0);

    const airline = first.airline || "Airline";
    // flight_number can be "BR 852" format
    const flightNumber = first.flight_number || first.flightNumber || "";

    // Departure / arrival times — format is "2026-5-21 11:05"
    const departTime = first.departure_airport?.time || first.departureTime || "";
    const arriveTime = last.arrival_airport?.time || last.arrivalTime || "";

    // Airport code field is `airport_code` (not `id`)
    const fromCode = first.departure_airport?.airport_code || first.departure_airport?.id || form.origin.toUpperCase();
    const toCode = last.arrival_airport?.airport_code || last.arrival_airport?.id || form.destination.toUpperCase();

    // Duration can be { raw: 375, text: "6 hr 15 min" } or a number
    const rawDuration = item.duration?.raw ?? item.total_duration ?? parseDuration(item.duration?.text || item.duration);

    const parsedPrice = parseFlightPrice(item);
    const token = getRapidSelectionToken(item);
    const price = Number.isFinite(parsedPrice)
      ? parsedPrice
      : priceOverrides.get(token) ?? NaN;

    // Airline logo from API response
    const airlineLogo = first.airline_logo || "";

    return {
      id: `rapid-${direction}-${i}`,
      airline,
      airlineLogo,
      flightNumber,
      from: fromCode,
      to: toCode,
      depart: normaliseTime(departTime),
      arrive: normaliseTime(arriveTime),
      durationMinutes: rawDuration,
      stops,
      stopLabel: stopLabel(stops),
      price,
      bagKg: inferBag(airline),
    };
  });
}

// ─── SerpApi Response Mapper ────────────────────────────────────────────────────

function mapSerpFlights(data: any, direction: string, form: SearchFormState): Flight[] {
  return [...(data.best_flights || []), ...(data.other_flights || [])].map(
    (item: any, i: number) => {
      const first = item.flights?.[0] || {};
      const last = item.flights?.at(-1) || first;
      const stops = Math.max((item.flights?.length || 1) - 1, 0);
      return {
        id: `serp-${direction}-${i}`,
        airline: first.airline || "Airline",
        flightNumber: first.flight_number || "Flight",
        from: first.departure_airport?.id || form.origin.toUpperCase(),
        to: last.arrival_airport?.id || form.destination.toUpperCase(),
        depart: normaliseTime(first.departure_airport?.time),
        arrive: normaliseTime(last.arrival_airport?.time),
        durationMinutes: item.total_duration || parseDuration(first.duration),
        stops,
        stopLabel: stopLabel(stops),
        price: parseFlightPrice(item),
        bagKg: inferBag(first.airline),
      };
    }
  );
}

// ─── RapidAPI Fetcher (google-flights2.p.rapidapi.com) ──────────────────────────

async function fetchRapidEndpoint(
  endpoint: "searchFlights" | "getNextFlights",
  params: URLSearchParams,
  apiKey: string,
) {
  if (USE_RAPID_PROXY) {
    return fetch("/api/rapidapi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FlightQ-Pin": apiKey.trim(),
      },
      body: JSON.stringify({
        endpoint,
        params: Object.fromEntries(params),
      }),
    });
  }

  return fetch(`https://${RAPID_HOST}/api/v1/${endpoint}?${params}`, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": RAPID_HOST,
      "Content-Type": "application/json",
    },
  });
}

export async function fetchRapidApi(
  form: SearchFormState,
  apiKey: string,
): Promise<RapidFlightResults> {
  // Map cabin to API format
  const cabinMap: Record<string, string> = {
    economy: "ECONOMY",
    business: "BUSINESS",
    first: "FIRST",
  };

  const params = new URLSearchParams({
    departure_id: form.origin.toUpperCase(),
    arrival_id: form.destination.toUpperCase(),
    outbound_date: form.outboundDate,
    return_date: form.returnDate,
    travel_class: cabinMap[form.cabin] || "ECONOMY",
    adults: String(form.passengers),
    show_hidden: "1",
    currency: "HKD",
    language_code: "en-US",
    country_code: "US",
    search_type: "best",
  });

  const res = await fetchRapidEndpoint("searchFlights", params, apiKey);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error(
        USE_RAPID_PROXY
          ? "Invalid FlightQ access PIN"
          : `RapidAPI: Invalid or expired API key (${res.status}). Make sure you've subscribed to the "Google Flights" API by DataCrawler.`,
      );
    }
    if (res.status === 403) {
      throw new Error(`RapidAPI: Invalid or expired API key (${res.status}). Make sure you've subscribed to the "Google Flights" API by DataCrawler.`);
    }
    if (res.status === 429) {
      throw new Error("RapidAPI: Rate limit exceeded. Free tier is 150 req/month.");
    }
    throw new Error(`RapidAPI error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log("[FlightQ] RapidAPI raw response:", JSON.stringify(data).slice(0, 800));

  // Check for API-level errors
  if (data.status === false || data.error) {
    throw new Error(`RapidAPI: ${data.message || data.error || "Unknown API error"}`);
  }

  // Real response structure: { status, data: { itineraries: { topFlights: [...], otherFlights: [...] } } }
  const { itineraries, allFlights } = extractRapidFlights(data);

  console.log("[FlightQ] Parsed flights count:", allFlights.length, "keys in data.data:", Object.keys(data.data || {}));

  if (allFlights.length === 0) {
    // Log what we actually got to help debug
    console.warn("[FlightQ] No flights extracted. data.data keys:", Object.keys(data.data || {}), "itineraries keys:", Object.keys(itineraries));
    throw new Error("RapidAPI: No flights found for this route/date. Try different dates.");
  }

  const priceResolution = await resolveMissingRapidPrices(
    allFlights,
    form,
    apiKey,
  );
  const outbound = mapRapidFlights(
    allFlights,
    "outbound",
    form,
    priceResolution.prices,
  );

  // For return flights, check if there's a separate return section
  const returnItineraries = data.data?.returnItineraries || itineraries.returnFlights || {};
  const returnTop = returnItineraries.topFlights || returnItineraries.best_flights || [];
  const returnOther = returnItineraries.otherFlights || returnItineraries.other_flights || [];
  const allReturn = [...returnTop, ...returnOther];

  const returnFlights = allReturn.length > 0
    ? mapRapidFlights(allReturn, "return", form)
    : outbound.map((f, i) => ({
        ...f,
        id: `rapid-return-${i}`,
        from: f.to,
        to: f.from,
      }));

  return { outbound, return: returnFlights, requestCount: 1 + priceResolution.requestCount };
}

// ─── SerpApi Fetcher ────────────────────────────────────────────────────────────

export async function fetchSerpApi(form: SearchFormState, apiKey: string): Promise<FlightResults> {
  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: form.origin.toUpperCase(),
    arrival_id: form.destination.toUpperCase(),
    outbound_date: form.outboundDate,
    return_date: form.returnDate,
    type: "1",
    currency: "HKD",
    hl: "en",
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error("SerpApi: Invalid API key");
    }
    if (res.status === 429) {
      throw new Error("SerpApi: Rate limit exceeded. Free tier is 100 req/month.");
    }
    throw new Error(`SerpApi error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log("[FlightQ] SerpApi raw response:", JSON.stringify(data).slice(0, 800));

  if (data.error) {
    throw new Error(`SerpApi: ${data.error}`);
  }

  const mapped = mapSerpFlights(data, "outbound", form);
  if (!mapped.length) throw new Error("SerpApi: No flights found for this route/date.");

  return {
    outbound: mapped,
    return: mapped.map((f, i) => ({ ...f, id: `serp-return-${i}`, from: f.to, to: f.from })),
  };
}

// ─── Main Dispatcher ────────────────────────────────────────────────────────────

export async function fetchFlights(
  form: SearchFormState,
  provider: string,
  apiKey: string
): Promise<FetchFlightsResult> {
  // Demo mode — no API call needed
  if (provider === "demo") {
    return {
      flights: { outbound: [...MOCK_OUTBOUND], return: [...MOCK_RETURN] },
      message: "Demo Mode",
    };
  }

  if (!apiKey.trim() && !(provider === "rapidapi" && USE_RAPID_PROXY)) {
    return {
      flights: { outbound: [], return: [] },
      message: "API key required — paste your key in Settings",
    };
  }

  try {
    if (provider === "rapidapi") {
      const flights = await fetchRapidApi(form, apiKey.trim());
      const fareChecks = Math.max(flights.requestCount - 1, 0);
      return {
        flights,
        message: `RapidAPI: ${flights.outbound.length} outbound, ${flights.return.length} return flights${
          fareChecks ? `, ${fareChecks} fare checks` : ""
        }`,
        requestCount: flights.requestCount,
      };
    }
    if (provider === "serpapi") {
      const flights = await fetchSerpApi(form, apiKey.trim());
      return {
        flights,
        message: `SerpApi: ${flights.outbound.length} outbound flights`,
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Unknown error";
    console.error("[FlightQ] API Error:", errorMsg);

    // Check if it's a CORS / network error
    if (errorMsg === "Failed to fetch" || errorMsg.includes("NetworkError")) {
      return {
        flights: { outbound: [...MOCK_OUTBOUND], return: [...MOCK_RETURN] },
        message: `CORS blocked — ${provider} may not allow browser-side requests. Try a backend proxy or use SerpApi.`,
      };
    }

    return {
      flights: { outbound: [...MOCK_OUTBOUND], return: [...MOCK_RETURN] },
      message: `Error: ${errorMsg}`,
    };
  }

  return {
    flights: { outbound: [...MOCK_OUTBOUND], return: [...MOCK_RETURN] },
    message: "Demo Mode",
  };
}
