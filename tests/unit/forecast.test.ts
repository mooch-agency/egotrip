import { describe, expect, it } from "vitest"
import {
  buildForecastUrl,
  fetchForecasts,
  FORECAST_DAYS,
  ForecastError,
  parseOpenMeteo,
} from "@/lib/forecast/open-meteo"
import { avgHigh, avgSun, fairDays } from "@/lib/forecast/summary"
import { dayKind, dayLabel, weatherKind, weatherLabel } from "@/lib/forecast/weather-codes"
import type { ForecastDay } from "@/lib/forecast/types"
import { dropPastDays, localDate } from "@/lib/forecast/today"

const points = [
  { slug: "lisbon", lat: 38.7223, lng: -9.1393 },
  { slug: "madrid", lat: 40.4168, lng: -3.7038 },
]

// Realistic Open-Meteo daily block for one location.
function daily(overrides: Record<string, unknown[]> = {}, days = 3) {
  const time = Array.from({ length: days }, (_, i) => `2026-11-${String(20 + i).padStart(2, "0")}`)
  const fill = (v: unknown) => Array.from({ length: days }, () => v)
  return {
    latitude: 38.72,
    longitude: -9.14,
    daily: {
      time,
      weather_code: fill(1),
      temperature_2m_max: [18.4, 19.6, 17.5].slice(0, days),
      temperature_2m_min: [11.2, 12.4, 10.5].slice(0, days),
      sunshine_duration: [36000, 28800, 0].slice(0, days),
      daylight_duration: [36000, 36000, 36000].slice(0, days),
      precipitation_probability_max: [0, 20, 80].slice(0, days),
      uv_index_max: [3.14, 2.96, 1].slice(0, days),
      ...overrides,
    },
  }
}

describe("buildForecastUrl", () => {
  const url = new URL(buildForecastUrl(points))
  it("comma-joins coordinates to 4 dp", () => {
    expect(url.searchParams.get("latitude")).toBe("38.7223,40.4168")
    expect(url.searchParams.get("longitude")).toBe("-9.1393,-3.7038")
    expect(new URL(buildForecastUrl([{ slug: "x", lat: 1.5, lng: 2 }])).searchParams.get("latitude")).toBe("1.5000")
  })
  it("asks for daily vars, 14 days, auto timezone", () => {
    expect(url.searchParams.get("daily")).toBe(
      "weather_code,temperature_2m_max,temperature_2m_min,sunshine_duration,daylight_duration,precipitation_probability_max,uv_index_max",
    )
    expect(url.searchParams.get("forecast_days")).toBe("14")
    expect(url.searchParams.get("timezone")).toBe("auto")
  })
})

describe("parseOpenMeteo", () => {
  it("parses an array for 2 locations", () => {
    const out = parseOpenMeteo([daily(), daily()], points)
    expect(Object.keys(out)).toEqual(["lisbon", "madrid"])
    expect(out.lisbon).toHaveLength(3)
    expect(out.lisbon[0]).toEqual({
      date: "2026-11-20",
      code: 1,
      max: 18,
      min: 11,
      sunHours: 10,
      daylightHours: 10,
      rainChance: 0,
      uv: 3.1,
    })
  })
  it("parses a bare object for 1 location", () => {
    const out = parseOpenMeteo(daily(), [points[0]])
    expect(out.lisbon).toHaveLength(3)
  })
  it("converts sunshine seconds to hours at 1 dp", () => {
    const out = parseOpenMeteo(daily({ sunshine_duration: [3600, 5400, 1234] }), [points[0]])
    expect(out.lisbon.map((d) => d.sunHours)).toEqual([1, 1.5, 0.3])
  })
  it("keeps nulls for sunshine, rain and uv", () => {
    const out = parseOpenMeteo(
      daily({
        sunshine_duration: [null, null, null],
        daylight_duration: [null, null, null],
        precipitation_probability_max: [null, null, null],
        uv_index_max: [null, null, null],
      }),
      [points[0]],
    )
    for (const d of out.lisbon) {
      expect(d.sunHours).toBeNull()
      expect(d.daylightHours).toBeNull()
      expect(d.rainChance).toBeNull()
      expect(d.uv).toBeNull()
    }
  })
  it("throws on count mismatch", () => {
    expect(() => parseOpenMeteo([daily()], points)).toThrow(ForecastError)
    expect(() => parseOpenMeteo(daily(), points)).toThrow(ForecastError)
  })
  it("throws when daily is missing or empty", () => {
    expect(() => parseOpenMeteo({}, [points[0]])).toThrow(ForecastError)
    expect(() => parseOpenMeteo(null, [points[0]])).toThrow(ForecastError)
    expect(() => parseOpenMeteo({ daily: { time: [] } }, [points[0]])).toThrow(ForecastError)
  })
  it.each(["weather_code", "temperature_2m_max", "temperature_2m_min"])("throws when %s is missing", (key) => {
    expect(() => parseOpenMeteo(daily({ [key]: [null, null, null] }), [points[0]])).toThrow(ForecastError)
  })
  it("cuts a location at a gap after day 7 instead of failing everything", () => {
    const fourteen = (v: unknown) => Array.from({ length: 14 }, () => v)
    const json = daily(
      {
        time: Array.from({ length: 14 }, (_, i) => `2026-11-${String(20 + i).padStart(2, "0")}`),
        weather_code: [...fourteen(1).slice(0, 10), null, 1, 1, 1],
        temperature_2m_max: fourteen(20),
        temperature_2m_min: fourteen(12),
        sunshine_duration: fourteen(30000),
        daylight_duration: fourteen(36000),
        precipitation_probability_max: fourteen(10),
        uv_index_max: fourteen(3),
      },
      14,
    )
    expect(parseOpenMeteo(json, [points[0]]).lisbon).toHaveLength(10)
  })
  it("still throws on a gap inside the first 7 days", () => {
    const fourteen = (v: unknown) => Array.from({ length: 14 }, () => v)
    const json = daily(
      {
        time: Array.from({ length: 14 }, (_, i) => `2026-11-${String(20 + i).padStart(2, "0")}`),
        weather_code: [1, 1, 1, null, ...fourteen(1).slice(0, 10)],
        temperature_2m_max: fourteen(20),
        temperature_2m_min: fourteen(12),
      },
      14,
    )
    expect(() => parseOpenMeteo(json, [points[0]])).toThrow(ForecastError)
  })
})

