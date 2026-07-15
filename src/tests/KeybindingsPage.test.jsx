import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { StateContext } from "../Contexts"
import KeybindingsPage from "../Menus/KeybindingsPage"
import { getState } from "./testUtils"

const renderPage = () => {
  const state = getState()
  const dispatch = vi.fn()
  render(
    <StateContext.Provider
      value={{
        state: {
          ...state,
          keybindings: { e: { action: "pick_up_line_end" } },
          openMenus: { ...state.openMenus, key: true },
        },
        dispatch,
      }}
    >
      <KeybindingsPage />
    </StateContext.Provider>,
  )
  return { state, dispatch }
}

describe("Keyboard Shortcuts page", () => {
  test("manual shortcut edits replace the old binding", () => {
    const { dispatch } = renderPage()
    const shortcut = screen.getByLabelText("Shortcut for pick_up_line_end")

    fireEvent.change(shortcut, { target: { value: "Alt + Q" } })
    fireEvent.blur(shortcut)

    expect(dispatch).toHaveBeenCalledWith({
      action: "set_manual_and_save_settings",
      keybindings: expect.objectContaining({ "alt+q": { action: "pick_up_line_end" } }),
    })
    expect(dispatch.mock.calls.at(-1)[0].keybindings.e).toBeUndefined()
  })

  test("the recorder captures Command as ctrl and applies it to the binding", () => {
    const { dispatch } = renderPage()

    fireEvent.click(screen.getByRole("button", { name: "Record shortcut for pick_up_line_end" }))
    const dialog = screen.getByRole("dialog", { name: "Record Shortcut" })
    fireEvent.keyDown(dialog, { key: "k", metaKey: true, shiftKey: true })

    expect(screen.getByLabelText("Recorded shortcut").value).toBe("ctrl+shift+k")
    fireEvent.click(screen.getByRole("button", { name: "Use Shortcut" }))

    expect(dispatch.mock.calls.at(-1)[0].keybindings["ctrl+shift+k"]).toEqual({ action: "pick_up_line_end" })
    expect(dispatch.mock.calls.at(-1)[0].keybindings.e).toBeUndefined()
  })

  test("the action dropdown reassigns a shortcut", () => {
    const { dispatch } = renderPage()

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Action" }))
    fireEvent.click(screen.getByRole("option", { name: "Toggle Mirror menu" }))

    expect(dispatch).toHaveBeenCalledWith({
      action: "set_manual_and_save_settings",
      keybindings: { e: { action: "menu", toggle: "mirror" } },
    })
  })
})
