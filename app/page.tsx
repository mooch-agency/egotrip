// Home is the app: a one-line pitch, then the ranked list. "How it works" sits
// at the bottom for anyone who wants to know why the list says what it says.
// (/destinations, the old separate list page, redirects here: next.config.mjs.)

import { destinations } from "@/lib/destinations"
import { Topbar } from "@/components/site/topbar"
import { Footer } from "@/components/site/footer"
import { Explorer } from "@/components/explorer/explorer"

const STEPS = [
  {
    tag: "Sun",
    q: "Where's sunny?",
    a: `14-day forecasts for ${destinations.length} cities, ranked by hours of actual sunshine. Not "sunny" icons. Hours.`,
  },
  {
    tag: "Flight",
    q: "Can I get there?",
    a: "Flight time from wherever you are, estimated direct. Set a limit and we hide everything past it.",
  },
  {
    tag: "Cover",
    q: "Can I get away with it?",
    a: "Coworking spaces, cafés with Wi-Fi that holds a call, and three alibis per city, ready to paste into Slack.",
  },
]

export default function Home() {
  return (
    <>
      <Topbar />
      <main id="main" className="mx-auto max-w-[var(--max)] px-[var(--pad-x)]">
        <section className="flex flex-col gap-4 pt-[clamp(28px,5vw,56px)] pb-[clamp(20px,3vw,36px)]">
          {/* "around you" never splits, and balance evens the lines, so it reads
              "The sunniest / cities around you." on phones and one line on desktop. */}
          <h1 className="display reveal text-[clamp(42px,6.5vw,88px)] leading-[0.95] text-balance">
            The sunniest cities <em className="whitespace-nowrap">around you</em>.
          </h1>
          <p className="lead reveal d1 max-w-[58ch]">
            Ranked on hours of sunshine over the next 7 days, with flight times from wherever you are. Every city comes
            with somewhere to take calls and a cover story for the office.
          </p>
        </section>

        <Explorer />

        <section
          id="how"
          aria-labelledby="how-title"
          className="mt-[clamp(72px,9vw,112px)] grid scroll-mt-24 gap-x-14 gap-y-9 border-t border-hairline pt-12 pb-[clamp(72px,9vw,112px)] md:grid-cols-3"
        >
          <h2 id="how-title" className="h2 md:col-span-3">
            Three questions, <em>answered</em>.
          </h2>
          {STEPS.map((s, i) => (
            <div key={s.q} className="flex flex-col gap-3">
              <p className="label">
                0{i + 1} · {s.tag}
              </p>
              <h3 className="font-serif text-[30px] leading-[1.05] tracking-[-0.015em] text-heavy">{s.q}</h3>
              <p className="text-muted">{s.a}</p>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  )
}
