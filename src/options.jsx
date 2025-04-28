const defaultOptions = {
    cursorColor: "black",
    scalex: 20,
    scaley: 20,
    stroke: "#000000",
    commonColorAmt: 5,
    strokeWidth: .05,
    boundColor: "black",
    mirrorColor: 'green',
    selectionBorderColor: 'black',
    selectionOpacity: .5,
    selectionColor: '#3367D1',
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
    maxScale: Math.min(window.visualViewport.width, window.visualViewport.height) / 2,
    minScale: 4,
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

    'ctrl+arrowup': {action: "increase scale"},
    'ctrl+arrowdown': {action: "decrease scale"},

    'delete': {action: "delete"},
    'backspace': {action: "delete line"},
    // 'ctrl+q': {action: "clear"},
    ' ': {action: "add line"},
    'c': {action: "continue line"},
    'b': {action: "add bound"},
    'shift+b': {action: "clear bounds"},
    'escape': {action: "nevermind"},
    'p': {action: "toggle partials"},
    'home': {action: 'go home'},
    'h': {action: 'go home'},
    'x': {action: 'increment clipboard rotation'},
    'z': {action: 'increment clipboard mirror axis'},

    'm': {action: "menu", toggle: 'mirror'},
    'r': {action: "menu", toggle: 'repeat'},
    'ctrl+s': {action: "menu", toggle: 'settings'},

    '1': {action: `set to common color`, index: 1},
    '2': {action: `set to common color`, index: 2},
    '3': {action: `set to common color`, index: 3},
    '4': {action: `set to common color`, index: 4},
    '5': {action: `set to common color`, index: 5},
    '6': {action: `set to common color`, index: 6},
    '7': {action: `set to common color`, index: 7},
    '8': {action: `set to common color`, index: 8},
    '9': {action: `set to common color`, index: 9},

    'ctrl+c': {action: "copy"},
    'ctrl+v': {action: "paste"},
    'ctrl+x': {action: "cut"},
    'ctrl+z': {action: 'undo'},
    'ctrl+y': {action: 'redo'},
    'ctrl+shift+z': {action: 'redo'},

    '`': {action: 'debug'}
}

// Things which can go in the extra button slot
export const extraButtons = [
    'home',
    'copy image',
]

// Only these can be undone, all other actions are ignored by undo/redo
export const reversibleActions = [
    'go home',
    'clear',
    'clear bounds',
    'paste',
    'delete selected',
    'delete line',
    'delete',
    'add line',
    'continue line',
    'add bound',
    'upload',
    'load local',
    'add common color',
    'set to common color',
]

// Only save the state to be preserved when these actions happen
export const saveSettingActions = [
    'increase scale',
    'decrease scale',
    'go home',
    'clear',
    'clear bounds',
    'delete selected',
    'delete line',
    'delete',
    'add line',
    'continue line',
    'add bound',
    'undo',
    'redo',
    'paste',
    'add common color',
    `set to common color`,
    'toggle partials',
    "toggle dark mode",
]

// When undoing an action, only these parts of the state get undone
export const reversible = [
    'lines',
    'curLine',
    'bounds',
    'trellis',
    'eraser',
    'clipboard',
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
    'rotate',
    "partials",
    "lines",
    "bounds",
    "mirrorAxis",
    "mirrorAxis2",
    // "mirrorType",
    "mirrorMethod",
    "trellis",
    "translationx",
    "translationy",
    "scalex",
    "scaley",
    "rotatex",
    "rotatey",
    "shearx",
    "sheary",
    "invertedScroll",
    "scrollSensitivity",
    "enableGestureScale",
    "debug",
    "openMenus",
    "paperColor",
    "doubleTapTimeMS",
]

// The parts of the state that get serialized to the svg file
export const saveable = [
    // This is handeled seperately
    // 'lines',
    'bounds',
    'translationx',
    'translationy',
    "scalex",
    "scaley",
    "rotate",
    "shearx",
    "sheary"
]
