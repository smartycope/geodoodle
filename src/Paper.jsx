import './styling/App.css';
import {useEffect, useReducer, useRef, useState} from 'react';
import { localStorageSettingsName, PREVENT_LOADING_STATE } from './globals'
import reducer from './reducer';
import {mobileAndTabletCheck, getClipboardButtonsPos} from './utils';
import options from './options';
import MainMenu from './Menus/MainMenu';
import {deserializeState} from './fileUtils';
import {StateContext} from './Contexts';
import Point from './helper/Point';
import Dist from './helper/Dist';
import {
    GlowEffect,
    DebugInfo,
    MirrorMetaLines,
    Eraser,
    ClipboardTransformButtons,
    SelectionRect,
    Bounds,
    CurrentLines,
    Lines,
    Clipboard,
    Cursor,
    Dots,
    Polygons,
    CurrentPolys,
} from './drawing';
import Trellis from './Trellis';
import {tapHolding, setTapHolding} from './globals'
import {distCenter} from './utils';
import getInitialState from './states';


// This has to be a global variable instead of a state, because we attach the touchMove listener function directly,
// so we can have it not capture passively, so we can prevent default
// null or a 2 item list of the previous touches
var gestureTouches = null
var withinDoubleTapTime = false
// coordinates aren't relevant here, these are just placeholder values
var lastTapPos = new Point(-10, -10)
// This is for the mouse/touch events that need to be bound non-passively, but also need access to the state
// This is hacky, but I can't think of a better way
var _state = {}
var touchHoldTimer = null

// TODO: in the refactor still
// tests

