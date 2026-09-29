import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Text } from "react-native"
import { PullCord } from "pullcord"
import { LinkPreview } from "./LinkPreview"
import { GlobeCdn } from "./ReaticxPrimitives"
import { ArcList } from "./reaticx/arc-list"
import { ExpandableView } from "./reaticx/expandable-view"
import { FanDirection, FanItemDirection, FanMenu } from "./reaticx/fan-menu"
import { SplitView } from "./reaticx/split-view"
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

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
  history.replaceState(null, "", `#${sectionId}`)
}

const navItemStyle = {
  width: "100%",
  minWidth: 220,
  paddingHorizontal: 9,
  borderRadius: 6,
} as const

const activeNavItemStyle = {
  backgroundColor: "rgba(24, 23, 19, 0.06)",
} as const

const navLabelStyle = {
  flex: 1,
  minWidth: 0,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  fontSize: 12,
  fontWeight: "500",
  lineHeight: 18,
} as const

const navCountStyle = {
  color: "rgba(113, 109, 101, 0.72)",
  fontFamily: "SFMono-Regular, SF Mono, monospace",
  fontSize: 10,
  lineHeight: 18,
} as const

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

  const granularGroups = useMemo(
    () =>
      categories.flatMap((category) =>
        category.groups.map((group) => ({
          category,
          group,
          sectionId: getGroupId(category.title, group.title),
        })),
      ),
    [],
  )

  const activeCategoryIndex = Math.max(
    0,
    categories.findIndex((category) => activeSection.startsWith(slugify(category.title))),
  )

  const activeGroupIndex = Math.max(
    0,
    granularGroups.findIndex(({ sectionId }) => activeSection === sectionId),
  )

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

          <div className="side-nav-shell" aria-label="Categories">
            <span className="side-label">Navigation</span>
            <div className="side-nav arc-list-nav">
              <ArcList.Root
                height={176}
                itemHeight={34}
                side="left"
                sweep={26}
                minOpacity={0.68}
                minScale={0.96}
                index={activeCategoryIndex}
                style={{ height: 176 }}
              >
                <ArcList.Viewport>
                {categories.map((category) => {
                  const sectionId = slugify(category.title)
                  const isActive = activeSection.startsWith(sectionId)

                  return (
                    <ArcList.Item
                      key={category.title}
                      onPress={() => scrollToSection(sectionId)}
                      style={[navItemStyle, isActive ? activeNavItemStyle : null]}
                    >
                      <ArcList.Label style={navLabelStyle}>{category.title}</ArcList.Label>
                      <Text style={navCountStyle}>{getCategoryCount(category)}</Text>
                    </ArcList.Item>
                  )
                })}
                </ArcList.Viewport>
              </ArcList.Root>
            </div>
          </div>

          <div className="side-nav-shell granular-nav" aria-label="Resource sections">
            <span className="side-label">Sections</span>
            <div className="side-nav arc-list-nav">
              <ArcList.Root
                height={300}
                itemHeight={31}
                side="left"
                sweep={22}
                minOpacity={0.58}
                minScale={0.94}
                index={activeGroupIndex}
                style={{ height: 300 }}
              >
                <ArcList.Viewport>
                  {granularGroups.map(({ category, group, sectionId }) => {
                    const isActive = activeSection === sectionId

                    return (
                      <ArcList.Item
                        key={`${category.title}-${group.title}`}
                        onPress={() => scrollToSection(sectionId)}
                        style={[navItemStyle, isActive ? activeNavItemStyle : null]}
                      >
                        <ArcList.Label style={[navLabelStyle, { fontSize: 11.5 }]}>{group.title}</ArcList.Label>
                        <Text style={navCountStyle}>{group.items.length}</Text>
                      </ArcList.Item>
                    )
                  })}
                </ArcList.Viewport>
              </ArcList.Root>
            </div>
          </div>

          <div className="globe-dock">
            <ExpandableView
              collapsedWidth={220}
              expandedWidth={380}
              collapsedHeight={42}
              expandedHeight={430}
              style={{
                backgroundColor: "rgba(255,255,255,0.96)",
                borderWidth: 1,
                borderColor: "rgba(20,20,17,0.12)",
                boxShadow: "0 14px 48px rgba(20,20,17,0.08)",
              } as any}
            >
              <ExpandableView.Collapsed>
                <span className="expandable-trigger-copy">
                  <span>live users</span>
                  <strong>{selectedStack.length || "geo"}</strong>
                </span>
              </ExpandableView.Collapsed>
              <ExpandableView.Expanded>
                <ExpandableView.Close />
                <GlobeCdn className="live-globe" />
                <p className="globe-note">PostHog geo stream ready. Connect a server key to swap these live markers from analytics.</p>
              </ExpandableView.Expanded>
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
              direction={FanDirection.Up}
              itemDirection={FanItemDirection.Clockwise}
              buttonSize={42}
              offset={0}
              style={{ position: "relative", left: 0, bottom: 0 }}
            >
              <FanMenu.Item
                value="list"
                onPress={(value) => setViewMode((value ?? "list") as ViewMode)}
                style={viewMode === "list" ? { backgroundColor: "#111" } : undefined}
              >
                <FanMenu.Label style={viewMode === "list" ? { color: "#fff" } : undefined}>list</FanMenu.Label>
              </FanMenu.Item>
              <FanMenu.Item
                value="grid"
                onPress={(value) => setViewMode((value ?? "grid") as ViewMode)}
                style={viewMode === "grid" ? { backgroundColor: "#111" } : undefined}
              >
                <FanMenu.Label style={viewMode === "grid" ? { color: "#fff" } : undefined}>grid</FanMenu.Label>
              </FanMenu.Item>
              <FanMenu.Trigger>{viewMode}</FanMenu.Trigger>
            </FanMenu>
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

        <div className="split-builder">
        <SplitView initialTopHeight={560} minTopHeight={360} minBottomHeight={250} gap={18} style={{ minHeight: 820, height: 820 }}>
          <SplitView.Top style={{ overflow: "scroll", paddingRight: 8 }}>
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
          </SplitView.Top>
          <SplitView.Handle />
          <SplitView.Bottom style={{ overflow: "scroll", paddingRight: 8 }}>
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
          </SplitView.Bottom>
        </SplitView>
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
