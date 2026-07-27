---
name: run-should-i-take-taxi
description: Build, run, screenshot, and drive the "Should I Take Taxi?" Nuxt 4 app (shoulditake.taxi). Use when asked to run/start/launch the dev server, take a screenshot of the app, verify a UI change in the real browser, check a fare calculation end-to-end, or test the map, location search, tunnel options, or taxi-vs-transit comparison.
---

# Run "Should I Take Taxi?"

Nuxt 4 SPA/SSR app. Driven headlessly by **`.claude/skills/run-should-i-take-taxi/driver.mjs`** —
a playwright-core CLI that navigates, fills the location inputs, flips taxi
type / tunnels, scrapes the fare breakdown as JSON, and writes full-page PNGs.

All paths below are relative to the repo root.

## Prerequisites

Node ≥ 24 (`package.json` `engines`). Install deps and the Chromium build that
matches `playwright-core`:

```bash
npm install
npx playwright-core install chromium
```

The second line is required even though `node_modules/playwright-core` exists —
`npm install` never downloads browsers, and a stale build in
`~/Library/Caches/ms-playwright` fails with *"Executable doesn't exist at
…chromium_headless_shell-<N>"*.

## Run the dev server

**Pin the port.** Nuxt silently falls back to 3001/3002 when 3000 is taken, and
the driver would then talk to whatever else is on 3000.

```bash
nohup npm run dev -- --port 3123 > /tmp/taxi-dev.log 2>&1 &
sleep 8 && grep "Local:" /tmp/taxi-dev.log
```

Stop it with `pkill -f "nuxt dev"`.

## Run (agent path) — the driver

One-shot subcommands; each prints JSON and exits.

```bash
# Fare for a coordinate pair via the share URL (deterministic — preferred)
node .claude/skills/run-should-i-take-taxi/driver.mjs route 22.281886,114.159360 22.300093,114.172575 central-tst

# Type into the real location inputs and pick from the dropdown
node .claude/skills/run-should-i-take-taxi/driver.mjs search "Central" "Tsim Sha Tsui" search-flow

# Navigate + screenshot only
node .claude/skills/run-should-i-take-taxi/driver.mjs shot / home
```

Or a REPL, which keeps one browser across commands (much faster, and required
for anything that mutates page state):

```bash
printf 'route 22.281886,114.159360 22.300093,114.172575 r1
taxi lantau
advanced open
options
tunnel Cross-Harbour
errors
quit
' | node .claude/skills/run-should-i-take-taxi/driver.mjs repl
```

### Commands

| Command | Does |
|---|---|
| `route <lat,lng> <lat,lng> [name]` | Load `?from=…&to=…`, wait for the fare to settle, screenshot, return the breakdown |
| `search <start> <end> [name]` | Type into `#startLocation` / `#endLocation`, click the **first** dropdown result |
| `shot <path> [name]` | Navigate + full-page screenshot |
| `taxi <urban\|newTerritories\|lantau\|oneWay\|return>` | Select a radio option by its `value`, re-read fare |
| `advanced [open\|close]` | Toggle the tunnels/luggage collapsible (idempotent) |
| `tunnel <label substring>` | Toggle a tunnel checkbox — quote multi-word names: `tunnel "Tai Lam"`. Opens the nested "Other Tunnels" panel when needed |
| `options` | Dump every checkbox / radio / collapsible with its label + state |
| `fare` | Re-read the fare panel without navigating |
| `eval <js>` | Run an expression **in the page** |
| `errors` | Console errors + failed requests seen so far |

Screenshots land in `.claude/skills/run-should-i-take-taxi/shots/` (gitignored).

### Env vars

| Var | Default | Effect |
|---|---|---|
| `BASE_URL` | `http://localhost:3123` | Point at a preview/production server |
| `LOCALE` | `en-hk` | Path prefix — `zh-hk`, `zh-tw`, `zh-cn` |
| `HEADED=1` | off | Show the browser window |
| `GPS=lat,lng` | off | Grant geolocation at a fixed point (see Gotchas) |
| `OFFLINE=1` | off | Block OSRM/Nominatim/Wheels/HK-gov — exercises only the precomputed cache |
| `ANALYTICS=1` | off | Re-enable GA4/PostHog (blocked by default — see Gotchas) |
| `SHOT=0` | off | Skip screenshots — faster, and no image tokens when you only want the JSON |
| `SHOT_DIR` | `…/shots` | Screenshot output dir |

