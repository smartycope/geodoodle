import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE, viewportWidth, viewportHeight} from "./globals";
import Point from "./helper/Point";
import Rect from "./helper/Rect";
import options from "./options";
import inside from "point-in-polygon";

export function getClipboardButtonsPos(state){
    const {cursorPos, scalex} = state
    const {clipboardButtonWidth: buttonWidth, clipboardButtonHeight: buttonHeight} = options
    const {x: cursorx, y: cursory} = cursorPos.asViewport(state)
    const {width: boundWidth, height: boundHeight} = getBoundRect(state).asViewport(state, true)
    // x={cursorx - width/2 - scalex/2} y={cursory - height/2 - buttonHeight}
    return Point.fromViewport(state,
        cursorx - (boundWidth/2) - (scalex/2),
        cursory - (boundHeight/2) - buttonHeight,
    )
}

// Get all the lines for the clipboard, including mirroring and transformation of the clipboard
export function getAllClipboardLines(state, translate){
    const {clipboard, cursorPos, clipboardMirrorAxis, clipboardRotation} = state
    if (!clipboard)
        return []
    const origin = translate ? cursorPos : Point.svgOrigin(state)
    return clipboard.map(
        line => line
            .translate(origin)
            .flip(clipboardMirrorAxis, origin)
            .rotate(clipboardRotation, origin)
            .mirror(state)
    ).flat()
}

// If retranslated is 'center', the lines will be retranslated to be relative to the center of the selection
// If retranslated is 'topLeft', the lines will be retranslated to be relative to the top left of the selection
// If retranslated is falsey, the lines will be returned as they are
export function getSelected(state, retranslated, polygons=false){
    const boundRect = getBoundRect(state)
    if (!boundRect)
        return []

    let selected = state.lines.filter(obj => obj.isSelected(state, boundRect))
    if (polygons)
        selected = selected.concat(state.filledPolys.filter(obj => obj.isSelected(state, boundRect)))

    if (retranslated === 'center')
        return selected.map(obj => obj.relativeTo(boundRect.center))
    else if (retranslated === 'topLeft')
        return selected.map(obj => obj.relativeTo(boundRect.topLeft))
    else
        return selected
}

export function getBoundRect(state){
    const {bounds, boundDragging, cursorPos} = state
    return boundDragging && bounds.length === 1 ? Rect.fromPoints(cursorPos, bounds[0]) : bounds.length > 1 ? Rect.fromPoints(...bounds) : null
}

export function getHalf(state){
    return Point.fromViewport(state, viewportWidth() / 2, viewportHeight() / 2).align(state)
}

export function getDebugBox(state){
    return new Rect(
        Point.fromViewport(state, viewportWidth() / 4, viewportHeight() / 4),
        Point.fromViewport(state, (viewportWidth() / 4) * 3, (viewportHeight() / 4) * 3),
    )
}

// NOTE: this doesn't do anything with modifier key events if they're not pressed with something else
export function eventMatchesKeycode(event, code){
    // We need to acknoledge space!
    // code = code.replace(/\s+/, '').split('+')
    code = code.split('+')
    return (
        event.ctrlKey  === code.includes('ctrl') &&
        event.metaKey  === code.includes('meta') &&
        event.altKey   === code.includes('alt') &&
        event.shiftKey === code.includes('shift') &&
        code.includes(event.key.toLowerCase())
    )
}

export function invertObject(obj){
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[value] = key;
        return acc;
    }, {})
}

// Source: https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser#11381730
export function mobileAndTabletCheck() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
}

export function distCenter(x1, y1, x2, y2){
    return {
        distance: Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
        centerx: (x1 + x2) / 2,
        centery: (y1 + y2) / 2
    }
}

const body = document.body;
export function toggleDarkMode() {
    body.classList.toggle("dark-mode");
    // body.classList
}

export const multMat = (A, B) =>
    A.map((row, i) =>
        B[0].map((_, j) =>
            row.reduce((acc, _, n) =>
                acc + A[i][n] * B[n][j], 0
            )
        )
    )

export function toRadians (angle) {
    return angle * (Math.PI / 180);
}

export function incrementMirrorAxis(mirrorAxis, none=false){
    switch (mirrorAxis){
        case MIRROR_AXIS.VERT_90:  return MIRROR_AXIS.HORZ_180
        case MIRROR_AXIS.HORZ_180: return MIRROR_AXIS.BOTH_360
        case MIRROR_AXIS.BOTH_360: return none ? MIRROR_AXIS.NONE_0 : MIRROR_AXIS.VERT_90
        default: return MIRROR_AXIS.VERT_90
    }
}

export function incrementMirrorType(mirrorType, none=false){
    switch (mirrorType){
        case MIRROR_TYPE.PAGE:  return MIRROR_TYPE.CURSOR
        case MIRROR_TYPE.CURSOR: return none ? MIRROR_TYPE.NONE : MIRROR_TYPE.PAGE
        default: return MIRROR_TYPE.PAGE
    }
}

export function incrementMirrorMethod(mirrorMethod, none=false){
    switch (mirrorMethod){
        case MIRROR_METHOD.FLIP:   return MIRROR_METHOD.ROTATE
        case MIRROR_METHOD.ROTATE: return MIRROR_METHOD.BOTH
        case MIRROR_METHOD.BOTH:   return none ? MIRROR_METHOD.NONE : MIRROR_METHOD.FLIP
        default: return MIRROR_TYPE.FLIP
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
export const defaultTrellisControl = value => ({
    row: {
        every: 1,
        val: value
    },
    col: {
        every: 1,
        val: value
    },
})

export function filterObjectByKeys(obj, keys) {
    return keys.reduce((filteredObj, key) => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        filteredObj[key] = obj[key];
      }
      return filteredObj;
    }, {});
}

export function extraSlots(state){
    let sideLen
    switch (state.side) {
        case 'right':
        case 'left':
            sideLen = viewportHeight()
            break
        case 'bottom':
        case 'top':
            sideLen = viewportWidth()
    }

    // Because the repeat menu is on the sides, if the repeat menu is open, make sure we're not on the side so we can close it again
    if (state.openMenus.repeat && state.mobile && ['left', 'right'].includes(state.side))
        sideLen = window.visualViewport.width

    return Math.floor((sideLen - 500) / 60)
}

// Return a color that shows up well on the given color so you can read text
export function getShowableStroke(color){
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Calculate perceived brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? 'black' : 'white';
}


// Returns the lines, but removes any duplicates, lines with null values, and invalid lines
export function normalizeLines(lines){
    const seen = new Set()

    return lines.filter(line => {
        const hash = line.hash()
        if (!line || !line.valid || seen.has(hash))
            return false
        seen.add(hash)
        return true
    })
}

export function splitAllLines(lines){
    return lines.flatMap(line => line.split(lines))
}

export function unique(arr){
    // I don't understand why Sets stopped working suddenly
    // return Array.from(new Set(arr))
    return arr.filter((point, index, self) => self.findIndex(p => p.eq(point)) === index)
}

export function getAllIntersections(lines){
    return unique(lines.flatMap(line => line.findIntersections(lines)))
}
