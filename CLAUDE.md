# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Should I Take Taxi?" is a Hong Kong-focused web application that provides accurate taxi fare calculations for all three Hong Kong taxi types (Urban Red, New Territories Green, Lantau Blue). Built with Nuxt 4, it features real-time route planning with GPS location detection, automatic distance calculation via OSRM routing, interactive map displays, and comprehensive fare breakdowns including all tunnel fees and surcharges.

## Architecture & Key Patterns

### Nuxt 4 Structure

This is a standard Nuxt 4 application. Source code lives under **`app/`** (the Nuxt 4 `srcDir` default), so the `~` and `@` aliases resolve to `app/`, while `~~` and `@@` resolve to the project root. Directories that stay at the root (`config/`, `data/`, `i18n/`, `scripts/`, `server/`, `public/`) are imported from app code via `~~` (e.g. `~~/config/sitemap-routes`, `~~/data/precomputed-cache.json`). Note `i18n/` is resolved relative to the project root rather than `app/`, per `@nuxtjs/i18n`'s default `restructureDir: 'i18n'`.

### Coordinate Systems & Geographic Data

**Critical**: Hong Kong Government geodata API returns coordinates in **HK1980 Grid** format, which must be transformed to **WGS84** (standard lat/lng) using the Hong Kong Geodetic Survey's transformation API before use in maps or routing.

The coordinate transformation flow:
1. Hong Kong Government location search returns `x, y` in HK1980 Grid
2. `transformCoordinates()` in `useLocationSearch.ts` converts to WGS84
3. Converted coordinates are used for OSRM routing and Leaflet map display

### External API Dependencies

1. **Hong Kong Government Geodata API** (`www.map.gov.hk`): Location search with bilingual results
2. **Hong Kong Geodetic Survey API** (`geodetic.gov.hk`): Coordinate system transformation (HK1980 Grid → WGS84)
3. **OSRM (OpenStreetMap Routing)** (`router.project-osrm.org`): Driving distance and route calculation. Uses `overview=simplified` to shrink the polyline payload
4. **Nominatim (OpenStreetMap)** (`nominatim.openstreetmap.org`): Reverse geocoding for GPS coordinates
5. **Wheels Router** (`engine.justusewheels.com/v1/plan`): Public-transit planning for the taxi-vs-transit comparison feature

### State Management & Caching

- **No global store**: Uses local component state with Vue 3 Composition API
- **localStorage caching with TTL & LRU eviction**: API responses (location search, coordinate transforms, routes, geocoding, transit) are cached in a hybrid memory + localStorage system with a default 7-day TTL and LRU eviction (see `utils/cache.ts` and `useLocationSearch.ts`). The default cap is 50 entries per prefix; `CACHE_LIMITS` raises ROUTE and GEOCODE to 150 because those prefixes are seeded from `data/precomputed-cache.json` and would otherwise evict the seed. **Transit plans override the default TTL to 2 minutes** because they embed real-time departures.
- **Precomputed route seeding**: `plugins/seed-cache.client.ts` imports `data/precomputed-cache.json` on first visit and populates the ROUTE and GEOCODE caches via `setCacheMany()`, which writes the LRU index once for the whole batch instead of once per entry. A `__cache_seed_v` localStorage sentinel (`SEED_VERSION`) skips re-seeding on subsequent visits, so seeded entries are written with a **1-year TTL override** — at the default 7-day TTL `sweepExpired()` would reclaim them and nothing would put them back. `setCacheMany()` returns `false` if any entry failed to persist (quota, private browsing) and the sentinel is only recorded on a full success, so a partial seed is retried next visit. Bump `SEED_VERSION` when re-running `npm run precompute-routes`, and keep `CACHE_LIMITS` above the seeded entry counts.
- **Expired-entry sweep on mount**: `plugins/sweep-cache.client.ts` runs `sweepExpired()` for every cache prefix inside `requestIdleCallback` on app mount, reclaiming localStorage space.
- **Reactive state management**: Distance, fare calculations, and route information managed via Vue refs and computed properties

