import { useEffect, useState } from "react"
import { PullCord } from "pullcord"
import { LinkPreview } from "./LinkPreview"
import { categories } from "./resources"

const resourceCount = categories.reduce(
  (total, category) => total + category.groups.reduce((groupTotal, group) => groupTotal + group.items.length, 0),
  0,
)

function getInitialTheme() {
  const saved = localStorage.getItem("resource-index-theme")
  if (saved === "dark" || saved === "light") return saved
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    localStorage.setItem("resource-index-theme", theme)
  }, [theme])

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
          <h1><span>{resourceCount}</span> design resources</h1>
          <p className="subtitle">
            all the best libraries/tools i've found on x, reddit and dms
            <br />
            for daily feed: <a href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">tested in prod</a>
          </p>
        </header>

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
            built by <a href="https://x.com/freddy_0x" target="_blank" rel="noreferrer">0xfreddy</a>
          </span>
          <span>·</span>
          <a href="https://t.me/+MeWicfEktdNmODZk" target="_blank" rel="noreferrer">tested in prod</a>
        </footer>
      </main>
    </>
  )
}
