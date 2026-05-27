import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFlights } from "@/lib/api";
import { filterFlights } from "@/lib/filters";
import { isoOffset } from "@/lib/formatters";
import type {
  ApiProvider,
  Flight,
  SearchFormState,
  TimeWindow,
  TripDirection,
} from "@/types/flight";

const DEFAULT_FORM: SearchFormState = {
  origin: "HKG",
  destination: "FUK",
  outboundDate: isoOffset(7),
  returnDate: isoOffset(14),
  passengers: 1,
  cabin: "economy",
  baggage: "20",
  maxStops: "any",
  outboundWindow: "any",
  returnWindow: "any",
  airlines: [],
  sortBy: "price_asc",
};

const SEARCH_RECORD_KEY = "flightq_last_search_record";
const SEARCH_RECORD_VERSION = 2;
const DEFAULT_API_PROVIDER: ApiProvider = "rapidapi";

interface StoredSearchRecord {
  version: typeof SEARCH_RECORD_VERSION;
  form: SearchFormState;
  apiProvider: ApiProvider;
  activeTab: TripDirection;
  flights: {
    outbound: Flight[];
    return: Flight[];
  };
  statusMessage: string;
  savedAt: string;
}

function isApiProvider(value: unknown): value is ApiProvider {
  return value === "demo" || value === "rapidapi" || value === "serpapi";
}

function isTripDirection(value: unknown): value is TripDirection {
  return value === "outbound" || value === "return";
}

function loadStoredSearchRecord(): StoredSearchRecord | null {
  try {
    const stored = localStorage.getItem(SEARCH_RECORD_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<StoredSearchRecord>;
    if (
      parsed.version !== SEARCH_RECORD_VERSION ||
      !parsed.form ||
      !parsed.flights ||
      !Array.isArray(parsed.flights.outbound) ||
      !Array.isArray(parsed.flights.return)
    ) {
      return null;
    }

    if (parsed.apiProvider === "demo") {
      return null;
    }

    return {
      version: SEARCH_RECORD_VERSION,
      form: { ...DEFAULT_FORM, ...parsed.form },
      apiProvider: isApiProvider(parsed.apiProvider)
        ? parsed.apiProvider
        : DEFAULT_API_PROVIDER,
      activeTab: isTripDirection(parsed.activeTab)
        ? parsed.activeTab
        : "outbound",
      flights: parsed.flights,
      statusMessage: parsed.statusMessage || "Restored last search",
      savedAt: parsed.savedAt || "",
    };
  } catch {
    localStorage.removeItem(SEARCH_RECORD_KEY);
    return null;
  }
}

export function useFlightSearch() {
  const [storedSearchRecord] = useState(loadStoredSearchRecord);
  const [form, setForm] = useState<SearchFormState>(
    () => storedSearchRecord?.form ?? DEFAULT_FORM,
  );
  const [apiProvider, setApiProvider] = useState<ApiProvider>(
    () => storedSearchRecord?.apiProvider ?? DEFAULT_API_PROVIDER,
  );
  const [apiKey, setApiKey] = useState(
    () => import.meta.env.VITE_RAPIDAPI_KEY || "",
  );
  useEffect(() => {
    localStorage.removeItem("flightq_api_key");
  }, []);
  const [activeTab, setActiveTab] = useState<TripDirection>(
    () => storedSearchRecord?.activeTab ?? "outbound",
  );
  const [flights, setFlights] = useState<{
    outbound: Flight[];
    return: Flight[];
  }>(
    () =>
      storedSearchRecord?.flights ?? {
        outbound: [],
        return: [],
      },
  );
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    () => storedSearchRecord?.statusMessage ?? "Ready for API search",
  );
  const [apiCallCount, setApiCallCount] = useState(() => {
    const stored = localStorage.getItem("flightq_api_calls");
    if (stored) {
      const { count, month } = JSON.parse(stored);
      // Reset if it's a new month
      if (month === new Date().toISOString().slice(0, 7)) return count;
    }
    return 0;
  });

  const incrementApiCount = useCallback((amount = 1) => {
    setApiCallCount((prev: number) => {
      const next = prev + amount;
      localStorage.setItem(
        "flightq_api_calls",
        JSON.stringify({
          count: next,
          month: new Date().toISOString().slice(0, 7),
        }),
      );
      return next;
    });
  }, []);

  // Track if initial provider/key changes should trigger a search.
  const didMount = useRef(false);

  const updateForm = useCallback((updates: Partial<SearchFormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const swapRoute = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      origin: prev.destination.toUpperCase(),
      destination: prev.origin.toUpperCase(),
    }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM);
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    setStatusMessage("Searching...");
    // Small delay for skeleton UX
    await new Promise((r) => setTimeout(r, 400));
    const { flights: result, message, requestCount } = await fetchFlights(
      form,
      apiProvider,
      apiKey,
    );
    // Track API usage (only for real API calls, not demo)
    if (apiProvider !== "demo" && apiKey) {
      incrementApiCount(requestCount ?? 1);
    }
    setFlights(result);
    setStatusMessage(message);
    setLoading(false);
  }, [form, apiProvider, apiKey, incrementApiCount]);

  // Get filtered flights for the active tab
  const filteredFlights = filterFlights(
    flights[activeTab],
    activeTab === "outbound" ? form.outboundWindow : form.returnWindow,
    form.maxStops,
    form.baggage,
    form.airlines,
    form.sortBy,
  );

  // Run initial search only when there is no saved record to restore.
  useEffect(() => {
    if (!storedSearchRecord) {
      search();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-search when API provider or key changes (after initial mount)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    // Debounce key input — wait 800ms after last keystroke
    const timer = setTimeout(() => {
      search();
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiProvider, apiKey]);

  useEffect(() => {
    const record: StoredSearchRecord = {
      version: SEARCH_RECORD_VERSION,
      form,
      apiProvider,
      activeTab,
      flights,
      statusMessage,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(SEARCH_RECORD_KEY, JSON.stringify(record));
  }, [activeTab, apiProvider, flights, form, statusMessage]);

  return {
    form,
    updateForm,
    swapRoute,
    resetForm,
    apiProvider,
    setApiProvider,
    apiKey,
    setApiKey,
    activeTab,
    setActiveTab,
    flights: filteredFlights,
    allFlights: flights,
    loading,
    statusMessage,
    apiCallCount,
    search,
  };
}
