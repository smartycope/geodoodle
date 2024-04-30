import {mirror} from './globals.js'

// Actions which can be set to various keyboard shortcuts
const left       = ({setCursorPos, cursorPos, spacingx}) => setCursorPos([cursorPos[0] - spacingx, cursorPos[1]])
const right      = ({setCursorPos, cursorPos, spacingx}) => setCursorPos([cursorPos[0] + spacingx, cursorPos[1]])
const up         = ({setCursorPos, cursorPos, spacingy}) => setCursorPos([cursorPos[0], cursorPos[1] - spacingy])
const down       = ({setCursorPos, cursorPos, spacingy}) => setCursorPos([cursorPos[0], cursorPos[1] + spacingy])
const deleteAll  = ({lines, setLines, cursorPos, curLine, setCurLine}) => {
    if (curLine){
        setCurLine(null)
    } else {
        let copy = JSON.parse(JSON.stringify(lines))
        for (const i in lines){
            if (
                (i.props.x1 === cursorPos[0] && i.props.y1 === cursorPos[1]) ||
                (i.props.x2 === cursorPos[0] && i.props.y2 === cursorPos[1])
            ){
                copy.splice(copy.indexOf(i), 1)
            }
        }
        setLines(copy)
    }
}
const deleteLine = ({}) => {
    console.log('TODO: deleteLine()');
}
const clear      = ({setLines, setBounds}) => { setLines([]); setBounds([]); }
const clearBounds = ({setBounds}) => setBounds([])
const line       = ({curLine, setCurLine, cursorPos, lines, setLines, stroke}) => {
    if (curLine === null){
        setCurLine({
            x1: cursorPos[0],
            y1: cursorPos[1],
        })
    } else {
        setLines([...lines, <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>])
        setCurLine(null)
    }
}
const continueLine = ({curLine, setCurLine, cursorPos, lines, setLines, stroke}) => {
    line({curLine, setCurLine, cursorPos, lines, setLines, stroke})
    setCurLine({
        x1: cursorPos[0],
        y1: cursorPos[1],
    })
}
const bound      = ({bounds, setBounds, cursorPos}) => {
    let copy = JSON.parse(JSON.stringify(bounds))
    let mutated = false
    // First check to see if we need to remove it
    for (const i in bounds){
        if (bounds[i][0] === cursorPos[0] && bounds[i][1] === cursorPos[1]){
            copy.splice(i, 1)
            mutated = true
        }
    }
    if (!mutated){
        setBounds([...bounds, cursorPos])
    } else {
        setBounds(copy)
    }
}
const cancelCurrent = ({setCurLine}) => setCurLine(null)
const togglePartials = ({partials, setPartials}) => setPartials(!partials)
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
    cancelCurrent,
    togglePartials,
    toggleMirror,
}
