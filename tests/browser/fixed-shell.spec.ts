import { expect, test } from "@playwright/test"
import { PNG } from "pngjs"

for (const viewport of [{ width: 1591, height: 994 }, { width: 927, height: 994 }, { width: 390, height: 844 }]) {
  test(`fixed shell and synchronized navigation at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto("/")
    const nav = page.getByRole("navigation", { name: "Categories", includeHidden: true })
    if (viewport.width < 720) await page.getByRole("button", { name: "Browse categories" }).click()
    await expect(nav.getByText("Animation Libraries", { exact: true })).toHaveCount(1)
    await expect(nav.getByText("Fonts & Typefaces", { exact: true })).toHaveCount(1)
    await expect(nav.getByText("Product Analytics & Feedback", { exact: true })).toHaveCount(1)
    if (viewport.width < 720) await page.getByRole("button", { name: "Browse categories" }).click()
    await expect(page.locator("h1")).toBeInViewport()
    const input = (await page.locator(".recommender").boundingBox())!
    const title = (await page.locator(".page-heading").boundingBox())!
    const pane = page.locator(".directory").locator("..")
    await pane.hover()
    await page.mouse.wheel(0, 1400)
    await expect.poll(() => pane.evaluate(el => el.scrollTop)).toBeGreaterThan(500)
    await expect.poll(() => nav.getAttribute("data-active-id")).not.toBe("ui-component-libraries")
    await page.evaluate(() => {
      const group = document.getElementById("motion-animation-interaction-animation-libraries")!
      const pane = document.querySelector(".directory")!.parentElement!
      pane.scrollTop += group.getBoundingClientRect().top - pane.getBoundingClientRect().top
    })
    await expect(nav).toHaveAttribute("data-active-id", "motion-animation-interaction-animation-libraries")
    if (viewport.width >= 720) {
      await expect.poll(() => nav.evaluate(el => Math.max(...Array.from(el.querySelectorAll("div"), node => node.scrollTop)))).toBeGreaterThan(60)
      await expect(nav.getByText("Animation Libraries", { exact: true })).toBeInViewport()
      const intro = (await page.locator(".side-intro").boundingBox())!
      const bounds = (await nav.boundingBox())!
      expect(intro.y).toBeGreaterThanOrEqual(bounds.y + bounds.height)
    }
    await page.mouse.move(2, 2)
    await page.mouse.wheel(0, 3000)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height)
    expect((await page.locator(".recommender").boundingBox())!.y).toBe(input.y)
    expect((await page.locator(".page-heading").boundingBox())!.y).toBe(title.y)
    await page.waitForTimeout(700)
    await page.screenshot({ path: `test-results/fixed-shell-${viewport.width}.png` })
  })
}

test("both actions render the supplied orange shader preset", async ({ page }) => {
  await page.setViewportSize({ width: 1591, height: 994 })
  await page.goto("/")
  await page.getByRole("textbox", { name: "what are you building?" }).fill("build a portfolio")
  const checkbox = page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true })
  expect((await checkbox.boundingBox())!.width).toBe(20)
  await checkbox.click()
  for (const selector of [".jev-pick-action canvas", ".stack-share-action canvas"]) {
    const canvas = page.locator(selector).first()
    await expect(canvas).toBeVisible({ timeout: 20000 })
    await expect.poll(async () => {
      const { data } = PNG.sync.read(await canvas.screenshot())
      let warm = 0
      for (let i = 0; i < data.length; i += 4) if (data[i] > 70 && data[i] > data[i + 1] * 1.15 && data[i + 1] > data[i + 2] * 1.15) warm++
      return warm
    }).toBeGreaterThan(20)
  }
  expect(await page.locator(".split-pane-heading span").evaluate(el => getComputedStyle(el).fontWeight)).toBe("400")
  await page.screenshot({ path: "test-results/orange-actions.png" })
  await page.getByRole("button", { name: "Share the stack" }).click()
  await expect(page.getByRole("dialog", { name: "Share your stack" })).toBeVisible()
})
