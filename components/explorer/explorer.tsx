"use client"

// The app's main screen: the ranked list and its controls. It opens on the
// sunniest places within the auto radius (6h, widened for far-flung origins,
// see autoRadius), features #1 as the best bet, then tiles the rest. Origin
// and forecast load in parallel; skeletons hold the layout until both are in,
// so the list never reshuffles. If the forecast fails we rank on typical
// sunshine and say so.

import { useId, useMemo, useState } from "react"
import { destinations, REGIONS, CROWD_LEVELS, CROWD_CHIP, type CrowdLevel, type Region } from "@/lib/destinations"
import { autoRadius, DEFAULT_RADIUS, rank, type SortKey } from "@/lib/rank"
import { searchableName } from "@/lib/origin"
import { useOrigin } from "@/components/origin/origin-provider"
import { useForecasts } from "@/components/forecast/use-forecasts"
import { BestBet, BestBetSkeleton } from "./best-bet"
import { DestinationTile, DestinationTileSkeleton } from "./destination-tile"

const RADII: { label: string; value: number | null }[] = [
  { label: "2h", value: 2 },
  { label: "4h", value: 4 },
  { label: "6h", value: 6 },
  { label: "9h", value: 9 },
  { label: "12h", value: 12 },
  { label: "Any", value: null },
]
const SORT_LABELS: Record<SortKey, string> = { sun: "Sunniest", closest: "Closest", warmest: "Warmest" }
const VISIBLE = 10 // Places shown before "Show all", best bet included

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

