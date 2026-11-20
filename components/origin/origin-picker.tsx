"use client"

// "Where are you now?" dialog. Search any city (Open-Meteo geocoding, no key,
// called straight from the browser), pick a popular hub, or use the browser's
// location. Radix Dialog handles focus trapping, Escape and scroll lock.

import { useEffect, useId, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { POPULAR_ORIGINS, type Origin } from "@/lib/origin"
import { useOrigin } from "./origin-provider"

interface GeoResult {
  id: number
  name: string
  country?: string
  admin1?: string
  latitude: number
  longitude: number
}

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"

export function OriginPicker({ trigger }: { trigger: React.ReactNode }) {
  const { origin, setOrigin, locate } = useOrigin()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GeoResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const inputId = useId()
  const listRef = useRef<HTMLUListElement>(null)

  // Debounced search. Under 2 characters we show the popular list instead.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ name: q, count: "8", language: "en", format: "json" })
      fetch(`${GEOCODE_URL}?${params}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data) => {
          setResults(Array.isArray(data?.results) ? data.results : [])
          setMessage(null)
        })
        .catch((err) => {
          if (err?.name === "AbortError") return
          setResults([])
          setMessage("City search is down. Pick from the list or use your location.")
        })
        .finally(() => {
          // An aborted request belongs to an older query: leave the spinner to the new one.
          if (!controller.signal.aborted) setSearching(false)
        })
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function choose(next: Origin) {
    setOrigin(next)
    handleOpenChange(false)
  }

  async function handleLocate() {
    setLocating(true)
    setMessage(null)
    const result = await locate()
    setLocating(false)
    if (result.ok) handleOpenChange(false)
    else setMessage(result.message)
  }

  // Reset transient state each time the dialog closes. Radix only calls
  // onOpenChange for its own close paths (Escape, overlay, Close), so our own
  // closes go through here too.
  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery("")
      setResults(null)
      setMessage(null)
    }
  }

  const showingSearch = results !== null

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Start in the search field with a mouse or keyboard. On touch,
            // focusing it would throw up the keyboard over the popular list,
            // so Radix's default (first focusable) stands.
            if (window.matchMedia("(pointer: fine)").matches) {
              e.preventDefault()
              document.getElementById(inputId)?.focus()
            }
          }}
        >
          {/* Grab handle: phones get this as a bottom sheet (globals.css). */}
          <span aria-hidden className="mx-auto mt-2.5 block h-1 w-9 rounded-full bg-hairline sm:hidden" />
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 sm:pt-6">
            <div>
              <p className="label mb-2.5">Flying from</p>
              <Dialog.Title className="font-serif text-[clamp(32px,6vw,40px)] leading-none tracking-[-0.02em] text-heavy">
                Where are you now?
              </Dialog.Title>
            </div>
            <Dialog.Close className="iconbtn -mt-1 -mr-2" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </Dialog.Close>
          </div>

          <div className="space-y-3 px-6">
            <label htmlFor={inputId} className="sr-only">
              Search any city
            </label>
            <div className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id={inputId}
                className="field"
                type="search"
                autoComplete="off"
                placeholder="Search any city"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Down arrow jumps from the field into the results.
                  if (e.key === "ArrowDown") {
                    e.preventDefault()
                    listRef.current?.querySelector("button")?.focus()
                  }
                }}
              />
            </div>
            <button type="button" className="ghost w-full gap-2" onClick={handleLocate} disabled={locating}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <circle cx="12" cy="12" r="6" />
              </svg>
              {locating ? "Finding you" : "Use my precise location"}
            </button>
            <p role="status" aria-live="polite" className="min-h-5 text-sm text-error">
              {message}
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <p className="label mb-1">{showingSearch ? (searching ? "Searching" : "Results") : "Popular"}</p>
            <ul ref={listRef}>
              {showingSearch && !searching && results.length === 0 && !message && (
                <li className="py-4 text-muted">No city by that name. Try the English spelling.</li>
              )}
              {(showingSearch
                ? results.map((r) => ({
                    key: String(r.id),
                    name: r.name,
                    country: r.country,
                    detail: [r.admin1, r.country].filter(Boolean).join(", "),
                    lat: r.latitude,
                    lng: r.longitude,
                  }))
                : POPULAR_ORIGINS.map((p) => ({ key: p.name, ...p, detail: p.country ?? "" }))
              ).map((item) => {
                const current = origin?.name === item.name && Math.abs((origin?.lat ?? 0) - item.lat) < 0.05
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      className="-mx-3 flex min-h-12 w-[calc(100%+24px)] cursor-pointer items-center justify-between gap-4 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-surface focus-visible:bg-surface"
                      onClick={() =>
                        choose({ name: item.name, country: item.country, lat: item.lat, lng: item.lng, source: "search" })
                      }
                      onKeyDown={(e) => {
                        const items = listRef.current?.querySelectorAll("button")
                        if (!items) return
                        const i = Array.from(items).indexOf(e.currentTarget)
                        if (e.key === "ArrowDown") {
                          e.preventDefault()
                          items[Math.min(i + 1, items.length - 1)]?.focus()
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault()
                          if (i === 0) document.getElementById(inputId)?.focus()
                          else items[i - 1]?.focus()
                        }
                      }}
                    >
                      <span className="text-[17px] font-medium text-heavy">{item.name}</span>
                      <span className={`label text-right ${current ? "text-ink" : ""}`}>
                        {current ? "Current" : item.detail}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
