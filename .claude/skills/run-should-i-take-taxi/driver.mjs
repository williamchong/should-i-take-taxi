#!/usr/bin/env node
// Agent driver for "Should I Take Taxi?".
//
// Drives the running Nuxt dev/preview server with playwright-core (already a
// devDependency) and the Chromium that `npx playwright-core install chromium`
// puts in ~/Library/Caches/ms-playwright. Everything here is scraped in a
// locale-independent way (ids, `value` attributes, `HK$ <number>` regexes) so
// the same commands work against /en-hk and /zh-hk.
//
// Usage (from the repo root, dev server already listening):
//   node .claude/skills/run-should-i-take-taxi/driver.mjs route 22.281886,114.159360 22.300093,114.172575
//   node .claude/skills/run-should-i-take-taxi/driver.mjs search "Central" "Tsim Sha Tsui"
//   node .claude/skills/run-should-i-take-taxi/driver.mjs shot /zh-hk
//   node .claude/skills/run-should-i-take-taxi/driver.mjs eval "document.title"
//   node .claude/skills/run-should-i-take-taxi/driver.mjs repl   # stdin commands, one per line
//
// Env:
//   BASE_URL    default http://localhost:3123
//   LOCALE      default en-hk  (path prefix; @nuxtjs/i18n strategy is prefix_and_default)
//   HEADED=1    show the browser window
//   GPS=lat,lng grant geolocation at a fixed point instead of disabling it
//   OFFLINE=1   block the external APIs, exercising only the precomputed cache
//   ANALYTICS=1 re-enable GA4/PostHog (blocked by default)
//   SHOT=0      skip screenshots (JSON only — faster, and no image tokens)
//   SHOT_DIR    default .claude/skills/run-should-i-take-taxi/shots

import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3123'
const LOCALE = process.env.LOCALE || 'en-hk'
const SHOT_DIR = resolve(process.env.SHOT_DIR || '.claude/skills/run-should-i-take-taxi/shots')
const LOCALES = ['en-hk', 'zh-hk', 'zh-tw', 'zh-cn']

// Every selector the app's DOM shape forces on us, in one place — half are used
// from Node locators and half from inside page.evaluate, so they drifted apart
// when they were inlined at both ends.
const SEL = {
  startInput: '#startLocation',
  endInput: '#endLocation',
  farePanel: '#taxi-fare-detail',
  transitPanel: '#transit-detail',
  fareTotal: '.text-5xl',
  fareRow: '.grid.grid-cols-2 > span',
  transitTime: '.text-2xl',
  transitSummary: '.text-sm.text-muted p',
  fareSpinner: '.animate-spin',
  transitSkeleton: '.animate-pulse',
  map: '.leaflet-container',
  dropdownOption: 'ul li.cursor-pointer',
  distance: 'span.font-bold',
  // Checkboxes are ALSO button[data-state] (=checked/unchecked), so a
  // collapsible has to be matched on the open/closed states only it carries.
  collapsible: 'button[data-state="open"], button[data-state="closed"]',
}

// The app calls out to these on every real calculation. OFFLINE=1 aborts them
// so you can prove the precomputed-cache seeding path renders a fare alone.
// Source of truth for the list: the preconnect hints in nuxt.config.ts.
const EXTERNAL_HOSTS = [
  'router.project-osrm.org',
  'nominatim.openstreetmap.org',
  'engine.justusewheels.com',
  'www.map.gov.hk',
  'www.geodetic.gov.hk',
]

// @nuxt/scripts loads GA4 and PostHog on `onNuxtReady` with the PRODUCTION ids
// from nuxt.config.ts — there is no dev guard. Every driver run would otherwise
// register as a brand-new first-visit user in the live dashboards. Always
// blocked; set ANALYTICS=1 only if you are deliberately testing the tracking.
const ANALYTICS_HOSTS = [
  'www.google-analytics.com',
  'www.googletagmanager.com',
  'region1.google-analytics.com',
  't.williamchong.cloud',
]

const MAX_LOG = 200

let browser, page
const consoleErrors = []
const failedRequests = []
// Every wait below is best-effort — a hard failure would cost the caller the
// partial result. Record what expired instead, so `{"totalFare": null}` after a
// long stall is self-explaining rather than prompting a blind re-run.
let timedOut = []

