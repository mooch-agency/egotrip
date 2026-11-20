import { describe, expect, it } from "vitest"
import { DEFAULT_ORIGIN, parseOrigin, POPULAR_ORIGINS, searchableName, UNNAMED_AREA } from "@/lib/origin"

const valid = { name: "London", country: "United Kingdom", lat: 51.5, lng: -0.12, source: "search" }

describe("parseOrigin", () => {
  it("accepts a valid origin", () => {
    expect(parseOrigin(valid)).toEqual(valid)
  })
  it("accepts a missing country", () => {
    expect(parseOrigin({ ...valid, country: undefined })?.country).toBeUndefined()
  })
  it.each(["ip", "gps", "search", "default"])("accepts source %s", (source) => {
    expect(parseOrigin({ ...valid, source })).not.toBeNull()
  })
  it("accepts boundary coordinates", () => {
    expect(parseOrigin({ ...valid, lat: 90, lng: -180 })).not.toBeNull()
  })
  it.each([
    ["lat too high", { lat: 91 }],
    ["lat too low", { lat: -91 }],
    ["lng too high", { lng: 181 }],
    ["lng too low", { lng: -181 }],
    ["lat string", { lat: "51" }],
    ["lng missing", { lng: undefined }],
    ["bad source", { source: "magic" }],
    ["missing source", { source: undefined }],
    ["empty name", { name: "" }],
    ["numeric name", { name: 5 }],
  ])("rejects %s", (_label, patch) => {
    expect(parseOrigin({ ...valid, ...patch })).toBeNull()
  })
  it.each([null, undefined, "London", 42, true])("rejects non-object %s", (v) => {
    expect(parseOrigin(v)).toBeNull()
  })
})

describe("POPULAR_ORIGINS", () => {
  it.each(POPULAR_ORIGINS.map((o) => [o.name, o] as const))("%s is valid", (_n, o) => {
    expect(parseOrigin({ ...o, source: "search" })).not.toBeNull()
  })
  it("default origin is valid", () => {
    expect(parseOrigin(DEFAULT_ORIGIN)).not.toBeNull()
  })
})

describe("searchableName", () => {
  it("uses real place names", () => {
    expect(searchableName({ ...DEFAULT_ORIGIN })).toBe("Lisbon")
    expect(searchableName({ name: "London", lat: 51.5, lng: -0.12, source: "search" })).toBe("London")
    expect(searchableName({ name: "Porto", lat: 41.1, lng: -8.6, source: "ip" })).toBe("Porto")
  })
  it("skips browser locations, nameless IP areas and null", () => {
    expect(searchableName({ name: "Your location", lat: 51.5, lng: -0.12, source: "gps" })).toBeUndefined()
    expect(searchableName({ name: UNNAMED_AREA, lat: 51.5, lng: -0.12, source: "ip" })).toBeUndefined()
    expect(searchableName(null)).toBeUndefined()
  })
})
