import { test, expect } from "@playwright/test"
import { rowsReady } from "./helpers"

// Phone and tablet layout checks. Desktop layout is covered by every other spec.
test.describe("touch layout", () => {
  test.beforeEach(({}, info) => test.skip(info.project.name === "desktop", "phone and tablet only"))

  for (const path of ["/", "/to/lisbon"]) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path)
      if (path === "/") await rowsReady(page)
      else await expect(page.getByTestId("forecast-days")).toBeVisible()
      const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }))
      expect(sw).toBeLessThanOrEqual(iw)
    })
  }

  test("place dock stays in reach and clears the footer", async ({ page }) => {
    await page.goto("/to/lisbon")
    const dock = page.getByTestId("find-flights-dock")
    await expect(dock).toBeInViewport()
    // Instant, not smooth (html has scroll-behavior: smooth), and retried:
    // "Also sunny" can still be swapping skeletons for tiles, moving the footer.
    await expect(async () => {
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }))
      // The footer's padding runs under the dock by design; its text must not.
      const text = await page.locator("footer p").last().boundingBox()
      const dockBox = await page.locator(".dock").boundingBox()
      expect(text!.y + text!.height).toBeLessThanOrEqual(dockBox!.y)
    }).toPass()
    await expect(dock).toBeInViewport()
  })

  test("section tabs stick to the top while scrolling", async ({ page }) => {
    await page.goto("/to/lisbon")
    const tabs = page.getByRole("navigation", { name: "On this page" })
    await page.getByTestId("alibis").scrollIntoViewIfNeeded()
    const box = await tabs.boundingBox()
    expect(box?.y).toBeLessThanOrEqual(1)
  })
})
