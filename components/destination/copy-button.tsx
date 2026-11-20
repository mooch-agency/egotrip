"use client"

// Mono copy chip (mooch .copy-btn). Shows "Copied" for 2 s, announced to screen readers.

import { useEffect, useRef, useState } from "react"

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setState("copied")
    } catch {
      setState("failed") // Clipboard blocked (permissions, insecure context)
    }
    // A second click restarts the 2 s, rather than the first timer cutting it short.
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), 2000)
  }

  return (
    <button type="button" className="copy-btn shrink-0" data-copied={state === "copied"} onClick={copy}>
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Select it" : label}</span>
    </button>
  )
}
