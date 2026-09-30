import { createRoot } from "react-dom/client"
import posthog from "posthog-js"
import App from "./App"
import "./styles.css"
import "pullcord/pullcord.css"

const posthogProjectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN

if (posthogProjectToken) {
  posthog.init(posthogProjectToken, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
    defaults: "2026-05-30",
  })
}

createRoot(document.getElementById("root")!).render(
  <App />,
)
