import './styling/App.css';
import {useEffect, useReducer, useRef, useState} from 'react';
import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE, localStorageSettingsName} from './globals'
import reducer from './reducer';
import {align, calc, defaultTrellisControl, distCenter, mobileAndTabletCheck} from './utils';
import options from './options';
import MainMenu from './Menus/MainMenu';
import {getTrellis} from './repeatEngine';
import {deserializeState} from './fileUtils';
import React from 'react';
import {applyTransformationFlip, applyTransformationRotation, getMirrored, getStateMirrored} from './mirrorEngine';

// Coordinate systems:
// absolute: relative to the viewport, origin is top left, not translated
// relative: translated, origin is the (0, 0) of the svg element
// scaled:   each dot is 1 more unit over than the previous, multiply by scale* to get the "drawable" value

// interface trellisControlVal<T> {
//     every: number,
//     val: T,
// }
// interface trellisControl<T> {
//     row: trellisControlVal<T>,
//     col: trellisControlVal<T>,
// }

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
        mobile: mobileAndTabletCheck(),
        // A hex color string
        stroke: options.stroke,
        // Coord: Scalar, not scaled
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
        // Coord: relative?, scaled
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

        trellis: false,
        // Coords: scalar, scaled
        // Type: number
        trellisOverlap: defaultTrellisControl({x: 0, y: 0}),
        // Type: bool
        trellisSkip: defaultTrellisControl(false),
        // Type: MIRROR_AXIS
        trellisFlip: defaultTrellisControl(MIRROR_AXIS.NONE_0),
        // Type: MIRROR_AXIS
        trellisRotate: defaultTrellisControl(MIRROR_AXIS.NONE_0),

        mirrorAxis: MIRROR_AXIS.VERT_90,
        // The second one is only used when mirrorMethod == BOTH, and it used for the Rotation one
        mirrorAxis2: MIRROR_AXIS.BOTH_360,
        mirrorType: MIRROR_TYPE.PAGE,
        mirrorMethod: MIRROR_METHOD.FLIP,

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
        deleteme: [],
        debug_rawCursorPos: [0, 0],

        paperColor: options.paperColor,
        doubleTapTimeMS: options.doubleTapTimeMS,

        openMenus: {
            main: false,
            controls: true,
            color: false,
            navigation: false,
            repeat: false,
            file: false,
            settings: false,
            help: false,
            mirror: false,
            key: false,
        },
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
        mirrorAxis,
        mirrorAxis2,
        mirrorType,
        mirrorMethod,
        trellis,
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
        debug_rawCursorPos,
        openMenus,
        paperColor,
        doubleTapTimeMS,
        deleteme,
    } = state

    const {
        halfx,
        halfy,
        offsetx,
        offsety,
        mirrorOriginx,
        mirrorOriginy,
        boundRect,
        relCursorPos,
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
                dispatch('nevermind')
                dispatch({action: 'translate',
                    x: -(prevCenterx - newCenterx),
                    y: -(prevCentery - newCentery),
                })
                // This line helps stablize translation
                if (Math.abs((prevDist - newDist) * scrollSensitivity) > .6 && enableGestureScale)
                    dispatch({action: 'scale',
                        amtx: -(prevDist - newDist) * scrollSensitivity,
                        amty: -(prevDist - newDist) * scrollSensitivity,
                        cx: newCenterx,
                        cy: newCentery
                    })
            } else {
                dispatch('nevermind')
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

    useEffect(() => {
        const local = localStorage.getItem(localStorageSettingsName)
        if (local)
            dispatch(deserializeState(local))
    }, [])

    // Get the mirrored current lines
    var curLines = []
    if (openMenus.mirror)
        curLines = getStateMirrored(state, () => '', false).map((transformation, i) => <line
            x1={curLine?.x1}
            y1={curLine?.y1}
            x2={cursorPos[0]}
            y2={cursorPos[1]}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
            transform={transformation}
            key={`mirror-${i}`}
        />)
    else
        curLines.push(<line
            x1={curLine?.x1}
            y1={curLine?.y1}
            x2={cursorPos[0]}
            y2={cursorPos[1]}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
            key='mirror0'
        />)


    // Get the mirror guide lines
    let mirrorLines = []

    if (mirrorType === MIRROR_TYPE.PAGE && openMenus.mirror){
        if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH){
            if ((mirrorAxis === MIRROR_AXIS.VERT_90 || mirrorAxis === MIRROR_AXIS.BOTH_360))
                mirrorLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor}/>)
            if ((mirrorAxis === MIRROR_AXIS.HORZ_180 || mirrorAxis === MIRROR_AXIS.BOTH_360))
                mirrorLines.push(<line x1={0} y1={halfy} x2="100%" y2={halfy} stroke={options.mirrorColor}/>)
        }
        if (mirrorMethod === MIRROR_METHOD.ROTATE || mirrorMethod === MIRROR_METHOD.BOTH)
            mirrorLines.push(<circle cx={halfx} cy={halfy} r={scalex/3} fill={options.mirrorColor} opacity={.8} strokeOpacity="0"/>)
    }

    // Drawing the currently selecting bound rect (when theres only 1 bound)
    const drawBoundRect = boundDragging && bounds.length === 1 ? {
        left:   Math.min(boundRect?.left,   relCursorPos[0]),
        right:  Math.max(boundRect?.right,  relCursorPos[0]),
        top:    Math.min(boundRect?.top,    relCursorPos[1]),
        bottom: Math.max(boundRect?.bottom, relCursorPos[1]),
    } : boundRect

    // Construct the cursor (internal mirror lines, etc)
    let cursor = [<circle
        cx={cursorPos[0]}
        cy={cursorPos[1]}
        r={scalex / 3}
        stroke={options.cursorColor}
        fill={options.mirrorColor}
        // Make it filled if we're cursor rotating
        fillOpacity={Number(
            openMenus.mirror &&
            mirrorType === MIRROR_TYPE.CURSOR &&
            [MIRROR_METHOD.ROTATE, MIRROR_METHOD.BOTH].includes(mirrorMethod))
        }
        key='cursor'
    />]
    if (openMenus.mirror && mirrorType === MIRROR_TYPE.CURSOR){
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

    // Clipboard translations
    let clipboardFlip = ''
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
                onMouseUp={onMouseUp}
                onBlur={onBlur}
                // These are implemented with keyboard shortcuts, so they can be changed
                // onCopy={e => dispatch({action: 'copy'})}
                // onPaste={e => dispatch({action: 'paste'})}
                // onCut={e => dispatch({action: 'cut'})}
                ref={paper}
                style={{backgroundColor: paperColor}}
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
                {debug && deleteme && <g
                    transform={`translate(${translationx} ${translationy}) scale(${scalex} ${scaley})`}
                >
                    {deleteme.map((i, cnt) => <circle cx={i[0]} cy={i[1]} r={4/scalex} fill='blue' key={`debug-${cnt}`}/>)}
                    {/* {deleteme.map(i => <circle cx={i.x} cy={i.y} r={4/scalex} fill='blue'/>)} */}
                </g>}
                {debug && <circle cx={debug_rawCursorPos[0]} cy={debug_rawCursorPos[1]} fill="grey" r='5'/>}

                {/* Draw the trellis */}
                {/* translate(${alignedTranslation[0]},
                          ${alignedTranslation[1]}) */}
                <g transform={`
                    scale(${scalex} ${scaley})
                `}>
                    {((trellis || openMenus.repeat) && bounds.length > 1) && getTrellis(state)}
                </g>

                {/* Draw the cursor */}
                <g>{cursor}</g>

                {/* Draw the lines */}
                <g id='lines' transform={`translate(${translationx} ${translationy}) scale(${scalex} ${scaley})`}>
                    {lines}
                </g>

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
                    width={(drawBoundRect?.width) * scalex}
                    height={(drawBoundRect?.height) * scaley}
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
