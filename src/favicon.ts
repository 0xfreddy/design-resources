export function faviconUrl(url: string) {
  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url)}&sz=64`
}

export function handleFaviconError(image: HTMLImageElement, url: string) {
  if (!image.dataset.faviconFallback) {
    image.dataset.faviconFallback = "duckduckgo"
    image.src = `https://icons.duckduckgo.com/ip3/${new URL(url).hostname}.ico`
    return
  }

  const hostname = new URL(url).hostname.replace(/^www\./, "")
  const letter = hostname.slice(0, 1).toUpperCase().replace(/[^A-Z0-9]/g, "?")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#e8e8e3"/><text x="32" y="43" text-anchor="middle" fill="#33332f" font-family="Arial,sans-serif" font-size="34" font-weight="700">${letter}</text></svg>`
  image.onerror = null
  image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`
}
