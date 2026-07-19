import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import LayersPanel from "../Menus/LayersPanel"
import { StateContext } from "../Contexts"
import getInitialState from "../states"
import Layer from "../helper/Layer"
import Trellis from "../helper/Trellis"
import Line from "../helper/Line"
import Point from "../helper/Point"
import Dist from "../helper/Dist"

const makeLine = (state, offset = 0) => new Line(state, new Point(offset, offset), new Point(offset + 2, offset + 1))

function renderPanel(overrides = {}) {
  const initial = getInitialState()
  const bottom = initial.layers[0].copy({ lines: [makeLine(initial)], name: "Bottom" })
  const trellis = new Trellis({
    sourceOrigin: new Point(5, 5),
    sourceSize: new Dist(4, 4),
    lines: [makeLine(initial)],
  })
  const top = new Layer({ id: "layer-2", name: "Top", trellis })
  const state = {
    ...initial,
    layers: [bottom, top],
    activeLayerId: top.id,
    openMenus: { ...initial.openMenus, layers: true },
    ...overrides,
  }
  const dispatch = vi.fn()
  const rendered = render(
    <StateContext.Provider value={{ state, dispatch }}>
      <LayersPanel />
    </StateContext.Provider>,
  )
  return { ...rendered, dispatch, state }
}

afterEach(() => vi.restoreAllMocks())

describe("Layers panel", () => {
  test("lists topmost first with dot-free previews and keyboard-focusable drag handles", () => {
    const { container } = renderPanel()
    const rows = [...container.querySelectorAll("li[data-layer-id]")]

    expect(rows.map((row) => row.dataset.layerId)).toEqual(["layer-2", "layer-1"])
    expect(screen.getByLabelText("Top preview").querySelector("line")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Reorder Top" }).tabIndex).toBe(0)
    expect(container.querySelectorAll("circle")).toHaveLength(0)
  })

  test("moves opposite a right-side toolbar", () => {
    const { container, rerender, state, dispatch } = renderPanel({ side: "top" })
    expect(getComputedStyle(container.querySelector("#layers-panel")).right).toBe("0px")

    rerender(
      <StateContext.Provider value={{ state: { ...state, side: "right" }, dispatch }}>
        <LayersPanel />
      </StateContext.Provider>,
    )
    expect(getComputedStyle(container.querySelector("#layers-panel")).left).toBe("0px")
  })

  test("commits names and exposes visibility, activation, add, and delete actions", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    const { dispatch } = renderPanel()
    const name = screen.getByRole("textbox", { name: "Name Top" })
    fireEvent.change(name, { target: { value: "Motif" } })
    fireEvent.blur(name)
    fireEvent.click(screen.getByRole("button", { name: "Hide Top" }))
    fireEvent.click(screen.getByRole("button", { name: "Add layer" }))
    fireEvent.click(screen.getByRole("button", { name: "Delete Top" }))

    expect(dispatch).toHaveBeenCalledWith({ action: "rename_layer", layerId: "layer-2", name: "Motif" })
    expect(dispatch).toHaveBeenCalledWith({
      action: "set_layer_visibility",
      layerId: "layer-2",
      visible: false,
    })
    expect(dispatch).toHaveBeenCalledWith("add_layer")
    expect(dispatch).toHaveBeenCalledWith({ action: "delete_layer", layerId: "layer-2" })
  })
})
