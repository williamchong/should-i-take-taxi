# Should I Spend Time on ${this}?

An web application to help users decide whether to invest time in an activity or take advantage of discounts. The app calculates your approximate hourly rate based on your annual or monthly salary using predefined assumptions, allowing you to determine if your time is well spent.

## Key Features

- Input your salary (annual or monthly) to quickly calculate your effective hourly wage
- Calculate the value per hour of activities or discounts
- Compare activity/discount value against your hourly rate
- Support for multiple languages (English, Chinese)
- Simple and intuitive interface with visual feedback
- Results with detailed explanations
- Local storage for saving your salary preferences

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

1. Enter your salary (choose between annual or monthly)
2. Input the value of the activity or discount
3. Specify the time duration in minutes
4. Get instant feedback on whether the activity is worth your time
5. View detailed explanation of the calculation

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
