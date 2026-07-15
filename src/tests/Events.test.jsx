import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import {
  getGestureRotationDelta,
  onKeyDown,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onScroll,
  onTouchEnd,
  onTouchMove,
  onTouchStart,
} from "../events"
import reducer from "../reducer"
import Line from "../helper/Line"
import Point from "../helper/Point"
import Poly from "../helper/Poly"
import { getClipboardButtonsPos, getSelectionButtonsPos } from "../canvasButtonUtils"
import { getState } from "./testUtils"
import { viewportWidth } from "../globals"
import { themeDefaults } from "../styling/theme"

const touch = (pageX, pageY) => ({ pageX, pageY })

const touchEvent = (touches, changedTouches = touches) => ({
  touches,
  changedTouches,
  preventDefault: vi.fn(),
})

const actionName = (action) => (typeof action === "string" ? action : action.action)

describe("keyboard interactions", () => {
  const keyEvent = (key) => ({ key, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false })

  test("uses the editable state keybindings instead of the defaults", () => {
    const dispatch = vi.fn()
    const state = { ...getState(), keybindings: { q: { action: "go_home" } } }

    onKeyDown(state, dispatch, keyEvent("q"))
    onKeyDown(state, dispatch, keyEvent("h"))

    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({ action: "go_home" })
  })
})

describe("wheel interactions", () => {
  test("ctrl+shift+scroll rotates instead of translating or scaling", () => {
    const state = getState()
    const dispatch = vi.fn()
    const event = {
      ctrlKey: true,
      metaKey: false,
      shiftKey: true,
      deltaX: 0,
      deltaY: 80,
      preventDefault: vi.fn(),
    }

    onScroll(state, dispatch, event)

    expect(dispatch).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenCalledWith({
      action: "rotate",
      amt: (event.deltaY / 8) * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
    })
    expect(event.preventDefault).toHaveBeenCalled()
  })
})

