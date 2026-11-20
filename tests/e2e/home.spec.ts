import { test, expect, type Page } from "@playwright/test"
import { flightHoursOfRows, pickPopular, rowsReady } from "./helpers"

// Home is the app: pitch, controls, best bet, then the ranked tiles.
// A "row" is the best bet card or a tile; both carry data-testid="destination-row".

const rows = (page: Page) => page.getByTestId("destination-row")
const status = (page: Page) => page.getByRole("status").filter({ hasText: /places?|Checking/ })
const radius = (page: Page, label: string) =>
  page.getByRole("group", { name: "Max flight" }).getByRole("button", { name: label, exact: true })

test.describe("home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await rowsReady(page)
  })

  test("hero, origin, best bet and tiles", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("Cloudy here?")
    await expect(page.getByRole("banner").getByRole("button", { name: /^From Lisbon/ })).toContainText("From Lisbon")
    await expect(page.getByText("Best bet this week")).toBeVisible()
    await expect(page.getByRole("link", { name: /^See .+/ })).toHaveAttribute("href", /^\/to\//)
    // Lisbon reaches 30 places within 6h: best bet + 9 tiles before "Show all".
    await expect(rows(page)).toHaveCount(10)
    for (const href of await page.getByTestId("results").locator("ol a").evaluateAll((els) => els.map((e) => e.getAttribute("href")))) {
      expect(href).toMatch(/^\/to\//)
    }
  })

  test("status names the full count; Show all reveals it", async ({ page }) => {
    await expect(radius(page, "6h")).toHaveAttribute("aria-pressed", "true")
    const n = Number(/(\d+) places/.exec((await status(page).textContent()) ?? "")?.[1])
    expect(n).toBeGreaterThan(10)
    await page.getByRole("button", { name: `Show all ${n}` }).click()
    await expect(rows(page)).toHaveCount(n)
  })

  test("max flight Any shows all 80; 2h shows fewer than 6h", async ({ page }) => {
    await expect(status(page)).toContainText("30 places within 6h")
    await radius(page, "2h").click()
    await expect(radius(page, "2h")).toHaveAttribute("aria-pressed", "true")
    const two = Number(/(\d+) place/.exec((await status(page).textContent()) ?? "")?.[1])
    expect(two).toBeLessThan(30)
    await radius(page, "Any").click()
    await expect(status(page)).toContainText("80 places at any distance")
    await page.getByRole("button", { name: "Show all 80" }).click()
    await expect(rows(page)).toHaveCount(80)
  })

  test("region filter Asia narrows the list", async ({ page }) => {
    await radius(page, "Any").click()
    await page.getByRole("button", { name: /^Filters/ }).click()
    await page.getByRole("button", { name: "Asia", exact: true }).click()
    await expect(status(page)).not.toContainText("80 places")
    await expect(rows(page).first()).toBeVisible()
    const texts = await rows(page).evaluateAll((els) => els.map((e) => e.textContent ?? ""))
    for (const t of texts) expect(t).toContain("Asia")
  })

  test("search finds Málaga; nonsense shows empty state and reset restores", async ({ page }) => {
    await radius(page, "Any").click()
    await page.getByLabel("Search").fill("malaga")
    await expect(rows(page)).toHaveCount(1)
    await expect(rows(page).first()).toContainText("Málaga")

    await page.getByLabel("Search").fill("zzzz")
    await expect(page.getByText("Nothing matches that.")).toBeVisible()
    await expect(rows(page)).toHaveCount(0)
    await page.getByRole("button", { name: "Reset filters" }).first().click()
    await expect(page.getByText("Nothing matches that.")).toBeHidden()
    await expect(radius(page, "6h")).toHaveAttribute("aria-pressed", "true")
    await expect(rows(page)).toHaveCount(10)
  })

  test("sort Closest drops the best bet and orders by flight time", async ({ page }) => {
    await page.getByRole("group", { name: "Sort" }).getByRole("button", { name: "Closest" }).click()
    await expect(page.getByText("Best bet this week")).toBeHidden()
    await expect
      .poll(async () => {
        const h = await flightHoursOfRows(page)
        return h.length > 0 && h.every((v, i) => i === 0 || v >= h[i - 1] - 1e-9)
      })
      .toBe(true)
  })

  test("far-flung origin widens the radius and says so", async ({ page }) => {
    await pickPopular(page, "Tokyo")
    await expect(page.getByTestId("widened")).toHaveText("Not much within 6 hours of Tokyo, so up to 9 hours.")
    await expect(radius(page, "9h")).toHaveAttribute("aria-pressed", "true")
    expect(Math.max(...(await flightHoursOfRows(page)))).toBeLessThanOrEqual(9)
  })

  test("theme toggle flips the dark class", async ({ page }) => {
    const html = page.locator("html")
    const toggle = page.getByRole("button", { name: /Switch to (dark|light) mode/ })
    await expect(toggle).toBeVisible()
    const wasDark = await html.evaluate((el) => el.classList.contains("dark"))
    await toggle.click()
    if (wasDark) await expect(html).not.toHaveClass(/dark/)
    else await expect(html).toHaveClass(/dark/)
    await toggle.click()
    if (wasDark) await expect(html).toHaveClass(/dark/)
    else await expect(html).not.toHaveClass(/dark/)
  })
})
