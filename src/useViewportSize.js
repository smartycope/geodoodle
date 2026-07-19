import { useEffect, useState } from "react"
import { viewportHeight, viewportWidth } from "./globals"

// Keep render-time viewport consumers in sync with both the layout viewport and
// the mobile visual viewport. Lines and Trellis share this so their culling
// boundaries update together.
export default function useViewportSize() {
  const [size, setSize] = useState(() => ({ width: viewportWidth(), height: viewportHeight() }))

  useEffect(() => {
    const updateSize = () => {
      const width = viewportWidth()
      const height = viewportHeight()
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    }
    const visualViewport = window.visualViewport

    window.addEventListener("resize", updateSize)
    visualViewport?.addEventListener?.("resize", updateSize)
    return () => {
      window.removeEventListener("resize", updateSize)
      visualViewport?.removeEventListener?.("resize", updateSize)
    }
  }, [])

  return size
}
