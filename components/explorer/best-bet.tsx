// The #1 place by sunshine, given room to make its case: name, tagline, four
// stats and 14 days of sun as bars. Shown only when the list is sorted by sun,
// because "best bet" means nothing on a "closest" sort.

import Link from "next/link"
import type { Ranked } from "@/lib/rank"
import { CROWD_LABEL } from "@/lib/destinations"
import { formatHours } from "@/lib/geo"
import { SunBars } from "@/components/forecast/sun-bars"

export function BestBet({ item }: { item: Ranked }) {
  const { destination: d, hours, sun, sunSource, high, forecast } = item
  const stats = [
    { label: "Flight", value: hours === 0 ? "You're here" : `About ${formatHours(hours)}` },
    { label: sunSource === "typical" ? "Sun, typical" : "Sun a day", value: `${sun.toFixed(1)}h` },
    { label: "Highs", value: high === null ? "–" : `${high}°` },
    { label: "To work", value: `${d.workspaces.length} places` },
  ]
  return (
    <article
      className="card grid gap-10 p-6 sm:p-9 lg:grid-cols-2 lg:gap-12 lg:p-11"
      aria-labelledby="best-bet-name"
      data-testid="destination-row"
      data-slug={d.slug}
      data-hours={hours}
    >
      <div className="flex min-w-0 flex-col gap-5">
        <p className="eyebrow">Best bet this week</p>
        <div>
          <h2
            id="best-bet-name"
            className="font-serif text-[clamp(56px,8vw,112px)] leading-[0.92] tracking-[-0.025em] break-words text-heavy"
          >
            {d.name}
          </h2>
          <p className="label mt-3">
            {d.country} · {d.region} · {CROWD_LABEL[d.crowd]}
          </p>
        </div>
        <p className="max-w-[26ch] font-serif text-[clamp(22px,2.4vw,30px)] leading-[1.2] tracking-[-0.01em] text-heavy italic">
          {d.tagline}
        </p>
        <div className="mt-auto pt-2">
          <Link href={`/to/${d.slug}`} className="pill">
            See {d.name} <span className="arrow" aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-7">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="label">{s.label}</dt>
              <dd className="mt-1.5 text-[20px] leading-tight font-medium tracking-[-0.01em] text-heavy tabular-nums sm:text-[22px]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
        {forecast?.length ? (
          <SunBars forecast={forecast} />
        ) : (
          <p className="text-muted">Live forecast unavailable. Typically {d.avgSunHours.toFixed(1)} hours of sun a day here.</p>
        )}
      </div>
    </article>
  )
}

export function BestBetSkeleton() {
  return (
    <div className="card grid gap-10 p-6 sm:p-9 lg:grid-cols-2 lg:gap-12 lg:p-11" aria-hidden>
      <div className="flex flex-col gap-5">
        <span className="skeleton block h-3 w-36" />
        <span className="skeleton block h-20 w-[min(420px,85%)]" />
        <span className="skeleton block h-3 w-48" />
        <span className="skeleton block h-7 w-[min(360px,90%)]" />
        <span className="skeleton mt-4 block h-11 w-40 rounded-full" />
      </div>
      <div className="flex flex-col gap-7">
        <span className="skeleton block h-12 w-full" />
        <span className="skeleton block h-[104px] w-full" />
      </div>
    </div>
  )
}
