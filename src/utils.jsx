import Color from "colorjs.io"
import { viewportWidth, viewportHeight, MIRROR_AXIS } from "./globals"
import Point from "./helper/Point"
import Rect from "./helper/Rect"
import defaultOptions from "./options"

// Get all the lines for the clipboard, including mirroring and transformation of the clipboard
export function getAllClipboardLines(state) {
  const { clipboard, cursorPos, clipboardMirrorAxis, clipboardRotation } = state
  if (!clipboard) return []
  return clipboard.flatMap((line) => {
    const positionedLine = line
      .translate(cursorPos)
      .flip(clipboardMirrorAxis, cursorPos)
      .rotate(clipboardRotation, cursorPos)

    return positionedLine.mirror(state)
  })
}

export function getAllCursorPoints(state, includeOriginal = true, useMousePos = false) {
  const { cursorPos, mousePos } = state
  const point = useMousePos ? mousePos : cursorPos
  const points = point.mirror(state)
  return includeOriginal ? points : points.slice(1)
}

// If retranslated is 'center', the lines will be retranslated to be relative to the center of the selection
// If retranslated is 'topLeft', the lines will be retranslated to be relative to the top left of the selection
// If retranslated is falsey, the lines will be returned as they are
export function getSelected(state, retranslated, polygons = false) {
  const lines = state.lines ?? []
  const filledPolys = state.filledPolys ?? []
  const boundRect = getBoundRect(state)
  const selectedLines = lines.filter((obj) => obj.isSelected(state, boundRect))
  let selected = selectedLines
  if (polygons && boundRect)
    selected = selected.concat(filledPolys.filter((obj) => obj.isSelected(state, boundRect)))

  if (!selected.length || !retranslated) return selected

  const selectionPoints = selected.flatMap((object) =>
    typeof object.points === "function" ? object.points() : (object.points ?? []),
  )
  const selectionRect = boundRect ?? Rect.fromPoints(...selectionPoints)

  if (retranslated === "center") return selected.map((obj) => obj.relativeTo(selectionRect.center))
  else if (retranslated === "topLeft") return selected.map((obj) => obj.relativeTo(selectionRect.topLeft))
  else return selected
}

export function getLinesRect(lines) {
  if (!lines.length) return null
  return Rect.fromPoints(...lines.flatMap((line) => line.points()))
}

// Unlike Rect.asViewport, this measures the transformed endpoints that actually
// exist rather than the four corners of their canvas-space bounding rectangle.
// That keeps artwork fitting accurate when the canvas is rotated and when the
// rendered DOM intentionally contains only on-screen lines.
export function getLinesViewportBounds(lines, state) {
  if (!lines.length) return null

  let left = Infinity
  let right = -Infinity
  let top = Infinity
  let bottom = -Infinity
  lines.forEach((line) =>
    line.points().forEach((point) => {
      const { x, y } = point.asViewport(state)
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }),
  )

  return { left, right, top, bottom, width: right - left, height: bottom - top }
}

// TODO: this should probably use the actually mouse location instead of CursorPos
// (because it's going to be going in between dots a lot)
export function getPreviewPolys(state, polys) {
  return polys.filter((poly) => getAllCursorPoints(state, true, true).some((p) => poly.contains(p)))
}

export function getBoundRect(state) {
  const { bounds, boundDragging, cursorPos } = state
  return boundDragging && bounds.length === 1
    ? Rect.fromPoints(cursorPos, bounds[0])
    : bounds.length > 1
      ? Rect.fromPoints(...bounds)
      : null
}

// While a valid Trellis is visible, it owns the selected source geometry as
// tile (0, 0). The normal permanent line/polygon layers omit those objects so
// the transformed tile is not overdrawn by an untransformed copy.
export function trellisOwnsSource(state, boundRect = getBoundRect(state)) {
  const ownsDraftSource = ["create", "replace"].includes(state.trellisDraft?.mode)
  return Boolean(
    (state.trellis === true || ownsDraftSource || (!state.trellis && state.openMenus?.repeat)) &&
      state.bounds.length > 1 &&
      boundRect &&
      boundRect.wh._x > 0 &&
      boundRect.wh._y > 0,
  )
}

export function getClipboardRect(state) {
  const { clipboard } = state
  if (!clipboard) return null
  const allLines = getAllClipboardLines(state)
  return getLinesRect(allLines)
}

export function getHalf(state) {
  return Point.fromViewport(state, viewportWidth() / 2, viewportHeight() / 2).align(state)
}

