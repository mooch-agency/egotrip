// Minimal weather glyphs drawn from the palette: the sun is the one borrowed
// colour (--sun), everything else is ink or muted. 24×24 viewBox, scales with size.

import type { WeatherKind } from "@/lib/forecast/weather-codes"

// Takes a kind, not a WMO code: callers decide what the day looked like
// (see dayKind), so the icon and the label always agree.
export function WeatherIcon({ kind, label, size = 24 }: { kind: WeatherKind; label: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label}>
      {kind === "sun" && <circle cx="12" cy="12" r="7" fill="var(--sun)" />}
      {kind === "part" && (
        <>
          <circle cx="10" cy="10" r="6.5" fill="var(--sun)" />
          <path d="M8 19h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.6A3.2 3.2 0 0 0 8 19z" fill="var(--paper)" stroke="var(--muted)" strokeWidth="1.5" />
        </>
      )}
      {(kind === "cloud" || kind === "rain" || kind === "storm" || kind === "snow") && (
        <path d="M7 16h10.5a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.4 1.6A3.2 3.2 0 0 0 7 16z" fill="none" stroke="var(--muted)" strokeWidth="1.5" />
      )}
      {kind === "rain" && (
        <path d="M9 18.5l-1 2.5M13 18.5l-1 2.5M17 18.5l-1 2.5" stroke="var(--rain)" strokeWidth="1.5" strokeLinecap="round" />
      )}
      {kind === "storm" && <path d="M12.5 17l-2 3h3l-2 3" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />}
      {kind === "snow" && (
        <g fill="var(--muted)">
          <circle cx="9" cy="20" r="1" />
          <circle cx="13" cy="21" r="1" />
          <circle cx="17" cy="20" r="1" />
        </g>
      )}
      {kind === "fog" && <path d="M5 10h14M3 14h18M6 18h12" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  )
}
