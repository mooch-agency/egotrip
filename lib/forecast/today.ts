// Keep a forecast honest about what "today" is. The CDN can serve a cached
// forecast for up to a day (stale-while-revalidate), and a tab can stay open
// overnight, so the first day in the payload may already be over where the
// destination is. Dates are local to each destination (Open-Meteo timezone=auto).

import type { ForecastDay } from "./types"

/** YYYY-MM-DD for `now` in an IANA time zone, or null if the zone is unknown. */
export function localDate(timeZone: string, now: Date = new Date()): string | null {
  try {
    // en-CA formats as YYYY-MM-DD, which compares correctly as a string.
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
  } catch {
    return null
  }
}

/** Drop days that have already ended at each destination. Slugs with no known zone are left alone. */
export function dropPastDays(
  forecasts: Record<string, ForecastDay[]>,
  timezones: Record<string, string> | undefined,
  now: Date = new Date(),
): Record<string, ForecastDay[]> {
  if (!timezones) return forecasts
  const out: Record<string, ForecastDay[]> = {}
  for (const [slug, days] of Object.entries(forecasts)) {
    const today = timezones[slug] ? localDate(timezones[slug], now) : null
    out[slug] = today ? days.filter((d) => d.date >= today) : days
  }
  return out
}
