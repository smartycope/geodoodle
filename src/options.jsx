const defaultOptions = {
    cursorColor: "black",
    scalex: 20,
    scaley: 20,
    stroke: "black",
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
    debug: true,
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

    'delete': "delete",
    'backspace': "delete line",
    'ctrl+q': "clear",
    ' ': "add line",
    'c': "continue line",
    'b': "add bound",
    'shift+b': "clear bounds",
    'escape': "nevermind",
    'p': "toggle partials",
    'm': "toggle mirror",
    'home': 'go home',
    'h': 'go home',

    'ctrl+c': "copy",
    'ctrl+v': "paste",
    'ctrl+x': "cut",

    'd': 'debug'
}

export default defaultOptions
