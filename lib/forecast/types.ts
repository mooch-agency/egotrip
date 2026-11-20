// Shapes shared by the forecast API route, the client hook and the UI.

export interface ForecastDay {
  date: string // Local date at the destination, YYYY-MM-DD
  code: number // WMO weather code
  max: number // Daily high, °C
  min: number // Daily low, °C
  sunHours: number | null // Hours of direct sunshine (Open-Meteo sunshine_duration / 3600)
  daylightHours: number | null // Sunrise to sunset, for sunshine as a share of the day
  rainChance: number | null // Max precipitation probability, %
  uv: number | null // Max UV index
}

export interface ForecastPayload {
  source: "open-meteo"
  generatedAt: string // ISO timestamp of the upstream fetch
  days: number
  forecasts: Record<string, ForecastDay[]> // Keyed by destination slug
  timezones?: Record<string, string> // IANA zone per slug, so clients can drop days already over
}
