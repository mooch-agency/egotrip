"use client"

// Three more places from the visitor's default ranking, so a place page never
// dead-ends. Ranks match the home list.

import Link from "next/link"
import { useDefaultRanking } from "@/components/explorer/use-default-ranking"
import { DestinationTile, DestinationTileSkeleton } from "@/components/explorer/destination-tile"

export function AlsoSunny({ slug }: { slug: string }) {
  const ranking = useDefaultRanking()
  const picks = ranking.ready
    ? ranking.results.map((item, i) => ({ item, rank: i + 1 })).filter((p) => p.item.destination.slug !== slug).slice(0, 3)
    : []
  if (ranking.ready && !picks.length) return null

  return (
    <section aria-labelledby="also-title" className="border-t border-hairline py-14 sm:py-20">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="also-title" className="h2 text-[28px] sm:text-[32px]">
          Also sunny,{" "}
          <em>{!ranking.ready ? "nearby" : ranking.radius === null ? "anywhere" : `within ${ranking.radius} hours`}</em>.
        </h2>
        <Link href="/" className="label inline-flex min-h-11 items-center underline decoration-hairline-focus underline-offset-4 hover:text-ink">
          See the full list
        </Link>
      </div>
      <ol className="tiles grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))]" aria-label="More sunny places">
        {ranking.ready
          ? picks.map((p) => <DestinationTile key={p.item.destination.slug} item={p.item} rank={p.rank} />)
          : Array.from({ length: 3 }, (_, i) => <DestinationTileSkeleton key={i} />)}
      </ol>
    </section>
  )
}
