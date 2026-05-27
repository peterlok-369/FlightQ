# ✈️ FlightQ — Flight Search WebApp: Prompt & Agent Guide

> **Note (May 2026):** Amadeus Self-Service portal is being **decommissioned on July 17, 2026**. Do NOT use Amadeus.

---

## 📌 Project Overview

Build a **flight search web app** (React + Vite + Tailwind) for **HKG → FUK** (Hong Kong → Fukuoka), with morning outbound, evening return, 20kg checked baggage.

**Architecture**: React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui components, split into modular files for maintainability.

---

## 🏗️ Architecture & File Structure

```
client/src/
├── types/
│   └── flight.ts           ← TypeScript interfaces (Flight, SearchFormState, etc.)
├── lib/
│   ├── api.ts              ← API fetchers (RapidAPI, SerpApi, demo fallback)
│   ├── mockData.ts         ← Demo mode flight data (HKG→FUK, FUK→HKG)
│   ├── filters.ts          ← Time window, stop limit, baggage filter logic
│   ├── formatters.ts       ← Money, duration, time, initials formatters
│   └── utils.ts            ← Tailwind class merge utility (cn)
├── hooks/
│   └── useFlightSearch.ts  ← Central state management hook (form, API, results)
├── components/
│   ├── Topbar.tsx          ← Brand logo + language toggle + Settings drawer trigger
│   ├── SearchPanel.tsx     ← Airport search inputs, dates, filters, segmented controls
│   ├── SettingsPanel.tsx   ← Topbar Settings drawer: appearance + API configuration
│   ├── ResultsPanel.tsx    ← Header, tabs, summary bar, flight list / empty state
│   ├── FlightCard.tsx      ← Individual flight result card with timeline
│   ├── SkeletonCard.tsx    ← Loading placeholder with shimmer animation
│   ├── SegmentedControl.tsx ← Any/Morning/Afternoon/Evening time picker
│   └── ui/                 ← shadcn/ui primitives (button, card, tabs, etc.)
├── contexts/
│   └── ThemeContext.tsx    ← Light/dark theme provider with toggle
├── pages/
│   ├── Home.tsx            ← Main page composing all panels
│   └── NotFound.tsx        ← 404 page
├── App.tsx                 ← Router + ThemeProvider + Toaster
├── main.tsx                ← React entry point
└── index.css               ← Nexus warm palette tokens (OKLCH)
```

### Component Responsibility Table

| Component | Responsibility | Props |
|---|---|---|
| `Topbar` | Brand display + language toggle + Settings drawer entry | Search/API settings props from `useFlightSearch` |
| `SearchPanel` | Airport search, form inputs, filters, submit/reset | `form`, `updateForm`, `swapRoute`, `resetForm`, `onSearch` |
| `SettingsPanel` | Right-side drawer for appearance + API provider/key configuration | `apiProvider`, `setApiProvider`, `apiKey`, `setApiKey`, `statusMessage`, `apiCallCount` |
| `ResultsPanel` | Results header, tabs, summary, flight list | `form`, `activeTab`, `setActiveTab`, `flights`, `loading`, `statusMessage` |
| `FlightCard` | Single flight display with timeline | `flight`, `baggage` |
| `SkeletonCard` | Loading placeholder | None |
| `SegmentedControl` | Time window picker (Any/Morning/Afternoon/Evening) | `label`, `value`, `onChange` |

### State Management

All search state lives in the `useFlightSearch` custom hook, which provides:
- `form` — current search form values
- `updateForm(partial)` — merge partial updates into form
- `swapRoute()` — swap origin/destination
- `resetForm()` — reset to defaults
- `search()` — trigger API call (or demo fallback)
- `flights` — filtered results for the active tab
- `loading` / `statusMessage` — UI state

---

## 🔌 Free API Research Summary (Verified May 2026)

### ✅ WORKING & FREE

#### 1. RapidAPI — DataCrawler Google Flights API ⭐ Best for Dev
- **URL**: https://rapidapi.com → search "DataCrawler Google Flights API"
- **Free tier**: 150 requests/month, **no credit card**
- **Endpoint**: `GET https://google-flights2.p.rapidapi.com/api/v1/searchFlights`

