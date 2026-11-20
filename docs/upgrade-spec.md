# Egotrip v2: audit, spec and plan

Written 19 Nov 2026. Branch `upgrade-v2`.

## 1. Audit of v1 (main @ 94c31a1)

### Broken
- **"Proceed to Booking" does nothing.** `RedirectWarning` renders a `<Dialog>` with no `open` prop, so it never shows and the flights link never opens.
- **Workspace tab ignores the data.** Every city shows the same hardcoded "Wi-Fi: Excellent" and the same 3 alibis. The per-city `workspaces`, `alibis` and `founderHistory` arrays are never rendered.
- **IP fallback is dead code.** `getUserLocation()` never throws, so the `catch` that calls ipapi.co never runs. Denied geolocation always lands on Lisbon.
- **Fake weather.** When the API fails, `generateFallbackForecast` invents random temperatures with `Math.random()` and presents them as a forecast.
- **6-second fake loading screen.** `LoadingInterstitial minDuration={6000}` blocks the page even when data is ready.
- **Filter reset is wrong.** `handleReset` drops `maxPrice` (a type error hidden by `ignoreBuildErrors: true`), and there's no price control anyway.
- **Missing assets.** Layout and manifest point at `favicon-16x16.png`, `favicon-32x32.png`, `safari-pinned-tab.svg`, `android-chrome-*.png`: none exist. OG and Twitter images are SVG, which Facebook, X and LinkedIn don't render.
- **Placeholder Google verification code** shipped in metadata.

### Risky
- Next 15.2.4 is behind the React Server Components security patches (CVE-2025-55182 and follow-ups). Several deps pinned to `latest`.
- `typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` both on.
- 20 server-action calls per page load (one per city), each a separate OpenWeatherMap request. Free tier is 5 days, so "longer forecasts" was impossible.
- Geolocation prompt fires on page load with no user gesture.
- ipapi.co would send the visitor's IP to a third party without consent.

### Bloat
- 50+ shadcn components, ~30 Radix packages, framer-motion, recharts, react-day-picker, etc. The app uses about 6 of them.
- 28 MB of PNG/JPEG city photos in `public/images`.
- Unused: `app/api/rate-limiter.ts`, `hooks/use-toast.ts` (duplicate), `styles/`, `scripts/generate-icons.js`, two manifests.

### Design and copy
- Amber-on-zinc dark theme, Inter, gradient photo cards. Nothing like mooch.agency.
- Copy leans on ellipses and banned-word snobbery ("rather... pedestrian", "discerning", "curated"). The joke gets lost in the adjectives.

## 2. Goals

1. 20 → 80 destinations across 8 regions, each with 4-5 real workspaces, 5-6 places of interest, 3 alibis, 2 "spotted" lines.
2. 3-day → 14-day live forecasts with real sunshine hours, rain chance and UV.
3. mooch.agency design system end to end: tokens, type, buttons, motion, editorial layout.
4. Copy rewritten to the new [BRAND_VOICE.md](../BRAND_VOICE.md).
5. Fix every broken item above.
6. Unit and end-to-end tests for backend and frontend.

## 3. Done when

- [x] `pnpm build` passes with type checking on (no `ignoreBuildErrors`).
- [x] 80 destinations, all passing the data integrity test (unique slugs, valid coords, field lengths, counts, no em dashes or banned words).
- [x] `/api/forecast` returns 14 days for every destination from one batched Open-Meteo request, cached 1 hour, and a clean 502 on upstream failure (no invented weather).
- [x] `/destinations` ranks by sun within a chosen flight radius from the visitor's origin, with region, crowd and search filters.
- [x] `/to/<slug>` detail pages: 14-day forecast, workspaces, places, alibis with copy, flight estimate and a working Google Flights link.
- [x] Origin: approximate from Vercel IP headers (no prompt), precise on click, or search any city worldwide; persisted per visitor.
- [x] Visual parity with mooch.agency tokens (palette, Instrument Serif, mono eyebrows, hairlines, `.pill` / `.ghost`, blur reveal with reduced-motion guard), light and dark.
- [x] PNG Open Graph images, valid favicons and manifest, generated sitemap and robots.
- [x] Vitest unit suite and Playwright e2e suite green against a production build.

## 4. Architecture

```
app/
  layout.tsx              fonts (Instrument Serif via next/font), theme, metadata
  globals.css             Tailwind v4 + mooch tokens + .pill/.ghost/.eyebrow/.reveal
  page.tsx                home
  destinations/page.tsx   ranked list (server shell, client explorer)
  to/[slug]/page.tsx      detail, statically generated for all 80
  api/forecast/route.ts   GET all forecasts (one Open-Meteo call, 1 h cache)
  api/whereami/route.ts   GET approximate origin from Vercel geo headers
  opengraph-image.tsx     PNG OG card; to/[slug]/opengraph-image.tsx per city
  sitemap.ts, robots.ts, manifest.ts, not-found.tsx
components/               site chrome, explorer, forecast, origin picker
lib/
  destinations/           types, data/<region>.ts, index (all, bySlug)
  forecast/               Open-Meteo client, parsing, summaries, weather codes
  geo.ts                  haversine, flight estimate, formatting
  rank.ts                 pure filter + sort
tests/unit, tests/e2e
```

