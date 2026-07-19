import { beforeEach, describe, expect, test } from "vitest"
import getInitialState from "../states"
import reducer from "../reducer"
import Layer from "../helper/Layer"
import Trellis from "../helper/Trellis"
import Line from "../helper/Line"
import Point from "../helper/Point"
import Poly from "../helper/Poly"
import { MIRROR_ROT } from "../globals"
import { getLayerState } from "../layerUtils"
import { deserializeState, serializeState } from "../fileUtils"
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

describe("Layer and Trellis models", () => {
  test("copy helpers leave the original models unchanged", () => {
    const layer = new Layer({ id: "one", name: "Original" })
    const renamed = layer.copy({ name: "Renamed", visible: false })
    const trellis = Trellis.fromSelection(selectedState())
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

  test("captures relative geometry and releases transformed tile zero", () => {
    const state = selectedState()
    const captured = Trellis.fromSelection(state).withControls({
      rotate: {
        row: { every: 1, val: MIRROR_ROT.RIGHT },
        col: { every: 1, val: MIRROR_ROT.NONE },
      },
    })

    expect(captured.lines[0].a.eq(new Point(1, 1).relativeTo(new Point(0, 0)))).toBe(true)
    const released = captured.materializeSource()
    expect(released.lines[0].a.eq(new Point(3, 1))).toBe(true)
    expect(released.lines[0].b.eq(new Point(3, 3))).toBe(true)
  })

  test("revives layers, trellises, geometry classes, and polygon colors", () => {
    let state = selectedState()
    const trellis = Trellis.fromSelection(state)
    const layer = state.layers[0].copy({ trellis })
    state = getLayerState({ ...state, layers: [layer] }, layer)

    const restored = deserializeState(serializeState(state))

    expect(restored.layers[0]).toBeInstanceOf(Layer)
    expect(restored.layers[0].trellis).toBeInstanceOf(Trellis)
    expect(restored.layers[0].trellis.lines[0]).toBeInstanceOf(Line)
    expect(restored.layers[0].trellis.filledPolys[0]).toBeInstanceOf(Poly)
    expect(restored.layers[0].trellis.filledPolys[0].color).toBe("#d946ef")
  })
})

describe("layer and persistent trellis actions", () => {
  beforeEach(() => {
    undoStack.length = 0
    redoStack.length = 0
  })

  test("Apply persists without bounds, Edit can cancel, and Release restores a selection", () => {
    const view = selectedState()
    let state = { ...getInitialState(), layers: view.layers }

    state = reducer(state, { action: "menu", open: "repeat" })
    expect(state.trellisDraft.mode).toBe("create")
    state = reducer(state, "apply_trellis")
    expect(state.layers[0].trellis).toBeInstanceOf(Trellis)
    expect(state.layers[0].lines).toEqual([])
    expect(state.layers[0].bounds).toEqual([])

    state = reducer(state, "undo")
    expect(state.layers[0].trellis).toBeNull()
    expect(state.layers[0].lines).toHaveLength(1)
    state = reducer(state, "redo")
    expect(state.layers[0].trellis).toBeInstanceOf(Trellis)

    state = reducer(state, { action: "menu", open: "repeat" })
    expect(state.trellisDraft.mode).toBe("edit")
    const originalTrellis = state.layers[0].trellis
    state = reducer(state, {
      action: "update_trellis_draft",
      key: "skip",
      value: { row: { every: 1, val: 2 }, col: { every: 1, val: 0 } },
    })
    state = reducer(state, { action: "menu", close: "repeat" })
    expect(state.layers[0].trellis).toBe(originalTrellis)

    state = reducer(state, "release_trellis")
    expect(state.layers[0].trellis).toBeNull()
    expect(state.layers[0].lines).toHaveLength(1)
    expect(state.layers[0].filledPolys).toHaveLength(1)
    expect(state.layers[0].bounds).toHaveLength(2)
  })

  test("Replace restores the old transformed source while capturing the new selection", () => {
    const view = selectedState()
    let state = { ...getInitialState(), layers: view.layers }
    state = reducer(state, { action: "menu", open: "repeat" })
    state = reducer(state, "apply_trellis")
    const oldReleased = state.layers[0].trellis.materializeSource().lines[0]
    const replacement = line(getLayerState(state), 10, 10, 12, 10)
    state = {
      ...state,
      layers: [
        state.layers[0].copy({
          lines: [replacement],
          bounds: [new Point(9, 9), new Point(13, 13)],
        }),
      ],
    }

    state = reducer(state, { action: "menu", open: "repeat" })
    state = reducer(state, "replace_trellis")
    expect(state.trellisDraft.mode).toBe("replace")
    state = reducer(state, "apply_trellis")

    expect(state.layers[0].trellis.lines).toHaveLength(1)
    expect(state.layers[0].trellis.lines[0].a.eq(new Point(1, 1))).toBe(true)
    expect(state.layers[0].lines).toHaveLength(1)
    expect(state.layers[0].lines[0].a.eq(oldReleased.a)).toBe(true)
  })

  test("layer creation, visibility, deletion, reordering, and undo operate on the document", () => {
    let state = getInitialState()
    state = reducer(state, "add_layer")
    const secondId = state.activeLayerId
    expect(state.layers.map((layer) => layer.id)).toEqual(["layer-1", secondId])

    state = reducer(state, "add_bound")
    state = reducer(state, { mirrorAxis: 1, cursorPos: new Point(2, 2) })
    state = reducer(state, "add_mirror_origin")
    expect(state.layers.find((layer) => layer.id === secondId).bounds).toHaveLength(1)
    expect(state.layers.find((layer) => layer.id === secondId).mirrorOrigins).toHaveLength(1)
    expect(state.layers.find((layer) => layer.id === "layer-1").bounds).toEqual([])
    expect(state.layers.find((layer) => layer.id === "layer-1").mirrorOrigins).toEqual([])

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
    expect(state.layers[0].visible).toBe(true)
    expect(state.layers[0].isEmpty).toBe(true)
  })
})