function log(arr, entry) {
  if (arr[arr.length - 1] === entry) return
  if (arr.push(entry) > MAX_LOG) arr.shift()
}

async function settle(promise, label) {
  try {
    await promise
    return true
  } catch {
    timedOut.push(label)
    return false
  }
}

async function open() {
  if (page) return page
  browser = await chromium.launch({ headless: !process.env.HEADED })
  const gps = process.env.GPS?.split(',').map(Number)
  if (gps && (gps.length !== 2 || !gps.every(Number.isFinite))) {
    throw new Error(`GPS must be "lat,lng", got "${process.env.GPS}"`)
  }
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1400 },
    locale: LOCALE.startsWith('zh') ? 'zh-HK' : 'en-HK',
    ...(gps
      ? { permissions: ['geolocation'], geolocation: { latitude: gps[0], longitude: gps[1] } }
      : {}),
  })

  await context.addInitScript(({ disableGps }) => {
    if (disableGps) {
      // On a bare `/` the calculator auto-requests GPS and index.vue hides the
      // whole map behind a splash spinner until the promise settles. Headless
      // Chromium never answers the permission prompt, so it spins forever.
      // Removing navigator.geolocation makes isGeolocationSupported false,
      // which skips the request entirely. GPS=lat,lng exercises the real path.
      Object.defineProperty(navigator, 'geolocation', { get: () => undefined })
    }
    // devtools: { enabled: NODE_ENV === 'development' } in nuxt.config.ts floats
    // a timing pill over the form — it lands on the "85% Fare" row and shows up
    // in every full-page screenshot. Hide the host rather than disabling
    // devtools, so the human path is unaffected.
    const inject = () => {
      const style = document.createElement('style')
      style.textContent = 'nuxt-devtools-anchor,#nuxt-devtools-anchor,#nuxt-devtools-container{display:none !important}'
      document.head?.appendChild(style)
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject)
    } else {
      inject()
    }
  }, { disableGps: !gps })

  const blocked = [
    ...(process.env.ANALYTICS ? [] : ANALYTICS_HOSTS),
    ...(process.env.OFFLINE ? EXTERNAL_HOSTS : []),
  ]
  // Register one host-scoped pattern each rather than a catch-all: Playwright
  // matches the glob driver-side, so non-matching requests never round-trip
  // through Node. Under Nuxt dev that is hundreds of module requests per load.
  for (const host of blocked) {
    await context.route(`**://${host}/**`, (route) => route.abort())
  }

  context.on('console', (m) => { if (m.type() === 'error') log(consoleErrors, m.text()) })
  context.on('weberror', (e) => log(consoleErrors, `pageerror: ${e.error().message}`))
  context.on('requestfailed', (r) => {
    // Requests we aborted ourselves are not findings.
    if (blocked.includes(new URL(r.url()).hostname)) return
    log(failedRequests, `${r.method()} ${r.url()} :: ${r.failure()?.errorText}`)
  })

  page = await context.newPage()
  return page
}

async function close() {
  await browser?.close()
  browser = page = undefined
}

function localePath(path = '/') {
  const p = path.startsWith('/') ? path : `/${path}`
  // prefix_and_default: en-hk is reachable at both / and /en-hk. Always use an
  // explicit prefix so Accept-Language never redirects us somewhere else — but
  // never double-prefix a path that already names *any* configured locale.
  const named = LOCALES.some((l) => p === `/${l}` || p.startsWith(`/${l}/`) || p.startsWith(`/${l}?`))
  return named ? p : `/${LOCALE}${p === '/' ? '' : p}`
}

// Returns the map-ready promise instead of awaiting it: the fare calculation
// runs in the page concurrently with the Leaflet chunk compiling, so callers
// should only block on the map immediately before screenshotting.
async function goto(path) {
  const p = await open()
  const url = new URL(localePath(path), BASE_URL).toString()
  // A cold Nuxt dev route compile genuinely takes this long; the rest do not.
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  // #startLocation is rendered unconditionally and ships in the SSR HTML, so
  // this resolves at once unless something is badly wrong.
  await p.locator(SEL.startInput).waitFor({ state: 'visible', timeout: 10_000 })
  // MapDisplay is a defineAsyncComponent, so Leaflet arrives in a separate
  // chunk Nuxt dev compiles on demand. Screenshotting before it lands captures
  // MapDisplay's spinner overlay, which looks exactly like a broken map.
  const mapReady = settle(
    p.locator(SEL.map).waitFor({ state: 'visible', timeout: 15_000 }),
    'map',
  )
  return { url, mapReady }
}

