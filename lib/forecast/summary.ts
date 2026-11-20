// Small, pure summaries of a forecast. Used for ranking and for the UI.

import type { ForecastDay } from "./types"
import { dayKind } from "./weather-codes"

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
const round1 = (v: number) => Math.round(v * 10) / 10

/** Mean daily sunshine hours over the first `days` days, or null if unknown. */
export function avgSun(forecast: ForecastDay[] | undefined, days = 7): number | null {
  if (!forecast?.length) return null
  const values = forecast
    .slice(0, days)
    .map((d) => d.sunHours)
    .filter((v): v is number => v !== null)
  const m = mean(values)
  return m === null ? null : round1(m)
}

/** Mean daily high over the first `days` days. */
export function avgHigh(forecast: ForecastDay[] | undefined, days = 7): number | null {
  if (!forecast?.length) return null
  const m = mean(forecast.slice(0, days).map((d) => d.max))
  return m === null ? null : Math.round(m)
}

/** Days that are sunny or partly sunny: at least 40% of daylight in direct sun (see dayKind). */
export function fairDays(forecast: ForecastDay[] | undefined): number {
  if (!forecast) return 0
  return forecast.filter((d) => {
    const k = dayKind(d)
    return k === "sun" || k === "part"
  }).length
}
