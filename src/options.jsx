import { isMobile } from "./utils/misc"
import { viewportHeight, viewportWidth } from "./globals"

// TODO: rename this to options instead of defaultOptions
const mobile = isMobile()
const defaultOptions = {
  scalex: 20,
  scaley: 20,
  stroke: "#000000",
  fill: "#ffffff",
  commonColorAmt: 5,
  strokeWidth: 0.05,
  partials: true,
  invertedScroll: true,
  rotateClipboardOnScroll: true,
  scrollSensitivity: 0.3,
  hideHexColor: true,
  useHSVColorPicker: false,
  enableGestureScale: false,
  maxMouseMoveEventsDuringHold: 30,
  doubleTapTimeMS: 500,
  holdTapTimeMS: 250,
  holdTapAction: "add_generic_selector",
  // If we remove all the bounds after cut or delete selection
  removeSelectionAfterDelete: true,
  // If we remove all the bounds after copying a selection
  removeSelectionAfterCopy: false,
  lineCap: "round",
  lineJoin: "round",
  maxUndoAmt: 20,
  maxScale: Math.min(viewportWidth(), viewportHeight()) / 2,
  minScale: 4,
  // In ms
  toastDuration: 6000,
  defaultToMemorableNames: true,
  maxMirrorOrigins: 12,
  cursor: "circle",
  allowSnapToIntersections: false,
  toolbarOpacity: 0.9,
  disableSelectionCanvasButtons: false,
  loopCursorAtEdges: false,
  reopenMenusWithToolbar: true,
  allowCanvasRotation: true,
  useFancyGlow: !mobile,
  maxFancyGlowingLines: mobile ? 30 : 128,
  maxGlowingLines: mobile ? 300 : 1000,
}
export default defaultOptions

// Toolbar order, responsive priority, and layer availability. Keep this as
// the shared source for Toolbar and ExtraMenu.
// The lower the minSlots value, the higher the priority.
export const toolbarButtons = {
  items: [
    { menu: "extra", maxSlots: 8, disableTooltip: true },
    { component: "extraButton", minSlots: 2 },
    { menu: "help", minSlots: 10 },
    { menu: "settings", minSlots: 9 },
    { menu: "file", minSlots: 6 },
    { menu: "navigation", minSlots: 7, layer: "drawing" },
    { menu: "layers", minSlots: 4 },
    { menu: "mirror", layer: "drawing" },
    { menu: "clipboard", minSlots: 8, layer: "drawing" },
    { menu: "delete", minSlots: 5, layer: "drawing" },
    { menu: "select", minSlots: 3, layer: "drawing" },
    { menu: "toggle_dots", minSlots: 4, layer: "trellis", action: "toggle_dots" },
    { menu: "reset", minSlots: 3, layer: "trellis", action: "clear_active_layer" },
    { menu: "offset", layer: "trellis" },
    { menu: "skip", layer: "trellis" },
    { menu: "flip", layer: "trellis" },
    { menu: "rotate", layer: "trellis" },
    { menu: "undo", action: "undoRedo" },
    { menu: "color", layer: "drawing" },
    { menu: "main", minSlots: 1 },
  ],
}

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
  bindable("select_all", "Select all lines", "ctrl+a"),
  bindable("nevermind", "Cancel current operation", "escape"),
  bindable("toggle_partials", "Toggle partial selection", "p"),
  bindable("go_home", "Reset position, scale, and rotation", ["home", "h"]),
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
  bindable("add_layer", "Add layer", "ctrl+n"),
  bindable("add_trellis_layer", "Create Trellis layer", "r"),
  bindable("save_local_and_toast", "Save locally", "ctrl+s"),
  bindable("save_cloud_and_toast", "Save to cloud", "ctrl+shift+s"),

  // Unbound
  bindable("toggle_dots", "Toggle dots"),
  bindable("toggle_dots_above_artwork", "Toggle dots above artwork"),
  bindable("randomize_color", "Randomize current color"),
  bindable("randomize_colors", "Randomize all colors"),
  bindable("go_to_selection", "Go to selection"),
  // TODO: increment rotation
  bindable("clear_specific_selectors", "Clear specific selectors"),
  bindable("clear_generic_selectors", "Clear generic selectors"),
  bindable("clear", "Start new pattern"),
  bindable("toggle_current_layer_visibility", "Toggle layer visibility"),
  bindable("delete_layer", "Delete current layer"),
  bindable("clear_active_layer", "Clear current layer"),
  bindable("delete_unselected", "Delete unselected lines"),
  // bindable("delete_selected", "Delete selected lines"),
  bindable("increase_stroke_width", "Increase stroke width"),
  bindable("decrease_stroke_width", "Decrease stroke width"),
  bindable("paint_selected", "Paint selected geometry"),
  bindable("fill", "Fill area"),
  bindable("clear_fill", "Clear fill"),
  bindable("clear_mirror_origins", "Clear all mirror origins"),
  bindable("copy_image", "Copy image"),

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
    ["layers", "Layers panel"],
    ["file", "Files page", "ctrl+f"],
    ["settings", "Settings page"],
    ["help", "Help page"],
    ["skip", "Skip trellis menu"],
    ["offset", "Offset trellis menu"],
    ["flip", "Flip trellis menu"],
    ["rotate", "Rotate trellis menu"],
  ].map(([menu, label, defaults = []]) =>
    bindable(`toggle_menu_${menu}`, `Toggle ${label}`, defaults, { action: "menu", toggle: menu }),
  ),
]

