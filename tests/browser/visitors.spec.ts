import { test, expect } from "@playwright/test"

test("heartbeats run while collapsed and country totals populate the globe", async ({ page }) => {
  let heartbeats = 0
  await page.route("**/api/live-users", async route => {
    expect(route.request().method()).toBe("POST")
    heartbeats++
    await route.fulfill({ json: { configured: true, total: 3, locations: [
      { id: "GB", location: [55.38, -3.43], region: "United Kingdom", visits: 12 },
      { id: "AE", location: [23.42, 53.85], region: "United Arab Emirates", visits: 4 },
    ] } })
  })
  await page.clock.install()
  await page.goto("/")
  await expect(page.locator(".globe-dock")).toContainText("3 online now")
  expect(heartbeats).toBeGreaterThan(0)
  await page.locator(".globe-dock .expandable-trigger-copy").click()
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toBeVisible()
  await expect(page.getByLabel("Most visited countries")).toContainText("United Kingdom · 12")
  await expect(page.locator(".globe-note")).toContainText("Countries shown by total visits")
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toHaveCount(0)
  const before = heartbeats
  await page.clock.runFor(31000)
  await expect.poll(() => heartbeats).toBeGreaterThan(before)
})

test("unavailable tracking never presents sample visitors", async ({ page }) => {
  await page.route("**/api/live-users", route => route.fulfill({ status: 503, json: { configured: false, locations: [] } }))
  await page.goto("/")
  await page.locator(".globe-dock .expandable-trigger-copy").click()
  await expect(page.locator(".globe-note")).toHaveText("Visitors unavailable")
  await expect(page.getByLabel("Most visited countries")).toHaveCount(0)
})
