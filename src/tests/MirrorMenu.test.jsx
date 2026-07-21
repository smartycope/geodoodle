import { afterEach, describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { StateContext } from "../Contexts"
import MirrorMenu from "../menus/MirrorMenu"
import { MIRROR_AXIS, MIRROR_TYPE } from "../globals"
import { getState } from "./testUtils"

const renderMirrorMenu = (stateOverrides) => {
  const anchor = document.createElement("button")
  anchor.id = "mirror-tool-button"
  document.body.appendChild(anchor)

  const state = getState()
  return render(
    <StateContext.Provider
      value={{
        state: { ...state, ...stateOverrides, openMenus: { ...state.openMenus, mirror: true } },
        dispatch: vi.fn(),
      }}
    >
      <MirrorMenu />
    </StateContext.Provider>,
  )
}

afterEach(() => document.querySelector("#mirror-tool-button")?.remove())

describe("Mirror Menu origin control", () => {
  test("shows the Add button for Page mirroring on desktop", () => {
    renderMirrorMenu({ mobile: false, mirrorType: MIRROR_TYPE.PAGE, mirrorAxis: MIRROR_AXIS.Y })

    expect(screen.getByRole("button", { name: "Add" })).not.toBeNull()
    expect(screen.queryByRole("button", { name: "Press o to Add" })).toBeNull()
    const originControls = document.querySelector("#mirror-origin-input")
    expect(Number.parseFloat(getComputedStyle(originControls.parentElement).gap)).toBeGreaterThan(0)
  })

  test("shows the keyboard instruction for Cursor mirroring on desktop", () => {
    renderMirrorMenu({ mobile: false, mirrorType: MIRROR_TYPE.CURSOR, mirrorAxis: MIRROR_AXIS.Y })

    expect(screen.getByRole("button", { name: "Press o to Add" })).not.toBeNull()
    expect(screen.queryByRole("button", { name: "Add" })).toBeNull()
  })
})
