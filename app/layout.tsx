import type { Metadata, Viewport } from "next"
import { Instrument_Serif } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Analytics } from "@vercel/analytics/next"
import { OriginProvider } from "@/components/origin/origin-provider"
import { destinations } from "@/lib/destinations"
import { SITE_URL } from "@/lib/site"
import "./globals.css"

// Mooch's display face. next/font self-hosts it and generates a metric-matched
// fallback, so the swap causes no layout shift.
const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument",
  display: "swap",
})

const DESCRIPTION = `The sunniest places you can fly to from wherever you are. 14-day forecasts for ${destinations.length} cities, somewhere to take calls, and a cover story for the office.`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Egotrip. The sunniest cities around you.", template: "%s · Egotrip" },
  description: DESCRIPTION,
  applicationName: "Egotrip",
  authors: [{ name: "Mooch", url: "https://mooch.agency" }],
  creator: "Mooch",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: "Egotrip",
    title: "Egotrip. The sunniest cities around you.",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Egotrip. The sunniest cities around you.",
    description: DESCRIPTION,
    creator: "@tahigichigi",
  },
  appleWebApp: { capable: true, title: "Egotrip", statusBarStyle: "default" },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={instrument.variable} suppressHydrationWarning>
      <body>
        <a
          href="#main"
          className="label sr-only z-50 bg-paper px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <OriginProvider>{children}</OriginProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
