import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { PullCord } from "pullcord"
import { LinkPreview } from "./LinkPreview"
import { ArcListNav, ExpandableView, FanMenu, LiveUsersGlobe } from "./ReaticxPrimitives"
import { categories, type Resource } from "./resources"

type Recommendation = {
  id: string
  name: string
  url: string
  note?: string
  category: string
  group: string
  probability?: number
  confidence?: number | null
}

type ViewMode = "list" | "grid"

type StackResource = Resource & {
  id: string
  groupTitle: string
  categoryTitle: string
}

const resourceCount = categories.reduce(
  (total, category) => total + category.groups.reduce((groupTotal, group) => groupTotal + group.items.length, 0),
  0,
)

const groupDescriptions: Record<string, string> = {
  "AI Design / Generation Tools": "AI discovery, creative review, and generation workflows.",
  "Animated Backgrounds": "Drop-in animated atmospheres and background effects.",
  "Animation Libraries": "Motion utilities for polished interface transitions.",
  "Canvas / HTML Rendering Experiments": "Experiments for drawing and rendering interfaces.",
  "Cards, Blocks & Layout Sections": "Ready-made layout sections and interface blocks.",
  "Component Libraries / Full Kits": "Reusable components and polished UI kits.",
  "Component Marketplaces & Collections": "Broader collections and interface playgrounds.",
  "Curated Design Galleries": "Visual references for interface mood, craft, and direction.",
  "Cursor & Pointer Effects": "Pointer details that make interactions feel alive.",
  "Design Creators & Research": "Creators and research libraries worth following.",
  "Design-to-Code / Tool Builders": "Tools for turning ideas and designs into working UI.",
  "Fonts & Typefaces": "Type resources for stronger product personality.",
  "Gradients, Glass & Texture": "Color, glass, gradient, and surface treatments.",
  Icons: "Icon sets and animated symbols for interface details.",
  "Maps / Spatial UI Tools": "Spatial interface and map-building resources.",
  "Micro-interactions": "Small interaction patterns for better product feel.",
  "Product Analytics & Feedback": "Analytics and product insight tools for builders.",
  "Product Mockups & Launch Visuals": "Launch visuals, mockups, product videos, and demos.",
  "Rive / Lottie-style Motion Assets": "Motion assets and animation marketplaces.",
  "Shaders & WebGL / Three.js": "Realtime visual effects, shaders, and 3D experiments.",
  "SVG & Vector Tools": "SVG tools and vector effect generators.",
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function getGroupId(categoryTitle: string, groupTitle: string) {
  return `${slugify(categoryTitle)}-${slugify(groupTitle)}`
}

function getDomain(url: string) {
  return new URL(url).hostname.replace("www.", "")
}

function getLogoUrl(url: string) {
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`
}

function getDescription(resource: Pick<Resource, "note" | "url">, groupTitle: string) {
  return resource.note ?? groupDescriptions[groupTitle] ?? `Useful resource from ${getDomain(resource.url)}.`
}

function getInitialTheme() {
  const saved = localStorage.getItem("resource-index-theme")
  if (saved === "dark" || saved === "light") return saved
  return "light"
}

function getCategoryCount(category: (typeof categories)[number]) {
  return category.groups.reduce((total, group) => total + group.items.length, 0)
}

function getResourceId(categoryTitle: string, groupTitle: string, resource: Resource) {
  return `${slugify(categoryTitle)}-${slugify(groupTitle)}-${slugify(resource.name)}`
}

function IntroCopy() {
  return (
    <p>
      all the best libraries/tools i've found on x, reddit and dms
      <span>
        for daily feed:{" "}
        <a href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">
          tested
        </a>
      </span>
    </p>
  )
}

function ResourceItem({
  resource,
  groupTitle,
  meta,
  selected = false,
  onToggleStack,
}: {
  resource: Resource | Recommendation
  groupTitle: string
  meta?: string
  selected?: boolean
  onToggleStack?: () => void
}) {
  return (
    <li className={`${selected ? "selected" : ""}${onToggleStack ? " stackable" : ""}`}>
      <LinkPreview href={resource.url}>
        <motion.span className="resource-logo" aria-hidden="true">
          <img src={getLogoUrl(resource.url)} alt="" loading="lazy" decoding="async" />
        </motion.span>
        <span className="resource-copy">
          <span className="name">{resource.name}</span>
          <span className="description">{getDescription(resource, groupTitle)}</span>
        </span>
        <span className="domain">{meta ?? getDomain(resource.url)}</span>
        <span className="arrow" aria-hidden="true">↗</span>
      </LinkPreview>
      {onToggleStack && (
        <button type="button" className="stack-pick" onClick={onToggleStack} aria-pressed={selected}>
          {selected ? "added" : "stack"}
        </button>
      )}
    </li>
  )
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [activeSection, setActiveSection] = useState(slugify(categories[0].title))
  const [prompt, setPrompt] = useState("")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recommendationStatus, setRecommendationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [recommendationMessage, setRecommendationMessage] = useState("")
  const [selectedStack, setSelectedStack] = useState<string[]>([])
  const [stackName, setStackName] = useState("")
  const [stackHandle, setStackHandle] = useState("")

  const flatResources = useMemo<StackResource[]>(
    () =>
      categories.flatMap((category) =>
        category.groups.flatMap((group) =>
          group.items.map((resource) => ({
            ...resource,
            id: getResourceId(category.title, group.title, resource),
            groupTitle: group.title,
            categoryTitle: category.title,
          })),
        ),
      ),
    [],
  )

  const selectedResources = selectedStack
    .map((id) => flatResources.find((resource) => resource.id === id))
    .filter((resource): resource is StackResource => Boolean(resource))

  const toggleStackResource = (resourceId: string) => {
    setSelectedStack((current) =>
      current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId],
    )
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("resource-index-theme", theme)
  }, [theme])

  useEffect(() => {
    const sectionIds = categories.flatMap((category) => [
      slugify(category.title),
      ...category.groups.map((group) => getGroupId(category.title, group.title)),
    ])
    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => Boolean(section))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible?.target.id) setActiveSection(visible.target.id)
      },
      {
        rootMargin: "-22% 0px -64% 0px",
        threshold: [0.08, 0.2, 0.4],
      },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const requestRecommendations = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = prompt.trim()
    if (!query) return

    setRecommendationStatus("loading")
    setRecommendationMessage("")

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()

      if (Array.isArray(data.picks)) setRecommendations(data.picks)
      if (!response.ok) throw new Error(data.error ?? "Jev could not rank the resources.")

      setRecommendationStatus("ready")
      setRecommendationMessage(data.provider === "jev" ? "ranked by jev" : "ranked locally")
    } catch (error) {
      setRecommendationStatus("error")
      setRecommendationMessage(error instanceof Error ? error.message : "Jev could not rank the resources.")
    }
  }

  return (
    <>
      <PullCord
        onPull={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        pulled={theme === "light"}
        ariaLabel="Toggle color theme"
      />

      <div className="app-shell">
        <aside className="side-panel" aria-label="Resource navigation">
          <a className="brand" href="#top" aria-label="Back to top">
            <span className="brand-mark">vr</span>
            <span>vibecooder.dev</span>
          </a>

          <div className="side-intro">
            <IntroCopy />
          </div>

          <div className="side-section">
            <span className="side-label">Sponsors</span>
            <a className="sponsor-card" href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">
              <img src="/tested-in-prod.jpeg" alt="" />
              <span>
                <strong>tested in prod</strong>
                <small>daily design drops</small>
              </span>
            </a>
            <a className="sponsor-link" href="https://x.com/freddy_0x" target="_blank" rel="noreferrer">
              sponsor this slot ↗
            </a>
          </div>

          <ArcListNav label="Categories">
            <span className="side-label">Navigation</span>
            {categories.map((category) => (
              <a
                key={category.title}
                href={`#${slugify(category.title)}`}
                className={activeSection.startsWith(slugify(category.title)) ? "active" : ""}
              >
                <span>{category.title}</span>
                <small>{getCategoryCount(category)}</small>
              </a>
            ))}
          </ArcListNav>

          <ArcListNav label="Resource sections">
            <span className="side-label">Sections</span>
            {categories.flatMap((category) =>
              category.groups.map((group) => (
                <a
                  key={`${category.title}-${group.title}`}
                  href={`#${getGroupId(category.title, group.title)}`}
                  className={activeSection === getGroupId(category.title, group.title) ? "active" : ""}
                >
                  <span>{group.title}</span>
                  <small>{group.items.length}</small>
                </a>
              )),
            )}
          </ArcListNav>

          <div className="globe-dock">
            <ExpandableView
              preview={
                <>
                  <span>live users</span>
                  <strong>{selectedStack.length || "geo"}</strong>
                </>
              }
            >
              <LiveUsersGlobe />
            </ExpandableView>
          </div>
        </aside>

        <main id="top">
          <header className="page-heading">
            <div className="page-heading-copy">
              <h1><span>{resourceCount}</span> vibe resources</h1>
              <p className="headline-kicker">for your next project</p>
            </div>

            <FanMenu
              value={viewMode}
              onChange={setViewMode}
              items={[
                { value: "list", label: "list" },
                { value: "grid", label: "grid" },
              ]}
            />
          </header>

        <section className="recommender" aria-labelledby="recommender-title">
          <form onSubmit={requestRecommendations}>
            <label htmlFor="resource-prompt" id="recommender-title">
              what are you building?
            </label>
            <div className="prompt-row">
              <input
                id="resource-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="glassy saas landing page, animated icons, mobile onboarding..."
              />
              {prompt.trim() && (
                <button type="submit" disabled={recommendationStatus === "loading"}>
                  {recommendationStatus === "loading" ? "…" : "pick resources"}
                </button>
              )}
            </div>
          </form>

          {(recommendations.length > 0 || recommendationMessage) && (
            <div className="recommendation-results">
              <div className="recommendation-heading">
                <h2>jev picks</h2>
                {recommendationMessage && <span>{recommendationMessage}</span>}
              </div>

              {recommendations.length > 0 && (
                <ol className="resource-list recommendation-list">
                  {recommendations.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      groupTitle={resource.group}
                      meta={`${resource.group}${
                        typeof resource.probability === "number" ? ` · ${Math.round(resource.probability * 100)}%` : ""
                      }`}
                    />
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        <section className="split-builder" aria-label="Resources and stack builder">
          <div className="split-pane split-pane-resources">
            <div className="split-pane-heading">
              <span>all resources</span>
              <small>{resourceCount} tools</small>
            </div>
            <div className="directory">
              {categories.map((category) => (
                <section className="category" id={slugify(category.title)} key={category.title}>
                  <div className="category-heading">
                    <div>
                      <h2>{category.title}</h2>
                      <p>{category.groups.map((group) => group.title).join(" · ")}</p>
                    </div>
                  </div>

                  {category.groups.map((group) => (
                    <div className="resource-group" id={getGroupId(category.title, group.title)} key={group.title}>
                      <ol className={`resource-list ${viewMode}`}>
                        {group.items.map((resource) => {
                          const resourceId = getResourceId(category.title, group.title, resource)

                          return (
                            <ResourceItem
                              key={`${group.title}-${resource.name}`}
                              resource={resource}
                              groupTitle={group.title}
                              selected={selectedStack.includes(resourceId)}
                              onToggleStack={() => toggleStackResource(resourceId)}
                            />
                          )
                        })}
                      </ol>
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>
          <div className="split-handle" aria-hidden="true">
            <span />
          </div>
          <div className="split-pane split-pane-stack">
            <div className="split-pane-heading">
              <span>people stacks</span>
              <small>{selectedResources.length} selected</small>
            </div>
            <div className="stack-owner">
              <input
                value={stackName}
                onChange={(event) => setStackName(event.target.value)}
                placeholder="your name"
                aria-label="Your name"
              />
              <input
                value={stackHandle}
                onChange={(event) => setStackHandle(event.target.value)}
                placeholder="@twitter"
                aria-label="Twitter handle"
              />
            </div>
            <div className="stack-board">
              {selectedResources.length === 0 ? (
                <p>pick resources from the list and they will fly into your stack.</p>
              ) : (
                <motion.ol layout className="stack-list">
                  <AnimatePresence initial={false}>
                    {selectedResources.map((resource) => (
                      <motion.li
                        layout
                        key={resource.id}
                        initial={{ opacity: 0, y: 22, scale: 0.92, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, x: 28, scale: 0.96, filter: "blur(5px)" }}
                        transition={{ type: "spring", bounce: 0.08, duration: 0.42 }}
                      >
                        <motion.span className="stack-logo">
                          <img src={getLogoUrl(resource.url)} alt="" />
                        </motion.span>
                        <span>
                          <strong>{resource.name}</strong>
                          <small>{resource.groupTitle}</small>
                        </span>
                        <button type="button" onClick={() => toggleStackResource(resource.id)}>
                          remove
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ol>
              )}
            </div>
            <div className="stack-signature">
              <span>{stackName || "anonymous builder"}</span>
              <small>{stackHandle || "@handle"}</small>
            </div>
          </div>
        </section>

        <footer>
          <span>
            built by <a href="https://x.com/freddy_0x" target="_blank" rel="noreferrer">0xfreddy</a> and{" "}
            <a href="https://x.com/YieldMaxing" target="_blank" rel="noreferrer">Max</a>
          </span>
          <span>·</span>
          <a href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">tested in prod</a>
        </footer>
      </main>
      </div>
    </>
  )
}
