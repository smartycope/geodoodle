import { afterEach, describe, expect, test, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { StateContext } from "../Contexts"
import ClipboardMenu from "../menus/ClipboardMenu"
import DeleteMenu from "../menus/DeleteMenu"
import SelectMenu from "../menus/SelectMenu"
import Line from "../classes/Line"
import Point from "../classes/Point"
import { getState } from "./testUtils"

const renderMenu = (menu, Component, stateOverrides = {}) => {
  const anchor = document.createElement("button")
  anchor.id = `${menu}-tool-button`
  document.body.appendChild(anchor)

  const state = getState()
  const dispatch = vi.fn()
  const rendered = render(
    <StateContext.Provider
      value={{
        state: { ...state, ...stateOverrides, openMenus: { ...state.openMenus, [menu]: true } },
        dispatch,
      }}
    >
      <Component />
    </StateContext.Provider>,
  )
  return { ...rendered, dispatch }
}

afterEach(() => {
  for (const menu of ["select", "clipboard", "delete"]) document.querySelector(`#${menu}-tool-button`)?.remove()
})

describe("mini-menu keyboard shortcut hints", () => {
  test("uses the active customized clipboard shortcuts", () => {
    renderMenu("clipboard", ClipboardMenu, {
      keybindings: {
        "alt+q": { action: "copy" },
        "shift+v": { action: "paste" },
      },
    })

    expect(screen.getByLabelText("Keyboard shortcut: Alt+Q")).not.toBeNull()
    expect(screen.getByLabelText("Keyboard shortcut: Shift+V")).not.toBeNull()
    expect(screen.queryByText("Ctrl+C")).toBeNull()
  })

  test("shows the shortcut beside the desktop add-bound instruction", () => {
    renderMenu("select", SelectMenu, {
      mobile: false,
      bounds: [],
    })

    expect(within(screen.getByRole("menuitem", { name: /Add a bound/i })).getByText("B")).not.toBeNull()
  })

  test("shows shortcuts beside completed desktop selection controls", () => {
    renderMenu("select", SelectMenu, {
      mobile: false,
      bounds: [new Point(0, 0), new Point(10, 10)],
    })

    expect(within(screen.getByRole("menuitem", { name: /Clear Selection/ })).getByText("Shift+B")).not.toBeNull()
    expect(within(screen.getByRole("menuitem", { name: /Partials/ })).getByText("P")).not.toBeNull()
  })

  test("selects all lines from the Select menu", () => {
    const state = getState()
    const { dispatch } = renderMenu("select", SelectMenu, {
      lines: [new Line(state, new Point(0, 0), new Point(10, 10))],
    })

    const selectAll = screen.getByRole("menuitem", { name: /Select All/ })
    expect(within(selectAll).getByText("Ctrl+A")).not.toBeNull()
    fireEvent.click(selectAll)

    expect(dispatch).toHaveBeenCalledWith("select_all")
  })

  test("maps the parameterized Delete key to Delete Selected", () => {
    const state = getState()
    renderMenu("delete", DeleteMenu, {
      lines: [new Line(state, new Point(0, 0), new Point(10, 10))],
      bounds: [new Point(0, 0), new Point(10, 10)],
    })

    expect(within(screen.getByRole("menuitem", { name: /Delete Selected/ })).getByText("Delete")).not.toBeNull()
    expect(
      within(screen.getByRole("menuitem", { name: /Delete Unselected/ })).queryByLabelText(/Keyboard shortcut/),
    ).toBeNull()
  })
})
