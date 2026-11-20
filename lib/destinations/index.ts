import type { Destination } from "./types"
import { europeWest } from "./data/europe-west"
import { europeMed } from "./data/europe-med"
import { africaMiddleEast } from "./data/africa-middle-east"
import { asia } from "./data/asia"
import { northAmerica } from "./data/north-america"
import { southOceania } from "./data/south-oceania"

export * from "./types"
export * from "./labels"

// Every destination, in a stable order. The order matters: /api/forecast sends
// coordinates to Open-Meteo in this order and maps results back by index.
export const destinations: Destination[] = [
  ...europeWest,
  ...europeMed,
  ...africaMiddleEast,
  ...asia,
  ...northAmerica,
  ...southOceania,
]

const bySlug = new Map(destinations.map((d) => [d.slug, d]))

export function getDestination(slug: string): Destination | undefined {
  return bySlug.get(slug)
}
