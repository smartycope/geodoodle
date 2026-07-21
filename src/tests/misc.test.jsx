import { test, expect, describe, beforeEach } from "vitest"
import { getState } from "./testUtils"
import defaultOptions, { defaultKeybindings, keybindable, preservable, reversible, saveable } from "../options"
import * as actions from "../actions"
import { reversibleActions, saveSettingActions } from "../options"
import { loadPreservedState, validateStorage } from "../utils/files"
import { getSelected } from "../utils/lines"
import { eventMatchesKeycode, normalizeShortcut, shortcutFromKeyboardEvent } from "../utils/shortcuts"
import { getGestureScaleDelta } from "../events"
import { extraButtons } from "../globals"
import reducer from "../reducer"
import Dist from "../helper/Dist"
import generateTheme, { themeDefaults } from "../styling/theme"

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

test("selection canvas button preference persists for refresh", () => {
  const state = getState()

  reducer(state, { action: "set_manual_and_save_settings", disableSelectionCanvasButtons: true })

  expect(loadPreservedState().disableSelectionCanvasButtons).toBe(true)
})

test("fancy glow preference persists for refresh", () => {
  const state = getState()

  reducer(state, { action: "set_manual_and_save_settings", useFancyGlow: false })

  expect(loadPreservedState().useFancyGlow).toBe(false)
})

test("selection removal preferences persist for refresh", () => {
  const state = getState()

  reducer(state, {
    action: "set_manual_and_save_settings",
    removeSelectionAfterDelete: true,
    removeSelectionAfterCopy: true,
  })

  expect(loadPreservedState()).toMatchObject({
    removeSelectionAfterDelete: true,
    removeSelectionAfterCopy: true,
  })
})

test("cursor edge looping preference persists for refresh", () => {
  const state = getState()

  reducer(state, { action: "set_manual_and_save_settings", loopCursorAtEdges: true })

  expect(loadPreservedState().loopCursorAtEdges).toBe(true)
})

test("canvas rotation and its enabled setting persist for refresh", () => {
  const rotatedState = reducer(getState(), { action: "rotate", amt: 45 })

  expect(loadPreservedState().rotate).toBe(45)

  reducer(rotatedState, { action: "set_canvas_rotation_allowed", allowed: false })

  expect(loadPreservedState().allowCanvasRotation).toBe(false)
  expect(loadPreservedState().rotate).toBe(0)
})

test("home scale preference persists and controls the Home action", () => {
  const state = reducer(getState(), {
    action: "set_manual_and_save_settings",
    defaultScalex: 14,
    defaultScaley: 14,
  })

  expect(loadPreservedState().defaultScalex).toBe(14)
  expect(loadPreservedState().defaultScaley).toBe(14)
  expect(actions.go_home(state)).toMatchObject({ scalex: 14, scaley: 14 })
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
  expect(defaultKeybindings.e).toEqual({ action: "pick_up_line_end" })
})

test("ctrl+a is bound to selecting all lines", () => {
  expect(defaultKeybindings["ctrl+a"]).toEqual({ action: "select_all" })
})

test("number keys select the five zero-indexed color profiles", () => {
  for (let key = 1; key <= defaultOptions.commonColorAmt; key++)
    expect(defaultKeybindings[key]).toEqual({ action: "set_color_profile_index", index: key - 1 })
})

test("every default keyboard action is available to the shortcut editor", () => {
  const actionIsBindable = (action) =>
    keybindable.some((entry) => {
      const keys = new Set([...Object.keys(action), ...Object.keys(entry.action)])
      return [...keys].every((key) => action[key] === entry.action[key])
    })

  for (const action of Object.values(defaultKeybindings)) expect(actionIsBindable(action)).toBe(true)
  expect(keybindable.flatMap((entry) => entry.default).sort()).toEqual(Object.keys(defaultKeybindings).sort())
})

test("keyboard shortcuts are copied into state and persist when customized", () => {
  const state = getState()
  expect(state.keybindings).toEqual(defaultKeybindings)
  expect(state.keybindings).not.toBe(defaultKeybindings)

  reducer(state, {
    action: "set_manual_and_save_settings",
    keybindings: { q: { action: "go_home" } },
  })

  expect(loadPreservedState().keybindings).toEqual({ q: { action: "go_home" } })
})

test("clipboard scrolling rotates by default", () => {
  expect(getState().rotateClipboardOnScroll).toBe(true)
})

test("shortcut text and recorded key combinations use the same canonical format", () => {
  expect(normalizeShortcut("Command + Shift + K")).toBe("ctrl+shift+k")
  expect(shortcutFromKeyboardEvent({ key: "k", metaKey: true, ctrlKey: false, altKey: false, shiftKey: true })).toBe(
    "ctrl+shift+k",
  )
  expect(
    eventMatchesKeycode({ key: " ", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false }, "space"),
  ).toBe(true)
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

test("canvas presentation defaults live on the generated theme", () => {
  const state = getState()
  const theme = generateTheme(state.paperColor, "light", "light")
  const darkPaperTheme = generateTheme("#000000", "dark", "dark")

  expect(state.paperColor).toBe(themeDefaults.paperColor)
  expect(theme.geodoodle).toEqual(themeDefaults)
  expect(theme.palette.primary.mirror).toBe(themeDefaults.mirrorColor)
  expect(theme.palette.primary.glow).toBe(themeDefaults.glowColor.light)
  expect(darkPaperTheme.palette.primary.glow).toBe(themeDefaults.glowColor.dark)
})

test("selection helpers tolerate state without a lines collection", () => {
  expect(getSelected({ ...getState(), lines: undefined })).toEqual([])
})
