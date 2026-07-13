export async function shareCurrentPage() {
  if (typeof navigator.share !== "function") {
    window.alert("Share not supported")
    return false
  }

  try {
    await navigator.share({
      title: "Cool Pattern",
      text: "Should this text be empty? Tell Cope",
      url: window.location.href,
    })
    return true
  } catch (error) {
    if (error?.name !== "AbortError") console.error("Share failed:", error)
    return false
  }
}
