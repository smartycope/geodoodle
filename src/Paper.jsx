import './styling/App.css';
import {useEffect, useReducer, useRef, useState} from 'react';
import {
    MIRROR_AXIS,
    MIRROR_METHOD,
    MIRROR_TYPE,
    localStorageSettingsName,
    tapHolding,
    setTapHolding,
    selected,
    setSelected
} from './globals'
import reducer from './reducer';
import {align, calc, defaultTrellisControl, distCenter, mobileAndTabletCheck, pointEq} from './utils';
import options from './options';
import MainMenu from './Menus/MainMenu';
import {getTrellis} from './repeatEngine';
import {deserializeState} from './fileUtils';
import {getStateMirrored} from './mirrorEngine';
import { RxRotateCounterClockwise } from "react-icons/rx";
import { GoMirror } from "react-icons/go";
import {FaCheck} from 'react-icons/fa6';
import {StateContext} from './Contexts';
import {viewportWidth, viewportHeight} from './utils';

/*
 * Coordinate systems:
 * absolute: relative to the viewport, origin is top left, not translated
 * relative: translated, origin is the (0, 0) of the svg element
 * scaled:   each dot is 1 more unit over than the previous, multiply by scale* to get the "drawable" value
 */

/*
 * interface trellisControlVal<T> {
 *     every: number,
 *     val: T,
 * }
 * interface trellisControl<T> {
 *     row: trellisControlVal<T>,
 *     col: trellisControlVal<T>,
 * }
 */

// This has to be a global variable instead of a state, because we attach the touchMove listener function directly,
// so we can have it not capture passively, so we can prevent default
// null or a 2 item list of the previous touches
var gestureTouches = null
var withinDoubleTapTime = false
var lastTapPos = [-10,-10]
// This is for the mouse/touch events that need to be bound non-passively, but also need access to the state
// This is hacky, but I can't think of a better way
var _state = {}
var touchHoldTimer = null

