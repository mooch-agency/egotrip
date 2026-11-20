"use client"

// Back to the list, and where this place sits in it ("01 of 30 · Next:
// Marrakech"), using the same default ranking the home page opens on.

import Link from "next/link"
import { pad2 } from "@/lib/format"
import { useDefaultRanking } from "@/components/explorer/use-default-ranking"

export function PlaceNav({ slug }: { slug: string }) {
  const ranking = useDefaultRanking()
  const list = ranking.ready ? ranking.results : []
  const i = list.findIndex((r) => r.destination.slug === slug)
  const next = i >= 0 && list.length > 1 ? list[(i + 1) % list.length] : null
  const scope = ranking.ready
    ? `${list.length} places ${ranking.radius === null ? "at any distance" : `within ${ranking.radius}h of ${ranking.from}`}`
    : "All places"

  return (
    <nav aria-label="Place navigation" className="flex flex-wrap items-center justify-between gap-x-6 py-2">
      <Link href="/" className="label inline-flex min-h-11 items-center gap-2 hover:text-ink">
        <span aria-hidden>←</span>
        <span className="sm:hidden">All places</span>
        <span className="max-sm:hidden">{scope}</span>
      </Link>
      {next && (
        <div className="flex items-center gap-4">
          <span className="label tabular-nums max-sm:hidden">
            {pad2(i + 1)} of {list.length}
          </span>
          <Link
            href={`/to/${next.destination.slug}`}
            className="label inline-flex min-h-11 items-center gap-2 text-ink hover:text-heavy"
          >
            Next: {next.destination.name} <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