// Fare panel renders `HK$ 123.45` strings; ids are locale-independent.
async function readFare() {
  const p = await open()
  const fare = await p.evaluate((sel) => {
    const money = (el) => {
      const m = el?.textContent?.match(/HK\$\s*([\d,]+\.\d{2})/)
      return m ? Number(m[1].replace(/,/g, '')) : null
    }
    const panel = document.querySelector(sel.farePanel)
    const transit = document.querySelector(sel.transitPanel)
    // DistanceInput renders "<n> km" as read-only text; the number input only
    // exists after you click the auto/manual badge to enter edit mode.
    const distance = [...document.querySelectorAll(sel.distance)]
      .map((s) => s.textContent.match(/^([\d.]+)\s*km$/))
      .find(Boolean)

    const cells = panel ? [...panel.querySelectorAll(sel.fareRow)].map((s) => s.textContent.trim()) : []
    const breakdown = []
    for (let i = 0; i + 1 < cells.length; i += 2) breakdown.push([cells[i], cells[i + 1]])

    return {
      hasPanel: !!panel,
      calculating: !!panel?.querySelector(sel.fareSpinner),
      totalFare: money(panel?.querySelector(sel.fareTotal)),
      breakdown,
      distanceKm: distance ? Number(distance[1]) : null,
      transit: transit && !transit.querySelector(sel.transitSkeleton)
        ? {
            taxiMinutes: transit.querySelectorAll(sel.transitTime)[0]?.textContent.trim() ?? null,
            transitMinutes: transit.querySelectorAll(sel.transitTime)[1]?.textContent.trim() ?? null,
            summary: transit.querySelector(sel.transitSummary)?.textContent.trim() ?? null,
          }
        : null,
      startInput: document.querySelector(sel.startInput)?.value ?? '',
      endInput: document.querySelector(sel.endInput)?.value ?? '',
      url: location.href,
    }
  }, SEL)
  return timedOut.length ? { ...fare, timedOut: [...timedOut] } : fare
}

// Both steps matter: `detached` alone is satisfied trivially while the panel
// itself has yet to mount, which reads as "settled" and returns an empty fare.
async function waitSettled(panel, loading, timeout, label) {
  const p = await open()
  if (!await settle(p.locator(panel).waitFor({ state: 'visible', timeout }), `${label}-panel`)) return
  await settle(p.locator(`${panel} ${loading}`).waitFor({ state: 'detached', timeout }), label)
}

// Both panels mount in a loading state and settle once their request returns —
// the fare's is `.animate-spin`, the transit's is `.animate-pulse`.
// transitTimeout: 0 for edits that cannot change the transit plan.
async function waitForFare(timeout = 20_000, transitTimeout = 10_000) {
  await waitSettled(SEL.farePanel, SEL.fareSpinner, timeout, 'fare')
  if (transitTimeout > 0) {
    await waitSettled(SEL.transitPanel, SEL.transitSkeleton, transitTimeout, 'transit')
  }
  return readFare()
}

async function shot(name = 'shot', mapReady) {
  if (process.env.SHOT === '0') return null
  const p = await open()
  await mapReady
  mkdirSync(SHOT_DIR, { recursive: true })
  const file = resolve(SHOT_DIR, `${name.replace(/[^\w.-]/g, '_')}.png`)
  await p.screenshot({ path: file, fullPage: true })
  return file
}

// The collapsible's DOM states are open/closed; accept the friendlier verbs too
// so `advanced close` does not read as "not closed" and toggle the panel open.
function collapsibleState(want) {
  if (/^open/.test(want)) return 'open'
  if (/^clos/.test(want)) return 'closed'
  throw new Error(`expected "open" or "close", got "${want}"`)
}

