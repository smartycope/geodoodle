import { beforeEach, describe, expect, test } from "vitest"
import getInitialState from "../states"
import reducer from "../reducer"
import DrawingLayer from "../classes/DrawingLayer"
import TrellisLayer from "../classes/TrellisLayer"
import Line from "../classes/Line"
import Point from "../classes/Point"
import Poly from "../classes/Poly"
import { MIRROR_ROT } from "../globals"
import { getLayerState } from "../utils/layers"
import { deserializeState, serializeState } from "../utils/files"
import { redoStack, undoStack } from "../globals"

const line = (state, ax = 1, ay = 1, bx = 3, by = 1) => new Line(state, new Point(ax, ay), new Point(bx, by))

function selectedState() {
  const state = getInitialState()
  const sourceLine = line(state)
  const sourcePoly = new Poly([new Point(1, 1), new Point(3, 1), new Point(2, 3)], "#d946ef")
  const layer = state.layers[0].copy({
    lines: [sourceLine],
    filledPolys: [sourcePoly],
    bounds: [new Point(0, 0), new Point(4, 4)],
  })
  return getLayerState({ ...state, layers: [layer] }, layer)
}

describe("concrete Layer models", () => {
  test("copy helpers leave the original models unchanged", () => {
    const layer = new DrawingLayer({ id: "one", name: "Original" })
    const renamed = layer.copy({ name: "Renamed", visible: false })
    const trellis = TrellisLayer.fromSelection(selectedState())
    const rotated = trellis.withControls({
      rotate: {
        row: { every: 1, val: MIRROR_ROT.RIGHT },
        col: { every: 1, val: MIRROR_ROT.NONE },
      },
    })

    expect(layer.name).toBe("Original")
    expect(layer.visible).toBe(true)
    expect(renamed.name).toBe("Renamed")
    expect(trellis.rotate.row.val).toBe(MIRROR_ROT.NONE)
    expect(rotated.rotate.row.val).toBe(MIRROR_ROT.RIGHT)
  })

  test("captures relative geometry and materializes transformed tile zero", () => {
    const captured = TrellisLayer.fromSelection(selectedState()).withControls({
      rotate: {
        row: { every: 1, val: MIRROR_ROT.RIGHT },
        col: { every: 1, val: MIRROR_ROT.NONE },
      },
    })

    expect(captured.lines[0].a.eq(new Point(1, 1))).toBe(true)
    const materialized = captured.materializeSource()
    expect(materialized.lines[0].a.eq(new Point(3, 1))).toBe(true)
    expect(materialized.lines[0].b.eq(new Point(3, 3))).toBe(true)
  })

  test("revives separate concrete layers and their geometry classes", () => {
    const view = selectedState()
    const trellis = TrellisLayer.fromSelection(view)
    const drawing = view.layers[0].copy({ lines: [], filledPolys: [], bounds: [] })
    const state = { ...view, layers: [drawing, trellis], activeLayerId: trellis.id }

    const restored = deserializeState(serializeState(state))

    expect(restored.layers[0]).toBeInstanceOf(DrawingLayer)
    expect(restored.layers[1]).toBeInstanceOf(TrellisLayer)
    expect(restored.layers[1].lines[0]).toBeInstanceOf(Line)
    expect(restored.layers[1].filledPolys[0]).toBeInstanceOf(Poly)
    expect(restored.layers[1].filledPolys[0].color).toBe("#d946ef")
  })
})

describe("polymorphic layer actions", () => {
  beforeEach(() => {
    undoStack.length = 0
    redoStack.length = 0
  })

  test("creates a Trellis layer by moving the selected source geometry", () => {
    const view = selectedState()
    let state = reducer({ ...getInitialState(), layers: view.layers }, "add_trellis_layer")

    expect(state.layers).toHaveLength(2)
    expect(state.layers[0]).toBeInstanceOf(DrawingLayer)
    expect(state.layers[0].lines).toEqual([])
    expect(state.layers[0].filledPolys).toEqual([])
    expect(state.layers[1]).toBeInstanceOf(TrellisLayer)
    expect(state.layers[1].lines).toHaveLength(1)
    expect(state.layers[1].filledPolys).toHaveLength(1)
    expect(state.activeLayerId).toBe(state.layers[1].id)

    state = reducer(state, "undo")
    expect(state.layers).toHaveLength(1)
    expect(state.layers[0].lines).toHaveLength(1)
    state = reducer(state, "redo")
    expect(state.layers[1]).toBeInstanceOf(TrellisLayer)
  })

  test("updates active Trellis controls directly and persists them", () => {
    const view = selectedState()
    let state = reducer({ ...getInitialState(), layers: view.layers }, "add_trellis_layer")
    const skip = { row: { every: 4, val: 2 }, col: { every: 3, val: 1 } }

    state = reducer(state, { action: "update_active_layer", skip })
    expect(state.layers[1].skip).toEqual(skip)

    const restored = deserializeState(serializeState(state))
    expect(restored.layers[1]).toBeInstanceOf(TrellisLayer)
    expect(restored.layers[1].skip).toEqual(skip)
  })

  test("layer creation, visibility, deletion, reordering, and undo operate on the document", () => {
    let state = reducer(getInitialState(), "add_layer")
    const secondId = state.activeLayerId
    expect(state.layers.map((layer) => layer.id)).toEqual(["layer-1", secondId])

    state = reducer(state, "add_bound")
    state = reducer(state, { mirrorAxis: 1, cursorPos: new Point(2, 2) })
    state = reducer(state, "add_mirror_origin")
    expect(state.layers.find((layer) => layer.id === secondId).bounds).toHaveLength(1)
    expect(state.layers.find((layer) => layer.id === secondId).mirrorOrigins).toHaveLength(1)

    state = reducer(state, { action: "rename_layer", name: "Top" })
    state = reducer(state, { action: "reorder_layers", orderedIds: [secondId, "layer-1"] })
    expect(state.layers.map((layer) => layer.name)).toEqual(["Top", "Layer 1"])

    state = reducer(state, { action: "set_layer_visibility", layerId: secondId, visible: false })
    expect(state.activeLayerId).toBe("layer-1")
    state = reducer(state, { action: "set_layer_visibility", layerId: "layer-1", visible: false })
    const beforeBounds = state.layers.find((layer) => layer.id === "layer-1").bounds
    state = reducer(state, "add_bound")
    expect(state.layers.find((layer) => layer.id === "layer-1").bounds).toBe(beforeBounds)

    state = reducer(state, "undo")
    expect(state.layers.find((layer) => layer.id === "layer-1").visible).toBe(true)
    state = reducer(state, "redo")
    expect(state.layers.find((layer) => layer.id === "layer-1").visible).toBe(false)

    state = reducer(state, { action: "delete_layer", layerId: secondId })
    state = reducer(state, { action: "delete_layer", layerId: "layer-1" })
    expect(state.layers).toHaveLength(1)
    expect(state.layers[0]).toBeInstanceOf(DrawingLayer)
    expect(state.layers[0].isEmpty).toBe(true)
  })
})
