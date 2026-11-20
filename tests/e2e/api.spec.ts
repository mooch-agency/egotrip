import { test, expect } from "@playwright/test"

test.describe("API and metadata routes", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "project-specific spec"))

  test("GET /api/forecast returns 14 days for all 80 destinations", async ({ request }) => {
    const res = await request.get("/api/forecast")
    expect(res.status()).toBe(200)
    expect(res.headers()["cache-control"]).toContain("s-maxage=3600")
    const body = await res.json()
    expect(body.source).toBe("open-meteo")
    const slugs = Object.keys(body.forecasts)
    expect(slugs).toHaveLength(80)
    for (const slug of slugs) {
      const days = body.forecasts[slug]
      expect(days, slug).toHaveLength(14)
      for (const d of days) {
        expect(typeof d.code, slug).toBe("number")
        expect(typeof d.max, slug).toBe("number")
        expect(typeof d.min, slug).toBe("number")
        for (const k of ["sunHours", "daylightHours"]) {
          expect(d[k] === null || typeof d[k] === "number", `${slug}.${k}`).toBe(true)
        }
      }
    }
  })

  test("GET /api/whereami falls back to Lisbon", async ({ request }) => {
    const res = await request.get("/api/whereami")
    expect(res.status()).toBe(200)
    expect(res.headers()["cache-control"]).toContain("private, no-store")
    const body = await res.json()
    expect(body.name).toBe("Lisbon")
    expect(body.source).toBe("default")
  })

  test("GET /api/whereami reads Vercel geo headers", async ({ request }) => {
    const res = await request.get("/api/whereami", {
      headers: {
        "x-vercel-ip-latitude": "51.5074",
        "x-vercel-ip-longitude": "-0.1278",
        "x-vercel-ip-city": "London",
        "x-vercel-ip-country": "GB",
      },
    })
    const body = await res.json()
    expect(body.source).toBe("ip")
    expect(body.name).toBe("London")
    expect(body.country).toBe("United Kingdom")
    expect(res.headers()["cache-control"]).toContain("private, no-store")
  })

  test("sitemap lists 81 URLs including /to/lisbon", async ({ request }) => {
    const res = await request.get("/sitemap.xml")
    expect(res.status()).toBe(200)
    const xml = await res.text()
    expect(xml.match(/<loc>/g)).toHaveLength(81)
    expect(xml).toMatch(/<loc>[^<]*\/to\/lisbon<\/loc>/)
  })

  test("robots.txt disallows /api/", async ({ request }) => {
    const res = await request.get("/robots.txt")
    expect(res.status()).toBe(200)
    expect(await res.text()).toMatch(/Disallow:\s*\/api\//)
  })

  test("manifest is JSON named Egotrip", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest")
    expect(res.status()).toBe(200)
    expect((await res.json()).name).toBe("Egotrip")
  })

  for (const path of ["/opengraph-image", "/to/lisbon/opengraph-image", "/apple-icon"]) {
    test(`${path} is a PNG`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)
      expect(res.headers()["content-type"]).toContain("image/png")
    })
  }

  test("/icon.svg is an SVG", async ({ request }) => {
    const res = await request.get("/icon.svg")
    expect(res.status()).toBe(200)
    expect(res.headers()["content-type"]).toContain("svg")
  })

  test("unknown destination is a 404", async ({ request }) => {
    const res = await request.get("/to/nowhere")
    expect(res.status()).toBe(404)
  })

  test("/sun redirects home", async ({ request }) => {
    const res = await request.get("/sun", { maxRedirects: 0 })
    expect(res.status()).toBe(307)
    expect(res.headers()["location"]).toMatch(/^(https?:\/\/[^/]+)?\/$/)
  })

  test("/destinations, the old list page, redirects home permanently", async ({ request }) => {
    const res = await request.get("/destinations", { maxRedirects: 0 })
    expect(res.status()).toBe(308)
    expect(res.headers()["location"]).toMatch(/^(https?:\/\/[^/]+)?\/$/)
  })
})