export function getDebugBox(state) {
  return new Rect(
    Point.fromViewport(state, viewportWidth() / 4, viewportHeight() / 4),
    Point.fromViewport(state, (viewportWidth() / 4) * 3, (viewportHeight() / 4) * 3),
  )
}

// NOTE: this doesn't do anything with modifier key events if they're not pressed with something else
export function eventMatchesKeycode(event, code) {
  code = code.toLowerCase().split("+")
  const eventKey = event.key === " " ? "space" : event.key.toLowerCase()
  const expectsCtrl = code.includes("ctrl")
  const expectsMeta = code.includes("meta")
  const primaryModifierMatches = expectsMeta
    ? event.metaKey && event.ctrlKey === expectsCtrl
    : expectsCtrl
      ? event.ctrlKey || event.metaKey
      : !event.ctrlKey && !event.metaKey

  return (
    primaryModifierMatches &&
    event.altKey === code.includes("alt") &&
    event.shiftKey === code.includes("shift") &&
    code.includes(eventKey)
  )
}

export function normalizeShortcut(shortcut) {
  const aliases = {
    command: "ctrl",
    cmd: "ctrl",
    control: "ctrl",
    meta: "ctrl",
    option: "alt",
    " ": "space",
  }
  const parts = shortcut
    .trim()
    .toLowerCase()
    .split("+")
    .map((part) => aliases[part.trim()] ?? part.trim())
    .filter(Boolean)

  const modifiers = ["ctrl", "alt", "shift"].filter((modifier) => parts.includes(modifier))
  const key = parts.find((part) => !["ctrl", "meta", "alt", "shift"].includes(part))
  return key ? [...modifiers, key].join("+") : ""
}

export function shortcutFromKeyboardEvent(event) {
  if (["Shift", "Meta", "Control", "Alt"].includes(event.key)) return ""

  const parts = []
  if (event.ctrlKey || event.metaKey) parts.push("ctrl")
  if (event.altKey) parts.push("alt")
  if (event.shiftKey) parts.push("shift")
  parts.push(event.key === " " ? "space" : event.key.toLowerCase())
  return normalizeShortcut(parts.join("+"))
}

export function invertObject(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[value] = key
    return acc
  }, {})
}

// Source: https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser#11381730
// export function mobileAndTabletCheck() {
// let check = false;
// (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
// return check;
// }

// NOTE: this can be used anywhere. The state also has a state.mobile attribute. The difference is that state.mobile gets
// updated once at the beginning (on refresh), and isMobile() is always accurate. Because users typically aren't changing
// the device they're on, default to using state.mobile (simply because you don't have to re-calculate it) unless you to
// have an updated value for some reason
export { isMobile } from "./globals"

export function distCenter(x1, y1, x2, y2) {
  return {
    distance: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
    centerx: (x1 + x2) / 2,
    centery: (y1 + y2) / 2,
  }
}

// const body = document.body;
// export function toggleDarkMode() {
//     body.classList.toggle("dark-mode");
//     // body.classList
// }

export const multMat = (A, B) =>
  A.map((row, i) => B[0].map((_, j) => row.reduce((acc, _, n) => acc + A[i][n] * B[n][j], 0)))

export function toRadians(angle) {
  return angle * (Math.PI / 180)
}

export function incrementMirrorAxis(mirrorAxis, none = false) {
  switch (mirrorAxis) {
    case MIRROR_AXIS.Y:
      return MIRROR_AXIS.X
    case MIRROR_AXIS.X:
      return MIRROR_AXIS.BOTH
    case MIRROR_AXIS.BOTH:
      return none ? MIRROR_AXIS.NONE : MIRROR_AXIS.Y
    default:
      return MIRROR_AXIS.Y
  }
}

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
export const defaultTrellisControl = (value, every = 1) => ({
  row: {
    every,
    val: value,
  },
  col: {
    every,
    val: value,
  },
})

export function filterObjectByKeys(obj, keys) {
  return keys.reduce((filteredObj, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) filteredObj[key] = obj[key]

    return filteredObj
  }, {})
}

// function getWHofelement(element) {
//   const rect = element.getBoundingClientRect()
//   const style = getComputedStyle(element)

//   const totalVisualWidth = rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight)
//   const totalVisualHeight = rect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom)

//   return [totalVisualWidth, totalVisualHeight]
// }

