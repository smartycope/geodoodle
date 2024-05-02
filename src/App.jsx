import './App.css';
import {useRef, useState} from 'react';
import * as actions from './actions.jsx'
import {mirror} from './globals.js'


// TODO: touch screen touching (not dragging) doesn't work
// TODO: can't add bounds until after a line has been made
// TODO: Dragging bounds should make a selection
// TODO: delete selected doesn't work now
// TODO: eraser stopped working

// Disable the default right click menu
window.oncontextmenu = () => false


// The default options
const options = {
    cursorColor: "black",
    spacingx: 20,
    spacingy: 20,
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
}

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


export default function App() {
    const boundsGroup = useRef()
    const paper = useRef()

    const [spacingx, setSpacingx] = useState(options.spacingx)
    const [spacingy, setSpacingy] = useState(options.spacingy)
    const [cursorRadius, setCursorRadius] = useState(options.spacingx / 3)
    const [boundRadius, setBoundRadius] = useState(options.spacingx / 1.5);
    // The position of the system mouse
    const [mousePos, setMousePos] = useState([0, 0])
    // The position of the circle we're drawing to act as a cursor in our application
    const [cursorPos, setCursorPos] = useState([0, 0])
    const [stroke, setStroke] = useState(options.stroke);
    const [strokeWidth, setStrokeWidth] = useState(options.strokeWidth);
    const [partials, setPartials] = useState(options.partials);

    const [lines, setLines] = useState([]);
    const [curLine, setCurLine] = useState(null);
    const [bounds, setBounds] = useState([]);
    const [pattern, setPattern] = useState(null);
    const [mirrorState, setMirrorState] = useState(mirror.NONE);
    const [dragging, setDragging] = useState(false);
    const [eraser, setEraser] = useState(null);
    const [clipboard, setClipboard] = useState(null);

    // const [transformation, setTransformation] = useState([1, 0, 0, 1, 0, 0]);
    const [translationx, setTranslationx] = useState(0);
    const [translationy, setTranslationy] = useState(0);
    const [scalex, setScalex] = useState(options.spacingx);
    const [scaley, setScaley] = useState(options.spacingy);
    const [rotatex, setRotatex] = useState(0);
    const [rotatey, setRotatey] = useState(0);
    const [shearx, setShearx] = useState(0);
    const [sheary, setSheary] = useState(0);

    const halfx = Math.round((window.visualViewport.width  / 2) / spacingx) * spacingx
    const halfy = Math.round((window.visualViewport.height / 2) / spacingy) * spacingy
    const boundRect = boundsGroup.current?.getBoundingClientRect()
    const offsetx = translationx % spacingx
    const offsety = translationy % spacingy
    const selectionOverlap = (boundRadius/2)

    const actionProps = {
        spacingx, setSpacingx,
        spacingy, setSpacingy,
        cursorRadius, setCursorRadius,
        mousePos, setMousePos,
        cursorPos, setCursorPos,
        stroke, setStroke,
        strokeWidth, setStrokeWidth,
        lines, setLines,
        curLine, setCurLine,
        bounds, setBounds,
        pattern, setPattern,
        mirrorState, setMirrorState,
        partials, setPartials,
        eraser, setEraser,
        clipboard, setClipboard,
        getSelected,
        halfx, halfy,
        offsetx, offsety,
        translationx, setTranslationx,
        translationy, setTranslationy,
        scalex, setScalex,
        scaley, setScaley,
        rotatex, setRotatex,
        rotatey, setRotatey,
        shearx, setShearx,
        sheary, setSheary,
        addLine,
    }

    function addLine(props){
        props.x1 -= translationx - offsetx
        props.x2 -= translationx - offsetx
        props.y1 -= translationy - offsety
        props.y2 -= translationy - offsety

        setLines([...lines, <line {...props} stroke={stroke} strokeWidth={strokeWidth} key={JSON.stringify(props)}/>])
    }

    function getSelected(group=true){
        if (bounds < 2)
            return []
        else {
            const selected = lines.filter(i => (
                    i.props.x1 + translationx >= boundRect.left &&
                    i.props.x1 + translationx <= boundRect.right &&
                    i.props.y1 + translationy >= boundRect.top &&
                    i.props.y1 + translationy <= boundRect.bottom
                ) && (partials || (
                    i.props.x2 + translationx >= boundRect.left &&
                    i.props.x2 + translationx <= boundRect.right &&
                    i.props.y2 + translationy >= boundRect.top &&
                    i.props.y2 + translationy <= boundRect.bottom
                ))).map(i => <line
                    // Remove the translation (so it's absolutely positioned with respect to the cursor)
                    // Then remove the overlap (since the boundRect intentionally doens't align with the dots)
                    {...i.props}
                    x1={i.props.x1 - boundRect.left + translationx - selectionOverlap + 1}
                    x2={i.props.x2 - boundRect.left + translationx - selectionOverlap + 1}
                    y1={i.props.y1 - boundRect.top + translationy - selectionOverlap + 1}
                    y2={i.props.y2 - boundRect.top + translationy - selectionOverlap + 1}
                />)

            return group ? <g>{selected}</g> : selected
        }
    }

    function handleMouseMoved(e){
        if (e.buttons !== 0)
            setDragging(true)

        setCursorPos([
            (Math.round(e.clientX / spacingx) * spacingx) + 1,
            (Math.round(e.clientY / spacingy) * spacingy) + 1,
        ])
        setMousePos(e.clientX, e.clientY)
    }

    function handleMouseUp(e){
        if (dragging){
            if (curLine === null){
                setCurLine({
                    x1: (Math.round(e.clientX / spacingx) * spacingx) + 1,
                    y1: (Math.round(e.clientY / spacingy) * spacingy) + 1,
                })
            } else {
                // setLines([...lines, <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>])
                addLine({...curLine, x2: cursorPos[0], y2: cursorPos[1]})
                setCurLine(null)
            }
        }
        setDragging(false)
    }

    function handleMouseClick(e){
        // eslint-disable-next-line default-case
        switch (e.button){
            // Left click
            case 0: actions.line(actionProps);         break;
            // Middle click
            case 1: actions.deleteAll(actionProps);    break;
            // Right click
            case 2: actions.continueLine(actionProps); break;
        }
    }

    function handleKeyDown(e){
        Object.entries(keybindings).forEach(([shortcut, handler]) => {
            const code = shortcut.split('+')
            if (
                e.ctrlKey  === code.includes('ctrl') &&
                e.metaKey  === code.includes('meta') &&
                e.altKey   === code.includes('alt') &&
                e.shiftKey === code.includes('shift') &&
                code.includes(e.key.toLowerCase())
            )
                handler(actionProps)
        })
    }

    function handleScroll(e){
        setTranslationx(translationx + e.deltaX * (options.invertedScroll ? -1 : 1) * options.scrollSensitivity)
        setTranslationy(translationy + e.deltaY * (options.invertedScroll ? -1 : 1) * options.scrollSensitivity)
    }

    function handleTouchMove(e){
        const touch = (e.touches[0] || e.changedTouches[0])
        console.log(e);
        const x = touch.pageX;
        const y = touch.pageY;
        setCursorPos([
            (Math.round(x / spacingx) * spacingx) + 1,
            (Math.round(y / spacingy) * spacingy) + 1,
        ])
        setMousePos(x, y)
    }

    function handleTouchStart(e){
        if (curLine === null){
            const touch = (e.touches[0] || e.changedTouches[0])
            console.log(e);
            setCurLine({
                x1: (Math.round(touch.pageX / spacingx) * spacingx) + 1,
                y1: (Math.round(touch.pageY / spacingy) * spacingy) + 1,
            })
        } else {
            // setLines([...lines, <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>])
            addLine({...curLine, x2: cursorPos[0], y2: cursorPos[1]})
            setCurLine(null)
        }
    }


    let mirrorLines = []
    if (mirrorState === mirror.VERT || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
    }
    if (mirrorState === mirror.HORZ || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={0} y1={halfy} x2="100%" y2={halfy} stroke={options.mirrorColor}/>)
    }

    return (
        <div className="App">
            {/* <samp><kbd>Shift</kbd></samp> */}
            <svg id='paper'
                width="100%"
                height="101vh"
                onMouseMove={handleMouseMoved}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                onMouseDown={handleMouseClick}
                onTouchMove={handleTouchMove}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchStart}
                onMouseUp={handleMouseUp}
                onWheel={handleScroll}
                onCopy={() => actions.copy(actionProps)}
                onPaste={() => actions.paste(actionProps)}
                onCut={() => actions.cut(actionProps)}
                ref={paper}
            >
                {/* Draw the dots */}
                <pattern id="dot"
                    x={translationx}
                    y={translationy}
                    width={scalex}
                    height={scaley}
                    patternUnits='userSpaceOnUse'
                    // patternTransform={`scale(${scalex}, ${scaley})`}
                >
                    <circle
                        cx={0}
                        cy={0}
                        // r={options.dotRadius/scalex}
                        r={options.dotRadius}
                        fill={options.dotColor}
                    />
                </pattern>
                <rect fill="url(#dot)" stroke="black" width="100%" height="100%" />

                {/* Draw the cursor */}
                <circle
                    cx={cursorPos[0] + offsetx}
                    cy={cursorPos[1] + offsety}
                    r={cursorRadius}
                    stroke={options.cursorColor}
                    fillOpacity={0}
                />

                {/* Draw the lines */}
                {/* {lines.map(line => {line.props.key = `${line.props.x1}-${line.props.x2}-${line.props.y1}-${line.props.y2}`; return line})} */}
                <g id='lines' transform={`translate(${translationx} ${translationy})`}> {lines} </g>

                {/* Draw the current line */}
                {curLine && <line
                    x1={curLine.x1 + offsetx}
                    y1={curLine.y1 + offsety}
                    x2={cursorPos[0] + offsetx}
                    y2={cursorPos[1] + offsety}
                    stroke={stroke}
                />}

                {/* Draw the bounds */}
                <g id='bounds' ref={boundsGroup}>
                    {bounds.map(bound =>
                        <rect
                            width={boundRadius}
                            height={boundRadius}
                            x={bound[0] - selectionOverlap + translationx}
                            y={bound[1] - selectionOverlap + translationy}
                            rx={partials ? 4 : 0}
                            stroke={options.boundColor}
                            fillOpacity={0}
                        />
                    )}
                </g>

                {/* Draw the bound rect */}
                <rect
                    width={boundRect?.width}
                    height={boundRect?.height}
                    x={boundRect?.x}
                    y={boundRect?.y}
                    stroke={options.selectionBorderColor}
                    fillOpacity={options.selectionOpacity}
                    fill={options.selectionColor}
                    rx={partials ? 4 : 0}
                />

                {/* Draw the mirror lines */}
                {mirrorLines}

                {/* Draw the eraser placeholder */}
                {eraser && [
                    <line
                        x1={eraser[0] - spacingx / 3 + translationx}
                        y1={eraser[1] - spacingy / 3 + translationy}
                        x2={eraser[0] + spacingx / 3 + translationx}
                        y2={eraser[1] + spacingy / 3 + translationy}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                    />,
                    <line
                        x1={eraser[0] + spacingx / 3 + translationx}
                        y1={eraser[1] - spacingy / 3 + translationy}
                        x2={eraser[0] - spacingx / 3 + translationx}
                        y2={eraser[1] + spacingy / 3 + translationy}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                    />
                ]}

                {/* Draw the current clipboard */}
                <g transform={`translate(${cursorPos[0] + offsetx - 1} ${cursorPos[1] + offsety - 1})`}> {clipboard} </g>
            </svg>
        </div>
  )
}
