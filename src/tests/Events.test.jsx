import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { onTouchEnd, onTouchMove, onTouchStart } from "../events"
import reducer from "../reducer"
import { getState } from "./testUtils"

const touch = (pageX, pageY) => ({ pageX, pageY })

const touchEvent = (touches, changedTouches = touches) => ({
  touches,
  changedTouches,
  preventDefault: vi.fn(),
})

const actionName = (action) => (typeof action === "string" ? action : action.action)

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

  test("a two-finger gesture translates and scales without drawing", () => {
    const firstTouches = [touch(100, 100), touch(200, 100)]
    const movedTouches = [touch(100, 100), touch(225, 100)]

    onTouchStart(state, dispatch, touchEvent(firstTouches))
    onTouchMove(state, dispatch, touchEvent(firstTouches))
    onTouchMove(state, dispatch, touchEvent(movedTouches))
    onTouchEnd(state, dispatch, touchEvent([], movedTouches))

    const scaleAction = dispatched.find((action) => actionName(action) === "scale")
    expect(dispatched.map(actionName)).toContain("translate")
    expect(scaleAction.amtx).toBeCloseTo(5)
    expect(scaleAction.amty).toBeCloseTo(5)
    expect(dispatched.map(actionName)).not.toContain("add_line")
    expect(state.lines).toHaveLength(0)
  })
})
