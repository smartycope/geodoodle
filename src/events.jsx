import Point from "./helper/Point"
import Dist from "./helper/Dist"
import { distCenter, eventMatchesKeycode } from "./utils"
import { getCanvasButtonAt } from "./canvasButtonUtils"
import { normalizeAngle } from "./transformUtils"

var dragging = false
var canvasButtonMouseActive = false
var activeBoundShortcutPresses = new Map()
var middleMouseDown = false
var middleLineDragging = false
var middleDragStart = null
var rightMouseDown = false
var rightSelectionDragging = false
var rightDragStart = null

/* eslint-disable no-unused-vars */

// Mouse events
export function onMouseMove(state, dispatch, e) {
  if (canvasButtonMouseActive) return
  const { fillMode } = state

  if (rightMouseDown && (e.buttons & 2) === 2) {
    if (!rightSelectionDragging) {
      rightSelectionDragging = true
      dispatch({
        bounds: [rightDragStart],
        boundDragging: true,
        curLinePos: null,
        deletingSelection: !e.shiftKey,
      })
    }
    dispatch({
      action: "cursor_moved",
      point: Point.fromViewport(state, e.clientX, e.clientY),
    })
    return
  }

  if (middleMouseDown && (e.buttons & 4) === 4) {
    middleLineDragging = true
    dispatch({
      action: "cursor_moved",
      point: Point.fromViewport(state, e.clientX, e.clientY),
    })
    return
  }

  if (getCanvasButtonAt(state, e.clientX, e.clientY)) return
  if (e.buttons !== 0) dragging = !fillMode
  dispatch({
    action: "cursor_moved",
    point: Point.fromViewport(state, e.clientX, e.clientY),
  })
}

export function onMouseDown(state, dispatch, e) {
  const canvasButton = getCanvasButtonAt(state, e.clientX, e.clientY)
  if (canvasButton) {
    e.preventDefault?.()
    dragging = false
    middleMouseDown = false
    middleLineDragging = false
    middleDragStart = null
    rightMouseDown = false
    rightSelectionDragging = false
    rightDragStart = null
    canvasButtonMouseActive = true
    if (e.button === 0) dispatch(canvasButton.action)
    return
  }

  canvasButtonMouseActive = false
  const { fillMode, bounds } = state
  switch (e.button) {
    case 0: // Left click
      dispatch(fillMode ? "fill" : bounds.length === 1 ? "add_bound" : "add_line")
      break
    case 1: // Middle click
      e.preventDefault?.()
      dragging = false
      middleMouseDown = true
      middleLineDragging = false
      middleDragStart = Point.fromViewport(state, e.clientX, e.clientY).align(state)
      break
    case 2: // Right click
      e.preventDefault?.()
      dragging = false
      rightMouseDown = true
      rightSelectionDragging = false
      rightDragStart = Point.fromViewport(state, e.clientX, e.clientY).align(state)
      break
  }
}

export function onMouseUp(state, dispatch, e) {
  if (canvasButtonMouseActive) {
    canvasButtonMouseActive = false
    dragging = false
    return
  }

  if (e.button === 1 && middleMouseDown) {
    const wasDragging = middleLineDragging
    const start = middleDragStart
    const end = Point.fromViewport(state, e.clientX, e.clientY).align(state)
    middleMouseDown = false
    middleLineDragging = false
    middleDragStart = null
    dragging = false
    e.preventDefault?.()
    dispatch({
      action: "cursor_moved",
      point: Point.fromViewport(state, e.clientX, e.clientY),
    })
    dispatch(wasDragging ? { action: "delete_specific_line", start, end } : "delete_at_cursor")
    return
  }
  if (e.button === 2 && rightMouseDown) {
    const wasDragging = rightSelectionDragging
    rightMouseDown = false
    rightSelectionDragging = false
    rightDragStart = null
    dragging = false
    e.preventDefault?.()
    dispatch({
      action: "cursor_moved",
      point: Point.fromViewport(state, e.clientX, e.clientY),
    })
    if (wasDragging) dispatch("add_bound")
    else if (!state.fillMode) dispatch("continue_line")
    return
  }
  if (dragging) dispatch("add_line")
  dragging = false
}

