import assert from "node:assert/strict"
import test from "node:test"
import { visitorCountry } from "../server/visitor-country.mjs"

test("Fly country lookup uses its trusted client IP and ignores forwarded headers", () => {
  assert.equal(visitorCountry({ "fly-client-ip": "8.8.8.8", "x-forwarded-for": "1.1.1.1" }, { FLY_APP_NAME: "design-resources" }), "US")
  assert.equal(visitorCountry({ "x-forwarded-for": "8.8.8.8" }, { FLY_APP_NAME: "design-resources" }), "")
  assert.equal(visitorCountry({ "fly-client-ip": "8.8.8.8" }, {}), "")
})
