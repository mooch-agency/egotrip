import Link from "next/link"
import { Topbar } from "@/components/site/topbar"
import { Footer } from "@/components/site/footer"

export default function NotFound() {
  return (
    <>
      <Topbar />
      <main id="main" className="px-[var(--pad-x)] py-[var(--rhythm)]">
        <div className="mx-auto max-w-[var(--max)]">
          <p className="eyebrow mb-[var(--eyebrow-gap)]">404</p>
          <h1 className="display mb-8 text-[clamp(56px,10vw,152px)]">
            Not on <em>the list</em>.
          </h1>
          <p className="lead mb-10 max-w-[44ch]">That page doesn&apos;t exist. The sun still does.</p>
          <Link href="/" className="pill">
            See all places <span className="arrow" aria-hidden>→</span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
