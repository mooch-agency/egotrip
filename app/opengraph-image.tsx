import { destinations } from "@/lib/destinations"
import { ogCard, OG_SIZE } from "@/lib/og"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Egotrip. Cloudy here? Leave."

export default function Image() {
  return ogCard({
    eyebrow: `${destinations.length} sunny cities, ranked by flight time`,
    title: "Cloudy here?",
    italic: "Leave.",
    footer: "14-day forecasts · Places to work · Alibis",
  })
}
