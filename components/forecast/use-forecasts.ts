"use client"

// One shared forecast store for the whole page. Every component that calls
// useForecasts() reads the same snapshot, so "Try again" in one place updates
// all of them. The route is CDN-cached for an hour, so a load is usually fast.
//
// Freshness: data older than MAX_AGE is refetched the next time a component
// mounts or the tab becomes visible again, and days that have already ended at
// each destination are dropped (dropPastDays), so "Today" stays true even if
// the CDN served a stale copy or the tab sat open overnight.

import { useCallback, useEffect, useSyncExternalStore } from "react"
import type { ForecastPayload } from "@/lib/forecast/types"
import { dropPastDays } from "@/lib/forecast/today"

export type ForecastState =
  | { status: "loading" }
  | { status: "ready"; data: ForecastPayload }
  | { status: "error" }

const MAX_AGE = 60 * 60 * 1000 // Match the route's s-maxage

const LOADING: ForecastState = { status: "loading" }
let snapshot: ForecastState = LOADING
let loadedAt = 0
let inflight: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit(next: ForecastState) {
  snapshot = next
  listeners.forEach((l) => l())
}

/** Fetch if we have nothing, the data is stale, or `force` (a retry). Deduped. */
function load(force = false) {
  const fresh = snapshot.status === "ready" && Date.now() - loadedAt < MAX_AGE
  if (inflight || (fresh && !force)) return
  // Keep showing old data while a background refresh runs; only show loading
  // when there's nothing to show.
  if (snapshot.status !== "ready") emit(LOADING)
  inflight = fetch("/api/forecast")
    .then(async (res) => {
      if (!res.ok) throw new Error(`forecast ${res.status}`)
      const data = (await res.json()) as ForecastPayload
      if (!data || typeof data.forecasts !== "object") throw new Error("forecast payload malformed")
      loadedAt = Date.now()
      emit({ status: "ready", data: { ...data, forecasts: dropPastDays(data.forecasts, data.timezones) } })
    })
    .catch(() => {
      // A failed background refresh keeps the last good data.
      if (snapshot.status !== "ready") emit({ status: "error" })
    })
    .finally(() => {
      inflight = null
    })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => snapshot
const getServerSnapshot = () => LOADING // Forecasts are client-only; SSR shows skeletons

export function useForecasts(): ForecastState & { retry: () => void } {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    load()
    const onVisible = () => document.visibilityState === "visible" && load()
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [])

  const retry = useCallback(() => load(true), [])
  return { ...state, retry }
}
