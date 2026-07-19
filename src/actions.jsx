// These are actions exclusively for the reducer to use. They all take the current state as the first parameter, and
// optionally take a 2nd parameter which is an object of anything passed to dispatch. They return modifications to the
// existing state. Return {}, undefined or null to not modify the state.

// NOTE: when adding new actions, go through options.jsx and add them to reversibleActions and saveSettingActions, if applicable

/* eslint-disable no-unused-vars */

import { viewportWidth, viewportHeight, undoStack, redoStack, MIRROR_ROT, MIRROR_AXIS, MIRROR_TYPE } from "./globals"
import {
  getSelected,
  getBoundRect,
  splitAllLines,
  getAllClipboardLines,
  incrementMirrorAxis,
  normalizeLines,
  getPreviewPolys,
  getLinesRect,
  getHalf,
  randomizeColor,
} from "./utils"
import options from "./options"
import {
  deserializePattern,
  download,
  image,
  serializePattern,
  saveLocally,
  loadLocally,
  clearSaves,
  deleteLocally,
} from "./fileUtils"
import { cursorPosChanged } from "./events"
import Point from "./helper/Point"
import Dist from "./helper/Dist"
import Line from "./helper/Line"
import Rect from "./helper/Rect"
import Poly from "./helper/Poly"
import { tourState } from "./states"
import * as turf from "@turf/turf"
import Color from "colorjs.io"
import { normalizeAngle } from "./transformUtils"

function positionCursorAtEdges(state, point, edgePoint = point) {
  const width = viewportWidth()
  const height = viewportHeight()
  if (state.loopCursorAtEdges) {
    const edge = edgePoint.asViewport(state)
    let targetx = edge.x
    let targety = edge.y

    if (edge.x <= 0) targetx = width - 1
    else if (edge.x >= width - 1) targetx = 0

    if (edge.y <= 0) targety = height - 1
    else if (edge.y >= height - 1) targety = 0

    return { cursorPos: Point.fromViewport(state, targetx, targety).align(state) }
  }

  const viewportPoint = point.asViewport(state)
  let translateXpx = 0
  let translateYpx = 0

  if (viewportPoint.x < 0) translateXpx = -viewportPoint.x
  else if (viewportPoint.x > width - 1) translateXpx = -(viewportPoint.x - (width - 1))

  if (viewportPoint.y < 0) translateYpx = -viewportPoint.y
  else if (viewportPoint.y > height - 1) translateYpx = -(viewportPoint.y - (height - 1))

  return {
    cursorPos: point,
    ...(translateXpx || translateYpx
      ? { translation: state.translation.add(Dist.fromInflated(state, translateXpx, translateYpx)) }
      : {}),
  }
}

export const cursor_moved = (state, { point }) => {
  const { cursorPos, debugDrawPoints, fillMode, tempPolys, clipboard, allowSnapToIntersections } = state
  // This is here so when a touch is being held, and has moved enough to move the cursor, it disables the hold action
  const alignedPos = point.align(state, clipboard === null && allowSnapToIntersections)
  const edgeState = positionCursorAtEdges(state, alignedPos, point)
  const newPos = edgeState.cursorPos
  if (!cursorPos.eq(newPos)) cursorPosChanged(newPos)
  return {
    ...edgeState,
    boundDragging: true,
    // This is only tracked because fillMode uses it
    mousePos: point,
    curPolys: fillMode ? getPreviewPolys({ ...state, mousePos: point }, tempPolys) : null,
    debugDrawPoints: {
      ...debugDrawPoints,
      Mouse: { point: point, color: "grey", yoff: -10, inflated: true, fill: fillMode ? "transparent" : "grey" },
    },
  }
}

