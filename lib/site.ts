// Canonical site URL for metadata, sitemap and robots. Set NEXT_PUBLIC_APP_URL
// in Vercel to the production domain; the fallback is the default Vercel host.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://egotrip.vercel.app").replace(/\/$/, "")
