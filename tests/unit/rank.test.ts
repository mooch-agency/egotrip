import { describe, expect, it } from "vitest"
import { autoRadius, DEFAULT_FILTERS, DEFAULT_RADIUS, rank, type Filters } from "@/lib/rank"
import type { Destination } from "@/lib/destinations/types"
import type { ForecastDay } from "@/lib/forecast/types"

const make = (o: Partial<Destination> & Pick<Destination, "slug" | "name" | "lat" | "lng">): Destination => ({
  country: "Spain",
  countryCode: "ES",
  region: "Europe",
  airport: "XXX",
  timezone: "Europe/Madrid",
  currency: "EUR",
  bestMonths: [6],
  avgSunHours: 8,
  crowd: "popular",
  tagline: "",
  description: "",
  workspaces: [],
  places: [],
  alibis: [],
  spotted: [],
  ...o,
})

const origin = { lat: 51.5074, lng: -0.1278 } // London
const destinations: Destination[] = [
  make({ slug: "malaga", name: "Málaga", lat: 36.7213, lng: -4.4214, avgSunHours: 9, crowd: "crowded" }),
  make({ slug: "lisbon", name: "Lisbon", country: "Portugal", lat: 38.7223, lng: -9.1393, avgSunHours: 8.5, crowd: "popular" }),
  make({ slug: "split", name: "Split", country: "Croatia", lat: 43.5081, lng: 16.4402, avgSunHours: 8.5, crowd: "rising" }),
  make({ slug: "dubai", name: "Dubai", country: "UAE", region: "Middle East", lat: 25.2048, lng: 55.2708, avgSunHours: 10, crowd: "popular" }),
  make({ slug: "tenerife", name: "Tenerife", lat: 28.2916, lng: -16.6291, avgSunHours: 10, crowd: "secret" }),
]

const f = (over: Partial<Filters> = {}): Filters => ({ ...DEFAULT_FILTERS, maxHours: null, ...over })
const run = (filters: Filters, sort: "sun" | "closest" | "warmest" = "sun", forecasts = null as Record<string, ForecastDay[]> | null) =>
  rank(destinations, { origin, forecasts, filters, sort })
const slugs = (r: ReturnType<typeof run>) => r.map((x) => x.destination.slug)

const day = (max: number, sunHours: number | null = 5): ForecastDay => ({
  date: "2026-11-20",
  code: 0,
  max,
  min: 5,
  sunHours,
  daylightHours: null,
  rainChance: 0,
  uv: 3,
})

describe("filters", () => {
  it("maxHours null keeps everything", () => {
    expect(run(f())).toHaveLength(5)
  })
  it("maxHours drops far destinations", () => {
    const r = run(f({ maxHours: 4 }))
    expect(slugs(r)).not.toContain("dubai")
    expect(slugs(r)).not.toContain("tenerife")
    expect(slugs(r)).toContain("lisbon")
    expect(r.every((x) => x.hours <= 4)).toBe(true)
  })
  it("filters by region", () => {
    expect(slugs(run(f({ regions: ["Middle East"] })))).toEqual(["dubai"])
  })
  it("filters by crowd", () => {
    expect(slugs(run(f({ crowd: ["secret", "rising"] }))).sort()).toEqual(["split", "tenerife"])
  })
  it("matches queries without accents or case", () => {
    expect(slugs(run(f({ query: "malaga" })))).toEqual(["malaga"])
    expect(slugs(run(f({ query: "  PORTUGAL " })))).toEqual(["lisbon"])
  })
  it("returns nothing for an unmatched query", () => {
    expect(run(f({ query: "zzz" }))).toEqual([])
  })
})

describe("sorting", () => {
  it("sun: descending, ties by flight hours", () => {
    const r = run(f(), "sun")
    // Dubai and Tenerife tie at 10; Tenerife is closer to London.
    expect(slugs(r)).toEqual(["tenerife", "dubai", "malaga", "lisbon", "split"])
  })
  it("closest: ascending flight hours", () => {
    const r = run(f(), "closest")
    const hours = r.map((x) => x.hours)
    expect([...hours].sort((a, b) => a - b)).toEqual(hours)
    expect(r.at(-1)?.destination.slug).toBe("dubai")
  })
  it("warmest: descending highs, null highs last", () => {
    const forecasts = { lisbon: [day(25)], malaga: [day(20)] }
    const r = run(f(), "warmest", forecasts)
    expect(slugs(r).slice(0, 2)).toEqual(["lisbon", "malaga"])
    expect(r.slice(2).every((x) => x.high === null)).toBe(true)
  })
})

describe("sun source", () => {
  it("falls back to typical sunshine without a forecast", () => {
    const r = run(f({ query: "lisbon" }))[0]
    expect(r.sunSource).toBe("typical")
    expect(r.sun).toBe(8.5)
    expect(r.high).toBeNull()
    expect(r.forecast).toBeUndefined()
  })
  it("uses forecast sunshine when present", () => {
    const forecasts = { lisbon: [day(22, 6), day(22, 8)] }
    const r = run(f({ query: "lisbon" }), "sun", forecasts)[0]
    expect(r.sunSource).toBe("forecast")
    expect(r.sun).toBe(7)
    expect(r.high).toBe(22)
  })
  it("falls back to typical when forecast sunshine is all null", () => {
    const r = run(f({ query: "lisbon" }), "sun", { lisbon: [day(22, null)] })[0]
    expect(r.sunSource).toBe("typical")
  })
})

describe("autoRadius", () => {
  // From London: Lisbon, Málaga and Split are under 6h; Tenerife about 4h 30m; Dubai about 7h.
  it("stays at the default when enough places are in range", () => {
    expect(autoRadius(destinations, origin, 3)).toBe(DEFAULT_RADIUS)
  })
  it("widens step by step until the minimum is met", () => {
    expect(autoRadius(destinations, origin, 5)).toBe(9)
  })
  it("gives up on a limit when no step reaches the minimum", () => {
    expect(autoRadius(destinations, origin, 6)).toBeNull()
  })
})
