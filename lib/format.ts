// Display formatting shared by server and client components.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/**
 * [4,5,6,7,8,9,10] → "Apr to Oct". Handles runs that wrap the year
 * ([11,12,1,2] → "Nov to Feb"), single months, all 12, and gaps ("Jan, Mar").
 */
export function formatMonths(months: number[]): string {
  const set = new Set(months)
  if (set.size === 0) return ""
  if (set.size === 12) return "All year"
  const sorted = [...set].sort((a, b) => a - b)
  // Find a start month whose predecessor isn't in the set; if the run is
  // contiguous (with wrap), it covers exactly set.size months from there.
  const start = sorted.find((m) => !set.has(m === 1 ? 12 : m - 1))
  if (start !== undefined) {
    let len = 0
    let m = start
    while (set.has(m)) {
      len++
      m = m === 12 ? 1 : m + 1
    }
    if (len === set.size) {
      const end = ((start - 1 + len - 1) % 12) + 1
      return len === 1 ? MONTHS[start - 1] : `${MONTHS[start - 1]} to ${MONTHS[end - 1]}`
    }
  }
  return sorted.map((m) => MONTHS[m - 1]).join(", ")
}

/** "Tue 19" style short label for a YYYY-MM-DD date, read as a calendar date (no TZ shift). */
export function formatDay(isoDate: string): { weekday: string; day: string } {
  const [y, m, d] = isoDate.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return {
    weekday: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
    day: String(d),
  }
}

/** Two-digit rank: 1 → "01". */
export const pad2 = (n: number) => String(n).padStart(2, "0")

/** Google Flights search for a destination airport, from the origin when we know its name. */
export function flightsUrl(airport: string, originName?: string): string {
  const q = originName ? `Flights to ${airport} from ${originName}` : `Flights to ${airport}`
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`
}
