import { viewportHeight, viewportWidth } from "./globals"

export function normalizeAngle(angle) {
  const normalized = ((((angle + 180) % 360) + 360) % 360) - 180
  return Object.is(normalized, -0) ? 0 : normalized
}

export function rotateCoordinates(x, y, angle, centerx = 0, centery = 0) {
  if (!angle) return { x, y }

  const radians = angle * (Math.PI / 180)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const offsetx = x - centerx
  const offsety = y - centery
  return {
    x: centerx + offsetx * cos - offsety * sin,
    y: centery + offsetx * sin + offsety * cos,
  }
}

export function rotateViewportCoordinates(state, x, y, angle = state.rotate ?? 0, inflated = true) {
  if (inflated) return rotateCoordinates(x, y, angle, viewportWidth() / 2, viewportHeight() / 2)

  const rotated = rotateCoordinates(
    x * state.scalex,
    y * state.scaley,
    angle,
    viewportWidth() / 2,
    viewportHeight() / 2,
  )
  return { x: rotated.x / state.scalex, y: rotated.y / state.scaley }
}

export function getCanvasRotationTransform(state) {
  return `rotate(${state.rotate ?? 0} ${viewportWidth() / 2} ${viewportHeight() / 2})`
}

export function getCanvasTransform(state) {
  const { x, y } = state.translation.asInflated(state)
  return `${getCanvasRotationTransform(state)} translate(${x} ${y}) scale(${state.scalex} ${state.scaley})`
}

// Build the canvas-to-viewport transform once so visibility checks only need a
// few multiply/add operations per endpoint. The coefficients match
// getCanvasTransform/Point.asViewport:
//
//   viewportX = a * canvasX + c * canvasY + e
//   viewportY = b * canvasX + d * canvasY + f
export function getCanvasToViewportMatrix(state, width = viewportWidth(), height = viewportHeight()) {
  const angle = (state.rotate ?? 0) * (Math.PI / 180)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const centerx = width / 2
  const centery = height / 2
  const { x: translationx, y: translationy } = state.translation.asDeflated()
  const translatedx = translationx * state.scalex
  const translatedy = translationy * state.scaley

  return {
    a: state.scalex * cos,
    b: state.scalex * sin,
    c: -state.scaley * sin,
    d: state.scaley * cos,
    e: centerx + (translatedx - centerx) * cos - (translatedy - centery) * sin,
    f: centery + (translatedx - centerx) * sin + (translatedy - centery) * cos,
  }
}

const VIEWPORT_LEFT = 1
const VIEWPORT_RIGHT = 2
const VIEWPORT_TOP = 4
const VIEWPORT_BOTTOM = 8

function viewportOutcode(x, y, left, right, top, bottom) {
  let code = 0
  if (x < left) code |= VIEWPORT_LEFT
  else if (x > right) code |= VIEWPORT_RIGHT
  if (y < top) code |= VIEWPORT_TOP
  else if (y > bottom) code |= VIEWPORT_BOTTOM
  return code
}

// Return a low-allocation visibility predicate for canvas-space lines. This is
// Cohen-Sutherland clipping against the screen rectangle, so it retains lines
// that cross the viewport even when both endpoints are off screen. Transforming
// to screen space also makes the result exact when the canvas is rotated.
export function createViewportLineCuller(state, width = viewportWidth(), height = viewportHeight()) {
  const { a, b, c, d, e, f } = getCanvasToViewportMatrix(state, width, height)

  return (line, padding = 0) => {
    if (!line?.valid) return false

    const safePadding = Number.isFinite(padding) ? Math.max(0, padding) : 0
    const left = -safePadding
    const right = width + safePadding
    const top = -safePadding
    const bottom = height + safePadding

    // This is coordinate-system math, so direct access avoids allocating two
    // temporary arrays/objects per line in this render-critical loop.
    let x1 = a * line.a._x + c * line.a._y + e
    let y1 = b * line.a._x + d * line.a._y + f
    let x2 = a * line.b._x + c * line.b._y + e
    let y2 = b * line.b._x + d * line.b._y + f
    let code1 = viewportOutcode(x1, y1, left, right, top, bottom)
    let code2 = viewportOutcode(x2, y2, left, right, top, bottom)

    while (code1 | code2) {
      if (code1 & code2) return false

      const outsideCode = code1 || code2
      let x
      let y

      if (outsideCode & VIEWPORT_TOP) {
        x = x1 + ((x2 - x1) * (top - y1)) / (y2 - y1)
        y = top
      } else if (outsideCode & VIEWPORT_BOTTOM) {
        x = x1 + ((x2 - x1) * (bottom - y1)) / (y2 - y1)
        y = bottom
      } else if (outsideCode & VIEWPORT_RIGHT) {
        y = y1 + ((y2 - y1) * (right - x1)) / (x2 - x1)
        x = right
      } else {
        y = y1 + ((y2 - y1) * (left - x1)) / (x2 - x1)
        x = left
      }

      if (outsideCode === code1) {
        x1 = x
        y1 = y
        code1 = viewportOutcode(x1, y1, left, right, top, bottom)
      } else {
        x2 = x
        y2 = y
        code2 = viewportOutcode(x2, y2, left, right, top, bottom)
      }
    }

    return true
  }
}