export function onScroll(state, dispatch, e) {
  e.preventDefault()
  const primaryModifier = e.ctrlKey || e.metaKey
  if (primaryModifier && e.shiftKey)
    dispatch({
      action: "rotate",
      amt: (e.deltaY / 8) * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
    })
  else if (e.shiftKey)
    dispatch({
      action: "translate",
      amt: Dist.fromInflated(
        state,
        e.deltaY * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
        e.deltaX * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
      ),
    })
  else if (primaryModifier) {
    // Disable the broswer zoom shortcut
    e.preventDefault()
    dispatch({
      action: "scale",
      amtx: (e.deltaY / 8) * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
      amty: (e.deltaY / 8) * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
    })
  } else if (state.clipboard?.length && state.rotateClipboardOnScroll) {
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX
    const direction = Math.sign(delta) * (state.invertedScroll ? -1 : 1)
    if (direction) dispatch({ action: "increment_clipboard_rotation", amt: direction * 90 })
  } else
    dispatch({
      action: "translate",
      amt: Dist.fromInflated(
        state,
        e.deltaX * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
        e.deltaY * state.scrollSensitivity * (state.invertedScroll ? -1 : 1),
      ),
    })
}

// Keyboard events
export function onKeyDown(state, dispatch, e) {
  const key = e.code || e.key.toLowerCase()

  // Once the desktop bound shortcut is held, modifier changes can alter which
  // binding its repeat event matches (notably b becoming shift+b/clear_bounds).
  // Treat every repeat for that physical key as part of the original press.
  if (!state.mobile && activeBoundShortcutPresses.has(key)) {
    e.preventDefault?.()
    return
  }

  // If it's just a modifier key, don't do anything (it'll falsely trigger things)
  if (e.key === "Shift") {
    if (state.bounds.length === 1) {
      const deletingSelection = !rightSelectionDragging
      if (state.deletingSelection !== deletingSelection) dispatch({ deletingSelection })
    }
    return
  }
  if (["Meta", "Control", "Alt"].includes(e.key)) return

  var take = null
  for (const [shortcut, action] of Object.entries(state.keybindings))
    if (eventMatchesKeycode(e, shortcut)) {
      take = action
      break
    }

  if (take) {
    e.preventDefault?.()
    if (take.action === "add_bound" && !state.mobile)
      activeBoundShortcutPresses.set(key, { action: take, cursorPos: state.cursorPos })
    dispatch(take)
  }
}

export function onKeyUp(state, dispatch, e) {
  if (e.key === "Shift" && state.bounds.length === 1) {
    const deletingSelection = rightSelectionDragging
    if (state.deletingSelection !== deletingSelection) dispatch({ deletingSelection })
    return
  }

  const key = e.code || e.key.toLowerCase()
  const press = activeBoundShortcutPresses.get(key)
  if (!press) return

  activeBoundShortcutPresses.delete(key)
  e.preventDefault?.()
  if (!press.cursorPos.eq(state.cursorPos)) dispatch(press.action)
}

// Touch events
// This has to be a global variable instead of a state, because we attach the touchMove listener function directly,
// so we can have it not capture passively, so we can prevent default
// null or a 2 item list of the previous touches
var gestureTouches = null
var touchHoldTimer = null
// True if we're in the double tap window
// TODO: this can probably be removed in favor of Boolean(doubleTapTimer)
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
// The initial values aren't important, but they need to be initialized to something
var lastTapPos = new Point(-10, -10)
// If we hold, it creates a point, but then if we drag, instead of creating a line, it creates another bound on touchend
var holdAndDragPossible = false
var holdAndDragConverted = false
// Canvas option buttons are handled manually on touchstart. Consume the rest of that touch as well, or its touchmove
// events will move the cursor underneath the button.
var canvasButtonTouchActive = false

export function getGestureScaleDelta(scale, previousDistance, newDistance, sensitivity) {
  if (previousDistance <= 0) return 0
  return scale * (Math.pow(newDistance / previousDistance, sensitivity) - 1)
}

export function getGestureRotationDelta(previousTouches, newTouches) {
  const angle = (touches) =>
    Math.atan2(touches[1].pageY - touches[0].pageY, touches[1].pageX - touches[0].pageX) * (180 / Math.PI)
  return normalizeAngle(angle(newTouches) - angle(previousTouches))
}

// Creating lines:
// Lines start from the onTouchMove event. After we know it's not a double tap, or a hold or the like,
// we can start the line once we've changed cursorPos. We then start the line from where cursorPos was
// when the touch started.
// Lines are finished when the touch ends, we've been dragging (tapDragging), and there's only 1 finger
// touching the screen. (and also when the position of the touch has changed? should I maybe add that?)