// Transformation Actions
export const translate = (state, { amt } /*Dist*/) => {
  // If we're repeating, don't let the selection move out of the viewport
  // I think this is how we check if we're currently repeating
  // TODO: test this
  const { boundRect, trellis, openMenus } = state
  if (boundRect && (trellis || openMenus.repeat)) {
    const rect = boundRect.asViewport(state)
    const { x, y } = amt.asViewport(state)
    if (rect.left + x < 0 || rect.right + x > viewportWidth() || rect.top + y < 0 || rect.bottom + y > viewportHeight())
      return
  }
  return {
    translation: state.translation.add(amt),
    // TODO: make this an advanced setting
    // Keep the cursor on the same dot as we translate
    // cursorPos: cursorPos,
    // Keep the cursor in the same place in the window as we translate
    // cursorPos: cursorPos.add(data.amt.neg()).align(state),
  }
}

export const scale = (state, { amtx, amty, center = state.cursorPos }) => {
  // args: amtx, amty (delta values), optional: center (Point) (defaults to cursorPos)
  const { translation, scalex, scaley } = state

  const newScalex = Math.min(options.maxScale, Math.max(options.minScale, scalex + amtx))
  const newScaley = Math.min(options.maxScale, Math.max(options.minScale, scaley + amty))

  const centerViewport = center.asViewport(state)
  const centerAtNewScale = Point.fromViewport(
    { ...state, scalex: newScalex, scaley: newScaley },
    centerViewport.x,
    centerViewport.y,
  )

  return {
    scalex: newScalex,
    scaley: newScaley,
    // Keep the logical center point under the same viewport position.
    translation: translation.add(centerAtNewScale.sub(center)),
    curLinePos: null,
  }
}

export const rotate = (state, { amt = 0, angle, center = state.cursorPos }) => {
  if (state.allowCanvasRotation === false) return {}

  const nextRotate = normalizeAngle(angle ?? (state.rotate ?? 0) + amt)
  const centerViewport = center.asViewport(state)
  const centerAtNewRotation = Point.fromViewport({ ...state, rotate: nextRotate }, centerViewport.x, centerViewport.y)
  return {
    rotate: nextRotate,
    translation: state.translation.add(centerAtNewRotation.sub(center)),
  }
}

export const gesture_transform = (state, { previousCenter, currentCenter, amtx = 0, amty = 0, rotateAmt = 0 }) => {
  const scalex = Math.min(options.maxScale, Math.max(options.minScale, state.scalex + amtx))
  const scaley = Math.min(options.maxScale, Math.max(options.minScale, state.scaley + amty))
  const nextRotate =
    state.allowCanvasRotation === false ? state.rotate : normalizeAngle((state.rotate ?? 0) + rotateAmt)
  const anchor = Point.fromViewport(state, previousCenter.x, previousCenter.y)
  const targetCenter = {
    x: previousCenter.x + (currentCenter.x - previousCenter.x) * state.gestureTranslateSensitivity,
    y: previousCenter.y + (currentCenter.y - previousCenter.y) * state.gestureTranslateSensitivity,
  }
  const anchorAtNewTransform = Point.fromViewport(
    { ...state, scalex, scaley, rotate: nextRotate },
    targetCenter.x,
    targetCenter.y,
  )

  return {
    scalex,
    scaley,
    rotate: nextRotate,
    translation: state.translation.add(anchorAtNewTransform.sub(anchor)),
    curLinePos: null,
  }
}

export const set_canvas_rotation_allowed = (state, { allowed }) => ({
  allowCanvasRotation: allowed,
  rotate: allowed ? state.rotate : 0,
})
export const increase_scale = (state) => scale(state, state.scalex, state.scaley)
export const decrease_scale = (state) => scale(state, -state.scalex, -state.scaley)

// TODO: disallow this if it would put the selection off screen and we're repeating
export const go_home = (state) => ({
  translation: Dist.zero(),
  scalex: state.defaultScalex,
  scaley: state.defaultScaley,
  rotate: 0,
  shearx: 0,
  sheary: 0,
  curLinePos: null,
})

export const go_to_selection = (state) => {
  const boundRect = getBoundRect(state)
  if (boundRect)
    return {
      translation: state.translation.add(
        Point.fromViewport(state, viewportWidth() / 2, viewportHeight() / 2).sub(boundRect.center),
      ),
    }
}

const moveCursor = (state, x, y) => {
  const cursorPos = state.cursorPos.add(Dist.fromDeflated(state, x, y))
  return positionCursorAtEdges(state, cursorPos)
}

