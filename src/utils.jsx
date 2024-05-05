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

export function getSelected(state, remove=false){
    const {translationx, translationy, partials, lines, bounds, scalex, scaley} = state
    const {boundRect, scaledTranslationx, scaledTranslationy} = calc(state)

    // boundRect is relative and scaled, where the lines are
    const filterFunc = i => (
            i.props.x1 >= boundRect.left &&
            i.props.x1 <= boundRect.right &&
            i.props.y1 >= boundRect.top &&
            i.props.y1 <= boundRect.bottom
        ) && (partials || (
            i.props.x2 >= boundRect.left &&
            i.props.x2 <= boundRect.right &&
            i.props.y2 >= boundRect.top &&
            i.props.y2 <= boundRect.bottom
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
export function createLine(state, props, translate=true, scale=true){
    const {translationx, translationy, stroke, strokeWidth, lines, scalex, scaley} = state

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

    return <line {...adjProps}
            stroke={stroke}
            strokeWidth={strokeWidth / scalex}
            key={JSON.stringify(props)}
        />
}

export function calc({scalex, scaley, translationx, translationy, bounds, cursorPos}){
    const offsetx = translationx % scalex
    const offsety = translationy % scaley

    const scaledTranslationx = translationx / scalex
    const scaledTranslationy = translationy / scaley
    return {
        // Numbers
        // Coord: absolute, not scaled
        halfx: Math.round((window.visualViewport.width  / 2) / scalex) * scalex + offsetx + 1,
        halfy: Math.round((window.visualViewport.height / 2) / scaley) * scaley + offsety + 1,
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
    code = code.replace(/\s+/, '').split('+')
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
