import { test, expect } from "@playwright/test"
import { PNG } from "pngjs"

test.use({ viewport: { width: 978, height: 802 } })
test.beforeEach(async ({ page }) => { await page.goto("/") })

test("original SearchBar reveals RadiantButton in its action slot and submits", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  await page.route("**/api/recommend", route => route.fulfill({ json: { picks: [], provider: "jev" } }))
  await expect(page.getByRole("button", { name: "Pick resources" })).toHaveCount(0)
  const input = page.getByRole("textbox", { name: "what are you building?" })
  await input.fill("A portfolio with animated icons")
  await expect(page.locator(".jev-pick-action canvas").first()).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(500)
  const field = (await input.boundingBox())!
  const label = (await page.locator("#recommender-title").boundingBox())!
  const action = (await page.getByRole("button", { name: "Pick resources" }).boundingBox())!
  expect(label.x + label.width).toBeLessThan(field.x)
  expect(action.x).toBeGreaterThan(field.x + field.width)
  expect(Math.abs(action.y - field.y)).toBeLessThan(16)
  expect(new Set(PNG.sync.read(await page.locator(".jev-pick-action canvas").first().screenshot()).data).size).toBeGreaterThan(30)
  await page.screenshot({ path: "test-results/jev-search.png" })
  await page.getByRole("button", { name: "Pick resources" }).click()
  await expect(page.getByText("No matching resources found.")).toBeVisible()
  await expect(page.getByText("ranked by jev")).toHaveCount(0)
  await page.getByRole("button", { name: "Clear search" }).click()
  await expect(input).toHaveValue("")
  await expect(page.locator(".heading-tools").getByRole("button", { name: "Toggle color theme" })).toHaveCount(0)
  expect(errors).toEqual([])
})

test("compact empty drawer grows into selectable browser tabs with real animated checkboxes", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", error => errors.push(error.message))
  const pane = page.locator(".stack-board").locator("..")
  await expect(page.getByLabel("Your name", { exact: true })).toHaveCount(0)
  await expect.poll(async () => (await pane.boundingBox())!.height).toBeLessThan(110)
  await page.screenshot({ path: "test-results/compact-empty.png" })
  const checkbox = page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true })
  await checkbox.click()
  await expect(checkbox).toBeChecked()
  const tick = checkbox.locator('path[d="M20 32L28 40L44 24"]')
  await expect.poll(async () => Number(await tick.getAttribute("stroke-dasharray"))).toBeGreaterThan(30)
  await expect.poll(async () => Number(await tick.getAttribute("stroke-dashoffset"))).toBeLessThan(0.1)
  await expect(tick).toHaveAttribute("opacity", "1")
  await expect(page.getByRole("button", { name: "Share the stack" })).toBeVisible()
  await page.getByRole("checkbox", { name: "Select SHSF UI Cards for your stack", exact: true }).click()
  await expect(page.getByRole("tab")).toHaveCount(2)
  await expect(page.getByRole("tab", { name: "SHSF UI Cards" })).toHaveAttribute("aria-selected", "true")
  await page.getByRole("tab", { name: "Aceternity UI" }).click()
  await expect(page.getByRole("tabpanel")).toContainText("Aceternity UI")
  await page.getByRole("tab", { name: "Aceternity UI" }).press("ArrowRight")
  await expect(page.getByRole("tab", { name: "SHSF UI Cards" })).toBeFocused()
  await expect.poll(async () => Math.abs((await pane.boundingBox())!.height - 244)).toBeLessThan(1)
  await page.screenshot({ path: "test-results/browser-stack.png" })
  await page.getByRole("button", { name: "Remove SHSF UI Cards from your stack", exact: true }).click()
  await checkbox.click()
  await expect(page.getByLabel("Your name", { exact: true })).toHaveCount(0)
  await expect.poll(async () => (await pane.boundingBox())!.height).toBeLessThan(110)
  await checkbox.press("Space")
  await expect(checkbox).toBeChecked()
  await checkbox.press("Space")
  await expect(checkbox).not.toBeChecked()
  expect(errors).toEqual([])
})

