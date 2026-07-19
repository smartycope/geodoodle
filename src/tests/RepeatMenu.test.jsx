import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { useReducer } from "react"
import RepeatMenu from "../Menus/RepeatMenu"
import { StateContext } from "../Contexts"
import Point from "../helper/Point"
import Line from "../helper/Line"
import reducer from "../reducer"
import { getState } from "./testUtils"
import Trellis from "../helper/Trellis"
import { getLayerState, layerOwnedKeys } from "../layerUtils"

afterEach(() => vi.unstubAllGlobals())

function RepeatingHarness({ action, actionLabel }) {
  const state = getState()
  const bounds = [new Point(0, 0), new Point(10, 10)]
  const lines = [
    new Line(state, new Point(1, 1), new Point(2, 2)),
    new Line(state, new Point(20, 20), new Point(30, 30)),
  ]
  const layer = state.layers[0].copy({ bounds, lines })
  const layerState = getLayerState({ ...state, layers: [layer] }, layer)
  const initialState = {
    ...state,
    layers: [layer],
    openMenus: { ...state.openMenus, repeat: true },
    trellisDraft: {
      layerId: layer.id,
      mode: "create",
      trellis: Trellis.fromSelection(layerState),
      sourceLineIndexes: [0],
      sourcePolyIndexes: [],
    },
    removeSelectionAfterDelete: true,
  }
  layerOwnedKeys.forEach((key) => delete initialState[key])
  const [currentState, dispatch] = useReducer(reducer, initialState)
  const view = getLayerState(currentState)

  return (
    <StateContext.Provider value={{ state: view, dispatch }}>
      <button onClick={() => dispatch(action)}>{actionLabel}</button>
      <output data-testid="repeat-state">
        {view.bounds.length}:{String(view.openMenus.repeat)}:{view.lines.length}
      </output>
      {view.openMenus.repeat && <RepeatMenu />}
    </StateContext.Provider>
  )
}

function menuState() {
  const state = getState()
  const line = new Line(state, new Point(1, 1), new Point(2, 2))
  const layer = state.layers[0].copy({ lines: [line], bounds: [new Point(0, 0), new Point(10, 10)] })
  const view = getLayerState({ ...state, layers: [layer] }, layer)
  return {
    ...view,
    openMenus: { ...view.openMenus, repeat: true },
    trellisDraft: {
      layerId: layer.id,
      mode: "create",
      trellis: Trellis.fromSelection(view),
      sourceLineIndexes: [0],
      sourcePolyIndexes: [],
    },
  }
}

describe("Repeat Menu", () => {
  test("discards the draft safely when geometry changes", () => {
    render(<RepeatingHarness action="delete_unselected" actionLabel="Delete Unselected" />)
    fireEvent.click(screen.getByRole("button", { name: "Repeat Menu" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Offset" }))
    expect(screen.getByTestId("offset-horizontal-controls")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Delete Unselected" }))

    expect(screen.getByTestId("repeat-state").textContent).toBe("2:false:1")
    expect(screen.queryByRole("button", { name: "Repeat Menu" })).toBeNull()
  })

  test("closes safely when deleting selected lines removes the active bounds", () => {
    render(<RepeatingHarness action="delete_selected" actionLabel="Delete Selected" />)
    fireEvent.click(screen.getByRole("button", { name: "Repeat Menu" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Offset" }))
    expect(screen.getByTestId("offset-horizontal-controls")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Delete Selected" }))

    expect(screen.getByTestId("repeat-state").textContent).toBe("0:false:1")
    expect(screen.queryByRole("button", { name: "Repeat Menu" })).toBeNull()
  })

  test("the Apply control dispatches the persistent trellis action", () => {
    const state = menuState()
    const dispatch = vi.fn()
    render(
      <StateContext.Provider
        value={{
          state,
          dispatch,
        }}
      >
        <RepeatMenu />
      </StateContext.Provider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Repeat Menu" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Apply" }))

    expect(dispatch).toHaveBeenCalledWith("apply_trellis")
  })

  test("keeps the Rotate reset control in its intrinsic row below the lg breakpoint", () => {
    vi.stubGlobal("innerWidth", 1199)
    const repeatState = menuState()

    render(
      <StateContext.Provider value={{ state: repeatState, dispatch: vi.fn() }}>
        <RepeatMenu />
      </StateContext.Provider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Repeat Menu" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Rotate" }))

    const submenu = screen.getByTestId("repeat-submenu")
    const reset = screen.getByRole("button", { name: "Reset Rotate" })
    const controlRow = screen.getByTestId("repeat-submenu-control-row")
    const horizontalRow = screen.getByTestId("repeat-submenu-horizontal-row")

    expect(getComputedStyle(controlRow).display).toBe("grid")
    expect(getComputedStyle(controlRow).gridTemplateColumns).toBe("auto minmax(0, 1fr)")
    expect(reset.parentElement).toBe(horizontalRow.firstElementChild)
  })

  test("lays out horizontal Offset controls as number-label pairs", () => {
    const state = menuState()

    render(
      <StateContext.Provider value={{ state, dispatch: vi.fn() }}>
        <RepeatMenu />
      </StateContext.Provider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Repeat Menu" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Offset" }))

    const controls = screen.getByTestId("offset-horizontal-controls")
    const [xNumber, xLabel, yNumber, yLabel] = controls.children

    expect(getComputedStyle(controls).display).toBe("grid")
    expect(getComputedStyle(controls).gridTemplateColumns).toBe("auto max-content")
    expect(getComputedStyle(controls).gridTemplateRows).toBe("repeat(2, auto)")
    expect(xNumber.querySelector("input")).not.toBeNull()
    expect(xLabel.textContent).toBe("X")
    expect(yNumber.querySelector("input")).not.toBeNull()
    expect(yLabel.textContent).toBe("Y")
  })
})
