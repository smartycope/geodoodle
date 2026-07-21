import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { StateContext } from "../Contexts"
import getInitialState from "../states"
import TrellisLayer from "../classes/TrellisLayer"
import Point from "../classes/Point"
import Dist from "../classes/Dist"
import Line from "../classes/Line"
import RotateMenu from "../menus/RotateMenu"
import SkipMenu from "../menus/SkipMenu"

function trellisState(overrides = {}) {
  const base = getInitialState()
  const trellis = new TrellisLayer({
    id: "layer-2",
    name: "Trellis 2",
    sourceOrigin: new Point(0, 0),
    sourceSize: new Dist(4, 4),
    lines: [new Line(base, new Point(0, 0), new Point(2, 2))],
  })
  return { ...base, layers: [base.layers[0], trellis], activeLayerId: trellis.id, ...overrides }
}

describe("direct Trellis layer controls", () => {
  test("renders controls only for an active Trellis layer", () => {
    const dispatch = vi.fn()
    const { rerender } = render(
      <StateContext.Provider value={{ state: trellisState(), dispatch }}>
        <RotateMenu />
      </StateContext.Provider>,
    )
    expect(screen.getByTestId("trellis-submenu")).not.toBeNull()

    const drawingState = getInitialState()
    rerender(
      <StateContext.Provider value={{ state: drawingState, dispatch }}>
        <RotateMenu />
      </StateContext.Provider>,
    )
    expect(screen.queryByTestId("trellis-submenu")).toBeNull()
  })

  test("updates the active Trellis layer instead of a draft", () => {
    const dispatch = vi.fn()
    render(
      <StateContext.Provider value={{ state: trellisState(), dispatch }}>
        <SkipMenu />
      </StateContext.Provider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Reset Skip" }))
    expect(dispatch).toHaveBeenCalledWith({
      action: "update_active_layer",
      skip: {
        row: { every: 1, val: 0 },
        col: { every: 1, val: 0 },
      },
    })
  })
})
