# Should I Take Taxi?

A Hong Kong-focused web application that provides accurate taxi fare calculations for all three Hong Kong taxi types. The app features real-time route planning, automatic distance calculation, and comprehensive fare breakdowns including tunnel fees and surcharges.

## Key Features

- **Hong Kong Taxi Calculator**: Support for all three taxi types (Urban Red, New Territories Green, Lantau Blue)
- **Accurate Fare Calculation**: Real-time fare calculation with official Transport Department rates
- **Smart Route Planning**: GPS location detection and automatic driving route calculation with OSRM
- **Interactive Map Display**: Visual route with draggable start/end markers and click-to-set-location using Leaflet
- **Taxi vs Public Transit Comparison**: See how much time a taxi saves over public transit and whether the cost is worth it
- **Manual Distance Adjustment**: Override auto-calculated distance with custom values when needed
- **Cross-Harbour Detection**: Automatically detects and suggests Cross Harbour Tunnel for cross-harbour routes
- **Taxi Type Suggestions**: Smart recommendations for Lantau taxi based on route locations
- **Location Management**: Swap start/end locations, recent-locations dropdown, and shareable URLs that restore routes
- **Comprehensive Fee Breakdown**: Detailed breakdown of flag fall, distance fare, tunnel fees, luggage charges, and return toll
- **Sticky Fare Summary**: Fare summary stays visible while scrolling for easy reference
- **Installable PWA**: Install to your home screen for offline-capable access
- **Dark Mode**: System-aware light/dark/system theme toggle
- **Multilingual Support**: English, Traditional Chinese (Hong Kong), Traditional Chinese (Taiwan), and Simplified Chinese
- **Government Data Integration**: Uses Hong Kong Government geodata API and coordinate transformation services

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Usage

1. **Select Start and End Locations**: Use GPS auto-detection, search Hong Kong locations, pick from recent locations, drag markers on the map, or click the map to drop a pin
2. **Auto-Calculate Route**: The app automatically calculates the driving route, distance, and estimated time
3. **Choose Taxi Type**: Select from Urban (Red), New Territories (Green), or Lantau (Blue) taxis
4. **Adjust Distance (Optional)**: Manually adjust the distance if needed, with validation warnings
5. **Configure Advanced Options**: Add tunnel fees, luggage charges, return tolls, and the 85% discount fare
6. **Review Fare Breakdown**: See detailed breakdown of all charges including flag fall, distance fare, and surcharges
7. **Compare With Public Transit**: See side-by-side time and cost against public transit and whether the taxi is worth the extra spend
8. **Share the Route**: The URL updates with `?from=lat,lng&to=lat,lng` so you can share or bookmark a specific route
9. **Install as an App**: Add to home screen for offline-capable access

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
