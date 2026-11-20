import { test, expect } from "@playwright/test"
import { pickPopular } from "./helpers"

const desktop = (name: string) => name === "desktop"

test.describe("destination detail", () => {
  test("lisbon content", async ({ page }) => {
    await page.goto("/to/lisbon")
    await expect(page.locator("h1")).toHaveText("Lisbon")
    await expect(page.getByTestId("forecast-days").locator("> li")).toHaveCount(14)
    const w = await page.getByTestId("workspaces").locator("> li").count()
    expect(w).toBeGreaterThanOrEqual(4)
    expect(w).toBeLessThanOrEqual(5)
    await expect(page.getByTestId("alibis").locator("> li")).toHaveCount(3)
    await expect(page.getByRole("navigation", { name: "On this page" }).getByRole("link")).toHaveCount(4)
  })

  test("after-hours chips filter places", async ({ page }) => {
    await page.goto("/to/lisbon")
    const places = page.getByTestId("places").locator("> li")
    const all = await places.count()
    const chip = page.getByRole("group", { name: "Show" }).getByRole("button").nth(1) // First category after "All"
    const n = Number(await chip.locator(".n").textContent())
    await chip.click()
    await expect(chip).toHaveAttribute("aria-pressed", "true")
    await expect(places).toHaveCount(n)
    expect(n).toBeLessThan(all)
  })

  test("copy alibi shows Copied", async ({ page }, info) => {
    test.skip(!desktop(info.project.name), "clipboard permissions only granted on desktop")
    await page.goto("/to/lisbon")
    const btn = page.getByTestId("alibis").locator(".copy-btn").first() // Name changes once copied, so not by role
    await btn.scrollIntoViewIfNeeded()
    await expect(btn).toHaveText("Copy alibi")
    // The click can land before React hydrates the handler; retry until it takes.
    await expect(async () => {
      await btn.click()
      await expect(btn).toContainText("Copied", { timeout: 1000 })
    }).toPass()
  })

  test("find flights link: card on desktop, dock on phones and tablets", async ({ page }, info) => {
    await page.goto("/to/lisbon")
    await pickPopular(page, "London")
    const visible = page.getByTestId(desktop(info.project.name) ? "find-flights" : "find-flights-dock")
    const hidden = page.getByTestId(desktop(info.project.name) ? "find-flights-dock" : "find-flights")
    await expect(visible).toBeVisible()
    await expect(hidden).toBeHidden()
    await expect(visible).toHaveAttribute("href", /google\.com\/travel\/flights/)
    await expect(visible).toHaveAttribute("href", /LIS/)
    await expect(visible).toHaveAttribute("href", /from%20London/)
  })

  test("next link walks the default ranking", async ({ page }) => {
    await page.goto("/to/lisbon")
    await page.getByRole("navigation", { name: "Place navigation" }).getByRole("link", { name: /^Next:/ }).click()
    await expect(page).toHaveURL(/\/to\/(?!lisbon$)[a-z-]+$/)
    await expect(page.locator("h1")).not.toHaveText("Lisbon")
  })

  test("also sunny links elsewhere, never back to this page", async ({ page }) => {
    await page.goto("/to/lisbon")
    const tiles = page.getByRole("list", { name: "More sunny places" }).getByTestId("destination-row")
    await expect(tiles).toHaveCount(3)
    for (const slug of await tiles.evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")))) {
      expect(slug).not.toBe("lisbon")
    }
  })

  test("flight fact follows the origin", async ({ page }) => {
    await page.goto("/to/lisbon")
    await expect(page.getByTestId("fact-flight")).toHaveText("You're here")
    await pickPopular(page, "London")
    await expect(page.getByTestId("fact-flight")).toHaveText(/^About /)
  })
})
