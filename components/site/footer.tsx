// Slim dark colophon (mooch .colophon-dark): always black, whatever the theme.
// Carries the Open-Meteo attribution its CC BY 4.0 licence requires.
// `dockSpace` pads the bottom on pages with the phone action dock (place
// pages), so the dock never covers the attribution.

export function Footer({ dockSpace = false }: { dockSpace?: boolean }) {
  return (
    <footer
      className={`bg-black px-[var(--pad-x)] pt-10 text-white ${
        dockSpace ? "pb-[calc(120px+env(safe-area-inset-bottom))] lg:pb-10" : "pb-10"
      }`}
    >
      <div className="mx-auto flex max-w-[var(--max)] flex-wrap items-center justify-between gap-x-12 gap-y-5">
        <p className="font-serif text-[30px] leading-none tracking-[-0.01em]">
          A plaything by{" "}
          <a
            href="https://mooch.agency"
            className="italic underline decoration-[#2a2a2c] underline-offset-[5px] hover:decoration-white"
          >
            Mooch
          </a>
          .
        </p>
        <p className="max-w-[72ch] flex-[1_1_420px] text-sm text-[#8e8e93]">
          <a
            href="https://open-meteo.com/"
            className="text-white underline decoration-[#2a2a2c] underline-offset-4 hover:decoration-white"
          >
            Weather data by Open-Meteo.com
          </a>{" "}
          (CC BY 4.0), updated hourly. Flight times are direct estimates; real routes vary. Venues checked November
          2026, so check before you go.
        </p>
      </div>
    </footer>
  )
}
