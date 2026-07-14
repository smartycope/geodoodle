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

  const renderColorMenu = () => {
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

    return dispatch
  }

  test("the Randomize button dispatches the palette action", () => {
    const dispatch = renderColorMenu()

    fireEvent.click(screen.getByRole("button", { name: "Randomize" }))

    expect(dispatch).toHaveBeenCalledWith("randomize_colors")
  })

  test("explains how palette randomization is constrained", async () => {
    renderColorMenu()

    fireEvent.mouseOver(screen.getByRole("button", { name: "Randomize" }))

    expect(
      await screen.findByText(
        "Not truly random: hues vary, while value matches the paper and saturation is increased by up to 20 points.",
      ),
    ).not.toBeNull()
  })

  test("retains palette selection, line controls, fill mode, and close controls", () => {
    const dispatch = renderColorMenu()
    const presets = screen.getAllByRole("button", { name: /Color preset/ })

    expect(presets).toHaveLength(5)
    expect(screen.queryByText("Width")).not.toBeNull()
    expect(screen.queryByLabelText("Dash")).not.toBeNull()

    fireEvent.click(presets[2])
    fireEvent.click(screen.getByRole("switch", { name: "Fill mode" }))
    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    expect(dispatch).toHaveBeenCalledWith({ colorProfile: 2 })
    expect(dispatch).toHaveBeenCalledWith("toggle_fill_mode")
    expect(dispatch).toHaveBeenCalledWith({ action: "menu", close: "color" })
  })
})
