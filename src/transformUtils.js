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
