"use client"

// "Getting there": the facts that depend on the visitor (flight time from
// their origin, live sun and highs, local time) and the booking link. On
// phones and tablets the booking link moves to TripDock, fixed to the bottom
// of the screen so it's in reach wherever you've scrolled. The dock is a
// separate component because the card sits inside a .reveal wrapper, whose
// transform and filter would make `position: fixed` relative to the wrapper.

import { useEffect, useState } from "react"
import type { Destination } from "@/lib/destinations"
import { flightHours, formatHours } from "@/lib/geo"
import { flightsUrl, formatMonths } from "@/lib/format"
import { avgHigh, avgSun } from "@/lib/forecast/summary"
import { searchableName } from "@/lib/origin"
import { useOrigin } from "@/components/origin/origin-provider"
import { useForecasts } from "@/components/forecast/use-forecasts"

export type TripFacts = Pick<
  Destination,
  "slug" | "lat" | "lng" | "airport" | "timezone" | "currency" | "bestMonths" | "avgSunHours"
>

function useLocalTime(timeZone: string) {
  const [time, setTime] = useState<string | null>(null)
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [timeZone])
  return time
}

/** Flight time and booking link from the visitor's origin; shared by card and dock. */
function useFlight(d: TripFacts) {
  const { origin } = useOrigin()
  const hours = origin ? flightHours(origin, d) : null
  // Only real place names go in the flight search (not "Your location").
  const fromName = searchableName(origin)
  return {
    origin,
    hours,
    fromName,
    flight: hours === null ? "–" : hours === 0 ? "You're here" : `About ${formatHours(hours)}`,
    href: flightsUrl(d.airport, fromName),
  }
}

export function TripCard({ d }: { d: TripFacts }) {
  const { origin, fromName, flight, href } = useFlight(d)
  const forecast = useForecasts()
  const localTime = useLocalTime(d.timezone)

  const days = forecast.status === "ready" ? forecast.data.forecasts[d.slug] : undefined
  const liveSun = avgSun(days)
  const high = avgHigh(days)

  const stats = [
    { label: liveSun === null ? "Sun, typical" : "Sun a day", value: `${(liveSun ?? d.avgSunHours).toFixed(1)}h`, testId: "fact-sun" },
    { label: "Highs", value: high === null ? "–" : `${high}°` },
    { label: "Local time", value: localTime ?? "–" },
    { label: "Best months", value: formatMonths(d.bestMonths), small: true },
  ]

  return (
    <aside className="card flex flex-col gap-6 p-6 sm:p-7" aria-label="Getting there">
      <div>
        <p className="label">Flight from {origin?.name ?? "you"}</p>
        <p className="mt-2.5 font-serif text-[clamp(44px,5vw,56px)] leading-none tracking-[-0.02em] text-heavy" data-testid="fact-flight">
          {flight}
        </p>
        <p className="mt-2 text-sm text-muted">Direct estimate. Real routes vary.</p>
      </div>
      <dl className="tiles grid-cols-2 shadow-none ring-1 ring-hairline">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-3.5">
            <dt className="label">{s.label}</dt>
            <dd
              className={`mt-1.5 font-medium text-heavy tabular-nums ${s.small ? "text-[15px] leading-snug" : "text-[20px] leading-tight tracking-[-0.01em]"}`}
              data-testid={s.testId}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3">
        <a
          className="pill hidden min-h-12 w-full lg:inline-flex"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="find-flights"
        >
          Find flights{fromName ? ` from ${fromName}` : ""} <span className="arrow" aria-hidden>→</span>
          <span className="sr-only">(opens Google Flights in a new tab)</span>
        </a>
        <p className="label text-center">
          Airport {d.airport} · Pay in {d.currency}
        </p>
      </div>
    </aside>
  )
}

export function TripDock({ d }: { d: TripFacts }) {
  const { origin, hours, flight, href } = useFlight(d)
  return (
    <div className="dock lg:hidden">
      <div className="min-w-0">
        <p className="font-serif text-[24px] leading-none text-heavy">{flight}</p>
        <p className="label mt-1 truncate">{hours === 0 ? "No flight needed" : `From ${origin?.name ?? "you"}, direct est.`}</p>
      </div>
      <a className="pill min-h-12" href={href} target="_blank" rel="noopener noreferrer" data-testid="find-flights-dock">
        Find flights <span className="arrow" aria-hidden>→</span>
        <span className="sr-only">(opens Google Flights in a new tab)</span>
      </a>
    </div>
  )
}
