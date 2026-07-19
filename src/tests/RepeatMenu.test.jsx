import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { useReducer } from "react"
import RepeatMenu from "../Menus/RepeatMenu"
import { StateContext } from "../Contexts"
import Point from "../helper/Point"
import Line from "../helper/Line"
import reducer from "../reducer"
import { getState } from "./testUtils"

afterEach(() => vi.unstubAllGlobals())

describe("Repeat Menu", () => {
  test("closes safely when delete unselected removes the active bounds", () => {
    const state = getState()
    const initialState = {
      ...state,
      bounds: [new Point(0, 0), new Point(10, 10)],
      lines: [new Line(state, new Point(1, 1), new Point(2, 2)), new Line(state, new Point(20, 20), new Point(30, 30))],
      openMenus: { ...state.openMenus, repeat: true },
      removeSelectionAfterDelete: true,
    }

    function Harness() {
      const [currentState, dispatch] = useReducer(reducer, initialState)
      return (
        <StateContext.Provider value={{ state: currentState, dispatch }}>
          <button onClick={() => dispatch("delete_unselected")}>Delete Unselected</button>
          <output data-testid="repeat-state">
            {currentState.bounds.length}:{String(currentState.openMenus.repeat)}
          </output>
          {currentState.openMenus.repeat && <RepeatMenu />}
        </StateContext.Provider>
      )
    }

    render(<Harness />)
    fireEvent.click(screen.getByRole("button", { name: "Repeat Menu" }))
    fireEvent.click(screen.getByRole("menuitem", { name: "Offset" }))
    expect(screen.getByTestId("offset-horizontal-controls")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Delete Unselected" }))

    expect(screen.getByTestId("repeat-state").textContent).toBe("0:false")
    expect(screen.queryByRole("button", { name: "Repeat Menu" })).toBeNull()
  })

  test("the Apply control dispatches the persistent trellis action", () => {
    const state = getState()
    const dispatch = vi.fn()
    render(
      <StateContext.Provider
        value={{
          state: {
            ...state,
            bounds: [new Point(0, 0), new Point(10, 10)],
            openMenus: { ...state.openMenus, repeat: true },
          },
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
    const state = getState()
    const repeatState = { ...state, bounds: [new Point(0, 0), new Point(10, 10)] }

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
    const state = getState()

    render(
      <StateContext.Provider
        value={{ state: { ...state, bounds: [new Point(0, 0), new Point(10, 10)] }, dispatch: vi.fn() }}
      >
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
