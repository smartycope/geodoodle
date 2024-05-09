const defaultOptions = {
    cursorColor: "black",
    scalex: 20,
    scaley: 20,
    stroke: "#000000",
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
    // If we remove all the bounds after cut or delete selection
    removeSelectionAfterDelete: false,
    maxUndoAmt: 20,
    debug: false,
}

// The default keybindings
// This should be the names of the JS key strings, all lower case
// Modifiers are shift, ctrl, meta, and alt
// Order doesn't matter
// Multiple keycodes are assignable to the same action
// If a single keycode is assigned to multiple actions, the last one is used
export const keybindings = {
    "arrowleft": "left",
    "arrowright": "right",
    "arrowup": "up",
    "arrowdown": "down",
    "j": "left",
    ";": "right",
    "k": "up",
    "l": "down",

    'ctrl+arrowup': "increase scale",
    'ctrl+arrowdown': "decrease scale",

    'delete': "delete",
    'backspace': "delete line",
    'ctrl+q': "clear",
    ' ': "add line",
    'c': "continue line",
    'b': "add bound",
    'shift+b': "clear bounds",
    'escape': "nevermind",
    'p': "toggle partials",
    'm': "toggle mirror axis",
    'home': 'go home',
    'h': 'go home',
    'x': 'increment clipboard rotation',
    'z': 'increment clipboard mirror axis',

    'ctrl+c': "copy",
    'ctrl+v': "paste",
    'ctrl+x': "cut",
    'ctrl+z': 'undo',
    'ctrl+y': 'redo',
    'ctrl+shift+z': 'redo',

    'd': 'debug'
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
