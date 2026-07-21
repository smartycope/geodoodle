import { MIRROR_AXIS } from "../globals"
import { getBoundRect } from "./lines"
import { getCanvasToViewportMatrix, segmentIntersectsViewport } from "./transform"

export const MAX_TRELLIS_GROUPS = 5000
export const MAX_TRELLIS_CANDIDATES = 100000
export const TRELLIS_LIMIT_WARNING = "Trellis was limited to keep rendering responsive"
export const TRELLIS_SIZE_WARNING = "Select an area with both width and height to repeat"

const IDENTITY_MATRIX = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

function finiteNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function cadenceEvery(control) {
  return Math.max(1, Math.floor(Math.abs(finiteNumber(control?.every, 1))))
}

function offsetValue(control) {
  return {
    x: finiteNumber(control?.val?.x),
    y: finiteNumber(control?.val?.y),
  }
}

/*
 * interface trellisControlVal<T> {
 *     every: number,
 *     val: T,
 * }
 * interface trellisControl<T> {
 *     row: trellisControlVal<T>,
 *     col: trellisControlVal<T>,
 * }
 */
export const defaultTrellisControl = (value, every = 1) => ({
  row: {
    every,
    val: value,
  },
  col: {
    every,
    val: value,
  },
})

// While a valid Trellis is visible, it owns the selected source geometry as
// tile (0, 0). The normal permanent line/polygon layers omit those objects so
// the transformed tile is not overdrawn by an untransformed copy.
export function trellisOwnsSource(state, boundRect = getBoundRect(state)) {
  const ownsDraftSource = ["create", "replace"].includes(state.trellisDraft?.mode)
  return Boolean(
    (state.trellis === true || ownsDraftSource || (!state.trellis && state.openMenus?.repeat)) &&
      state.bounds.length > 1 &&
      boundRect &&
      boundRect.wh._x > 0 &&
      boundRect.wh._y > 0,
  )
}

export function positiveModulo(value, modulus) {
  return ((value % modulus) + modulus) % modulus
}

export function isTrellisIndexKept(index, control) {
  const every = cadenceEvery(control)
  const skip = Math.max(0, Math.floor(finiteNumber(control?.val)))
  return positiveModulo(index, every + skip) < every
}

export function cumulativeOffsetSteps(index, every) {
  const steps = Math.trunc(index / cadenceEvery({ every }))
  return Object.is(steps, -0) ? 0 : steps
}

export function isTrellisCadenceActive(index, control) {
  return positiveModulo(index, cadenceEvery(control)) === 0
}

export function multiplyAffine(left, right) {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  }
}

export function transformAffinePoint(matrix, x, y) {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  }
}

function translationMatrix(x, y) {
  return { ...IDENTITY_MATRIX, e: x, f: y }
}

function rotationMatrix(angle, origin = { x: 0, y: 0 }) {
  const radians = finiteNumber(angle) * (Math.PI / 180)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return {
    a: cos,
    b: sin,
    c: -sin,
    d: cos,
    e: origin.x * (1 - cos) + origin.y * sin,
    f: origin.y * (1 - cos) - origin.x * sin,
  }
}

function flipMatrix(axis, origin = { x: 0, y: 0 }) {
  const flipX = axis === MIRROR_AXIS.Y || axis === MIRROR_AXIS.BOTH
  const flipY = axis === MIRROR_AXIS.X || axis === MIRROR_AXIS.BOTH
  return {
    a: flipX ? -1 : 1,
    b: 0,
    c: 0,
    d: flipY ? -1 : 1,
    e: flipX ? origin.x * 2 : 0,
    f: flipY ? origin.y * 2 : 0,
  }
}

export function matrixToSvg(matrix) {
  const clean = (value) => (Math.abs(value) < 1e-12 ? 0 : value)
  return `matrix(${clean(matrix.a)} ${clean(matrix.b)} ${clean(matrix.c)} ${clean(matrix.d)} ${clean(matrix.e)} ${clean(matrix.f)})`
}

