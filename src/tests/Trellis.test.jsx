import { render } from "@testing-library/react"
import { act } from "react"
import { describe, expect, test, vi } from "vitest"
import Trellis from "../Trellis"
import { StateContext } from "../Contexts"
import Dist from "../helper/Dist"
import Line from "../helper/Line"
import Point from "../helper/Point"
import Poly from "../helper/Poly"
import Rect from "../helper/Rect"
import { MIRROR_AXIS, MIRROR_ROT } from "../globals"
import { defaultTrellisControl } from "../utils"
import { getCanvasToViewportMatrix, segmentIntersectsViewport } from "../transformUtils"
import {
  MAX_TRELLIS_CANDIDATES,
  MAX_TRELLIS_GROUPS,
  TRELLIS_LIMIT_WARNING,
  TRELLIS_SIZE_WARNING,
  buildVisibleTrellisTiles,
  createTrellisTileDescriptor,
  cumulativeOffsetSteps,
  isTrellisCadenceActive,
  isTrellisIndexKept,
  multiplyAffine,
  transformAffinePoint,
} from "../trellisUtils"
import { getState } from "./testUtils"

const aes = {
  stroke: "black",
  width: 0,
  dash: "0",
  lineCap: "butt",
  lineJoin: "miter",
}

function trellisState(overrides = {}) {
  return {
    ...getState(),
    translation: Dist.zero(),
    scalex: 20,
    scaley: 20,
    rotate: 0,
    trellisOverlap: defaultTrellisControl({ x: 0, y: 0 }),
    trellisSkip: defaultTrellisControl(0),
    trellisFlip: defaultTrellisControl(MIRROR_AXIS.NONE),
    trellisRotate: defaultTrellisControl(MIRROR_ROT.NONE),
    ...overrides,
  }
}

function tileKey({ row, column }) {
  return `${row}:${column}`
}

describe("source-anchored Trellis cadence", () => {
  test("keeps the source index and preserves skip runs across negative indices", () => {
    const control = { every: 2, val: 1 }

    expect([-3, -2, -1, 0, 1, 2, 3].map((index) => isTrellisIndexKept(index, control))).toEqual([
      true,
      true,
      false,
      true,
      true,
      false,
      true,
    ])
  })

  test("anchors cumulative offsets and transformations at zero", () => {
    expect(cumulativeOffsetSteps(-3, 2)).toBe(-1)
    expect(cumulativeOffsetSteps(-1, 2)).toBe(0)
    expect(cumulativeOffsetSteps(0, 2)).toBe(0)
    expect(cumulativeOffsetSteps(4, 2)).toBe(2)
    expect(isTrellisCadenceActive(0, { every: 1 })).toBe(false)
    expect(isTrellisCadenceActive(-3, { every: 3 })).toBe(true)

    const source = createTrellisTileDescriptor({
      row: 0,
      column: 0,
      seed: { x: 10, y: 20 },
      width: 2,
      height: 7,
      overlap: {
        row: { every: 2, val: { x: 3, y: 4 } },
        col: { every: 3, val: { x: 5, y: 6 } },
      },
      flip: defaultTrellisControl(MIRROR_AXIS.BOTH),
      rotate: defaultTrellisControl(MIRROR_ROT.RIGHT),
    })
    expect(source.matrix).toEqual({ a: 1, b: 0, c: 0, d: 1, e: 10, f: 20 })

    const shifted = createTrellisTileDescriptor({
      row: -3,
      column: 4,
      seed: { x: 10, y: 20 },
      width: 2,
      height: 7,
      overlap: {
        row: { every: 2, val: { x: 3, y: 4 } },
        col: { every: 3, val: { x: 5, y: 6 } },
      },
      flip: defaultTrellisControl(MIRROR_AXIS.NONE),
      rotate: defaultTrellisControl(MIRROR_ROT.NONE),
    })
    expect(shifted.matrix.e).toBe(20)
    expect(shifted.matrix.f).toBe(1)
  })

  test("uses row controls for rows and column controls for columns", () => {
    const shared = {
      seed: { x: 0, y: 0 },
      width: 2,
      height: 2,
      overlap: defaultTrellisControl({ x: 0, y: 0 }),
      flip: defaultTrellisControl(MIRROR_AXIS.NONE),
      rotate: {
        row: { every: 1, val: MIRROR_ROT.RIGHT },
        col: { every: 1, val: MIRROR_ROT.STRAIGHT },
      },
    }
    const rowTile = createTrellisTileDescriptor({ ...shared, row: 1, column: 0 })
    const columnTile = createTrellisTileDescriptor({ ...shared, row: 0, column: 1 })

    expect(rowTile.matrix.a).toBeCloseTo(0)
    expect(rowTile.matrix.b).toBeCloseTo(1)
    expect(columnTile.matrix.a).toBeCloseTo(-1)
    expect(columnTile.matrix.d).toBeCloseTo(-1)
  })
})

