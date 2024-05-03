import {mirror} from './globals.js'


// The default keybindings
// This should be the names of the JS key strings, all lower case
// Modifiers are shift, ctrl, meta, and alt. Order doesn't matter, no whitespace allowed
var keybindings = {
    "arrowleft": actions.left,
    "arrowright": actions.right,
    "arrowup": actions.up,
    "arrowdown": actions.down,
    "j": actions.left,
    ";": actions.right,
    "k": actions.up,
    "l": actions.down,

    'delete': actions.deleteAll,
    'backspace': actions.deleteLine,
    'ctrl+q': actions.clear,
    ' ': actions.line,
    'c': actions.continueLine,
    'b': actions.bound,
    'shift+b': actions.clearBounds,
    'escape': actions.nevermind,
    'p': actions.togglePartials,
    'm': actions.toggleMirror,

    'ctrl+c': actions.copy,
    'ctrl+v': actions.paste,
    'ctrl+x': actions.cut,

    'd': actions.debug,
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
        sheary
    } = state


    const halfx = Math.round((window.visualViewport.width  / 2) / spacingx) * spacingx
    const halfy = Math.round((window.visualViewport.height / 2) / spacingy) * spacingy
    const boundRect = boundsGroup.current?.getBoundingClientRect()
    const offsetx = translationx % spacingx
    const offsety = translationy % spacingy
    const selectionOverlap = (boundRadius/2)


    // Returns the new lines
    function addLine(props){
        props.x1 -= translationx - offsetx
        props.x2 -= translationx - offsetx
        props.y1 -= translationy - offsety
        props.y2 -= translationy - offsety

        return [...lines, <line {...props} stroke={stroke} strokeWidth={strokeWidth} key={JSON.stringify(props)}/>]
    }

    // eslint-disable-next-line default-case
    switch (data.action){
        case 'mouse movement':
            return {...state,
                dragging: data.e.buttons !== 0 ? true : dragging,
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
                lines: curLine === null ? lines : addLine({...curLine, x2: cursorPos[0], y2: cursorPos[1]})
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
                translationx: translationx + data.x * (options.invertedScroll ? -1 : 1) * options.scrollSensitivity,
                translationy: translationy + data.y * (options.invertedScroll ? -1 : 1) * options.scrollSensitivity,
            }

        case 'touch move':
            console.log(e)
            return {...state,
                cursorPos: [
                    (Math.round(data.x / spacingx) * spacingx) + 1,
                    (Math.round(data.y / spacingy) * spacingy) + 1,
                ]
            }

        // Actions which can be set to various keyboard shortcuts
        case 'left': return {...state, cursorPos: [cursorPos[0] - spacingx, cursorPos[1]]}
        case 'right': return {...state, cursorPos: [cursorPos[0] + spacingx, cursorPos[1]]}
        case 'up': return {...state, cursorPos: [cursorPos[0], cursorPos[1] - spacingy]}
        case 'down': return {...state, cursorPos: [cursorPos[0], cursorPos[1] + spacingy]}
        case 'clear': return {...state, lines: [], bounds: []}
        case 'clear bounds': return {...state, bounds: []}
        case 'toggle partials': return {...state, partials: !partials}
        // TODO:
        case 'copy': return {...state, clipboard: getSelected(false)}
        case 'paste': return {...state, lines: [...lines, ...clipboard]}
        case 'cut':
        return {...state,
                clipboard:(getSelected(false))
                // TODO:
                lines: deleteSelected({lines, setLines, getSelected})
            }

        // TODO:
        case 'delete all':
            if (!bound({bounds, setBounds, cursorPos}, false)){
                if (curLine){
                    setCurLine(null)
                } else if (selection) {
                    setSelection(null)
                } else {
                    setLines(lines.filter(i => {
                        if ((i.props.x1 === cursorPos[0] && i.props.y1 === cursorPos[1]) ||
                            (i.props.x2 === cursorPos[0] && i.props.y2 === cursorPos[1]))
                            return undefined
                        else
                            return i
                    }))
                }
            }
            return {...state,

            }

        case 'line':
            return {...state,
                curLine: curLine === null ? {
                    x1: cursorPos[0],
                    y1: cursorPos[1],
                } : null,
                lines: curLine === null ? lines : addLine({...curLine, x2: cursorPos[0], y2: cursorPos[1]})
            }

        case 'continue line':
            return {...reducer(state, {action: 'line'}),
                curLine: {
                    x1: cursorPos[0],
                    y1: cursorPos[1],
                }
            }

        case 'bound':
            let copy = JSON.parse(JSON.stringify(bounds))
            let mutated = false
            // First check to see if we need to remove it
            for (const i in bounds){
                if (bounds[i][0] === cursorPos[0] && bounds[i][1] === cursorPos[1]){
                    copy.splice(i, 1)
                    mutated = true
                }
            }
            return {...state,
                bounds: !mutated && add ? [...bounds, [
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
            }

        case 'delete selected':
            return {...state, lines: lines.filter(i => getSelected(false).includes(i) ? undefined : i)}

        case 'nevermind':
            if (clipboard)
                return {...state, clipboard: null}
            else if (curLine)
                return {...state, curLine: null}
            else if (bounds.length)
                return {...state, bounds: null}
                // return reducer(state, {action: 'clear bounds'})
            return state


        case 'delete line':
            let _curLine = curLine
            let _eraser = eraser
            let _lines = lines
            if (!bound({bounds, setBounds, cursorPos}, false)){
                if (curLine){
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
            }
            return {...state,
                eraser: _eraser,
                lines: _lines,
                curLine: _curLine,
            }
    }
}
