// One ranked place as a tile in the hairline grid. The same tile serves the
// home grid (3 across on desktop, a list on phones) and "Also sunny" on the
// place page. data-hours lets tests read flight time without parsing text.

import Link from "next/link"
import type { Ranked } from "@/lib/rank"
import { formatHours } from "@/lib/geo"
import { pad2 } from "@/lib/format"
import { SunStrip } from "@/components/forecast/sun-strip"

export function DestinationTile({ item, rank }: { item: Ranked; rank: number }) {
  const { destination: d, hours, sun, sunSource, high, forecast } = item
  return (
    <li>
      <Link
        href={`/to/${d.slug}`}
        className="tile group gap-3 px-5 py-5 sm:gap-4 sm:px-6 sm:py-6"
        data-testid="destination-row"
        data-slug={d.slug}
        data-hours={hours}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="label tabular-nums">{pad2(rank)}</span>
          <span className="label tabular-nums" data-testid="tile-flight">
            {hours === 0 ? "You're here" : `${formatHours(hours)} flight`}
          </span>
        </span>
        <span className="block min-w-0">
          <span className="block truncate font-serif text-[32px] leading-none tracking-[-0.02em] text-heavy sm:text-[38px]">
            {d.name}
          </span>
          <span className="label mt-1.5 block truncate" data-testid="tile-meta">
            {d.country} · {d.region}
          </span>
        </span>
        {forecast ? <SunStrip forecast={forecast} /> : <span className="label">No live forecast</span>}
        <span className="flex items-baseline justify-between gap-3 text-[15px] text-muted">
          <span className="tabular-nums">
            <b className="font-semibold text-heavy">{sun.toFixed(1)}h</b> sun a day
            {sunSource === "typical" && ", typical"}
            {high !== null && (
              <>
                {" · "}
                <b className="font-semibold text-heavy">{high}°</b> highs
              </>
            )}
          </span>
          <span className="arrow text-muted group-hover:text-ink" aria-hidden>
            →
          </span>
        </span>
      </Link>
    </li>
  )
}

export function DestinationTileSkeleton() {
  return (
    <li aria-hidden className="flex flex-col gap-4 px-5 py-6 sm:px-6">
      <span className="flex justify-between">
        <span className="skeleton block h-3 w-6" />
        <span className="skeleton block h-3 w-20" />
      </span>
      <span className="skeleton block h-8 w-[min(220px,70%)]" />
      <span className="skeleton block h-3 w-28" />
      <span className="flex gap-[5px]">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className="skeleton block size-[9px] rounded-full" />
        ))}
      </span>
      <span className="skeleton block h-4 w-40" />
    </li>
  )
}