describe("finite Trellis visibility", () => {
  test("matches a brute-force line oracle with rotation, skips, offsets, flips, and long geometry", () => {
    const viewportWidth = 160
    const viewportHeight = 120
    const boundRect = new Rect(new Point(1, 3), new Point(4, 7))
    const pattern = [new Line({}, new Point(-4, 1), new Point(7, 1), aes)]
    const state = trellisState({
      translation: new Dist(3, -2),
      scalex: 12,
      scaley: 18,
      rotate: 37,
      trellisOverlap: {
        row: { every: 2, val: { x: 1, y: -0.5 } },
        col: { every: 3, val: { x: -0.5, y: 1 } },
      },
      trellisSkip: {
        row: { every: 2, val: 1 },
        col: { every: 1, val: 1 },
      },
      trellisFlip: {
        row: { every: 3, val: MIRROR_AXIS.Y },
        col: { every: 2, val: MIRROR_AXIS.X },
      },
      trellisRotate: {
        row: { every: 2, val: MIRROR_ROT.RIGHT },
        col: { every: 3, val: MIRROR_ROT.STRAIGHT },
      },
    })
    const actual = buildVisibleTrellisTiles({ pattern, state, boundRect, viewportWidth, viewportHeight })
    const canvasMatrix = getCanvasToViewportMatrix(state, viewportWidth, viewportHeight)
    const expected = new Set()

    for (let row = -30; row <= 30; row++) {
      for (let column = -30; column <= 30; column++) {
        if (row === 0 && column === 0) continue
        if (!isTrellisIndexKept(row, state.trellisSkip.row)) continue
        if (!isTrellisIndexKept(column, state.trellisSkip.col)) continue
        const tile = createTrellisTileDescriptor({
          row,
          column,
          seed: { x: 1, y: 3 },
          width: 3,
          height: 4,
          overlap: state.trellisOverlap,
          flip: state.trellisFlip,
          rotate: state.trellisRotate,
        })
        const screenMatrix = multiplyAffine(canvasMatrix, tile.matrix)
        const a = transformAffinePoint(screenMatrix, pattern[0].a._x, pattern[0].a._y)
        const b = transformAffinePoint(screenMatrix, pattern[0].b._x, pattern[0].b._y)
        if (segmentIntersectsViewport(a.x, a.y, b.x, b.y, viewportWidth, viewportHeight, 1)) expected.add(tileKey(tile))
      }
    }

    expect(actual.warning).toBeNull()
    expect(new Set(actual.tiles.map(tileKey))).toEqual(expected)
  })

  test("retains a polygon that surrounds the viewport with every vertex off screen", () => {
    const state = trellisState({ scalex: 10, scaley: 10 })
    const boundRect = new Rect(new Point(0, 0), new Point(1, 1))
    const pattern = [new Poly([new Point(-20, -20), new Point(20, -20), new Point(20, 20), new Point(-20, 20)])]
    const result = buildVisibleTrellisTiles({
      pattern,
      state,
      boundRect,
      viewportWidth: 100,
      viewportHeight: 100,
    })

    expect(result.tiles.map(tileKey)).toContain("10:10")
  })

  test("caps visible groups and degenerate lattice searches", () => {
    expect(MAX_TRELLIS_GROUPS).toBe(5000)
    expect(MAX_TRELLIS_CANDIDATES).toBe(100000)
    const boundRect = new Rect(new Point(0, 0), new Point(1, 1))
    const pattern = [new Line({}, new Point(0, 0), new Point(1, 1), aes)]
    const ordinary = buildVisibleTrellisTiles({
      pattern,
      state: trellisState({ scalex: 1, scaley: 1 }),
      boundRect,
      viewportWidth: 100,
      viewportHeight: 100,
      maxGroups: 3,
    })
    expect(ordinary.tiles).toHaveLength(3)
    expect(ordinary.warning).toBe(TRELLIS_LIMIT_WARNING)

    const collapsed = buildVisibleTrellisTiles({
      pattern,
      state: trellisState({
        trellisOverlap: {
          row: { every: 1, val: { x: 0, y: -1 } },
          col: { every: 1, val: { x: -1, y: 0 } },
        },
      }),
      boundRect,
      viewportWidth: 100,
      viewportHeight: 100,
      maxGroups: 10,
      maxCandidates: 1000,
    })
    expect(collapsed.tiles).toHaveLength(10)
    expect(collapsed.warning).toBe(TRELLIS_LIMIT_WARNING)
  })

  test("rejects a selection without both dimensions", () => {
    const result = buildVisibleTrellisTiles({
      pattern: [new Line({}, new Point(0, 0), new Point(0, 2), aes)],
      state: trellisState(),
      boundRect: new Rect(new Point(2, 2), new Point(2, 4)),
      viewportWidth: 100,
      viewportHeight: 100,
    })

    expect(result.tiles).toEqual([])
    expect(result.warning).toBe(TRELLIS_SIZE_WARNING)
  })

  test("never emits the source group or mutates its selected geometry", () => {
    const sourceLine = new Line({}, new Point(10, 10), new Point(12, 12), aes)
    const before = JSON.stringify(sourceLine)
    const state = trellisState({
      trellis: true,
      bounds: [new Point(10, 10), new Point(12, 12)],
      lines: [sourceLine],
      filledPolys: [],
    })
    const dispatch = vi.fn()
    const { container } = render(
      <StateContext.Provider value={{ state, dispatch }}>
        <svg>
          <Trellis />
        </svg>
      </StateContext.Provider>,
    )

    expect(container.querySelector("#trellis")).not.toBeNull()
    expect(container.querySelector('#trellis > g[data-row="0"][data-column="0"]')).toBeNull()
    expect(JSON.stringify(sourceLine)).toBe(before)
    expect(state.bounds[0].eq(new Point(10, 10))).toBe(true)
    expect(state.bounds[1].eq(new Point(12, 12))).toBe(true)
  })

  test("recalculates the finite lattice when the viewport resizes", () => {
    const originalVisualViewport = Object.getOwnPropertyDescriptor(window, "visualViewport")
    const visualViewport = {
      width: 100,
      height: 100,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    Object.defineProperty(window, "visualViewport", { configurable: true, value: visualViewport })

    try {
      const sourceLine = new Line({}, new Point(0, 0), new Point(2, 2), aes)
      const state = trellisState({
        trellis: true,
        scalex: 10,
        scaley: 10,
        bounds: [new Point(0, 0), new Point(2, 2)],
        lines: [sourceLine],
        filledPolys: [],
      })
      const { container } = render(
        <StateContext.Provider value={{ state, dispatch: vi.fn() }}>
          <svg>
            <Trellis />
          </svg>
        </StateContext.Provider>,
      )
      const initialCount = container.querySelectorAll("#trellis > g").length

      act(() => {
        visualViewport.width = 300
        window.dispatchEvent(new Event("resize"))
      })

      expect(container.querySelectorAll("#trellis > g").length).toBeGreaterThan(initialCount)
    } finally {
      if (originalVisualViewport) Object.defineProperty(window, "visualViewport", originalVisualViewport)
      else delete window.visualViewport
    }
  })

  test("dispatches the zero-sized selection warning as a toast", () => {
    const state = trellisState({
      trellis: true,
      bounds: [new Point(2, 2), new Point(2, 4)],
      lines: [new Line({}, new Point(2, 2), new Point(2, 4), aes)],
      filledPolys: [],
    })
    const dispatch = vi.fn()

    render(
      <StateContext.Provider value={{ state, dispatch }}>
        <svg>
          <Trellis />
        </svg>
      </StateContext.Provider>,
    )

    expect(dispatch).toHaveBeenCalledWith({ toast: TRELLIS_SIZE_WARNING })
  })
})
