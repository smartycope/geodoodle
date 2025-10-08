import options, {keybindings} from './options';
import Point from './helper/Point';
import Dist from './helper/Dist';
// import {tapHolding, setTapHolding} from './globals'
import {distCenter, eventMatchesKeycode, getClipboardButtonsPos} from './utils';


var dragging = false


// TODO: middle click & drag starts a line on middle click up event -- make it delete a specific line instead

// Mouse events
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

// Keyboard events
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

// Touch events
// This has to be a global variable instead of a state, because we attach the touchMove listener function directly,
// so we can have it not capture passively, so we can prevent default
// null or a 2 item list of the previous touches
var gestureTouches = null
// var withinDoubleTapTime = false
// coordinates aren't relevant here, these are just placeholder values
// var lastTapPos = new Point(-10, -10)
var touchHoldTimer = null
// True if we're in the double tap window
var doubleTapIsPossible = false
// The timer for the double tap window. If it expires, we're not double tapping
var doubleTapTimer = null
// Everything else aside, if there is 1 finger touching the screen, this is true. If there are 0 or 2 fingers touching
// the screen, this is false
// There is 1 singular exception: if we're touching with multiple fingers, and then let go of one of them,
// this is false, until we let go of the last finger and press again with 1 finger
// This may be true briefly before we reach 2 fingers at once, at which point it goes false again
var singleTapTouchingScreen = false
// To distiguish between click and drag, and tap and drag
var tapDragging = false
// Aligned to the nearest dot
// The last place we started tapping with a single finger
var lastTapPos = new Point(-10, -10)

// Creating lines:
// Lines start from the onTouchMove event. After we know it's not a double tap, or a hold or the like,
// we can start the line once we've changed cursorPos. We then start the line from where cursorPos was
// when the touch started.
// Lines are finished when the touch ends, we've been dragging (tapDragging), and there's only 1 finger
// touching the screen. (and also when the position of the touch has changed? shoudl I maybe add that?)

// Double tap:
// we start a timer when we first touch the screen with a single finger. Then, multiple things can
// cancel that timer. Then, if we start another touch, and the timer is still valid, we double tap.
// Note -- doubleTapPossible is probably redundant for Boolean(doubleTapTimer). This can probably be changed.

// Holding:
// We start a timer from touchStart. several things can cancel that timer, just like double tap.
// If the timer expires, and is valid, it calls the hold function.

// TODO: if we hold (and it then adds 1 bound), and then we drag, it should add a 2nd bound on touch end

export function onTouchStart(state, dispatch, e){
    e.preventDefault()
    console.log('touch start')
    const {fillMode, mobile, clipboard} = state
    const touch = (e.touches[0] || e.changedTouches[0])
    // TODO: reserach this to see if that's how it works
    const touchCount = e.touches.length// || e.changedTouches.length

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

    const newTapPos = Point.fromViewport(state, touch.pageX, touch.pageY)
    const newTapPosAligned = newTapPos.align(state)

    // Practical logic starts here
    dispatch({
        action: 'cursor_moved',
        point: newTapPos,
    })

    if (fillMode && !clipboard?.length)
        dispatch('fill')
        // dispatch(fillMode ? 'fill' : 'add_line')
    // We can only be dragging if a single finger has changed the cursorPos
    console.log('tapDragging set to false (from touch start)')
    tapDragging = false
    // We have to wait until the state updates and the cursor moves, before we compare to new cursor positions
    // setTimeout(() => setTapHolding(true), 10)
    singleTapTouchingScreen = touchCount === 1
    console.log('singleTapTouchingScreen set to', singleTapTouchingScreen)
    if (singleTapTouchingScreen){
        // If we're in the double tap window, and we tapped again? Double tap!
        if (doubleTapIsPossible && lastTapPos.eq(newTapPosAligned)){
            doubleTapIsPossible = false
            clearTimeout(doubleTapTimer)
            console.log('double tapped!!!')
            onDoubleTap(state, dispatch)
        }
        // If we're not in the double tap window, start it
        else{
            console.log('Not double tapped, but the timer has started...')
            doubleTapIsPossible = true
            clearTimeout(doubleTapTimer)
            doubleTapTimer = setTimeout(() => {console.log('...double tap timer expired'); doubleTapIsPossible = false}, state.doubleTapTimeMS)
        }
    }
    else if (!singleTapTouchingScreen){
        console.log('Not double tapped: we started a gesture')
    }
    else if (!lastTapPos.eq(newTapPosAligned)){
        console.log('Not double tapped: cursorPos changed (from touch start)')
    }
    else{
        console.log('!!!!!!!!!!!!!!!!!!!!!!!how did we get here?!!!!!!!!!!!!!!!!!!!')
    }
    if (singleTapTouchingScreen){
        lastTapPos = newTapPosAligned
        console.log('lastTapPos set to', lastTapPos)
    }
    // If we stop touching in that amount of time, we interrupt the timer, so this still works
    touchHoldTimer = setTimeout(() => onTouchHold(state, dispatch), state.holdTapTimeMS)
}

