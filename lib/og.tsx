// Shared Open Graph card: white paper, mono eyebrow, big Instrument Serif
// headline, a sun disc. PNG, because X, LinkedIn and Facebook ignore SVG cards.

import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const OG_SIZE = { width: 1200, height: 630 }

const fonts = Promise.all([
  readFile(join(process.cwd(), "app/fonts/InstrumentSerif-Regular.ttf")),
  readFile(join(process.cwd(), "app/fonts/InstrumentSerif-Italic.ttf")),
])

export async function ogCard({ eyebrow, title, italic, footer }: { eyebrow: string; title: string; italic?: string; footer: string }) {
  const [regular, italicFont] = await fonts
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          color: "#000000",
          padding: "64px 72px",
          fontFamily: "Instrument Serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "monospace", fontSize: 22, letterSpacing: 4, textTransform: "uppercase", color: "#5a5a5f" }}>
          <div style={{ width: 36, height: 2, background: "#1d1d1f" }} />
          {eyebrow}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: title.length > 14 ? 120 : 168, lineHeight: 0.92, letterSpacing: -4, maxWidth: 880 }}>
            <span>{title}</span>
            {italic && <span style={{ fontStyle: "italic", marginLeft: 28 }}>{italic}</span>}
          </div>
          <div style={{ width: 150, height: 150, borderRadius: 999, background: "#f5a623", flexShrink: 0 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #d2d2d7", paddingTop: 24, fontFamily: "monospace", fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#5a5a5f" }}>
          <span>{footer}</span>
          <span>Egotrip · A Mooch plaything</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Instrument Serif", data: regular, style: "normal", weight: 400 },
        { name: "Instrument Serif", data: italicFont, style: "italic", weight: 400 },
      ],
    },
  )
}
