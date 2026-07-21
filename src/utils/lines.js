import Rect from "../helper/Rect"

export function getBoundRect(state) {
  const { bounds, boundDragging, cursorPos } = state
  return boundDragging && bounds.length === 1
    ? Rect.fromPoints(cursorPos, bounds[0])
    : bounds.length > 1
      ? Rect.fromPoints(...bounds)
      : null
}

// Get all the lines for the clipboard, including mirroring and transformation of the clipboard
export function getAllClipboardLines(state) {
  const { clipboard, cursorPos, clipboardMirrorAxis, clipboardRotation } = state
  if (!clipboard) return []
  return clipboard.flatMap((line) => {
    const positionedLine = line
      .translate(cursorPos)
      .flip(clipboardMirrorAxis, cursorPos)
      .rotate(clipboardRotation, cursorPos)

    return positionedLine.mirror(state)
  })
}

export function getClipboardRect(state) {
  const { clipboard } = state
  if (!clipboard) return null
  const allLines = getAllClipboardLines(state)
  return getLinesRect(allLines)
}

// Returns the lines, but removes any duplicates, lines with null values, and invalid lines
export function normalizeLines(lines) {
  const seen = new Set()

  return lines.filter((line) => {
    const hash = line.hash()
    if (!line || !line.valid || seen.has(hash)) return false
    seen.add(hash)
    return true
  })
}

export function splitAllLines(lines) {
  return lines.flatMap((line) => line.split(lines))
}

// If retranslated is 'center', the lines will be retranslated to be relative to the center of the selection
// If retranslated is 'topLeft', the lines will be retranslated to be relative to the top left of the selection
// If retranslated is falsey, the lines will be returned as they are
export function getSelected(state, retranslated, polygons = false) {
  const lines = state.lines ?? []
  const filledPolys = state.filledPolys ?? []
  const boundRect = getBoundRect(state)
  const selectedLines = lines.filter((obj) => obj.isSelected(state, boundRect))
  let selected = selectedLines
  if (polygons && boundRect) selected = selected.concat(filledPolys.filter((obj) => obj.isSelected(state, boundRect)))

  if (!selected.length || !retranslated) return selected

  const selectionPoints = selected.flatMap((object) =>
    typeof object.points === "function" ? object.points() : (object.points ?? []),
  )
  const selectionRect = boundRect ?? Rect.fromPoints(...selectionPoints)

  if (retranslated === "center") return selected.map((obj) => obj.relativeTo(selectionRect.center))
  else if (retranslated === "topLeft") return selected.map((obj) => obj.relativeTo(selectionRect.topLeft))
  else return selected
}

export function getLinesRect(lines) {
  if (!lines.length) return null
  return Rect.fromPoints(...lines.flatMap((line) => line.points()))
}

// Unlike Rect.asViewport, this measures the transformed endpoints that actually
// exist rather than the four corners of their canvas-space bounding rectangle.
// That keeps artwork fitting accurate when the canvas is rotated and when the
// rendered DOM intentionally contains only on-screen lines.
export function getLinesViewportBounds(lines, state) {
  if (!lines.length) return null

  let left = Infinity
  let right = -Infinity
  let top = Infinity
  let bottom = -Infinity
  lines.forEach((line) =>
    line.points().forEach((point) => {
      const { x, y } = point.asViewport(state)
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }),
  )

  return { left, right, top, bottom, width: right - left, height: bottom - top }
}

// Returns a list of Lines - we use this instead of storing which lines go with each intersection, because
// that's more of a hassle, and the situations in which we need this function (so far, only deleting what's)
// under the cursor when it's on an intersection) don't need to be optimized, we can just recalculate all of them
// export function getLinesAssociatedWithIntersection(state, intersection) {
//   return state.lines.filter((line) => line.findIntersections(state.lines).includes(intersection))
// }

// This can't be in misc, because it requires defaultOptions, which uses misc
// export function shouldUseFancyGlow(state) {
//   const { useFancyGlow } = state
//   return useFancyGlow && getSelected(state).length <= defaultOptions.maxFancyGlowingLines
// }
