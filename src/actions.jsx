// Actions which can be set to various keyboard shortcuts
const left       = ({setCursorPos, cursorPos, spacingx}) => setCursorPos([cursorPos[0] - spacingx, cursorPos[1]])
const right      = ({setCursorPos, cursorPos, spacingx}) => setCursorPos([cursorPos[0] + spacingx, cursorPos[1]])
const up         = ({setCursorPos, cursorPos, spacingy}) => setCursorPos([cursorPos[0], cursorPos[1] - spacingy])
const down       = ({setCursorPos, cursorPos, spacingy}) => setCursorPos([cursorPos[0], cursorPos[1] + spacingy])
const deleteAll  = ({lines, setLines, cursorPos}) => {
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
const deleteLine = ({}) => {
    console.log('TODO: deleteLine()');
}
const clear      = ({setLines}) => setLines([])
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
        if (i[0] === cursorPos[0] && i[1] === cursorPos[1]){
            copy.splice(copy.indexOf(i), 1)
            mutated = true
        }
    }
    if (!mutated){
        setBounds([...bounds, cursorPos])
    }
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
}
