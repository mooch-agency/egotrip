// Destination schema. One record per city; every field is static content
// except the live forecast, which is fetched separately (see lib/forecast).
// Data files live in lib/destinations/data/<region-group>.ts and are merged in
// lib/destinations/index.ts. Integrity is enforced by tests/unit/data.test.ts.

export const REGIONS = [
  "Europe",
  "Africa",
  "Middle East",
  "Asia",
  "Oceania",
  "North America",
  "Caribbean",
  "Latin America",
] as const
export type Region = (typeof REGIONS)[number]

// How crowded a place feels to the escape-artist exec. Drives the "crowd" filter.
export const CROWD_LEVELS = ["secret", "rising", "popular", "crowded"] as const
export type CrowdLevel = (typeof CROWD_LEVELS)[number]

export const WORKSPACE_TYPES = ["coworking", "cafe", "hotel", "club", "library"] as const
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number]

export const PLACE_CATEGORIES = ["eat", "drink", "see", "swim", "walk", "day trip"] as const
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]

export interface Workspace {
  name: string // Real, currently operating venue
  type: WorkspaceType
  area: string // Neighbourhood or district, e.g. "Príncipe Real"
  wifi: 1 | 2 | 3 | 4 | 5 // Reputation, not a speed test
  note: string // ≤ 80 chars, practical: calls, booths, terrace, day passes
}

export interface Place {
  name: string // Real place: restaurant, bar, landmark, beach, trail
  category: PlaceCategory
  area?: string
  note: string // ≤ 80 chars, one concrete reason to go
}

export interface Destination {
  slug: string // URL slug for /to/<slug>: lowercase, ascii, hyphenated
  name: string // Display name, e.g. "Lisbon"
  country: string // Display country, e.g. "Portugal"
  countryCode: string // ISO 3166-1 alpha-2, e.g. "PT"
  region: Region
  lat: number // City centre, 4 decimals
  lng: number
  airport: string // Main IATA code, e.g. "LIS"
  timezone: string // IANA, e.g. "Europe/Lisbon"
  currency: string // ISO 4217, e.g. "EUR"
  bestMonths: number[] // 1-12, the sunniest/most pleasant months
  avgSunHours: number // Annual average sunshine hours per day (1 decimal); fallback when no live forecast
  crowd: CrowdLevel
  tagline: string // ≤ 70 chars, one line
  description: string // 2-3 sentences, ≤ 320 chars
  workspaces: Workspace[] // 4-5
  places: Place[] // 5-6, at least 3 categories
  alibis: string[] // 3, first person, ≤ 100 chars each
  spotted: string[] // 2, third person, ≤ 90 chars each
}