describe("fetchForecasts", () => {
  it("returns the payload shape on success", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify([daily(), daily()]), { status: 200 })) as typeof fetch
    const payload = await fetchForecasts(points, { fetchImpl })
    expect(payload.source).toBe("open-meteo")
    expect(payload.days).toBe(FORECAST_DAYS)
    expect(Number.isNaN(Date.parse(payload.generatedAt))).toBe(false)
    expect(Object.keys(payload.forecasts)).toEqual(["lisbon", "madrid"])
  })
  it("uses the data cache, stamps the upstream Date and passes time zones through", async () => {
    let init: RequestInit | undefined
    const fetchImpl = (async (_url: string, i?: RequestInit) => {
      init = i
      return new Response(JSON.stringify([daily(), daily()]), {
        status: 200,
        headers: { date: "Wed, 18 Nov 2026 09:00:00 GMT" },
      })
    }) as typeof fetch
    const payload = await fetchForecasts(
      [
        { ...points[0], timezone: "Europe/Lisbon" },
        { ...points[1], timezone: "Europe/Madrid" },
      ],
      { fetchImpl },
    )
    expect(init?.next).toEqual({ revalidate: 3600 })
    expect(payload.generatedAt).toBe("2026-11-18T09:00:00.000Z")
    expect(payload.timezones).toEqual({ lisbon: "Europe/Lisbon", madrid: "Europe/Madrid" })
  })
  it("throws ForecastError on a non-ok status", async () => {
    const fetchImpl = (async () => new Response("nope", { status: 500 })) as typeof fetch
    await expect(fetchForecasts(points, { fetchImpl })).rejects.toThrow(ForecastError)
  })
})

describe("weatherKind / weatherLabel", () => {
  it.each([
    [0, "sun", "Clear"],
    [1, "sun", "Mostly clear"],
    [2, "part", "Partly cloudy"],
    [3, "cloud", "Overcast"],
    [45, "fog", "Fog"],
    [61, "rain", "Light rain"],
    [80, "rain", "Light showers"],
    [95, "storm", "Thunderstorms"],
    [71, "snow", "Light snow"],
    [999, "storm", "Unknown"],
  ])("code %d", (code, kind, label) => {
    expect(weatherKind(code)).toBe(kind)
    expect(weatherLabel(code)).toBe(label)
  })
  it("labels unknown codes as Unknown", () => {
    expect(weatherLabel(4)).toBe("Unknown")
  })
})

const day = (over: Partial<ForecastDay> = {}): ForecastDay => ({
  date: "2026-11-20",
  code: 0,
  max: 20,
  min: 10,
  sunHours: 8,
  daylightHours: null,
  rainChance: 0,
  uv: 3,
  ...over,
})

