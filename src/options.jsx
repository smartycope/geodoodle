const defaultOptions = {
    cursorColor: "black",
    scalex: 20,
    scaley: 20,
    stroke: "#000000",
    commonColorAmt: 5,
    strokeWidth: 1,
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
    hideHexColor: true,
    // If we remove all the bounds after cut or delete selection
    removeSelectionAfterDelete: false,
    maxUndoAmt: 20,
    debug: true,
}

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

    'ctrl+arrowup': {action: "increase scale"},
    'ctrl+arrowdown': {action: "decrease scale"},

    'delete': {action: "delete"},
    'backspace': {action: "delete line"},
    'ctrl+q': {action: "clear"},
    ' ': {action: "add line"},
    'c': {action: "continue line"},
    'b': {action: "add bound"},
    'shift+b': {action: "clear bounds"},
    'escape': {action: "nevermind"},
    'p': {action: "toggle partials"},
    'm': {action: "toggle mirror axis"},
    'home': {action: 'go home'},
    'h': {action: 'go home'},
    'x': {action: 'increment clipboard rotation'},
    'z': {action: 'increment clipboard mirror axis'},

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

    'd': {action: 'debug'}
}

export default defaultOptions

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
]
