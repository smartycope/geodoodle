import './App.css';
import {useRef, useState} from 'react';
import * as actions from './actions.jsx'
import {mirror} from './globals.js'

// Disable the default right click menu
window.oncontextmenu = function () {
    return false;
}

// The default options
const options = {
    cursorColor: "black",
    spacingx: 20,
    spacingy: 20,
    offsetx: 0,
    offsety: 0,
    stroke: "black",
    strokeWidth: 1,
    boundColor: "black",
    mirrorColor: 'black',
    selectionBorderColor: 'black',
    selectionOpacity: .5,
    selectionColor: '#3367D1',
    partials: false,
    dotOffsetx: 0,
    dotOffsety: 0,
    dotRadius: 2,
    dotColor: 'black',
}

// The default keybindings
var keybindings = {
    "ArrowLeft": actions.left,
    "ArrowRight": actions.right,
    "ArrowUp": actions.up,
    "ArrowDown": actions.down,
    "j": actions.left,
    ";": actions.right,
    "k": actions.up,
    "l": actions.down,

    'Delete': actions.deleteAll,
    'Backspace': actions.deleteLine,
    'Q': actions.clear,
    ' ': actions.line,
    'c': actions.continueLine,
    'b': actions.bound,
    'B': actions.clearBounds,
    'Escape': actions.cancelCurrent,
    'p': actions.togglePartials,
    'm': actions.toggleMirror,

    'd': actions.debug,
}


export default function App() {
    const boundsGroup = useRef()

    const [spacingx, setSpacingx] = useState(options.spacingx)
    const [spacingy, setSpacingy] = useState(options.spacingy)
    const [cursorRadius, setCursorRadius] = useState(options.spacingx / 3)
    const [boundRadius, setBoundRadius] = useState(options.spacingx / 1.5);
    const [offsetx, setOffsetx] = useState(options.offsetx)
    const [offsety, setOffsety] = useState(options.offsety)
    // The position of the system mouse
    const [mousePos, setMousePos] = useState([offsetx, offsety])
    // The position of the circle we're drawing to act as a cursor in our application
    const [cursorPos, setCursorPos] = useState([offsetx, offsety])
    const [stroke, setStroke] = useState(options.stroke);
    const [strokeWidth, setStrokeWidth] = useState(options.strokeWidth);
    const [partials, setPartials] = useState(options.partials);

    const [lines, setLines] = useState([<line x1={20} y1={20} x2={40} y2={40} stroke={stroke} strokeWidth={strokeWidth}/>]);
    const [curLine, setCurLine] = useState(null);
    const [bounds, setBounds] = useState([]);
    const [pattern, setPattern] = useState(null);
    const [mirrorState, setMirrorState] = useState(mirror.NONE);
    const [dragging, setDragging] = useState(false);

    const halfx = Math.round((window.visualViewport.width  / 2) / spacingx) * spacingx
    const halfy = Math.round((window.visualViewport.height / 2) / spacingy) * spacingy

    const actionProps = {
        spacingx, setSpacingx,
        spacingy, setSpacingy,
        cursorRadius, setCursorRadius,
        offsetx, setOffsetx,
        offsety, setOffsety,
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
        halfx, halfy,
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
                setLines([...lines, <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>])
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
        // console.log(e.key);
        if (keybindings[e.key]){
            keybindings[e.key](actionProps)
        }
    }

    function handleScroll(e){
        console.log(e);
    }

    function handleTouchMove(e){
        const x = e.touches[0].pageX;
        const y = e.touches[0].pageY;
        setCursorPos([
            (Math.round(x / spacingx) * spacingx) + 1,
            (Math.round(y / spacingy) * spacingy) + 1,
        ])
        setMousePos(x, y)
    }

    function handleTouchStart(e){
        if (curLine === null){
            setCurLine({
                x1: (Math.round(e.touches[0].pageX / spacingx) * spacingx) + 1,
                y1: (Math.round(e.touches[0].pageY / spacingy) * spacingy) + 1,
            })
        } else {
            setLines([...lines, <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>])
            setCurLine(null)
        }
    }

    let mirrorLines = []
    if (mirrorState === mirror.VERT || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
    }
    if (mirrorState === mirror.HORZ || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
    }

    console.log(mirrorLines);
    console.log(mirrorState);
    const boundRect = boundsGroup.current?.getBoundingClientRect()

    return (
        <div className="App">
            <svg id='paper'
                width="100%"
                height="101vh"
                onMouseMove={handleMouseMoved}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                onMouseDown={handleMouseClick}
                onScroll={handleScroll}
                onTouchMove={handleTouchMove}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchStart}
                onMouseUp={handleMouseUp}
            >
                {/* Draw the dots */}
                <defs>
                    <pattern id="dot" x="0" y="0" width={spacingx} height={spacingy} patternUnits='userSpaceOnUse'>
                        <circle cx={options.dotOffsetx} cy={options.dotOffsety} r={options.dotRadius} fill={options.dotColor}/>
                    </pattern>
                </defs>
                <rect fill="url(#dot)" stroke="black" width="100%" height="100%" />

                {/* Draw the cursor */}
                <circle cx={cursorPos[0]} cy={cursorPos[1]} r={cursorRadius} stroke={options.cursorColor} fillOpacity={0}/>

                {/* Draw the lines */}
                {/* {lines.map(line => {line.props.key = `${line.props.x1}-${line.props.x2}-${line.props.y1}-${line.props.y2}`; return line})} */}
                <g id='lines'> {lines} </g>

                {/* Draw the current line */}
                {curLine && <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>}

                {/* Draw the bounds */}
                <g id='bounds' ref={boundsGroup}>
                    {bounds.map(bound =>
                        <rect
                            width={boundRadius}
                            height={boundRadius}
                            x={bound[0] - (boundRadius/2)}
                            y={bound[1] - (boundRadius/2)}
                            rx={partials ? 4 : 0}
                            stroke={options.boundColor}
                            fillOpacity={0}
                        />
                    )}
                </g>

                {/* Draw the bound rect */}
                <rect
                    width={boundRect.width}
                    height={boundRect.height}
                    x={boundRect.x}
                    y={boundRect.y}
                    stroke={options.selectionBorderColor}
                    fillOpacity={options.selectionOpacity}
                    fill={options.selectionColor}
                    rx={partials ? 4 : 0}
                />

                {/* Draw the mirror lines */}
                {mirrorLines}
            </svg>
        </div>
  )
}
