import React from "react"

export const hashPoint = ([x, y]) => `${x}${y}`
export function pointIn(points, point){
    return points.map(hashPoint).includes(hashPoint(point))
}
export function removePoint(points, point){
    return points.filter(i => hashPoint(i) !== hashPoint(point))
}

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

export const hashLine = line => JSON.stringify(line.props)
export function lineIn(lines, line){
    return lines.map(hashLine).includes(hashLine(line))
}
export function removeLine(lines, line){
    return lines.filter(i => hashLine(i) !== hashLine(line))
}

export function align(state, x, y){
    const {scalex, scaley, translationx, translationy} = state
    return [
        (Math.round(x / scalex) * scalex) + translationx % scalex + 1,
        (Math.round(y / scaley) * scaley) + translationy % scaley + 1,
    ]
}

// Returns a list of <line> objects
// Coord: absolute @ (0,0), scaled
export function getSelected(state, remove=false){
    const {partials, lines, bounds} = state
    const {boundRect} = calc(state)

    // boundRect is relative and scaled
    const filterFunc = i => (
            i.props.x1 >= boundRect.left   &&
            i.props.x1 <= boundRect.right  &&
            i.props.y1 >= boundRect.top    &&
            i.props.y1 <= boundRect.bottom
        ) && (partials || (
            i.props.x2 > boundRect.left   &&
            i.props.x2 < boundRect.right  &&
            i.props.y2 > boundRect.top    &&
            i.props.y2 < boundRect.bottom
        )
    )

    const rescaleFunc = i => <line
        // Remove the translation (so it's absolutely positioned with respect to the cursor)
        {...i.props}
        x1={i.props.x1 - boundRect.left}
        x2={i.props.x2 - boundRect.left}
        y1={i.props.y1 - boundRect.top}
        y2={i.props.y2 - boundRect.top}
    />

    if (remove)
        return bounds.length < 2 ? lines : lines.filter(i => !filterFunc(i))
    else
        return bounds.length < 2 ? [] : lines.filter(filterFunc).map(rescaleFunc)
}

// *All* permenant lines are made using this funciton
export function createLine(state, props, translate=true, scale=true, exact=false){
    const {translationx, translationy, stroke, strokeWidth, dash, lines, scalex, scaley} = state

    // TODO: figure how to avoid this
    // TODO: and also not create duplicate lines
    // If it doesn't have any length, don't make a new line, just skip it
    // if (props.x1 === props.x2 && props.y1 === props.y2)
    //     return null

    const adjProps = {
        ...props,
        x1: (props.x1 - (translationx * translate)) / (scale ? scalex : 1),
        x2: (props.x2 - (translationx * translate)) / (scale ? scalex : 1),
        y1: (props.y1 - (translationy * translate)) / (scale ? scaley : 1),
        y2: (props.y2 - (translationy * translate)) / (scale ? scaley : 1),
    }

    const aes = {
        stroke: stroke,
        strokeWidth: strokeWidth / scalex,
        strokeDasharray: dash.replace(/\s/, '').split(',').map(i => i/scalex).join(','),
        strokeLinecap: "round",
        strokeLinejoin: "round",
    }

    return <line {...adjProps}
            {...(exact ? {} : aes)}
            key={`${adjProps.x1}${adjProps.y1}${adjProps.x2}${adjProps.y2}`}
        />
}

export function calc(state){
    const {scalex, scaley, translationx, translationy, bounds, cursorPos} = state
    const offsetx = translationx % scalex
    const offsety = translationy % scaley

    const scaledTranslationx = translationx / scalex
    const scaledTranslationy = translationy / scaley

    const alignedHalf = align(state, window.visualViewport.width  / 2, window.visualViewport.height / 2)

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
        // Coord: relative, scaled
        boundRect: bounds.length ? {
            left:   Math.min(...bounds.map(i => i[0])),
            right:  Math.max(...bounds.map(i => i[0])),
            top:    Math.min(...bounds.map(i => i[1])),
            bottom: Math.max(...bounds.map(i => i[1])),
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
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};


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