// Row zero and column zero remain the cadence phase anchors, but tile (0, 0) is
// a normal generated tile: any flip/rotation scheduled at zero transforms the
// source along with the surrounding pattern.
export function createTrellisTileDescriptor({ row, column, seed, width, height, overlap, flip, rotate }) {
  const rowOffset = offsetValue(overlap?.row)
  const columnOffset = offsetValue(overlap?.col)
  const rowSteps = cumulativeOffsetSteps(row, overlap?.row?.every)
  const columnSteps = cumulativeOffsetSteps(column, overlap?.col?.every)
  const x = seed.x + column * width + rowSteps * rowOffset.x + columnSteps * columnOffset.x
  const y = seed.y + row * height + rowSteps * rowOffset.y + columnSteps * columnOffset.y
  const center = { x: width / 2, y: height / 2 }

  let localMatrix = IDENTITY_MATRIX
  if (isTrellisCadenceActive(row, rotate?.row) && rotate.row.val)
    localMatrix = multiplyAffine(localMatrix, rotationMatrix(rotate.row.val, center))
  if (isTrellisCadenceActive(column, rotate?.col) && rotate.col.val)
    localMatrix = multiplyAffine(localMatrix, rotationMatrix(rotate.col.val, center))
  if (isTrellisCadenceActive(row, flip?.row) && flip.row.val)
    localMatrix = multiplyAffine(localMatrix, flipMatrix(flip.row.val, center))
  if (isTrellisCadenceActive(column, flip?.col) && flip.col.val)
    localMatrix = multiplyAffine(localMatrix, flipMatrix(flip.col.val, center))

  const matrix = multiplyAffine(translationMatrix(x, y), localMatrix)
  return { row, column, matrix, transform: matrixToSvg(matrix) }
}

export function createTrellisSourceTileDescriptor(state, boundRect) {
  return createTrellisTileDescriptor({
    row: 0,
    column: 0,
    seed: { x: boundRect.topLeft._x, y: boundRect.topLeft._y },
    width: boundRect.wh._x,
    height: boundRect.wh._y,
    overlap: state.trellisOverlap,
    flip: state.trellisFlip,
    rotate: state.trellisRotate,
  })
}

function objectPoints(object) {
  if (object?.a && object?.b) return [object.a, object.b]
  return Array.isArray(object?.points) ? object.points : []
}

function isLine(object) {
  return Boolean(object?.a && object?.b)
}

function getPatternMetrics(pattern, center, flip, rotate) {
  let left = Infinity
  let right = -Infinity
  let top = Infinity
  let bottom = -Infinity
  let radius = 0
  let maxStrokeWidth = 0
  const centerRadius = Math.hypot(center.x, center.y)
  const hasCenteredTransform = Boolean(rotate?.row?.val || rotate?.col?.val || flip?.row?.val || flip?.col?.val)

  pattern.forEach((object) => {
    objectPoints(object).forEach((point) => {
      left = Math.min(left, point._x)
      right = Math.max(right, point._x)
      top = Math.min(top, point._y)
      bottom = Math.max(bottom, point._y)
      if (!hasCenteredTransform) radius = Math.max(radius, Math.hypot(point._x, point._y))
      else
        // Every local flip and rotation preserves distance from the shared
        // tile center. This radius therefore contains every configured
        // transform state without enumerating their combinations.
        radius = Math.max(radius, centerRadius + Math.hypot(point._x - center.x, point._y - center.y))
    })
    if (isLine(object)) maxStrokeWidth = Math.max(maxStrokeWidth, Math.max(0, finiteNumber(object.aes?.width)))
  })

  if (!Number.isFinite(left)) return null
  const strokeRadius = maxStrokeWidth / 2
  return {
    bounds: {
      left: left - strokeRadius,
      right: right + strokeRadius,
      top: top - strokeRadius,
      bottom: bottom + strokeRadius,
    },
    radius: radius + strokeRadius,
    maxStrokeWidth,
  }
}

