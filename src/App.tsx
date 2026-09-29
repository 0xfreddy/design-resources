import { useEffect, useState, type FormEvent } from "react"
import { PullCord } from "pullcord"
import { LinkPreview } from "./LinkPreview"
import MediaBetweenText from "./MediaBetweenText"
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

function ResourceItem({
  resource,
  groupTitle,
  meta,
}: {
  resource: Resource | Recommendation
  groupTitle: string
  meta?: string
}) {
  return (
    <li>
      <LinkPreview href={resource.url}>
        <span className="resource-logo" aria-hidden="true">
          <img src={getLogoUrl(resource.url)} alt="" loading="lazy" decoding="async" />
        </span>
        <span className="resource-copy">
          <span className="name">{resource.name}</span>
          <span className="description">{getDescription(resource, groupTitle)}</span>
        </span>
        <span className="domain">{meta ?? getDomain(resource.url)}</span>
        <span className="arrow" aria-hidden="true">↗</span>
      </LinkPreview>
    </li>
  )
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [activeCategory, setActiveCategory] = useState(slugify(categories[0].title))
  const [prompt, setPrompt] = useState("")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recommendationStatus, setRecommendationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [recommendationMessage, setRecommendationMessage] = useState("")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("resource-index-theme", theme)
  }, [theme])

  useEffect(() => {
    const sections = categories
      .map((category) => document.getElementById(slugify(category.title)))
      .filter((section): section is HTMLElement => Boolean(section))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible?.target.id) setActiveCategory(visible.target.id)
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
            <span>vibe resources</span>
          </a>

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

          <nav className="side-nav" aria-label="Categories">
            {categories.map((category) => (
              <a
                key={category.title}
                href={`#${slugify(category.title)}`}
                className={activeCategory === slugify(category.title) ? "active" : ""}
              >
                <span>{category.title}</span>
                <small>{getCategoryCount(category)}</small>
              </a>
            ))}
          </nav>
        </aside>

        <main id="top">
          <header className="page-heading">
            <div className="page-heading-copy">
              <h1><span>{resourceCount}</span> vibe resources for your next project</h1>
              <div className="subtitle">
                <p>all the best libraries/tools i've found on x, reddit and dms</p>
                <div className="daily-feed-line">
                  <span>for daily feed:</span>
                  <a href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">
                    <MediaBetweenText
                      firstText="tested"
                      secondText="in prod"
                      mediaUrl="/tested-in-prod.jpeg"
                      mediaType="image"
                      triggerType="hover"
                      as="span"
                      alt="Banana character sitting on a folding chair"
                      className="media-between-text"
                      mediaContainerClassName="daily-feed-media"
                      animationVariants={{
                        initial: { width: 0, opacity: 1 },
                        animate: {
                          width: 28,
                          opacity: 1,
                          transition: { duration: 0.4, type: "spring", bounce: 0 },
                        },
                      }}
                    />
                  </a>
                </div>
              </div>
            </div>

            <div className="view-toggle" aria-label="View mode">
              <button
                type="button"
                className={viewMode === "list" ? "active" : ""}
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
              >
                list
              </button>
              <button
                type="button"
                className={viewMode === "grid" ? "active" : ""}
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
              >
                grid
              </button>
            </div>
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
              <button type="submit" disabled={recommendationStatus === "loading" || !prompt.trim()}>
                {recommendationStatus === "loading" ? "…" : "pick"}
              </button>
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
                <div className="resource-group" key={group.title}>
                  <div className="group-heading">
                    <h3>{group.title}</h3>
                    <p>{groupDescriptions[group.title] ?? "Useful tools and references for this part of the build."}</p>
                  </div>
                  <ol className={`resource-list ${viewMode}`}>
                    {group.items.map((resource) => (
                      <ResourceItem
                        key={`${group.title}-${resource.name}`}
                        resource={resource}
                        groupTitle={group.title}
                      />
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          ))}
        </div>

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
