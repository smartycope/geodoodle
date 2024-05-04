import './App.css';
import {useReducer, useRef, useState} from 'react';
import * as actions from './reducer.jsx'
import {mirror} from './globals'
import reducer from './reducer';
import {calc} from './utils';
import options from './options';

// TODO: touch screen touching (not dragging) doesn't work
// TODO: can't add bounds until after a line has been made
// TODO: Dragging bounds should make a selection
// TODO: delete selected doesn't work now
// TODO: eraser stopped working
// TODO: ctrl+c will trigger if ctrl+shift+c is pressed

// Disable the default right click menu
window.oncontextmenu = () => false

export default function App() {
    const boundsGroup = useRef()
    const paper = useRef()
    const [dragging, setDragging] = useState(false)

    const [state, dispatch] = useReducer(reducer, {
        spacingx: options.spacingx,
        spacingy: options.spacingy,
        cursorRadius: options.spacingx / 3,
        boundRadius: options.spacingx / 1.5,
        // The position of the circle we're drawing to act as a cursor in our application, NOT the actual mouse position
        cursorPos: [0, 0],
        stroke: options.stroke,
        strokeWidth: options.strokeWidth,
        // A bool
        partials: options.partials,

        // A list of <line> objects
        lines: [],
        // {x1: float, y1: float} or null
        curLine: null,
        // A list of [x, y]
        bounds: [],
        // pattern: null,
        mirrorState: mirror.NONE,
        // [x, y] or null
        eraser: null,
        // A list of <line> objects, or null
        clipboard: null,

        // const [transformation, setTransformation] = useState([1, 0, 0, 1, 0, 0]);
        translationx: 0,
        translationy: 0,
        scalex: options.spacingx,
        scaley: options.spacingy,
        rotatex: 0,
        rotatey: 0,
        shearx: 0,
        sheary: 0,

        invertedScroll: options.invertedScroll,
        scrollSensitivity: options.scrollSensitivity,
    })

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

    // Add the mirror lines
    let mirrorLines = []
    if (mirrorState === mirror.VERT || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
    }
    if (mirrorState === mirror.HORZ || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={0} y1={halfy} x2="100%" y2={halfy} stroke={options.mirrorColor}/>)
    }

    function onMouseMove(e){
        setDragging(e.buttons !== 0 ? true : dragging)
        dispatch({
            action: 'cursor moved',
            x: e.clientX,
            y: e.clientY,
        })
    }

    function onMouseDown(e){
        // eslint-disable-next-line default-case
        switch (e.button){
            // Left click
            case 0: dispatch({action: 'add line'}); break;
            // Middle click
            case 1: dispatch({action: 'delete'}); break;
            // Right click
            case 2: dispatch({action: 'continue line'}); break;
        }
    }

    function onMouseUp(e){
        if (dragging)
            dispatch({action: 'add line'})
        setDragging(false)
    }

    function onTouchMove(e){
        // Do this here, and not in onTouchStart, because when a touch tap happens, it triggers both
        // onMouseDown *and* onTouchStart. This ensures it only creates a line if it's moving
        if (curLine === null)
            dispatch({action: 'add line'})
        setDragging(true)

        dispatch({
            action: 'cursor moved',
            x: (e.touches[0] || e.changedTouches[0]).pageX,
            y: (e.touches[0] || e.changedTouches[0]).pageY,

        })
    }

    function onTouchEnd(e){
        if (dragging)
            dispatch({action: 'add line'})
        setDragging(false)
    }

    return (
        <div className="App">
            {/* <samp><kbd>Shift</kbd></samp> */}
            <svg id='paper'
                width="100%"
                height="101vh"
                onMouseMove={onMouseMove}
                onKeyDown={e => dispatch({action: 'key press', event: e})}
                tabIndex={0}
                onMouseDown={onMouseDown}
                onTouchMove={onTouchMove}
                // TODO:
                // onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseUp={onMouseUp}
                onWheel={e => dispatch({
                    action: 'translate',
                    x: e.deltaX,
                    y: e.deltaY,
                })}
                onCopy={e => dispatch({action: 'copy'})}
                onPaste={e => dispatch({action: 'paste'})}
                onCut={e => dispatch({action: 'cut'})}
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
                            key={`bound-${bound[0]}-${bound[1]}`}
                        />
                    )}
                </g>

                {/* Draw the bound rect */}
                {boundRect && <rect
                    width={boundRect?.right - boundRect?.left}
                    height={boundRect?.bottom - boundRect?.top}
                    x={boundRect?.left}
                    y={boundRect?.top}
                    stroke={options.selectionBorderColor}
                    fillOpacity={options.selectionOpacity}
                    fill={options.selectionColor}
                    rx={partials ? 4 : 0}
                />}

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
