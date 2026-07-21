export function getSharedPatternParams(location = window.location) {
  const params = new URLSearchParams(location.search)
  const user = params.get("user")?.trim()
  const pattern = params.get("pattern")?.trim()
  return user && pattern ? { user, pattern } : null
}

export function buildPatternShareUrl(user, pattern, location = window.location) {
  const url = new URL(location.href)
  url.search = ""
  url.hash = ""
  url.searchParams.set("user", user)
  url.searchParams.set("pattern", pattern)
  return url.toString()
}

export function syncPatternQueryParams(user, pattern, history = window.history, location = window.location) {
  const url = new URL(location.href)
  url.searchParams.set("user", user)
  url.searchParams.set("pattern", pattern)
  const nextUrl = `${url.pathname}${url.search}${url.hash}`
  const currentUrl = `${location.pathname}${location.search}${location.hash}`
  if (nextUrl !== currentUrl) history.replaceState(history.state, "", nextUrl)
}

export async function sharePatternLink(user, pattern) {
  const url = buildPatternShareUrl(user, pattern)

  if (typeof navigator.share === "function")
    try {
      await navigator.share({
        title: `${pattern} - GeoDoodle`,
        text: `Open ${pattern} in GeoDoodle`,
        url,
      })
      return "shared"
    } catch (error) {
      if (error?.name !== "AbortError") console.error("Share failed:", error)
      return error?.name === "AbortError" ? "cancelled" : "failed"
    }

  if (typeof navigator.clipboard?.writeText === "function")
    try {
      await navigator.clipboard.writeText(url)
      return "copied"
    } catch (error) {
      console.error("Copy share link failed:", error)
    }

  return "unsupported"
}
