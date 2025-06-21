# Should I Take Taxi?

A Hong Kong-focused web application to help users decide whether taking a taxi is worth the extra cost compared to public transportation. The app features Hong Kong's three taxi types (Red/Green/Blue) with accurate fare calculations including tunnel fees, and calculates your approximate hourly rate to determine if the time saved justifies the additional expense.

## Key Features

- **Hong Kong Taxi Calculator**: Support for all three taxi types (Urban Red, New Territories Green, Lantau Blue)
- **Accurate Fare Calculation**: Real-time fare calculation with Hong Kong's tunnel fees
- **Route Planning**: GPS location detection and route mapping between Hong Kong locations
- **Salary-Based Analysis**: Calculate your effective hourly wage to compare against taxi costs
- **Bilingual Support**: Available in English and Traditional Chinese (Hong Kong)
- **Government Data Integration**: Uses Hong Kong Government geodata for accurate location search
- **Local Storage**: Save your salary preferences for quick calculations

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

1. **Select Start and End Locations**: Use GPS or search for Hong Kong locations
2. **Choose Taxi Type**: Select from Urban (Red), New Territories (Green), or Lantau (Blue) taxis
3. **Review Fare Calculation**: See real-time fare including tunnel fees and route distance
4. **Enter Your Salary**: Input annual or monthly salary to calculate your hourly rate
5. **Get Recommendation**: Instant analysis of whether the taxi cost is worth your time
6. **View Route on Map**: See the planned route with location markers

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