// Double tap:
// we start a timer when we first touch the screen with a single finger. Then, multiple things can
// cancel that timer. Then, if we start another touch, and the timer is still valid, we double tap.
// Note -- doubleTapPossible is probably redundant for Boolean(doubleTapTimer). This can probably be changed.

// Holding:
// We start a timer from touchStart. several things can cancel that timer, just like double tap.
// If the timer expires, and is valid, it calls the hold function.

export function onTouchStart(state, dispatch, e) {
  e.preventDefault()
  if (e.touches.length === 1) canvasButtonTouchActive = false

  const { fillMode, clipboard } = state
  const touch = e.touches[0] || e.changedTouches[0]
  // I'm think this is good enough? I don't think I've had any issues because of it
  const touchCount = e.touches.length // || e.changedTouches.length

  const canvasButton = getCanvasButtonAt(state, touch.pageX, touch.pageY)
  if (canvasButton) {
    canvasButtonTouchActive = true
    dispatch(canvasButton.action)
    doubleTapIsPossible = false
    clearTimeout(doubleTapTimer)
    return
  }

  const newTapPos = Point.fromViewport(state, touch.pageX, touch.pageY)
  const newTapPosAligned = newTapPos.align(state)

  dispatch({ action: "cursor_moved", point: newTapPos })

  // We can only be dragging if a single finger has changed the cursorPos
  tapDragging = false
  singleTapTouchingScreen = touchCount === 1
  let is2ndTapOfDoubleTap = false

  if (singleTapTouchingScreen) {
    if (doubleTapIsPossible && lastTapPos.eq(newTapPosAligned)) {
      // If we're in the double tap window, and we tapped again? Double tap!
      doubleTapIsPossible = false
      clearTimeout(doubleTapTimer)
      onDoubleTap(state, dispatch)
      // See onTouchEnd for why this is here
      clearTimeout(touchHoldTimer)
      is2ndTapOfDoubleTap = true
    }
    // If we're not in the double tap window, start it
    else {
      doubleTapIsPossible = true
      clearTimeout(doubleTapTimer)
      doubleTapTimer = setTimeout(() => {
        doubleTapIsPossible = false
      }, state.doubleTapTimeMS)
    }
    lastTapPos = newTapPosAligned
  }

  if (!is2ndTapOfDoubleTap && singleTapTouchingScreen)
    // If we stop touching in that amount of time, we interrupt the timer, so this still works
    touchHoldTimer = setTimeout(() => onTouchHold(state, dispatch), state.holdTapTimeMS)
}

// This is the only thing that sets gestureTouches to null
export function onTouchEnd(state, dispatch, e) {
  e.preventDefault()

  const { fillMode, clipboard } = state

  // Well we're not holding anymore
  // NOTE: APPARENTLY browers will supress the 2nd touchend event if we double tap fast enough.
  // This is why we can't have nice things.
  // So instead, if we detect that a touchstart event is the 2nd part of a double tap, we just
  // disable the hold timer from there.
  clearTimeout(touchHoldTimer)

  if (canvasButtonTouchActive) {
    canvasButtonTouchActive = false
    gestureTouches = null
    holdAndDragPossible = false
    holdAndDragConverted = false
    singleTapTouchingScreen = false
    tapDragging = false
    return
  }

  // If we're coming off of a gesture, don't do anything
  // We don't support 3 finger gestures, so this will always be fine
  if (gestureTouches) {
    gestureTouches = null
    clearTimeout(touchHoldTimer)
    return
  }

  // Only add lines if we've been dragging
  if (!clipboard?.length && !fillMode && tapDragging && singleTapTouchingScreen)
    if (holdAndDragPossible) dispatch("add_bound")
    else dispatch("add_line")

  if (fillMode && !clipboard?.length && singleTapTouchingScreen)
    if (tapDragging)
      // A fill drag is only a preview. Clear it on release even if the finger is
      // still inside a polygon; only an unmoved tap commits the fill.
      dispatch({ curPolys: [] })
    else dispatch("fill")

  holdAndDragPossible = false
  holdAndDragConverted = false
  singleTapTouchingScreen = false
  tapDragging = false
}

