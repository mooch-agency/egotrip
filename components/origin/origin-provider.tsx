"use client"

// Where the visitor is flying from. Resolution order:
//   1. Their saved choice (localStorage), so a pick sticks between visits.
//   2. /api/whereami: approximate, from Vercel's IP geo headers. No prompt.
//   3. Lisbon, if all else fails.
// Precise browser geolocation only runs when they ask for it (locate).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { DEFAULT_ORIGIN, parseOrigin, type Origin } from "@/lib/origin"

const STORAGE_KEY = "egotrip:origin"

interface OriginContextValue {
  origin: Origin | null // null until resolved
  setOrigin: (origin: Origin) => void
  locate: () => Promise<{ ok: true } | { ok: false; message: string }>
}

const OriginContext = createContext<OriginContextValue | null>(null)

export function useOrigin() {
  const ctx = useContext(OriginContext)
  if (!ctx) throw new Error("useOrigin must be used inside <OriginProvider>")
  return ctx
}

// Storage can throw (private mode, blocked cookies), so every access is guarded.
function readSaved(): Origin | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? parseOrigin(JSON.parse(raw)) : null
  } catch {
    return null
  }
}
function save(origin: Origin) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(origin))
  } catch {
    // Not fatal: the choice just won't survive a reload.
  }
}

export function OriginProvider({ children }: { children: ReactNode }) {
  const [origin, setOriginState] = useState<Origin | null>(null)

  useEffect(() => {
    const saved = readSaved()
    if (saved) {
      setOriginState(saved)
      return
    }
    const controller = new AbortController()
    fetch("/api/whereami", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      // `prev ??`: if they picked a city while this was in flight, their pick wins.
      .then((data) => setOriginState((prev) => prev ?? parseOrigin(data) ?? DEFAULT_ORIGIN))
      .catch((err) => {
        if (err?.name !== "AbortError") setOriginState((prev) => prev ?? DEFAULT_ORIGIN)
      })
    return () => controller.abort()
  }, [])

  const setOrigin = useCallback((next: Origin) => {
    setOriginState(next)
    save(next)
  }, [])

  const locate = useCallback(async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!("geolocation" in navigator)) return { ok: false, message: "This browser can't share its location." }
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false, // City-level is plenty for flight times
          timeout: 10000,
          maximumAge: 10 * 60 * 1000,
        }),
      )
      // Rounded to ~1 km: plenty for flight times, and less precise than the
      // device knows. It only ever lives in this browser's localStorage.
      const round2 = (v: number) => Math.round(v * 100) / 100
      setOrigin({ name: "Your location", lat: round2(pos.coords.latitude), lng: round2(pos.coords.longitude), source: "gps" })
      return { ok: true }
    } catch (err) {
      const code = (err as GeolocationPositionError)?.code
      const message =
        code === 1
          ? "Location access is blocked. Pick a city instead."
          : code === 3
            ? "That took too long. Pick a city instead."
            : "Couldn't get your location. Pick a city instead."
      return { ok: false, message }
    }
  }, [setOrigin])

  const value = useMemo(() => ({ origin, setOrigin, locate }), [origin, setOrigin, locate])
  return <OriginContext.Provider value={value}>{children}</OriginContext.Provider>
}
