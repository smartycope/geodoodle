import {mirror} from './globals.js'

// Actions which can be set to various keyboard shortcuts
const left = ({setCursorPos, cursorPos, spacingx}) => setCursorPos([cursorPos[0] - spacingx, cursorPos[1]])
const right = ({setCursorPos, cursorPos, spacingx}) => setCursorPos([cursorPos[0] + spacingx, cursorPos[1]])
const up = ({setCursorPos, cursorPos, spacingy}) => setCursorPos([cursorPos[0], cursorPos[1] - spacingy])
const down = ({setCursorPos, cursorPos, spacingy}) => setCursorPos([cursorPos[0], cursorPos[1] + spacingy])
const clear = ({setLines, setBounds}) => { setLines([]); setBounds([]); }
const clearBounds = ({setBounds}) => setBounds([])
const togglePartials = ({partials, setPartials}) => setPartials(!partials)
const copy = ({setClipboard, getSelected}) => setClipboard(getSelected(false))
const paste = ({lines, setLines, clipboard}) => setLines([...lines, ...clipboard])
const cut = ({setClipboard, getSelected, lines, setLines}) => {
    setClipboard(getSelected(false))
    deleteSelected({lines, setLines, getSelected})
}
const deleteAll = ({lines, setLines, cursorPos, curLine, setCurLine, bounds, setBounds, selection, setSelection}) => {
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
}
const deleteLine = ({bounds, setBounds, cursorPos, curLine, setCurLine, eraser, setEraser, lines, setLines}) => {
    if (!bound({bounds, setBounds, cursorPos}, false)){
        if (curLine){
            setCurLine(null)
        } else {
            if (eraser){
                setLines(lines.filter(i => {
                    if ((
                            (i.props.x1 === cursorPos[0] && i.props.y1 === cursorPos[1]) ||
                            (i.props.x2 === cursorPos[0] && i.props.y2 === cursorPos[1])
                        ) && (
                            (i.props.x1 === eraser[0] && i.props.y1 === eraser[1]) ||
                            (i.props.x2 === eraser[0] && i.props.y2 === eraser[1])
                        )
                    )
                        return undefined
                    else
                        return i
                }))
                setEraser(null)
            } else {
                setEraser(cursorPos)
            }
        }
    }
}
const line = ({curLine, setCurLine, cursorPos, addLine}) => {
    if (curLine === null){
        setCurLine({
            x1: cursorPos[0],
            y1: cursorPos[1],
        })
    } else {
        // setLines([...lines, <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>])
        addLine({...curLine, x2: cursorPos[0], y2: cursorPos[1]})
        setCurLine(null)
    }
}
const continueLine = ({curLine, setCurLine, cursorPos, lines, setLines, stroke, addLine}) => {
    line({curLine, setCurLine, cursorPos, lines, setLines, stroke, addLine})
    setCurLine({
        x1: cursorPos[0],
        y1: cursorPos[1],
    })
}
// Returns true if it deleted one instead of adding one
const bound = ({bounds, setBounds, cursorPos, translationx, translationy, offsetx, offsety}, add=true) => {
    let copy = JSON.parse(JSON.stringify(bounds))
    let mutated = false
    // First check to see if we need to remove it
    for (const i in bounds){
        if (bounds[i][0] === cursorPos[0] && bounds[i][1] === cursorPos[1]){
            copy.splice(i, 1)
            mutated = true
        }
    }
    if (!mutated && add){
        setBounds([...bounds, [cursorPos[0] - translationx + offsetx, cursorPos[1] - translationy + offsety]])
    } else {
        setBounds(copy)
    }
    return mutated
}
const toggleMirror = ({mirrorState, setMirrorState}) => {
    console.log('here');
    // eslint-disable-next-line default-case
    switch (mirrorState){
        case mirror.NONE: setMirrorState(mirror.VERT); break;
        case mirror.VERT: setMirrorState(mirror.HORZ); break;
        case mirror.HORZ: setMirrorState(mirror.BOTH); break;
        case mirror.BOTH: setMirrorState(mirror.NONE); break;
    }
}
const deleteSelected = ({setLines, lines, getSelected}) => {
    const selection = getSelected(false)
    setLines(lines.filter(i => selection.includes(i) ? undefined : i))
}
const nevermind = ({setBounds, curLine, setCurLine, clipboard, setClipboard, bounds}) => {
    if (clipboard)
        setClipboard(null)
    else if (curLine)
        setCurLine(null)
    else if (bounds.length)
        clearBounds({setBounds})
}


const debug = () => {
    console.log(JSON.parse(JSON.stringify([<line>test</line>,])));
}


export {
    left,
    right,
    up,
    down,
    deleteAll,
    deleteLine,
    line,
    continueLine,
    bound,
    clear,
    clearBounds,
    debug,
    togglePartials,
    toggleMirror,
    deleteSelected,
    cut, copy, paste,
    nevermind,
}
