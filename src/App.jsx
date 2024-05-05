import './App.css';
import {useEffect, useReducer, useRef, useState} from 'react';
import * as actions from './reducer.jsx'
import {mirror} from './globals'
import reducer from './reducer';
import {calc, eventMatchesKeycode, invertObject, pointIn} from './utils';
import options from './options';
import { keybindings } from './options.jsx'

// TODO: can't add bounds until after a line has been made
// TODO: ctrl+c will trigger if ctrl+shift+c is pressed
// TODO: another mirror state that is just "mirror, with the origin being wherever I click":
// curLines.push(<line {...curLineProps} transform={`
//             translate(${(curLine?.x1 + offsetx)} 0)
//             matrix(-1, 0, 0, 1, 0, 0)
//             translate(${-(curLine?.x1 + offsetx)} 0)
//             `
//         } key='mirror2'/>)
// TODO: this is also cool:
// curLines.push(<line {...curLineProps} transform={`
//             rotate(90, ${halfx}, ${halfy})
//             `
// TODO: also just repeat the same thing in 4 corners:
// curLines.push(<line {...curLineProps} transform={`
//             translate(${(curLine?.x1 + offsetx)} 0)
//             matrix(1, 0, 0, 1, 10, 10)
//             translate(${halfx - (curLine?.x1 + offsetx)} 0)
//         `
// TODO: a rotation "mirror" state
// TODO: shift is dismissing bounds

// Coordinate systems:
// absolute: relative to the viewport, origin is top left, not translated
// relative: translated, origin is the (0, 0) of the svg element
// scaled:   each dot is 1 more unit over than the previous, multiply by scale* to get the "drawable" value

// Disable the default right click menu
window.oncontextmenu = () => false