### Taxi Fare Calculation Logic

Fare math lives in `app/utils/fareCalculation.ts` (pure functions); `TaxiFareCalculator.vue` consumes it via `calculateTotalFare()`.

1. **Rate structure** varies by taxi type (urban/newTerritories/lantau)
2. **Distance calculation**:
   - Flag fall covers first 2km
   - Incremental rate per 0.2km segments
   - Rate changes after threshold amount (e.g., HK$102.5 for urban)
   - Auto-calculated from OSRM routing API
   - Manual override available with validation (warns if >50% difference from auto-calculated)
3. **Additional fees**:
   - Tunnel fees (Cross Harbour, Tate's Cairn, Tai Lam, Lions Rock, Shing Mun, Aberdeen, Sha Tin Heights)
   - Tunnel fee type: one-way or return selector (return doubles the cross-harbour tunnel fee); only shown when Cross Harbour Tunnel is selected
   - Luggage fees (HK$6 per piece)
   - **85% discount fare** (85折): Optional toggle that applies 0.85 multiplier to meter fare only (flag fall + distance charges); tunnel fees and luggage fees are not discounted
4. **Smart features**:
   - **Cross-harbour detection**: Automatically selects Cross Harbour Tunnel when route crosses Victoria Harbour (detected using two bounding boxes for Hong Kong Island via `useLocationDetection.ts` and `utils/boundingBoxes.ts`) and auto-expands advanced options
   - **Taxi type suggestions**: Suggests Lantau Blue taxi when both start and end locations are within the Lantau bounding box (coordinate-based detection, not keyword-based)
   - **Location swapping**: One-click swap between start and end locations for return trip calculations

### Map Integration

Uses `@nuxtjs/leaflet` module with:
- **CartoDB Light basemap**: Clean, minimal map style suitable for Hong Kong. Raster tiles require `?key=` (`MAP_CONSTANTS.CARTO_API_KEY`) or CARTO overlays an "API key required" watermark; the free tier allows 5M tile requests/month and requires the CARTO + OSM attribution to stay visible
- **Draggable markers**: Start and end location pins that can be dragged to update locations
- **Click-to-set locations**: Clicking the map sets the location for the currently focused input field (focus is captured on `mousedown` because the input's blur fires before the click)
- **Route polyline**: Blue line showing OSRM-calculated driving route
- **Auto-fit bounds**: Map automatically adjusts to show both start and end points with padding
- **Coordinate swap**: OSRM returns [lng, lat] but Leaflet expects [lat, lng]
- **Async-loaded**: `MapDisplay.vue` is wrapped in `defineAsyncComponent` in `pages/index.vue` so Leaflet isn't in the initial JS chunk

### Taxi vs Public Transit Comparison

When both locations are set, `handleCalculateTransit()` in `TaxiFareCalculator.vue` fires a fire-and-forget request to the Wheels Router API (`calculateTransitRoute` in `useLocationSearch.ts`) to fetch the fastest public-transit plan. The feature is non-blocking — fare calculation never waits on it. Key details:

- **Transit legs** are summarized via `summarizeTransitLegs()` in `utils/transitValue.ts`, which sums both `walk` and `station_transfer` legs as walking time to avoid undercounting interchange time (e.g. Central station transfers).
- **Value tier classification** (`getTaxiValueTier()`): bins the taxi-vs-transit trade-off into `'great'`, `'good'`, or `'poor'` using HK minimum-wage and median-wage rates per minute saved, scaled by an absolute-hours-saved bonus capped at 1.5 hours.
- **UI color coding**: `getTierClasses()` returns the green/amber/neutral/red Tailwind classes for the comparison panel.
- **Shared derivations**: `composables/useTransitComparison.ts` wraps the above into `minutesSaved` / `walkMinutes` / `waitMinutes` / `tier` / `tierClasses` / `costPerHourSaved`. Both the inline summary in `TaxiFareCalculator.vue` and the full panel in `pages/index.vue` consume it, so the maths is defined once. Everything resolves to a neutral zero/null while `isCalculating` is true — callers don't re-check it.
- **Cache**: 2-minute TTL override (see State Management section) to keep real-time departures reasonably fresh.
- **Abort**: In-flight transit requests are aborted on location change, swap, and refresh via an `AbortController`.

### Share URLs & SEO Landing Pages

- **URL ↔ state sync**: `pages/index.vue` reads `?from=lat,lng&to=lat,lng` on mount (`parseQueryParams`) and writes it back on every location change (`updateUrlParams`). Coordinates are written at 6-decimal precision; `coordKey()` from `useLocationSearch.ts` is used for cache lookups at the same precision.
- **Dynamic SEO meta**: `dynamicTitle` / `dynamicDescription` computeds embed the origin, destination, and — when a precomputed route is available via `getCachedRoute()` — a concrete fare into the `<title>` and `<meta description>`. This is why `plugins/seed-cache.client.ts` is an async plugin: it must populate the cache before the description first evaluates.
- **Known-location matching**: `findLocationByCoordinates` in `config/sitemap-routes.ts` maps URL coordinates back to localized landmark names for display, avoiding a Nominatim round-trip for popular routes.
- **API preloading**: When `?from` / `?to` are present, `useHead` adds `preload` hints for the specific Nominatim and OSRM URLs that will be requested. A preload is only reused when it matches the eventual request byte-for-byte, so both the hint and the `$fetch` build their URL from the shared `nominatimReverseUrl()` / `osrmRouteUrl()` helpers in `useLocationSearch.ts` — never inline the URL at either site. `preconnect` for both origins already ships app-wide from `nuxt.config.ts`; unhead does not dedupe unkeyed links, so repeating it here would emit duplicate tags.

### UI Library (Nuxt UI v4 + Tailwind CSS v4)

The UI is built on **Nuxt UI v4** (`@nuxt/ui`), which bundles and requires **Tailwind CSS v4**. There is no `tailwind.config.ts`; theme tokens are imported CSS-first via `app/assets/css/main.css` (`@import "tailwindcss"; @import "@nuxt/ui";`) referenced from `nuxt.config.ts` `css`. Design tokens (`primary: blue`, `neutral: slate`) and the icon-alias remap live in `app/app.config.ts`. The root layout wraps everything in `<UApp :locale>` (see i18n below).

- **Components**: form controls and panels use Nuxt UI components — `UButton`, `UInput`, `UCheckbox`, `URadioGroup`, `UCollapsible`, `UBadge`, `UAlert`, `UCard`, `UIcon`. Domain colours (red/green/blue = Urban/NT/Lantau taxi types) stay as **literal** Tailwind classes, not theme tokens.
- **Semantic colour tokens**: prefer Nuxt UI's `bg-default`/`bg-muted`/`bg-elevated`, `text-highlighted`/`text-default`/`text-muted`/`text-dimmed`, `border-default`, and `text-primary` over hand-written `… dark:…` pairs — they encode light+dark in one class.
- **Icons**: served on-demand by `@nuxt/icon` (auto-registered by Nuxt UI) from the local `@iconify-json/heroicons` + `@iconify-json/simple-icons` collections. Use `i-heroicons-*` / `i-simple-icons-*`. Because only Heroicons are installed, `app.config.ts` remaps Nuxt UI's internal icon aliases (loading, close, check, chevrons…) from their Lucide defaults to Heroicons.

### Dark Mode

Dark mode is handled by **`@nuxtjs/color-mode`** (auto-registered by Nuxt UI), which owns the `.dark` class, the FOUC-prevention script, and the page background. The legacy `storageKey: 'taxi-calc-theme-preference'` is preserved in `nuxt.config.ts` so saved preferences carry over. `composables/useDarkMode.ts` is now a thin wrapper exposing the resolved `isDark` (used by `MapDisplay.vue` for the dark/light basemap). `ThemeToggle.vue` renders Nuxt UI's `<UColorModeButton>` (a **binary** light/dark toggle) and re-emits the `theme_preference_changed` analytics + `theme_mode` super-property by watching `colorMode.preference`.

### Recent Locations

`composables/useRecentLocations.ts` persists the last N selected locations to localStorage via VueUse's `useStorage` (key from `STORAGE_CONSTANTS.RECENT_LOCATIONS_KEY`, capped at `UI_CONSTANTS.MAX_RECENT_LOCATIONS`). `LocationSearch.vue` surfaces them in the dropdown when the input is empty, and differentiates analytics between `search` and `recent` selections via the `source` argument passed through the `select` emit.

## Analytics

Dispatches every event to **both Google Analytics 4** and **PostHog** (both via `@nuxt/scripts`'s registry helpers — `useScriptGoogleAnalytics` and `useScriptPostHog`) through a single `useAnalytics()` composable in `composables/useAnalytics.ts`:

```ts
const { track, registerSuperProperties } = useAnalytics()
track('taxi_type_selected', { type: 'urban', previous_type: 'newTerritories' }, { ga4Event: 'taxi_type_selected_urban' })
```

- **GA4 (`ga4Event` or `eventName`)**: keeps the project's variance-in-event-name convention because GA4 custom dimensions require admin registration and are awkward to segment without it (`taxi_type_selected_urban`, `taxi_tunnel_added_crossHarbour`, `transit_comparison_loaded_great`, `taxi_start_location_selected_search`).
- **PostHog (`eventName` + `properties`)**: receives the canonical event name with rich properties for free filtering/grouping. Use the `ga4Event` option whenever the GA4 name has a variance suffix.

PostHog initialisation lives in `plugins/posthog.client.ts`. It registers a `before_send` hook that strips the `from`/`to` query parameters from `$current_url`, `$referrer`, etc. — the URL encodes user-chosen origin/destination coordinates and we never want those leaving the browser, even via auto-captured framework properties. Configuration (API key, host, autocapture off, history-change pageviews, session recording disabled) is in `nuxt.config.ts` under `scripts.registry.posthog`.

**Privacy / PII**: never pass raw addresses, lat/lng, or user search queries as event properties. Distance is sent as both raw km and a coarse bucket (`distanceBucket()` in `TaxiFareCalculator.vue`); fares and tunnel selections are fine; locations are referenced only by slot (`'start'` / `'end'`) or boolean flags (`has_start`, `has_other_location`).

**Super-properties** (PostHog only, registered in `pages/index.vue` on mount and on locale change): `locale`, `is_pwa_standalone`, plus `theme_mode` registered from `ThemeToggle.vue` (watching `colorMode.preference`).

## Modules & Configuration

Key Nuxt modules configured in `nuxt.config.ts`:
- `@nuxt/ui`: Component library (Nuxt UI v4) — bundles Tailwind CSS v4 and auto-registers `@nuxtjs/color-mode`, `@nuxt/icon`, and `@nuxt/fonts` (do not add those manually). See "UI Library" above.
- `@nuxtjs/i18n`: Internationalization. Nuxt UI's own component strings are localized via `<UApp :locale>` in `app.vue`, mapping the active locale to `@nuxt/ui/locale`'s `en` / `zh_cn` / `zh_tw` (`zh-hk` → `zh_tw`).
- `@sentry/nuxt`: Error tracking (tracing + debug code tree-shaken out of the client bundle via `__SENTRY_DEBUG__`/`__SENTRY_TRACING__` `vite.define` flags)
- `@nuxt/scripts`: Third-party script loaders — provides `useScriptGoogleAnalytics` (GA4) and `useScriptPostHog`, both deferred via `trigger: 'onNuxtReady'`

## Deployment

- Production URL: `https://shoulditake.taxi`
