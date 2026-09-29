import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/browser",
  timeout: 40000,
  workers: 1,
  use: { baseURL: process.env.TEST_BASE_URL || "http://localhost:5174", channel: "chrome", viewport: { width: 1430, height: 889 }, trace: "retain-on-failure" },
})
