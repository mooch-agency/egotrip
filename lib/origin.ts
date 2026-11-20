// Where the visitor is flying from. Shared by the API route, the client
// provider and the origin picker.

export interface Origin {
  name: string
  country?: string
  lat: number
  lng: number
  // ip: Vercel geo headers. gps: browser geolocation. search: picked by hand.
  // default: we had nothing better (local dev, or headers missing).
  source: "ip" | "gps" | "search" | "default"
}

export const DEFAULT_ORIGIN: Origin = {
  name: "Lisbon",
  country: "Portugal",
  lat: 38.7223,
  lng: -9.1393,
  source: "default",
}

// Shortcut list in the picker. Big, cloudy, well-connected hubs: the people
// most likely to want out.
export const POPULAR_ORIGINS: Omit<Origin, "source">[] = [
  { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  { name: "San Francisco", country: "United States", lat: 37.7749, lng: -122.4194 },
  { name: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { name: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { name: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  { name: "Stockholm", country: "Sweden", lat: 59.3293, lng: 18.0686 },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { name: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298 },
  { name: "Seattle", country: "United States", lat: 47.6062, lng: -122.3321 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Hong Kong", country: "China", lat: 22.3193, lng: 114.1694 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393 },
]

/** Validate an unknown value (e.g. from localStorage) as an Origin. */
export function parseOrigin(value: unknown): Origin | null {
  if (!value || typeof value !== "object") return null
  const o = value as Record<string, unknown>
  const ok =
    typeof o.name === "string" &&
    o.name.length > 0 &&
    typeof o.lat === "number" &&
    typeof o.lng === "number" &&
    Math.abs(o.lat) <= 90 &&
    Math.abs(o.lng) <= 180 &&
    ["ip", "gps", "search", "default"].includes(o.source as string)
  if (!ok) return null
  return {
    name: o.name as string,
    country: typeof o.country === "string" ? o.country : undefined,
    lat: o.lat as number,
    lng: o.lng as number,
    source: o.source as Origin["source"],
  }
}

/** Name for an IP location with no city or country header. Not a real place. */
export const UNNAMED_AREA = "Your area"

/**
 * The origin's name if it's a real place a flight search can use, else undefined.
 * Browser locations ("Your location") and nameless IP areas have none.
 */
export function searchableName(origin: Origin | null): string | undefined {
  if (!origin || origin.source === "gps" || origin.name === UNNAMED_AREA) return undefined
  return origin.name
}
