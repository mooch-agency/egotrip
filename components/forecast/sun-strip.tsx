// 14 dots, one per day. Fill strength = hours of sunshine (12 h = full --sun);
// wet days are a hollow muted ring so rain reads at a glance even in greyscale.

import type { ForecastDay } from "@/lib/forecast/types"
import { dayKind, isWet } from "@/lib/forecast/weather-codes"
import { fairDays } from "@/lib/forecast/summary"

export function SunStrip({ forecast, className = "" }: { forecast: ForecastDay[]; className?: string }) {
  const fair = fairDays(forecast)
  return (
    <div
      className={`flex items-center gap-[5px] ${className}`}
      role="img"
      aria-label={`${fair} of ${forecast.length} days sunny or partly sunny`}
    >
      {forecast.map((day) => {
        const wet = isWet(dayKind(day))
        const strength = Math.min(1, Math.max(0.12, (day.sunHours ?? 0) / 12))
        return (
          <span
            key={day.date}
            className="block size-[9px] shrink-0 rounded-full"
            style={
              wet
                ? { boxShadow: "inset 0 0 0 1.5px var(--rain)" }
                : { background: `color-mix(in srgb, var(--sun) ${Math.round(strength * 100)}%, var(--hairline))` }
            }
          />
        )
      })}
    </div>
  )
}

export function SunStripSkeleton() {
  return (
    <div className="flex items-center gap-[5px]" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} className="skeleton block size-[9px] rounded-full" />
      ))}
    </div>
  )
}
