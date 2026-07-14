import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import ColorMenu from "../Menus/ColorMenu"
import { StateContext } from "../Contexts"
import { getState } from "./testUtils"

vi.mock("react-color-palette", () => ({
  ColorPicker: () => null,
  ColorService: { convert: vi.fn(() => ({})) },
}))

describe("Color Menu", () => {
  afterEach(() => {
    document.querySelector("#color-tool-button")?.remove()
  })

  test("the Randomize button dispatches the palette action", () => {
    const anchor = document.createElement("button")
    anchor.id = "color-tool-button"
    document.body.appendChild(anchor)
    const state = getState()
    const dispatch = vi.fn()

    render(
      <StateContext.Provider
        value={{ state: { ...state, openMenus: { ...state.openMenus, color: true } }, dispatch }}
      >
        <ColorMenu />
      </StateContext.Provider>,
    )

    fireEvent.click(screen.getByRole("button", { name: "Randomize" }))

    expect(dispatch).toHaveBeenCalledWith("randomize_colors")
  })
})