```js
// CORRECT as of May 2026 — GET method with query params
const params = new URLSearchParams({
  departure_id: 'HKG',
  arrival_id: 'FUK',
  outbound_date: '2026-09-10',
  return_date: '2026-09-17',
  travel_class: 'ECONOMY',
  adults: '1',
  show_hidden: '1',
  currency: 'HKD',
  language_code: 'en-US',
  country_code: 'US',
  search_type: 'best'
});
const res = await fetch(`https://google-flights2.p.rapidapi.com/api/v1/searchFlights?${params}`, {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY',
    'X-RapidAPI-Host': 'google-flights2.p.rapidapi.com',
    'Content-Type': 'application/json'
  }
});
// Response: { status: true, data: { topFlights: [...], otherFlights: [...] } }
```

> **IMPORTANT**: The old endpoint `datacrawler-google-flights-api.p.rapidapi.com` returns 404. The correct host is `google-flights2.p.rapidapi.com` with path `/api/v1/searchFlights` and **GET** method (not POST).

> **Fare caveat learned May 20, 2026**: Some valid Google Flights results, especially direct HKG → OKA flights such as Hong Kong Airlines / Hong Kong Express, can return `price: "unavailable"` from the first `searchFlights` call while Google Flights still shows a bookable fare. These items usually include `next_token` (or sometimes `booking_token`). When the currently visible filtered results have no finite prices, call `GET /api/v1/getNextFlights?next_token=...` for a small capped set of candidates and parse the returned itinerary / booking containers for a fare. Count each fallback request against API usage.

#### 2. SerpApi — Google Flights
- **URL**: https://serpapi.com
- **Free tier**: **100 searches/month**, no credit card
- **Endpoint**: `GET https://serpapi.com/search.json`

