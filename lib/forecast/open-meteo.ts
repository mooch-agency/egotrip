// Open-Meteo client. One request covers every destination: Open-Meteo accepts
// comma-separated latitude/longitude lists and returns an array in the same order.
// Free, no API key, 10k calls/day for non-commercial use. Keeping to ≤ 10 daily
// variables and ≤ 14 days means each location counts as 1 weighted call.

import type { ForecastDay, ForecastPayload } from "./types"

export const FORECAST_DAYS = 14
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
const DAILY_VARS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "sunshine_duration",
  "daylight_duration",
  "precipitation_probability_max",
  "uv_index_max",
] as const

export interface ForecastPoint {
  slug: string
  lat: number
  lng: number
  timezone?: string // Passed through to the payload, not sent upstream
}

export function buildForecastUrl(points: ForecastPoint[], days = FORECAST_DAYS): string {
  const params = new URLSearchParams({
    latitude: points.map((p) => p.lat.toFixed(4)).join(","),
    longitude: points.map((p) => p.lng.toFixed(4)).join(","),
    daily: DAILY_VARS.join(","),
    forecast_days: String(days),
    timezone: "auto", // Dates are local to each destination
  })
  return `${OPEN_METEO_URL}?${params.toString()}`
}

export class ForecastError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ForecastError"
  }
}

type Daily = Record<(typeof DAILY_VARS)[number] | "time", unknown[]>

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)
const round1 = (v: number) => Math.round(v * 10) / 10

// Ranking reads the next 7 days, so a location needs at least that many.
const MIN_DAYS = 7

/**
 * Turn Open-Meteo's response into ForecastDay arrays keyed by slug.
 * Throws ForecastError if the shape is wrong, the count doesn't match, or a
 * location is missing core values in its first MIN_DAYS days: the UI would
 * rank cities on missing data. A gap later on (models sometimes run short at
 * the far end) cuts that location's forecast there instead of failing all 80.
 */
export function parseOpenMeteo(json: unknown, points: ForecastPoint[]): Record<string, ForecastDay[]> {
  // A single location comes back as an object, several as an array.
  const items = Array.isArray(json) ? json : [json]
  if (items.length !== points.length) {
    throw new ForecastError(`Expected ${points.length} locations, got ${items.length}`)
  }

  const out: Record<string, ForecastDay[]> = {}
  items.forEach((item, i) => {
    const daily = (item as { daily?: Daily } | null)?.daily
    if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
      throw new ForecastError(`Location ${points[i].slug} has no daily data`)
    }
    const days: ForecastDay[] = []
    for (let d = 0; d < daily.time.length; d++) {
      const date = daily.time[d]
      const code = num(daily.weather_code?.[d])
      const max = num(daily.temperature_2m_max?.[d])
      const min = num(daily.temperature_2m_min?.[d])
      if (typeof date !== "string" || code === null || max === null || min === null) {
        if (d >= MIN_DAYS) break // Keep the complete days before the gap
        throw new ForecastError(`Location ${points[i].slug} day ${d} is incomplete`)
      }
      const sunSeconds = num(daily.sunshine_duration?.[d])
      const daylightSeconds = num(daily.daylight_duration?.[d])
      days.push({
        date,
        code,
        max: Math.round(max),
        min: Math.round(min),
        sunHours: sunSeconds === null ? null : round1(sunSeconds / 3600),
        daylightHours: daylightSeconds === null ? null : round1(daylightSeconds / 3600),
        rainChance: num(daily.precipitation_probability_max?.[d]),
        uv: (() => {
          const uv = num(daily.uv_index_max?.[d])
          return uv === null ? null : round1(uv)
        })(),
      })
    }
    out[points[i].slug] = days
  })
  return out
}

/**
 * Fetch and parse forecasts for every point.
 *
 * Cached in Next's data cache for an hour so every CDN region shares one
 * upstream call. That matters: Open-Meteo allows 600 weighted calls a minute
 * and this request costs 80 (one per location), so uncached it rate-limits
 * (429) after 7 requests. The data cache serves a stale entry while it
 * refreshes, so `generatedAt` comes from the upstream Date header, not "now",
 * and clients drop days that are already over (lib/forecast/today.ts).
 */
export async function fetchForecasts(
  points: ForecastPoint[],
  { timeoutMs = 8000, fetchImpl = fetch }: { timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<ForecastPayload> {
  const res = await fetchImpl(buildForecastUrl(points), {
    signal: AbortSignal.timeout(timeoutMs),
    next: { revalidate: 3600 },
  } as RequestInit)
  if (!res.ok) throw new ForecastError(`Open-Meteo responded ${res.status}`)
  const forecasts = parseOpenMeteo(await res.json(), points)
  // When Open-Meteo answered, which survives the data cache with the body.
  const upstreamDate = Date.parse(res.headers.get("date") ?? "")
  return {
    source: "open-meteo",
    generatedAt: new Date(Number.isNaN(upstreamDate) ? Date.now() : upstreamDate).toISOString(),
    days: FORECAST_DAYS,
    forecasts,
    timezones: Object.fromEntries(points.filter((p) => p.timezone).map((p) => [p.slug, p.timezone as string])),
  }
}
