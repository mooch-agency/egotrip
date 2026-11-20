// WMO weather interpretation codes, as used by Open-Meteo.
// https://open-meteo.com/en/docs (see "WMO Weather interpretation codes")

import type { ForecastDay } from "./types"

export type WeatherKind ="sun" | "part" | "cloud" | "fog" | "rain" | "storm" | "snow"

export function weatherKind(code: number): WeatherKind {
  if (code <= 1) return "sun"
  if (code === 2) return "part"
  if (code === 3) return "cloud"
  if (code === 45 || code === 48) return "fog"
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow"
  if (code >= 95) return "storm"
  return "rain" // 51-67 drizzle and rain, 80-82 showers
}

const WET: WeatherKind[] = ["rain", "storm", "snow"]

/**
 * What a day actually looked like. Open-Meteo's daily weather_code is the
 * *worst* hour of the day, so a day with 9 hours of sun and one shower comes
 * back as "drizzle". We trust sunshine as a share of daylight instead, and only
 * let the code win when rain is likely (≥ 60%) or we have no sunshine data.
 */
export function dayKind(day: Pick<ForecastDay, "code" | "sunHours" | "daylightHours" | "rainChance">): WeatherKind {
  const codeKind = weatherKind(day.code)
  if (WET.includes(codeKind) && (day.rainChance ?? 0) >= 60) return codeKind
  if (day.sunHours === null || !day.daylightHours) return codeKind
  const share = day.sunHours / day.daylightHours
  if (share >= 0.7) return "sun"
  if (share >= 0.4) return "part"
  return codeKind === "sun" || codeKind === "part" ? "cloud" : codeKind
}

export const isWet = (kind: WeatherKind) => WET.includes(kind)

/** Label that agrees with dayKind, e.g. "Sunny" rather than "Overcast" on a 9-hour sun day. ≥ 70% sun is "Sunny", ≥ 40% "Partly sunny". */
export function dayLabel(day: Pick<ForecastDay, "code" | "sunHours" | "daylightHours" | "rainChance">): string {
  const kind = dayKind(day)
  if (kind === "sun") return "Sunny"
  if (kind === "part") return "Partly sunny"
  if (kind === "cloud" && weatherKind(day.code) !== "cloud") return "Mostly cloudy"
  return weatherLabel(day.code)
}

const LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorms",
  96: "Thunderstorms, hail",
  99: "Thunderstorms, hail",
}

export function weatherLabel(code: number): string {
  return LABELS[code] ?? "Unknown"
}