function invertAffine(matrix) {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) return null
  return {
    a: matrix.d / determinant,
    b: -matrix.b / determinant,
    c: -matrix.c / determinant,
    d: matrix.a / determinant,
    e: (matrix.c * matrix.f - matrix.d * matrix.e) / determinant,
    f: (matrix.b * matrix.e - matrix.a * matrix.f) / determinant,
  }
}

function canvasViewportGeometry(state, width, height) {
  const canvasMatrix = getCanvasToViewportMatrix(state, width, height)
  const inverse = invertAffine(canvasMatrix)
  if (!inverse) return null
  const corners = [
    transformAffinePoint(inverse, 0, 0),
    transformAffinePoint(inverse, width, 0),
    transformAffinePoint(inverse, 0, height),
    transformAffinePoint(inverse, width, height),
  ]
  const xs = corners.map((point) => point.x)
  const ys = corners.map((point) => point.y)
  return {
    canvasMatrix,
    corners,
    center: transformAffinePoint(inverse, width / 2, height / 2),
    bounds: {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    },
  }
}

function latticeCoefficient(point, seed, columnVector, rowVector, determinant) {
  const x = point.x - seed.x
  const y = point.y - seed.y
  return {
    column: (x * rowVector.y - rowVector.x * y) / determinant,
    row: (columnVector.x * y - x * columnVector.y) / determinant,
  }
}

