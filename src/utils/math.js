import { unique } from "./misc"

// Line arrays in state are immutable, so their identity is a reliable cache key.
// WeakMap keeps old drawings collectable after an edit replaces the array.
const allIntersectionsCache = new WeakMap()

// Returns Points
export function getAllIntersections(lines) {
  const cached = allIntersectionsCache.get(lines)
  if (cached) return cached

  const intersections = lines.length < 2 ? [] : unique(lines.flatMap((line) => line.findIntersections(lines)))

  allIntersectionsCache.set(lines, intersections)
  return intersections
}

export const multMat = (A, B) =>
  A.map((row, i) => B[0].map((_, j) => row.reduce((acc, _, n) => acc + A[i][n] * B[n][j], 0)))

export function toRadians(angle) {
  return angle * (Math.PI / 180)
}