export function onTouchMove(state, dispatch, e) {
  e.preventDefault()
  if (canvasButtonTouchActive) return

  // We can allow double taps if we move, but not enough to change cursorPos
  if (e.touches.length === 2) {
    // Immediately stop all double tap, tap and hold, dragging, and curLinePos
    tapDragging = false
    dragging = false
    doubleTapIsPossible = false
    clearTimeout(doubleTapTimer)
    clearTimeout(touchHoldTimer)
    dispatch({ curLinePos: null })

    if (gestureTouches !== null) {
      const {
        distance: newDist,
        centerx: newCenterx,
        centery: newCentery,
      } = distCenter(e.touches[0].pageX, e.touches[0].pageY, e.touches[1].pageX, e.touches[1].pageY)

      const {
        distance: prevDist,
        centerx: prevCenterx,
        centery: prevCentery,
      } = distCenter(gestureTouches[0].pageX, gestureTouches[0].pageY, gestureTouches[1].pageX, gestureTouches[1].pageY)

      // TODO: enableGestureScale is broken -- not sure if it still is
      // This line helps stablize translation
      const shouldScale =
        !state.smoothGestureScale || Math.abs((prevDist - newDist) * state.gestureScaleSensitivity) > 0.6
      dispatch({
        action: "gesture_transform",
        previousCenter: { x: prevCenterx, y: prevCentery },
        currentCenter: { x: newCenterx, y: newCentery },
        amtx: shouldScale ? getGestureScaleDelta(state.scalex, prevDist, newDist, state.gestureScaleSensitivity) : 0,
        amty: shouldScale ? getGestureScaleDelta(state.scaley, prevDist, newDist, state.gestureScaleSensitivity) : 0,
        rotateAmt: state.allowCanvasRotation ? getGestureRotationDelta(gestureTouches, e.touches) : 0,
      })
    } else dispatch({ curLinePos: null })

    gestureTouches = e.touches
  } else if (e.touches.length === 1 && gestureTouches === null) {
    const touch = e.touches[0] || e.changedTouches[0]
    const { clipboard, fillMode, curLinePos } = state
    const touchPoint = Point.fromViewport(state, touch.pageX, touch.pageY)
    const touchPointAligned = touchPoint.align(state, clipboard === null && state.allowSnapToIntersections)

    if (
      holdAndDragPossible &&
      !holdAndDragConverted &&
      !clipboard?.length &&
      !fillMode &&
      !lastTapPos.eq(touchPointAligned)
    ) {
      dispatch("convert_last_generic_selector_to_bound")
      holdAndDragConverted = true
    }

    // If we move while holding, that's fine, as long as we haven't moved enough to change cursorPos.
    // If we move enough to change cursorPos, we stop holding.
    // The cursor_moved action calls cursorPosChanged() if the cursor has moved enough to change cursorPos.
    if (tapDragging && !holdAndDragPossible && !clipboard?.length && !fillMode && !curLinePos)
      if (touchHoldTimer) {
        clearTimeout(touchHoldTimer)
        dispatch({ action: "add_line", at: lastTapPos })
      }

    dispatch({
      action: "cursor_moved",
      point: touchPoint,
    })
  }
}

export function cursorPosChanged(newPos) {
  if (singleTapTouchingScreen && !lastTapPos.eq(newPos)) {
    clearTimeout(touchHoldTimer)
    clearTimeout(doubleTapTimer)
    doubleTapIsPossible = false
    tapDragging = true
  }
}

function onTouchHold(state, dispatch) {
  const { fillMode, clipboard } = state
  holdAndDragPossible = true
  clearTimeout(doubleTapTimer)
  doubleTapIsPossible = false
  // This also only applies to touch events, not mouse events
  if (singleTapTouchingScreen && !fillMode)
    if (clipboard?.length) dispatch("paste")
    else dispatch("add_generic_selector")
}

function onDoubleTap(state, dispatch) {
  // This is only for touches, mouse clicks aren't counted.
  // e is the event of the last touchend event, which is guranteed ("should") be within 1 scalex of the first tap
  dispatch("delete_at_cursor")
}

// This keeps the focus always on the paper element
export function onBlur(state, dispatch, e) {
  activeBoundShortcutPresses.clear()
  middleMouseDown = false
  middleLineDragging = false
  middleDragStart = null
  rightMouseDown = false
  rightSelectionDragging = false
  rightDragStart = null
  if (state.deletingSelection) dispatch({ deletingSelection: false })
  setTimeout(function () {
    if (document.activeElement.nodeName !== "INPUT" || document.activeElement.type === "checkbox") e.target.focus()
  }, 100)
}