function minimumNormLatticeCenter(point, seed, columnVector, rowVector) {
  const x = point.x - seed.x
  const y = point.y - seed.y
  const regularizer = 1e-8
  const columnSquared = columnVector.x ** 2 + columnVector.y ** 2 + regularizer
  const rowSquared = rowVector.x ** 2 + rowVector.y ** 2 + regularizer
  const cross = columnVector.x * rowVector.x + columnVector.y * rowVector.y
  const columnTarget = columnVector.x * x + columnVector.y * y
  const rowTarget = rowVector.x * x + rowVector.y * y
  const determinant = columnSquared * rowSquared - cross * cross
  if (Math.abs(determinant) < 1e-16) return { row: 0, column: 0 }
  return {
    column: Math.round((columnTarget * rowSquared - cross * rowTarget) / determinant),
    row: Math.round((columnSquared * rowTarget - cross * columnTarget) / determinant),
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getCandidateRange({ state, viewportWidth, viewportHeight, seed, width, height, metrics, maxCandidates }) {
  const viewport = canvasViewportGeometry(state, viewportWidth, viewportHeight)
  if (!viewport) return null

  const rowOffset = offsetValue(state.trellisOverlap?.row)
  const columnOffset = offsetValue(state.trellisOverlap?.col)
  const rowEvery = cadenceEvery(state.trellisOverlap?.row)
  const columnEvery = cadenceEvery(state.trellisOverlap?.col)
  const columnVector = {
    x: width + columnOffset.x / columnEvery,
    y: columnOffset.y / columnEvery,
  }
  const rowVector = {
    x: rowOffset.x / rowEvery,
    y: height + rowOffset.y / rowEvery,
  }
  const determinant = columnVector.x * rowVector.y - columnVector.y * rowVector.x
  const determinantScale = Math.max(
    1,
    Math.hypot(columnVector.x, columnVector.y) * Math.hypot(rowVector.x, rowVector.y),
  )
  const nearSingular = Math.abs(determinant) <= determinantScale * 1e-8

  if (nearSingular) {
    // Collapsed/near-parallel lattice vectors can place infinitely many index
    // pairs at the same location. Search a center-first finite square and let
    // the normal candidate/group guards keep that pathological case bounded.
    const center = minimumNormLatticeCenter(viewport.center, seed, columnVector, rowVector)
    const halfSpan = Math.max(1, Math.floor((Math.sqrt(maxCandidates) - 1) / 2))
    return {
      rowMin: center.row - halfSpan,
      rowMax: center.row + halfSpan,
      columnMin: center.column - halfSpan,
      columnMax: center.column + halfSpan,
      centerRow: center.row,
      centerColumn: center.column,
      fallback: true,
      canvasMatrix: viewport.canvasMatrix,
    }
  }

  // trunc(index/every) differs from index/every by less than one. Expanding by
  // the full row/column offsets therefore contains every exact cumulative tile
  // translation represented by the effective lattice vectors.
  const xPadding = metrics.radius + Math.abs(rowOffset.x) + Math.abs(columnOffset.x)
  const yPadding = metrics.radius + Math.abs(rowOffset.y) + Math.abs(columnOffset.y)
  const targetCorners = [
    { x: viewport.bounds.left - xPadding, y: viewport.bounds.top - yPadding },
    { x: viewport.bounds.right + xPadding, y: viewport.bounds.top - yPadding },
    { x: viewport.bounds.left - xPadding, y: viewport.bounds.bottom + yPadding },
    { x: viewport.bounds.right + xPadding, y: viewport.bounds.bottom + yPadding },
  ]
  const coefficients = targetCorners.map((point) =>
    latticeCoefficient(point, seed, columnVector, rowVector, determinant),
  )
  const center = latticeCoefficient(viewport.center, seed, columnVector, rowVector, determinant)
  const rows = coefficients.map((value) => value.row)
  const columns = coefficients.map((value) => value.column)
  const rowMin = Math.floor(Math.min(...rows)) - 1
  const rowMax = Math.ceil(Math.max(...rows)) + 1
  const columnMin = Math.floor(Math.min(...columns)) - 1
  const columnMax = Math.ceil(Math.max(...columns)) + 1

  return {
    rowMin,
    rowMax,
    columnMin,
    columnMax,
    centerRow: clamp(Math.round(center.row), rowMin, rowMax),
    centerColumn: clamp(Math.round(center.column), columnMin, columnMax),
    fallback: false,
    canvasMatrix: viewport.canvasMatrix,
  }
}

function* centerOutCandidates(range) {
  const { rowMin, rowMax, columnMin, columnMax, centerRow, centerColumn } = range
  const maxRadius = Math.max(centerRow - rowMin, rowMax - centerRow, centerColumn - columnMin, columnMax - centerColumn)

  for (let radius = 0; radius <= maxRadius; radius++) {
    const top = centerRow - radius
    const bottom = centerRow + radius
    const left = centerColumn - radius
    const right = centerColumn + radius

    if (top >= rowMin && top <= rowMax)
      for (let column = Math.max(left, columnMin); column <= Math.min(right, columnMax); column++)
        yield { row: top, column }

    if (bottom !== top && bottom >= rowMin && bottom <= rowMax)
      for (let column = Math.max(left, columnMin); column <= Math.min(right, columnMax); column++)
        yield { row: bottom, column }

    for (let row = Math.max(top + 1, rowMin); row <= Math.min(bottom - 1, rowMax); row++) {
      if (left >= columnMin && left <= columnMax) yield { row, column: left }
      if (right !== left && right >= columnMin && right <= columnMax) yield { row, column: right }
    }
  }
}

function rectOutsideViewport(bounds, width, height, padding) {
  return (
    bounds.right < -padding ||
    bounds.left > width + padding ||
    bounds.bottom < -padding ||
    bounds.top > height + padding
  )
}

function transformedBounds(matrix, bounds) {
  const corners = [
    transformAffinePoint(matrix, bounds.left, bounds.top),
    transformAffinePoint(matrix, bounds.right, bounds.top),
    transformAffinePoint(matrix, bounds.left, bounds.bottom),
    transformAffinePoint(matrix, bounds.right, bounds.bottom),
  ]
  const xs = corners.map((point) => point.x)
  const ys = corners.map((point) => point.y)
  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  }
}

function pointInsideViewport(point, width, height) {
  return point.x >= 0 && point.x <= width && point.y >= 0 && point.y <= height
}

function pointInPolygon(point, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    if (a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x)
      inside = !inside
  }
  return inside
}

