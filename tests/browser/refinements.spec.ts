import { expect, test } from "@playwright/test"

test("compact copy, quiet carousel and inset border segments", async ({ page }) => {
  await page.setViewportSize({ width: 1848, height: 994 })
  await page.goto("/")
  expect(await page.locator("#resource-prompt").evaluate(el => getComputedStyle(el).fontSize)).toBe("12px")
  await expect(page.locator(".resource-list.list .description")).not.toContainText(["Reusable components and polished UI kits."])
  await expect(page.locator(".resource-list.list li").first().locator(".description")).toHaveCount(0)
  await expect(page.getByText("Dark, polished React components", { exact: true })).toHaveCount(1)
  const nav = page.getByRole("navigation", { name: "Categories" })
  await expect(nav.getByText("Navigation", { exact: true })).toHaveCount(0)
  expect(await nav.innerText()).not.toMatch(/\d/)
  const about = (await page.locator(".side-about").boundingBox())!
  const sidebar = (await page.locator(".side-panel").boundingBox())!
  expect(about.width).toBeLessThan(sidebar.width - 40)
  expect((await nav.boundingBox())!.x + (await nav.boundingBox())!.width).toBeCloseTo(sidebar.x + sidebar.width - 1, 0)
  expect(await page.locator(".side-panel").evaluate(el => getComputedStyle(el).borderRightColor)).toBe("rgba(0, 0, 0, 0)")
  const edges = await page.locator(".side-about").evaluate(el => ({ top: getComputedStyle(el, "::before").top, bottom: getComputedStyle(el, "::before").bottom }))
  expect(edges).toEqual({ top: "16px", bottom: "16px" })
  const navBox = (await nav.boundingBox())!
  expect(about.y - navBox.y - navBox.height).toBeGreaterThanOrEqual(16)
  await expect(page.locator(".expandable-trigger-copy svg")).toHaveCount(0)
  await page.waitForTimeout(800)
  await page.screenshot({ path: "test-results/refinements-desktop.png" })
})

for (const width of [390, 607]) test(`mobile carousel reaches its last item without clipping at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 994 })
  await page.goto("/")
  await page.getByRole("button", { name: "Browse categories" }).click()
  const nav = page.getByRole("navigation", { name: "Categories" })
  await page.waitForTimeout(400)
  const padding = await nav.evaluate(el => {
    const scroller = [...el.querySelectorAll<HTMLElement>("div")].find(node => getComputedStyle(node).overflowY === "auto" || getComputedStyle(node).overflowY === "scroll")!
    const content = scroller.firstElementChild!
    const style = getComputedStyle(content)
    scroller.scrollTop = scroller.scrollHeight
    return { top: style.paddingTop, bottom: style.paddingBottom }
  })
  expect(padding).toEqual({ top: "0px", bottom: "0px" })
  await page.waitForTimeout(400)
  const last = nav.getByText("Design Creators & Research", { exact: true })
  await expect(last).toBeInViewport()
  const item = (await last.boundingBox())!, bounds = (await nav.boundingBox())!
  expect(item.y + item.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1)
  expect(item.x + item.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1)
  await page.screenshot({ path: `test-results/refinements-navigation-${width}.png` })
  await last.click()
  await expect(page.getByRole("button", { name: "Browse categories" })).toHaveAttribute("aria-expanded", "false")
  await expect(page.locator(".directory").getByRole("heading", { name: "Design Creators & Research", exact: true })).toBeInViewport()
  await expect.poll(async () => (await page.locator(".stack-board").locator("..").boundingBox())!.height).toBeGreaterThan(90)
  await page.mouse.move(0, 0)
  await page.waitForTimeout(500)
  expect(await page.locator("footer").evaluate(el => getComputedStyle(el).justifyContent)).toBe("center")
  expect(await page.locator("[style*='row-resize']").evaluate(el => getComputedStyle(el.firstElementChild!).backgroundColor)).toBe("rgb(255, 255, 255)")
  await page.screenshot({ path: `test-results/refinements-mobile-${width}.png` })
})
