import './App.css';
import {useEffect, useReducer, useRef, useState} from 'react';
import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE, MODE} from './globals'
import reducer from './reducer';
import {calc, distCenter, getSelected, mobileAndTabletCheck} from './utils';
import options from './options';
import MainMenu from './MainMenu';
import {getTrellis} from './repeatEngine';


// Coordinate systems:
// absolute: relative to the viewport, origin is top left, not translated
// relative: translated, origin is the (0, 0) of the svg element
// scaled:   each dot is 1 more unit over than the previous, multiply by scale* to get the "drawable" value

// Disable the default right click menu
window.oncontextmenu = () => false

// This has to be a global variable instead of a state, because we attach the touchMove listener function directly,
// so we can have it not capture passively, so we can prevent default
// null or a 2 item list of the previous touches
var gestureTouches = null

export default function App() {
    const boundsGroup = useRef()
    const paper = useRef()

    const [dragging, setDragging] = useState(false)
    const [boundDragging, setBoundDragging] = useState(false)

    const [state, dispatch] = useReducer(reducer, {
        // mobile: window.innerWidth <= 768,
        mobile: mobileAndTabletCheck(),
        // A hex color string
        stroke: options.stroke,
        strokeWidth: options.strokeWidth,
        // A list of hex color strings that gets shifted
        commonColors: new Array(options.commonColorAmt).fill(options.stroke),
        // "a series of comma and/or whitespace separated numbers"
        // The numbers are scaled
        dash: "0",

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
        // Coord: relative, scaled
        eraser: null,
        // A list of <line> objects, or null
        // Coord: absolute, scaled
        clipboard: null,
        // In degrees
        clipboardRotation: 0,
        // Of type MIRROR_AXIS or null
        clipboardMirrorAxis: null,

        repeating: false,

        mirroring: false,
        mirrorAxis: MIRROR_AXIS.VERT_90,
        // The second one is only used when mirrorMethod == BOTH, and it used for the Rotation one
        mirrorAxis2: MIRROR_AXIS.VERT_90,
        mirrorType: MIRROR_TYPE.PAGE,
        mirrorMethod: MIRROR_METHOD.FLIP,

        mode: MODE.DRAW,

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
        hideHexColor: options.hideHexColor,
        maxUndoAmt: options.maxUndoAmt,
        enableGestureScale: options.enableGestureScale,
        debug: false,
    })

    const {
        mobile,
        cursorPos,
        stroke,
        dash,
        commonColors,
        strokeWidth,
        partials,
        lines,
        curLine,
        bounds,
        clipboardRotation,
        clipboardMirrorAxis,
        mirroring,
        mirrorAxis,
        mirrorAxis2,
        mirrorType,
        mirrorMethod,
        repeating,
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
        enableGestureScale,
        debug,
    } = state

    const {
        halfx,
        halfy,
        boundRect,
    } = calc(state)

    const boundRadius = scalex / 1.5

    function onMouseMove(e){
        // console.log('mouse moved')
        if (e.buttons !== 0)
            setDragging(true)
        setBoundDragging(true)
        dispatch({
            action: 'cursor moved',
            x: e.clientX,
            y: e.clientY,
        })
    }

    function onMouseDown(e){
        // console.log('mouse down')
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
        // console.log('mouse up')
        if (dragging)
            dispatch({action: 'add line'})
        setDragging(false)
    }

    function onTouchMove(e){
        e.preventDefault()
        if (e.touches.length === 2){
            if (gestureTouches !== null){
                const {distance: newDist, centerx:newCenterx, centery:newCentery} = distCenter(
                    e.touches[0].pageX, e.touches[0].pageY,
                    e.touches[1].pageX, e.touches[1].pageY,
                )

                const {distance: prevDist, centerx:prevCenterx, centery:prevCentery} = distCenter(
                    gestureTouches[0].pageX, gestureTouches[0].pageY,
                    gestureTouches[1].pageX, gestureTouches[1].pageY,
                )
                dispatch({action: 'nevermind'})
                dispatch({action: 'translate',
                    x: -(prevCenterx - newCenterx),
                    y: -(prevCentery - newCentery),
                })
                // This line helps stablize translation
                if (Math.abs((prevDist - newDist) * scrollSensitivity) > .5 && enableGestureScale)
                    dispatch({action: 'scale',
                        amtx: -(prevDist - newDist) * scrollSensitivity,
                        amty: -(prevDist - newDist) * scrollSensitivity,
                        cx: newCenterx,
                        cy: newCentery
                    })
            } else {
                dispatch({action: 'nevermind'})
            }
            gestureTouches = e.touches
        } else if (e.touches.length === 1 && gestureTouches === null){
            const touch = (e.touches[0] || e.changedTouches[0])
            dispatch({
                action: 'cursor moved',
                x: touch.pageX,
                y: touch.pageY,
            })
        }
    }

    function onTouchEnd(e){
        e.preventDefault()
        if (!clipboard)
            dispatch({action: 'add line'})
        gestureTouches = null
    }

    function onTouchStart(e){
        // console.log('touch start')
        e.preventDefault()
        const touch = (e.touches[0] || e.changedTouches[0])
        dispatch({
            action: 'cursor moved',
            x: touch.pageX,
            y: touch.pageY,
        })
        if (!clipboard)
            dispatch({action: 'add line'})
    }

    function onScroll(e){
        // console.log('scrolled')
        if (e.shiftKey)
            dispatch({
                action: 'translate',
                x: e.deltaY * scrollSensitivity * (invertedScroll ? -1 : 1),
                y: e.deltaX * scrollSensitivity * (invertedScroll ? -1 : 1),
            })
        else if (e.ctrlKey){
            // Disable the broswer zoom shortcut
            e.preventDefault()
            dispatch({action: 'scale',
                amtx: (e.deltaY / 8) * scrollSensitivity * (invertedScroll ? -1 : 1),
                amty: (e.deltaY / 8) * scrollSensitivity * (invertedScroll ? -1 : 1),
                // cx: cursorPos[0], cy:
                // cursorPos[1]
            })
        }
        else
            dispatch({
                action: 'translate',
                x: e.deltaX * scrollSensitivity * (invertedScroll ? -1 : 1),
                y: e.deltaY * scrollSensitivity * (invertedScroll ? -1 : 1),
            })
    }

    // This keeps the focus always on the paper element
    function onBlur() {
        setTimeout(function() {
            if (document.activeElement.nodeName !== 'INPUT' || document.activeElement.type === 'checkbox')
                paper.current.focus()
        }, 100);
    }

    useEffect(() => {
        // See https://stackoverflow.com/questions/63663025/react-onwheel-handler-cant-preventdefault-because-its-a-passive-event-listenev
        // for why we have to do it this way (because of the zoom browser shortcut)
        paper.current.addEventListener('wheel', onScroll, { passive: false })
        paper.current.addEventListener('touchend', onTouchEnd, { passive: false })
        paper.current.addEventListener('touchstart', onTouchStart, { passive: false })
        paper.current.addEventListener('touchmove', onTouchMove, { passive: false })
        // paper.current.addEventListener('keydown', onKeyDown, { passive: false })
        return () => {
            paper.current?.removeEventListener('wheel', onScroll)
            paper.current?.removeEventListener('touchend', onTouchEnd)
            paper.current?.removeEventListener('touchstart', onTouchStart)
            paper.current?.removeEventListener('touchmove', onTouchMove)
            // paper.current?.removeEventListener('keydown', onKeyDown)
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
        strokeWidth: strokeWidth,
        strokeDasharray: dash,
    }
    let curLines = [<line {...curLineProps} key='mirror0' />]
    const originx = mirrorType === MIRROR_TYPE.PAGE ? halfx : curLine?.x1
    const originy = mirrorType === MIRROR_TYPE.PAGE ? halfy : curLine?.y1

    if (mirroring){
        if (((mirrorAxis === MIRROR_AXIS.VERT_90 || mirrorAxis === MIRROR_AXIS.BOTH_360))){
            mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
            if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH)
                curLines.push(<line {...curLineProps} transform={`matrix(-1, 0, 0, 1, ${originx*2}, 0)`} key='mirror1' />)
            if (mirrorMethod === MIRROR_METHOD.ROTATE)
                curLines.push(<line {...curLineProps} transform={`rotate(90, ${originx}, ${originy})`} key='mirror2' />)
        }
        if (((mirrorAxis === MIRROR_AXIS.HORZ_180 || mirrorAxis === MIRROR_AXIS.BOTH_360))){
            mirrorLines.push(<line x1={0} y1={halfy} x2="100%" y2={halfy} stroke={options.mirrorColor}/>)
            if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH)
                curLines.push(<line {...curLineProps} transform={`matrix(1, 0, 0, -1, 0, ${originy*2})`} key='mirror3' />)
            if (mirrorMethod === MIRROR_METHOD.ROTATE)
                curLines.push(<line {...curLineProps} transform={`rotate(180, ${originx}, ${originy})`} key='mirror4' />)
        }
        if ((mirrorAxis === MIRROR_AXIS.BOTH_360)){
            if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH)
                curLines.push(<line {...curLineProps} transform={`matrix(-1, 0, 0, -1, ${originx*2}, ${originy*2})`} key='mirror5'/>)
            if (mirrorMethod === MIRROR_METHOD.ROTATE)
                curLines.push(<line {...curLineProps} transform={`rotate(270, ${originx}, ${originy})`} key='mirror6' />)
        }
        if (mirrorMethod === MIRROR_METHOD.BOTH){
            if (mirrorAxis2 === MIRROR_AXIS.VERT_90 || mirrorAxis2 === MIRROR_AXIS.BOTH_360){
                curLines.push(<line {...curLineProps} transform={`rotate(90, ${originx}, ${originy})`} key='mirror2' />)
                curLines.push(<line {...curLineProps} transform={`matrix(1, 0, 0, -1, 0, ${originy*2}) rotate(90, ${originx} ${originy})`} key='mirror8' />)
            }
            if (mirrorAxis2 === MIRROR_AXIS.HORZ_180 || mirrorAxis2 === MIRROR_AXIS.BOTH_360){
                // Optimization: 180 degree rotation == flipping both vertically & horizontally: that line already exists
                if (mirrorAxis !== MIRROR_AXIS.BOTH_360)
                    curLines.push(<line {...curLineProps} transform={`rotate(180, ${originx}, ${originy})`} key='mirror4' />)
                curLines.push(<line {...curLineProps} transform={`matrix(1, 0, 0, -1, 0, ${originy*2}) rotate(270, ${originx} ${originy})`} key='mirror7' />)
            }
            if (mirrorAxis2 === MIRROR_AXIS.BOTH_360)
                curLines.push(<line {...curLineProps} transform={`rotate(270, ${originx}, ${originy})`} key='mirror6' />)
            // This is only sort of part of the pattern: In this particular circumstance, I want it to have both.
            if (mirrorAxis2 === MIRROR_AXIS.HORZ_180 && mirrorAxis === MIRROR_AXIS.BOTH_360)
                curLines.push(<line {...curLineProps} transform={`matrix(1, 0, 0, -1, 0, ${originy*2}) rotate(90, ${originx} ${originy})`} key='mirror8' />)
        }
    }

    if (mirrorMethod === MIRROR_METHOD.ROTATE &&
        mirrorType === MIRROR_TYPE.PAGE &&
        mirrorAxis !== MIRROR_AXIS.BOTH_360
    ) mirrorLines = []

    if ((mirrorMethod === MIRROR_METHOD.ROTATE || mirrorMethod === MIRROR_METHOD.BOTH) &&
        mirrorType === MIRROR_TYPE.PAGE
    ) mirrorLines.push(<circle cx={halfx} cy={halfy} r={scalex/3} fill={options.mirrorColor} opacity={.8} strokeOpacity="0"/>)

    const drawBoundRect = boundDragging && bounds.length === 1 ? {
        left:   Math.min(boundRect?.left,   cursorPos[0] / scalex),
        right:  Math.max(boundRect?.right,  cursorPos[0] / scalex),
        top:    Math.min(boundRect?.top,    cursorPos[1] / scaley),
        bottom: Math.max(boundRect?.bottom, cursorPos[1] / scaley),
    } : boundRect

    // Construct the cursor
    let cursor = [<circle
        cx={cursorPos[0]}
        cy={cursorPos[1]}
        r={scalex / 3}
        stroke={options.cursorColor}
        fill={options.mirrorColor}
        // Make it filled if we're cursor rotating
        fillOpacity={Number(
            mirroring &&
            mirrorType === MIRROR_TYPE.CURSOR &&
            [MIRROR_METHOD.ROTATE, MIRROR_METHOD.BOTH].includes(mirrorMethod))
        }
        key={'cursor'}
    />]
    if (mirroring && mirrorType === MIRROR_TYPE.CURSOR){
        if ([MIRROR_METHOD.FLIP, MIRROR_METHOD.BOTH].includes(mirrorMethod)){
            if ([MIRROR_AXIS.HORZ_180, MIRROR_AXIS.BOTH_360].includes(mirrorAxis))
                cursor.push(<line
                    x1={cursorPos[0] + scalex/3} y1={cursorPos[1]}
                    x2={cursorPos[0] - scalex/3} y2={cursorPos[1]}
                    stroke={options.mirrorColor}
                    key='cursor-horz'
                />)
            if ([MIRROR_AXIS.VERT_90, MIRROR_AXIS.BOTH_360].includes(mirrorAxis))
                cursor.push(<line
                    x1={cursorPos[0]} y1={cursorPos[1] + scalex/3}
                    x2={cursorPos[0]} y2={cursorPos[1] - scalex/3}
                    stroke={options.mirrorColor}
                    key="cursor-vert"
                />)
        }
    }

    let clipboardFlip = ''
    // eslint-disable-next-line default-case
    if (clipboardMirrorAxis === MIRROR_AXIS.VERT_90 || clipboardMirrorAxis === MIRROR_AXIS.BOTH_360)
        clipboardFlip += `matrix(-1, 0, 0, 1, ${cursorPos[0]*2}, 0) `
    if (clipboardMirrorAxis === MIRROR_AXIS.HORZ_180 || clipboardMirrorAxis === MIRROR_AXIS.BOTH_360)
        clipboardFlip += `matrix(1, 0, 0, -1, 0, ${cursorPos[1]*2}) `


    return (
        <div className="App">
            <MainMenu dispatch={dispatch} state={state}/>
            {/* <samp><kbd>Shift</kbd></samp> */}
            <svg id='paper'
                width="100%"
                height="101vh"
                onMouseMove={onMouseMove}
                onKeyDown={e => dispatch({action: 'key press', event: e})}
                tabIndex={0}
                onMouseDown={onMouseDown}
                // onTouchMove={onTouchMove}
                // onTouchEnd={onTouchEnd}
                // onTouchEnd={onTouchStart}
                onMouseUp={onMouseUp}
                onBlur={onBlur}
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

                {/* Draw the trellis */}
                {repeating && getTrellis(state)}

                {/* Draw the cursor */}
                <g>{cursor}</g>

                {/* Draw the lines */}
                <g id='lines' transform={`translate(${translationx} ${translationy}) scale(${scalex} ${scaley})`}> {lines} </g>

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
                    // We need to re-add the translation here because we're subtracting it out
                    // Or maybe not??
                    width={(drawBoundRect?.right - drawBoundRect?.left) * scalex}
                    height={(drawBoundRect?.bottom - drawBoundRect?.top) * scaley}
                    x={drawBoundRect?.left * scalex + translationx}
                    y={drawBoundRect?.top * scaley + translationy}
                    stroke={options.selectionBorderColor}
                    fillOpacity={options.selectionOpacity}
                    fill={options.selectionColor}
                    rx={partials ? 4 : 0}
                />}

                {/* Draw the mirror lines */}
                {mirrorType === MIRROR_TYPE.PAGE && mirrorLines}

                {/* Draw the eraser placeholder */}
                {eraser && [
                    <line
                        x1={(eraser[0] * scalex) - scalex / 3 + translationx}
                        y1={(eraser[1] * scaley) - scaley / 3 + translationy}
                        x2={(eraser[0] * scalex) + scalex / 3 + translationx}
                        y2={(eraser[1] * scaley) + scaley / 3 + translationy}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                        key="eraser1"
                    />,
                    <line
                        x1={(eraser[0] * scalex) + scalex / 3 + translationx}
                        y1={(eraser[1] * scaley) - scaley / 3 + translationy}
                        x2={(eraser[0] * scalex) - scalex / 3 + translationx}
                        y2={(eraser[1] * scaley) + scaley / 3 + translationy}
                        stroke={options.eraserColor}
                        strokeWidth={options.eraserWidth}
                        key="eraser2"
                    />
                ]}

                {/* Draw the current clipboard */}
                <g transform={`
                    ${clipboardFlip}
                    rotate(${clipboardRotation}, ${cursorPos[0]}, ${cursorPos[1]})
                    translate(${cursorPos[0]} ${cursorPos[1]})
                    scale(${scalex} ${scaley})
                `}>
                    {clipboard}
                </g>
            </svg>
        </div>
    )
}
