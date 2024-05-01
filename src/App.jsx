import './App.css';
import {useRef, useState} from 'react';
import * as actions from './actions.jsx'
import {mirror} from './globals.js'


// TODO: touch screen touching (not dragging) doesn't work
// TODO: Dragging bounds should make a selection

// Disable the default right click menu
window.oncontextmenu = () => false

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
    'Escape': (props) => { actions.cancelCurrent(props); actions.clearBounds(props) },
    'p': actions.togglePartials,
    'm': actions.toggleMirror,

    'ctrl+c': actions.copy,
    'ctrl+v': actions.paste,
    'ctrl+x': actions.cut,

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

    const [lines, setLines] = useState([]);
    const [curLine, setCurLine] = useState(null);
    const [bounds, setBounds] = useState([]);
    const [pattern, setPattern] = useState(null);
    const [mirrorState, setMirrorState] = useState(mirror.NONE);
    const [dragging, setDragging] = useState(false);
    const [eraser, setEraser] = useState(null);
    const [clipboard, setClipboard] = useState(null);

    const halfx = Math.round((window.visualViewport.width  / 2) / spacingx) * spacingx + 1
    const halfy = Math.round((window.visualViewport.height / 2) / spacingy) * spacingy + 1
    const boundRect = boundsGroup.current?.getBoundingClientRect()

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
        eraser, setEraser,
        clipboard, setClipboard,
        getSelected,
        addLine,
        halfx, halfy,
    }

    function addLine(props){
        setLines([...lines, <line {...props} stroke={stroke} strokeWidth={strokeWidth} key={JSON.stringify(props)}/>])
    }

    function getSelected(group=true){
        if (bounds < 2)
            return []
        else {
            const selected = lines.filter(i => {
                if ((
                        i.props.x1 >= boundRect.left &&
                        i.props.x1 <= boundRect.right &&
                        i.props.y1 >= boundRect.top &&
                        i.props.y1 <= boundRect.bottom
                    ) && (partials || (
                        i.props.x2 >= boundRect.left &&
                        i.props.x2 <= boundRect.right &&
                        i.props.y2 >= boundRect.top &&
                        i.props.y2 <= boundRect.bottom
                    ))
                )
                    return i
                else
                    return undefined
            })

            if (group)
                return <g>{selected}</g>
            else
                return selected
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
                code.includes(e.key)
            )
                handler(actionProps)
        })
    }

    function handleScroll(e){
        // console.log(e);
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
                        x1={eraser[0] - spacingx / 3}
                        y1={eraser[1] - spacingy / 3}
                        x2={eraser[0] + spacingx / 3}
                        y2={eraser[1] + spacingy / 3}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                    />,
                    <line
                        x1={eraser[0] + spacingx / 3}
                        y1={eraser[1] - spacingy / 3}
                        x2={eraser[0] - spacingx / 3}
                        y2={eraser[1] + spacingy / 3}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                    />
                ]}
            </svg>
        </div>
  )
}