function polygonIntersectsViewport(points, width, height) {
  if (points.length < 3) return false
  if (points.some((point) => pointInsideViewport(point, width, height))) return true

  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    if (segmentIntersectsViewport(a.x, a.y, b.x, b.y, width, height)) return true
  }

  return [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: 0, y: height },
    { x: width, y: height },
  ].some((corner) => pointInPolygon(corner, points))
}

function tileIntersectsViewport(tile, pattern, metrics, canvasMatrix, viewportWidth, viewportHeight) {
  const screenMatrix = multiplyAffine(canvasMatrix, tile.matrix)
  const viewportScale = Math.hypot(screenMatrix.a, screenMatrix.b, screenMatrix.c, screenMatrix.d)
  const maxStrokePadding = (metrics.maxStrokeWidth / 2) * viewportScale + 1
  if (
    rectOutsideViewport(
      transformedBounds(screenMatrix, metrics.bounds),
      viewportWidth,
      viewportHeight,
      maxStrokePadding,
    )
  )
    return false

  return pattern.some((object) => {
    if (isLine(object)) {
      if (!object.valid) return false
      const a = transformAffinePoint(screenMatrix, object.a._x, object.a._y)
      const b = transformAffinePoint(screenMatrix, object.b._x, object.b._y)
      const padding = (Math.max(0, finiteNumber(object.aes?.width)) / 2) * viewportScale + 1
      if (segmentIntersectsViewport(a.x, a.y, b.x, b.y, viewportWidth, viewportHeight, padding)) return true
    } else {
      const points = objectPoints(object).map((point) => transformAffinePoint(screenMatrix, point._x, point._y))
      if (polygonIntersectsViewport(points, viewportWidth, viewportHeight)) return true
    }
    return false
  })
}

export function buildVisibleTrellisTiles({
  pattern,
  state,
  boundRect,
  viewportWidth,
  viewportHeight,
  maxGroups = MAX_TRELLIS_GROUPS,
  maxCandidates = MAX_TRELLIS_CANDIDATES,
}) {
  const width = boundRect?.wh?._x ?? 0
  const height = boundRect?.wh?._y ?? 0
  if (!(width > 0 && height > 0)) return { tiles: [], warning: TRELLIS_SIZE_WARNING, checked: 0 }

  const metrics = getPatternMetrics(pattern, { x: width / 2, y: height / 2 }, state.trellisFlip, state.trellisRotate)
  if (!metrics) return { tiles: [], warning: null, checked: 0 }

  const seed = { x: boundRect.topLeft._x, y: boundRect.topLeft._y }
  const range = getCandidateRange({
    state,
    viewportWidth,
    viewportHeight,
    seed,
    width,
    height,
    metrics,
    maxCandidates,
  })
  if (!range) return { tiles: [], warning: TRELLIS_LIMIT_WARNING, checked: 0 }

  const candidates = centerOutCandidates(range)
  const tiles = []
  let checked = 0
  let limited = range.fallback

  let exhausted = false
  while (!exhausted) {
    if (checked >= maxCandidates) {
      if (!candidates.next().done) limited = true
      break
    }
    const next = candidates.next()
    if (next.done) {
      exhausted = true
      continue
    }
    checked++
    const { row, column } = next.value

    if (!isTrellisIndexKept(row, state.trellisSkip?.row)) continue
    if (!isTrellisIndexKept(column, state.trellisSkip?.col)) continue

    const tile = createTrellisTileDescriptor({
      row,
      column,
      seed,
      width,
      height,
      overlap: state.trellisOverlap,
      flip: state.trellisFlip,
      rotate: state.trellisRotate,
    })
    if (!tileIntersectsViewport(tile, pattern, metrics, range.canvasMatrix, viewportWidth, viewportHeight)) continue
    if (tiles.length >= maxGroups) {
      limited = true
      break
    }
    tiles.push(tile)
  }

  return {
    tiles,
    warning: limited ? TRELLIS_LIMIT_WARNING : null,
    checked,
  }
}