export function Explorer() {
  const { origin } = useOrigin()
  const forecast = useForecasts()
  const ids = { radius: useId(), sort: useId(), panel: useId() }

  // "auto" follows autoRadius until someone picks a radius themselves.
  const [radius, setRadius] = useState<number | null | "auto">("auto")
  const [sort, setSort] = useState<SortKey>("sun")
  const [query, setQuery] = useState("")
  const [regions, setRegions] = useState<Region[]>([])
  const [crowd, setCrowd] = useState<CrowdLevel[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const ready = origin !== null && forecast.status !== "loading"
  const forecasts = forecast.status === "ready" ? forecast.data.forecasts : null
  const auto = useMemo(() => (origin ? autoRadius(destinations, origin) : DEFAULT_RADIUS), [origin])
  const maxHours = radius === "auto" ? auto : radius

  const results = useMemo(() => {
    if (!origin || !ready) return []
    return rank(destinations, { origin, forecasts, filters: { maxHours, regions, crowd, query }, sort })
  }, [origin, ready, forecasts, maxHours, regions, crowd, query, sort])

  // "Show all" applies to the list it was pressed on; any filter change folds it again.
  const signature = JSON.stringify([maxHours, regions, crowd, query, sort])
  const [expandedFor, setExpandedFor] = useState<string | null>(null)
  const expanded = expandedFor === signature

  const featured = sort === "sun" && !query.trim() && results.length > 1 ? results[0] : null
  const rest = featured ? results.slice(1) : results
  const shown = expanded ? rest : rest.slice(0, VISIBLE - (featured ? 1 : 0))

  const from = searchableName(origin) ?? "you"
  const narrowed = query.trim() !== "" || regions.length > 0 || crowd.length > 0
  const isDefault = radius === "auto" && sort === "sun" && !narrowed
  const activeFilters = regions.length + crowd.length
  const nextRadius = RADII.find((r) => maxHours !== null && (r.value === null || r.value > maxHours))
  const updated =
    forecast.status === "ready"
      ? new Date(forecast.data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : null

  function reset() {
    setRadius("auto")
    setSort("sun")
    setQuery("")
    setRegions([])
    setCrowd([])
  }

  return (
    <div>
      {/* Controls. Sticky on desktop only: on a phone four rows of controls would eat the screen. */}
      <div className="-mx-[var(--pad-x)] border-y border-hairline bg-paper px-[var(--pad-x)] py-3 lg:sticky lg:top-0 lg:z-10">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <span id={ids.radius} className="label max-lg:sr-only">
              Max flight
            </span>
            <div className="seg w-full lg:w-auto" role="group" aria-labelledby={ids.radius}>
              {RADII.map((r) => (
                <button key={r.label} type="button" aria-pressed={maxHours === r.value} onClick={() => setRadius(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <span id={ids.sort} className="label max-lg:sr-only">
              Sort
            </span>
            <div className="seg w-full lg:w-auto" role="group" aria-labelledby={ids.sort}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <button key={key} type="button" aria-pressed={sort === key} onClick={() => setSort(key)}>
                  {SORT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="order-first flex w-full gap-2.5 lg:order-none lg:w-auto lg:flex-[1_1_300px] lg:justify-end">
            <label className="search min-w-0 flex-1 lg:max-w-[300px]">
              <span className="sr-only">Search</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                className="field"
                placeholder="City, country or region"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="chip"
              aria-expanded={filtersOpen}
              aria-controls={ids.panel}
              onClick={() => setFiltersOpen((o) => !o)}
            >
              Filters
              {activeFilters > 0 ? (
                <span className="n">{activeFilters}</span>
              ) : (
                <span className="n hidden sm:inline">Region, crowds</span>
              )}
            </button>
          </div>
        </div>

        {/* Always mounted (hidden when closed) so the toggle's aria-controls resolves. */}
        <div
          id={ids.panel}
          hidden={!filtersOpen}
          className="mt-3 grid gap-5 border-t border-hairline pt-4 pb-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
        >
            <fieldset>
              <legend className="label mb-2.5">Region</legend>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((region) => (
                  <button
                    key={region}
                    type="button"
                    className="chip"
                    aria-pressed={regions.includes(region)}
                    onClick={() => setRegions((r) => toggle(r, region))}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label mb-2.5">Crowds</legend>
              <div className="flex flex-wrap gap-2">
                {CROWD_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="chip"
                    aria-pressed={crowd.includes(level)}
                    onClick={() => setCrowd((c) => toggle(c, level))}
                  >
                    {CROWD_CHIP[level]}
                  </button>
                ))}
              </div>
            </fieldset>
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-4">
        <div role="status" aria-live="polite">
          <p className="label">
            {ready
              ? `${results.length} ${results.length === 1 ? "place" : "places"} ${
                  maxHours === null ? "at any distance" : `within ${maxHours}h of ${from}`
                }${updated ? ` · Forecast ${updated}` : ""}`
              : "Checking the skies"}
          </p>
          {ready && radius === "auto" && auto !== DEFAULT_RADIUS && (
            <p className="label mt-1" data-testid="widened">
              {auto === null
                ? `Not much within 12 hours of ${from}, so from anywhere.`
                : `Not much within ${DEFAULT_RADIUS} hours of ${from}, so up to ${auto} hours.`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-5">
          {!isDefault && (
            <button type="button" className="label min-h-11 cursor-pointer underline decoration-hairline-focus underline-offset-4 hover:text-ink" onClick={reset}>
              Reset filters
            </button>
          )}
          <a href="#how" className="label inline-flex min-h-11 items-center underline decoration-hairline-focus underline-offset-4 hover:text-ink">
            How we rank
          </a>
        </div>
      </div>

      {forecast.status === "error" && (
        <div className="card mb-5 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <p>Live forecast unavailable. Ranking on typical sunshine instead.</p>
          <button type="button" className="ghost" onClick={forecast.retry}>
            Try again
          </button>
        </div>
      )}

      {!ready ? (
        <div aria-busy="true">
          <span className="sr-only">Loading places</span>
          <BestBetSkeleton />
          <ol className="tiles mt-12 grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]">
            {Array.from({ length: 6 }, (_, i) => (
              <DestinationTileSkeleton key={i} />
            ))}
          </ol>
        </div>
      ) : results.length ? (
        <div data-testid="results">
          {featured && <BestBet item={featured} />}
          {shown.length > 0 && (
            <>
              {featured && (
                <h2 className="h2 mt-14 mb-5 text-[28px] sm:text-[32px]">
                  Also sunny, <em>{maxHours === null ? "anywhere" : `within ${maxHours} hours`}</em>.
                </h2>
              )}
              <ol
                className="tiles grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]"
                aria-label={`Places, ${SORT_LABELS[sort].toLowerCase()} first`}
              >
                {shown.map((item, i) => (
                  <DestinationTile key={item.destination.slug} item={item} rank={i + (featured ? 2 : 1)} />
                ))}
              </ol>
            </>
          )}
          {shown.length < rest.length && (
            <div className="mt-7 flex justify-center">
              <button type="button" className="ghost" onClick={() => setExpandedFor(signature)}>
                Show all {results.length}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card px-6 py-16 text-center">
          <p className="h2">{narrowed ? "Nothing matches that." : "Nothing sunny that close."}</p>
          <p className="lead mx-auto mt-4 max-w-[40ch]">
            {narrowed ? "Check the spelling, widen the radius or drop a filter." : "Widen the radius."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {nextRadius && (
              <button type="button" className="pill" onClick={() => setRadius(nextRadius.value)}>
                {nextRadius.value === null ? "Show any distance" : `Show up to ${nextRadius.label}`}
              </button>
            )}
            <button type="button" className="ghost" onClick={reset}>
              Reset filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
