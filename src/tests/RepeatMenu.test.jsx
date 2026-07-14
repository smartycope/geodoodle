import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import RepeatMenu from "../Menus/RepeatMenu"
import { StateContext } from "../Contexts"
import Point from "../helper/Point"
import { getState } from "./testUtils"

describe("Repeat Menu", () => {
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
})
