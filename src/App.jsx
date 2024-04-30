import './App.css';
import {useState} from 'react';
import * as actions from './actions.jsx'


function Dots({spacingx, spacingy, radius=2, offsetx=0, offsety=0}){
    return (<>
        <defs>
            <pattern id="dot" x="0" y="0" width={spacingx} height={spacingy} patternUnits='userSpaceOnUse'>
                <circle cx={offsetx} cy={offsety} r={radius} fill="black"/>
            </pattern>
        </defs>
        <rect fill="url(#dot)" stroke="black" width="100%" height="100%" />
    </>)
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
}

// The default keybindings
var keybindings = {
    "ArrowLeft": actions.left,
    "ArrowRight": actions.right,
    "ArrowUp": actions.up,
    "ArrowDown": actions.down,
    'Delete': actions.deleteAll,
    'Backspace': actions.deleteLine,
    'Q': actions.clear,
    ' ': actions.line,
    'c': actions.continueLine,
    'b': actions.bound,
}


export default function App() {
    const [spacingx, setSpacingx] = useState(options.spacingx)
    const [spacingy, setSpacingy] = useState(options.spacingy)
    const [cursorRadius, setCursorRadius] = useState(options.spacingx / 3)
    const [boundRadius, setBoundRadius] = useState(options.spacingx / 2);
    const [offsetx, setOffsetx] = useState(options.offsetx)
    const [offsety, setOffsety] = useState(options.offsety)
    // The position of the system mouse
    const [mousePos, setMousePos] = useState([offsetx, offsety])
    // The position of the circle we're drawing to act as a cursor in our application
    const [cursorPos, setCursorPos] = useState([offsetx, offsety])
    const [stroke, setStroke] = useState(options.stroke);
    const [strokeWidth, setStrokeWidth] = useState(options.strokeWidth);

    const [lines, setLines] = useState([<line x1={20} y1={20} x2={40} y2={40} stroke={stroke} strokeWidth={strokeWidth}/>]);
    const [curLine, setCurLine] = useState(null);
    const [bounds, setBounds] = useState([]);
    const [pattern, setPattern] = useState(null);
    const [mirrorState, setMirrorState] = useState(0);

    const halfx = Math.round((window.visualViewport.width  / 2) / spacingx) * spacingx
    const halfy = Math.round((window.visualViewport.height / 2) / spacingy) * spacingy

    const actionProps = {
        spacingx,
        setSpacingx,
        spacingy,
        setSpacingy,
        cursorRadius,
        setCursorRadius,
        offsetx,
        setOffsetx,
        offsety,
        setOffsety,
        mousePos,
        setMousePos,
        cursorPos,
        setCursorPos,
        stroke,
        setStroke,
        strokeWidth,
        setStrokeWidth,
        lines,
        setLines,
        curLine,
        setCurLine,
        bounds,
        setBounds,
        pattern,
        setPattern,
        mirrorState,
        setMirrorState,
        halfx, halfy
    }

    function handleMouseMoved(e){
        setCursorPos([
            (Math.round(e.clientX / spacingx) * spacingx) + 1,
            (Math.round(e.clientY / spacingy) * spacingy) + 1,
        ])
        setMousePos(e.clientX, e.clientY)
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

    let mirrorLines = []
    if (mirrorState === 1 || mirrorState === 4){
        mirrorLines.push(<line x1={halfx} y1
            ={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
    }
    if (mirrorState === 2 || mirrorState === 4){
        mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
    }

    return (
        <div className="App">
            <svg id='paper'
                width="100%"
                height="100vh"
                onMouseMove={handleMouseMoved}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                onMouseDown={handleMouseClick}
            >
                {/* Draw the dots */}
                <Dots spacingx={spacingx} spacingy={spacingy}/>
                {/* Draw the cursor */}
                <circle cx={cursorPos[0]} cy={cursorPos[1]} r={cursorRadius} stroke={options.cursorColor} fillOpacity={0}/>
                {/* Draw the lines */}
                {/* {lines.map(line => {line.props.key = `${line.props.x1}-${line.props.x2}-${line.props.y1}-${line.props.y2}`; return line})} */}
                <g id='lines'>
                    {lines}
                </g>
                {/* Draw the bounds */}
                <g id='bounds'>
                    {bounds.map(bound =>
                        <circle cx={bound[0]} cy={bound[1]} r={boundRadius} stroke={options.boundColor} fillOpacity={0}/>
                    )}
                </g>
                {/* Draw the current line */}
                {curLine && <line {...curLine} x2={cursorPos[0]} y2={cursorPos[1]} stroke={stroke}/>}
            </svg>
        </div>
  )
}
