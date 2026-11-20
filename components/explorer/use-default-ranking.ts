"use client"

// The ranking the home page opens on: sunniest first, within the smallest
// radius step that reaches a handful of places (autoRadius). The place page
// reads the same list for "1 of 30", "Next" and "Also sunny", so the two
// pages never disagree about where a place sits.

import { useMemo } from "react"
import { destinations } from "@/lib/destinations"
import { autoRadius, DEFAULT_FILTERS, rank, type Ranked } from "@/lib/rank"
import { searchableName } from "@/lib/origin"
import { useOrigin } from "@/components/origin/origin-provider"
import { useForecasts } from "@/components/forecast/use-forecasts"

export type DefaultRanking =
  | { ready: false }
  | { ready: true; results: Ranked[]; radius: number | null; from: string }

export function useDefaultRanking(): DefaultRanking {
  const { origin } = useOrigin()
  const forecast = useForecasts()
  const forecasts = forecast.status === "ready" ? forecast.data.forecasts : null
  const loading = forecast.status === "loading"

  return useMemo(() => {
    if (!origin || loading) return { ready: false }
    const radius = autoRadius(destinations, origin)
    const results = rank(destinations, { origin, forecasts, filters: { ...DEFAULT_FILTERS, maxHours: radius }, sort: "sun" })
    return { ready: true, results, radius, from: searchableName(origin) ?? "you" }
  }, [origin, loading, forecasts])
}
