import { expect, type Page } from "@playwright/test"

/** Wait until the ranked list has real rows (origin + forecast resolved), not skeletons. */
export async function rowsReady(page: Page) {
  await expect(page.getByTestId("destination-row").first()).toBeVisible()
}

/** Open the origin picker from the topbar and choose a popular city. */
export async function pickPopular(page: Page, city: string) {
  await page.getByRole("banner").getByRole("button", { name: /^From / }).click()
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await dialog.getByRole("button", { name: new RegExp(`^${city}`) }).click()
  await expect(dialog).toBeHidden()
}

/** Flight time in hours for every visible row, read from its data-hours attribute. */
export async function flightHoursOfRows(page: Page): Promise<number[]> {
  return page.getByTestId("destination-row").evaluateAll((rows) => rows.map((r) => Number(r.getAttribute("data-hours"))))
}
