import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { StateContext } from "../Contexts"
import MiniMenu from "../Menus/MiniMenu"
import { getState } from "./testUtils"

describe("MiniMenu", () => {
  test("finds a toolbar anchor created in the same render", async () => {
    const state = getState()

    render(
      <StateContext.Provider
        value={{ state: { ...state, openMenus: { ...state.openMenus, color: true } }, dispatch: vi.fn() }}
      >
        <button id="color-tool-button">Color</button>
        <MiniMenu menu="color">Restored color menu</MiniMenu>
      </StateContext.Provider>,
    )

    expect(await screen.findByText("Restored color menu")).not.toBeNull()
  })
})
