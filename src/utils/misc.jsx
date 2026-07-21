import { MIRROR_AXIS } from "../globals"
import Point from "../helper/Point"
import { viewportHeight, viewportWidth } from "../globals"



// NOTE: this can be used anywhere. The state also has a state.mobile attribute. The difference is that state.mobile gets
// updated once at the beginning (on refresh), and isMobile() is always accurate. Because users typically aren't changing
// the device they're on, default to using state.mobile (simply because you don't have to re-calculate it) unless you to
// have an updated value for some reason
export function isMobile() {
  const smallDim = 768
  const smallWidth = window.innerWidth <= smallDim
  const smallHeight = window.innerHeight <= smallDim
  const phoneRatio =
    Math.min(window.innerWidth, window.innerHeight) / Math.max(window.innerWidth, window.innerHeight) < 0.6
  return phoneRatio ? smallWidth || smallHeight : smallWidth && smallHeight
}

// Source: https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser#11381730
// export function mobileAndTabletCheck() {
// let check = false;
// (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
// return check;
// }

export function getAllCursorPoints(state, includeOriginal = true, useMousePos = false) {
  const { cursorPos, mousePos } = state
  const point = useMousePos ? mousePos : cursorPos
  const points = point.mirror(state)
  return includeOriginal ? points : points.slice(1)
}

// TODO: this should probably use the actually mouse location instead of CursorPos
// (because it's going to be going in between dots a lot)
export function getPreviewPolys(state, polys) {
  return polys.filter((poly) => getAllCursorPoints(state, true, true).some((p) => poly.contains(p)))
}

export function getHalf(state) {
  return Point.fromViewport(state, viewportWidth() / 2, viewportHeight() / 2).align(state)
}

export function invertObject(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[value] = key
    return acc
  }, {})
}

export function distCenter(x1, y1, x2, y2) {
  return {
    distance: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
    centerx: (x1 + x2) / 2,
    centery: (y1 + y2) / 2,
  }
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

export function filterObjectByKeys(obj, keys) {
  return keys.reduce((filteredObj, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) filteredObj[key] = obj[key]

    return filteredObj
  }, {})
}

export function unique(arr) {
  // I don't understand why Sets stopped working suddenly
  // return Array.from(new Set(arr))
  return arr.filter((point, index, self) => self.findIndex((p) => p.eq(point)) === index)
}

// let extraSlotsCache = { buttonWidth: 50, buttonMargin: 10, toolbarPadding: 10 }
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
// export function extraSlotsNew(state) {
//   const vertical = ["left", "right"].includes(state.side)
//   // let sideLen = vertical ? viewportHeight() : viewportWidth()
//   let sideLen = vertical ? window.innerHeight : window.innerWidth

//   const minButtons = 8
//   const buttonSize = vertical ? extraSlotsCache.buttonHeight : extraSlotsCache.buttonWidth
//   const toolbarPadding = extraSlotsCache.toolbarPadding
//   // Desired space between edge of toolbar and edge of screen
//   const margin = 10

//   const hasRoomFor = Math.floor((sideLen - margin * 2 - toolbarPadding * 2) / buttonSize)

//   return hasRoomFor - minButtons
// }

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

  return Math.floor((sideLen - 400) / 60)
}

export const needsImplementedError = (func) => {
  throw new Error(`Not implemented: ${func}`)
}
