import { destinations, getDestination } from "@/lib/destinations"
import { ogCard, OG_SIZE } from "@/lib/og"
import { formatMonths } from "@/lib/format"

export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Egotrip destination card"

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const d = getDestination((await params).slug)!
  return ogCard({
    eyebrow: `${d.country} · ${d.region}`,
    title: d.name,
    footer: `${d.avgSunHours.toFixed(1)} hours of sun a day · Best ${formatMonths(d.bestMonths)}`,
  })
}
