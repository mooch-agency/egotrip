import { destinations } from "@/lib/destinations"
import { ogCard, OG_SIZE } from "@/lib/og"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Egotrip. The sunniest cities around you."

export default function Image() {
  return ogCard({
    eyebrow: `${destinations.length} cities, ranked by hours of sun`,
    title: "The sunniest cities",
    italic: "around you.",
    footer: "14-day forecasts · Places to work · Alibis",
  })
}
