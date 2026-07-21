import { fireEvent, render, screen } from "@testing-library/react"
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react"
import { describe, expect, test, vi } from "vitest"
import { ThemeProvider } from "@mui/material/styles"
import { StateContext } from "../Contexts"
import NavMenu from "../menus/NavMenu"
import Dist from "../helper/Dist"
import Point from "../helper/Point"
import generateTheme from "../styling/theme"
import { getState } from "./testUtils"

function renderNavMenu() {
  const baseState = getState()
  const state = {
    ...baseState,
    translation: Dist.fromDeflated(4, -6),
    scalex: 40,
    scaley: 30,
    defaultScalex: 20,
    defaultScaley: 22,
    rotate: 45,
  }
  const dispatch = vi.fn()
  const theme = generateTheme(state.paperColor, state.themeMode, "light")
  theme.components.MuiButtonBase = { defaultProps: { disableRipple: true } }

  render(
    <EmotionThemeProvider theme={theme}>
      <ThemeProvider theme={theme}>
        <StateContext.Provider value={{ state, dispatch }}>
          <NavMenu />
        </StateContext.Provider>
      </ThemeProvider>
    </EmotionThemeProvider>,
  )

  return { dispatch }
}

describe("Nav Menu number resets", () => {
  test("individually resets position, scale, and rotation", () => {
    const { dispatch } = renderNavMenu()

    fireEvent.click(screen.getByRole("button", { name: "Reset Position x" }))
    fireEvent.click(screen.getByRole("button", { name: "Reset Scale" }))
    fireEvent.click(screen.getByRole("button", { name: "Reset Position y" }))
    fireEvent.click(screen.getByRole("button", { name: "Reset Rotation" }))

    expect(dispatch).toHaveBeenNthCalledWith(1, {
      action: "translate",
      amt: Dist.fromDeflated(-4, 0),
    })
    expect(dispatch).toHaveBeenNthCalledWith(2, {
      action: "scale",
      amtx: -20,
      amty: -8,
      center: expect.any(Point),
    })
    expect(dispatch).toHaveBeenNthCalledWith(3, {
      action: "translate",
      amt: Dist.fromDeflated(0, 6),
    })
    expect(dispatch).toHaveBeenNthCalledWith(4, {
      action: "rotate",
      angle: 0,
      center: expect.any(Point),
    })
  })
})
