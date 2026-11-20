"use client"

// The next 14 days for one destination. Desktop: two rows of 7 in a hairline
// grid. Phones: a row of day cards you swipe through, so the section stays
// short. Says where the data came from and when.

import { useEffect, useState } from "react"
import type { ForecastDay } from "@/lib/forecast/types"
import { dayKind, dayLabel } from "@/lib/forecast/weather-codes"
import { avgSun, fairDays } from "@/lib/forecast/summary"
import { formatDay } from "@/lib/format"
import { useForecasts } from "@/components/forecast/use-forecasts"
import { WeatherIcon } from "@/components/forecast/weather-icon"

const MAX_SUN = 14 // Bar scale: 14 h of sun fills the track

// Shared by the real list and the skeleton so the swap causes no layout shift.
// scroll-px keeps snapped cards on the page gutter instead of the screen edge.
const LIST =
  "-mx-[var(--pad-x)] flex snap-x snap-mandatory scroll-px-[var(--pad-x)] gap-2 overflow-x-auto px-[var(--pad-x)] pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-7 sm:gap-px sm:overflow-hidden sm:rounded-[10px] sm:bg-hairline sm:p-0 sm:shadow-[var(--shadow-border)]"
const CELL =
  "card flex w-[108px] shrink-0 snap-start flex-col gap-3 p-3.5 sm:w-auto sm:rounded-none sm:bg-paper sm:p-4 sm:shadow-none"

export function ForecastGrid({ slug, typicalSun }: { slug: string; typicalSun: number }) {
  const state = useForecasts()
  const narrow = useNarrow() // Before any early return: hooks must run in the same order every render

  if (state.status === "loading") {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Loading forecast
        </span>
        <span className="skeleton mb-7 block h-5 w-[min(420px,80%)]" />
        <div className={LIST}>
          {Array.from({ length: 14 }, (_, i) => (
            <div key={i} className={`${CELL} h-[156px]`}>
              <span className="skeleton block h-3 w-10" />
              <span className="skeleton block size-7 rounded-full" />
              <span className="skeleton block h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const days = state.status === "ready" ? state.data.forecasts[slug] : undefined
  if (!days?.length) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-4 px-5 py-5">
        <p>Live forecast unavailable. Typically about {typicalSun.toFixed(1)} hours of sun a day here.</p>
        <button type="button" className="ghost" onClick={state.retry}>
          Try again
        </button>
      </div>
    )
  }

  const updated = state.status === "ready" ? new Date(state.data.generatedAt) : null
  const sun = avgSun(days, days.length) // null when Open-Meteo sent no sunshine data
  return (
    <div>
      <p className="lead mb-7 max-w-[52ch]" data-testid="forecast-summary">
        {fairDays(days)} of {days.length} days sunny or partly sunny
        {sun === null ? "." : `, averaging ${sun.toFixed(1)} hours of sun a day.`}
      </p>
      {/* Focusable on phones only, where it scrolls, so keyboard users can move through it. */}
      <ol className={LIST} data-testid="forecast-days" tabIndex={narrow ? 0 : undefined} aria-label="Daily forecast">
        {days.map((day, i) => (
          <DayCell key={day.date} day={day} isToday={i === 0} />
        ))}
      </ol>
      <p className="label mt-4 leading-relaxed">
        Open-Meteo{updated ? `, fetched ${updated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}.
        Sunshine is hours of direct sun. Sunny means 70% of daylight in direct sun, partly sunny 40% or more.
      </p>
    </div>
  )
}

/** True below Tailwind's sm breakpoint, where the day list is a horizontal scroller. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639.98px)")
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return narrow
}

function DayCell({ day, isToday }: { day: ForecastDay; isToday: boolean }) {
  const { weekday, day: dayNum } = formatDay(day.date)
  const sun = day.sunHours ?? 0
  return (
    <li className={CELL}>
      <span className="label">
        {isToday ? "Today" : weekday} <span className="text-ink">{dayNum}</span>
      </span>
      <WeatherIcon kind={dayKind(day)} label={dayLabel(day)} size={28} />
      <span>
        <span className="font-serif text-[28px] leading-none text-heavy tabular-nums">{day.max}°</span>
        <span className="ml-1.5 text-sm text-muted tabular-nums">{day.min}°</span>
      </span>
      <span className="block">
        <span className="sunbar" aria-hidden>
          <span style={{ width: `${Math.min(100, (sun / MAX_SUN) * 100)}%` }} />
        </span>
        <span className="mt-1.5 flex flex-wrap justify-between gap-x-2 font-mono text-[11px] text-quiet tabular-nums">
          <span>{day.sunHours === null ? "–" : `${sun.toFixed(1)}h sun`}</span>
          {day.rainChance !== null && day.rainChance >= 20 && <span>{day.rainChance}% rain</span>}
        </span>
      </span>
    </li>
  )
}
