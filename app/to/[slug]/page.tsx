// /to/<slug>: one destination. Static content is pre-rendered for all
// destinations at build; flight time, forecast, local time and the ranking
// (for "Next" and "Also sunny") load on the client.
//
// Layout: a hero with the "Getting there" card beside it on desktop (a dock on
// phones), sticky section tabs, then forecast, work, after hours and cover
// story, ending on more sunny places so the page never dead-ends.

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { destinations, getDestination, CROWD_CHIP, WORKSPACE_LABEL } from "@/lib/destinations"
import { Topbar } from "@/components/site/topbar"
import { Footer } from "@/components/site/footer"
import { PlaceNav } from "@/components/destination/place-nav"
import { TripCard, TripDock, type TripFacts } from "@/components/destination/trip-card"
import { SectionTabs } from "@/components/destination/section-tabs"
import { ForecastGrid } from "@/components/destination/forecast-grid"
import { AfterHours } from "@/components/destination/after-hours"
import { AlsoSunny } from "@/components/destination/also-sunny"
import { CopyButton } from "@/components/destination/copy-button"

export const dynamicParams = false // Unknown slugs 404 without a render

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }))
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = getDestination((await params).slug)
  if (!d) return {}
  return {
    title: `${d.name}, ${d.country}`,
    description: `${d.tagline} 14-day forecast, places to work, things to do and a cover story for the office.`,
    alternates: { canonical: `/to/${d.slug}` },
  }
}

// scroll-mt clears the sticky tabs (52px) when a tab link jumps here.
function Section({ id, title, first, children }: { id: string; title: React.ReactNode; first?: boolean; children: React.ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-14 py-14 sm:py-20 ${first ? "" : "border-t border-hairline"}`}
    >
      <h2 id={`${id}-title`} className="h2 mb-7">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default async function DestinationPage({ params }: Props) {
  const d = getDestination((await params).slug)
  if (!d) notFound()

  // Only what the client components need crosses the server/client boundary.
  const trip: TripFacts = {
    slug: d.slug,
    lat: d.lat,
    lng: d.lng,
    airport: d.airport,
    timezone: d.timezone,
    currency: d.currency,
    bestMonths: d.bestMonths,
    avgSunHours: d.avgSunHours,
  }
  const tabs = [
    { id: "forecast", label: "Forecast" },
    { id: "work", label: "Where to work", count: d.workspaces.length },
    { id: "after", label: "After hours", count: d.places.length },
    { id: "cover", label: "Cover story", count: d.alibis.length },
  ]

  return (
    <>
      <Topbar />
      <main id="main" className="px-[var(--pad-x)]">
        <article className="mx-auto max-w-[var(--max)]">
          <PlaceNav slug={d.slug} />

          <header className="grid gap-10 pt-[clamp(20px,4vw,48px)] pb-[clamp(40px,6vw,72px)] lg:grid-cols-[minmax(0,1fr)_400px] lg:items-end lg:gap-16">
            <div className="flex min-w-0 flex-col gap-5">
              <p className="reveal flex flex-wrap gap-2">
                <span className="tag">{d.country}</span>
                <span className="tag">{d.region}</span>
                <span className="tag">{CROWD_CHIP[d.crowd]}</span>
              </p>
              <h1 className="display reveal d1 break-words text-[clamp(64px,11vw,160px)] leading-[0.9]">{d.name}</h1>
              <p className="reveal d2 max-w-[28ch] font-serif text-[clamp(24px,2.8vw,34px)] leading-[1.15] tracking-[-0.01em] text-heavy italic">
                {d.tagline}
              </p>
              <p className="lead reveal d3 max-w-[56ch]">{d.description}</p>
            </div>
            <div className="reveal d3">
              <TripCard d={trip} />
            </div>
          </header>

          <SectionTabs items={tabs} />

          <Section id="forecast" first title={<>The next <em>14 days</em>.</>}>
            <ForecastGrid slug={d.slug} typicalSun={d.avgSunHours} />
          </Section>

          <Section id="work" title={<>Somewhere to <em>take the call</em>.</>}>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="workspaces">
              {d.workspaces.map((w) => (
                <li key={w.name} className="card flex flex-col gap-3 p-6">
                  <p className="label">
                    {WORKSPACE_LABEL[w.type]} · {w.area}
                  </p>
                  <h3 className="font-serif text-[28px] leading-[1.05] tracking-[-0.015em] text-heavy">{w.name}</h3>
                  <p className="text-muted">{w.note}</p>
                  <p className="mt-auto flex items-center gap-3 border-t border-hairline pt-4">
                    <span className="label">Wi-Fi</span>
                    <span className="wifi" role="img" aria-label={`Wi-Fi ${w.wifi} of 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={i < w.wifi ? "on" : undefined} />
                      ))}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="label mt-4">Wi-Fi ratings go on reputation, not a speed test. Check before you go.</p>
          </Section>

          <Section id="after" title={<>For when the <em>laptop</em> closes.</>}>
            <AfterHours places={d.places} />
          </Section>

          <Section id="cover" title={<>For the <em>stand-up</em>.</>}>
            <ul className="grid gap-3 md:grid-cols-3" data-testid="alibis">
              {d.alibis.map((a) => (
                <li key={a} className="card flex flex-col justify-between gap-6 bg-surface p-6">
                  <blockquote className="font-serif text-[clamp(22px,2vw,26px)] leading-[1.25] text-heavy">“{a}”</blockquote>
                  <CopyButton text={a} label="Copy alibi" />
                </li>
              ))}
            </ul>
            <div className="mt-12">
              <p className="label mb-3">Recently spotted</p>
              <ul className="space-y-2">
                {d.spotted.map((s) => (
                  <li key={s} className="font-serif text-[clamp(20px,1.8vw,24px)] leading-snug text-muted italic">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          <AlsoSunny slug={d.slug} />
        </article>
        <TripDock d={trip} />
      </main>
      <Footer dockSpace />
    </>
  )
}
