import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { strict as assert } from "node:assert"

const root = new URL("../src/reaticx/", import.meta.url)
const manifest = JSON.parse(readFileSync(new URL("provenance.json", root), "utf8"))
for (const entry of manifest.files) {
  const actual = createHash("sha256").update(readFileSync(new URL(entry.file, root))).digest("hex")
  assert.equal(actual, entry.installedSha256, `Unreviewed change to Reaticx source: ${entry.file}`)
}
console.log(`${manifest.files.length} Reaticx source files verified; ${manifest.files.filter(file => file.upstreamSha256 === file.installedSha256).length} byte-identical to upstream.`)