async function setAdvanced(want) {
  const p = await open()
  const trigger = p.locator(SEL.collapsible).filter({ hasText: /advanced|進階|高级|高級/i }).first()
  if (await trigger.getAttribute('data-state') === want) return
  await trigger.click()
  await p.locator(SEL.collapsible).filter({ hasText: /advanced|進階|高级|高級/i }).first()
    .and(p.locator(`[data-state="${want}"]`)).waitFor({ timeout: 5_000 })
}

const COMMANDS = {
  // shot <path> [name] — navigate and screenshot, no interaction
  async shot([path = '/', name = 'page']) {
    const { url, mapReady } = await goto(path)
    return { url, screenshot: await shot(name, mapReady), timedOut }
  },

  // route <lat,lng> <lat,lng> [name] — the share-URL path. Deterministic:
  // no typing, no dropdown timing, and it is what the SEO landing pages use.
  async route([from, to, name = 'route']) {
    if (!from || !to) throw new Error('usage: route <lat,lng> <lat,lng> [name]')
    // 6dp is what pages/index.vue writes and what coordKey() hashes the ROUTE
    // and GEOCODE caches on — anything coarser misses the precomputed seed.
    const coord = (s) => s.split(',').map((n) => Number(n).toFixed(6)).join(',')
    const { url, mapReady } = await goto(`/?from=${coord(from)}&to=${coord(to)}`)
    const fare = await waitForFare()
    return { url, ...fare, screenshot: await shot(name, mapReady) }
  },

  // search <startQuery> <endQuery> [name] — drives the real LocationSearch
  // inputs against the HK Government geodata API, including the dropdown.
  async search([start, end, name = 'search']) {
    if (!start || !end) throw new Error('usage: search <startQuery> <endQuery> [name]')
    const { mapReady } = await goto('/')
    const p = await open()
    // Unlike `route`, this one cannot overlap with the map load: the inputs are
    // server-rendered, so keystrokes sent before Vue hydrates hit an element
    // with no @input handler and the dropdown never opens. Leaflet mounting is
    // the cheapest available proof that hydration finished.
    await mapReady
    for (const [sel, query] of [[SEL.startInput, start], [SEL.endInput, end]]) {
      const input = p.locator(sel)
      await input.clear()
      // Real keystrokes, not fill(): the debounce and the IME composition
      // handlers only fire on key events, and fill() never opens the dropdown.
      await input.pressSequentially(query, { delay: 20 })
      const option = p.locator(SEL.dropdownOption).first()
      await option.waitFor({ state: 'visible', timeout: 20_000 })
      await option.click()
      await settle(option.waitFor({ state: 'detached', timeout: 5_000 }), 'dropdown')
    }
    const fare = await waitForFare()
    return { ...fare, screenshot: await shot(name, mapReady) }
  },

  // taxi <urban|newTerritories|lantau|oneWay|return> — flip a radio option
  async taxi([type]) {
    const p = await open()
    // Reka renders the chosen value on the button, so this is exact and
    // locale-independent — unlike an index, which shifts if the tunnel-fee
    // radio group ever renders before the taxi-type one.
    const radio = p.locator(`[role="radio"][value="${type ?? ''}"]`)
    if (!type || !(await radio.count())) {
      throw new Error('usage: taxi <urban|newTerritories|lantau|oneWay|return>')
    }
    await radio.click({ force: true })
    await radio.and(p.locator('[data-state="checked"]')).waitFor({ timeout: 5_000 })
    // A taxi-type change is local math on a known distance and cannot move the
    // transit plan, so don't pay the transit wait.
    return waitForFare(10_000, 0)
  },

  // advanced [open|close] — the tunnels/luggage collapsible. Idempotent: the
  // cross-harbour detector auto-expands it, so a blind click would CLOSE it.
  async advanced([want = 'open']) {
    await setAdvanced(collapsibleState(want))
    return COMMANDS.options()
  },

  // tunnel <label substring> — toggle a tunnel checkbox by its visible label
  async tunnel([match]) {
    if (!match) throw new Error('usage: tunnel <label substring>  (e.g. tunnel Cross-Harbour)')
    const p = await open()
    await setAdvanced('open')
    // getByRole resolves the accessible name from the sibling label[for], which
    // is the only place Nuxt UI puts the text — the button itself has none.
    // A plain string is a case-insensitive substring match, so no escaping.
    let box = p.getByRole('checkbox', { name: match })
    if (!(await box.count())) {
      // Every tunnel except Cross-Harbour lives in a nested collapsible whose
      // content is unmounted while closed, so the checkbox does not exist yet.
      const nested = p.locator('form').locator('button[data-state="closed"]')
      for (let i = await nested.count(); i > 0; i--) await nested.first().click()
      box = p.getByRole('checkbox', { name: match })
    }
    box = box.first()
    // No force: the nested collapsible animates open, and a forced click lands
    // on wherever the element was rather than where it ends up.
    await box.waitFor({ state: 'visible', timeout: 5_000 })
    const before = await box.getAttribute('data-state')
    await box.click()
    await box.and(p.locator(`[data-state="${before === 'checked' ? 'unchecked' : 'checked'}"]`))
      .waitFor({ timeout: 5_000 })
    // Tunnel fees are added on top of the meter fare; the transit plan is
    // unaffected.
    return waitForFare(10_000, 0)
  },

  // options — dump the current state of every form control, locale-independent
  async options() {
    const p = await open()
    return p.evaluate((sel) => {
      // Nuxt UI keeps the <label> in a SIBLING wrapper div, so neither the
      // button nor its parent has any text. Prefer label[for=id], else walk up
      // until an ancestor actually has some.
      const labelFor = (b) => {
        const byFor = b.id && document.querySelector(`label[for="${CSS.escape(b.id)}"]`)
        if (byFor?.textContent.trim()) return byFor.textContent.trim().slice(0, 70)
        for (let el = b.parentElement, i = 0; el && i < 4; el = el.parentElement, i++) {
          const text = el.textContent?.trim()
          if (text) return text.slice(0, 70)
        }
        return b.getAttribute('aria-label') || ''
      }
      const controls = (role) => [...document.querySelectorAll(`[role="${role}"]`)].map((b) => ({
        label: labelFor(b),
        value: b.getAttribute('value') ?? undefined,
        state: b.getAttribute('data-state'),
      }))
      // Nuxt UI v4 renders checkboxes/radios as button[role=...] carrying
      // data-state — there is no <input type="checkbox"> in the DOM at all.
      return {
        checkboxes: controls('checkbox'),
        radios: controls('radio'),
        collapsibles: [...document.querySelectorAll(sel.collapsible)]
          .map((b) => `${b.textContent.trim().slice(0, 30)}=${b.getAttribute('data-state')}`),
      }
    }, SEL)
  },

  // fare — re-read the panel without navigating
  async fare() {
    return readFare()
  },

  // eval <js> — escape hatch. Playwright takes a string expression and runs it
  // in the *page*, not in Node, so this is scoped to the local dev browser.
  async eval(args) {
    const p = await open()
    return p.evaluate(args.join(' '))
  },

  // errors — console errors + failed requests seen so far
  async errors() {
    return { consoleErrors, failedRequests }
  },
}

