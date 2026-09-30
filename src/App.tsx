import { useReducedMotion } from "framer-motion"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { X, Menu, Search } from "lucide-react"
import { PullCord } from "pullcord"
import { ResourceItem } from "./ResourceItem"
import { GlobeDock, useViewport } from "./ResourceControls"
import { ResourceNavigation } from "./ResourceNavigation"
import { StackBrowser } from "./StackBrowser"
import { StackPaneSizing } from "./StackPaneSizing"
import { JevSearch } from "./JevSearch"
import { MobileSearch } from "./MobileSearch"
import { ShareStackDialog } from "./ShareStackDialog"
import { RadiantAction } from "./RadiantAction"
import { StackFlight, type StackFlightData } from "./StackFlight"
import MediaBetweenText from "./MediaBetweenText"
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
  try {
    const saved = localStorage.getItem("resource-index-theme")
    if (saved === "dark" || saved === "light") return saved
  } catch { /* Dark mode remains the default when storage is unavailable. */ }
  return "dark"
}

function readStackDraft(): { ids?: string[]; name?: string; handle?: string } {
  try { return JSON.parse(localStorage.getItem("vibecooder-stack") ?? "null") ?? {} } catch { return {} }
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

function IntroCopy() {
  return (
    <>
      <p>all the best libraries/tools i've found on x, reddit and dms</p>
      <div className="daily-feed-line">
        <span>for daily feed:</span>
        <a href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">
          <MediaBetweenText firstText="tested" secondText="in prod" mediaUrl="/tested-in-prod.jpeg" mediaType="image" triggerType="hover" as="span"
            alt="Tested in prod" className="media-between-text" mediaContainerClassName="daily-feed-media"
            animationVariants={{ initial: { width: 0, opacity: 1 }, animate: { width: 28, opacity: 1, transition: { type: "spring", duration: 0.4, bounce: 0 } } }} />
        </a>
      </div>
    </>
  )
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const [activeSection, setActiveSection] = useState(slugify(categories[0].title))
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { width: viewportWidth } = useViewport()
  const mobile = viewportWidth <= 720
  useEffect(() => { if (!mobile) { setSearchOpen(false); setNavigationOpen(false) } }, [mobile])
  const [prompt, setPrompt] = useState("")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recommendationStatus, setRecommendationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [recommendationMessage, setRecommendationMessage] = useState("")
  const [selectedStack, setSelectedStack] = useState<string[]>(() => { const ids = readStackDraft().ids; return Array.isArray(ids) ? ids.filter(id => typeof id === "string") : [] })
  const [stackName] = useState(() => { const name = readStackDraft().name; return typeof name === "string" ? name : "" })
  const [stackHandle, setStackHandle] = useState(() => { const handle = readStackDraft().handle; return typeof handle === "string" ? handle : "" })
  const [peopleStacks, setPeopleStacks] = useState<PublishedStack[]>([])
  const [publishing, setPublishing] = useState(false)
  const [stackMessage, setStackMessage] = useState("")
  const [shareOpen, setShareOpen] = useState(false)
  const [publicStack, setPublicStack] = useState<PublishedStack | null>(null)
  const [shareLoadError, setShareLoadError] = useState("")
  const [flights, setFlights] = useState<StackFlightData[]>([])
  const flightKey = useRef(0)
  const stackTarget = useRef<HTMLDivElement>(null)
  const splitContainer = useRef<HTMLDivElement>(null)
  const [splitHeight, setSplitHeight] = useState(600)
  const reducedMotion = useReducedMotion()
  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => setSplitHeight(splitContainer.current?.clientHeight || 600))
    if (splitContainer.current) observer.observe(splitContainer.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const directory = document.querySelector<HTMLElement>(".directory")
    const pane = directory?.parentElement
    if (!pane || !directory) return
    let frame = 0
    const update = () => {
      const edge = pane.getBoundingClientRect().top + 64
      const sections = [...directory.querySelectorAll<HTMLElement>(".category, .resource-group")]
      let current = sections[0]?.id
      for (const section of sections) {
        if (section.getBoundingClientRect().top > edge) break
        current = section.id
      }
      if (current) setActiveSection(current)
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update) }
    pane.addEventListener("scroll", schedule, { passive: true })
    const observer = new ResizeObserver(schedule)
    observer.observe(pane)
    observer.observe(directory)
    update()
    return () => { pane.removeEventListener("scroll", schedule); observer.disconnect(); cancelAnimationFrame(frame) }
  }, [])

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
    if (!selectedStack.includes(resourceId) && source && !reducedMotion) {
      const from = source.closest("li")?.querySelector(".resource-logo img")?.getBoundingClientRect() ?? source.getBoundingClientRect()
      const resource = flatResources.find(item => item.id === resourceId)
      if (resource) setFlights(current => [...current, { key: ++flightKey.current, id: resourceId, url: getLogoUrl(resource.url), from: { x: from.x, y: from.y, width: from.width, height: from.height } }])
    } else if (selectedStack.includes(resourceId)) {
      setFlights(current => current.filter(flight => flight.id !== resourceId))
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

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("stack")
    if (!id) return
    const controller = new AbortController()
    fetch(`/api/stacks?id=${encodeURIComponent(id)}`, { signal: controller.signal }).then(async response => {
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not load shared stack")
      setPublicStack(data.stack)
    }).catch(error => { if (!controller.signal.aborted) setShareLoadError(error.message) })
    return () => controller.abort()
  }, [])

  useEffect(() => { if (selectedStack.length) stackTarget.current?.parentElement?.scrollTo({ top: 0 }) }, [selectedStack.length])

  const publishStack = async () => {
    setPublishing(true)
    setStackMessage("")
    try {
      const response = await fetch("/api/stacks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: stackName.trim() || stackHandle.trim().replace(/^@/, ""), handle: stackHandle, ids: selectedStack }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not publish stack")
      setPeopleStacks(current => [data.stack, ...current.filter(item => item.id !== data.stack.id)])
      return data.stack as PublishedStack
    } catch (error) { setStackMessage(error instanceof Error ? error.message : "Could not publish stack") }
    finally { setPublishing(false) }
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("resource-index-theme", theme)
  }, [theme])

  const requestRecommendations = async () => {
    const query = prompt.trim()
    if (!query || recommendationStatus === "loading") return

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
      setRecommendationMessage(data.picks?.length ? "" : "No matching resources found.")
    } catch (error) {
      setRecommendationStatus("error")
      setRecommendationMessage(error instanceof Error ? error.message : "Jev could not rank the resources.")
    } finally {
      document.querySelector(".directory")?.parentElement?.scrollTo({ top: 0 })
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
          <div className="side-heading">
          <div className="mobile-header-actions">
            <button className="icon-button mobile-search-toggle" aria-label="Search resources" title="Search resources" aria-haspopup="dialog" onClick={() => { setNavigationOpen(false); setSearchOpen(true) }}><Search size={20} /></button>
            <button className="icon-button mobile-navigation-toggle" aria-label="Browse categories" title="Browse categories" aria-expanded={navigationOpen} onClick={() => setNavigationOpen(!navigationOpen)}>{navigationOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>

          <header className="page-heading">
            <div className="page-heading-copy">
              <h1><span>{resourceCount}</span> vibe resources</h1>
              <p className="headline-kicker">for your next project</p>
            </div>
          </header>
          </div>

          <ResourceNavigation dark={theme === "dark"} mobile={mobile} activeId={activeSection} navigate={id => { scrollToSection(id); setNavigationOpen(false) }} />

          <div className="side-about">
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
          </div>

        </aside>

        <main id="top">
        {!mobile && <section className="recommender" aria-labelledby="recommender-title">
          <JevSearch query={prompt} onChange={setPrompt} onPick={() => void requestRecommendations()} loading={recommendationStatus === "loading"} dark={theme === "dark"} />
        </section>}

        <div className="split-builder" ref={splitContainer}>
        <SplitView initialTopHeight={splitHeight - 22 - (selectedResources.length ? 244 : 94)} minTopHeight={Math.min(180, Math.max(60, splitHeight - 267))} minBottomHeight={selectedResources.length ? Math.min(244, splitHeight - 83) : 94} gap={22} style={{ flex: 0, height: splitHeight, backgroundColor: "var(--paper)" }}>
          <StackPaneSizing selected={selectedResources.length > 0} height={splitHeight} />
          <SplitView.Top style={{ overflowY: "auto", overflowX: "hidden", opacity: 1, borderRadius: 0, backgroundColor: "var(--paper)", overscrollBehavior: "contain" } as any}>
            <div className="directory">

          {(recommendations.length > 0 || recommendationMessage) && (
            <div className="recommendation-results">
              <div className="recommendation-heading">
                <h2>Jev Picks</h2>
                {recommendationMessage && <span>{recommendationMessage}</span>}
              </div>

              {recommendations.length > 0 && (
                <ol className="resource-list recommendation-list">
                  {recommendations.map((resource) => (
                    <ResourceItem
                      key={resource.id}
                      resource={resource}
                      groupTitle={resource.group}
                      description={getDescription(resource, resource.group)}
                      selected={selectedResources.some(item => item.url === resource.url)}
                      onToggleStack={(element) => {
                        const match = flatResources.find(item => item.url === resource.url)
                        if (match) toggleStackResource(match.id, element)
                      }}
                      meta={resource.group}
                    />
                  ))}
                </ol>
              )}
            </div>
          )}
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
                      <h3 className="group-title">{group.title}</h3>
                      <ol className="resource-list list">
                        {group.items.map((resource) => {
                          const resourceId = getResourceId(category.title, group.title, resource)

                          return (
                            <ResourceItem
                              key={`${group.title}-${resource.name}`}
                              resource={resource}
                              groupTitle={group.title}
                              description={getDescription(resource, group.title)}
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
          <SplitView.Handle color="var(--split-handle)" style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: "var(--line)", cursor: "row-resize" } as any} />
          <SplitView.Bottom style={{ overflowY: "auto", overflowX: "hidden", opacity: 1, borderRadius: 0, backgroundColor: "var(--paper)" } as any}>
            <div className="split-pane-heading" ref={stackTarget}>
              <span>people stacks</span>
              <small aria-live="polite">{selectedResources.length} selected</small>
            </div>
            <StackBrowser resources={selectedResources} remove={toggleStackResource} flyingIds={flights.map(flight => flight.id)} />
            {selectedResources.length > 0 && <div className="stack-share-action"><RadiantAction label="Share the stack" borderless onPress={() => { setStackMessage(""); setShareOpen(true) }} /></div>}
            {shareLoadError ? <p role="alert">{shareLoadError}</p> : null}
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
          <div className="footer-credits">
          <span>
            built by <a href="https://x.com/freddy_0x" target="_blank" rel="noreferrer">0xfreddy</a> and{" "}
            <a href="https://x.com/YieldMaxing" target="_blank" rel="noreferrer">Max</a>
          </span>
          <span>·</span>
          <a href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">tested in prod</a>
          </div>
          <span className="mobile-visitor-anchor" aria-hidden="true" />
        </footer>
      </main>
      </div>
      {mobile && searchOpen && <MobileSearch query={prompt} onChange={setPrompt} onPick={() => void requestRecommendations()} loading={recommendationStatus === "loading"} close={() => setSearchOpen(false)} />}
      {shareOpen && <ShareStackDialog resources={selectedResources} handle={stackHandle} setHandle={setStackHandle} close={() => setShareOpen(false)} publish={publishStack} publishing={publishing} error={stackMessage} />}
      {publicStack && <ShareStackDialog resources={publicStack.ids.map(id => flatResources.find(resource => resource.id === id)).filter((resource): resource is StackResource => Boolean(resource))} handle={publicStack.handle} sharedId={publicStack.id} close={() => { setPublicStack(null); const url = new URL(location.href); url.searchParams.delete("stack"); history.replaceState(null, "", url) }} />}
      <GlobeDock dark={theme === "dark"} />
      {flights.map(flight => <StackFlight key={flight.key} flight={flight} onLand={key => setFlights(current => current.filter(item => item.key !== key))} />)}
    </>
  )
}
