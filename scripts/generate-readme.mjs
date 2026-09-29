import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const resourcesPath = resolve(root, "src/resources.ts")
const readmePath = resolve(root, "README.md")

const sourceText = readFileSync(resourcesPath, "utf8")
const sourceFile = ts.createSourceFile(resourcesPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

function getText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  throw new Error(`Unsupported expression in resource catalog: ${node.getText(sourceFile)}`)
}

function evaluate(node) {
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate)

  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)) {
          throw new Error(`Unsupported object entry: ${property.getText(sourceFile)}`)
        }

        const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
          ? property.name.text
          : property.name.getText(sourceFile)

        return [key, evaluate(property.initializer)]
      }),
    )
  }

  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "r") {
    const [name, url, note] = node.arguments
    return {
      name: getText(name),
      url: getText(url),
      ...(note ? { note: getText(note) } : {}),
    }
  }

  return getText(node)
}

function findCategories() {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue

    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === "categories" && declaration.initializer) {
        return evaluate(declaration.initializer)
      }
    }
  }

  throw new Error("Could not find exported categories in src/resources.ts")
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function screenshotUrl(url) {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=620`
}

function domain(url) {
  return new URL(url).hostname.replace(/^www\./, "")
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

const categories = findCategories()
const resourceCount = categories.reduce(
  (total, category) => total + category.groups.reduce((groupTotal, group) => groupTotal + group.items.length, 0),
  0,
)
const groupCount = categories.reduce((total, category) => total + category.groups.length, 0)

const lines = [
  "# Design Resources",
  "",
  `A compact, categorized index of ${pluralize(resourceCount, "design resource")} across ${pluralize(categories.length, "category", "categories")} and ${pluralize(groupCount, "group")}.`,
  "",
  "This repo contains a Vite website and a GitHub-friendly resource directory. Both are powered by the catalog in [`src/resources.ts`](src/resources.ts), so the site and README stay organized around the same source of truth.",
  "",
  "Run `npm run generate:readme` after editing the catalog to refresh the GitHub resource directory.",
  "",
  "## Development",
  "",
  "```bash",
  "npm install",
  "npm run dev",
  "```",
  "",
  "Create a production build with `npm run build`.",
  "",
  "## Interactive Components",
  "",
  "Navigation, animated checkboxes, split panes, the expandable globe, preview border, SearchBar, and RadiantButton use the supplied Reaticx components. Pick resources and Share the stack use the supplied black/orange RadiantButton preset. The viewport stays fixed while the resource pane scrolls; the sidebar ArcList follows the active section and exposes every subcategory without a parent click. Haptics use browser vibration where supported. Selected resources become browser-style tabs in a compact stack drawer. See [source provenance and explicit browser adaptations](src/reaticx/README.md). Run `npm run check:components` to verify source hashes and `npm run test:e2e` with the local app on port 5174 to check interactions in Chrome.",
  "",
  "Each resource has a right-side animated checkbox to add or remove it from your stack. Your selection and Twitter handle are saved as a local browser draft. Share the stack opens a modal with the Chrome-tab preview and Twitter handle; Share stack publishes it and copies a `?stack=<id>` link. Handles are self-reported, not verified identities. Shared stacks use `/api/stacks` and `/api/stacks?id=<id>`; mount a Railway volume and set `STACKS_FILE=/data/stacks.json` for persistence across deployments (local default: `.data/stacks.json`). Hover previews expand into an accessible in-site dialog; the real Apple Intelligence shader loads on demand.",
  "",
  "The live visitor globe queries PostHog through `/api/live-users`. Set `POSTHOG_HOST`, `POSTHOG_PROJECT_ID`, and server-only `POSTHOG_PERSONAL_API_KEY` (query read access). It shows an unavailable state until configured; no sample visitors are presented as live traffic. The query currently reads events from the selected project, so use a project dedicated to this website.",
  "",
  "## Resource Directory",
  "",
]

for (const category of categories) {
  lines.push(`### ${category.title}`, "")

  for (const group of category.groups) {
    lines.push(`<details open>`, `<summary><strong>${escapeHtml(group.title)}</strong></summary>`, "")
    lines.push("| Preview | Resource |")
    lines.push("| --- | --- |")

    for (const item of group.items) {
      const note = item.note ? `<br><sub>${escapeHtml(item.note)}</sub>` : ""
      const safeName = escapeHtml(item.name)
      lines.push(
        `| <a href="${item.url}"><img src="${screenshotUrl(item.url)}" alt="${safeName} website preview" width="260"></a> | **[${item.name}](${item.url})**<br><sub>${domain(item.url)}</sub>${note} |`,
      )
    }

    lines.push("", "</details>", "")
  }
}

lines.push("---", "", "_Generated from `src/resources.ts`._", "")

writeFileSync(readmePath, lines.join("\n"))
