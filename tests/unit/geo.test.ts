import { describe, expect, it } from "vitest"
import { distanceKm, flightHours, formatHours } from "@/lib/geo"

const london = { lat: 51.5074, lng: -0.1278 }
const lisbon = { lat: 38.7223, lng: -9.1393 }
const newYork = { lat: 40.7128, lng: -74.006 }

describe("distanceKm", () => {
  it("London to Lisbon is about 1,585 km", () => {
    expect(Math.abs(distanceKm(london, lisbon) - 1585) / 1585).toBeLessThan(0.02)
  })
  it("is symmetric", () => {
    expect(distanceKm(london, lisbon)).toBeCloseTo(distanceKm(lisbon, london), 6)
  })
  it("is zero for the same point", () => {
    expect(distanceKm(london, london)).toBe(0)
  })
})

describe("flightHours", () => {
  it("returns 0 under 150 km", () => {
    expect(flightHours(london, { lat: 51.6, lng: -0.1 })).toBe(0)
    expect(flightHours(london, london)).toBe(0)
  })
  it("London to Lisbon is between 2.5 and 3.25 h", () => {
    const h = flightHours(london, lisbon)
    expect(h).toBeGreaterThanOrEqual(2.5)
    expect(h).toBeLessThanOrEqual(3.25)
  })
  it("rounds to quarter hours", () => {
    for (const to of [lisbon, newYork, { lat: 35.68, lng: 139.65 }]) {
      const h = flightHours(london, to)
      expect((h * 4) % 1).toBe(0)
    }
  })
  it("grows with distance", () => {
    const near = flightHours(london, lisbon)
    const far = flightHours(london, newYork)
    const farther = flightHours(london, { lat: 35.68, lng: 139.65 })
    expect(near).toBeLessThan(far)
    expect(far).toBeLessThan(farther)
  })
})

describe("formatHours", () => {
  it.each([
    [2.75, "2h 45m"],
    [0.75, "45m"],
    [11, "11h"],
  ])("%d -> %s", (input, expected) => {
    expect(formatHours(input)).toBe(expected)
  })
})