export const left = (state) => moveCursor(state, -1, 0)
export const right = (state) => moveCursor(state, 1, 0)
export const up = (state) => moveCursor(state, 0, -1)
export const down = (state) => moveCursor(state, 0, 1)

// Selection Actions
export const add_specific_selector = (state) => ({
  specificSelectors: state.cursorPos.in(state.specificSelectors)
    ? state.specificSelectors
    : [...state.specificSelectors, state.cursorPos],
})

export const add_generic_selector = (state) => ({
  genericSelectors: state.cursorPos.in(state.genericSelectors)
    ? state.genericSelectors
    : [...state.genericSelectors, state.cursorPos],
})

export const clear_specific_selectors = (state) => ({
  ...cancel_clipboard(state),
  specificSelectors: [],
})

export const clear_generic_selectors = (state) => ({
  ...cancel_clipboard(state),
  genericSelectors: [],
})

// For touch & hold & drag specifically
const convertLastSelectorToBound = (state, selectorType) => {
  const selectorKey = `${selectorType}Selectors`
  const selectors = state[selectorKey]
  return {
    bounds: [selectors[selectors.length - 1]],
    [selectorKey]: selectors.slice(0, selectors.length - 1),
  }
}

export const convert_last_generic_selector_to_bound = (state) => convertLastSelectorToBound(state, "generic")

export const convert_last_specific_selector_to_bound = (state) => convertLastSelectorToBound(state, "specific")

export const clear_bounds = (state) => ({
  ...cancel_clipboard(state),
  bounds: [],
  deletingSelection: false,
})

export const select_all = (state) => {
  const rect = getLinesRect(state.lines)
  return { bounds: rect ? [rect.topLeft, rect.bottomRight] : [], deletingSelection: false }
}

// Destruction Actions
export const clear = (state) => ({
  translation: Dist.zero(),
  // We want to keep the current scale, but reset everything else
  // scalex: state.defaultScalex,
  // scaley: state.defaultScaley,
  rotate: 0,
  lines: [],
  bounds: [],
  deletingSelection: false,
  openMenus: { ...state.openMenus, delete: false, repeat: false },
  filledPolys: [],
  polygons: [],
  fillMode: false,
  clipboard: null,
  clipboardMirrorAxis: MIRROR_AXIS.NONE,
  clipboardRotation: MIRROR_ROT.NONE,
  specificSelectors: [],
  genericSelectors: [],
  curLinePos: null,
  mirrorOrigins: [],
  mirrorAxis: MIRROR_AXIS.NONE,
  mirrorRot: MIRROR_ROT.NONE,
})

export const delete_selected = (state) => {
  const boundRect = getBoundRect(state)
  return {
    ...cancel_clipboard(state),
    lines: state.lines.filter((line) => !line.isSelected(state, boundRect)),
    bounds: state.removeSelectionAfterDelete ? [] : state.bounds,
  }
}

export const delete_specific_line = (state, { start, end }) => ({
  lines: state.lines.filter((line) => !((line.a.eq(start) && line.b.eq(end)) || (line.a.eq(end) && line.b.eq(start)))),
})

export const delete_unselected = (state) => {
  const boundRect = getBoundRect(state)
  return {
    ...cancel_clipboard(state),
    lines: state.lines.filter((line) => line.isSelected(state, boundRect)),
    bounds: state.removeSelectionAfterDelete ? [] : state.bounds,
  }
}

