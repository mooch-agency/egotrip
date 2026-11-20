"use client"

// Sticky in-page tabs for a long place page. The tab for the section in the
// upper part of the viewport is marked current as you scroll.

import { useEffect, useState } from "react"

export interface SectionTab {
  id: string
  label: string
  count?: number
}

export function SectionTabs({ items }: { items: SectionTab[] }) {
  const [active, setActive] = useState(items[0]?.id)
  const ids = items.map((i) => i.id).join(" ")

  useEffect(() => {
    const els = ids
      .split(" ")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    // A band from just under the tabs to 40% down the screen: whichever
    // section crosses it is the one being read. The callback only receives
    // sections whose state changed, so remember all of them and pick the
    // topmost one still in the band (page order = DOM order).
    const inBand = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) inBand.add(e.target.id)
          else inBand.delete(e.target.id)
        }
        const top = els.find((el) => inBand.has(el.id))
        if (top) setActive(top.id)
        // Nothing in the band and the first section still below it: we're back
        // up in the hero, so the first tab is "next". (Past the last section,
        // the last tab stays lit.)
        else if (els[0] && els[0].getBoundingClientRect().top > 64) setActive(els[0].id)
      },
      { rootMargin: "-64px 0px -60% 0px" },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [ids])

  return (
    <nav aria-label="On this page" className="tabs sticky top-0 z-10">
      {items.map((t) => (
        <a key={t.id} href={`#${t.id}`} aria-current={active === t.id ? "true" : undefined} onClick={() => setActive(t.id)}>
          {t.label}
          {t.count !== undefined && <span className="n">{t.count}</span>}
        </a>
      ))}
    </nav>
  )
}
