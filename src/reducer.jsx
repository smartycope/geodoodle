import {mirror} from './globals.js'
import { addLine, calc, getSelected } from './utils'

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
    ' ': "line",
    'c': "continue line",
    'b': "bound",
    'shift+b': "clear bounds",
    'escape': "nevermind",
    'p': "toggle partials",
    'm': "toggle mirror",

    'ctrl+c': "copy",
    'ctrl+v': "paste",
    'ctrl+x': "cut",
}

export default function reducer(state, data){
    const {
        spacingx,
        spacingy,
        cursorRadius,
        boundRadius,
        mousePos,
        cursorPos,
        stroke,
        strokeWidth,
        partials,
        lines,
        curLine,
        bounds,
        pattern,
        mirrorState,
        dragging,
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
    } = calc(state)

    if (!(['mouse movement', 'touch move'].includes(data.action))){
        console.log(data);
        console.log(state);
    }

    // TODO:
    // function handleTouchStart(e){
        // if (curLine === null){
        //     const touch = (e.touches[0] || e.changedTouches[0])
        //     console.log(e);
        //     setCurLine({
        //         x1: (Math.round(touch.pageX / spacingx) * spacingx) + 1,
        //         y1: (Math.round(touch.pageY / spacingy) * spacingy) + 1,
        //     })
        // } else {
        //     // setLines([...lines, <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>])
        //     addLine({...curLine, x2: cursorPos[0], y2: cursorPos[1]})
        //     setCurLine(null)
        // }
    // }

    // eslint-disable-next-line default-case
    switch (data.action){
        case 'mouse movement':
            return {...state,
                dragging: data.buttons !== 0 ? true : dragging,
                cursorPos: [
                    (Math.round(data.x / spacingx) * spacingx) + 1,
                    (Math.round(data.y / spacingy) * spacingy) + 1,
                ]
            }

        case 'mouse up':
            return {...state,
                dragging: false,
                curLine: curLine === null ? {
                    x1: (Math.round(data.x / spacingx) * spacingx) + 1,
                    y1: (Math.round(data.y / spacingy) * spacingy) + 1,
                } : null,
                lines: curLine === null ? lines : addLine(state, {...curLine, x2: cursorPos[0], y2: cursorPos[1]})
            }

        case 'mouse click':
            // eslint-disable-next-line default-case
            switch (data.button){
                // Left click
                case 0: return reducer(state, {action: 'line'})
                // Middle click
                case 1: return reducer(state, {action: 'delete all'})
                // Right click
                case 2: return reducer(state, {action: 'continue line'})
            }
            return state // This shouldn't be possible, but whatever

        case 'key press':
            Object.entries(keybindings).forEach(([shortcut, action]) => {
                const code = shortcut.split('+')
                if (
                    data.event.ctrlKey  === code.includes('ctrl') &&
                    data.event.metaKey  === code.includes('meta') &&
                    data.event.altKey   === code.includes('alt') &&
                    data.event.shiftKey === code.includes('shift') &&
                    code.includes(data.event.key.toLowerCase())
                )
                    return reducer(state, {action: action})
            })
            return state

        case 'translate':
            return {...state,
                translationx: translationx + data.x * (invertedScroll ? -1 : 1) * scrollSensitivity,
                translationy: translationy + data.y * (invertedScroll ? -1 : 1) * scrollSensitivity,
            }

        case 'touch move':
            return {...state,
                cursorPos: [
                    (Math.round(data.x / spacingx) * spacingx) + 1,
                    (Math.round(data.y / spacingy) * spacingy) + 1,
                ]
            }

        // Actions which can be set to various keyboard shortcuts
        case 'left':            return {...state, cursorPos: [cursorPos[0] - spacingx, cursorPos[1]]}
        case 'right':           return {...state, cursorPos: [cursorPos[0] + spacingx, cursorPos[1]]}
        case 'up':              return {...state, cursorPos: [cursorPos[0], cursorPos[1] - spacingy]}
        case 'down':            return {...state, cursorPos: [cursorPos[0], cursorPos[1] + spacingy]}
        case 'clear':           return {...state, lines: [], bounds: []}
        case 'clear bounds':    return {...state, bounds: []}
        case 'toggle partials': return {...state, partials: !partials}
        case 'copy':            return {...state, clipboard: getSelected(state, false)}
        case 'paste':           return {...state, lines: [...lines, ...clipboard]}
        case 'cut': {
            const selected = getSelected(state, false)
            return {...reducer(state, {action: 'delete selected'}),
                clipboard: selected,
            }
        }
        case 'delete selected': {
            const selected = getSelected(state, false)
            return {...state, lines: lines.filter(i => selected.includes(i) ? undefined : i)}
        }
        case 'delete line':
            let _curLine = curLine
            let _eraser = eraser
            let _lines = lines
            if (bounds.includes(cursorPos)){
                return {...state, bounds: bounds.filter(i => i !== cursorPos)}

            } else if (curLine){
                _curLine = null
            } else {
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
            if (bounds.includes(cursorPos)){
                return {...state, bounds: bounds.filter(i => i !== cursorPos)}
            } else if (curLine){
                return {...state, curLine: null}
            // TODO:
            // } else if (selection) {
            //     return {...state, selection: null}
            } else {
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
                return {...state, bounds: null}
                // return reducer(state, {action: 'clear bounds'})
            return state

        case 'add line':
            return {...state,
                curLine: curLine === null ? {
                    x1: cursorPos[0],
                    y1: cursorPos[1],
                } : null,
                lines: curLine === null ? lines : addLine(state, {...curLine, x2: cursorPos[0], y2: cursorPos[1]})
            }

        case 'continue line':
            return {...reducer(state, {action: 'line'}),
                curLine: {
                    x1: cursorPos[0],
                    y1: cursorPos[1],
                }
            }

        case 'add bound':
            let copy = JSON.parse(JSON.stringify(bounds))
            let mutated = false
            if (bounds.includes(cursorPos))
                return {...state, bounds: bounds.filter(i => i !== cursorPos)}
            else
                return {...state,
                    bounds: !mutated ? [...bounds, [
                        cursorPos[0] - translationx + offsetx,
                        cursorPos[1] - translationy + offsety
                    ]] : copy
                }

        case 'toggle mirror':
            // eslint-disable-next-line default-case
            switch (mirrorState){
                case mirror.NONE: return {...state, mirrorState: mirror.VERT}
                case mirror.VERT: return {...state, mirrorState: mirror.HORZ}
                case mirror.HORZ: return {...state, mirrorState: mirror.BOTH}
                case mirror.BOTH: return {...state, mirrorState: mirror.NONE}
            } return state // This shouldn't be possible, but whatever

        default:
            console.warn(`Unknown action: ${data.action}`)
    }
}
