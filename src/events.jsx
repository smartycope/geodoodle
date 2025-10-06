import options from './options';
import {keybindings} from './options';
import Point from './helper/Point';
import Dist from './helper/Dist';
import {tapHolding, setTapHolding} from './globals'
import {distCenter} from './utils';
import {eventMatchesKeycode} from './utils';


var dragging = false
// This has to be a global variable instead of a state, because we attach the touchMove listener function directly,
// so we can have it not capture passively, so we can prevent default
// null or a 2 item list of the previous touches
var gestureTouches = null
var withinDoubleTapTime = false
// coordinates aren't relevant here, these are just placeholder values
var lastTapPos = new Point(-10, -10)
var touchHoldTimer = null


export function onMouseMove(state, dispatch, e){
    const {fillMode} = state
    if (e.buttons !== 0)
        dragging = !fillMode
    dispatch({
        action: 'cursor_moved',
        point: Point.fromViewport(state, e.clientX, e.clientY),
    })
}

export function onMouseDown(state, dispatch, e){
    const {fillMode, bounds} = state
    switch (e.button){
        // Left click
        case 0: dispatch(fillMode ? 'fill' : (bounds.length === 1 ? 'add_bound' : 'add_line')); break;
        // Middle click
        case 1: dispatch('delete_at_cursor'); break;
        // Right click
        case 2: fillMode ? null : dispatch('continue_line'); break;
    }
}

export function onMouseUp(state, dispatch, e){
    if (dragging)
        dispatch('add_line')
    dragging = false
}

function onDoubleTap(state, dispatch){
    // This is only for touches, mouse clicks aren't counted.
    // e is the event of the last touchend event, which is guranteed ("should") be within 1 scalex of the first tap
    dispatch('delete_at_cursor')
}

function onTouchHold(state, dispatch){
    const {fillMode, clipboard} = state
    // This also only applies to touch events, not mouse events
    if (tapHolding && !fillMode){
        if (clipboard?.length)
            dispatch("paste")
        else
            dispatch("add_bound")
        setTapHolding(false)
    }
}

// This keeps the focus always on the paper element
export function onBlur(state, dispatch, e) {
    setTimeout(function() {
        if (document.activeElement.nodeName !== 'INPUT' || document.activeElement.type === 'checkbox')
            // paper.current.focus()
            e.target.focus()
    }, 100);
}

export function onTouchMove(state, dispatch, e){
    e.preventDefault()
    if (e.touches.length === 2){
        // Immediately stop all double tap, tap and hold, dragging, and curLinePos
        dragging = false
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
                amt: Dist.fromInflated(state,
                    -(prevCenterx - newCenterx) * state.gestureTranslateSensitivity,
                    -(prevCentery - newCentery) * state.gestureTranslateSensitivity,
                ),
            })
            // TODO: enableGestureScale is broken
            // This line helps stablize translation
            if (!state.smoothGestureScale || Math.abs((prevDist - newDist) * state.gestureScaleSensitivity) > .6){
                dispatch({action: 'scale',
                    amtx: -(prevDist - newDist) * state.gestureScaleSensitivity * .25,
                    amty: -(prevDist - newDist) * state.gestureScaleSensitivity * .25,
                    center: Point.fromViewport(state, newCenterx, newCentery)
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
            point: Point.fromViewport(state, touch.pageX, touch.pageY),
        })
    }
}

export function onTouchEnd(state, dispatch, e){
    e.preventDefault()
    const touch = (e.touches[0] || e.changedTouches[0])
    // I don't know why, but for some reason this causes the time out to double, but seems to fix the problem I was
    // having, where timers overlap touches
    clearTimeout(touchHoldTimer)
    setTapHolding(false)

    if (!state.clipboard?.length)
        dispatch('add_line')
    gestureTouches = null

    const newTapPos = Point.fromViewport(state, touch.pageX, touch.pageY)
    if (!withinDoubleTapTime){
        withinDoubleTapTime = true
        setTimeout(() => withinDoubleTapTime = false, state.doubleTapTimeMS)
    } else if (lastTapPos.eq(newTapPos)){
        withinDoubleTapTime = false
        onDoubleTap(state, dispatch, e)
    }

    lastTapPos = newTapPos
}

export function onTouchStart(state, dispatch, e){
    e.preventDefault()
    const {fillMode, mobile, clipboard} = state
    const touch = (e.touches[0] || e.changedTouches[0])

    // First, before we do anything else, if the clipboard is open, and we're on a mobile device, check if they just
    // tried to click on the clipboard transformation buttons. Because foriegnObjects don't seem to work with events,
    // we have to handle them manually from here
    if (mobile && clipboard){
        const {x: buttonLeft, y: buttonTop} = getClipboardButtonsPos(state).asViewport(state)
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
        point: Point.fromViewport(state, touch.pageX, touch.pageY),
    })
    if (!clipboard?.length)
        dispatch(fillMode ? 'fill' : 'add_line')

    // We have to wait until the state updates and the cursor moves, before we compare to new cursor positions
    setTimeout(() => setTapHolding(true), 10)
    touchHoldTimer = setTimeout(() => onTouchHold(state, dispatch), state.holdTapTimeMS)
}

export function onScroll(state, dispatch, e){
    if (e.shiftKey)
        dispatch({
            action: 'translate',
            amt: Dist.fromInflated(state,
                e.deltaY * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
                e.deltaX * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
            ),
        })
    else if (e.ctrlKey){
        // Disable the broswer zoom shortcut
        e.preventDefault()
        dispatch({action: 'scale',
            amtx: (e.deltaY / 8) * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
            amty: (e.deltaY / 8) * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
        })
    }
    else
        dispatch({
            action: 'translate',
            amt: Dist.fromInflated(state,
                e.deltaX * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
                e.deltaY * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
            ),
        })
}

export function onKeyDown(state, dispatch, e){
    // If it's just a modifier key, don't do anything (it'll falsely trigger things)
    if (['Shift', 'Meta', 'Control', 'Alt'].includes(e.key))
        return

    var take = null
    for (const [shortcut, action] of Object.entries(keybindings)){
        if (eventMatchesKeycode(e, shortcut)){
            take = action
            break
        }
    }
    if (take) dispatch(take)
}