export default function Paper({setDispatch}) {
    const paper = useRef()
    const [dragging, setDragging] = useState(false)
    const [state, dispatch] = useReducer(reducer, getInitialState())
    const {dotsAbovefill, paperColor, fillMode} = state

    // Forcibly disallow scrolling
    window.scrollX = 0
    window.scrollY = 0

    _state = state

    function onMouseMove(e){
        if (e.buttons !== 0)
            setDragging(!fillMode)
        dispatch({
            action: 'cursor_moved',
            point: Point.fromViewport(state, e.clientX, e.clientY),
        })
    }

    function onMouseDown(e){
        switch (e.button){
            // Left click
            case 0: dispatch(fillMode ? 'fill' : 'add_line'); break;
            // Middle click
            case 1: dispatch('delete'); break;
            // Right click
            case 2: fillMode ? null : dispatch('continue_line'); break;
        }
    }

    function onMouseUp(){
        if (dragging)
            dispatch('add_line')
        setDragging(false)
    }

    function onDoubleTap(){
        // This is only for touches, mouse clicks aren't counted.
        // e is the event of the last touchend event, which is guranteed ("should") be within 1 scalex of the first tap
        dispatch('delete_at_cursor')
    }

    function onTouchHold(){
        // This also only applies to touch events, not mouse events
        if (tapHolding && !fillMode){
            if (_state.clipboard?.length)
                dispatch("paste")
            else
                dispatch("add_bound")
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
                // Immediately stop all double tap, tap and hold, dragging, and curLinePos
                setDragging(false)
                setTapHolding(false)
                clearTimeout(touchHoldTimer)
                withinDoubleTapTime = false
                // For good measure
                lastTapPos = [-10,-10]
                dispatch({curLinePos: null})

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
                        amt: Dist.fromInflated(_state,
                            -(prevCenterx - newCenterx) * _state.gestureTranslateSensitivity,
                            -(prevCentery - newCentery) * _state.gestureTranslateSensitivity,
                        ),
                    })
                    // TODO: enableGestureScale is broken
                    // This line helps stablize translation
                    if (Math.abs((prevDist - newDist) * _state.gestureScaleSensitivity) > .6 || !_state.smoothGestureScale){
                        dispatch({action: 'scale',
                            amtx: -(prevDist - newDist) * _state.gestureScaleSensitivity * .25,
                            amty: -(prevDist - newDist) * _state.gestureScaleSensitivity * .25,
                            center: Point.fromViewport(_state, newCenterx, newCentery)
                        })
                    }
                } else {
                    dispatch('nevermind')
                }
                gestureTouches = e.touches
            } else if (e.touches.length === 1 && gestureTouches === null){
                const touch = (e.touches[0] || e.changedTouches[0])
                dispatch({
                    action: 'cursor_moved',
                    point: Point.fromViewport(_state, touch.pageX, touch.pageY),
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
                dispatch('add_line')
            gestureTouches = null

            const newTapPos = Point.fromViewport(_state, touch.pageX, touch.pageY)
            if (!withinDoubleTapTime){
                withinDoubleTapTime = true
                setTimeout(() => withinDoubleTapTime = false, _state.doubleTapTimeMS)
            } else if (lastTapPos.eq(newTapPos)){
                withinDoubleTapTime = false
                onDoubleTap(_state, dispatch, e)
            }

            lastTapPos = newTapPos
        }

        function onTouchStart(e){
            e.preventDefault()
            const touch = (e.touches[0] || e.changedTouches[0])

            // First, before we do anything else, if the clipboard is open, and we're on a mobile device, check if they just
            // tried to click on the clipboard transformation buttons. Because foriegnObjects don't seem to work with events,
            // we have to handle them manually from here
            if (_state.mobile && _state.clipboard){
                // const {clipx, clipy} = calc(_state)
                // const {top: selectionTop, left: selectionLeft} = getBoundRect(_state).asViewport(_state)
                const {x: buttonLeft, y: buttonTop} = getClipboardButtonsPos(_state).asViewport(_state)
                // const rect = Rect.fromPoints(_state.bounds)
                // const {x: clipx, y: clipy} = Point.fromSvg(_state,
                //     _state.cursorPos.asSvg(_state, false).x - Math.floor((boundRect.asSvg(_state, false).width) / 2),
                //     _state.cursorPos.asSvg(_state, false).y - Math.floor((boundRect.asSvg(_state, false).height) / 2),
                //     false
                // ).asViewport(_state)
                // These are estimates, I didn't get them from anywhere

                const {clipboardButtonWidth: width, clipboardButtonHeight: height, clipboardButtonGap: gap} = options
                const x = touch.pageX
                const y = touch.pageY
                // The first button is rotate
                if (x >= buttonLeft && x <= buttonLeft + width &&
                    y >= buttonTop && y <= buttonTop + height){
                    dispatch('increment_clipboard_rotation')
                    withinDoubleTapTime = false
                    return
                }
                // The second button is flip
                if (x >= buttonLeft + width + gap && x <= buttonLeft + width * 2 + gap &&
                    y >= buttonTop && y <= buttonTop + height){
                    dispatch('increment_clipboard_mirror_axis')
                    withinDoubleTapTime = false
                    return
                }
                // The third button is accept
                if (x >= buttonLeft + width*2 + gap*2 && x <= buttonLeft + width * 3 + gap*2 &&
                    y >= buttonTop && y <= buttonTop + height){
                    dispatch('paste')
                    withinDoubleTapTime = false
                    return
                }
                // The fourth button is cancel
                if (x >= buttonLeft + width*3 + gap*3 && x <= buttonLeft + width * 4 + gap*3 &&
                    y >= buttonTop && y <= buttonTop + height){
                    dispatch('cancel_clipboard')
                    withinDoubleTapTime = false
                    return
                }
            }

            dispatch({
                action: 'cursor_moved',
                point: Point.fromViewport(_state, touch.pageX, touch.pageY),
            })
            if (!_state.clipboard?.length)
                dispatch(fillMode ? 'fill' : 'add_line')

            // We have to wait until the _state updates and the cursor moves, before we compare to new cursor positions
            setTimeout(() => setTapHolding(true), 10)
            touchHoldTimer = setTimeout(onTouchHold.bind(_state, dispatch), _state.holdTapTimeMS)
        }

        function onScroll(e){
            if (e.shiftKey)
                dispatch({
                    action: 'translate',
                    amt: Dist.fromInflated(_state,
                        e.deltaY * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                        e.deltaX * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                    ),
                })
            else if (e.ctrlKey){
                // Disable the broswer zoom shortcut
                e.preventDefault()
                dispatch({action: 'scale',
                    amtx: (e.deltaY / 8) * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                    amty: (e.deltaY / 8) * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                })
            }
            else
                dispatch({
                    action: 'translate',
                    amt: Dist.fromInflated(_state,
                        e.deltaX * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                        e.deltaY * _state.scrollSensitivity * (_state.invertedScroll ? -1 : 1),
                    ),
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
        if (!PREVENT_LOADING_STATE && local)
            dispatch(deserializeState(local))
    }, [])

    // So the tour can effect state
    useEffect(() => setDispatch(dispatch), [setDispatch])

    // Focus the paper element first thing
    useEffect(() => paper.current.focus(), [])

    return <StateContext.Provider value={{state, dispatch}}>
        <div>
            <MainMenu/>
            {/* onCopy, onPaste, and onCut are implemented with keyboard shortcuts instead of here, so they can be changed */}
            <svg id='paper'
                width="100%"
                height="101vh"
                onKeyDown={e => dispatch({action: 'key_press', event: e})}
                tabIndex={0}
                onMouseMove={onMouseMove}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onBlur={onBlur}
                ref={paper}
                style={{
                    backgroundColor: paperColor,
                    cursor: fillMode ? 'pointer' : 'none',
                }}
            >
                {/* This order is intentional */}
                <GlowEffect/>
                {!dotsAbovefill && <Dots/>}
                <Trellis/>
                <Polygons/>
                <CurrentPolys/>
                {dotsAbovefill && <Dots/>}
                <DebugInfo/>
                <Cursor/>
                <Lines/>
                <CurrentLines/>
                <Bounds/>
                <SelectionRect/>
                <ClipboardTransformButtons/>
                <MirrorMetaLines/>
                <Eraser/>
                <Clipboard/>
            </svg>
            {/* For exporting to images */}
            <canvas id="canvas"></canvas>
        </div>
    </StateContext.Provider>
}
