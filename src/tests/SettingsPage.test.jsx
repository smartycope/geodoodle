import { fireEvent, render, screen, within } from "@testing-library/react"
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react"
import { describe, expect, test, vi } from "vitest"
import { ThemeProvider } from "@mui/material/styles"
import { StateContext } from "../Contexts"
import SettingsPage from "../Menus/SettingsPage"
import generateTheme from "../styling/theme"
import { getState } from "./testUtils"

function renderSettings(overrides = {}) {
  const baseState = getState()
  const state = {
    ...baseState,
    ...overrides,
    openMenus: { ...baseState.openMenus, settings: true },
  }
  const dispatch = vi.fn()
  const theme = generateTheme(state.paperColor, state.themeMode, "light")
  theme.components.MuiButtonBase = { defaultProps: { disableRipple: true } }

  render(
    <EmotionThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <StateContext.Provider value={{ state, dispatch }}>
          <SettingsPage />
        </StateContext.Provider>
      </ThemeProvider>
    </EmotionThemeProvider>,
  )

  const setting = screen.getByText("Remove Selection").closest("li")
  return { dispatch, select: within(setting).getByRole("combobox") }
}

describe("selection removal setting", () => {
  test("combines cut and copy behavior into one dropdown", () => {
    const { dispatch, select } = renderSettings({
      removeSelectionAfterDelete: true,
      removeSelectionAfterCopy: false,
    })

    expect(select.textContent).toBe("Remove only after Cut")

    fireEvent.mouseDown(select)
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Never Remove",
      "Remove only after Cut",
      "Always Remove",
    ])
    fireEvent.click(screen.getByRole("option", { name: "Always Remove" }))

    expect(dispatch).toHaveBeenCalledWith({
      action: "set_manual_and_save_settings",
      removeSelectionAfterDelete: true,
      removeSelectionAfterCopy: true,
    })
  })
})

describe("fancy glow setting", () => {
  test("toggles the persisted fancy glow preference", () => {
    const { dispatch } = renderSettings({ useFancyGlow: true })
    const setting = screen.getByText("Use Fancy Glow").closest("li")

    fireEvent.click(within(setting).getByRole("checkbox"))

    expect(dispatch).toHaveBeenCalledWith({
      action: "set_manual_and_save_settings",
      useFancyGlow: false,
    })
  })
})

describe("clipboard scroll setting", () => {
  test("defaults to rotating and can switch scrolling back to translation", () => {
    const { dispatch } = renderSettings({ rotateClipboardOnScroll: true, mobile: false })
    const setting = screen.getByText("Rotate Clipboard on Scroll").closest("li")
    const checkbox = within(setting).getByRole("checkbox")

    expect(checkbox.checked).toBe(true)
    fireEvent.click(checkbox)

    expect(dispatch).toHaveBeenCalledWith({
      action: "set_manual_and_save_settings",
      rotateClipboardOnScroll: false,
    })
  })
})

describe("tap and hold setting", () => {
  test("sets the action performed by a tap and hold", () => {
    const { dispatch } = renderSettings({ holdTapAction: "add_generic_selector" })
    const setting = screen.getByText("Tap + Hold").closest("li")
    const select = within(setting).getByRole("combobox")

    fireEvent.mouseDown(select)
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Add a generic selector",
      "Add a specific selector",
      "Add a bound",
    ])
    fireEvent.click(screen.getByRole("option", { name: "Add a specific selector" }))

    expect(dispatch).toHaveBeenCalledWith({
      action: "set_manual_and_save_settings",
      holdTapAction: "add_specific_selector",
    })
  })
})