describe("summary", () => {
  it("avgSun averages the first 7 days only", () => {
    const f = [...Array.from({ length: 7 }, () => day({ sunHours: 6 })), day({ sunHours: 100 })]
    expect(avgSun(f)).toBe(6)
  })
  it("avgSun ignores nulls", () => {
    expect(avgSun([day({ sunHours: 4 }), day({ sunHours: null }), day({ sunHours: 7 })])).toBe(5.5)
  })
  it("avgSun is null when empty, undefined or all null", () => {
    expect(avgSun([])).toBeNull()
    expect(avgSun(undefined)).toBeNull()
    expect(avgSun([day({ sunHours: null })])).toBeNull()
  })
  it("avgHigh averages the first 7 days and rounds", () => {
    expect(avgHigh([day({ max: 20 }), day({ max: 23 })])).toBe(22)
    expect(avgHigh([])).toBeNull()
  })
  it("fairDays counts sun and part days", () => {
    expect(fairDays([day({ code: 0 }), day({ code: 2 }), day({ code: 3 }), day({ code: 61 })])).toBe(2)
    expect(fairDays(undefined)).toBe(0)
  })
})

// Open-Meteo's daily code is the worst hour, so the day reading leans on
// sunshine as a share of daylight. These pin the thresholds.
describe("dayKind / dayLabel", () => {
  it("calls a 9 h sun day sunny even when the code says overcast", () => {
    const d = day({ code: 3, sunHours: 9, daylightHours: 10 })
    expect(dayKind(d)).toBe("sun")
    expect(dayLabel(d)).toBe("Sunny")
  })
  it("calls 40-70% of daylight partly sunny", () => {
    expect(dayKind(day({ code: 51, sunHours: 5, daylightHours: 10, rainChance: 30 }))).toBe("part")
    expect(dayLabel(day({ code: 3, sunHours: 4, daylightHours: 10 }))).toBe("Partly sunny")
  })
  it("lets a likely-wet code win over sunshine", () => {
    expect(dayKind(day({ code: 61, sunHours: 8.7, daylightHours: 10, rainChance: 90 }))).toBe("rain")
  })
  it("downgrades a clear code with little sun to cloud", () => {
    const d = day({ code: 0, sunHours: 1, daylightHours: 10 })
    expect(dayKind(d)).toBe("cloud")
    expect(dayLabel(d)).toBe("Mostly cloudy")
  })
  it("keeps a wet code on a dull day", () => {
    expect(dayKind(day({ code: 63, sunHours: 0.5, daylightHours: 10, rainChance: 40 }))).toBe("rain")
  })
  it("falls back to the code without sunshine data", () => {
    expect(dayKind(day({ code: 2, sunHours: null, daylightHours: 10 }))).toBe("part")
    expect(dayKind(day({ code: 0, sunHours: 2, daylightHours: null }))).toBe("sun")
  })
  it("fairDays uses the day reading", () => {
    expect(fairDays([day({ code: 3, sunHours: 9, daylightHours: 10 }), day({ code: 3, sunHours: 1, daylightHours: 10 })])).toBe(1)
  })
})

describe("localDate / dropPastDays", () => {
  const days = (dates: string[]) =>
    dates.map((date) => ({ date, code: 0, max: 20, min: 10, sunHours: 8, daylightHours: 10, rainChance: 0, uv: 3 }))
  // 23:30 UTC on 19 Nov: already 20 Nov in Tokyo, still 19 Nov in Lisbon and Honolulu.
  const now = new Date("2026-11-19T23:30:00Z")

  it("formats the local date in a zone", () => {
    expect(localDate("Asia/Tokyo", now)).toBe("2026-11-20")
    expect(localDate("Europe/Lisbon", now)).toBe("2026-11-19")
    expect(localDate("Pacific/Honolulu", now)).toBe("2026-11-19")
  })
  it("returns null for an unknown zone", () => {
    expect(localDate("Mars/Olympus_Mons", now)).toBeNull()
  })
  it("drops days that are over at each destination", () => {
    const forecasts = {
      tokyo: days(["2026-11-19", "2026-11-20", "2026-11-21"]),
      lisbon: days(["2026-11-18", "2026-11-19", "2026-11-20"]),
    }
    const out = dropPastDays(forecasts, { tokyo: "Asia/Tokyo", lisbon: "Europe/Lisbon" }, now)
    expect(out.tokyo.map((d) => d.date)).toEqual(["2026-11-20", "2026-11-21"])
    expect(out.lisbon.map((d) => d.date)).toEqual(["2026-11-19", "2026-11-20"])
  })
  it("leaves slugs alone without a zone, and everything alone without a map", () => {
    const forecasts = { nowhere: days(["2026-11-01"]) }
    expect(dropPastDays(forecasts, {}, now).nowhere).toHaveLength(1)
    expect(dropPastDays(forecasts, undefined, now)).toBe(forecasts)
  })
})
