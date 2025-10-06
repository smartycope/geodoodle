import {viewportWidth, viewportHeight} from "./globals"

const defaultOptions = {
    cursorColor: "black",
    scalex: 20,
    scaley: 20,
    stroke: "#000000",
    fill: "#ffffff",
    commonColorAmt: 5,
    strokeWidth: .05,
    boundColor: "black",
    mirrorColor: 'green',
    selectionBorderColor: '#2a56ad',
    selectionOpacity: .15,
    selectionColor: '#3367D1',
    glowColor: 'blue',
    partials: true,
    dotOffsetx: 0,
    dotOffsety: 0,
    dotRadius: 2,
    dotColor: 'black',
    eraserColor: 'red',
    eraserWidth: 2,
    invertedScroll: true,
    scrollSensitivity: .3,
    hideHexColor: false,
    enableGestureScale: false,
    paperColor: "#ffddab",
    maxMouseMoveEventsDuringHold: 30,
    doubleTapTimeMS: 500,
    // See note in onTouchEnd in App.jsx to see why this is / 2
    holdTapTimeMS: 1000 / 2,
    // If we remove all the bounds after cut or delete selection
    removeSelectionAfterDelete: false,
    lineCap: 'round',
    lineJoin: 'round',
    maxUndoAmt: 20,
    maxScale: Math.min(viewportWidth(), viewportHeight()) / 2,
    minScale: 4,
    // Color of the clipboard lines, before they're added as permanent lines
    clipColor: 'grey80',
    clipboardButtonWidth: 35,
    clipboardButtonHeight: 40,
    clipboardButtonGap: 5,
    // In ms
    toastDuration: 6000,
    beginnerMode: true,
    defaultToMemorableNames: true,
}
export default defaultOptions

// The default keybindings
// This should be the names of the JS key strings, all lower case
// Modifiers are shift, ctrl, meta, and alt
// Order doesn't matter
// Multiple keycodes are assignable to the same action
// If a single keycode is assigned to multiple actions, the last one is used
export const keybindings = {
    "arrowleft": {action: "left"},
    "arrowright": {action: "right"},
    "arrowup": {action: "up"},
    "arrowdown": {action: "down"},
    "j": {action: "left"},
    ";": {action: "right"},
    "k": {action: "up"},
    "l": {action: "down"},
    "a": {action: "left"},
    "d": {action: "right"},
    "w": {action: "up"},
    "s": {action: "down"},

    'ctrl+arrowup': {action: "increase_scale"},
    'ctrl+arrowdown': {action: "decrease_scale"},

    'delete': {action: "delete_at_cursor"},
    'backspace': {action: "delete_line"},
    // 'ctrl+q': {action: "clear"},
    ' ': {action: "add_line"},
    'c': {action: "continue_line"},
    'b': {action: "add_bound"},
    'shift+b': {action: "clear_bounds"},
    'escape': {action: "nevermind"},
    'p': {action: "toggle_partials"},
    'home': {action: 'go_home'},
    'h': {action: 'go_home'},
    'x': {action: 'increment_clipboard_rotation'},
    'z': {action: 'increment_clipboard_mirror_axis'},

    'm': {action: "menu", toggle: 'mirror'},
    'r': {action: "menu", toggle: 'repeat'},
    'ctrl+s': {action: "menu", toggle: 'settings'},

    '1': {action: `set_to_common_color`, index: 1},
    '2': {action: `set_to_common_color`, index: 2},
    '3': {action: `set_to_common_color`, index: 3},
    '4': {action: `set_to_common_color`, index: 4},
    '5': {action: `set_to_common_color`, index: 5},
    '6': {action: `set_to_common_color`, index: 6},
    '7': {action: `set_to_common_color`, index: 7},
    '8': {action: `set_to_common_color`, index: 8},
    '9': {action: `set_to_common_color`, index: 9},

    'ctrl+c': {action: "copy"},
    'ctrl+v': {action: "paste"},
    'ctrl+x': {action: "cut"},
    'ctrl+z': {action: 'undo'},
    'ctrl+y': {action: 'redo'},
    'ctrl+shift+z': {action: 'redo'},
    'f': {action: 'toggle_fill_mode'},

    '`': {action: 'debug'},
    'shift+`': {action: 'toggle_debugging'},
}

// Only these can be undone, all othellr actions are ignored by undo/redo
export const reversibleActions = [
    'go_home',
    'clear',
    'clear_bounds',
    'paste',
    'delete_selected',
    'delete_line',
    'delete_at_cursor',
    'add_line',
    'continue_line',
    'add_bound',
    'upload_file', // contested
    'load_local',
    'fill',
    'clear_fill',
]

// Only save the state to be preserved when these actions happen
export const saveSettingActions = [
    'increase_scale',
    'decrease_scale',
    'go_home',
    'clear',
    'clear_bounds',
    'delete_selected',
    'delete_line',
    'delete_at_cursor',
    'add_line',
    'continue_line',
    'add_bound',
    'undo',
    'redo',
    'paste',
    'set_stroke_width',
    'set_dash',
    'set_color',
    'toggle_partials',
    'fill',
    'clear_fill',
]

// When undoing an action, only these parts of the state get undone
export const reversible = [
    'lines',
    'curLinePos',
    'bounds',
    // 'trellis', // contested
    'eraser',
    'clipboard',
    'filledPolys',
]

// Only preserve these parts of the state across loads (*not* when saving to a file)
export const preservable = [
    "stroke",
    "dash",
    // This is contested
    'side',
    'filename',
    "commonColors",
    'extraButton',
    "strokeWidth",
    "partials",
    "lines",
    "bounds",
    "mirrorAxis",
    "mirrorRot",
    "mirrorType",
    "trellis",
    "translation",
    "scalex",
    "scaley",
    "rotate",
    "shearx",
    "sheary",
    "invertedScroll",
    "scrollSensitivity",
    "enableGestureScale",
    "debug",
    "openMenus",
    "paperColor",
    "doubleTapTimeMS",
    'filledPolys',
    "beginnerMode",
]

// The parts of the state that get serialized to the svg file
export const saveable = [
    // This is handeled seperately
    // 'lines',
    'bounds',
    'translation',
    "scalex",
    "scaley",
]