describe("touch interactions", () => {
  let state
  let dispatched
  let dispatch

  beforeEach(() => {
    vi.useFakeTimers()
    state = { ...getState(), mobile: true }
    dispatched = []
    dispatch = (action) => {
      dispatched.push(action)
      state = reducer(state, action)
    }
  })

  afterEach(() => {
    // Ensure the module-level touch tracking is clean even if a test exits before its normal release.
    onTouchEnd(state, dispatch, touchEvent([]))
    onTouchEnd(state, dispatch, touchEvent([]))
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  test("a single tap moves the cursor without drawing or selecting", () => {
    const start = touch(100, 100)

    onTouchStart(state, dispatch, touchEvent([start]))
    onTouchEnd(state, dispatch, touchEvent([], [start]))

    expect(state.lines).toHaveLength(0)
    expect(state.bounds).toHaveLength(0)
    expect(state.genericSelectors).toHaveLength(0)
  })

  test("double tapping a mirror origin removes it", () => {
    const tap = touch(100, 100)
    const origin = Point.fromViewport(state, tap.pageX, tap.pageY).align(state)
    state = {
      ...state,
      mirrorOrigins: [{ origin, axis: 1, rot: 0 }],
    }

    onTouchStart(state, dispatch, touchEvent([tap]))
    onTouchEnd(state, dispatch, touchEvent([], [tap]))
    onTouchStart(state, dispatch, touchEvent([tap]))

    expect(dispatched.map(actionName)).toContain("delete_at_cursor")
    expect(state.mirrorOrigins).toHaveLength(0)

    onTouchEnd(state, dispatch, touchEvent([], [tap]))
  })

  test("a normal one-finger drag still draws a line", () => {
    const start = touch(100, 100)
    const middle = touch(140, 100)
    const end = touch(180, 100)

    onTouchStart(state, dispatch, touchEvent([start]))
    onTouchMove(state, dispatch, touchEvent([middle]))
    onTouchMove(state, dispatch, touchEvent([end]))
    onTouchEnd(state, dispatch, touchEvent([], [end]))

    expect(state.lines).toHaveLength(1)
    expect(state.bounds).toHaveLength(0)
  })

  test("holding and dragging creates two bounds without starting a line", () => {
    const start = touch(100, 100)
    const middle = touch(140, 100)
    const end = touch(180, 100)

    onTouchStart(state, dispatch, touchEvent([start]))
    vi.advanceTimersByTime(state.holdTapTimeMS)
    onTouchMove(state, dispatch, touchEvent([middle]))
    onTouchMove(state, dispatch, touchEvent([end]))

    expect(dispatched.map(actionName)).toContain("convert_last_generic_selector_to_bound")
    expect(dispatched.map(actionName)).not.toContain("add_line")
    expect(state.curLinePos).toBeNull()
    expect(state.lines).toHaveLength(0)

    onTouchEnd(state, dispatch, touchEvent([], [end]))

    expect(state.genericSelectors).toHaveLength(0)
    expect(state.bounds).toHaveLength(2)
  })

  test("holding without dragging keeps a generic selector", () => {
    const start = touch(100, 100)

    onTouchStart(state, dispatch, touchEvent([start]))
    vi.advanceTimersByTime(state.holdTapTimeMS)
    onTouchEnd(state, dispatch, touchEvent([], [start]))

    expect(state.genericSelectors).toHaveLength(1)
    expect(state.bounds).toHaveLength(0)
    expect(state.lines).toHaveLength(0)
  })

  test("releasing a fill drag inside a polygon clears the preview without filling it", () => {
    const poly = Poly.fromPoints([
      new Point(4, 4),
      new Point(6, 4),
      new Point(6, 6),
      new Point(4, 6),
    ])
    state = {
      ...state,
      fillMode: true,
      tempPolys: [poly],
      curPolys: [],
    }
    const outside = touch(state.scalex, state.scaley)
    const inside = touch(5 * state.scalex, 5 * state.scaley)

    onTouchStart(state, dispatch, touchEvent([outside]))
    onTouchMove(state, dispatch, touchEvent([inside]))

    expect(state.curPolys).toHaveLength(1)
    expect(state.filledPolys).toHaveLength(0)

    onTouchEnd(state, dispatch, touchEvent([], [inside]))

    expect(state.curPolys).toHaveLength(0)
    expect(state.filledPolys).toHaveLength(0)
  })

  test("tapping without dragging still permanently fills a polygon", () => {
    const poly = Poly.fromPoints([
      new Point(4, 4),
      new Point(6, 4),
      new Point(6, 6),
      new Point(4, 6),
    ])
    state = {
      ...state,
      fillMode: true,
      tempPolys: [poly],
      curPolys: [],
    }
    const tapInside = touch(5 * state.scalex, 5 * state.scaley)

    onTouchStart(state, dispatch, touchEvent([tapInside]))
    onTouchEnd(state, dispatch, touchEvent([], [tapInside]))

    expect(state.filledPolys).toHaveLength(1)
  })

  test("dragging from inside a polygon does not commit the initial fill", () => {
    const poly = Poly.fromPoints([
      new Point(4, 4),
      new Point(8, 4),
      new Point(8, 8),
      new Point(4, 8),
    ])
    state = {
      ...state,
      fillMode: true,
      tempPolys: [poly],
      curPolys: [],
    }
    const startInside = touch(5 * state.scalex, 5 * state.scaley)
    const endInside = touch(7 * state.scalex, 5 * state.scaley)

    onTouchStart(state, dispatch, touchEvent([startInside]))
    onTouchMove(state, dispatch, touchEvent([endInside]))
    onTouchEnd(state, dispatch, touchEvent([], [endInside]))

    expect(state.curPolys).toHaveLength(0)
    expect(state.filledPolys).toHaveLength(0)
  })

  test("a two-finger gesture translates and scales without drawing", () => {
    const firstTouches = [touch(100, 100), touch(200, 100)]
    const movedTouches = [touch(100, 100), touch(225, 100)]

    onTouchStart(state, dispatch, touchEvent(firstTouches))
    onTouchMove(state, dispatch, touchEvent(firstTouches))
    onTouchMove(state, dispatch, touchEvent(movedTouches))
    onTouchEnd(state, dispatch, touchEvent([], movedTouches))

    const gestureAction = dispatched.find((action) => actionName(action) === "gesture_transform")
    expect(gestureAction.amtx).toBeCloseTo(5)
    expect(gestureAction.amty).toBeCloseTo(5)
    expect(state.scalex).toBeCloseTo(25)
    expect(state.scaley).toBeCloseTo(25)
    expect(dispatched.map(actionName)).not.toContain("add_line")
    expect(state.lines).toHaveLength(0)
  })

  test("a two-finger twist rotates around the gesture center", () => {
    const firstTouches = [touch(100, 150), touch(200, 150)]
    const movedTouches = [touch(150, 100), touch(150, 200)]
    const center = new Point(7.5, 7.5)
    const before = center.asViewport(state)

    onTouchStart(state, dispatch, touchEvent(firstTouches))
    onTouchMove(state, dispatch, touchEvent(firstTouches))
    onTouchMove(state, dispatch, touchEvent(movedTouches))

    expect(getGestureRotationDelta(firstTouches, movedTouches)).toBeCloseTo(90)
    expect(state.rotate).toBeCloseTo(90)
    expect(center.asViewport(state).x).toBeCloseTo(before.x)
    expect(center.asViewport(state).y).toBeCloseTo(before.y)

    onTouchEnd(state, dispatch, touchEvent([], movedTouches))
  })

  test.each([
    [0, "increment_clipboard_rotation"],
    [1, "increment_clipboard_mirror_axis"],
    [2, "paste"],
    [3, "cancel_clipboard"],
  ])("clipboard transform button %i consumes its touch movement", (buttonIndex, expectedAction) => {
    const originalCursor = Point.fromViewport(state, 300, 300).align(state)
    state = {
      ...state,
      disableSelectionCanvasButtons: true,
      cursorPos: originalCursor,
      bounds: [Point.fromViewport(state, 260, 280), Point.fromViewport(state, 340, 320)],
      clipboard: [new Line(state, new Point(-1, 0), new Point(1, 0))],
    }
    const { x: buttonLeft, y: buttonTop } = getClipboardButtonsPos(state).asViewport(state)
    const buttonTouch = touch(
      buttonLeft + buttonIndex * (themeDefaults.canvasButtons.width + themeDefaults.canvasButtons.gap) + 1,
      buttonTop + 1,
    )
    const movedTouch = touch(buttonTouch.pageX + 30, buttonTouch.pageY + 30)

    onTouchStart(state, dispatch, touchEvent([buttonTouch]))
    onTouchMove(state, dispatch, touchEvent([movedTouch]))

    expect(dispatched.map(actionName)).toContain(expectedAction)
    expect(state.cursorPos.eq(originalCursor)).toBe(true)
    expect(dispatched.map(actionName)).not.toContain("cursor_moved")

    onTouchEnd(state, dispatch, touchEvent([], [movedTouch]))

    const ordinaryTouch = touch(500, 500)
    onTouchStart(state, dispatch, touchEvent([ordinaryTouch]))

    expect(state.cursorPos.eq(originalCursor)).toBe(false)

    onTouchEnd(state, dispatch, touchEvent([], [ordinaryTouch]))
  })

  test.each([
    [0, "copy"],
    [1, "cut"],
    [2, "delete_selected"],
    [3, "delete_unselected"],
    [4, "clear_bounds"],
  ])("selection option button %i consumes its touch movement", (buttonIndex, expectedAction) => {
    const originalCursor = Point.fromViewport(state, 300, 300).align(state)
    state = {
      ...state,
      cursorPos: originalCursor,
      bounds: [Point.fromViewport(state, 260, 280), Point.fromViewport(state, 340, 320)],
    }
    const { x: buttonLeft, y: buttonTop } = getSelectionButtonsPos(state).asViewport(state)
    const buttonTouch = touch(
      buttonLeft + buttonIndex * (themeDefaults.canvasButtons.width + themeDefaults.canvasButtons.gap) + 1,
      buttonTop + 1,
    )
    const movedTouch = touch(buttonTouch.pageX + 30, buttonTouch.pageY + 30)

    onTouchStart(state, dispatch, touchEvent([buttonTouch]))
    onTouchMove(state, dispatch, touchEvent([movedTouch]))

    expect(dispatched.map(actionName)).toContain(expectedAction)
    expect(dispatched.map(actionName)).not.toContain("cursor_moved")
    expect(state.cursorPos.eq(originalCursor)).toBe(true)

    onTouchEnd(state, dispatch, touchEvent([], [movedTouch]))
  })

  test("selection option buttons handle desktop mouse presses without moving the cursor", () => {
    const originalCursor = Point.fromViewport(state, 300, 300).align(state)
    state = {
      ...state,
      mobile: false,
      cursorPos: originalCursor,
      bounds: [Point.fromViewport(state, 260, 280), Point.fromViewport(state, 340, 320)],
    }
    const { x: buttonLeft, y: buttonTop } = getSelectionButtonsPos(state).asViewport(state)
    const event = { clientX: buttonLeft + 1, clientY: buttonTop + 1, buttons: 0, button: 0 }

    onMouseMove(state, dispatch, event)
    onMouseDown(state, dispatch, event)
    onMouseUp(state, dispatch, event)

    expect(dispatched.map(actionName)).toContain("copy")
    expect(dispatched.map(actionName)).not.toContain("cursor_moved")
    expect(state.cursorPos.eq(originalCursor)).toBe(true)
  })

  test("disabled selection option buttons do not consume pointer events", () => {
    state = {
      ...state,
      mobile: false,
      disableSelectionCanvasButtons: true,
      bounds: [Point.fromViewport(state, 260, 280), Point.fromViewport(state, 340, 320)],
    }
    const { x: buttonLeft, y: buttonTop } = getSelectionButtonsPos(state).asViewport(state)
    const event = { clientX: buttonLeft + 1, clientY: buttonTop + 1, buttons: 0, button: 0 }

    onMouseMove(state, dispatch, event)
    onMouseDown(state, dispatch, event)
    onMouseUp(state, dispatch, event)

    expect(dispatched.map(actionName)).toContain("cursor_moved")
    expect(dispatched.map(actionName)).toContain("add_line")
    expect(dispatched.map(actionName)).not.toContain("copy")
  })

  test("mouse movement loops the cursor at a horizontal viewport edge when enabled", () => {
    state = { ...state, mobile: false, loopCursorAtEdges: true }
    const expectedRightEdge = Point.fromViewport(state, viewportWidth() - 1, 100).floor()

    onMouseMove(state, dispatch, { clientX: 0, clientY: 100, buttons: 0 })

    expect(state.cursorPos._x).toBe(expectedRightEdge._x)
  })
})
