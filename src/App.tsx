import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { Check, Plus, X, Sun, Moon, Menu } from "lucide-react"
import { Text } from "react-native"
import { PullCord } from "pullcord"
import { LinkPreview } from "./LinkPreview"
import { GlobeDock, ViewMenu, useViewport } from "./ResourceControls"
import { ArcList } from "./reaticx/arc-list"
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
type PublishedStack = { id: string; name: string; handle: string; ids: string[] }

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

function readStackDraft(): { ids?: string[]; name?: string; handle?: string } {
  try { return JSON.parse(localStorage.getItem("vibecooder-stack") ?? "null") ?? {} } catch { return {} }
}

function getCategoryCount(category: (typeof categories)[number]) {
  return category.groups.reduce((total, group) => total + group.items.length, 0)
}

function getResourceId(categoryTitle: string, groupTitle: string, resource: Resource) {
  return `${slugify(categoryTitle)}-${slugify(groupTitle)}-${slugify(resource.name)}`
}

function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId)
  const pane = document.querySelector<HTMLElement>(".directory")?.parentElement
  if (section && pane) pane.scrollTo({ top: pane.scrollTop + section.getBoundingClientRect().top - pane.getBoundingClientRect().top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  history.replaceState(null, "", `#${sectionId}`)
}

const navItemStyle = {
  width: "100%",
  paddingHorizontal: 4,
  borderRadius: 6,
} as const

const navLabelStyle = {
  flex: 1,
  minWidth: 0,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  fontSize: 13,
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
  onToggleStack?: (element?: HTMLElement) => void
}) {
  return (
    <li className={`${selected ? "selected" : ""}${onToggleStack ? " stackable" : ""}`}>
      {onToggleStack && (
        <button type="button" className="stack-pick" onClick={(event) => onToggleStack(event.currentTarget)}
          aria-label={`${selected ? "Remove" : "Add"} ${resource.name} ${selected ? "from" : "to"} your stack`}
          title={selected ? "Remove from stack" : "Add to stack"} aria-pressed={selected}>
          {selected ? <Check size={17} /> : <Plus size={17} />}
        </button>
      )}
      <LinkPreview href={resource.url} name={resource.name} description={getDescription(resource, groupTitle)} category={groupTitle} selected={selected} onToggleStack={onToggleStack}>
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
    </li>
  )
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recommendationStatus, setRecommendationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [recommendationMessage, setRecommendationMessage] = useState("")
  const [selectedStack, setSelectedStack] = useState<string[]>(() => { const ids = readStackDraft().ids; return Array.isArray(ids) ? ids.filter(id => typeof id === "string") : [] })
  const [stackName, setStackName] = useState(() => { const name = readStackDraft().name; return typeof name === "string" ? name : "" })
  const [stackHandle, setStackHandle] = useState(() => { const handle = readStackDraft().handle; return typeof handle === "string" ? handle : "" })
  const [peopleStacks, setPeopleStacks] = useState<PublishedStack[]>([])
  const [publishing, setPublishing] = useState(false)
  const [stackMessage, setStackMessage] = useState("")
  const [flight, setFlight] = useState<{ key: number; url: string; from: { x: number; y: number }; to: { x: number; y: number } } | null>(null)
  const stackTarget = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const viewport = useViewport()
  const splitHeight = Math.max(500, viewport.height - 250)
  const navColors = theme === "dark" ? { normal: "#aaa9a4", active: "#f5f5f2" } : { normal: "#767671", active: "#181713" }

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

  const toggleStackResource = (resourceId: string, source?: HTMLElement) => {
    if (!selectedStack.includes(resourceId) && source && stackTarget.current && !reducedMotion) {
      const from = source.closest("li")?.querySelector(".resource-logo")?.getBoundingClientRect() ?? source.getBoundingClientRect()
      const to = stackTarget.current.getBoundingClientRect()
      const resource = flatResources.find(item => item.id === resourceId)
      if (resource) setFlight({ key: Date.now(), url: getLogoUrl(resource.url), from: { x: from.x, y: from.y }, to: { x: to.x + 14, y: to.y + 14 } })
    }
    setSelectedStack((current) =>
      current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId],
    )
  }

  useEffect(() => {
    localStorage.setItem("vibecooder-stack", JSON.stringify({ ids: selectedStack, name: stackName, handle: stackHandle }))
  }, [selectedStack, stackName, stackHandle])

  useEffect(() => {
    const controller = new AbortController()
    fetch("/api/stacks", { signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => {
      if (Array.isArray(data?.stacks)) setPeopleStacks(data.stacks)
    }).catch(() => {})
    return () => controller.abort()
  }, [])

  const publishStack = async () => {
    setPublishing(true)
    setStackMessage("")
    try {
      const response = await fetch("/api/stacks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: stackName, handle: stackHandle, ids: selectedStack }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not publish stack")
      setPeopleStacks(current => [data.stack, ...current.filter(item => item.id !== data.stack.id)])
      setStackMessage("Stack published")
    } catch (error) { setStackMessage(error instanceof Error ? error.message : "Could not publish stack") }
    finally { setPublishing(false) }
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("resource-index-theme", theme)
  }, [theme])

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
        <aside className="side-panel" aria-label="Resource navigation" data-mobile-open={navigationOpen}>
          <a className="brand" href="#top" aria-label="Back to top">
            <span className="brand-mark">vr</span>
            <span>vibecooder.dev</span>
          </a>
          <button className="icon-button mobile-navigation-toggle" aria-label="Browse categories" title="Browse categories" aria-expanded={navigationOpen} onClick={() => setNavigationOpen(!navigationOpen)}>{navigationOpen ? <X size={18} /> : <Menu size={18} />}</button>

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
                height={210}
                itemHeight={44}
                side="left"
                sweep={16}
                defaultIndex={2}
                minOpacity={0.35}
                minScale={0.86}
                style={{ flex: 0 }}
              >
                <ArcList.Viewport>
                {categories.map((category) => {
                  const sectionId = slugify(category.title)

                  return (
                    <ArcList.Item
                      key={category.title}
                      onPress={() => { scrollToSection(sectionId); setNavigationOpen(false) }}
                      style={navItemStyle}
                    >
                      <ArcList.Indicator size={10} color={navColors.normal} activeColor={navColors.active} />
                      <ArcList.Label color={navColors.normal} activeColor={navColors.active} style={navLabelStyle}>{["UI Components", "Motion & Interaction", "Visuals & Backgrounds", "Icons, Type & Assets", "Inspiration & Tools"][categories.indexOf(category)]}</ArcList.Label>
                      <Text style={[navCountStyle, { color: navColors.normal }]}>{getCategoryCount(category)}</Text>
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
                height={200}
                itemHeight={40}
                side="left"
                sweep={16}
                minOpacity={0.35}
                minScale={0.86}
                style={{ flex: 0 }}
              >
                <ArcList.Viewport>
                  {granularGroups.map(({ category, group, sectionId }) => {

                    return (
                      <ArcList.Item
                        key={`${category.title}-${group.title}`}
                        onPress={() => { scrollToSection(sectionId); setNavigationOpen(false) }}
                        style={navItemStyle}
                      >
                        <ArcList.Label color={navColors.normal} activeColor={navColors.active} style={navLabelStyle}>{group.title}</ArcList.Label>
                        <Text style={[navCountStyle, { color: navColors.normal }]}>{group.items.length}</Text>
                      </ArcList.Item>
                    )
                  })}
                </ArcList.Viewport>
              </ArcList.Root>
            </div>
          </div>

        </aside>

        <main id="top">
          <header className="page-heading">
            <div className="page-heading-copy">
              <h1><span>{resourceCount}</span> vibe resources</h1>
              <p className="headline-kicker">for your next project</p>
            </div>

            <div className="heading-tools">
              <button className="icon-button" aria-label="Toggle color theme" title="Toggle color theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
              <ViewMenu value={viewMode} onChange={setViewMode} />
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
                      selected={selectedResources.some(item => item.url === resource.url)}
                      onToggleStack={(element) => {
                        const match = flatResources.find(item => item.url === resource.url)
                        if (match) toggleStackResource(match.id, element)
                      }}
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
        <SplitView initialTopHeight={Math.round(splitHeight * 0.58)} minTopHeight={180} minBottomHeight={190} gap={22} style={{ flex: 0, height: splitHeight, backgroundColor: "var(--paper)" }}>
          <SplitView.Top style={{ overflow: "scroll", opacity: 1, borderRadius: 0, backgroundColor: "var(--paper)" }}>
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
                              onToggleStack={(element) => toggleStackResource(resourceId, element)}
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
          <SplitView.Handle color="var(--muted)" style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: "var(--line)", cursor: "row-resize" } as any} />
          <SplitView.Bottom style={{ overflow: "scroll", opacity: 1, borderRadius: 0, backgroundColor: "var(--paper)" }}>
            <div className="split-pane-heading" ref={stackTarget}>
              <span>people stacks</span>
              <small aria-live="polite">{selectedResources.length} selected</small>
            </div>
            <div className="stack-owner">
              <input
                value={stackName}
                onChange={(event) => setStackName(event.target.value)}
                placeholder="your name"
                aria-label="Your name"
                maxLength={80}
              />
              <input
                value={stackHandle}
                onChange={(event) => setStackHandle(event.target.value)}
                placeholder="@twitter"
                aria-label="Twitter handle"
                maxLength={16}
              />
            </div>
            <div className="stack-board">
              {selectedResources.length === 0 ? (
                <p>Your stack is empty.</p>
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
                        <button type="button" title="Remove from stack" aria-label={`Remove ${resource.name} from your stack`} onClick={() => toggleStackResource(resource.id)}>
                          <X size={16} />
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
              <button className="publish-stack" disabled={publishing || !stackName.trim() || selectedResources.length === 0} onClick={publishStack}>{publishing ? "Publishing..." : "Publish stack"}</button>
            </div>
            {stackMessage && <p className="stack-status" role="status">{stackMessage}</p>}
            {peopleStacks.length > 0 && <div className="people-stacks">
              {peopleStacks.map(stack => <article key={stack.id} className="published-stack">
                <div className="published-owner"><strong>{stack.name}</strong>{stack.handle && <a href={`https://x.com/${encodeURIComponent(stack.handle)}`} target="_blank" rel="noreferrer">@{stack.handle}</a>}</div>
                <ul>{stack.ids.map(id => { const resource = flatResources.find(item => item.id === id); return resource ? <li key={id}><img src={getLogoUrl(resource.url)} alt="" /><a href={resource.url} target="_blank" rel="noreferrer">{resource.name}</a></li> : null })}</ul>
              </article>)}
            </div>}
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
      <GlobeDock dark={theme === "dark"} />
      {flight && createPortal(<motion.img key={flight.key} className="stack-flight" src={flight.url} alt="" initial={{ x: flight.from.x, y: flight.from.y, opacity: 1, scale: 1 }} animate={{ x: flight.to.x, y: flight.to.y, opacity: [1, 1, 0], scale: [1, 1.25, 0.7] }} transition={{ type: "spring", duration: 0.65, bounce: 0.1 }} onAnimationComplete={() => setFlight(null)} />, document.body)}
    </>
  )
}
