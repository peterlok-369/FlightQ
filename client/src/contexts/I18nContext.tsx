import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "en" | "zh-HK";

const translations = {
  en: {
    // Topbar
    appTitle: "FlightQ",
    appSubtitle: "HKG to FUK fare finder with baggage-first filters",
    searchTab: "Search",
    resultsTab: "Results",
    editSearch: "Edit search",
    // Search panel
    search: "Search",
    searchDesc: "Round-trip defaults start with unrestricted departure windows.",
    from: "FROM",
    to: "TO",
    outbound: "OUTBOUND",
    return: "RETURN",
    passengers: "PASSENGERS",
    cabin: "CABIN",
    checkedBaggage: "CHECKED BAGGAGE",
    maxStops: "MAX STOPS",
    outboundTime: "OUTBOUND TIME",
    returnTime: "RETURN TIME",
    searchFares: "Search fares",
    reset: "Reset",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    economy: "Economy",
    business: "Business",
    any: "Any",
    nonStop: "Non-stop",
    oneStop: "1 stop",
    adult: "adult",
    adults: "adults",
    // Results
    outboundTab: "Outbound",
    returnTab: "Return",
    lowestFare: "Lowest fare",
    fastestOption: "Fastest option",
    baggageMatches: "Baggage matches",
    withBags: "with bags",
    airlines: "Airlines",
    allAirlines: "All Airlines",
    selected: "selected",
    perAdult: "per adult",
    noFlightsTitle: "No flights match these filters",
    noFlightsDesc: "Try a wider departure window, allow one stop, or switch baggage to none to compare low-cost fares.",
    bestChoice: "Best Choice",
    select: "Select",
    included: "included",
    noBag: "No bag",
    demoMode: "Demo Mode",
    searching: "Searching...",
    // Settings
    settings: "Settings",
    settingsDescription: "Manage appearance and flight data providers.",
    appearance: "Appearance",
    darkMode: "Dark mode",
    apiProvider: "API PROVIDER",
    apiKey: "API KEY",
    apiCredential: "ACCESS PIN / API KEY",
    apiUsage: "API Usage",
    requestsRemaining: "requests remaining this month",
    keysInfo: "Keys and PINs are stored in memory only and never saved.",
    rapidApiInfo: "Sign up at rapidapi.com, subscribe to \"DataCrawler Google Flights API\" (free: 150 req/month). Copy your X-RapidAPI-Key.",
    rapidProxyInfo: "Shared deployments use a server-side proxy. Friends enter only the FlightQ PIN; the RapidAPI key stays on Netlify.",
    serpApiInfo: "Sign up at serpapi.com (free: 100 req/month). Note: SerpApi may block browser-side requests due to CORS — a backend proxy is recommended.",
    apiKeyPlaceholder: "Paste your key here — auto-searches after 800ms",
    apiCredentialPlaceholder: "Enter FlightQ PIN, or local RapidAPI key",
    // Route info
    toLabel: "to",
    outboundLabel: "outbound",
    returnLabel: "return",
    checkedBag: "checked bag",
    noCheckedBag: "no checked bag",
  },
  "zh-HK": {
    // Topbar
    appTitle: "FlightQ",
    appSubtitle: "HKG 至 FUK 機票搜尋 — 行李優先篩選",
    searchTab: "搵機",
    resultsTab: "結果",
    editSearch: "修改搜尋",
    // Search panel
    search: "搜尋",
    searchDesc: "來回時段預設為不限，方便先睇完整選擇。",
    from: "出發地",
    to: "目的地",
    outbound: "去程日期",
    return: "回程日期",
    passengers: "乘客人數",
    cabin: "艙等",
    checkedBaggage: "寄艙行李",
    maxStops: "最多轉機",
    outboundTime: "去程時間",
    returnTime: "回程時間",
    searchFares: "搜尋票價",
    reset: "重設",
    morning: "早上",
    afternoon: "下午",
    evening: "晚上",
    economy: "經濟艙",
    business: "商務艙",
    any: "不限",
    nonStop: "直飛",
    oneStop: "1次轉機",
    adult: "成人",
    adults: "成人",
    // Results
    outboundTab: "去程",
    returnTab: "回程",
    lowestFare: "最低票價",
    fastestOption: "最快航班",
    baggageMatches: "行李符合",
    withBags: "有行李",
    airlines: "航空公司",
    allAirlines: "所有航空公司",
    selected: "已選",
    perAdult: "每位成人",
    noFlightsTitle: "沒有符合條件的航班",
    noFlightsDesc: "嘗試擴大出發時段、允許轉機一次，或將行李設為「無」以比較廉航票價。",
    bestChoice: "最佳選擇",
    select: "選擇",
    included: "已包含",
    noBag: "無行李",
    demoMode: "示範模式",
    searching: "搜尋中...",
    // Settings
    settings: "設定",
    settingsDescription: "管理外觀與航班資料供應商。",
    appearance: "外觀",
    darkMode: "深色模式",
    apiProvider: "API 供應商",
    apiKey: "API 密鑰",
    apiCredential: "使用 PIN / API 密鑰",
    apiUsage: "API 用量",
    requestsRemaining: "本月剩餘請求次數",
    keysInfo: "密鑰及 PIN 僅儲存於記憶體中，不會被保存。",
    rapidApiInfo: "在 rapidapi.com 註冊，訂閱「DataCrawler Google Flights API」（免費：每月150次）。複製你的 X-RapidAPI-Key。",
    rapidProxyInfo: "分享部署會使用 server-side proxy。朋友只需輸入 FlightQ PIN；RapidAPI key 會留在 Netlify。",
    serpApiInfo: "在 serpapi.com 註冊（免費：每月100次）。注意：SerpApi 可能因 CORS 限制而無法在瀏覽器端使用 — 建議使用後端代理。",
    apiKeyPlaceholder: "在此貼上密鑰 — 800毫秒後自動搜尋",
    apiCredentialPlaceholder: "輸入 FlightQ PIN，或本機 RapidAPI key",
    // Route info
    toLabel: "至",
    outboundLabel: "去程",
    returnLabel: "回程",
    checkedBag: "寄艙行李",
    noCheckedBag: "無寄艙行李",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem("flightq_locale");
    return (stored === "zh-HK" ? "zh-HK" : "en") as Locale;
  });

  const handleSetLocale = useCallback((l: Locale) => {
    setLocale(l);
    localStorage.setItem("flightq_locale", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale][key] || translations.en[key] || key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
