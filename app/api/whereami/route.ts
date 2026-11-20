// GET /api/whereami
// Approximate visitor location from Vercel's edge geo headers. No permission
// prompt and no third-party IP lookup. Falls back to Lisbon (local dev, or when
// the headers are missing) and says so via `source: "default"`.

import { NextResponse, type NextRequest } from "next/server"
import { DEFAULT_ORIGIN, UNNAMED_AREA, type Origin } from "@/lib/origin"

const decode = (v: string | null) => {
  if (!v) return undefined
  try {
    return decodeURIComponent(v)
  } catch {
    return v
  }
}

// Country names for the codes Vercel sends, via the platform's own data.
const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

export function GET(req: NextRequest) {
  const h = req.headers
  const lat = Number(h.get("x-vercel-ip-latitude"))
  const lng = Number(h.get("x-vercel-ip-longitude"))
  const city = decode(h.get("x-vercel-ip-city"))
  const countryCode = h.get("x-vercel-ip-country") ?? undefined

  const valid =
    h.has("x-vercel-ip-latitude") &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180

  let country: string | undefined
  try {
    country = countryCode ? regionNames.of(countryCode) : undefined
  } catch {
    country = countryCode
  }

  const origin: Origin = valid
    ? { name: city ?? country ?? UNNAMED_AREA, country, lat, lng, source: "ip" }
    : DEFAULT_ORIGIN

  // Per-visitor answer: never cache it anywhere shared.
  return NextResponse.json(origin, { headers: { "Cache-Control": "private, no-store" } })
}
