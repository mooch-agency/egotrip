// GET /api/forecast
// 14-day daily forecasts for every destination, from one Open-Meteo request.
// Success is cached at the edge for an hour and served stale for a day while it
// revalidates. Failure returns 502 with no-store, so a bad minute upstream is
// never cached and the client can say "forecast unavailable" honestly.

import { NextResponse } from "next/server"
import { destinations } from "@/lib/destinations"
import { fetchForecasts } from "@/lib/forecast/open-meteo"

const points = destinations.map(({ slug, lat, lng, timezone }) => ({ slug, lat, lng, timezone }))

export async function GET() {
  try {
    const payload = await fetchForecasts(points)
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    })
  } catch (error) {
    console.error("[forecast] upstream failed:", error)
    return NextResponse.json(
      { error: "forecast_unavailable", message: "Live forecast unavailable. Try again shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    )
  }
}
