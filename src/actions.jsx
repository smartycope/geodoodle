// These are actions exclusively for the reducer to use. They all take the current state as the first parameter, and
// optionally take a 2nd parameter which is an object of anything passed to dispatch. They return modifications to the
// existing state. Return {}, undefined or null to not modify the state.

import { viewportWidth, viewportHeight, undoStack, redoStack, MIRROR_ROT, MIRROR_AXIS } from "./globals"
import {
  getSelected,
  getBoundRect,
  splitAllLines,
  getAllClipboardLines,
  incrementMirrorAxis,
  normalizeLines,
  getPreviewPolys,
} from "./utils"
import defaultOptions from "./options"
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
// import {setTapHolding} from './globals';
import { cursorPosChanged } from "./events"
import Point from "./helper/Point"
import Dist from "./helper/Dist"
import Line from "./helper/Line"
import Rect from "./helper/Rect"
import Poly from "./helper/Poly"
import { tourState } from "./states"
import * as turf from "@turf/turf"

// TODO: some way to "pick up" the end of a line and move it

/* eslint-disable no-unused-vars */

export const cursor_moved = (state, { point }) => {
  const { cursorPos, debugDrawPoints, fillMode, tempPolys } = state
  // This is here so when a touch is being held, and has moved enough to move the cursor, it disables the hold action
  const newPos = point.align(state)
  if (!cursorPos.eq(newPos)) cursorPosChanged(newPos)
  return {
    cursorPos: newPos,
    boundDragging: true,
    // This is only tracked because fillMode uses it
    mousePos: point,
    curPolys: fillMode ? getPreviewPolys(state, tempPolys) : null,
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
    const { x, y } = amt.asInflated(state)
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

  const newScalex = Math.min(defaultOptions.maxScale, Math.max(defaultOptions.minScale, scalex + amtx))
  const newScaley = Math.min(defaultOptions.maxScale, Math.max(defaultOptions.minScale, scaley + amty))

  const { x: cx, y: cy } = center.asViewport(state, true)

  // The difference between the rescaled and the unscaled translation differences
  const diffx = cx / scalex - cx / newScalex
  const diffy = cy / scaley - cy / newScaley

  return {
    scalex: newScalex,
    scaley: newScaley,
    // Move the translation to keep the center in the same place. We need to translate the difference between the
    // unscaled and the rescaled translation to make up for the change in scale
    translation: translation.sub(diffx, diffy),
    curLinePos: null,
  }
}

export const rotate = (state, { amt }) => ({ rotate: state.rotate + amt })
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
    // I have no idea why this is inverted, but whatever
    return {
      translation: boundRect.center
        .neg()
        .add(Dist.fromInflated(state, viewportWidth() / 2, viewportHeight() / 2))
        .asDist(),
    }
}

export const left = (state) => ({ cursorPos: state.cursorPos.add(Dist.fromDeflated(state, -1, 0)) })
export const right = (state) => ({ cursorPos: state.cursorPos.add(Dist.fromDeflated(state, 1, 0)) })
export const up = (state) => ({ cursorPos: state.cursorPos.add(Dist.fromDeflated(state, 0, -1)) })
export const down = (state) => ({ cursorPos: state.cursorPos.add(Dist.fromDeflated(state, 0, 1)) })

// Destruction Actions
export const clear = (state) => ({
  translation: Dist.zero(),
  // We want to keep the current scale, but reset everything else
  // scalex: state.defaultScalex,
  // scaley: state.defaultScaley,
  rotate: 0,
  lines: [],
  bounds: [],
  openMenus: { ...state.openMenus, delete: false, repeat: false },
  filledPolys: [],
  polygons: [],
  fillMode: false,
  clipboard: null,
  clipboardMirrorAxis: MIRROR_AXIS.NONE,
  clipboardRotation: MIRROR_ROT.NONE,
  eraser: null,
  curLinePos: null,
  mirrorOrigins: [],
  mirrorAxis: MIRROR_AXIS.NONE,
  mirrorRot: MIRROR_ROT.NONE,
})
export const clear_bounds = (state) => ({
  ...cancel_clipboard(state),
  bounds: [],
  // If we're on mobile, clearing bounds changes the ToolButton to add_bound, so close the menu cause suddenly there's nothing in it
  openMenus: { ...state.openMenus, select: state.mobile ? false : state.openMenus.select },
})
export const delete_selected = (state) => {
  const boundRect = getBoundRect(state)
  return {
    ...cancel_clipboard(state),
    lines: state.lines.filter((line) => !line.isSelected(state, boundRect)),
    bounds: state.removeSelectionAfterDelete ? [] : state.bounds,
  }
}
export const delete_unselected = (state) => {
  const boundRect = getBoundRect(state)
  return {
    ...cancel_clipboard(state),
    lines: state.lines.filter((line) => line.isSelected(state, boundRect)),
    bounds: state.removeSelectionAfterDelete ? [] : state.bounds,
  }
}

export const delete_line = (state) => {
  const { cursorPos, bounds, curLinePos, eraser, lines } = state
  // First, if we're over a bound, delete it
  if (cursorPos.in(bounds)) return { bounds: cursorPos.remove(bounds) }
  // otherwise, if we are halfway done drawing a line, delete it
  else if (curLinePos) return { curLinePos: null }
  else
    return {
      lines: eraser
        ? lines.filter((line) => !(cursorPos.in(line.points(), 0.5) && eraser.in(line.points(), 0.5)))
        : lines,
      eraser: eraser ? null : cursorPos,
    }
}