export const delete_at_cursor = (state, { allowDeleteSelected = false } = {}) => {
  const {
    cursorPos,
    bounds,
    curLinePos,
    clipboard,
    lines,
    fillMode,
    mirrorOrigins,
    specificSelectors,
    genericSelectors,
  } = state
  // If we're in fill mode, clear the fill of whatever we're over
  if (fillMode) return clear_fill(state)
  // If we're over any selectors, delete them
  if (
    (specificSelectors.length > 0 && cursorPos.in(specificSelectors)) ||
    (genericSelectors.length > 0 && cursorPos.in(genericSelectors))
  )
    return {
      specificSelectors: specificSelectors.filter((p) => !p.eq(cursorPos)),
      genericSelectors: genericSelectors.filter((p) => !p.eq(cursorPos)),
    }
  // If we're over a bound, delete it
  if (cursorPos.in(bounds)) return { bounds: cursorPos.remove(bounds), deletingSelection: false }
  // If we are halfway done drawing a line, delete it
  if (curLinePos) return { curLinePos: null }
  // If we have a clipboard, clear it
  if (clipboard) return cancel_clipboard(state)
  // If we're over a mirror origin, delete it
  if (cursorPos.in(mirrorOrigins.map((o) => o.origin))) return remove_mirror_origin(state, { origin: cursorPos })
  // If we have selected lines, delete them
  if (allowDeleteSelected && getSelected(state).length > 0) return delete_selected(state)
  // If there's a current selection, remove it
  if (bounds.length === 1) return clear_bounds(state)

  let linesWithoutStartEndStep = lines.filter(
    (line) => !cursorPos.mirror(state).some((point) => point.in(line.points())),
  )
  // If there's no lines without a start/end point at the cursor, and we're over an intersection,
  // remove the lines that intersect at that point
  if (linesWithoutStartEndStep.length === lines.length)
    if (!cursorPos.isAlignedWithGrid()) return remove_lines_at_intersection(state)
    // Otherise, if we are aligned, and there's nothing to remove, don't do anything
    else return state
  // If we're at an intersection, and we've created a line or lines using that intersection, remove those lines first
  // Otherwise, just remove the lines that start/end at the cursor, as usual
  else return { lines: linesWithoutStartEndStep }
}

export const remove_lines_at_intersection = (state, args) => {
  // args: { intersection: Point }, defaults to cursorPos
  const { cursorPos, lines } = state
  return {
    lines: lines.filter((line) => !line.findIntersections(lines).some((p) => p.eq(args?.intersection ?? cursorPos))),
  }
}

export const nevermind = (state) => {
  const { clipboard, curLinePos, bounds } = state
  if (clipboard) return cancel_clipboard(state)
  else if (curLinePos) return { curLinePos: null }
  else if (bounds.length) return clear_bounds(state)
  // else if (openMenus.main && !mobile)
  //     return {...state, openMenus: {...openMenus, main: false}}
  return state
}

// Creation actions
export const pick_up_line_end = (state) => {
  const lineIndex = state.lines.findIndex((line) => state.cursorPos.in(line.points()))
  if (lineIndex === -1) return {}

  const line = state.lines[lineIndex]
  return {
    lines: state.lines.filter((_, index) => index !== lineIndex),
    curLinePos: line.otherEnd(state.cursorPos),
  }
}

export const add_line = (state, args) => {
  const {
    clipboard,
    clipboardMirrorAxis,
    clipboardRotation,
    clipboardOffset,
    curLinePos,
    lines,
    cursorPos,
    mobile,
    fillMode,
  } = state
  const point = args.at || cursorPos
  if (fillMode) return
  // If we have a clipboard, paste it
  if (clipboard && !mobile)
    return {
      ...paste(state),
      clipboard: args.continue ? clipboard : null,
      clipboardMirrorAxis: args.continue ? clipboardMirrorAxis : MIRROR_AXIS.NONE,
      clipboardRotation: args.continue ? clipboardRotation : MIRROR_ROT.NONE,
      clipboardOffset: args.continue ? clipboardOffset : null,
    }
  else {
    // This is so you undo the whole line all at once, instead of only undoing half the line at a time
    if (curLinePos !== null) undoStack.pop()

    var newLines = []
    // If we have a line in progress, create it
    if (curLinePos != null) {
      let start = curLinePos.mirror(state)
      let end = point.mirror(state)

      start.map((a, i) => newLines.push(new Line(state, a, end[i])))
    }

    return { ...state, curLinePos: curLinePos === null ? point : null, lines: [...lines, ...newLines] }
  }
}

