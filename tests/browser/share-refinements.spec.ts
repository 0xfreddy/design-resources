import { expect, test } from "@playwright/test"
import { PNG } from "pngjs"

test("stronger arc starts level, fades at the right edge and has no orange top divider", async ({ page }) => {
  await page.goto("/")
  const rows = page.locator(".arc-list-nav [data-nav-section]")
  const angles = await rows.evaluateAll(nodes => nodes.slice(0, 4).map(node => {
    const row = node.parentElement!.parentElement!.parentElement!
    const matrix = new DOMMatrix(getComputedStyle(row).transform)
    return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI
  }))
  expect(angles[0]).toBeCloseTo(0, 1)
  expect(angles[3]).toBeLessThan(-13)
  expect(await page.locator(".arc-list-nav").evaluate(el => getComputedStyle(el).maskImage)).toContain("32px")
  expect(await page.locator(".side-about").evaluate(el => getComputedStyle(el).borderTopWidth)).toBe("0px")
  await page.screenshot({ path: "test-results/arc-edge-fade.png" })
})

for (const width of [1431, 390]) test(`full-width borderless share action and matching resource list at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 994 })
  await page.goto("/")
  for (const name of ["Aceternity UI", "SHSF UI Cards", "Animate UI"]) await page.getByRole("checkbox", { name: `Select ${name} for your stack`, exact: true }).click()
  const action = page.getByRole("button", { name: "Share the stack", exact: true })
  await expect(page.locator(".stack-share-action canvas")).toBeVisible({ timeout: 20000 })
  await page.waitForTimeout(600)
  expect((await action.boundingBox())!.width).toBeCloseTo((await page.locator(".stack-share-action").boundingBox())!.width, 0)
  expect(await action.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(0, 0, 0)")
  const shot = PNG.sync.read(await action.screenshot())
  let whiteEdges = 0
  for (let y = 12; y < shot.height - 12; y++) for (const x of [0, 1, shot.width - 2, shot.width - 1]) {
    const index = (y * shot.width + x) * 4
    if (shot.data[index] > 190 && shot.data[index + 1] > 190 && shot.data[index + 2] > 190) whiteEdges++
  }
  expect(whiteEdges).toBe(0)
  await page.screenshot({ path: `test-results/share-action-${width}.png` })
  await action.click()
  const dialog = page.getByRole("dialog", { name: "Share your stack" })
  const list = dialog.getByRole("list", { name: "Stack resources" })
  await expect(list.getByRole("listitem")).toHaveCount(3)
  await expect(dialog.getByRole("tab")).toHaveCount(3)
  expect(await list.locator(".name").first().evaluate(el => getComputedStyle(el).fontSize)).toBe("13px")
  await expect(list.locator(".resource-logo img")).toHaveCount(3)
  await expect(list.getByRole("checkbox")).toHaveCount(0)
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
  await page.screenshot({ path: `test-results/share-list-${width}.png` })
  await list.locator(".resource-link").first().click()
  await expect(page.getByRole("dialog", { name: "Aceternity UI preview" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.locator("dialog[open]")).toHaveCount(0)
})
