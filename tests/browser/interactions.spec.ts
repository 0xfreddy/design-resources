import { test, expect } from "@playwright/test"
import { PNG } from "pngjs"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("resources can be selected, persisted with an owner, and removed", async ({ page }) => {
  await page.getByRole("button", { name: "Add Aceternity UI to your stack", exact: true }).click()
  await expect(page.locator(".stack-list")).toContainText("Aceternity UI")
  await page.getByLabel("Your name", { exact: true }).fill("Test Builder")
  await page.getByLabel("Twitter handle").fill("@builder")
  await page.reload()
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue("Test Builder")
  await expect(page.getByLabel("Twitter handle")).toHaveValue("@builder")
  await expect(page.locator(".stack-list")).toContainText("Aceternity UI")
  await page.locator(".stack-list").getByRole("button", { name: "Remove Aceternity UI from your stack" }).click()
  await expect(page.locator(".stack-board")).toContainText("Your stack is empty")
})

test("a named stack can be published and displayed", async ({ page }) => {
  await page.route("**/api/stacks", async route => {
    if (route.request().method() === "POST") {
      const draft = route.request().postDataJSON()
      await route.fulfill({ json: { stack: { ...draft, handle: draft.handle.replace(/^@/, ""), id: "browser-test" } } })
    } else await route.fulfill({ json: { stacks: [] } })
  })
  await page.getByRole("button", { name: "Add Aceternity UI to your stack", exact: true }).click()
  await page.getByLabel("Your name", { exact: true }).fill("Test Builder")
  await page.getByLabel("Twitter handle").fill("@builder")
  await page.getByRole("button", { name: "Publish stack" }).click()
  await expect(page.locator(".published-stack")).toContainText("Test Builder")
  await expect(page.locator(".published-stack")).toContainText("Aceternity UI")
  await expect(page.locator(".published-stack a").first()).toHaveAttribute("href", "https://x.com/builder")
})

test("original fan items switch views and Escape dismisses", async ({ page }) => {
  await page.locator(".view-menu-icon").click()
  await page.getByText("Grid", { exact: true }).click()
  await expect(page.locator(".resource-list.grid").first()).toBeVisible()
  await page.locator(".view-menu-icon").click()
  await page.keyboard.press("Escape")
  await expect(page.locator(".view-menu-icon")).toHaveAttribute("title", "Change resource view")
  await page.locator(".view-menu-icon").click()
  await page.getByText("List", { exact: true }).click()
  await expect(page.locator(".resource-list.list").first()).toBeVisible()
})

test("arc navigation scrolls the directory and split handle resizes panes", async ({ page }) => {
  await page.getByText("Motion & Interaction", { exact: true }).click()
  await expect.poll(() => page.locator(".directory").evaluate(el => el.parentElement!.scrollTop)).toBeGreaterThan(200)
  const pane = page.locator(".directory").locator("..")
  const before = (await pane.boundingBox())!.height
  const handle = page.locator('[style*="row-resize"]')
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y - 80, { steps: 15 })
  await page.mouse.up()
  await expect.poll(async () => Math.abs((await pane.boundingBox())!.height - before)).toBeGreaterThan(40)
})

test("globe fits, follows theme, renders pixels and closes repeatedly", async ({ page }) => {
  await page.getByRole("button", { name: "Toggle color theme", exact: true }).last().click()
  await page.locator(".expandable-trigger-copy").click()
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toBeVisible()
  await expect.poll(async () => (await page.locator(".globe-dock").boundingBox())!.width).toBeGreaterThan(350)
  const dock = (await page.locator(".globe-dock").boundingBox())!
  expect(dock.x).toBeGreaterThanOrEqual(0)
  expect(dock.y).toBeGreaterThanOrEqual(0)
  expect(dock.y + dock.height).toBeLessThanOrEqual(889)
  const pixels = PNG.sync.read(await page.locator(".live-globe canvas").screenshot()).data
  expect(new Set(pixels).size).toBeGreaterThan(30)
  await page.screenshot({ path: "test-results/globe-dark.png" })
  await page.locator(".globe-close [tabindex='0']").click()
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toHaveCount(0)
  await page.locator(".expandable-trigger-copy").click()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toHaveCount(0)
})

test("expanded preview uses the animated original shader and can be reopened", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", error => errors.push(String(error)))
  await page.locator(".resource-link").first().hover()
  await page.getByRole("button", { name: "Expand Aceternity UI preview" }).click()
  await expect(page.getByRole("dialog", { name: "Aceternity UI preview" })).toBeVisible()
  await expect(page.locator("dialog canvas")).toBeVisible({ timeout: 20000 })
  const colorful = (buffer: Buffer) => {
    const { data } = PNG.sync.read(buffer)
    let count = 0
    for (let i = 0; i < data.length; i += 4) if (Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 60) count++
    return count
  }
  await expect.poll(async () => colorful(await page.locator("dialog canvas").screenshot())).toBeGreaterThan(1000)
  const first = await page.locator("dialog canvas").screenshot()
  await page.waitForTimeout(350)
  expect(first.equals(await page.locator("dialog canvas").screenshot())).toBe(false)
  await page.screenshot({ path: "test-results/preview-shader.png" })
  await page.getByRole("button", { name: "Add to stack", exact: true }).click()
  await page.keyboard.press("Escape")
  await expect(page.locator("dialog[open]")).toHaveCount(0)
  await expect(page.locator(".stack-list")).toContainText("Aceternity UI")
  await page.locator(".resource-link").first().click()
  await expect(page.locator("dialog canvas")).toBeVisible()
  await page.getByRole("button", { name: "Close preview", exact: true }).click()
  await page.waitForTimeout(400)
  expect(errors).toEqual([])
})

test("mobile selection, modal and globe remain in bounds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator("h1")).toBeInViewport()
  await page.getByRole("button", { name: "Add Aceternity UI to your stack", exact: true }).click()
  await expect(page.locator(".stack-list")).toContainText("Aceternity UI")
  await page.locator(".expandable-trigger-copy").click()
  await expect.poll(async () => (await page.locator(".globe-dock").boundingBox())!.width).toBeGreaterThan(340)
  const box = (await page.locator(".globe-dock").boundingBox())!
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(box.y).toBeGreaterThanOrEqual(0)
  await page.screenshot({ path: "test-results/mobile-globe.png" })
  await page.keyboard.press("Escape")
  await page.locator(".resource-link").first().click()
  await expect(page.getByRole("button", { name: "Close preview", exact: true })).toBeInViewport()
  await page.keyboard.press("Escape")
  await page.mouse.move(0, 0)
  await expect.poll(async () => (await page.locator(".globe-dock").boundingBox())!.height).toBeLessThan(46)
  await expect(page.locator(".site-preview")).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.screenshot({ path: "test-results/mobile.png" })
})