// This is the only thing that sets gestureTouches to null
export function onTouchEnd(state, dispatch, e){
    e.preventDefault()
    const {fillMode, clipboard} = state
    // const touch = (e.touches[0] || e.changedTouches[0])

    // Well we're not holding anymore
    clearTimeout(touchHoldTimer)


    // If we're coming off of a gesture, don't do anything
    // We don't support 3 finger gestures, so this will always be fine
    if (gestureTouches){
        console.log('touch end: coming off of a gesture')
        gestureTouches = null
        return
    }
    else console.log('touch end: ended with a single touch (pretty sure)')


    // Only add lines if we've been dragging
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~', {clipboard, fillMode, tapDragging, singleTapTouchingScreen})
    if (!clipboard?.length && !fillMode && tapDragging && singleTapTouchingScreen){
        console.log('adding line (from touch end)', {tapDragging, singleTapTouchingScreen})
        dispatch('add_line')
    }

    // singleTapTouchingScreen = touchCount === 1
    singleTapTouchingScreen = false

    console.log('tapDragging set to false (from touch end)')
    tapDragging = false
    // const newTapPos = Point.fromViewport(state, touch.pageX, touch.pageY)
    // if (!withinDoubleTapTime){
    //     console.debug('NOT double tapped')
    //     withinDoubleTapTime = true
    //     setTimeout(() => {console.debug('double tap timer expired'); withinDoubleTapTime = false}, state.doubleTapTimeMS)
    // } else if (lastTapPos.eq(newTapPos)){
    //     console.debug('double tapped')
    //     withinDoubleTapTime = false
    //     onDoubleTap(state, dispatch, e)
    // }

    // lastTapPos = newTapPos
}

export function onTouchMove(state, dispatch, e){
    e.preventDefault()
    // We can allow double taps if we move, but not enough to change cursorPos
    if (e.touches.length === 2){
        // Immediately stop all double tap, tap and hold, dragging, and curLinePos
        tapDragging = false
        dragging = false
        doubleTapIsPossible = false
        clearTimeout(doubleTapTimer)
        // setTapHolding(false)
        clearTimeout(touchHoldTimer)
        // withinDoubleTapTime = false
        // For good measure
        // lastTapPos = [-10,-10]
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
            dispatch({curLinePos: null})
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
            dispatch({curLinePos: null})
        }
        gestureTouches = e.touches
    } else if (e.touches.length === 1 && gestureTouches === null){
        console.log('single touch moved')
        const touch = (e.touches[0] || e.changedTouches[0])
        const {clipboard, fillMode, curLinePos} = state
        // If we move while holding, that's fine, as long as we haven't moved enough to change cursorPos.
        // If we move enough to change cursorPos, we stop holding.
        // the cursor_moved action calls cursorPosChanged() if the cursor has moved enough to change cursorPos.
        // tapDragging = true
        if (tapDragging && !clipboard?.length && !fillMode && !curLinePos){
            dispatch({action: 'add_line', at: lastTapPos})
        }
        dispatch({
            action: 'cursor_moved',
            point: Point.fromViewport(state, touch.pageX, touch.pageY),
        })
    }
}

export function cursorPosChanged(newPos){
    console.log('cursorPosChanged', {newPos})
    console.log('lastTapPos', {lastTapPos, newPos})
    if (singleTapTouchingScreen && !lastTapPos.eq(newPos)){
        clearTimeout(touchHoldTimer)
        console.log('double tap is not possible: cursorPos changed')
        clearTimeout(doubleTapTimer)
        doubleTapIsPossible = false
        console.log('tapDragging set to true (from cursorPosChanged)')
        tapDragging = true
    }
}

function onTouchHold(state, dispatch){
    // This only gets called when valid
    const {fillMode, clipboard} = state
    console.log('onTouchHold')
    console.log('double tap is not possible: We held instead')
    clearTimeout(doubleTapTimer)
    doubleTapIsPossible = false
    // This also only applies to touch events, not mouse events
    if (singleTapTouchingScreen && !fillMode){
        if (clipboard?.length)
            dispatch("paste")
        else
            dispatch("add_bound")
    }
}

function onDoubleTap(state, dispatch){
    // This is only for touches, mouse clicks aren't counted.
    // e is the event of the last touchend event, which is guranteed ("should") be within 1 scalex of the first tap
    dispatch('delete_at_cursor')
}




// This keeps the focus always on the paper element
export function onBlur(state, dispatch, e) {
    setTimeout(function() {
        if (document.activeElement.nodeName !== 'INPUT' || document.activeElement.type === 'checkbox')
            // paper.current.focus()
            e.target.focus()
    }, 100);
}