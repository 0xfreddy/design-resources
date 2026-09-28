import { useEffect, useState, type FormEvent } from "react"
import { PullCord } from "pullcord"
import { LinkPreview } from "./LinkPreview"
import MediaBetweenText from "./MediaBetweenText"
import { categories } from "./resources"

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

const resourceCount = categories.reduce(
  (total, category) => total + category.groups.reduce((groupTotal, group) => groupTotal + group.items.length, 0),
  0,
)

function getInitialTheme() {
  const saved = localStorage.getItem("resource-index-theme")
  if (saved === "dark" || saved === "light") return saved
  return "light"
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)
  const [prompt, setPrompt] = useState("")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recommendationStatus, setRecommendationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle")
  const [recommendationMessage, setRecommendationMessage] = useState("")

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

  let index = 0

  return (
    <>
      <PullCord
        onPull={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        pulled={theme === "light"}
        ariaLabel="Toggle color theme"
      />

      <main>
        <header className="page-heading">
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
                <ol className="recommendation-list">
                  {recommendations.map((resource, recommendationIndex) => (
                    <li key={resource.id}>
                      <span className="number">{String(recommendationIndex + 1).padStart(2, "0")}</span>
                      <LinkPreview href={resource.url}>
                        <span className="name">{resource.name}</span>
                        <span className="domain">
                          {resource.group}
                          {typeof resource.probability === "number"
                            ? ` · ${Math.round(resource.probability * 100)}%`
                            : ""}
                        </span>
                        <span className="arrow" aria-hidden="true">↗</span>
                      </LinkPreview>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        <div className="directory">
          {categories.map((category) => (
            <section className="category" key={category.title}>
              <div className="category-heading">
                <h2>{category.title}</h2>
              </div>

              {category.groups.map((group) => (
                <div className="resource-group" key={group.title}>
                  <ol>
                    {group.items.map((resource) => {
                      index += 1
                      return (
                        <li key={`${group.title}-${resource.name}`}>
                          <span className="number">{String(index).padStart(2, "0")}</span>
                          <LinkPreview href={resource.url}>
                            <span className="name">{resource.name}</span>
                            <span className="domain">{new URL(resource.url).hostname.replace("www.", "")}</span>
                            <span className="arrow" aria-hidden="true">↗</span>
                          </LinkPreview>
                        </li>
                      )
                    })}
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
    </>
  )
}