Every wait is best-effort so a partial result still comes back. When one expires
the result carries a **`timedOut`** array naming it (`fare`, `transit`,
`transit-panel`, `map`, `dropdown`) — so `"totalFare": null` explains itself
instead of prompting a blind re-run. `OFFLINE=1` legitimately reports
`timedOut: ["transit-panel"]`, since the Wheels API is blocked.

Verified output for the Central → Tsim Sha Tsui route above:

```json
{
  "totalFare": 133.6,
  "distanceKm": 7.1,
  "breakdown": [["Urban (Red) Flag Fall:", "HK$ 29.00"],
                ["Distance Fare:", "HK$ 54.60"],
                ["Tunnel Fees Total:", "HK$ 25.00"],
                ["Return Tunnel Fee:", "HK$ 25.00"]],
  "transit": { "taxiMinutes": "9 min", "transitMinutes": "40 min",
               "summary": "Taking a taxi saves ~31 min" }
}
```

## Run against the production build

```bash
npm run build
PORT=3124 nohup node .output/server/index.mjs > /tmp/taxi-preview.log 2>&1 &
sleep 5
BASE_URL=http://localhost:3124 node .claude/skills/run-should-i-take-taxi/driver.mjs route 22.281886,114.159360 22.300093,114.172575 prod
```

Same fare, no devtools overlay, no on-demand chunk compilation (so it's faster
and less flaky than dev). Stop with `pkill -f ".output/server/index.mjs"`.

## Test / lint / typecheck

```bash
npm run test        # 109 tests, 7 files, ~0.5s — pure-function units only, no browser
npm run lint
npm run typecheck   # catches things lint does not; run both before calling work done
```

## Run (human path)

`npm run dev` → open `http://localhost:3000`. Useless for an agent: the GPS
permission prompt blocks the map behind a splash until a human answers it.

## Gotchas

- **The dev server fires *production* analytics.** `@nuxt/scripts` loads GA4
  (`G-7JBFREKBB0`) and PostHog on `onNuxtReady` with the live ids from
  `nuxt.config.ts` — there is no dev guard. Each driver run would register as a
  brand-new first-visit user (`_fv=1`) in the real dashboards. The driver blocks
  `google-analytics.com`, `googletagmanager.com` and `t.williamchong.cloud`
  unless `ANALYTICS=1`. The resulting `net::ERR_FAILED` entries in `errors` are
  expected — ignore them.
- **Geolocation hangs the whole page.** On a bare `/`, `TaxiFareCalculator`
  auto-requests GPS and `index.vue` hides the map behind a splash until the
  promise settles. Headless Chromium never answers the permission prompt, so it
  spins forever. The driver deletes `navigator.geolocation` (making
  `isGeolocationSupported` false) so the request is never made. Set
  `GPS=22.28,114.16` to grant a fixed position and exercise the real path
  instead. A `?from=` URL sidesteps this anyway — `index.vue` passes
  `:skip-gps-auto-request="!!route.query.from"`.
- **The map is late, not broken.** `MapDisplay` is a `defineAsyncComponent`, so
  Leaflet arrives in a chunk Nuxt dev compiles on demand — many seconds after
  DOM-ready. Screenshotting on DOM-ready reliably captures MapDisplay's spinner
  overlay, which looks exactly like a failure. The driver waits for
  `.leaflet-container`.
- **`#taxi-fare-detail` existing does not mean the fare is ready.** The panel
  mounts immediately in a spinner state and settles once OSRM answers. Wait for
  `.animate-spin` to *disappear* inside it. The transit panel settles
  separately, and its loading state is `.animate-pulse`, not `.animate-spin`.
