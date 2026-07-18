import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { Bounds, Clipboard, ClipboardTransformButtons, GlowEffect, Lines, SelectionOptionButtons, SelectionRect } from "../drawing"
import { StateContext } from "../Contexts"
import Line from "../helper/Line"
import Point from "../helper/Point"
import { MIRROR_AXIS, MIRROR_TYPE } from "../globals"
import { getState } from "./testUtils"
import { themeDefaults } from "../styling/theme"
import defaultOptions from "../options"

describe("Selected line highlights", () => {
  const stateWithSelectedLines = (lineCount, overrides = {}) => {
    const state = getState()
    return {
      ...state,
      lines: Array.from({ length: lineCount }, (_, y) => new Line(state, new Point(0, y), new Point(10, y))),
      bounds: [new Point(-1, -1), new Point(11, lineCount)],
      ...overrides,
    }
  }

  const renderLines = (state) =>
    render(
      <StateContext.Provider value={{ state }}>
        <svg>
          <GlowEffect />
          <Lines />
        </svg>
      </StateContext.Provider>,
    )

  test("renders a thicker under-stroke when fancy glow is disabled", () => {
    const { container } = renderLines(stateWithSelectedLines(1, { useFancyGlow: false }))
    const highlight = container.querySelector("#selected-line-highlights line")
    const renderedLine = container.querySelector("#lines > line")

    expect(highlight).not.toBeNull()
    expect(highlight.getAttribute("stroke")).toBe(themeDefaults.glowColor.light)
    expect(Number(highlight.getAttribute("stroke-width"))).toBeCloseTo(
      Number(renderedLine.getAttribute("stroke-width")) + themeDefaults.glowWidth,
    )
    expect(Number(highlight.getAttribute("stroke-opacity"))).toBe(themeDefaults.glowOpacity)
    expect(container.querySelector("filter")).toBeNull()
    expect(container.querySelector("[filter]")).toBeNull()
  })

  test("uses the SVG filter through the configured fancy-glow limit", () => {
    const lineCount = defaultOptions.maxFancyGlowingLines
    const { container } = renderLines(stateWithSelectedLines(lineCount, { useFancyGlow: true }))

    const filter = container.querySelector("#glow")
    expect(filter).not.toBeNull()
    expect(filter.getAttribute("x")).toBe("-100%")
    expect(filter.getAttribute("y")).toBe("-100%")
    expect(filter.getAttribute("width")).toBe("200%")
    expect(filter.getAttribute("height")).toBe("200%")
    expect(filter.querySelector("feGaussianBlur").getAttribute("stdDeviation")).toBe(".2")
    expect(container.querySelector("#selected-line-highlights")).toBeNull()
    expect(container.querySelectorAll("#lines > line[filter='url(#glow)']")).toHaveLength(lineCount)
  })

  test("falls back to unfiltered under-strokes above the fancy-glow limit", () => {
    const lineCount = defaultOptions.maxFancyGlowingLines + 1
    const { container } = renderLines(stateWithSelectedLines(lineCount, { useFancyGlow: true }))

    expect(container.querySelectorAll("#selected-line-highlights line")).toHaveLength(lineCount)
    expect(container.querySelectorAll("#lines [filter]")).toHaveLength(0)
  })

  test("omits selection highlights above the manual safety limit", () => {
    const lineCount = defaultOptions.maxGlowingLines + 1
    const { container } = renderLines(stateWithSelectedLines(lineCount, { useFancyGlow: false }))

    expect(container.querySelector("#selected-line-highlights")).toBeNull()
    expect(container.querySelectorAll("#lines > line")).toHaveLength(lineCount)
  })

  test("uses red selection geometry and a red basic glow while deleting", () => {
    const state = stateWithSelectedLines(1, {
      bounds: [new Point(-1, -1)],
      boundDragging: true,
      cursorPos: new Point(11, 2),
      deletingSelection: true,
      useFancyGlow: false,
    })
    const { container } = render(
      <StateContext.Provider value={{ state }}>
        <svg>
          <Lines />
          <Bounds />
          <SelectionRect />
        </svg>
      </StateContext.Provider>,
    )

    expect(container.querySelector("#selected-line-highlights line").getAttribute("stroke")).toBe(
      themeDefaults.deletingSelection.glowColor,
    )
    expect(container.querySelector("#selection-rect").getAttribute("fill")).toBe(
      themeDefaults.deletingSelection.color,
    )
    expect(container.querySelector("#selection-rect").getAttribute("stroke")).toBe(
      themeDefaults.deletingSelection.borderColor,
    )
    expect(container.querySelector("#bounds rect").getAttribute("stroke")).toBe(
      themeDefaults.deletingSelection.borderColor,
    )
  })

  test("uses a red fancy glow while deleting", () => {
    const state = stateWithSelectedLines(1, {
      bounds: [new Point(-1, -1)],
      boundDragging: true,
      cursorPos: new Point(11, 2),
      deletingSelection: true,
      useFancyGlow: true,
    })
    const { container } = renderLines(state)

    expect(container.querySelector("#deleting-glow feFlood").getAttribute("flood-color")).toBe(
      themeDefaults.deletingSelection.glowColor,
    )
    expect(container.querySelectorAll("#lines > line[filter='url(#deleting-glow)']")).toHaveLength(1)
  })

  test.each([false, true])("keeps selector-only highlights blue while deleting when fancy glow is %s", (useFancyGlow) => {
    const baseState = getState()
    const areaLine = new Line(baseState, new Point(1, 1), new Point(5, 5))
    const genericLine = new Line(baseState, new Point(20, 20), new Point(30, 30))
    const specificLine = new Line(baseState, new Point(40, 40), new Point(50, 50))
    const state = {
      ...baseState,
      lines: [areaLine, genericLine, specificLine],
      bounds: [new Point(0, 0)],
      boundDragging: true,
      cursorPos: new Point(10, 10),
      deletingSelection: true,
      genericSelectors: [genericLine.a],
      specificSelectors: specificLine.points(),
      useFancyGlow,
    }
    const { container } = renderLines(state)

    if (useFancyGlow) {
      expect(container.querySelectorAll("#lines > line[filter='url(#deleting-glow)']")).toHaveLength(1)
      expect(container.querySelectorAll("#lines > line[filter='url(#glow)']")).toHaveLength(2)
    } else {
      const colors = [...container.querySelectorAll("#selected-line-highlights line")].map((line) =>
        line.getAttribute("stroke"),
      )
      expect(colors).toEqual([
        themeDefaults.deletingSelection.glowColor,
        themeDefaults.glowColor.light,
        themeDefaults.glowColor.light,
      ])
    }
  })
})

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

  test("renders clipboard lines mirrored around saved mirror origins", () => {
    const state = getState()
    const cursorPos = new Point(10, 10)
    const origin = new Point(20, 10)
    const clipboardLine = new Line(state, new Point(-1, 0), new Point(1, 0))
    const previewState = {
      ...state,
      cursorPos,
      clipboard: [clipboardLine],
      mirrorAxis: MIRROR_AXIS.NONE,
      mirrorOrigins: [{ origin, axis: MIRROR_AXIS.Y, rot: 0 }],
    }

    const { container } = render(
      <StateContext.Provider value={{ state: previewState }}>
        <svg>
          <Clipboard />
        </svg>
      </StateContext.Provider>,
    )

    const lines = container.querySelectorAll("#clipboard line")

    expect(lines).toHaveLength(3)
    expect([...lines].map((line) => Number(line.getAttribute("x1"))).sort((a, b) => a - b)).toEqual([9, 9, 31])
    expect([...lines].map((line) => Number(line.getAttribute("x2"))).sort((a, b) => a - b)).toEqual([11, 11, 29])
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
    expect(screen.getByRole("button", { name: "Toggle partials" })).not.toBeNull()
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

  test("can disable selection buttons without disabling mobile clipboard buttons", () => {
    const state = stateWithBounds(true)
    const disabledState = {
      ...state,
      disableSelectionCanvasButtons: true,
    }
    const { container, rerender } = render(
      <StateContext.Provider value={{ state: disabledState }}>
        <svg>
          <SelectionOptionButtons />
        </svg>
      </StateContext.Provider>,
    )

    expect(container.querySelector("#selection-option-buttons")).toBeNull()

    const clipboardState = {
      ...disabledState,
      cursorPos: new Point(10, 10),
      clipboard: [new Line(state, new Point(-1, 0), new Point(1, 0))],
    }
    rerender(
      <StateContext.Provider value={{ state: clipboardState }}>
        <svg>
          <ClipboardTransformButtons />
        </svg>
      </StateContext.Provider>,
    )

    expect(container.querySelector("#clipboard-transform-buttons-mobile")).not.toBeNull()
  })
})
