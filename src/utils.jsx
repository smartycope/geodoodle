import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE} from "./globals";
import { selected } from "./globals";
import inside from 'point-in-polygon';

export const hashPoint   = ([x, y])        => `${x}${y}`
export const pointIn     = (points, point, thresh=0) => points.map(i => pointEq({scalex: null, scaley: null}, i, point, thresh)).includes(true)
export const removePoint = (points, point) => points.filter(i => hashPoint(i) !== hashPoint(point))
export const hashLine    = line            => JSON.stringify(line.props)
// export const hashLine    = line            => `${hashPoint([line.props.x1, line.props.y1])}${hashPoint([line.props.x2, line.props.y2])}`
export const lineIn      = (lines, line)   => lines.map(hashLine).includes(hashLine(line))
export const removeLine  = (lines, line)   => lines.filter(i => hashLine(i) !== hashLine(line))
// If the visual viewport is not available, assume we're in a testing environment
export const viewportWidth  = () => window.visualViewport?.width || 1024
export const viewportHeight = () => window.visualViewport?.height || 768

// Returns true if the two points are within thresh of each other
export function pointEq({scalex, scaley}, pointa, pointb, thresh=undefined, rescalea=false){
    if (!thresh)
        thresh = scalex / 3

    if (rescalea){
        pointa[0] = pointa[0] * scalex
        pointa[1] = pointa[1] * scaley
    }

    return Math.abs(pointa[0] - pointb[0]) < thresh &&
           Math.abs(pointa[1] - pointb[1]) < thresh

}

// Returns the point aligned to the grid
// TODO: Specify the coordinate system here
export function align(state, x, y){
    const {scalex, scaley, translationx, translationy} = state
    return [
        (Math.round((x - translationx) / scalex) * scalex) + translationx + 1,
        (Math.round((y - translationy) / scaley) * scaley) + translationy + 1,
    ]
}

// This holds the "pure" lines of the selection: When repeating, it's rather difficult to get the lines, so instead we
// remember the lines used to make the pattern, don't update them while we're repeating, and add to them as we make more
// while we're repeating
var pureSelection = null

// Returns a list of <line> objects
// Coord: absolute @ (0,0), scaled
// Filter options are null | 'remove' | 'only'
export function getSelected(state, filter=null){
    const {partials, lines, bounds, openMenus, scalex, scaley, translationx, translationy} = state
    const {boundRect} = calc(state)

    if (!openMenus.repeat)
        pureSelection = null


    // If we're repeating, and there's a selected rect, use it instead of the bounds rect
    // Paper sets selected to null if we're not repeating
    var rect = boundRect
    // TODO: This doesn't work. It doesn't seem to find any lines in the area
    if (selected){
        const r = selected.getBoundingClientRect()
        rect = {
            left: (r.left + translationx) / scalex,
            right: (r.right + translationx) / scalex,
            top: (r.top + translationy) / scaley,
            bottom: (r.bottom + translationy) / scaley,
        }
    }

    // boundRect is relative and scaled
    const filterFunc = i => (
            i.props.x1 >= rect.left   &&
            i.props.x1 <= rect.right  &&
            i.props.y1 >= rect.top    &&
            i.props.y1 <= rect.bottom
        ) && (partials || (
            i.props.x2 > rect.left   &&
            i.props.x2 < rect.right  &&
            i.props.y2 > rect.top    &&
            i.props.y2 < rect.bottom
        )
    )

    const rescaleFunc = i => <line
        // Remove the translation (so it's absolutely positioned with respect to the cursor)
        {...i.props}
        x1={i.props.x1 - rect.left}
        x2={i.props.x2 - rect.left}
        y1={i.props.y1 - rect.top}
        y2={i.props.y2 - rect.top}
    />

    if (filter === 'remove')
        return bounds.length < 2 ? lines : lines.filter(i => !filterFunc(i))
    else if (filter === 'only')
        return bounds.length < 2 ? lines : lines.filter(i => filterFunc(i))
    else{
        if (selected){
            const found = lines.filter(filterFunc)
            // console.log('found:', found);
            return [...pureSelection, ...found]
        }else{
            // Don't update the selection if we're repeating
            pureSelection = (bounds.length < 2) ? [] : lines.filter(filterFunc).map(rescaleFunc)
            return pureSelection
        }
    }
}

