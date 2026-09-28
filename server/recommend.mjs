import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const TYPESAFE_ENDPOINT = "https://api.typesafe.ai/v1/systemone"
const MODEL = "jev-latest"
const MAX_PICKS = 6
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function getText(node, sourceFile) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
  throw new Error(`Unsupported expression in resource catalog: ${node.getText(sourceFile)}`)
}

function evaluate(node, sourceFile) {
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((element) => evaluate(element, sourceFile))

  if (ts.isObjectLiteralExpression(node)) {
    return Object.fromEntries(
      node.properties.map((property) => {
        if (!ts.isPropertyAssignment(property)) {
          throw new Error(`Unsupported object entry: ${property.getText(sourceFile)}`)
        }

        const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
          ? property.name.text
          : property.name.getText(sourceFile)

        return [key, evaluate(property.initializer, sourceFile)]
      }),
    )
  }

  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "r") {
    const [name, url, note] = node.arguments
    return {
      name: getText(name, sourceFile),
      url: getText(url, sourceFile),
      ...(note ? { note: getText(note, sourceFile) } : {}),
    }
  }

  return getText(node, sourceFile)
}

function readCategories() {
  const resourcesPath = resolve(root, "src/resources.ts")
  const sourceText = readFileSync(resourcesPath, "utf8")
  const sourceFile = ts.createSourceFile(resourcesPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue

    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === "categories" && declaration.initializer) {
        return evaluate(declaration.initializer, sourceFile)
      }
    }
  }

  throw new Error("Could not find exported categories in src/resources.ts")
}

function flattenResources() {
  const categories = readCategories()

  return categories.flatMap((category) =>
    category.groups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        category: category.title,
        group: group.title,
        id: `${category.title}-${group.title}-${item.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      })),
    ),
  )
}

function getDomain(url) {
  return new URL(url).hostname.replace(/^www\./, "")
}

function buildCriteria(resources) {
  return Object.fromEntries(
    resources.map((resource) => [
      resource.id,
      [
        `Name: ${resource.name}`,
        `URL: ${resource.url}`,
        `Domain: ${getDomain(resource.url)}`,
        `Category: ${resource.category}`,
        `Group: ${resource.group}`,
        resource.note ? `Note: ${resource.note}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    ]),
  )
}

function rankWithSearch(query, resources) {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2)

  return resources
    .map((resource) => {
      const haystack = [
        resource.name,
        resource.url,
        resource.note,
        resource.category,
        resource.group,
        getDomain(resource.url),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const hits = terms.filter((term) => haystack.includes(term)).length
      return { ...resource, probability: terms.length ? hits / terms.length : 0, confidence: null }
    })
    .filter((resource) => resource.probability > 0)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, MAX_PICKS)
}

async function readBody(req) {
  const chunks = []

  for await (const chunk of req) chunks.push(chunk)

  return Buffer.concat(chunks).toString("utf8")
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

export async function recommendForQuery(query, apiKey) {
  const resources = flattenResources()

  if (!apiKey) {
    return {
      error: "TYPESAFE_API_KEY is not configured.",
      picks: rankWithSearch(query, resources),
      provider: "local",
      statusCode: 503,
    }
  }

  const response = await fetch(TYPESAFE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      state: {
        user_request: query,
        task:
          "Choose the design resource that will be most useful for the user's next project. Prefer practical resources the user can open and use immediately.",
      },
      questions: {
        best_resource: {
          type: "choice",
          instructions:
            "Select the single best resource for this user request. Use the criteria descriptions to understand each resource.",
          criteria: buildCriteria(resources),
        },
      },
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Jev request failed with ${response.status}: ${message}`)
  }

  const data = await response.json()
  const answer = data.answers?.best_resource
  const probabilities = answer?.probabilities ?? {}

  const picks = Object.entries(probabilities)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, MAX_PICKS)
    .map(([id, probability]) => {
      const resource = resources.find((item) => item.id === id)
      return resource ? { ...resource, probability: Number(probability), confidence: answer.confidence } : null
    })
    .filter(Boolean)

  return {
    model: data.model,
    usage: data.usage,
    picks: picks.length ? picks : rankWithSearch(query, resources),
    provider: "jev",
  }
}

export function createRecommendHandler(apiKey) {
  return async function recommendHandler(req, res, next) {
    if (req.method !== "POST") return next()

    try {
      const body = JSON.parse(await readBody(req))
      const query = typeof body.query === "string" ? body.query.trim() : ""

      if (!query) {
        sendJson(res, 400, { error: "Tell Jev what you are building first." })
        return
      }

      const payload = await recommendForQuery(query, apiKey)
      sendJson(res, payload.statusCode ?? 200, payload)
    } catch (error) {
      sendJson(res, 500, {
        error: error instanceof Error ? error.message : "Recommendation failed.",
        picks: [],
        provider: "error",
      })
    }
  }
}