function constructCursor(state){
    const {cursorPos, scalex, mirroring, openMenus, mirrorType, mirrorMethod, mirrorAxis} = state
    let cursor = [
        <circle
            cx={cursorPos[0]}
            cy={cursorPos[1]}
            r={scalex / 3}
            stroke={options.cursorColor}
            fill={options.mirrorColor}
            // Make it filled if we're cursor rotating
            fillOpacity={Number(
                (mirroring || openMenus.mirror) &&
                mirrorType === MIRROR_TYPE.CURSOR &&
                [MIRROR_METHOD.ROTATE, MIRROR_METHOD.BOTH].includes(mirrorMethod))
            }
            key='cursor'
        />
        // To add a shadow to the cursor
        // <circle
            // cx={cursorPos[0]+3}
            // cy={cursorPos[1]+2}
            // r={scalex / 3}
            // stroke={'gray'}
            // alpha=".8"
            // fill={options.mirrorColor}
            // // Make it filled if we're cursor rotating
            // fillOpacity={Number(
            //     (mirroring || openMenus.mirror) &&
            //     mirrorType === MIRROR_TYPE.CURSOR &&
            //     [MIRROR_METHOD.ROTATE, MIRROR_METHOD.BOTH].includes(mirrorMethod))
            // }
            // key='cursor-shadow'
        // />]
    ]
    if ((mirroring || openMenus.mirror) && mirrorType === MIRROR_TYPE.CURSOR){
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
    return cursor
}

export default function Paper({setDispatch}) {
    const boundsGroup = useRef()
    const paper = useRef()

    const [dragging, setDragging] = useState(false)
    const [boundDragging, setBoundDragging] = useState(false)

    const isMobile = mobileAndTabletCheck()
    const [state, dispatch] = useReducer(reducer, {
        mobile: isMobile,
        defaultScalex: isMobile ? 30 : 20,
        defaultScaley: isMobile ? 30 : 20,
        
        // The index of the currently selected color to draw lines in (and also dash and width)
        // 0 indexed
        currentLineColorProfileIndex: 0,
        // A list of hex color string
        stroke: Array(options.commonColorAmt).fill(options.stroke),
        // Coord: Scalar, not scaled
        strokeWidth: Array(options.commonColorAmt).fill(.05),
        // A list of hex color strings that gets shifted
        // commonColors: Array(options.commonColorAmt).fill(options.stroke),
        // "a series of comma and/or whitespace separated numbers"
        // The numbers are scaled
        dash: Array(options.commonColorAmt).fill('0'),
        
        // The index of the currently selected color to fill polygons in with
        // 0 indexed
        currentFillColorProfileIndex: 0,
        // A list of hex color string
        fill: Array(options.commonColorAmt).fill(options.fill),

        fillMode: false,
        // Constructed when we transition into fillMode, null otherwise
        // FeatureCollection<Polygon>
        // Coord: relative, scaled
        polygons: null,
        // The polygon that the mouse is over currently
        // Coord: relative, scaled
        intersectingPolygon: null,
        // A list of polygons (as svg polygon objects) that have been filled. We draw these
        // Coord: relative, scaled
        filledPolys: [],
        
        filename: "",
        // The side of page we have the menu bound to: left, right, top, or bottom
        side: viewportWidth() < viewportHeight() ? 'top' : 'right',

        // The position of the circle we're drawing to act as a cursor in our application, NOT the actual mouse position
        // Coord: absolute, not scaled
        cursorPos: [0, 0],
        // A list of <line> objects, or undefined ()
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
        hideDots: false,

        mirroring: false,
        mirrorAxis: MIRROR_AXIS.VERT_90,
        // The second one is only used when mirrorMethod == BOTH, and it used for the Rotation one
        mirrorAxis2: MIRROR_AXIS.BOTH_360,
        mirrorType: MIRROR_TYPE.PAGE,
        mirrorMethod: MIRROR_METHOD.FLIP,

        // Coord: absolute, not scaled
        translationx: 0,
        translationy: 0,
        scalex: isMobile ? 30 : 20,
        scaley: isMobile ? 30 : 20,
        // In degrees
        rotate: 0,
        shearx: 0,
        sheary: 0,

        // Options
        removeSelectionAfterDelete: options.removeSelectionAfterDelete,
        partials: options.partials,
        invertedScroll: options.invertedScroll,
        scrollSensitivity: options.scrollSensitivity,
        gestureTranslateSensitivity: 1,
        gestureScaleSensitivity: .3,
        smoothGestureScale: false,
        // One of options.extraButtons
        extraButton: 'home',
        hideHexColor: options.hideHexColor,
        maxUndoAmt: options.maxUndoAmt,
        enableGestureScale: options.enableGestureScale,
        inTour: false,

        debug: false,
        deleteme: [],
        debug_rawCursorPos: [0, 0],

        paperColor: options.paperColor,
        doubleTapTimeMS: options.doubleTapTimeMS,
        holdTapTimeMS: options.holdTapTimeMS,

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
            extra: false,
            // undo: false,
            select: false,
            clipboard: false,
            delete: false,
        },
    })

    const {
        mobile,
        cursorPos,
        stroke,
        dash,
        currentLineColorProfileIndex,
        currentFillColorProfileIndex,
        fill,
        rotate,
        lineCap,
        lineJoin,
        strokeWidth,
        partials,
        lines,
        curLine,
        bounds,
        clipboardRotation,
        clipboardMirrorAxis,
        mirrorAxis,
        mirrorType,
        mirrorMethod,
        trellis,
        eraser,
        clipboard,
        translationx,
        translationy,
        mirroring,
        scalex,
        scaley,
        debug,
        debug_rawCursorPos,
        openMenus,
        paperColor,
        hideDots,
        deleteme,
        fillMode,
        polygons,
        intersectingPolygon,
        filledPolys,
    } = state

    const {
        halfx,
        halfy,
        boundRect,
        relCursorPos,
        clipx, clipy,
    } = calc(state)


    _state = state
    const boundRadius = scalex / 1.5
    window.scrollX = 0
    window.scrollY = 0

    function onMouseMove(e){
        // console.log('mouse moved')
        if (e.buttons !== 0)
            setDragging(!fillMode)
        setBoundDragging(true)
        dispatch({
            action: 'cursor moved',
            x: e.clientX,
            y: e.clientY,
        })
    }

    function onMouseDown(e){
        // console.log('mouse down')
        switch (e.button){
            // Left click
            case 0: dispatch(fillMode ? 'fill' : 'add line'); break;
            // Middle click
            case 1: dispatch('delete'); break;
            // Right click
            case 2: fillMode ? null : dispatch('continue line'); break;
        }
    }

    function onMouseUp(){
        // console.log('mouse up')
        if (dragging)
            dispatch({action: 'add line'})
        setDragging(false)
    }

    function onDoubleTap(){
        // This is only for touches, mouse clicks aren't counted.
        // e is the event of the last touchend event, which is guranteed ("should") be within 1 scalex of the first tap
        dispatch({action: 'delete'})
    }

    function onTouchHold(){
        // This also only applies to touch events, not mouse events
        if (tapHolding && !fillMode){
            if (_state.clipboard?.length)
                dispatch({action: "paste"})
            else
                dispatch({action: "add bound"})
            setTapHolding(false)
        }
    }

    // This keeps the focus always on the paper element
    function onBlur() {
        setTimeout(function() {
            if (document.activeElement.nodeName !== 'INPUT' || document.activeElement.type === 'checkbox')
                paper.current.focus()
        }, 100);
    }

    // Capture touch events non-passively so we can prevent default
    useEffect(() => {
        function onTouchMove(e){
            e.preventDefault()
            if (e.touches.length === 2){
                // Immediately stop all double tap, tap and hold, dragging, and curLine
                setDragging(false)
                setTapHolding(false)
                clearTimeout(touchHoldTimer)
                withinDoubleTapTime = false
                // For good measure
                lastTapPos = [-10,-10]
                dispatch({curLine: null})

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
                        x: -(prevCenterx - newCenterx) * _state.gestureTranslateSensitivity,
                        y: -(prevCentery - newCentery) * _state.gestureTranslateSensitivity,
                    })
                    // TODO: enableGestureScale is broken
                    // This line helps stablize translation
                    if (Math.abs((prevDist - newDist) * _state.gestureScaleSensitivity) > .6 || !_state.smoothGestureScale){
                        dispatch({action: 'scale',
                            amtx: -(prevDist - newDist) * _state.gestureScaleSensitivity * .25,
                            amty: -(prevDist - newDist) * _state.gestureScaleSensitivity * .25,
                            cx: newCenterx,
                            cy: newCentery
                        })
                    }
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
            const touch = (e.touches[0] || e.changedTouches[0])
            // I don't know why, but for some reason this causes the time out to double, but seems to fix the problem I was
            // having, where timers overlap touches
            clearTimeout(touchHoldTimer)
            setTapHolding(false)

            if (!_state.clipboard?.length)
                dispatch({action: 'add line'})
            gestureTouches = null

            if (!withinDoubleTapTime){
                withinDoubleTapTime = true
                setTimeout(() => withinDoubleTapTime = false, _state.doubleTapTimeMS)
            } else if (pointEq(_state, lastTapPos, [touch.pageX, touch.pageY], _state.scalex)){
                withinDoubleTapTime = false
                onDoubleTap(e)
            }

            lastTapPos = [touch.pageX, touch.pageY]
        }

        function onTouchStart(e){
            // console.log('touch start')
            e.preventDefault()
            const touch = (e.touches[0] || e.changedTouches[0])

            // First, before we do anything else, if the clipboard is open, and we're on a mobile device, check if they just
            // tried to click on the clipboard transformation buttons. Because foriegnObjects don't seem to work with events,
            // we have to handle them manually from here
            if (_state.mobile && _state.clipboard){
                const {clipx, clipy} = calc(_state)
                // These are esitimates, I didn't get them from anywhere
                const width = 35
                const height = 40
                const gap = 5
                const x = touch.pageX
                const y = touch.pageY
                // The first button is rotate
                if (x >= clipx && x <= clipx + width &&
                    y >= clipy && y <= clipy + height){
                    dispatch({action: 'increment clipboard rotation'})
                    withinDoubleTapTime = false
                    return
                }
                // The second button is flip
                if (x >= clipx + width + gap && x <= clipx + width * 2 + gap &&
                    y >= clipy && y <= clipy + height){
                    dispatch({action: 'increment clipboard mirror axis'})
                    withinDoubleTapTime = false
                    return
                }
                // The third button is accept
                if (x >= clipx + width*2 + gap*2 && x <= clipx + width * 3 + gap*2 &&
                    y >= clipy && y <= clipy + height){
                    dispatch({action: 'paste'})
                    withinDoubleTapTime = false
                    return
                }
            }

            dispatch({
                action: 'cursor moved',
                x: touch.pageX,
                y: touch.pageY,
            })
            if (!_state.clipboard?.length)
                dispatch(fillMode ? 'fill' : 'add line')

            // We have to wait until the state updates and the cursor moves, before we compare to new cursor positions
            setTimeout(() => setTapHolding(true), 10)
            touchHoldTimer = setTimeout(onTouchHold, _state.holdTapTimeMS)
        }

        function onScroll(e){
            // console.log('scrolled')
            if (e.shiftKey)
                dispatch({
                    action: 'translate',
                    x: e.deltaY * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                    y: e.deltaX * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                })
            else if (e.ctrlKey){
                // Disable the broswer zoom shortcut
                e.preventDefault()
                dispatch({action: 'scale',
                    amtx: (e.deltaY / 8) * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                    amty: (e.deltaY / 8) * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                    // cx: cursorPos[0], cy:
                    // cursorPos[1]
                })
            }
            else
                dispatch({
                    action: 'translate',
                    x: e.deltaX * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                    y: e.deltaY * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                })
        }

        // See https://stackoverflow.com/questions/63663025/react-onwheel-handler-cant-preventdefault-because-its-a-passive-event-listenev
        // for why we have to do it this way (because of the zoom browser shortcut)
        const _paper = paper.current
        _paper.addEventListener('wheel', onScroll, { passive: false })
        _paper.addEventListener('touchend', onTouchEnd, { passive: false })
        _paper.addEventListener('touchstart', onTouchStart, { passive: false })
        _paper.addEventListener('touchmove', onTouchMove, { passive: false })
        return () => {
            _paper?.removeEventListener('wheel', onScroll)
            _paper?.removeEventListener('touchend', onTouchEnd)
            _paper?.removeEventListener('touchstart', onTouchStart)
            _paper?.removeEventListener('touchmove', onTouchMove)
        }
    }, [])

    // Perserve settings
    useEffect(() => {
        const local = localStorage.getItem(localStorageSettingsName)
        if (local)
            dispatch(deserializeState(local))
    }, [])

    // So the tour can effect state
    useEffect(() => setDispatch(dispatch), [setDispatch])

    // Clipboard translations
    let clipboardFlip = ''
    if (clipboardMirrorAxis === MIRROR_AXIS.VERT_90 || clipboardMirrorAxis === MIRROR_AXIS.BOTH_360)
        clipboardFlip += `matrix(-1, 0, 0, 1, ${cursorPos[0]*2}, 0) `
    if (clipboardMirrorAxis === MIRROR_AXIS.HORZ_180 || clipboardMirrorAxis === MIRROR_AXIS.BOTH_360)
        clipboardFlip += `matrix(1, 0, 0, -1, 0, ${cursorPos[1]*2}) `

    if ((trellis || openMenus.repeat) && bounds.length > 1)
        var trellisActual = getTrellis(state)

    // Get the mirrored current lines
    var curLines = []
    var clip = []
    if (mirroring || openMenus.mirror){
        const trellisTransformations = getStateMirrored(state, () => '', false)
        curLines = trellisTransformations.map((transformation, i) => <line
            x1={curLine?.x1}
            y1={curLine?.y1}
            x2={cursorPos[0]}
            y2={cursorPos[1]}
            stroke={stroke[currentLineColorProfileIndex]}
            strokeWidth={strokeWidth[currentLineColorProfileIndex] * scalex}
            strokeLinecap={lineCap}
            strokeLinejoin={lineJoin}
            strokeDasharray={dash[currentLineColorProfileIndex]}
            transform={transformation}
            key={`mirror-${i}`}
        />)
        // clip = trellisTransformations.map((tranformation, i) => <g transform={tranformation}>{clipboard}</g>)
        clip = trellisTransformations.map((tranformation, i) => <g key={`trellis-trans-${i}`} transform={`
            ${clipboardFlip}
            ${tranformation}
            rotate(${clipboardRotation}, ${cursorPos[0]}, ${cursorPos[1]})
            translate(${clipx} ${clipy})
            scale(${scalex} ${scaley})
        `}>{clipboard}</g>)

    } else {
        curLines.push(<line
            x1={curLine?.x1}
            y1={curLine?.y1}
            x2={cursorPos[0]}
            y2={cursorPos[1]}
            stroke={stroke[currentLineColorProfileIndex]}
            strokeWidth={strokeWidth[currentLineColorProfileIndex] * scalex}
            strokeLinecap={lineCap}
            strokeLinejoin={lineJoin}
            strokeDasharray={dash[currentLineColorProfileIndex]}
            key='mirror0'
        />)
        if (clipboard)
            clip.push(<g transform={`
                ${clipboardFlip}
                rotate(${clipboardRotation}, ${cursorPos[0]}, ${cursorPos[1]})
                translate(${clipx} ${clipy})
                scale(${scalex} ${scaley})
            `} key='yo mama'>{clipboard}</g>)
    }

    // Get the mirror guide lines
    let mirrorLines = []

    if (mirrorType === MIRROR_TYPE.PAGE && (mirroring || openMenus.mirror)){
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

    // For explanation, see the declaration of prevSelectedRect
    const _selected = document.querySelector('#selected-trellis-pattern')
    if (_selected)
        setSelected(_selected)

    if (!openMenus.repeat)
        setSelected(null)

    const selectedRect = selected?.getBoundingClientRect()

    const debugBox_xy = align(state, viewportWidth() / 4, viewportHeight() / 4)


    // The order in which we draw the elements is important, they're drawn in the order they're added to the svg
    return <StateContext.Provider value={[state, dispatch]}>
        <div>
            <MainMenu/>
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
                style={{
                    backgroundColor: paperColor,
                    cursor: fillMode ? 'pointer' : 'none',
                }}
            >
                {/* The dots are on the very bottom */}
                {/* Draw the dots */}
                {!hideDots && <>
                    <pattern id="dot"
                        x={translationx}
                        y={translationy}
                        width={scalex}
                        height={scaley}
                        patternUnits='userSpaceOnUse'
                        patternTransform={`rotate(${rotate})`}
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
                </>}

                {/* Draw the filled polygons */}
                <g id='filled-polys' transform={`translate(${translationx} ${translationy}) scale(${scalex} ${scaley})`}>
                    {filledPolys}
                </g>

                {/* Draw the trellis */}
                <g transform={`scale(${scalex} ${scaley})`}>
                    {((trellis || openMenus.repeat) && bounds.length > 1) && trellisActual}
                </g>

                {/* Draw the intersecting polygon */}
                {intersectingPolygon && <polygon
                    points={intersectingPolygon.geometry.coordinates[0].map(i => `${i[0]} ${i[1]}`).join(' ')}
                    fill={fill[currentFillColorProfileIndex]}
                    stroke="none"
                    strokeWidth="0"
                    transform={`translate(${translationx} ${translationy}) scale(${scalex} ${scaley})`}
                    key={`poly-${state.filledPolys.length}`}
                />}

                {/* Draw the cursor */}
                {!fillMode && <g key="cursor-group">{constructCursor(state)}</g>}

                {/* Draw the lines */}
                <g id='lines' transform={`
                    translate(${translationx} ${translationy})
                    scale(${scalex} ${scaley})
                `}>
                    {lines}
                </g>

                {/* Draw the current line */}
                {curLine && <g style={{backgroundColor: "green"}}>{curLines}</g>}

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
                {(boundRect && <rect
                    width={(drawBoundRect.width)}
                    height={(drawBoundRect.height)}
                    x={drawBoundRect.left}
                    y={drawBoundRect.top}
                    stroke={options.selectionBorderColor}
                    fillOpacity={options.selectionOpacity}
                    fill={options.selectionColor}
                    rx={partials ? 4/scalex : 0}
                    strokeWidth={1/scalex}
                    transform={`
                        translate(${translationx}, ${translationy})
                        scale(${scalex}, ${scaley})
                    `}
                />)}

                {/* Draw the rotate & flip buttons when there's a clipboard */}
                {mobile && clipboard?.length && <foreignObject
                    // Apparently foreignObjects don't acknowledge pointer (or possibly any) events.
                    // These are "buttons", but they're actually handled manually in touchStart() above
                    x={clipx} y={clipy}
                    // 100 is too much, but it shouldn't matter
                    width="130" height="50"
                    >
                        <div id="clipboard-transform-buttons-mobile">
                            <button><RxRotateCounterClockwise /></button>
                            <button> <GoMirror /> </button>
                            <button><FaCheck /></button>
                        </div>
                </foreignObject>}

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

                {/* Draw the clipboard */}
                {clip}

                {/* Draw the debug info */}
                {debug && <g>
                    <circle cx={translationx} cy={translationy} r='8' fill='blue'/>
                    <text x="80%" y='20'>{`Translation: ${Math.round(translationx)}, ${Math.round(translationy)}`}</text>
                    <text x="80%" y='40'>{`Scale: ${Math.round(scalex)}, ${Math.round(scaley)}`}</text>
                    {deleteme && <g transform={`translate(${translationx} ${translationy}) scale(${scalex} ${scaley})`}>
                        {deleteme.map((i, cnt) => <circle cx={i[0]} cy={i[1]} r={4/scalex} fill='blue' key={`debug-${cnt}`}/>)}
                    </g>}
                    <circle cx={debug_rawCursorPos[0]} cy={debug_rawCursorPos[1]} fill="grey" r='5'/>
                    {/* Repeat box */}
                    {openMenus.repeat && <rect x={debugBox_xy[0]} y={debugBox_xy[1]}
                        width={viewportWidth() / 2} height={viewportHeight() / 2}
                        stroke='green' strokeWidth={2} fillOpacity={0}
                    />}
                </g>}                
                {/* Debug info is on the very top */}
            </svg>

            {/* For exporting to images */}
            <canvas id="canvas"></canvas>
        </div>
    </StateContext.Provider>
}