// *All* permanent lines are made using this function
// props: additional properties to pass to <line>
// translate: whether to translate the line
// scale: whether to scale the line
// exact: whether to automatically add colors and strokes and such, or to only use the props given
export function createLine(state, props, translate=true, scale=true, exact=false){
    const {translationx, translationy, stroke, strokeWidth, dash, scalex, scaley, lineCap, lineJoin, colorProfile} = state

    // TODO: figure how to avoid this
    // TODO: and also not create duplicate lines - maybe
    // If it doesn't have any Containslength, don't make a new line, just skip it
    if (props.x1 === props.x2 && props.y1 === props.y2)
        return <line key={`${props.x1}${props.y1}`}/>

    const adjProps = {
        ...props,
        x1: (props.x1 - (translationx * translate)) / (scale ? scalex : 1),
        x2: (props.x2 - (translationx * translate)) / (scale ? scalex : 1),
        y1: (props.y1 - (translationy * translate)) / (scale ? scaley : 1),
        y2: (props.y2 - (translationy * translate)) / (scale ? scaley : 1),
    }

    const aes = {
        stroke: stroke[colorProfile],
        strokeWidth: strokeWidth[colorProfile],
        strokeDasharray: dash[colorProfile].replace(/\s/, '').split(',').map(i => i/scalex).join(','),
        strokeLinecap: lineCap,
        strokeLinejoin: lineJoin,
    }

    return <line {...adjProps}
            {...(exact ? {} : aes)}
            key={`${adjProps.x1}${adjProps.y1}${adjProps.x2}${adjProps.y2}`}
        />
}

// This calculates commonly used values that shouldn't be in the state because they can be derived from values in the state.
export function calc(state){
    const {scalex, scaley, translationx, translationy, bounds, cursorPos, mirrorType, curLine} = state
    const offsetx = translationx % scalex
    const offsety = translationy % scaley

    const scaledTranslationx = translationx / scalex
    const scaledTranslationy = translationy / scaley

    const alignedHalf = align(state, viewportWidth() / 2, viewportHeight() / 2)

    const left   = Math.min(...bounds.map(i => i[0]))
    const right  = Math.max(...bounds.map(i => i[0]))
    const top    = Math.min(...bounds.map(i => i[1]))
    const bottom = Math.max(...bounds.map(i => i[1]))

    return {
        // Numbers
        // Coord: absolute, not scaled
        halfx: alignedHalf[0],
        halfy: alignedHalf[1],
        // Numbers
        // Coord: N/A
        offsetx: offsetx,
        offsety: offsety,
        // {left, right, top, bottom} of lists of [x, y], or null
        // Coord: relative?, scaled
        boundRect: bounds.length ? {
            left:   left,
            right:  right,
            top:    top,
            bottom: bottom,
            width:  right-left,
            height: bottom-top,
        } : null,
        // A list of [x, y]
        // Coord: relative, scaled
        relCursorPos: [
            (cursorPos[0] - translationx) / scalex,
            (cursorPos[1] - translationy) / scaley,
        ],
        // Numbers
        // Coord: relative, scaled
        scaledTranslationx: scaledTranslationx,
        scaledTranslationy: scaledTranslationy,
        // Coord: absolute, not scaled
        mirrorOriginx: mirrorType === MIRROR_TYPE.PAGE ? alignedHalf[0] : curLine?.x1,
        mirrorOriginy: mirrorType === MIRROR_TYPE.PAGE ? alignedHalf[1] : curLine?.y1,
        // Because the cursor is at the center (ish) of the clipboard, instead of the top left
        // Coord: absolute, not scaled
        clipx: bounds.length > 1 ? cursorPos[0] - Math.floor((right-left) / 2) * scalex : null,
        clipy: bounds.length > 1 ? cursorPos[1] - Math.floor((bottom-top) / 2) * scaley : null,
    }
}

// NOTE: this doesn't handle modifier key events properly (if they're not pressed with something else)
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

// Credit to ChatGPT
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

