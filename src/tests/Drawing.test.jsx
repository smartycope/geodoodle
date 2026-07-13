import { render } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { Clipboard } from "../drawing"
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
