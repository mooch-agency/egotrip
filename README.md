# Egotrip

The sunniest cities around you.

Egotrip ranks 80 places by how much sun they'll get over the next two weeks and how long it takes to fly there from wherever you are. Each place comes with somewhere to take calls, things to do after hours and a cover story for the office. A plaything by [Mooch](https://mooch.agency).

## Run it

Needs Node 20.9+ and pnpm. No API keys.

```bash
pnpm install
```

```bash
pnpm dev
```

Open http://localhost:3000. In local dev there are no Vercel geo headers, so your starting point is Lisbon until you pick another city.

Optional: copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_APP_URL` to the deployed URL so canonical links, Open Graph cards and the sitemap point at the right host.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests (lib, data integrity, route handlers) |
| `pnpm test:e2e` | Playwright against a production server on port 3200 (run `pnpm build` first) |
| `pnpm test:all` | All of the above, in order |

First e2e run: `pnpm exec playwright install chromium`.

## How it works

- **Forecast.** `/api/forecast` asks [Open-Meteo](https://open-meteo.com) for all 80 places in one request: 14 days of weather code, highs and lows, sunshine and daylight duration, rain chance and UV. Cached at the edge for an hour (stale-while-revalidate for a day). If Open-Meteo fails, the route returns a 502 and the UI says the live forecast is unavailable. We never invent weather.
- **Reading a day.** Open-Meteo's daily weather code is the worst hour, so one shower turns a sunny day into "drizzle". `dayKind` in `lib/forecast/weather-codes.ts` uses sunshine as a share of daylight instead (70%+ sunny, 40%+ partly sunny) and only lets the code win when rain is 60% likely or more.
- **Origin.** Saved city first (localStorage), then an approximate location from Vercel's IP headers (`/api/whereami`, no prompt), then Lisbon. Precise location only when someone clicks "Use my precise location", and it stays in the browser. City search uses Open-Meteo geocoding.
- **Flight time.** Great-circle distance × 1.1, at 830 km/h, plus 40 minutes, rounded to 15. Always labelled "about". Under 150 km reads "You're here".
- **Ranking.** `lib/rank.ts` filters by flight radius, region, crowd level and search, then sorts by mean sunshine over the next 7 days (or closest, or warmest). Without a live forecast it falls back to each place's typical sunshine and says so.
- **Radius.** The list opens on 6 hours. If that reaches fewer than 5 places (Tokyo, Honolulu), `autoRadius` widens to 9h, then 12h, then any distance, and the status line says so. The place page reads the same default ranking for "26 of 30", "Next" and "Also sunny", so the two pages agree.

## Layout

```
app/
  page.tsx                  home is the app: pitch, controls, best bet, ranked tiles, how it works
  to/[slug]/page.tsx        one place: getting there, forecast, where to work, after hours, cover story, also sunny
  api/forecast, api/whereami
  opengraph-image.tsx, to/[slug]/opengraph-image.tsx, apple-icon.tsx, icon.svg
  sitemap.ts, robots.ts, manifest.ts, not-found.tsx
components/
  site/                     app bar (origin + theme), footer
  explorer/                 home list: controls, best bet, tiles, default ranking hook
  destination/              place page: trip card + phone dock, section tabs, forecast grid, after hours
  forecast/                 shared forecast store, sun strip, sun bars, weather icons
  origin/                   origin provider and picker (sheet on phones)
lib/
  destinations/             types, labels, data/<region>.ts (80 places), index
  forecast/                 Open-Meteo client and parser, weather codes, summaries
  geo.ts, rank.ts, origin.ts, format.ts, og.tsx
tests/unit, tests/e2e
docs/upgrade-spec.md        v2 audit, spec and plan
BRAND_VOICE.md              how Egotrip writes
```

## Adding a place

1. Add an entry to the right file in `lib/destinations/data/`. Copy the Lisbon entry in `europe-west.ts` for shape.
2. Follow [BRAND_VOICE.md](BRAND_VOICE.md): 4-5 real workspaces you've checked exist, 5-6 places, 3 alibis, 2 "spotted" lines. No em dashes, no banned words.
3. Run `pnpm test`. The data integrity test checks slugs, coordinates, counts, lengths and copy rules.

Order matters: the forecast request maps results back by array position, so append rather than insert if you can.

## Deploy

Vercel project `v0-egotrip`, connected to `mooch-agency/egotrip`. Every push builds: `main` to production, other branches to a preview (behind Vercel login). Install and build commands are left to auto-detection, so Vercel uses pnpm from `pnpm-lock.yaml`. No env vars are required; set `NEXT_PUBLIC_APP_URL` for canonical links and OG URLs.

## Design

The visual language comes from the mooch.agency design system: paper and ink palette, Instrument Serif headings with one italic word, mono labels, hairline grids, pill buttons and segmented controls, blur reveal with a reduced-motion guard. The page structure is Egotrip's own: an app, not an agency site. Home opens straight on the list; a place page leads with "Getting there" and keeps the booking link in a dock on phones. Two borrowed colours, `--sun` and `--rain`, are only for forecast marks. Light and dark follow the system unless toggled.

`/destinations` (the v1 list page) redirects to `/` permanently; `/sun` is a short alias for `/`.

## Credits

Weather data by [Open-Meteo](https://open-meteo.com), CC BY 4.0. Flight times are estimates, not schedules. Venues change: check before you go.