let extraSlotsCache = { buttonWidth: 50, buttonMargin: 10, toolbarPadding: 10 }
// addEventListener('resize', () => {
//     const toolButton = document.getElementById('main-tool-button')
//     // If we can't get it, the toolbar is closed and it's not relevant anyway
//     // console.log({toolButton})
//     if (toolButton){
//         [extraSlotsCache.buttonWidth, extraSlotsCache.buttonHeight] = getWHofelement(toolButton)
//         extraSlotsCache.toolbarPadding = parseFloat(getComputedStyle(toolButton.parentElement).padding.replace('px', ''))
//     }
// })
// TODO: this is getting there, but it's still not there yet
export function extraSlotsNew(state) {
  const vertical = ["left", "right"].includes(state.side)
  // let sideLen = vertical ? viewportHeight() : viewportWidth()
  let sideLen = vertical ? window.innerHeight : window.innerWidth

  const minButtons = 8
  const buttonSize = vertical ? extraSlotsCache.buttonHeight : extraSlotsCache.buttonWidth
  const toolbarPadding = extraSlotsCache.toolbarPadding
  // Desired space between edge of toolbar and edge of screen
  const margin = 10

  const hasRoomFor = Math.floor((sideLen - margin * 2 - toolbarPadding * 2) / buttonSize)

  // console.log({toolbarIs: (buttonSize + (margin * 2))*numButtons + (toolbarPadding*2) - (margin*2)})
  // console.log({toolbarLen, extraSlotsCache})
  // console.log({hasRoomFor, sideLen, availableSpace: sideLen - (margin * 2) - (toolbarPadding * 2)})
  // console.log({buttonSize, margin, toolbarPadding})
  // console.log(extraSlotsCache)

  return hasRoomFor - minButtons
}

// This still works better (for now)
export function extraSlots(state) {
  let sideLen
  switch (state.side) {
    case "right":
    case "left":
      sideLen = viewportHeight()
      break
    case "bottom":
    case "top":
      sideLen = viewportWidth()
  }

  // Because the repeat menu is on the sides, if the repeat menu is open, make sure we're not on the side so we can close it again
  if (state.openMenus.repeat && state.mobile && ["left", "right"].includes(state.side))
    sideLen = window.visualViewport.width

  return Math.floor((sideLen - 560) / 60)
}

// Return a color that shows up well on the given color so you can read text
export function getShowableStroke(color) {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)

  // Calculate perceived brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? "black" : "white"
}

// Returns the lines, but removes any duplicates, lines with null values, and invalid lines
export function normalizeLines(lines) {
  const seen = new Set()

  return lines.filter((line) => {
    const hash = line.hash()
    if (!line || !line.valid || seen.has(hash)) return false
    seen.add(hash)
    return true
  })
}

export function splitAllLines(lines) {
  return lines.flatMap((line) => line.split(lines))
}

export function unique(arr) {
  // I don't understand why Sets stopped working suddenly
  // return Array.from(new Set(arr))
  return arr.filter((point, index, self) => self.findIndex((p) => p.eq(point)) === index)
}

// Line arrays in state are immutable, so their identity is a reliable cache key.
// WeakMap keeps old drawings collectable after an edit replaces the array.
const allIntersectionsCache = new WeakMap()

// Returns Points
export function getAllIntersections(lines) {
  const cached = allIntersectionsCache.get(lines)
  if (cached) return cached

  const intersections = lines.length < 2 ? [] : unique(lines.flatMap((line) => line.findIntersections(lines)))

  allIntersectionsCache.set(lines, intersections)
  return intersections
}

// Returns a list of Lines - we use this instead of storing which lines go with each intersection, because
// that's more of a hassle, and the situations in which we need this function (so far, only deleting what's)
// under the cursor when it's on an intersection) don't need to be optimized, we can just recalculate all of them
// export function getLinesAssociatedWithIntersection(state, intersection) {
//   return state.lines.filter((line) => line.findIntersections(state.lines).includes(intersection))
// }

export function shouldUseFancyGlow(state) {
  const { useFancyGlow } = state
  return useFancyGlow && getSelected(state).length <= defaultOptions.maxFancyGlowingLines
}

// Source - https://stackoverflow.com/a/36481059
// Posted by Maxwell Collard, modified by community. See post 'Timeline' for change history
// Retrieved 2026-07-18, License - CC BY-SA 4.0
// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random() // Converting [0,1) to (0,1]
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean
}

export function randomizeColor(basedOn) {
  const background = new Color(basedOn)
  const [lightness, chroma] = background.oklch
  const lightnessChange = gaussianRandom(0.33, 0.1)

  return new Color("oklch", [
    lightness + (lightness < 0.5 ? lightnessChange : -lightnessChange),
    chroma + gaussianRandom(0.2, 0.1),
    Math.random() * 360,
  ])
    .to("srgb")
    .toString({ format: "hex" })
}