export const continue_line = (state) => ({
  ...add_line(state, { continue: true }),
  curLinePos: state.clipboard ? state.curLinePos : state.cursorPos,
})

export const add_bound = (state) => {
  const newBounds = state.cursorPos.in(state.bounds)
    ? state.cursorPos.remove(state.bounds)
    : [...state.bounds, state.cursorPos]
  const newBoundRect = Rect.fromPoints(...newBounds)
  const bounds = newBounds.filter((p) => newBoundRect.onEdge(p))

  if (state.deletingSelection && bounds.length > 1) {
    const selectionState = {
      ...state,
      bounds,
      boundDragging: false,
      genericSelectors: [],
      specificSelectors: [],
    }
    return {
      ...delete_selected(selectionState),
      bounds: [],
      boundDragging: false,
      curLinePos: null,
      deletingSelection: false,
    }
  }

  return {
    bounds,
    curLinePos: null,
    deletingSelection: state.deletingSelection && bounds.length === 1,
  }
}

// Color actions
export const set_color_profile_index = (state, { index }) => {
  const colors = state.fillMode ? state.fill : state.stroke
  if (!Number.isInteger(index) || index < 0 || index >= colors.length) return {}
  return { colorProfile: index }
}

export const set_color = (state, { color }) => {
  let copy = JSON.parse(JSON.stringify(state.fillMode ? state.fill : state.stroke))
  copy[state.colorProfile] = color
  return { [state.fillMode ? "fill" : "stroke"]: copy }
}

export const randomize_colors = (state) => ({
  [state.fillMode ? "fill" : "stroke"]: Array.from({ length: options.commonColorAmt }, () =>
    randomizeColor(state.paperColor),
  ),
})

export const randomize_color = (state) => set_color(state, { color: randomizeColor(state.paperColor) })

export const set_stroke_width = (state, { strokeWidth }) => {
  let copy = JSON.parse(JSON.stringify(state.strokeWidth))
  copy[state.colorProfile] = strokeWidth
  return { strokeWidth: copy }
}

export const set_dash = (state, { dash }) => {
  let copy = JSON.parse(JSON.stringify(state.dash))
  copy[state.colorProfile] = dash
  return { dash: copy }
}

export const paint_selected = (state) => {
  const selected = new Set(getSelected(state))
  if (!selected.size) return {}

  const { colorProfile, stroke, strokeWidth, dash, lineCap, lineJoin } = state
  const aes = {
    stroke: stroke[colorProfile],
    width: strokeWidth[colorProfile],
    dash: dash[colorProfile],
    lineCap,
    lineJoin,
  }

  return { lines: state.lines.map((line) => (selected.has(line) ? line.copy(undefined, undefined, aes) : line)) }
}

export const set_paper_color = (state, { color }) => ({ paperColor: color })

// Fill actions
export const fill = (state) => {
  const { fillMode, curPolys, filledPolys, fill, colorProfile } = state
  if (fillMode && curPolys.length)
    return {
      filledPolys: [
        ...filledPolys,
        // Set the color of the new polys
        ...curPolys.map((p) => p.withColor(fill[colorProfile])),
      ],
    }
}

export const clear_fill = (state) => {
  const { cursorPos, filledPolys } = state
  return { filledPolys: filledPolys.filter((poly) => !cursorPos.mirror(state).some((p) => poly.contains(p))) }
}

export const toggle_fill_mode = (state) => {
  const { fillMode, lines } = state

  let polys = null
  if (!fillMode) {
    const lns = normalizeLines(splitAllLines(lines))
    polys = Poly.fromFeatureCollection(
      turf.polygonize(turf.multiLineString(lns.map((line) => [line.a.xy(), line.b.xy()]))),
    )
  }

  return {
    fillMode: !fillMode,
    tempPolys: polys,
    curLine: null,
    clipboard: null,
    // So we don't have to move the mouse to see the fill
    curPolys: !fillMode ? getPreviewPolys(state, polys) : null,
  }
}