```js
const params = new URLSearchParams({
  engine: 'google_flights',
  departure_id: 'HKG',
  arrival_id: 'FUK',
  outbound_date: '2026-09-10',
  return_date: '2026-09-17',
  type: '1',
  currency: 'HKD',
  hl: 'en',
  api_key: 'YOUR_SERPAPI_KEY'
});
const res = await fetch(`https://serpapi.com/search.json?${params}`);
```

### ❌ NOT RECOMMENDED
- **Amadeus Self-Service**: Closing July 17, 2026
- **Google QPX Express**: Shut down 2018
- **Official Google Flights API**: Does not exist

---

## 🎯 App Requirements

### Core Features
- Search flights by origin / destination / date(s)
- Airport fields support common city/airport names, Chinese aliases, and IATA codes, then commit the selected IATA code for API requests
- Filter by: checked baggage (20kg / 23kg / none), departure time window, cabin class
- Display flight cards: airline, times, duration, stops, price, baggage badge
- Round-trip mode (outbound + return separate tabs)
- Responsive (mobile 375px + desktop 1280px)
- Light / Dark mode switch inside Settings drawer
- Demo Mode fallback (no API key needed)

### Default Example (Pre-filled on load)

| Field | Value |
|---|---|
| From | HKG (Hong Kong International) |
| To | FUK (Fukuoka) |
| Trip type | Round-trip |
| Outbound filter | **Morning** (06:00–12:00) |
| Return filter | **Evening** (18:00–23:59) |
| Passengers | 1 adult |
| Baggage | 20kg checked bag |
| Cabin | Economy |

> Users can switch either time filter to **Any / 不限** to avoid filtering by departure hour.

---

## 🎨 Design System

### Palette: "Warm Modernism" (Nexus)

| Token | Light | Dark |
|---|---|---|
| Background | Warm beige `oklch(0.97 0.01 80)` | Deep forest `oklch(0.14 0.015 160)` |
| Card | Near-white `oklch(0.995 0.003 80)` | Dark green `oklch(0.17 0.015 160)` |
| Primary | Deep teal `oklch(0.42 0.09 185)` | Luminous cyan `oklch(0.75 0.1 180)` |
| Muted text | `oklch(0.5 0.02 160)` | `oklch(0.65 0.02 160)` |
| Border | `oklch(0.88 0.015 70)` | `oklch(0.3 0.02 160)` |

### Typography
- **Font**: Satoshi (via Fontshare CDN)
- **Weights**: 400 body, 500 labels, 700 headings
- **Labels**: Uppercase, 0.76rem, tracking-wide

### Animations
- Button press: `scale(0.97)` over 160ms
- Card hover: `translateY(-2px)` over 200ms
- Skeleton shimmer: pulse animation
- Panel toggle: CSS transition

---

## 💡 HKG → FUK Route Notes

| Info | Detail |
|---|---|
| IATA codes | HKG (Hong Kong) / FUK (Fukuoka Hakata) |
| Airlines | Cathay Pacific (CX), HK Express (UO), JAL (JL), ANA (NH) |
| Non-stop HKG→FUK | ~4h 45m |
| Non-stop FUK→HKG | ~2h 45m (tailwind) |
| Morning HKG dep. | 07:00–10:30 → arrive FUK before lunch |
| Evening FUK return | 19:00–21:00 → arrive HKG before midnight |
| 20kg bag | HK Express: pay extra / CX + JAL: 23kg included |

---

## 🛠️ May 2026 Updates & Modifications

### 1. Converted to React Component Architecture
- **From**: Single 1580-line HTML file
- **To**: React 19 + TypeScript + Tailwind CSS 4 project with 10+ modular files
- **Benefits**: Each component is independently testable, reusable, and maintainable

### 2. Code Simplification
- CSS-only dark mode via CSS variables (no JS inline style overrides)
- Centralized state in `useFlightSearch` hook (single source of truth)
- Type-safe with TypeScript interfaces for all data structures
- Utility functions extracted into dedicated files (`formatters.ts`, `filters.ts`)

### 3. Testing & Validation
- All interactions tested: route swap, tab switch, Settings drawer, theme switch
- Zero console errors
- Responsive layout verified at mobile and desktop breakpoints
- Demo mode works immediately on load (no API key required)

### 4. API Endpoint Fix (May 14, 2026)
- **Problem**: RapidAPI DataCrawler endpoint changed from `datacrawler-google-flights-api.p.rapidapi.com` to `google-flights2.p.rapidapi.com`
- **Old method**: POST with JSON body → **now returns 404**
- **New method**: GET with query parameters
- **New host**: `google-flights2.p.rapidapi.com`
- **New path**: `/api/v1/searchFlights`
- **Response structure**: `{ status: true, data: { itineraries: { topFlights: [...], otherFlights: [...] } } }`
- **Error handling**: Added user-visible status messages for CORS blocks, invalid keys, rate limits
- **Auto-search**: Settings changes now auto-trigger a new search after 800ms debounce

### 5. Response Parsing Fix (May 14, 2026)
- **Problem**: API response has flights nested at `data.itineraries.topFlights` not `data.topFlights`
- **Fix**: Updated parsing to check `data.itineraries.topFlights` path first
- **Airport codes**: Field is `airport_code` not `id`
- **Duration**: Field is `{ raw: 375, text: "6 hr 15 min" }` object, not a plain number

### 6. Feature Additions (May 14, 2026)
- **Airline logos**: FlightCard now shows real airline logos from Google Flights CDN (`gstatic.com/flights/airline_logos/70px/{CODE}.png`). Falls back to text initials if logo fails to load.
- **Best Choice badge**: ResultsPanel calculates a weighted score (40% price, 30% duration, 30% baggage match) and highlights the best flight with a teal badge.
- **API usage counter**: SettingsPanel shows a progress bar tracking API calls per month, persisted in localStorage. Resets monthly.
- **Chinese HK (zh-HK) language**: Full i18n system via `I18nContext`. Toggle button in Topbar switches between English and Traditional Chinese. All labels, buttons, and descriptions are translated.

### 7. UX / Mobile Updates (May 20, 2026)
- **Two top-level tabs**: `Home.tsx` splits the app into a Search tab and a Results tab. Search submission switches to Results; Edit search switches back to Search. This keeps the iOS viewport from becoming one long confusing page.
- **iOS-friendly viewport**: `client/index.html` uses `viewport-fit=cover`, Apple web app meta tags, and `100svh` layout treatment so the web app behaves better on iPhone Safari / home-screen style use.
- **Search button touch target**: Search and Reset buttons in `SearchPanel.tsx` use a 56px mobile height (`h-14`). Do not reintroduce mobile flex rules that shrink the primary search button.
- **Native select arrows**: Native selects hide browser-specific arrows via `appearance-none` and use a right-aligned Lucide `ChevronDown`. Keep the icon `pointer-events-none`.
- **Results filter density**: Airline filters in `ResultsPanel.tsx` are collapsed by default using a disclosure-style control. Keep the filter area compact on mobile; users can expand it when they need airline-level filtering.

### 8. RapidAPI Fare Hydration (May 20, 2026)
- **Problem seen in browser**: HKG → OKA, 2026-06-19 to 2026-06-22, RapidAPI returned valid flight cards but the visible direct flights showed `Price N/A`.
- **Root cause**: The first `searchFlights` response included `price: "unavailable"` for some direct options, even though Google Flights displayed HKD prices. Those items included `next_token`.
- **Fix**: `api.ts` now has `resolveMissingRapidPrices()` and `fetchRapidNextFlightsPrice()`. The app only performs fallback fare checks when the filtered visible set has zero finite prices, and caps checks with `MAX_RAPID_PRICE_CHECKS` to protect the free quota.
- **Parser hardening**: `parseFlightPrice()` handles numeric prices, HKD strings, nested `{ amount, currency }` structures, booking option arrays, and ignores unrelated numeric fields such as duration / CO2.
- **Sorting / summary behavior**: Missing prices sort after finite prices; summary metrics and Best Choice ignore `NaN` instead of letting one missing fare poison the result.
- **Usage accounting**: `useFlightSearch.ts` increments API usage by the actual request count returned by `fetchFlights()`, not always by 1.
- **Regression test**: `client/src/lib/api.test.ts` includes a mock HKG → OKA unavailable-price response with `next_token`, then asserts that `getNextFlights` hydrates price `4556`.

### 9. Topbar Settings Drawer + Compact Search UX (May 26, 2026)
- **Settings relocation**: The old large inline Settings card was removed from the Search tab. `Topbar.tsx` now hosts a single Settings icon button that opens `SettingsPanel.tsx` as a right-side `Sheet`.
- **Theme placement**: Light/dark mode moved into the Settings drawer under Appearance. Keep language as a topbar quick action; keep theme as a settings preference.
- **Drawer content**: Settings contains Appearance, API provider/key, API usage, status feedback, and provider info. `ThemeContext` still owns `theme`, `toggleTheme`, and `localStorage` persistence.
- **Mobile density**: Search form fields should preserve a compact 1-row/2-column rhythm on mobile where readable: outbound/return dates, passengers/cabin, baggage/stops, and outbound/return time controls.
- **Time controls**: `TimeWindow` now includes `"any"`. `SegmentedControl` renders Any/Morning/Afternoon/Evening; mobile uses a 2x2 internal grid so the two time controls can sit side-by-side. `filterFlights()` treats `"any"` as no time filter, and RapidAPI pre-filtering must not apply hour limits when outboundWindow is `"any"`.
- **Airport search**: Origin and destination are no longer raw 3-letter-only inputs. `SearchPanel.tsx` includes an airport suggestion component that accepts city names, airport names, IATA codes, and common Chinese aliases, then commits the selected IATA code (for example `香港` / `Hong Kong` → `HKG`, `tokyo` → `HND` / `NRT`).
- **Airport list scope**: The in-file airport list is intentionally a pragmatic common-airports set, not a global airport database. Add destinations surgically as user needs expand. Keep suggestions capped (currently 8) so focus/typing does not create an overwhelming dropdown.
- **Validation performed**: `npm run check`, `npm run build`, and in-app Browser QA were used after these changes. Browser evidence checked Settings drawer behavior, compact mobile layout, airport suggestions, Any time selection, and no relevant console errors.

### 10. Local Browser / Dev Server Notes (May 20, 2026)
- The in-app browser may still show a previously loaded `http://localhost:8080/` page even when shell `curl http://localhost:8080/` cannot reach the same server, or when another stale process owns the port.
- If `pnpm dev` reports `Port 8080 is in use`, use the Vite fallback URL it prints, e.g. `http://localhost:8082/`, and navigate the in-app browser there before judging a frontend fix.
- After code changes, reload the browser tab and verify: page identity, nonblank app content, no Vite/framework overlay, no console errors/warnings, and a screenshot of the relevant viewport.
- Validation commands used for these fixes: `npm run check`, `npm run build`, and targeted browser QA. Older May 20 API work also used `pnpm exec vitest run client/src/lib/api.test.ts`.