export default function App() {
    const boundsGroup = useRef()
    const paper = useRef()
    const [dragging, setDragging] = useState(false)
    const [boundDragging, setBoundDragging] = useState(false)

    const [state, dispatch] = useReducer(reducer, {
        stroke: options.stroke,
        strokeWidth: options.strokeWidth,

        // The position of the circle we're drawing to act as a cursor in our application, NOT the actual mouse position
        // Coord: absolute, not scaled
        cursorPos: [0, 0],
        // A list of <line> objects
        // Coord: relative, scaled
        lines: [],
        // {x1: float, y1: float} or null
        // Coord: absolute?, not scaled
        curLine: null,
        // A list of [x, y]
        // Coord: relative, scaled
        bounds: [],
        // [x, y] or null
        // Coord: ??
        eraser: null,
        // A list of <line> objects, or null
        // Coord: absolute, scaled?
        clipboard: null,

        // pattern: null,

        mirrorState: mirror.NONE,

        // Coord: not scaled
        translationx: 0,
        translationy: 0,
        scalex: options.scalex,
        scaley: options.scaley,
        rotatex: 0,
        rotatey: 0,
        shearx: 0,
        sheary: 0,

        // Options
        removeSelectionAfterDelete: options.removeSelectionAfterDelete,
        partials: options.partials,
        invertedScroll: options.invertedScroll,
        scrollSensitivity: options.scrollSensitivity,
        debug: options.debug,
    })

    const {
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
        debug,
    } = state

    const {
        halfx,
        halfy,
        boundRect,
        relCursorPos,
        scaledTranslationx,
        scaledTranslationy,
    } = calc(state)

    const boundRadius = scalex / 1.5

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

    function onScroll(e){
        if (e.shiftKey)
            dispatch({
                action: 'translate',
                x: e.deltaY,
                y: e.deltaX,
            })
        else if (e.ctrlKey){
            // Disable the broswer zoom shortcut
            e.preventDefault()
            dispatch({
                action: 'scale',
                amt: e.deltaY,
            })
        }
        else
            dispatch({
                action: 'translate',
                x: e.deltaX,
                y: e.deltaY,
            })
    }

    function onKeyDown(e){
        console.log('key down: ', e.key);
        if (eventMatchesKeycode(e, invertObject(keybindings)["add bound"]))
            setBoundDragging(true)
        if (!boundDragging)
            dispatch({action: 'key press', event: e})
    }

    function onKeyUp(e){
        // For the bounds dragging
        setBoundDragging(false)
        if (eventMatchesKeycode(e, invertObject(keybindings)["add bound"]) &&
            boundDragging &&
            !pointIn(bounds, cursorPos
        ))
            dispatch({action: 'add bound'})

    }

    useEffect(() => {
        // See https://stackoverflow.com/questions/63663025/react-onwheel-handler-cant-preventdefault-because-its-a-passive-event-listenev
        // for why we have to do it this way (because of the zoom browser shortcut)
        paper.current.addEventListener('wheel', onScroll, { passive: false })
        return () => {
            paper.current.removeEventListener('wheel', onScroll)
        }
    }, [])

    // Add the mirror lines
    let mirrorLines = []
    const curLineProps = {
        x1: curLine?.x1,
        y1: curLine?.y1,
        x2: cursorPos[0],
        y2: cursorPos[1],
        stroke: stroke,
    }
    let curLines = [<line {...curLineProps} key='mirror1' />]
    if (mirrorState === mirror.VERT || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
        curLines.push(<line {...curLineProps}
            transform={`matrix(-1, 0, 0, 1, ${halfx*2}, 0)`}
            key='mirror2'
        />)
    }
    if (mirrorState === mirror.HORZ || mirrorState === mirror.BOTH){
        mirrorLines.push(<line x1={0} y1={halfy} x2="100%" y2={halfy} stroke={options.mirrorColor}/>)
        curLines.push(<line {...curLineProps}
            transform={`matrix(1, 0, 0, -1, 0, ${halfy*2})`}
            key='mirror2'
        />)
    }
    if (mirrorState === mirror.BOTH){
        curLines.push(<line {...curLineProps} transform={`matrix(-1, 0, 0, -1, ${halfx*2}, ${halfy*2})`} key='mirror4'/>)
    }

    const draggingBoundRect = {
        left:   Math.min(boundRect?.left,   cursorPos[0] / scalex),
        right:  Math.max(boundRect?.right,  cursorPos[0] / scalex),
        top:    Math.min(boundRect?.top,    cursorPos[1] / scaley),
        bottom: Math.max(boundRect?.bottom, cursorPos[1] / scaley),
    }

    return (
        <div className="App">
            {/* <samp><kbd>Shift</kbd></samp> */}
            <svg id='paper'
                width="100%"
                height="101vh"
                onMouseMove={onMouseMove}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                tabIndex={0}
                onMouseDown={onMouseDown}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseUp={onMouseUp}
                // These are implemented with keyboard shortcuts, so they can be changed
                // onCopy={e => dispatch({action: 'copy'})}
                // onPaste={e => dispatch({action: 'paste'})}
                // onCut={e => dispatch({action: 'cut'})}
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

                {/* Draw the debug info */}
                {debug && <circle cx={translationx} cy={translationy} r='8' fill='blue'/>}
                {debug && <text x="80%" y='20'>{`Translation: ${Math.round(translationx)}, ${Math.round(translationy)}`}</text>}
                {debug && <text x="80%" y='40'>{`Scale: ${Math.round(scalex)}, ${Math.round(scaley)}`}</text>}

                {/* Draw the cursor */}
                <circle
                    cx={cursorPos[0]}
                    cy={cursorPos[1]}
                    r={scalex / 3}
                    stroke={options.cursorColor}
                    fillOpacity={0}
                />

                {/* Draw the lines */}
                <g id='lines' transform={`translate(${translationx} ${translationy}) scale(${scalex} ${scaley})`}> {lines} </g>
                {/* <g id='lines' transform={`translate(${translationx} ${translationy})`}> {lines} </g> */}

                {/* Draw the current line */}
                {curLine && <g>{curLines}</g>}

                {/* Draw the bounds */}
                <g id='bounds' ref={boundsGroup}>
                    {bounds.map(bound =>
                        <rect
                            width={boundRadius}
                            height={boundRadius}
                            x={(bound[0] * scalex) - (boundRadius / 2) + translationx}
                            y={(bound[1] * scaley) - (boundRadius / 2) + translationy}
                            rx={partials ? 4 : 0}
                            stroke={options.boundColor}
                            fillOpacity={0}
                            key={`bound-${bound[0]}-${bound[1]}`}
                        />
                    )}
                </g>

                {/* Draw the selection rect */}
                {boundRect && <rect
                    width={(boundRect?.right - boundRect?.left) * scalex}
                    height={(boundRect?.bottom - boundRect?.top) * scaley}
                    x={(boundRect?.left) * scalex}
                    y={(boundRect?.top) * scaley}
                    stroke={options.selectionBorderColor}
                    fillOpacity={options.selectionOpacity}
                    fill={options.selectionColor}
                    rx={partials ? 4 : 0}
                />}
                {/* Draw the dragging selection rect */}
                {boundDragging && bounds.length === 1 && <rect
                    width={(draggingBoundRect?.right - draggingBoundRect?.left) * scalex}
                    height={(draggingBoundRect?.bottom - draggingBoundRect?.top) * scaley}
                    x={(draggingBoundRect?.left) * scalex}
                    y={(draggingBoundRect?.top) * scaley}
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
                        x1={eraser[0] - scalex / 3 + translationx}
                        y1={eraser[1] - scaley / 3 + translationy}
                        x2={eraser[0] + scalex / 3 + translationx}
                        y2={eraser[1] + scaley / 3 + translationy}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                    />,
                    <line
                        x1={eraser[0] + scalex / 3 + translationx}
                        y1={eraser[1] - scaley / 3 + translationy}
                        x2={eraser[0] - scalex / 3 + translationx}
                        y2={eraser[1] + scaley / 3 + translationy}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                    />
                ]}

                {/* Draw the current clipboard */}
                <g transform={`scale(${scalex} ${scaley}) translate(${cursorPos[0] - 1} ${cursorPos[1] - 1})`}> {clipboard} </g>
            </svg>
        </div>
    )
}
