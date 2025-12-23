# Should I Take Taxi?

A Hong Kong-focused web application that provides accurate taxi fare calculations for all three Hong Kong taxi types. The app features real-time route planning, automatic distance calculation, and comprehensive fare breakdowns including tunnel fees and surcharges.

## Key Features

- **Hong Kong Taxi Calculator**: Support for all three taxi types (Urban Red, New Territories Green, Lantau Blue)
- **Accurate Fare Calculation**: Real-time fare calculation with official Transport Department rates
- **Smart Route Planning**: GPS location detection and automatic driving route calculation with OSRM
- **Interactive Map Display**: Visual route display with start/end markers using Leaflet maps
- **Manual Distance Adjustment**: Override auto-calculated distance with custom values when needed
- **Cross-Harbour Detection**: Automatically detects and suggests Cross Harbour Tunnel for cross-harbour routes
- **Taxi Type Suggestions**: Smart recommendations for Lantau taxi based on route locations
- **Location Management**: Swap start/end locations with one click for return trip calculations
- **Comprehensive Fee Breakdown**: Detailed breakdown of flag fall, distance fare, tunnel fees, luggage charges, and return toll
- **Sticky Fare Summary**: Fare summary stays visible while scrolling for easy reference
- **Bilingual Support**: Available in English and Traditional Chinese (Hong Kong)
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

1. **Select Start and End Locations**: Use GPS auto-detection or search for Hong Kong locations using government geodata
2. **Auto-Calculate Route**: The app automatically calculates the driving route, distance, and estimated time
3. **Choose Taxi Type**: Select from Urban (Red), New Territories (Green), or Lantau (Blue) taxis
4. **Adjust Distance (Optional)**: Manually adjust the distance if needed, with validation warnings
5. **Configure Advanced Options**: Add tunnel fees, luggage charges, and cross-harbour taxi stand options
6. **Review Fare Breakdown**: See detailed breakdown of all charges including flag fall, distance fare, and surcharges
7. **View Route on Map**: Interactive map displays your route with markers and polyline

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