### 11. File Architecture (Current)
```
client/src/
├── contexts/
│   ├── ThemeContext.tsx     — Dark/light mode
│   └── I18nContext.tsx      — English / 中文(香港) translations
├── components/
│   ├── Topbar.tsx           — Brand + language toggle + Settings trigger
│   ├── SearchPanel.tsx      — Airport suggestions, dates, filters form (i18n)
│   ├── SettingsPanel.tsx    — Sheet drawer for appearance + API config
│   ├── ResultsPanel.tsx     — Tabs, summary, flight list + best choice
│   ├── FlightCard.tsx       — Flight card with airline logo + best badge
│   ├── SkeletonCard.tsx     — Loading placeholder
│   └── SegmentedControl.tsx — Any/morning/afternoon/evening picker
├── hooks/
│   └── useFlightSearch.ts   — State + API calls + usage counter
├── lib/
│   ├── api.ts              — RapidAPI + SerpApi fetchers
│   ├── mockData.ts         — Demo mode data
│   ├── filters.ts          — Time/baggage/stops/airline filtering
│   └── formatters.ts       — Money, duration, time utilities
├── types/
│   └── flight.ts           — TypeScript interfaces
└── pages/
    └── Home.tsx            — Main page layout
```

### 12. Future Development Recommendations
- **Add real API integration**: Move API calls to a backend proxy to protect keys and avoid CORS
- **Add price alerts**: Use scheduled tasks to monitor fare changes
- **Add booking flow**: Integrate with airline booking APIs
- **Add Japanese (ja)**: Extend i18n for Japanese travelers

---

## 🔗 Reference Links

| Resource | URL | Free Tier |
|---|---|---|
| RapidAPI (DataCrawler) | https://rapidapi.com | 150 req/month |
| SerpApi | https://serpapi.com | 100 req/month |
| Lucide React Icons | lucide-react (npm) | Free |
| Fontshare Satoshi | https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap | Free |
| shadcn/ui | https://ui.shadcn.com | Free |