test("one compact ArcList contains inline subcategories", async ({ page }) => {
  const nav = page.getByRole("navigation", { name: "Categories" })
  await expect(nav.getByText("Component Libraries / Full Kits", { exact: true })).toBeVisible()
  await page.getByText("Motion & Interaction", { exact: true }).click()
  await expect(nav.getByText("Animation Libraries", { exact: true })).toBeVisible()
  await nav.getByText("Micro-interactions", { exact: true }).click()
  await expect(page).toHaveURL(/#motion-animation-interaction-micro-interactions$/)
  await expect(nav.getByText("UI Components", { exact: true })).toBeVisible()
  await expect(page.locator(".granular-nav")).toHaveCount(0)
})

test("inline image expands and globe remains circular with padded trigger and small close", async ({ page }) => {
  const media = page.locator(".daily-feed-media")
  await expect.poll(async () => (await media.boundingBox())!.width).toBeLessThan(1)
  await page.locator(".media-between-text").hover()
  await expect.poll(async () => (await media.boundingBox())!.width).toBeGreaterThan(27)
  const dock = (await page.locator(".globe-dock").boundingBox())!
  const text = (await page.locator(".expandable-trigger-copy > span").boundingBox())!
  expect(text.x + text.width).toBeLessThan(dock.x + dock.width - 10)
  await page.locator(".expandable-trigger-copy").click()
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toBeVisible()
  const canvas = page.locator(".live-globe canvas")
  const sponsor = (await page.locator(".sponsor-card").boundingBox())!
  await expect.poll(async () => Math.abs((await page.locator(".globe-dock").boundingBox())!.width - sponsor.width)).toBeLessThan(0.1)
  await expect.poll(async () => (await canvas.boundingBox())!.width).toBeGreaterThan(150)
  const bounds = (await canvas.boundingBox())!
  expect(bounds.height).toBeCloseTo(bounds.width, 1)
  const close = page.locator(".globe-close [tabindex='0']")
  expect((await close.boundingBox())!.width).toBe(28)
  await page.screenshot({ path: "test-results/globe-circular.png" })
  await close.click()
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toHaveCount(0)
})

test("tabs and share popup fit on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true }).click()
  await page.getByRole("checkbox", { name: "Select SHSF UI Cards for your stack", exact: true }).click()
  await expect(page.getByRole("tab", { name: "SHSF UI Cards" })).toHaveAttribute("aria-selected", "true")
  await expect(page.getByRole("button", { name: "Share the stack" })).toBeVisible()
  await expect.poll(async () => Math.abs((await page.locator(".stack-board").locator("..").boundingBox())!.height - 244)).toBeLessThan(1)
  await expect.poll(async () => Math.abs((await page.locator(".browser-tab").last().boundingBox())!.width - 172)).toBeLessThan(1)
  await expect.poll(async () => {
    const tab = (await page.locator(".browser-tab").last().boundingBox())!
    const strip = (await page.locator(".browser-tabs").boundingBox())!
    return tab.x + tab.width - strip.x - strip.width
  }).toBeLessThanOrEqual(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole("button", { name: "Share the stack" }).click()
  const dialog = page.getByRole("dialog", { name: "Share your stack" })
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await expect(dialog.getByLabel("Twitter handle")).toBeVisible()
  await expect.poll(async () => {
    const tab = (await dialog.locator('[role="tab"][aria-selected="true"]').boundingBox())!
    const strip = (await dialog.locator(".browser-tabs").boundingBox())!
    return tab.x + tab.width - strip.x - strip.width
  }).toBeLessThanOrEqual(1)
  await page.screenshot({ path: "test-results/mobile-tabs.png" })
})

test("right-side checkboxes stay inside compact resource rows and selected tabs survive resizing", async ({ page }) => {
  await page.setViewportSize({ width: 1240, height: 772 })
  const row = page.locator(".resource-list.list li").first()
  const box = (await row.boundingBox())!
  const checkbox = row.getByRole("checkbox")
  const checkBox = (await checkbox.boundingBox())!
  const link = (await row.locator(".resource-link").boundingBox())!
  expect(checkBox.x).toBeGreaterThan(link.x + link.width)
  expect(checkBox.x + checkBox.width).toBeLessThanOrEqual(box.x + box.width)
  expect(box.height).toBeLessThanOrEqual(50)
  expect(await row.locator(".name").evaluate(el => getComputedStyle(el).fontSize)).toBe("13px")
  await checkbox.click()
  const handle = page.locator('[style*="row-resize"]')
  const drag = (await handle.boundingBox())!
  await page.mouse.move(drag.x + drag.width / 2, drag.y + drag.height / 2)
  await page.mouse.down()
  await page.mouse.move(drag.x + drag.width / 2, drag.y + 120, { steps: 15 })
  await page.mouse.up()
  await expect.poll(async () => (await page.locator(".stack-browser").boundingBox())!.height).toBeGreaterThan(125)
  await expect(page.getByRole("tab", { name: "Aceternity UI" })).toBeInViewport()
  await expect(page.locator(".browser-address > svg")).toHaveCount(0)
  await page.mouse.move(0, 0)
  await page.waitForTimeout(700)
  await page.screenshot({ path: "test-results/desktop-1240.png" })
})

test("mobile search and RadiantButton stay in bounds in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("textbox", { name: "what are you building?" }).fill("animated icons")
  await expect(page.locator(".jev-pick-action canvas").first()).toBeVisible({ timeout: 20000 })
  for (const theme of ["dark", "light"]) {
    if (theme === "light") await page.getByRole("button", { name: "Toggle color theme", exact: true }).last().click()
    await page.waitForTimeout(600)
    const button = (await page.getByRole("button", { name: "Pick resources" }).boundingBox())!
    expect(button.x + button.width).toBeLessThanOrEqual(390)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    await page.screenshot({ path: `test-results/mobile-search-${theme}.png` })
  }
})
