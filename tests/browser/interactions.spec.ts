import { test, expect } from "@playwright/test"
import { PNG } from "pngjs"

test.beforeEach(async ({ page }) => {
  await page.goto("/")
})

test("resources can be selected, persisted with an owner, and removed", async ({ page }) => {
  await page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true }).click()
  await expect(page.locator(".stack-list")).toContainText("Aceternity UI")
  await page.getByRole("button", { name: "Share the stack" }).click()
  await page.getByLabel("Twitter handle").fill("@builder")
  await page.reload()
  await page.getByRole("button", { name: "Share the stack" }).click()
  await expect(page.getByLabel("Twitter handle")).toHaveValue("@builder")
  await page.getByRole("button", { name: "Close share dialog" }).click()
  await expect(page.locator(".stack-list")).toContainText("Aceternity UI")
  await page.locator(".stack-list").getByRole("button", { name: "Remove Aceternity UI from your stack" }).click()
  await expect(page.locator(".stack-board")).toContainText("Your stack is empty")
})

test("a stack can be shared with a preview and a working permalink", async ({ page }) => {
  let shared: any
  await page.route("**/api/stacks", async route => {
    if (route.request().method() === "POST") {
      const draft = route.request().postDataJSON()
      shared = { ...draft, handle: draft.handle.replace(/^@/, ""), id: "browser-test" }
      await route.fulfill({ json: { stack: shared } })
    } else await route.fulfill({ json: { stacks: [] } })
  })
  await page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true }).click()
  await page.getByRole("button", { name: "Share the stack" }).click()
  await expect(page.getByRole("dialog", { name: "Share your stack" }).getByRole("tab", { name: "Aceternity UI" })).toBeVisible()
  await page.getByLabel("Twitter handle").fill("@builder")
  await page.getByRole("button", { name: "Share stack", exact: true }).click()
  await expect(page.getByLabel("Stack share link")).toHaveValue(/\?stack=browser-test$/)
  await page.getByRole("button", { name: "Close share dialog" }).click()
  await expect(page.locator(".published-stack")).toContainText("builder")
  await expect(page.locator(".published-stack")).toContainText("Aceternity UI")
  await expect(page.locator(".published-stack a").first()).toHaveAttribute("href", "https://x.com/builder")
  await page.route("**/api/stacks?id=browser-test", route => route.fulfill({ json: { stack: shared } }))
  await page.goto("/?stack=browser-test")
  await expect(page.getByRole("dialog", { name: "@builder's stack" }).getByRole("tab", { name: "Aceternity UI" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.locator("dialog[open]")).toHaveCount(0)
})

test("view switcher is removed and title lives in the sidebar", async ({ page }) => {
  await expect(page.locator(".view-menu-icon")).toHaveCount(0)
  await expect(page.locator(".side-panel h1")).toContainText("101 vibe resources")
  await expect(page.locator("main h1")).toHaveCount(0)
  await expect(page.locator(".resource-list.list").first()).toBeVisible()
})

test("arc navigation scrolls the directory and split handle resizes panes", async ({ page }) => {
  await expect.poll(async () => (await page.locator(".stack-board").locator("..").boundingBox())!.height).toBeLessThan(95)
  await page.getByText("Motion & Interaction", { exact: true }).click()
  await expect.poll(() => page.locator(".directory").evaluate(el => el.parentElement!.scrollTop)).toBeGreaterThan(200)
  const pane = page.locator(".directory").locator("..")
  const before = (await pane.boundingBox())!.height
  const handle = page.locator('[style*="row-resize"]')
  const box = (await handle.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2, box.y - 240, { steps: 30 })
  await page.mouse.up()
  await expect.poll(async () => Math.abs((await pane.boundingBox())!.height - before)).toBeGreaterThan(40)
})

test("globe fits, follows theme, renders pixels and closes repeatedly", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await page.locator(".expandable-trigger-copy").click()
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toBeVisible()
  const sponsor = (await page.locator(".sponsor-card").boundingBox())!
  await expect.poll(async () => Math.abs((await page.locator(".globe-dock").boundingBox())!.width - sponsor.width)).toBeLessThan(1)
  const dock = (await page.locator(".globe-dock").boundingBox())!
  expect(dock.x).toBeGreaterThanOrEqual(0)
  expect(dock.y).toBeGreaterThanOrEqual(0)
  expect(dock.y + dock.height).toBeLessThanOrEqual(889)
  const pixels = PNG.sync.read(await page.locator(".live-globe canvas").screenshot()).data
  expect(new Set(pixels).size).toBeGreaterThan(30)
  await page.waitForTimeout(300)
  expect(pixels.equals(PNG.sync.read(await page.locator(".live-globe canvas").screenshot()).data)).toBe(false)
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
  const borderColors = async () => {
    const { data: glow, width: glowWidth, height: glowHeight } = PNG.sync.read(await page.locator("dialog canvas").screenshot())
    let warm = 0, cool = 0
    for (let i = 0; i < glow.length; i += 4) {
      const x = (i / 4) % glowWidth, y = Math.floor(i / 4 / glowWidth)
      // Only sample the border; the transparent center exposes the website image.
      if (x >= 6 && x < glowWidth - 6 && y >= 6 && y < glowHeight - 6) continue
      if (glow[i] > glow[i + 2] + 25 && glow[i] >= glow[i + 1]) warm++
      if (glow[i + 2] > glow[i] + 60) cool++
    }
    return { warm, cool }
  }
  await expect.poll(async () => (await borderColors()).warm).toBeGreaterThan(1000)
  expect((await borderColors()).cool).toBe(0)
  expect((await page.locator(".preview-modal").boundingBox())!.width).toBeLessThanOrEqual(780)
  const image = page.locator('.preview-modal-frame .preview-image-area > img')
  const imageBounds = (await image.boundingBox())!
  const frame = (await page.locator('.preview-modal-frame').boundingBox())!
  expect(imageBounds.width).toBeCloseTo(frame.width - 16, 0)
  expect(await image.evaluate(el => getComputedStyle(el).objectFit)).toBe("cover")
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
  await page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true }).click()
  await expect(page.locator(".stack-list")).toContainText("Aceternity UI")
  await page.locator(".expandable-trigger-copy").click()
  await expect.poll(async () => (await page.locator(".globe-dock").boundingBox())!.width).toBeGreaterThan(300)
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