export const delete_at_cursor = (state) => {
  const { cursorPos, bounds, curLinePos, clipboard, lines, eraser, fillMode, mirrorOrigins } = state
  // If we're over the eraser, delete it
  if (eraser && cursorPos.eq(eraser)) return { eraser: null }
  if (fillMode) return clear_fill(state)
  // If we're over a bound, delete it
  if (cursorPos.in(bounds)) return { bounds: cursorPos.remove(bounds) }
  // If we are halfway done drawing a line, delete it
  if (curLinePos) return { curLinePos: null }
  // If we have a clipboard, clear it
  if (clipboard) return cancel_clipboard(state)
  // If we're over a mirror origin, delete it
  if (cursorPos.in(mirrorOrigins.map((o) => o.origin))) return remove_mirror_origin(state, cursorPos)

  // threshold is in deflated coordinates. It helps fudge rounding errors
  return { lines: lines.filter((line) => !cursorPos.in(line.points(), 0.5)) }
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
      for (const { origin, axis, rot } of state.mirrorOrigins) {
        start.push(...curLinePos.mirrorRaw(axis, rot, origin))
        end.push(...point.mirrorRaw(axis, rot, origin))
      }

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
  return {
    bounds: newBounds.filter((p) => newBoundRect.onEdge(p)),
    curLinePos: null,
  }
}

// Color actions
export const set_color = (state, { color }) => {
  let copy = JSON.parse(JSON.stringify(state.fillMode ? state.fill : state.stroke))
  copy[state.colorProfile] = color
  return { [state.fillMode ? "fill" : "stroke"]: copy }
}

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

export const set_paper_color = (state, { color }) => ({ paperColor: color })

// Fill actions
export const fill = (state) => {
  const { fillMode, curPolys, filledPolys } = state
  if (fillMode && curPolys.length) return { filledPolys: [...filledPolys, ...curPolys] }
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
  console.log("undoing...")
  console.log("undo stack:", undoStack)
  console.log("redo stack:", redoStack)
  const prevState = undoStack.pop()
  if (prevState !== undefined) {
    console.log("undoing")
    redoStack.push(prevState)
    console.log("undo stack is now:", undoStack)
    console.log("redo stack is now:", redoStack)
    // TODO: have this maintain the current state except for the undo keys
    return prevState
  }
}
export const redo = (state) => {
  console.log("redoing...")
  console.log("undo stack:", undoStack)
  console.log("redo stack:", redoStack)
  const nextState = redoStack.pop()
  if (nextState === undefined) {
    console.log("nothing to redo, ignoring")
    return state
  }
  undoStack.push(nextState)
  console.log("undo stack is now:", undoStack)
  console.log("redo stack is now:", redoStack)
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
  if (state.clipboard) return { lines: [...state.lines, ...getAllClipboardLines(state, true)] }
}
export const copy = (state) => ({
  clipboard: getSelected(state, "center"),
  curLinePos: null,
  clipboardOffset: getBoundRect(state)?.centerOffset,
})
export const cut = (state) => {
  const boundRect = getBoundRect(state)
  if (boundRect)
    return {
      ...delete_selected(state),
      clipboard: getSelected(state, "center"),
      clipboardOffset: boundRect.centerOffset,
      curLinePos: null,
      bounds: [],
    }
}

export const increment_clipboard_rotation = (state) => ({ clipboardRotation: (state.clipboardRotation + 90) % 360 })
export const increment_clipboard_mirror_axis = (state) => ({
  clipboardMirrorAxis: incrementMirrorAxis(state.clipboardMirrorAxis, true),
})

// Mirror Actions
export const add_mirror_origin = (state) => {
  const { mirrorOrigins, mirrorAxis, mirrorRot, cursorPos } = state
  if ((mirrorAxis || mirrorRot) && mirrorOrigins.length < defaultOptions.maxMirrorOrigins) {
    // Ensure that the origin is unique
    const existing = mirrorOrigins.findIndex((o) => o.origin.eq(cursorPos))
    if (existing !== -1) return mirrorOrigins.slice(0, existing)
    return {
      mirrorOrigins: [...mirrorOrigins, { origin: cursorPos, rot: mirrorRot, axis: mirrorAxis }],
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
  const linesBBox = document.querySelector("#lines").getBBox()
  const rect =
    state.bounds.length > 1
      ? getBoundRect(state)
      : new Rect(Point.svgOrigin(), Point.fromSvg(state, linesBBox.width, linesBBox.height))
  image(
    state,
    "png",
    rect,
    false,
    state.bounds.length > 1, // Default to selectedOnly
    (blob) => {
      try {
        navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ])
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

export const set_manual = (state, data) => {
  delete data.action
  return data
}

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
  if (close === "main" || (toggle === "main" && !copy[toggle])) {
    Object.keys(copy).forEach((key) => {
      // Toolbar and repeat menus are independent of each other
      if (key !== "repeat") copy[key] = false
    })
  }

  let repeatToast = false
  // Don't allow the repeat menu to be opened if we don't have a *finished* selection
  if (copy.repeat && state.bounds.length < 2) {
    copy.repeat = false
    repeatToast = true
  }

  // If we open the repeat menu, close the toolbar (and it's mini menus). They can both be open at the same time though
  if (open === "repeat" || (toggle === "repeat" && copy[toggle])) {
    copy.main = false
    miniMenus.forEach((key) => (copy[key] = false))
  }

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
