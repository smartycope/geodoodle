import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import ColorMenu from "../menus/ColorMenu"
import { StateContext } from "../Contexts"
import { getState } from "./testUtils"
import Line from "../helper/Line"
import Point from "../helper/Point"

vi.mock("react-color-palette", () => ({
  ColorPicker: ({ hideInput }) => <div data-testid="color-picker" data-hidden-inputs={hideInput.join(",")} />,
  ColorService: { convert: vi.fn(() => ({})) },
}))

describe("Color Menu", () => {
  afterEach(() => {
    document.querySelector("#color-tool-button")?.remove()
  })

  const renderColorMenu = (stateOverrides = {}) => {
    const anchor = document.createElement("button")
    anchor.id = "color-tool-button"
    document.body.appendChild(anchor)
    const state = getState()
    const dispatch = vi.fn()

    const rendered = render(
      <StateContext.Provider
        value={{
          state: { ...state, ...stateOverrides, openMenus: { ...state.openMenus, color: true } },
          dispatch,
        }}
      >
        <ColorMenu />
      </StateContext.Provider>,
    )

    return { dispatch, unmount: rendered.unmount }
  }

  test("the Randomize button dispatches the active-color action", () => {
    const { dispatch } = renderColorMenu()

    fireEvent.click(screen.getByRole("button", { name: "Randomize" }))

    expect(dispatch).toHaveBeenCalledWith("randomize_color")
  })

  test("explains how color randomization is constrained", async () => {
    renderColorMenu()

    fireEvent.mouseOver(screen.getByRole("button", { name: "Randomize" }))

    expect(
      await screen.findByText("Not truly random: it finds a color that could look good on the background using OKLCH"),
    ).not.toBeNull()
  })

  test("shows either RGB or HSV inputs based on the picker setting", () => {
    const { unmount } = renderColorMenu({ useHSVColorPicker: false, hideHexColor: false })

    expect(screen.getByTestId("color-picker").getAttribute("data-hidden-inputs")).toBe("hsv")

    unmount()
    renderColorMenu({ useHSVColorPicker: true, hideHexColor: false })

    expect(screen.getByTestId("color-picker").getAttribute("data-hidden-inputs")).toBe("rgb")
  })

  test("retains palette selection, line controls, fill mode, and close controls", () => {
    const { dispatch } = renderColorMenu()
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

  test("only enables Paint selection when lines are selected", () => {
    const { unmount } = renderColorMenu()
    const paint = screen.getByRole("button", { name: "Paint selection" })

    expect(paint.disabled).toBe(true)
    unmount()

    const start = new Point(0, 0)
    const end = new Point(1, 1)
    const { dispatch } = renderColorMenu({ lines: [new Line(getState(), start, end)], bounds: [start, end] })
    const enabledPaint = screen.getByRole("button", { name: "Paint selection" })
    expect(enabledPaint.disabled).toBe(false)
    fireEvent.click(enabledPaint)

    expect(dispatch).toHaveBeenCalledWith("paint_selected")
  })
})