- **Nuxt UI v4 has no `<input type="checkbox">` in the DOM.** Checkboxes and
  radios are `button[role="checkbox"]` / `button[role="radio"]` carrying
  `data-state="checked|unchecked"`; collapsible triggers are also
  `button[data-state]` but with `open|closed`. Selecting on `input[type=…]`
  matches nothing. Labels live in a *sibling* wrapper, so `button.textContent`
  is empty and `filter({ hasText })` silently matches **zero** controls — use
  `getByRole('checkbox', { name })`, which resolves the name from `label[for]`.
  Radios also carry the domain value (`value="urban"`, `value="oneWay"`), which
  beats an index: the taxi-type and tunnel-fee-type groups share the
  `[role="radio"]` selector, so `nth(1)` depends on their render order.
- **Only Cross-Harbour is reachable until you expand "Other Tunnels".** It is a
  nested `UCollapsible` inside Advanced Options and its content is *unmounted*
  while closed, so those checkboxes do not exist in the DOM. The `tunnel`
  command opens it on demand.
- **The location inputs are server-rendered, so they accept keystrokes before
  Vue hydrates** — and drop them. Typing too early leaves the dropdown closed
  and looks like a broken geodata API. The driver waits for Leaflet to mount
  (the cheapest available proof hydration finished) before typing. A `?from=`
  navigation needs no such wait, so `route` overlaps the two.
- **Advanced Options may already be open.** The cross-harbour detector
  auto-expands it for harbour-crossing routes, so a blind click *closes* it.
  Use `advanced open` / `advanced close`, which read `data-state` first.
- **`search` picks dropdown result #1, which is often not what you meant.** The
  HK Government geodata API ranked "Central" as *"PetroChina Central Plaza EV
  Charging Station"*, giving a different origin (and a different fare: 121.00 vs
  133.60) than the `route` command. Use `route` with coordinates for anything
  where the number matters; use `search` only to test the input/dropdown itself.
- **`OFFLINE=1` still produces a fare, and a slightly different one.**
  `plugins/seed-cache.client.ts` seeds ROUTE and GEOCODE from
  `data/precomputed-cache.json`, so Central → TST resolves to 7.0 km / HK$131.50
  offline vs 7.1 km / HK$133.60 live. That gap is the precomputed snapshot
  ageing, not a bug — it's the cheapest way to confirm the seeding path works.
- **Nuxt DevTools overlays the form.** `devtools.enabled` is true in dev and the
  timing pill lands on the "85% Fare" row in every full-page screenshot. The
  driver injects CSS to hide `#nuxt-devtools-anchor`.
- **Distance is text, not an input.** `DistanceInput` renders `7.1 km` as a
  `<span>`; the `type="number"` input only exists after you click the
  Auto/Manual badge to enter edit mode.
- **Scrape by id + `HK$ <number>`, not by label.** Four locales are live and
  `@nuxtjs/i18n` uses `strategy: 'prefix_and_default'`, so Accept-Language can
  redirect you to `/zh-hk`. The driver always navigates with an explicit
  `/<locale>` prefix.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `browserType.launch: Executable doesn't exist at …chromium_headless_shell-1208` | `npx playwright-core install chromium` — the cached build is from an older playwright-core |
| `Cannot find package 'playwright-core'` | The script must live inside the repo; ESM resolves from the *file's* directory, not `cwd` |
| `[get-port] Unable to find an available port (tried 3000…). Using alternative port 3002` | Something else holds 3000 (`lsof -nP -iTCP:3000 -sTCP:LISTEN`). Always launch with `--port 3123` |
| Map area is a grey box with a spinner | Not an error — the Leaflet chunk is still compiling. The driver waits; if you screenshot by hand, wait for `.leaflet-container` |
| `errors` reports `net::ERR_FAILED` for googletagmanager / t.williamchong.cloud | Expected: the driver blocks analytics on purpose |
| `advanced` reports `checkboxes: []` | The collapsible got closed. Run `advanced open` |
| `tunnel X` errors waiting for `[data-state="checked"]` | The name matched nothing or matched the wrong control — run `options` to see the exact labels |
| Result has `"timedOut": ["fare"]` and `totalFare: null` | OSRM did not answer. Check the network, or use `OFFLINE=1` to test against the precomputed cache instead |
