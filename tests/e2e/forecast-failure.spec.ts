import { test, expect } from "@playwright/test"
import { rowsReady } from "./helpers"

test.describe("forecast outage", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/forecast", (r) => r.fulfill({ status: 502, body: "{}" }))
  })

  test("home degrades to typical sunshine", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByText("Live forecast unavailable. Ranking on typical sunshine instead.")).toBeVisible()
    await rowsReady(page)
    await expect(page.getByTestId("destination-row").first()).toContainText("typical")
  })

  test("/to/lisbon shows unavailable message with retry", async ({ page }) => {
    await page.goto("/to/lisbon")
    await expect(page.locator("#forecast").getByText(/Live forecast unavailable/)).toBeVisible()
    await expect(page.locator("#forecast").getByRole("button", { name: "Try again" })).toBeVisible()
  })
})
