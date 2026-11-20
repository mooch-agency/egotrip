import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { rowsReady } from "./helpers"

// Reduced motion turns off the blur reveal (see globals.css), so axe measures
// contrast at full opacity without a fixed wait. Run in both themes: the dark
// remap has its own muted/quiet values.
test.use({ reducedMotion: "reduce" })

async function seriousViolations(page: import("@playwright/test").Page) {
  const { violations } = await new AxeBuilder({ page }).analyze()
  return violations
    .filter((v) => v.impact === "critical" || v.impact === "serious")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`accessibility (axe, ${colorScheme})`, () => {
    test.use({ colorScheme })
    test.beforeEach(({}, info) => test.skip(info.project.name !== "desktop", "project-specific spec"))

    test("/", async ({ page }) => {
      await page.goto("/")
      await rowsReady(page)
      expect(await seriousViolations(page)).toEqual([])
    })

    test("/to/lisbon", async ({ page }) => {
      await page.goto("/to/lisbon")
      await expect(page.getByTestId("forecast-days")).toBeVisible()
      expect(await seriousViolations(page)).toEqual([])
    })
  })
}
