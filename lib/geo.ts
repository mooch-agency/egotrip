// Distance and flight-time estimates. Pure functions, no I/O.

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_KM = 6371
// Real routes are rarely great circles: airways, departures and holding add ~10%.
const ROUTING_FACTOR = 1.1
// Typical narrow/wide-body cruise ground speed.
const CRUISE_KMH = 830
// Taxi, climb and descent, which the cruise maths doesn't cover.
const OVERHEAD_HOURS = 40 / 60

const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance in km (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Estimated direct flight time in hours, rounded to the nearest 15 minutes.
 * Under ~150 km nobody flies, so we return 0 and the UI says "you're here".
 */
export function flightHours(from: LatLng, to: LatLng): number {
  const km = distanceKm(from, to)
  if (km < 150) return 0
  const hours = (km * ROUTING_FACTOR) / CRUISE_KMH + OVERHEAD_HOURS
  return Math.round(hours * 4) / 4
}

/** "2h 45m", "45m", "11h". */
export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