// Undo Actions
export const undo = (state) => {
  // console.log("undoing...")
  // console.log("undo stack:", undoStack)
  // console.log("redo stack:", redoStack)
  const prevState = undoStack.pop()
  if (prevState !== undefined) {
    // console.log("undoing")
    redoStack.push(prevState)
    // console.log("undo stack is now:", undoStack)
    // console.log("redo stack is now:", redoStack)
    // TODO: have this maintain the current state except for the undo keys
    return prevState
  }
}
export const redo = (state) => {
  // console.log("redoing...")
  // console.log("undo stack:", undoStack)
  // console.log("redo stack:", redoStack)
  const nextState = redoStack.pop()
  if (nextState === undefined)
    // console.log("nothing to redo, ignoring")
    return state

  undoStack.push(nextState)
  // console.log("undo stack is now:", undoStack)
  // console.log("redo stack is now:", redoStack)
  return nextState //{...state, ...nextState}
}
// Clipboard Actions
export const cancel_clipboard = (state) => ({
  clipboard: null,
  clipboardMirrorAxis: MIRROR_AXIS.NONE,
  clipboardRotation: MIRROR_ROT.NONE,
  clipboardOffset: null,
})
export const paste = (state) => {
  if (state.clipboard) return { lines: [...state.lines, ...getAllClipboardLines(state)] }
}
export const copy = (state) => ({
  clipboard: getSelected(state, "center"),
  curLinePos: null,
  clipboardOffset: getBoundRect(state)?.centerOffset,
  bounds: state.removeSelectionAfterCopy ? [] : state.bounds,
})
export const cut = (state) => {
  const boundRect = getBoundRect(state)
  if (boundRect)
    return {
      ...delete_selected(state),
      clipboard: getSelected(state, "center"),
      clipboardOffset: boundRect.centerOffset,
      curLinePos: null,
    }
}

export const increment_clipboard_rotation = (state, { amt = 90 } = {}) => ({
  clipboardRotation: (((state.clipboardRotation + amt) % 360) + 360) % 360,
})
export const increment_clipboard_mirror_axis = (state) => ({
  clipboardMirrorAxis: incrementMirrorAxis(state.clipboardMirrorAxis, true),
})

// Mirror Actions
export const add_mirror_origin = (state) => {
  const { mirrorOrigins, mirrorAxis, mirrorRot, cursorPos, mirrorType } = state
  if ((mirrorAxis || mirrorRot) && mirrorOrigins.length < options.maxMirrorOrigins) {
    // Ensure that the origin is unique
    const existing = mirrorOrigins.findIndex((o) => o.origin.eq(cursorPos))
    if (existing !== -1) return mirrorOrigins.slice(0, existing)
    return {
      mirrorOrigins: [
        ...mirrorOrigins,
        { origin: mirrorType == MIRROR_TYPE.CURSOR ? cursorPos : getHalf(state), rot: mirrorRot, axis: mirrorAxis },
      ],
      // Reset mirror settings to show that it was added
      mirrorAxis: MIRROR_AXIS.NONE,
      mirrorRot: MIRROR_ROT.NONE,
    }
  }
}

export const remove_mirror_origin = (state, { origin }) => {
  const copy = [...state.mirrorOrigins]
  copy.splice(
    copy.findIndex((o) => o.origin.eq(origin)),
    1,
  )
  return { mirrorOrigins: copy }
}
export const clear_mirror_origins = () => ({ mirrorOrigins: [] })

// File Actions
export const download_file = (state, { format, name, selectedOnly, rect }) => {
  switch (format) {
    case "svg":
      download(name, "image/svg+xml", { str: serializePattern(state, selectedOnly) })
      break
    case "png":
    case "jpeg":
      image(state, format, rect, false, selectedOnly && state.bounds.length > 1, (url) =>
        download(name + "." + format, `image/${format}`, { url }),
      )
      break
    default:
      console.error("Invalid format given to download:", format)
      break
  }
}

export const upload_file = (state, { str }) => deserializePattern(str)

export const save_local = (state, { name }) => {
  // saveLocally(name || state.filename, serializePattern(state))
  saveLocally(name || state.filename, state)
  // setTimeout(() => cursor_moved(state, {point: state.cursorPos}), 100)
  // TODO: why is this required? Is it still?
  return { reloadRequired: true }
}

