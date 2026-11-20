"use client"

// Things to do, filterable by category. "All" lists them in the canonical
// category order (eat, drink, see, swim, walk, day trip).

import { useState } from "react"
import { CATEGORY_LABEL, PLACE_CATEGORIES, type Place, type PlaceCategory } from "@/lib/destinations"

export function AfterHours({ places }: { places: Place[] }) {
  const [cat, setCat] = useState<PlaceCategory | "all">("all")
  const cats = PLACE_CATEGORIES.filter((c) => places.some((p) => p.category === c))
  const ordered = [...places].sort((a, b) => PLACE_CATEGORIES.indexOf(a.category) - PLACE_CATEGORIES.indexOf(b.category))
  const shown = cat === "all" ? ordered : ordered.filter((p) => p.category === cat)

  return (
    <div>
      <div role="group" aria-label="Show" className="mb-6 flex flex-wrap gap-2">
        <button type="button" className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>
          All <span className="n">{places.length}</span>
        </button>
        {cats.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_LABEL[c]} <span className="n">{places.filter((p) => p.category === c).length}</span>
          </button>
        ))}
      </div>
      <ul className="tiles grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))]" data-testid="places">
        {shown.map((p) => (
          <li key={p.name} className="flex flex-col gap-2.5 p-6">
            <p className="label">
              {CATEGORY_LABEL[p.category]}
              {p.area && ` · ${p.area}`}
            </p>
            <h3 className="font-serif text-[28px] leading-[1.05] tracking-[-0.015em] text-heavy">{p.name}</h3>
            <p className="text-muted">{p.note}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
