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
- **composables/**: Reusable composition functions (e.g., `useLocationSearch.ts`)
- **pages/**: File-based routing (currently single page: `index.vue`)
- **types/**: TypeScript type definitions
- **i18n/locales/**: Multilingual support (English, Traditional Chinese HK/TW, Simplified Chinese CN)
- **utils/**: Helper utilities (`cache.ts` for caching, `boundingBoxes.ts` for geographic detection)
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
3. **OSRM (OpenStreetMap Routing)** (`router.project-osrm.org`): Driving distance and route calculation
4. **Nominatim (OpenStreetMap)** (`nominatim.openstreetmap.org`): Reverse geocoding for GPS coordinates

### State Management & Caching

- **No global store**: Uses local component state with Vue 3 Composition API
- **localStorage caching with TTL & LRU eviction**: API responses (location search, coordinate transforms, routes, geocoding) are cached in a hybrid memory + localStorage system with 7-day TTL and max 50 entries per prefix, with LRU eviction (see `utils/cache.ts` and `useLocationSearch.ts`)
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
- **Click-to-set locations**: Clicking the map sets the location for the currently focused input field
- **Route polyline**: Blue line showing OSRM-calculated driving route
- **Auto-fit bounds**: Map automatically adjusts to show both start and end points with padding
- **Coordinate swap**: OSRM returns [lng, lat] but Leaflet expects [lat, lng]

## Important Implementation Notes

### Component Communication

- `TaxiFareCalculator.vue` emits events to parent:
  - `update:locations` event when locations or route change (includes start/end locations and route coordinates)
  - `update:fare` event when fare calculation updates (includes total fare and detailed breakdown)
  - `update:focusedInput` event to track which location input field is focused (used for map click-to-set)
- `LocationSearch.vue` is a reusable component that emits `select` event with transformed WGS84 coordinates
- `MapDisplay.vue` emits events:
  - `marker-dragged` event when a marker is dragged (includes type, latitude, longitude)
  - `map-clicked` event when the map is clicked (includes latitude, longitude)
- Parent page (`index.vue`) manages:
  - Location data passed to `MapDisplay.vue` for visualization
  - Fare data for display and sticky header
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

Uses `nuxt-gtag` module for Google Analytics tracking. Custom events tracked include:
- Location selections and swapping
- Distance calculations (auto and manual)
- Taxi type selections and suggestions
- Tunnel selections
- GPS usage
- Advanced options toggling
- Manual distance editing actions

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
- `@sentry/nuxt`: Error tracking
- `nuxt-gtag`: Google Analytics
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
