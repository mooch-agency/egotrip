import { afterEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { destinations } from "@/lib/destinations"
import { GET as forecastGET } from "@/app/api/forecast/route"
import { GET as whereamiGET } from "@/app/api/whereami/route"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const openMeteoFor = () =>
  destinations.map(() => {
    const n = 14
    const fill = (v: number) => Array.from({ length: n }, () => v)
    return {
      daily: {
        time: Array.from({ length: n }, (_, i) => `2026-11-${String(20 + i).padStart(2, "0")}`),
        weather_code: fill(1),
        temperature_2m_max: fill(20),
        temperature_2m_min: fill(12),
        sunshine_duration: fill(28800),
        precipitation_probability_max: fill(10),
        uv_index_max: fill(3),
      },
    }
  })

describe("GET /api/forecast", () => {
  it("returns forecasts for every destination with edge caching", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(openMeteoFor()), { status: 200 })))
    const res = await forecastGET()
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600")
    const body = await res.json()
    expect(Object.keys(body.forecasts).sort()).toEqual(destinations.map((d) => d.slug).sort())
    for (const slug of Object.keys(body.forecasts)) expect(body.forecasts[slug]).toHaveLength(14)
  })

  it("returns 502 no-store when upstream responds 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 500 })))
    const res = await forecastGET()
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe("forecast_unavailable")
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })

  it("returns 502 no-store when fetch rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("network down"))))
    const res = await forecastGET()
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe("forecast_unavailable")
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })
})

const req = (headers: Record<string, string> = {}) => new NextRequest("http://localhost/api/whereami", { headers })

describe("GET /api/whereami", () => {
  it("reads Vercel geo headers", async () => {
    const res = whereamiGET(
      req({
        "x-vercel-ip-latitude": "-23.5505",
        "x-vercel-ip-longitude": "-46.6333",
        "x-vercel-ip-city": "S%C3%A3o%20Paulo",
        "x-vercel-ip-country": "BR",
      }),
    )
    expect(await res.json()).toEqual({
      name: "São Paulo",
      country: "Brazil",
      lat: -23.5505,
      lng: -46.6333,
      source: "ip",
    })
    expect(res.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("names the country when the city header is missing", async () => {
    const res = whereamiGET(req({ "x-vercel-ip-latitude": "48.85", "x-vercel-ip-longitude": "2.35", "x-vercel-ip-country": "FR" }))
    const body = await res.json()
    expect(body.name).toBe("France")
    expect(body.source).toBe("ip")
  })

  it("falls back to Lisbon without headers", async () => {
    const res = whereamiGET(req())
    const body = await res.json()
    expect(body.name).toBe("Lisbon")
    expect(body.source).toBe("default")
    expect(res.headers.get("Cache-Control")).toBe("private, no-store")
  })

  it("falls back to Lisbon on garbage latitude", async () => {
    const res = whereamiGET(req({ "x-vercel-ip-latitude": "abc", "x-vercel-ip-longitude": "10" }))
    expect((await res.json()).source).toBe("default")
  })
})
