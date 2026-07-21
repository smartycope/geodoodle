import Dist from "../classes/Dist"
import { viewportHeight, viewportWidth } from "../globals"
import Point from "../classes/Point"

export const moveCursor = (state, x, y) => {
  const cursorPos = state.cursorPos.add(Dist.fromDeflated(state, x, y))
  return positionCursorAtEdges(state, cursorPos)
}

export function positionCursorAtEdges(state, point, edgePoint = point) {
  const width = viewportWidth()
  const height = viewportHeight()
  if (state.loopCursorAtEdges) {
    const edge = edgePoint.asViewport(state)
    let targetx = edge.x
    let targety = edge.y

    if (edge.x <= 0) targetx = width - 1
    else if (edge.x >= width - 1) targetx = 0

    if (edge.y <= 0) targety = height - 1
    else if (edge.y >= height - 1) targety = 0

    return { cursorPos: Point.fromViewport(state, targetx, targety).align(state) }
  }

  const viewportPoint = point.asViewport(state)
  let translateXpx = 0
  let translateYpx = 0

  if (viewportPoint.x < 0) translateXpx = -viewportPoint.x
  else if (viewportPoint.x > width - 1) translateXpx = -(viewportPoint.x - (width - 1))

  if (viewportPoint.y < 0) translateYpx = -viewportPoint.y
  else if (viewportPoint.y > height - 1) translateYpx = -(viewportPoint.y - (height - 1))

  return {
    cursorPos: point,
    ...(translateXpx || translateYpx
      ? { translation: state.translation.add(Dist.fromInflated(state, translateXpx, translateYpx)) }
      : {}),
  }
}

// For touch & hold & drag specifically
export const convertLastSelectorToBound = (state, selectorType) => {
  const selectorKey = `${selectorType}Selectors`
  const selectors = state[selectorKey]
  return {
    bounds: [selectors[selectors.length - 1]],
    [selectorKey]: selectors.slice(0, selectors.length - 1),
  }
}

export const nearestVisibleLayer = (layers, index) => {
  for (let distance = 0; distance < layers.length; distance++) {
    const after = layers[index + distance]
    if (after?.visible) return after
    const before = layers[index - distance]
    if (before?.visible) return before
  }
  return null
}