async function run(cmd, args) {
  const fn = COMMANDS[cmd]
  if (!fn) throw new Error(`unknown command "${cmd}" — try: ${Object.keys(COMMANDS).join(', ')}`)
  timedOut = []
  return fn(args)
}

// REPL only: the one-shot path already has a correctly split argv and must not
// round-trip it through a string.
function tokenize(line) {
  return (line.match(/"([^"]*)"|\S+/g) ?? []).map((t) => t.replace(/^"|"$/g, ''))
}

function emit(value) {
  console.log(JSON.stringify(value ?? null, null, 2))
}

const [cmd, ...args] = process.argv.slice(2)

if (!cmd || cmd === 'repl') {
  const rl = createInterface({ input: process.stdin })
  process.stdout.write('driver ready\n')
  let failed = false
  for await (const line of rl) {
    const [name, ...rest] = tokenize(line)
    if (!name) continue
    if (name === 'quit' || name === 'exit') break
    try {
      emit(await run(name, rest))
    } catch (err) {
      failed = true
      emit({ error: String(err.message || err) })
    }
    process.stdout.write('--- done\n')
  }
  rl.close()
  await close()
  // process.exit here would truncate buffered stdout on a pipe.
  process.exitCode = failed ? 1 : 0
} else {
  try {
    emit(await run(cmd, args))
  } catch (err) {
    console.error(String(err.stack || err))
    process.exitCode = 1
  }
  await close()
}
