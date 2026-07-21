import Point from "../classes/Point"
import Rect from "../classes/Rect"
import { getBoundRect } from "./lines"
import { trellisOwnsSource, createTrellisSourceTileDescriptor, transformAffinePoint } from "./trellis"

function getSourceTransform(state, boundRect) {
  if (["create", "replace"].includes(state.trellisDraft?.mode))
    return state.trellisDraft.trellis.sourceTileDescriptor().matrix
  return trellisOwnsSource(state, boundRect) ? createTrellisSourceTileDescriptor(state, boundRect).matrix : null
}

function transformSourcePoint(point, boundRect, matrix) {
  const transformed = transformAffinePoint(matrix, point._x - boundRect.topLeft._x, point._y - boundRect.topLeft._y)
  return new Point(transformed.x, transformed.y)
}

// Stored selection geometry remains unchanged. These helpers provide the
// presentation-space canvas Points used by every selection overlay while the
// Trellis owns and transforms tile (0, 0).
export function getRenderedBounds(state, boundRect = getBoundRect(state)) {
  if (!boundRect) return state.bounds
  const matrix = getSourceTransform(state, boundRect)
  return matrix ? state.bounds.map((point) => transformSourcePoint(point, boundRect, matrix)) : state.bounds
}

export function getRenderedBoundRect(state, boundRect = getBoundRect(state)) {
  if (!boundRect) return null
  const matrix = getSourceTransform(state, boundRect)
  if (!matrix) return boundRect

  const corners = [boundRect.topLeft, boundRect.topRight, boundRect.bottomLeft, boundRect.bottomRight].map((point) =>
    transformSourcePoint(point, boundRect, matrix),
  )
  const xs = corners.map((point) => point._x)
  const ys = corners.map((point) => point._y)
  return new Rect(new Point(Math.min(...xs), Math.min(...ys)), new Point(Math.max(...xs), Math.max(...ys)), false)
}
