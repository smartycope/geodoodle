import { test, expect, describe, beforeEach } from "vitest"
import { getState } from "./testUtils"
import defaultOptions, { keybindings, preservable, reversible, saveable } from "../options"
import * as actions from "../actions"
import { reversibleActions, saveSettingActions } from "../options"
import { loadPreservedState, validateStorage } from "../fileUtils"
import { eventMatchesKeycode } from "../utils"
import { getGestureScaleDelta } from "../events"
import { extraButtons } from "../globals"
import reducer from "../reducer"
import Dist from "../helper/Dist"
import generateTheme from "../styling/theme"

// In between each tests, reset the localStorage
beforeEach(() => {
  localStorage.clear()
  // Then readd whatever we need
  validateStorage()
})

describe("Stuff in options.jsx is valid", () => {
  // These are allowed to not be in the state
  // test('keys in default options are in state', () => {
  //     const state = getState();
  //     const stateKeys = Object.keys(state);
  //     for (const key of Object.keys(defaultOptions)) {
  //         const inState = stateKeys.includes(key)
  //         if (!inState) {
  //             console.log('defaultOption key not in state: ' + key);
  //         }
  //         expect(inState).toBe(true);
  //     }
  // });
  test("all reversibleActions are valid", () => {
    const actionKeys = Object.keys(actions)
    for (const action of reversibleActions) {
      const inState = actionKeys.includes(action)
      if (!inState) console.log("reversibleAction not in actions: " + action)

      expect(inState).toBe(true)
    }
  })
  test("all saveSettingActions are valid", () => {
    const actionKeys = Object.keys(actions)
    for (const action of saveSettingActions) {
      const inState = actionKeys.includes(action)
      if (!inState) console.log("saveSettingAction not in actions: " + action)

      expect(inState).toBe(true)
    }
  })
  test("all reversibles are valid", () => {
    const stateKeys = Object.keys(getState())
    for (const key of reversible) {
      const inState = stateKeys.includes(key)
      if (!inState) console.log("reversible key not in state: " + key)

      expect(inState).toBe(true)
    }
  })
  test("all preservables are valid", () => {
    const stateKeys = Object.keys(getState())
    for (const key of preservable) {
      const inState = stateKeys.includes(key)
      if (!inState) console.log("preservable key not in state: " + key)

      expect(inState).toBe(true)
    }
  })
  test("all saveables are valid", () => {
    const stateKeys = Object.keys(getState())
    for (const key of saveable) {
      const inState = stateKeys.includes(key)
      if (!inState) console.log("saveable key not in state: " + key)

      expect(inState).toBe(true)
    }
  })
})

test("translation actions persist their updated value for refresh", () => {
  const state = getState()
  const amount = new Dist(4, -2)

  reducer(state, { action: "translate", amt: amount })

  expect(loadPreservedState().translation.eq(state.translation.add(amount))).toBe(true)
})

test("HSV color picker preference persists for refresh", () => {
  const state = getState()

  reducer(state, { action: "set_manual_and_save_settings", useHSVColorPicker: true })

  expect(loadPreservedState().useHSVColorPicker).toBe(true)
})

test("pinch scaling tracks the proportional distance between fingers", () => {
  expect(getGestureScaleDelta(4, 100, 125, 1)).toBeCloseTo(1)
  expect(getGestureScaleDelta(20, 100, 125, 1)).toBeCloseTo(5)
  expect(getGestureScaleDelta(25, 125, 100, 1)).toBeCloseTo(-5)
})

describe("keybinding modifiers", () => {
  const keyEvent = (overrides = {}) => ({
    key: "c",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    ...overrides,
  })

  test("ctrl bindings accept the Control key", () => {
    expect(eventMatchesKeycode(keyEvent({ ctrlKey: true }), "ctrl+c")).toBe(true)
  })

  test("ctrl bindings also accept the Mac Command key", () => {
    expect(eventMatchesKeycode(keyEvent({ metaKey: true }), "ctrl+c")).toBe(true)
  })

  test("unmodified bindings do not match Control or Command shortcuts", () => {
    expect(eventMatchesKeycode(keyEvent({ ctrlKey: true }), "c")).toBe(false)
    expect(eventMatchesKeycode(keyEvent({ metaKey: true }), "c")).toBe(false)
  })
})

test("e is bound to picking up a line endpoint", () => {
  expect(keybindings.e).toEqual({ action: "pick_up_line_end" })
})

test("dot visibility is available as an Extra Button action", () => {
  expect(extraButtons.toggle_dots).toEqual({ action: "toggle_dots" })
})

test("menu-item hover colors are neutral and independent of the paper color", () => {
  const orangePaperTheme = generateTheme("#ffddab", "light", "light")
  const bluePaperTheme = generateTheme("#3367d1", "light", "light")

  expect(orangePaperTheme.palette.action.hover).toBeTypeOf("string")
  expect(orangePaperTheme.palette.action.hover).toBe(bluePaperTheme.palette.action.hover)
  expect(orangePaperTheme.palette.action.hover).not.toBe(orangePaperTheme.palette.primary.main)
})
