import {mirror} from './globals.js'
import { lineIn, removeLine, pointIn, removePoint, addLine, calc, getSelected } from './utils'

// The default keybindings
// This should be the names of the JS key strings, all lower case
// Modifiers are shift, ctrl, meta, and alt. Order doesn't matter, no whitespace allowed
var keybindings = {
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

    'ctrl+c': "copy",
    'ctrl+v': "paste",
    'ctrl+x': "cut",

    'd': 'debug'
}

export default function reducer(state, data){
    const {
        spacingx,
        spacingy,
        cursorRadius,
        boundRadius,
        cursorPos,
        stroke,
        strokeWidth,
        partials,
        lines,
        curLine,
        bounds,
        // pattern,
        mirrorState,
        eraser,
        clipboard,
        translationx,
        translationy,
        scalex,
        scaley,
        rotatex,
        rotatey,
        shearx,
        sheary,
        invertedScroll,
        scrollSensitivity,
    } = state

    const {
        halfx,
        halfy,
        offsetx,
        offsety,
        selectionOverlap,
        boundRect,
    } = calc(state)

    if (!(['cursor moved', 'translate'].includes(data.action))){
        console.debug(data);
        console.debug(state);
    }

    switch (data.action){
        // case 'mouse movement':
        case 'cursor moved':
            return {...state,
                cursorPos: [
                    (Math.round(data.x / spacingx) * spacingx) + 1,
                    (Math.round(data.y / spacingy) * spacingy) + 1,
                ]
            }

        case 'key press':
            var take = null
            Object.entries(keybindings).forEach(([shortcut, action]) => {
                const code = shortcut.split('+')
                if (
                    data.event.ctrlKey  === code.includes('ctrl') &&
                    data.event.metaKey  === code.includes('meta') &&
                    data.event.altKey   === code.includes('alt') &&
                    data.event.shiftKey === code.includes('shift') &&
                    code.includes(data.event.key.toLowerCase())
                )
                    take = action
            })
            return take ? reducer(state, {action: take}) : state

        case 'translate':
            return {...state,
                translationx: translationx + data.x * (invertedScroll ? -1 : 1) * scrollSensitivity,
                translationy: translationy + data.y * (invertedScroll ? -1 : 1) * scrollSensitivity,
            }

        // Actions which can be set to various keyboard shortcuts
        case 'left':            return {...state, cursorPos: [cursorPos[0] - spacingx, cursorPos[1]]}
        case 'right':           return {...state, cursorPos: [cursorPos[0] + spacingx, cursorPos[1]]}
        case 'up':              return {...state, cursorPos: [cursorPos[0], cursorPos[1] - spacingy]}
        case 'down':            return {...state, cursorPos: [cursorPos[0], cursorPos[1] + spacingy]}
        case 'clear':           return {...state, lines: [], bounds: []}
        case 'clear bounds':    return {...state, bounds: []}
        case 'toggle partials': return {...state, partials: !partials}
        case 'copy':            return {...state, clipboard: getSelected(state), curLine: null}
        case 'paste':           return {...state, lines: [...lines, ...clipboard]}
        case 'cut': {
            const selected = getSelected(state)
            return {...reducer(state, {action: 'delete selected'}),
                clipboard: selected,
                curLine: null
            }
        }
        case 'delete selected':
            return {...state,
                lines: bounds.length < 2 ? lines : lines.filter(i => !(
                    i.props.x1 + translationx >= boundRect.left &&
                    i.props.x1 + translationx <= boundRect.right &&
                    i.props.y1 + translationy >= boundRect.top &&
                    i.props.y1 + translationy <= boundRect.bottom
                ) && (partials || (
                    i.props.x2 + translationx >= boundRect.left &&
                    i.props.x2 + translationx <= boundRect.right &&
                    i.props.y2 + translationy >= boundRect.top &&
                    i.props.y2 + translationy <= boundRect.bottom
                )))
            }
        case 'delete line':
            let _curLine = curLine
            let _eraser = eraser
            let _lines = lines
            if (pointIn(bounds, cursorPos))
                return {...state, bounds: removePoint(bounds, cursorPos)}
             else if (curLine)
                _curLine = null
             else {
                if (eraser){
                    _lines = (lines.filter(i => !(
                                (i.props.x1 === cursorPos[0] && i.props.y1 === cursorPos[1]) ||
                                (i.props.x2 === cursorPos[0] && i.props.y2 === cursorPos[1])
                            ) && (
                                (i.props.x1 === eraser[0] && i.props.y1 === eraser[1]) ||
                                (i.props.x2 === eraser[0] && i.props.y2 === eraser[1])
                            )
                        ))
                    _eraser = null
                } else {
                    _eraser = cursorPos
                }
            }
            return {...state,
                eraser: _eraser,
                lines: _lines,
                curLine: _curLine,
            }

        case 'delete':
            if (pointIn(bounds, cursorPos))
                return {...state, bounds: removePoint(bounds, cursorPos)}
             else if (curLine)
                return {...state, curLine: null}
            else if (clipboard)
                return {...state, clipboard: null}
             else {
                return {...state, lines: (lines.filter(i =>
                    !((i.props.x1 === cursorPos[0] && i.props.y1 === cursorPos[1]) ||
                        (i.props.x2 === cursorPos[0] && i.props.y2 === cursorPos[1]))
                    ))
                }
            }

        case 'nevermind':
            if (clipboard)
                return {...state, clipboard: null}
            else if (curLine)
                return {...state, curLine: null}
            else if (bounds.length)
                return {...state, bounds: []}
                // return reducer(state, {action: 'clear bounds'})
            return state

        case 'add line':
            if (clipboard)
                return {...state,
                    lines: [...lines, ...clipboard.map(i =>
                        <line {...i.props}
                            x1={i.props.x1 + cursorPos[0] + offsetx - 1}
                            x2={i.props.x2 + cursorPos[0] + offsetx - 1}
                            y1={i.props.y1 + cursorPos[1] + offsety - 1}
                            y2={i.props.y2 + cursorPos[1] + offsety - 1}
                            transform={`translate(${-translationx} ${-translationy})`}
                            // TODO: add key prop here
                        />
                    )]
                }

            return {...state,
                curLine: curLine === null ? {
                    x1: cursorPos[0],
                    y1: cursorPos[1],
                } : null,
                lines: curLine === null ? lines : addLine(state, {...curLine, x2: cursorPos[0], y2: cursorPos[1]})
            }

        case 'continue line':
            return {...reducer(state, {action: 'add line'}),
                curLine: {
                    x1: cursorPos[0],
                    y1: cursorPos[1],
                }
            }

        case 'add bound':
            const adjCursorPos = [
                cursorPos[0] - translationx + offsetx,
                cursorPos[1] - translationy + offsety
            ]
            if (pointIn(bounds, cursorPos))
                return {...state, bounds: removePoint(bounds, cursorPos)}
            else
                return {...state, bounds: [...bounds, adjCursorPos]}

        case 'toggle mirror':
            // eslint-disable-next-line default-case
            switch (mirrorState){
                case mirror.NONE: return {...state, mirrorState: mirror.VERT}
                case mirror.VERT: return {...state, mirrorState: mirror.HORZ}
                case mirror.HORZ: return {...state, mirrorState: mirror.BOTH}
                case mirror.BOTH: return {...state, mirrorState: mirror.NONE}
            } return state // This shouldn't be possible, but whatever

        default:
            console.log(JSON.stringify((<line x1='2'/>).props) === JSON.stringify((<line x1='2'/>).props))
            console.warn(`Unknown action: ${data.action}`)
            return state
    }
}
