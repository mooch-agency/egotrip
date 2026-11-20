"use client"

// App bar: wordmark left, the origin ("From London ▾") and theme toggle right.
// The origin is the app's one required input, so it gets the most visible control.

import Link from "next/link"
import { OriginPicker } from "@/components/origin/origin-picker"
import { useOrigin } from "@/components/origin/origin-provider"
import { ThemeToggle } from "./theme-toggle"

export function Topbar() {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-hairline bg-paper px-[var(--pad-x)] py-3">
      <Link href="/" className="wordmark text-[26px] sm:text-[30px]">
        Egotrip
      </Link>
      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <OriginButton />
        <ThemeToggle />
      </div>
    </header>
  )
}

export function OriginButton() {
  const { origin } = useOrigin()
  return (
    <OriginPicker
      trigger={
        // No aria-label: the visible "From Lisbon" must be the start of the
        // accessible name (WCAG 2.5.3), so the hint for screen readers is appended.
        <button type="button" className="origin-btn min-w-0">
          <span className="font-normal text-muted">From</span>{" "}
          <span className="truncate">{origin ? origin.name : "Locating"}</span>
          <span className="sr-only">, change city</span>
          <span aria-hidden className="text-muted">
            ▾
          </span>
        </button>
      }
    />
  )
}
