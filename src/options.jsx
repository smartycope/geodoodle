import { viewportWidth, viewportHeight } from "./globals"

// Options/defaultOptions needs a refactor
const defaultOptions = {
  cursorColor: "black",
  scalex: 20,
  scaley: 20,
  stroke: "#000000",
  fill: "#ffffff",
  commonColorAmt: 5,
  strokeWidth: 0.05,
  // TODO: these need to be put into theme instead
  boundColor: "black",
  mirrorColor: "green",
  selectionBorderColor: "#2a56ad",
  selectionOpacity: 0.15,
  selectionColor: "#3367D1",
  glowColor: "blue",
  partials: true,
  dotOffsetx: 0,
  dotOffsety: 0,
  dotRadius: 2,
  dotColor: "black",
  invertedScroll: true,
  scrollSensitivity: 0.3,
  hideHexColor: true,
  enableGestureScale: false,
  paperColor: "#ffddab",
  maxMouseMoveEventsDuringHold: 30,
  doubleTapTimeMS: 500,
  // See note in onTouchEnd in App.jsx to see why this is / 2
  holdTapTimeMS: 1000 / 2,
  // If we remove all the bounds after cut or delete selection
  removeSelectionAfterDelete: false,
  lineCap: "round",
  lineJoin: "round",
  maxUndoAmt: 20,
  maxScale: Math.min(viewportWidth(), viewportHeight()) / 2,
  minScale: 4,
  // Color of the clipboard lines, before they're added as permanent lines
  clipColor: "grey80",
  clipboardButtonWidth: 45,
  clipboardButtonHeight: 45,
  clipboardButtonGap: 5,
  // In ms
  toastDuration: 6000,
  defaultToMemorableNames: true,
  maxMirrorOrigins: 12,
  cursor: "circle",
  allowSnapToIntersections: true,
  toolbarOpacity: 0.9,
}
export default defaultOptions

// The default keybindings
// This should be the names of the JS key strings, all lower case
// Modifiers are shift, ctrl, meta, and alt
// Order doesn't matter
// Multiple keycodes are assignable to the same action
// If a single keycode is assigned to multiple actions, the last one is used
export const keybindings = {
  arrowleft: { action: "left" },
  arrowright: { action: "right" },
  arrowup: { action: "up" },
  arrowdown: { action: "down" },
  j: { action: "left" },
  ";": { action: "right" },
  k: { action: "up" },
  l: { action: "down" },
  a: { action: "left" },
  d: { action: "right" },
  w: { action: "up" },
  s: { action: "down" },

  "ctrl+arrowup": { action: "increase_scale" },
  "ctrl+arrowdown": { action: "decrease_scale" },

  delete: { action: "delete_at_cursor", allowDeleteSelected: true },
  backspace: { action: "delete_at_cursor" },
  // 'ctrl+q': {action: "clear"},
  " ": { action: "add_line" },
  c: { action: "continue_line" },
  e: { action: "pick_up_line_end" },
  b: { action: "add_bound" },
  n: { action: "add_generic_selector" },
  "shift+n": { action: "add_specific_selector" },
  "shift+b": { action: "clear_bounds" },
  escape: { action: "nevermind" },
  p: { action: "toggle_partials" },
  home: { action: "go_home" },
  h: { action: "go_home" },
  x: { action: "increment_clipboard_rotation" },
  z: { action: "increment_clipboard_mirror_axis" },
  o: { action: "add_mirror_origin" },

  m: { action: "menu", toggle: "mirror" },
  r: { action: "menu", toggle: "repeat" },
  "ctrl+s": { action: "menu", toggle: "settings" },

  1: { action: `set_to_common_color`, index: 1 },
  2: { action: `set_to_common_color`, index: 2 },
  3: { action: `set_to_common_color`, index: 3 },
  4: { action: `set_to_common_color`, index: 4 },
  5: { action: `set_to_common_color`, index: 5 },
  6: { action: `set_to_common_color`, index: 6 },
  7: { action: `set_to_common_color`, index: 7 },
  8: { action: `set_to_common_color`, index: 8 },
  9: { action: `set_to_common_color`, index: 9 },

  "ctrl+c": { action: "copy" },
  "ctrl+v": { action: "paste" },
  "ctrl+x": { action: "cut" },
  "ctrl+z": { action: "undo" },
  "ctrl+y": { action: "redo" },
  "ctrl+shift+z": { action: "redo" },
  f: { action: "toggle_fill_mode" },

  "`": { action: "debug" },
  "shift+`": { action: "toggle_debugging" },
}

// These are actions
// Only these can be undone, all other actions are ignored by undo/redo
export const reversibleActions = [
  "go_home",
  "clear",
  "clear_bounds",
  "paste",
  "delete_selected",
  "delete_at_cursor",
  "pick_up_line_end",
  "add_line",
  "continue_line",
  "add_bound",
  "upload_file", // contested
  "load_local",
  "fill",
  "clear_fill",
  "add_mirror_origin",
  "remove_mirror_origin",
  "clear_mirror_origins",
  "add_specific_selector",
  "add_generic_selector",
]

// These are actions
// Only save the state to be preserved when these actions happen
export const saveSettingActions = [
  "translate",
  "increase_scale",
  "decrease_scale",
  "go_home",
  "clear",
  "clear_bounds",
  "delete_selected",
  "delete_at_cursor",
  "add_line",
  "continue_line",
  "add_bound",
  "undo",
  "redo",
  "paste",
  "set_stroke_width",
  "set_dash",
  "set_color",
  "randomize_colors",
  "toggle_partials",
  "apply_trellis",
  "fill",
  "clear_fill",
  "add_specific_selector",
  "add_generic_selector",
]

// These are parts of the state
// When undoing an action, only these parts of the state get undone
export const reversible = [
  "lines",
  "curLinePos",
  "bounds",
  "specificSelectors",
  "genericSelectors",
  // 'trellis', // contested
  "clipboard",
  "filledPolys",
  "mirrorOrigins",
]

// These are parts of the state
// Only preserve these parts of the state across loads (*not* when saving to a file)
// Think: what does the user want to have come up when they re-open the app the next day?
export const preservable = [
  "stroke",
  "dash",
  "side",
  "filename",
  "stroke",
  "strokeWidth",
  "dash",
  "extraButton",
  "partials",
  "lines",
  "bounds",
  "specificSelectors",
  "genericSelectors",
  "mirrorAxis",
  "mirrorRot",
  "mirrorType",
  "trellis",
  "translation",
  "scalex",
  "scaley",
  "invertedScroll",
  "scrollSensitivity",
  "enableGestureScale",
  "debug",
  "paperColor",
  "doubleTapTimeMS",
  "filledPolys",
  "mirrorOrigins",
  "allowSnapToIntersections",
]

// These are parts of the state
// The parts of the state that get serialized to the svg file
// Think: what does the user want to share with someone else?
export const saveable = [
  // This is handeled seperately
  // 'lines',
  "bounds",
  "trellis",
  "specificSelectors",
  "genericSelectors",
  "translation",
  "scalex",
  "scaley",
]
