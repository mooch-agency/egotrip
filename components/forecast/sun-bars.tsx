// One bar per day, height = hours of direct sun (14h fills the track, the same
// scale as the place page's day cells). Wet days are drawn in --rain so rain
// still reads in greyscale. Decorative colour only: the caption carries the facts.

import type { ForecastDay } from "@/lib/forecast/types"
import { dayKind, isWet } from "@/lib/forecast/weather-codes"
import { fairDays } from "@/lib/forecast/summary"
import { formatDay } from "@/lib/format"

const MAX_SUN = 14

export function SunBars({ forecast, height = 104 }: { forecast: ForecastDay[]; height?: number }) {
  // Days with no sunshine data are left out of the range, not counted as 0 h.
  const known = forecast.map((d) => d.sunHours).filter((v): v is number => v !== null)
  const range = known.length
    ? `${Math.min(...known).toFixed(1)} to ${Math.max(...known).toFixed(1)} hours of sun a day`
    : "no sunshine data"
  return (
    <figure>
      <div
        className="bars"
        role="img"
        aria-label={`Next ${forecast.length} days: ${range}`}
        style={{ "--bars-h": `${height}px` } as React.CSSProperties}
      >
        {forecast.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-2">
            <div className="track w-full">
              <div
                className={`fill${isWet(dayKind(day)) ? " wet" : ""}`}
                style={{ height: `${Math.min(100, ((day.sunHours ?? 0) / MAX_SUN) * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-quiet sm:text-[11px]">{formatDay(day.date).weekday[0]}</span>
          </div>
        ))}
      </div>
      <figcaption className="label mt-3">
        {fairDays(forecast)} of {forecast.length} days sunny or partly sunny
      </figcaption>
    </figure>
  )
}
