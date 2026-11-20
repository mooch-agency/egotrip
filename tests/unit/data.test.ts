import { describe, expect, it } from "vitest"
import { CROWD_LEVELS, destinations, getDestination, PLACE_CATEGORIES, REGIONS, WORKSPACE_TYPES } from "@/lib/destinations"

// Banned words from BRAND_VOICE.md. Matched case-insensitively as whole words.
const BANNED = [
  "curated",
  "sophisticated",
  "discerning",
  "elevated",
  "refined",
  "pedestrian",
  "exquisite",
  "nestled",
  "vibrant",
  "bustling",
  "boasts",
  "hidden gem",
  "paradise",
  "unforgettable",
  "breathtaking",
  "world-class",
  "must-see",
  "oasis",
  "tapestry",
  "delve",
  "elevate",
  "journey",
  "naturally",
  "of course",
]
// Place names that contain a banned word. Only these exact spellings are exempt.
const PROPER_NOUNS = ["Paradise Island", "Surfers Paradise", "Paradise Valley"]

const bannedRe = BANNED.map((w) => [w, new RegExp(`(?<![\\p{L}\\p{N}-])${w.replace(/[-\s]/g, (c) => (c === " " ? "\\s+" : "-"))}(?![\\p{L}\\p{N}-])`, "iu")] as const)

// Every string anywhere in a destination, with its path, for copy rules.
function strings(value: unknown, path: string, out: [string, string][] = []): [string, string][] {
  if (typeof value === "string") out.push([path, value])
  else if (Array.isArray(value)) value.forEach((v, i) => strings(v, `${path}[${i}]`, out))
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) strings(v, `${path}.${k}`, out)
  return out
}

const dupes = (xs: string[]) => xs.filter((x, i) => xs.indexOf(x) !== i)

describe("destinations (collection)", () => {
  it("has at least 80 entries", () => {
    expect(destinations.length).toBeGreaterThanOrEqual(80)
  })
  it("has unique slugs", () => {
    expect(dupes(destinations.map((d) => d.slug))).toEqual([])
  })
})

describe.each(destinations.map((d) => [d.slug, d] as const))("%s", (_slug, d) => {
  it("has a valid slug", () => expect(d.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/))
  it("has valid region and crowd", () => {
    expect(REGIONS).toContain(d.region)
    expect(CROWD_LEVELS).toContain(d.crowd)
  })
  it("has coordinates in range", () => {
    expect(d.lat).toBeGreaterThanOrEqual(-90)
    expect(d.lat).toBeLessThanOrEqual(90)
    expect(d.lng).toBeGreaterThanOrEqual(-180)
    expect(d.lng).toBeLessThanOrEqual(180)
  })
  it("has valid codes", () => {
    expect(d.countryCode).toMatch(/^[A-Z]{2}$/)
    expect(d.airport).toMatch(/^[A-Z]{3}$/)
  })
  it("has a valid timezone", () => {
    expect(() => new Intl.DateTimeFormat("en", { timeZone: d.timezone })).not.toThrow()
  })
  it("has a valid currency", () => {
    expect(() => new Intl.NumberFormat("en", { style: "currency", currency: d.currency })).not.toThrow()
  })
  it("has valid bestMonths", () => {
    expect(d.bestMonths.length).toBeGreaterThan(0)
    expect(new Set(d.bestMonths).size).toBe(d.bestMonths.length)
    for (const m of d.bestMonths) {
      expect(Number.isInteger(m)).toBe(true)
      expect(m).toBeGreaterThanOrEqual(1)
      expect(m).toBeLessThanOrEqual(12)
    }
  })
  it("has plausible avgSunHours", () => {
    expect(d.avgSunHours).toBeGreaterThanOrEqual(3)
    expect(d.avgSunHours).toBeLessThanOrEqual(12)
  })
  it("respects copy lengths", () => {
    expect(d.tagline.length).toBeGreaterThan(0)
    expect(d.tagline.length).toBeLessThanOrEqual(70)
    expect(d.description.length).toBeGreaterThan(0)
    expect(d.description.length).toBeLessThanOrEqual(320)
  })
  it("has 4-5 valid workspaces", () => {
    expect(d.workspaces.length).toBeGreaterThanOrEqual(4)
    expect(d.workspaces.length).toBeLessThanOrEqual(5)
    for (const w of d.workspaces) {
      expect(w.name.length).toBeGreaterThan(0)
      expect(WORKSPACE_TYPES).toContain(w.type)
      expect([1, 2, 3, 4, 5]).toContain(w.wifi)
      expect(w.area.trim().length).toBeGreaterThan(0)
      expect(w.note.length).toBeLessThanOrEqual(80)
    }
  })
  it("has 5-6 valid places across 3+ categories", () => {
    expect(d.places.length).toBeGreaterThanOrEqual(5)
    expect(d.places.length).toBeLessThanOrEqual(6)
    for (const p of d.places) {
      expect(p.name.length).toBeGreaterThan(0)
      expect(PLACE_CATEGORIES).toContain(p.category)
      expect(p.note.length).toBeLessThanOrEqual(80)
    }
    expect(new Set(d.places.map((p) => p.category)).size).toBeGreaterThanOrEqual(3)
  })
  it("has exactly 3 alibis and 2 spotted within length", () => {
    expect(d.alibis).toHaveLength(3)
    for (const a of d.alibis) expect(a.length).toBeLessThanOrEqual(100)
    expect(d.spotted).toHaveLength(2)
    for (const s of d.spotted) expect(s.length).toBeLessThanOrEqual(90)
  })
  it("has no duplicate workspace or place names", () => {
    expect(dupes(d.workspaces.map((w) => w.name.toLowerCase()))).toEqual([])
    expect(dupes(d.places.map((p) => p.name.toLowerCase()))).toEqual([])
  })
  it("follows the copy rules", () => {
    const bad: string[] = []
    for (const [path, s] of strings(d, d.slug)) {
      if (s.includes("—")) bad.push(`${path}: em dash`)
      if (s.includes("...")) bad.push(`${path}: three dots`)
      if (s.includes("…")) bad.push(`${path}: ellipsis`)
      if (s.includes("!")) bad.push(`${path}: exclamation mark`)
      // Real names win over the style guide: "Surfers Paradise" is a suburb, not a tic.
      const prose = PROPER_NOUNS.reduce((text, noun) => text.replaceAll(noun, ""), s)
      for (const [word, re] of bannedRe) if (re.test(prose)) bad.push(`${path}: banned "${word}"`)
    }
    expect(bad).toEqual([])
  })
})

describe("getDestination", () => {
  it("finds by slug", () => {
    const first = destinations[0]
    expect(getDestination(first.slug)).toBe(first)
  })
  it("returns undefined for unknown slugs", () => {
    expect(getDestination("nowhere-land")).toBeUndefined()
  })
})