### Forecast
- Source: Open-Meteo `/v1/forecast`, all 80 coordinates in one request, `forecast_days=14`, `timezone=auto`, daily `weather_code, temperature_2m_max, temperature_2m_min, sunshine_duration, daylight_duration, precipitation_probability_max, uv_index_max`. No API key. 7 variables (under 10) and ≤ 14 days keeps each location at 1 weighted call: ~80 calls per refresh, ~2k a day at a 1-hour cache, inside the 10k free limit.
- Route sets `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on success, `no-store` on failure. 8-second upstream timeout. Response validated before it's served.
- Daily `weather_code` is the worst hour of the day, so a sunny day with one shower reads as drizzle. `dayKind` classifies days by sunshine as a share of daylight (≥ 70% sunny, ≥ 40% partly sunny) and only defers to the code when rain chance is ≥ 60%. Found during visual QA: Marseille showed "0 of 14 days clear" with 7.4 h of sun a day.
- Client derives "sun this week" (mean daily sunshine hours, next 7 days) for ranking. Without a forecast it falls back to `avgSunHours` and says so.

### Flight estimate
Great-circle distance × 1.1 routing factor at 830 km/h, plus 40 minutes for climb, descent and taxi, rounded to 15 minutes. Labelled "about" and "direct" everywhere.

### Origin
1. Saved origin (localStorage) if present.
2. Otherwise `/api/whereami` (Vercel `x-vercel-ip-*` headers; Lisbon in local dev).
3. "Use my location" asks the browser, only on click.
4. "Change city" searches Open-Meteo geocoding (any city) with popular picks as a shortcut.

## 5. Design system mapping

Lifted from mooch.agency `tokens.css`, `ui.css`, `motion.css` and the homepage styles:

| mooch | Egotrip |
|---|---|
| `--paper`, `--ink`, `--black`, `--muted`, `--muted-small`, `--hairline`, `--surface` | Same values; dark theme uses mooch's `[data-theme=dark]` remap, toggled via `.dark` |
| Instrument Serif headings, system sans body at 17px, mono 11px uppercase eyebrows | Same |
| `.pill`, `.ghost` (980px radius, 0.96 press, ink focus ring) | Same, as React `<Pill>` / `<Ghost>` link and button variants |
| `.reveal` blur settle, `--ease-decide`, `--t-decide`, reduced-motion guard | Same, CSS only |
| `.topbar`, `.section-num` with rule, `.work-row` editorial list | Topbar, numbered sections, destination rows |
| `.copy-btn` mono chip | Alibi copy buttons |
| One borrowed colour, decorative marks only | `--sun` for forecast sun marks only, never text |

City photos are retired: the agency style is type-led, and 60 new cities had no photos. The forecast strip is the visual.

## 6. Plan and owners

| # | Work | Owner |
|---|---|---|
| 1 | Schema, voice guide, Lisbon reference entry | Opus (main) |
| 2 | 79 destinations, 6 region groups in parallel, with venue verification | 6 × Sonnet |
| 3 | Dependency upgrade (Next 16, React 19.3, Tailwind 4), dead code and asset cleanup | Opus (main) |
| 4 | Forecast, geo, rank libraries and API routes | Opus (main) |
| 5 | Design system, pages and components | Opus (main) |
| 6 | Unit tests (lib, data integrity, route handlers) | Sonnet |
| 7 | Playwright e2e against a production build | Sonnet |
| 8 | Independent review of the finished diff | Opus |
| 9 | Fix findings, final build and full test run | Opus (main) |

## 7. Out of scope

- Real flight prices or live schedules (needs a paid API).
- Accounts, saved trips, notifications.
- Deploying. Nothing is pushed or deployed without Tahi's go-ahead.

## 8. Independent review: what changed

An Opus review of the finished diff found 13 issues. Fixed:

- **Stale forecast stamped as fresh.** Next's data cache serves a stale entry while it refreshes, and `generatedAt` was "now", so a days-old forecast could look new. `generatedAt` now comes from Open-Meteo's `Date` header, and clients drop days that are already over at each destination (`lib/forecast/today.ts`), using time zones now included in the payload. The data cache stays: dropping it (tried first) made every request go upstream, and at 80 weighted calls per request against Open-Meteo's 600 a minute, the e2e run hit 429s within seconds.
- **Forecast state per component.** `useForecasts` is now one shared store (`useSyncExternalStore`), so a retry anywhere updates everything. Data older than an hour refreshes on mount or when the tab becomes visible.
- **IP lookup could overwrite a city picked while it loaded.** The user's pick now wins.
- **Origin picker:** state resets on every close, aborted searches no longer flash "no results", and focus starts in the search field on desktop (not on touch, where the keyboard would cover the list).
- **Flight search from "Your area".** Only real place names go into the Google Flights query (`searchableName`); IP locations without a city fall back to the country name.
- **Screen readers:** desktop row values get labels, decorative ✈ ☀ are hidden, and forecast conditions are no longer read twice.
- **Dark-mode "Copied" contrast:** `--success` gets a dark value.
- **"Mostly sunny" at 40% sun wasn't honest.** Days are now "sunny" (70%+ of daylight) or "partly sunny" (40%+).
- **Empty state blamed distance when a search emptied the list.** It now says which.
- **Top picks from far-off origins** (Honolulu, Auckland) showed 2-3 rows. The radius widens until there are 5, and says so.
- **One bad value late in any city's forecast failed all 80.** The parser now cuts that city at the gap (after day 7) instead.
- Cleanup: unused CSS tokens and classes, needless exports, `SITE_URL` in one place (`lib/site.ts`), GPS coordinates rounded to ~1 km before storing.

Declined:

- **Self-hosting the font from the TTFs** to skip the build-time Google Fonts fetch: the TTFs are about twice the size of the woff2 subsets next/font serves, and Vercel builds have network.
- **Marquee pause control.** It's decorative (`aria-hidden`), pauses on hover and stops under reduced motion, but WCAG 2.2.2 asks for a pause control for any motion over 5 seconds. Open question for design: add a small pause toggle or make it static.
