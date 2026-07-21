import { describe, expect, test } from "vitest"
import getInitialState from "../states"
import DrawingLayer from "../classes/Layer"
import TrellisLayer from "../classes/TrellisLayer"
import Line from "../classes/Line"
import Point from "../classes/Point"
import Dist from "../classes/Dist"
import Rect from "../classes/Rect"
import { deserializePattern, deserializeState, serializePattern } from "../utils/files"

const makeLine = (state, ax, ay, bx, by, stroke = "#111111") =>
  new Line(state, new Point(ax, ay), new Point(bx, by), { stroke })

describe("layer-aware persistence and export", () => {
  test("renders visible layers in order, expands trellises finitely, and preserves hidden metadata", () => {
    const state = getInitialState()
    const bottom = state.layers[0].copy({
      name: "Bottom",
      lines: [makeLine(state, 0, 0, 2, 0, "#123456")],
    })
    const trellis = new TrellisLayer({
      sourceOrigin: new Point(2, 2),
      sourceSize: new Dist(4, 4),
      lines: [makeLine(state, 0, 0, 2, 1, "#abcdef")],
    })
    const repeated = new DrawingLayer({ id: "layer-2", name: "Repeated", trellis })
    const hidden = new DrawingLayer({
      id: "layer-3",
      name: "Hidden",
      visible: false,
      lines: [makeLine(state, 99, 99, 101, 101, "#ff0000")],
    })
    const document = { ...state, layers: [bottom, repeated, hidden], activeLayerId: repeated.id }
    const rect = new Rect(new Point(-2, -2), new Point(12, 12), false)

    const svgText = serializePattern(document, false, rect)
    const svg = new DOMParser().parseFromString(svgText, "image/svg+xml")
    const layerGroups = [...svg.querySelectorAll("svg > g[data-layer-name]")]

    expect(svg.documentElement.getAttribute("viewBox")).toBe("-2 -2 14 14")
    expect(layerGroups.map((group) => group.getAttribute("data-layer-name"))).toEqual(["Bottom", "Repeated"])
    expect(svg.querySelectorAll("#trellis-layer-2 > g").length).toBeGreaterThan(1)
    expect(svg.querySelector('g[data-layer-name="Hidden"]')).toBeNull()

    const restored = deserializePattern(svgText)
    expect(restored.layers).toHaveLength(3)
    expect(restored.layers[2].visible).toBe(false)
    expect(restored.layers[2].lines[0].a.eq(new Point(99, 99))).toBe(true)
    expect(restored.layers[1].trellis).toBeInstanceOf(TrellisLayer)
  })

  test("migrates comment-free legacy SVG line groups", () => {
    const legacy = `<svg xmlns="http://www.w3.org/2000/svg"><g id="lines"><line x1="1" y1="2" x2="3" y2="4" stroke="#222" stroke-width="0.1" stroke-dasharray="0" stroke-linecap="round" stroke-linejoin="round" /></g></svg>`

    const restored = deserializePattern(legacy)

    expect(restored.layers).toHaveLength(1)
    expect(restored.layers[0].lines).toHaveLength(1)
    expect(restored.layers[0].lines[0].a.eq(new Point(1, 2))).toBe(true)
  })

  test("migrates a legacy applied repeat into a Trellis and removes its source geometry", () => {
    const state = getInitialState()
    const sourceLine = makeLine(state, 1, 1, 3, 1)
    const legacy = JSON.stringify({
      translation: new Dist(0, 0),
      lines: [sourceLine],
      filledPolys: [],
      bounds: [new Point(0, 0), new Point(4, 4)],
      specificSelectors: [],
      genericSelectors: [],
      mirrorOrigins: [],
      trellis: true,
      trellisSkip: { row: { every: 1, val: 1 }, col: { every: 1, val: 0 } },
    })

    const restored = deserializeState(legacy)

    expect(restored.layers[0].trellis).toBeInstanceOf(TrellisLayer)
    expect(restored.layers[0].trellis.skip.row.val).toBe(1)
    expect(restored.layers[0].trellis.lines).toHaveLength(1)
    expect(restored.layers[0].lines).toEqual([])
  })
})
