# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Should I Take Taxi?" is a Hong Kong-focused web application that provides accurate taxi fare calculations for all three Hong Kong taxi types (Urban Red, New Territories Green, Lantau Blue). Built with Nuxt 3, it features real-time route planning with GPS location detection, automatic distance calculation via OSRM routing, interactive map displays, and comprehensive fare breakdowns including all tunnel fees and surcharges.

## Development Commands

```bash
# Development
npm run dev                 # Start development server on http://localhost:3000
npm run build              # Build for production
npm run preview            # Preview production build
npm run generate           # Generate static site

# Code Quality
npm run lint               # Run ESLint on entire codebase
npm run typecheck          # Run TypeScript type checking

# Testing
npm run test               # Run all tests once
npm run test:watch         # Run tests in watch mode
```

## Architecture & Key Patterns

### Nuxt 3 Structure

This is a standard Nuxt 3 application with:
- **components/**: Vue 3 components using Composition API with `<script setup>`
- **composables/**: Reusable composition functions (`useLocationSearch.ts`, `useLocationDetection.ts`, `useRecentLocations.ts`, `useDarkMode.ts`)
- **pages/**: File-based routing (currently single page: `index.vue`)
- **plugins/**: Client-only plugins — `seed-cache.client.ts` populates the route/geocode caches from `data/precomputed-cache.json` on first visit (SEO landing page acceleration); `sweep-cache.client.ts` removes expired localStorage entries on app mount via `requestIdleCallback`
- **types/**: TypeScript type definitions and constants (`constants.ts` holds `TAXI_RATES`, `TUNNEL_FEES`, `TAXI_FARE_CONSTANTS`, etc.)
- **i18n/locales/**: Multilingual support (English, Traditional Chinese HK/TW, Simplified Chinese CN)
- **utils/**: Pure-function helpers — `fareCalculation.ts` (extracted fare math), `cache.ts` (TTL + LRU cache), `boundingBoxes.ts` (HK region detection), `location.ts` (coordinate utilities), `transitValue.ts` (taxi-vs-transit value tier classification)
- **scripts/**: `precompute-routes.mjs` — offline script that calls OSRM/Nominatim to generate `data/precomputed-cache.json` for popular sitemap routes
- **config/**: `sitemap-routes.ts` — known landmark coordinates used for sitemap generation and reverse matching on shared URLs
- **server/**: Server-side code (minimal usage)

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
- **localStorage caching with TTL & LRU eviction**: API responses (location search, coordinate transforms, routes, geocoding, transit) are cached in a hybrid memory + localStorage system with a default 7-day TTL and max 50 entries per prefix, with LRU eviction (see `utils/cache.ts` and `useLocationSearch.ts`). **Transit plans override the default to a 2-minute TTL** because they embed real-time departures.
- **Precomputed route seeding**: `plugins/seed-cache.client.ts` imports `data/precomputed-cache.json` on first visit and populates the ROUTE and GEOCODE caches. A `__cache_seed_v` localStorage sentinel (`SEED_VERSION`) skips re-seeding on subsequent visits. Bump `SEED_VERSION` when re-running `npm run precompute-routes`.
- **Expired-entry sweep on mount**: `plugins/sweep-cache.client.ts` runs `sweepExpired()` for every cache prefix inside `requestIdleCallback` on app mount, reclaiming localStorage space.
- **Reactive state management**: Distance, fare calculations, and route information managed via Vue refs and computed properties

### Taxi Fare Calculation Logic

Implemented in `components/TaxiFareCalculator.vue`:

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

### i18n Multilingual Support

- **Default locale**: `en-hk` (English - Hong Kong)
- **Supported locales**: `en-hk`, `zh-hk` (Traditional Chinese - Hong Kong), `zh-tw` (Traditional Chinese - Taiwan), `zh-cn` (Simplified Chinese - China)
- **URL strategy**: `prefix_and_default` - default locale has no prefix, others prefixed with locale code
- **Detection**: Browser language detection on root path only
- Translation files: `i18n/locales/en-HK.json`, `zh-HK.json`, `zh-TW.json`, `zh-CN.json`

### Map Integration

Uses `@nuxtjs/leaflet` module with:
- **CartoDB Light basemap**: Clean, minimal map style suitable for Hong Kong
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
- **Cache**: 2-minute TTL override (see State Management section) to keep real-time departures reasonably fresh.
- **Abort**: In-flight transit requests are aborted on location change, swap, and refresh via an `AbortController`.

### Share URLs & SEO Landing Pages

- **URL ↔ state sync**: `pages/index.vue` reads `?from=lat,lng&to=lat,lng` on mount (`parseQueryParams`) and writes it back on every location change (`updateUrlParams`). Coordinates are written at 6-decimal precision; `coordKey()` from `useLocationSearch.ts` is used for cache lookups at the same precision.
- **Dynamic SEO meta**: `dynamicTitle` / `dynamicDescription` computeds embed the origin, destination, and — when a precomputed route is available via `getCachedRoute()` — a concrete fare into the `<title>` and `<meta description>`. This is why `plugins/seed-cache.client.ts` is an async plugin: it must populate the cache before the description first evaluates.
- **Known-location matching**: `findLocationByCoordinates` in `config/sitemap-routes.ts` maps URL coordinates back to localized landmark names for display, avoiding a Nominatim round-trip for popular routes.
- **API preloading**: When `?from` / `?to` are present, `useHead` adds `preconnect` + `preload` hints for the specific Nominatim and OSRM URLs that will be requested.

### PWA Support

Configured in `nuxt.config.ts` via `@vite-pwa/nuxt`:

- **Manifest**: name, short_name, theme_color, standalone display mode, 192/512 icons (including a maskable 512).
- **Workbox**: precaches `**/*.{js,css,html,ico,png,svg,json,woff2}`; `navigateFallback: '/'` for offline SPA routing.
- **Install prompt**: `client.installPrompt: true` lets the module surface the install prompt. `pages/index.vue` listens for `appinstalled` and `beforeinstallprompt` to track the install funnel via analytics.

### Dark Mode

`composables/useDarkMode.ts` exposes a `system | light | dark` tri-state preference (stored at `taxi-calc-theme-preference`). `usePreferredDark` from VueUse reactively tracks the system preference when `mode === 'system'`. `ThemeToggle.vue` is a fixed-position floating button that cycles through the three modes.

### Recent Locations

`composables/useRecentLocations.ts` persists the last N selected locations to localStorage via VueUse's `useStorage` (key from `STORAGE_CONSTANTS.RECENT_LOCATIONS_KEY`, capped at `UI_CONSTANTS.MAX_RECENT_LOCATIONS`). `LocationSearch.vue` surfaces them in the dropdown when the input is empty, and differentiates analytics between `search` and `recent` selections via the `source` argument passed through the `select` emit.

## Important Implementation Notes

### Component Communication

- `TaxiFareCalculator.vue` emits events to parent:
  - `update:locations` event when locations or route change (includes start/end locations and route coordinates)
  - `update:fare` event when fare calculation updates (includes total fare and detailed breakdown)
  - `update:focusedInput` event to track which location input field is focused (used for map click-to-set)
  - `update:transitInfo` event when the taxi-vs-transit comparison loads (includes transit duration, fare range, walking/waiting seconds, and driving time; `null` while clearing)
- `LocationSearch.vue` is a reusable component that emits `select` event with `(transformedLocation, source)` where `source` is `'search' | 'recent'` — used so analytics can distinguish search vs. recent-locations selections
- `MapDisplay.vue` emits events:
  - `marker-dragged` event when a marker is dragged (includes type, latitude, longitude)
  - `map-clicked` event when the map is clicked (includes latitude, longitude)
- Parent page (`index.vue`) manages:
  - Location data passed to `MapDisplay.vue` for visualization
  - Fare data for display and sticky header
  - Transit data for the comparison panel and color-tier classes
  - URL ↔ state sync and dynamic `<title>` / meta description
  - Intersection Observer for sticky fare summary (shows when scrolled past main fare display)

### GPS Location Detection

On component mount, `TaxiFareCalculator.vue` automatically attempts to:
1. Check if geolocation is supported
2. Request user's current location
3. Reverse geocode coordinates to get address
4. Set as start location and auto-calculate route if end location exists

### UI/UX Features

- **Sticky Fare Display**: Uses Intersection Observer to show a sticky header with fare when main fare display scrolls out of view
- **Manual Distance Editing**: Inline editing mode with validation:
  - Shows badges for "Auto" vs "Adjusted" state
  - Validates minimum (0.1km) and maximum (200km)
  - Warns if manual distance differs >50% from auto-calculated
  - Allows restoration to auto-calculated value
- **Collapsible Sections**:
  - Introduction section (collapsed by default)
  - Advanced options (tunnels and luggage)
  - Other tunnels submenu
- **Smart UI Updates**:
  - Auto-expands advanced options when cross-harbour tunnel detected
  - Shows suggestion banner for taxi type recommendations
  - Swap button enabled only when both locations selected
  - GPS button shows loading spinner during location fetch

### Analytics

Uses `nuxt-gtag` module for Google Analytics (GA4). **Convention: encode variance in the event name, not custom dimensions** — GA4 custom dimensions require registration in the GA admin and are awkward to segment without it. For example, `taxi_type_selected_urban` / `taxi_type_selected_newTerritories` / `taxi_type_selected_lantau` rather than a single `taxi_type_selected` with a `{ type }` param; `taxi_tunnel_added_crossHarbour` / `taxi_tunnel_removed_crossHarbour` rather than `{ tunnel, selected }`; `transit_comparison_loaded_great` / `_good` / `_poor`; `taxi_start_location_selected_search` / `_recent`.

Custom events tracked include:
- Location selections (with `source` baked into the name: `_search` / `_recent`) and swapping
- Distance calculations (auto, manual edit opened/set/cancelled/reset, cache hit)
- Taxi type selections (per-type) and suggestions (shown/accepted/dismissed)
- Tunnel add/remove (per tunnel ID), tunnel fee type change, 85% discount toggle, luggage input/change
- GPS attempt/success/error
- Advanced options toggling
- Marker drag (per slot) and geocoded/failed outcomes
- Transit comparison load (per value tier) and error
- Inline summary clicks (fare / transit)
- PWA install prompt availability and install completion
- SEO URL restored-from-query and updated
- Theme preference change (per mode)

### Error Handling

- Location search failures return empty array
- Coordinate transformation failures return original coordinates
- Route calculation failures throw errors (caught in component)

## Modules & Configuration

Key Nuxt modules configured in `nuxt.config.ts`:
- `@nuxtjs/i18n`: Internationalization
- `@nuxtjs/tailwindcss`: Utility-first CSS
- `@nuxtjs/leaflet`: Leaflet maps
- `@nuxtjs/sitemap`: SEO sitemap generation
- `@sentry/nuxt`: Error tracking (tracing + debug code tree-shaken out of the client bundle via `__SENTRY_DEBUG__`/`__SENTRY_TRACING__` `vite.define` flags)
- `nuxt-gtag`: Google Analytics
- `@vite-pwa/nuxt`: PWA manifest, service worker (Workbox), and install prompt
- `@nuxt/eslint`: Linting

## TypeScript

- Extends Nuxt's auto-generated tsconfig
- ESLint rule: `@typescript-eslint/no-explicit-any` set to 'warn' (not error)
- Auto-imports enabled for Vue, Nuxt, and composables

## Deployment

- Production URL: `https://shoulditake.taxi`
- Sentry organization: `williamchong`
- Sentry project: `should-i-take-taxi`
- Source maps: client source maps set to 'hidden' for security
