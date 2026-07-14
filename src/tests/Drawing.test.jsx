import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { Clipboard, SelectionOptionButtons } from "../drawing"
import { StateContext } from "../Contexts"
import Line from "../helper/Line"
import Point from "../helper/Point"
import { MIRROR_AXIS, MIRROR_TYPE } from "../globals"
import { getState } from "./testUtils"

describe("Clipboard preview", () => {
  test("renders mirrored clipboard lines at the same absolute positions used by paste", () => {
    const state = getState()
    const cursorPos = new Point(10, 10)
    const clipboardLine = new Line(state, new Point(-1, 0), new Point(1, 0))
    const previewState = {
      ...state,
      cursorPos,
      clipboard: [clipboardLine],
      mirrorType: MIRROR_TYPE.CURSOR,
      mirrorAxis: MIRROR_AXIS.Y,
    }

    const { container } = render(
      <StateContext.Provider value={{ state: previewState }}>
        <svg>
          <Clipboard />
        </svg>
      </StateContext.Provider>,
    )

    const preview = container.querySelector("#clipboard")
    const lines = preview.querySelectorAll("line")

    expect(preview.getAttribute("transform")).not.toContain(`${cursorPos.asSvg(state).x}`)
    expect(lines).toHaveLength(2)
    expect([...lines].map((line) => Number(line.getAttribute("x1"))).sort((a, b) => a - b)).toEqual([9, 11])
    expect([...lines].map((line) => Number(line.getAttribute("x2"))).sort((a, b) => a - b)).toEqual([9, 11])
  })
})

describe("Selection option buttons", () => {
  const stateWithBounds = (mobile) => {
    const state = getState()
    return {
      ...state,
      mobile,
      bounds: [Point.fromViewport(state, 100, 100), Point.fromViewport(state, 200, 200)],
    }
  }

  test.each([false, true])("renders all options with completed bounds when mobile is %s", (mobile) => {
    const state = stateWithBounds(mobile)

    const { container } = render(
      <StateContext.Provider value={{ state }}>
        <svg>
          <SelectionOptionButtons />
        </svg>
      </StateContext.Provider>,
    )

    expect(container.querySelector("#selection-option-buttons")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Copy selection" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "Cut selection" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "Delete selected lines" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "Delete unselected lines" })).not.toBeNull()
    expect(screen.getByRole("button", { name: "Clear bounds" })).not.toBeNull()
  })

  test("ignores selector-only selections and hides while a clipboard is active", () => {
    const state = getState()
    const selectorState = {
      ...state,
      bounds: [],
      genericSelectors: [new Point(1, 1)],
      specificSelectors: [new Point(2, 2), new Point(3, 3)],
    }
    const { container, rerender } = render(
      <StateContext.Provider value={{ state: selectorState }}>
        <svg>
          <SelectionOptionButtons />
        </svg>
      </StateContext.Provider>,
    )

    expect(container.querySelector("#selection-option-buttons")).toBeNull()

    rerender(
      <StateContext.Provider value={{ state: { ...stateWithBounds(false), clipboard: [{}] } }}>
        <svg>
          <SelectionOptionButtons />
        </svg>
      </StateContext.Provider>,
    )

    expect(container.querySelector("#selection-option-buttons")).toBeNull()
  })
})
