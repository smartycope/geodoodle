import { viewportWidth, viewportHeight } from "./globals"

// TODO: Options/defaultOptions needs a refactor
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
  useHSVColorPicker: false,
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
  disableSelectionCanvasButtons: false,
  loopCursorAtEdges: false,
}
export default defaultOptions

const bindable = (id, label, defaultBindings = [], action = id) => ({
  id,
  label,
  default: Array.isArray(defaultBindings) ? defaultBindings : [defaultBindings],
  action: typeof action === "string" ? { action } : action,
})

// Actions exposed by the keyboard-shortcut editor. Entries use stable IDs
// because several reducer actions need different parameters or menu targets.
// Defaults use lower-case JS key names. Ctrl means Control or Command.
export const keybindable = [
  bindable("left", "Move cursor left", ["arrowleft", "j", "a"]),
  bindable("right", "Move cursor right", ["arrowright", ";", "d"]),
  bindable("up", "Move cursor up", ["arrowup", "k", "w"]),
  bindable("down", "Move cursor down", ["arrowdown", "l", "s"]),
  bindable("increase_scale", "Increase scale", "ctrl+arrowup"),
  bindable("decrease_scale", "Decrease scale", "ctrl+arrowdown"),
  bindable("delete_at_cursor", "Delete under cursor", "backspace"),
  bindable("delete_selected_or_cursor", "Delete selection or under cursor", "delete", {
    action: "delete_at_cursor",
    allowDeleteSelected: true,
  }),
  bindable("add_line", "Start or finish line", "space"),
  bindable("continue_line", "Continue line", "c"),
  bindable("pick_up_line_end", "Move line endpoint", "e"),
  bindable("add_bound", "Add area bound", "b"),
  bindable("add_generic_selector", "Add generic selector", "n"),
  bindable("add_specific_selector", "Add specific selector", "shift+n"),
  bindable("clear_bounds", "Clear area bounds", "shift+b"),
  bindable("nevermind", "Cancel current operation", "escape"),
  bindable("toggle_partials", "Toggle partial selection", "p"),
  bindable("go_home", "Reset position and scale", ["home", "h"]),
  bindable("increment_clipboard_rotation", "Rotate clipboard", "x"),
  bindable("increment_clipboard_mirror_axis", "Mirror clipboard", "z"),
  bindable("add_mirror_origin", "Add mirror origin", "o"),
  bindable("copy", "Copy selection", "ctrl+c"),
  bindable("paste", "Paste clipboard", "ctrl+v"),
  bindable("cut", "Cut selection", "ctrl+x"),
  bindable("undo", "Undo", "ctrl+z"),
  bindable("redo", "Redo", ["ctrl+y", "ctrl+shift+z"]),
  bindable("toggle_fill_mode", "Toggle fill mode", "f"),
  bindable("debug", "Log debug information", "`"),
  bindable("toggle_debugging", "Toggle debug mode", "shift+`"),
  // 1-5 color keyboard shortcuts
  ...Array.from({ length: defaultOptions.commonColorAmt }, (_, index) =>
    bindable(`color_profile_${index + 1}`, `Select color profile ${index + 1}`, `${index + 1}`, {
      action: "set_color_profile_index",
      index,
    }),
  ),
  // Menu toggles
  ...[
    ["main", "Toolbar"],
    ["extra", "Extra menu"],
    ["color", "Color menu"],
    ["mirror", "Mirror menu", "m"],
    ["select", "Selection menu"],
    ["clipboard", "Clipboard menu"],
    ["delete", "Delete menu"],
    ["navigation", "Navigation menu"],
    ["repeat", "Repeat menu", "r"],
    ["file", "Files page"],
    ["settings", "Settings page", "ctrl+s"],
    ["help", "Help page"],
  ].map(([menu, label, defaults = []]) =>
    bindable(`toggle_menu_${menu}`, `Toggle ${label}`, defaults, { action: "menu", toggle: menu }),
  ),
]

// Kept as an object for consumers that need to look up actions by shortcut.
// If a shortcut is listed more than once above, the last action wins.
export const defaultKeybindings = Object.fromEntries(
  keybindable.flatMap(({ default: defaults, action }) =>
    defaults.map((shortcut) => [shortcut, { ...action }]),
  ),
)

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
  "set_manual_and_save_settings",
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
  "defaultScalex",
  "defaultScaley",
  "invertedScroll",
  "scrollSensitivity",
  "enableGestureScale",
  "debug",
  "paperColor",
  "doubleTapTimeMS",
  "filledPolys",
  "mirrorOrigins",
  "allowSnapToIntersections",
  "useHSVColorPicker",
  "disableSelectionCanvasButtons",
  "keybindings",
  "loopCursorAtEdges",
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
