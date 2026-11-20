import { test, expect } from "@playwright/test"
import { pickPopular } from "./helpers"

const topbarOrigin = (page: import("@playwright/test").Page) => page.getByRole("banner").getByRole("button", { name: /^From / })

test.describe("origin picker", () => {
  test("popular city sticks across reload", async ({ page }) => {
    await page.goto("/")
    await expect(topbarOrigin(page)).toContainText("From Lisbon")
    await pickPopular(page, "London")
    await expect(topbarOrigin(page)).toContainText("From London")
    await page.reload()
    await expect(topbarOrigin(page)).toContainText("From London")
  })

  test("city search via geocoding (mocked)", async ({ page }) => {
    await page.route("https://geocoding-api.open-meteo.com/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [{ id: 4671654, name: "Austin", country: "United States", admin1: "Texas", latitude: 30.2672, longitude: -97.7431 }],
        }),
      }),
    )
    await page.goto("/")
    await expect(topbarOrigin(page)).toContainText("From Lisbon")
    await topbarOrigin(page).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Search any city").fill("austin")
    await dialog.getByRole("button", { name: /Austin/ }).click()
    await expect(topbarOrigin(page)).toContainText("From Austin")
  })
})