export const load_local = (state, { name }) => {
  loadLocally(name)
  return { filename: name }
}

export const delete_local = (state, { name }) => deleteLocally(name)

export const copy_image = (state) => {
  const selectedLines = getSelected(state)
  const lines = selectedLines.length ? selectedLines : state.lines
  const rect = getLinesRect(lines)
  if (!rect) return

  image(
    state,
    "png",
    rect,
    false,
    selectedLines.length > 0,
    (blob) => {
      try {
        const write = navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ])
        Promise.resolve(write).catch((error) => console.error(error))
      } catch (error) {
        console.error(error)
      }
    },
    true,
  )
}

export const deserialize = (state, { data }) => data

export const clear_saves = () => {
  clearSaves()
  // return {reloadRequired: true}
}

// Tour Actions
var preTourState = null
export const start_tour = (state) => {
  preTourState = state
  console.log("starting tour")
  return tourState({ ...state, ...go_home(state) })
}
export const end_tour = () => preTourState

// Misc Actions
export const toggle_partials = (state) => ({ partials: !state.partials })
export const toggle_dots = (state) => ({ hideDots: !state.hideDots })
export const apply_trellis = () => ({ trellis: true })

export const set_manual = (state, { action, ...data }) => data

export const set_manual_and_save_settings = (state, { action, ...data }) => data

// This function defines how all the menus & pages interact with each other
// Nav is not a mini menu, it can be open indepedently
const miniMenus = ["extra", "color", "mirror", "select", "clipboard", "delete"]
export const menu = (state, { toggle, open, close }) => {
  const { openMenus, hideDots } = state

  let copy = JSON.parse(JSON.stringify(openMenus))
  if (toggle !== undefined) copy[toggle] = !copy[toggle]
  if (open !== undefined) copy[open] = true
  if (close !== undefined) copy[close] = false

  // Only allow one mini menu to be open at a time
  if (
    (open !== undefined && miniMenus.includes(open)) ||
    (toggle !== undefined && copy[toggle] && miniMenus.includes(toggle))
  ) {
    const setFalse = miniMenus.filter((i) => i !== open && i !== toggle)
    Object.keys(copy).forEach((key) => {
      copy[key] = setFalse.includes(key) ? false : copy[key]
    })
  }

  // If we close the toolbar (main), close all the mini menus as well (except repeat)
  if (close === "main" || (toggle === "main" && !copy[toggle]))
    Object.keys(copy).forEach((key) => {
      // Toolbar and repeat menus are independent of each other
      if (key !== "repeat") copy[key] = false
    })

  let repeatToast = false
  // Don't allow the repeat menu to be opened if we don't have a *finished* selection
  if (copy.repeat && state.bounds.length < 2) {
    copy.repeat = false
    repeatToast = true
  }

  // If we open the repeat menu, close the toolbar (and it's mini menus). They can both be open at the same time though
  if (open === "repeat" || (toggle === "repeat" && copy[toggle])) {
    copy.main = false
    copy.navigation = false
    miniMenus.forEach((key) => (copy[key] = false))
  }

  // If we close the repeat menu, open the toolbar back up.
  // This is so we don't have to manually open the toolbar after closing the repeat menu
  if (close === "repeat" || (toggle === "repeat" && !copy[toggle])) copy.main = true

  return {
    openMenus: { ...copy },
    curLinePos: null,
    // If we close the repeat menu, and we have dots turned off, turn them back on
    hideDots: !(openMenus.repeat && !copy.repeat) && hideDots,
    toast: repeatToast ? "Please select an area to repeat" : null,
  }
}

// Debugging Actions
export const debug = (state, data) => {
  // console.log('cursorPos', cursorPos)
  // console.log('lines', lines)
  console.log("state", state)
  console.log("selected", getSelected(state, "topLeft"))
  // console.log('curLinePos', curLinePos)
  console.log("lines", state.lines)
  console.log("boundRect", getBoundRect(state))
}
export const toggle_debugging = (state) => ({ debug: !state.debug })