// Kept as an object for consumers that need to look up actions by shortcut.
// If a shortcut is listed more than once above, the last action wins.
export const defaultKeybindings = Object.fromEntries(
  keybindable.flatMap(({ default: defaults, action }) => defaults.map((shortcut) => [shortcut, { ...action }])),
)

// These are actions
// Only these can be undone, all other actions are ignored by undo/redo
export const reversibleActions = [
  "go_home",
  "clear",
  "clear_bounds",
  "select_all",
  "paste",
  "copy",
  "cut",
  "cancel_clipboard",
  "delete_selected",
  "delete_specific_line",
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
  "paint_selected",
  "add_layer",
  "add_trellis_layer",
  "delete_layer",
  "activate_layer",
  "rename_layer",
  "set_layer_visibility",
  "reorder_layers",
  "clear_active_layer",
  "update_active_layer",
]

// These are actions
// Only save the state to be preserved when these actions happen
export const saveSettingActions = [
  "translate",
  "rotate",
  "gesture_transform",
  "increase_scale",
  "decrease_scale",
  "go_home",
  "clear",
  "clear_bounds",
  "delete_selected",
  "delete_specific_line",
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
  "paint_selected",
  "randomize_colors",
  "set_manual_and_save_settings",
  "set_canvas_rotation_allowed",
  "toggle_partials",
  "fill",
  "clear_fill",
  "add_specific_selector",
  "add_generic_selector",
  "add_layer",
  "add_trellis_layer",
  "delete_layer",
  "activate_layer",
  "rename_layer",
  "set_layer_visibility",
  "reorder_layers",
  "clear_active_layer",
  "update_active_layer",
]

// These are parts of the state
// When undoing an action, only these parts of the state get undone
export const reversible = ["layers", "activeLayerId", "curLinePos", "clipboard"]

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
  "layers",
  "activeLayerId",
  "mirrorAxis",
  "mirrorRot",
  "mirrorType",
  "translation",
  "scalex",
  "scaley",
  "rotate",
  "defaultScalex",
  "defaultScaley",
  "invertedScroll",
  "rotateClipboardOnScroll",
  "scrollSensitivity",
  "enableGestureScale",
  "debug",
  "paperColor",
  "doubleTapTimeMS",
  "dotsAboveArtwork",
  "autoHideDotsOnTrellis",
  "allowSnapToIntersections",
  "useHSVColorPicker",
  "removeSelectionAfterDelete",
  "removeSelectionAfterCopy",
  "disableSelectionCanvasButtons",
  "keybindings",
  "loopCursorAtEdges",
  "reopenMenusWithToolbar",
  "allowCanvasRotation",
  "useFancyGlow",
  "holdTapAction",
  "username",
]

// These are parts of the state
// The parts of the state that get serialized to the svg file
// Think: what does the user want to share with someone else?
export const saveable = ["layers", "activeLayerId", "translation", "scalex", "scaley", "rotate"]
