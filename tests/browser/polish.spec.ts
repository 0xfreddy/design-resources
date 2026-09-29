import { expect, test } from "@playwright/test"

test("dark default, quiet search, labeled groups and dashed resource hover", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  const input = page.getByRole("textbox", { name: "what are you building?" })
  await expect(input).toHaveAttribute("autocomplete", "off")
  await expect(page.locator(".jev-search .lucide-search")).toHaveCount(0)
  await input.focus()
  expect(await input.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("none")
  const groups = page.locator(".resource-group")
  expect(await groups.count()).toBeGreaterThan(15)
  expect(await page.locator(".resource-group > .group-title").count()).toBe(await groups.count())
  expect(await page.locator(".side-label").first().evaluate(el => getComputedStyle(el).textTransform)).toBe("none")
  const row = page.locator(".resource-list.list li").first()
  await row.hover()
  expect(await row.evaluate(el => getComputedStyle(el).borderTopStyle)).toBe("dashed")
  await page.getByRole("button", { name: "Toggle color theme", exact: true }).last().click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
})

test("Jev Picks contains no percentage scores or provider label", async ({ page }) => {
  await page.route("**/api/recommend", route => route.fulfill({ json: { provider: "jev", picks: [{ id: "aceternity", name: "Aceternity UI", url: "https://ui.aceternity.com", group: "Component Libraries / Full Kits", category: "UI Component Libraries", probability: .31, confidence: .17 }] } }))
  await page.goto("/")
  await page.getByRole("textbox", { name: "what are you building?" }).fill("animated components")
  await page.getByRole("button", { name: "Pick resources" }).click()
  await expect(page.getByRole("heading", { name: "Jev Picks" })).toBeVisible()
  await expect(page.locator(".recommendation-results")).not.toContainText(/%|ranked by/i)
})

test("favicon takes a full second to land opaquely on the actual tab", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => {
    (window as any).flightSamples = []
    const sample = () => {
      const flight = document.querySelector<HTMLElement>(".stack-flight")
      const target = document.querySelector<HTMLElement>(".split-builder [data-stack-icon]")
      if (flight && target) {
        const a = flight.getBoundingClientRect(), b = target.getBoundingClientRect()
        ;(window as any).flightSamples.push({ time: performance.now(), opacity: getComputedStyle(flight).opacity, hidden: getComputedStyle(target).visibility, distance: Math.hypot(a.x - b.x, a.y - b.y) })
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true }).click()
  await expect(page.locator(".stack-flight")).toHaveCount(1)
  await expect(page.locator(".stack-flight")).toHaveCount(0)
  const samples = await page.evaluate(() => (window as any).flightSamples as { time: number; opacity: string; hidden: string; distance: number }[])
  expect(samples.at(-1)!.time - samples[0].time).toBeGreaterThan(950)
  expect(samples.every(sample => sample.opacity === "1" && sample.hidden === "hidden")).toBe(true)
  expect(samples.at(-1)!.distance).toBeLessThan(3)
  await expect(page.locator(".split-builder [data-stack-icon]")).toBeVisible()
})

test("sidebar accents, contained visitor panel and rapid navigation tracking", async ({ page }) => {
  await page.setViewportSize({ width: 1591, height: 994 })
  await page.goto("/")
  for (const selector of [".side-about", ".split-builder"]) expect(await page.locator(selector).evaluate(el => getComputedStyle(el).borderBottomColor)).toBe("rgb(201, 156, 116)")
  expect(await page.locator(".app-shell").evaluate(el => getComputedStyle(el).borderLeftColor)).toBe("rgba(0, 0, 0, 0)")
  const sponsor = (await page.locator(".sponsor-card").boundingBox())!
  const dock = (await page.locator(".globe-dock").boundingBox())!
  expect(dock.width).toBeCloseTo(sponsor.width, 0)
  expect(dock.x).toBeCloseTo(sponsor.x, 0)
  await page.locator(".expandable-trigger-copy").click()
  await expect(page.getByRole("dialog", { name: "Live visitors" })).toBeVisible()
  await page.waitForTimeout(800)
  const expanded = (await page.locator(".globe-dock").boundingBox())!
  expect(expanded.width).toBeCloseTo(sponsor.width, 0)
  expect(expanded.x + expanded.width).toBeLessThanOrEqual(sponsor.x + sponsor.width + 1)
  await page.keyboard.press("Escape")
  for (const id of ["motion-animation-interaction-animation-libraries", "design-inspiration-references-ai-design-generation-tools", "assets-icons-type-brand-resources-icons"]) {
    await page.evaluate(id => {
      const group = document.getElementById(id)!
      const pane = document.querySelector(".directory")!.parentElement!
      pane.scrollTop += group.getBoundingClientRect().top - pane.getBoundingClientRect().top
    }, id)
    await page.waitForTimeout(45)
  }
  const selected = page.locator('[data-nav-section="assets-icons-type-brand-resources-icons"]')
  await expect(selected).toHaveAttribute("aria-current", "location")
  await expect(selected).toBeInViewport()
  expect(await selected.evaluate(el => getComputedStyle(el).color)).toBe("rgb(201, 156, 116)")
  await page.screenshot({ path: "test-results/sidebar-polish.png" })
})

test("reduced motion selects directly and rapid selections leave no hidden icons", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")
  const first = page.getByRole("checkbox", { name: "Select Aceternity UI for your stack", exact: true })
  await first.click()
  await expect(page.locator(".stack-flight")).toHaveCount(0)
  await expect(page.locator(".split-builder [data-stack-icon]")).toBeVisible()
  await first.click()
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await first.click()
  await page.getByRole("checkbox", { name: "Select SHSF UI Cards for your stack", exact: true }).click()
  await first.click()
  await expect(page.locator(".stack-flight")).toHaveCount(0)
  await expect(page.getByRole("tab")).toHaveCount(1)
  await expect(page.locator(".split-builder [data-stack-icon]")).toBeVisible()
})
