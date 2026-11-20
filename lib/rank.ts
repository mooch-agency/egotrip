// Filter and sort destinations for the explorer. Pure, so it's unit-tested
// directly and runs identically on server and client.

import type { CrowdLevel, Destination, Region } from "./destinations/types"
import type { ForecastDay } from "./forecast/types"
import { avgHigh, avgSun } from "./forecast/summary"
import { flightHours, type LatLng } from "./geo"

const SORTS = ["sun", "closest", "warmest"] as const
export type SortKey = (typeof SORTS)[number]

export interface Filters {
  maxHours: number | null // null = any distance
  regions: Region[] // empty = all
  crowd: CrowdLevel[] // empty = all
  query: string
}

// The radius the app starts on, and the steps it widens through when that
// reaches too few places (from Honolulu or Auckland, 6 hours reaches almost
// nothing). null = any distance.
export const DEFAULT_RADIUS = 6

export const DEFAULT_FILTERS: Filters = { maxHours: DEFAULT_RADIUS, regions: [], crowd: [], query: "" }

export const WIDEN_STEPS: readonly (number | null)[] = [DEFAULT_RADIUS, 9, 12, null]
export const MIN_RESULTS = 5

/** The smallest radius step that reaches at least `min` destinations from `origin`. */
export function autoRadius(destinations: Destination[], origin: LatLng, min = MIN_RESULTS): number | null {
  for (const step of WIDEN_STEPS) {
    if (step === null) return null
    if (destinations.filter((d) => flightHours(origin, d) <= step).length >= min) return step
  }
  return null
}

export interface Ranked {
  destination: Destination
  hours: number // Estimated direct flight time from origin
  sun: number // Mean daily sunshine hours, next 7 days (or typical if no forecast)
  sunSource: "forecast" | "typical"
  high: number | null // Mean daily high, next 7 days
  forecast: ForecastDay[] | undefined
}

// Accent-insensitive, case-insensitive matching: "malaga" finds "Málaga".
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()

export function rank(
  destinations: Destination[],
  {
    origin,
    forecasts,
    filters,
    sort,
  }: {
    origin: LatLng
    forecasts: Record<string, ForecastDay[]> | null
    filters: Filters
    sort: SortKey
  },
): Ranked[] {
  const q = fold(filters.query.trim())

  const rows: Ranked[] = destinations.map((destination) => {
    const forecast = forecasts?.[destination.slug]
    const liveSun = avgSun(forecast)
    return {
      destination,
      hours: flightHours(origin, destination),
      sun: liveSun ?? destination.avgSunHours,
      sunSource: liveSun === null ? "typical" : "forecast",
      high: avgHigh(forecast),
      forecast,
    }
  })

  const kept = rows.filter(({ destination: d, hours }) => {
    if (filters.maxHours !== null && hours > filters.maxHours) return false
    if (filters.regions.length && !filters.regions.includes(d.region)) return false
    if (filters.crowd.length && !filters.crowd.includes(d.crowd)) return false
    if (q && !fold(`${d.name} ${d.country} ${d.region}`).includes(q)) return false
    return true
  })

  const byName = (a: Ranked, b: Ranked) => a.destination.name.localeCompare(b.destination.name)
  const compare: Record<SortKey, (a: Ranked, b: Ranked) => number> = {
    sun: (a, b) => b.sun - a.sun || a.hours - b.hours || byName(a, b),
    closest: (a, b) => a.hours - b.hours || b.sun - a.sun || byName(a, b),
    // Unknown highs sink to the bottom.
    warmest: (a, b) => (b.high ?? -99) - (a.high ?? -99) || b.sun - a.sun || byName(a, b),
  }
  return kept.sort(compare[sort])
}
