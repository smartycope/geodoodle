import React from "react"

export const hashPoint = ([x, y]) => `${x}${y}`
export function pointIn(points, point){
    return points.map(hashPoint).includes(hashPoint(point))
}
export function removePoint(points, point){
    return points.filter(i => hashPoint(i) !== hashPoint(point))
}

export function pointEq({scalex, scaley}, pointa, pointb, rescalea=false){
    if (rescalea){
        pointa[0] = pointa[0] * scalex
        pointa[1] = pointa[1] * scaley
    }
    return Math.abs(pointa[0] - pointb[0]) < scalex / 3 &&
           Math.abs(pointa[1] - pointb[1]) < scaley / 3

}

export const hashLine = line => JSON.stringify(line.props)
export function lineIn(lines, line){
    return lines.map(hashLine).includes(hashLine(line))
}
export function removeLine(lines, line){
    return lines.filter(i => hashLine(i) !== hashLine(line))
}

export function getSelected(state){
    const {translationx, translationy, partials, lines, bounds, scalex, scaley} = state
    const {boundRect} = calc(state)

    return bounds.length < 2 ? [] : lines.filter(i => (
            i.props.x1 * scalex + translationx >= boundRect.left &&
            i.props.x1 * scalex + translationx <= boundRect.right &&
            i.props.y1 * scaley + translationy >= boundRect.top &&
            i.props.y1 * scaley + translationy <= boundRect.bottom
        ) && (partials || (
            i.props.x2 * scalex + translationx >= boundRect.left &&
            i.props.x2 * scalex + translationx <= boundRect.right &&
            i.props.y2 * scaley + translationy >= boundRect.top &&
            i.props.y2 * scaley + translationy <= boundRect.bottom
        ))).map(i => <line
            // Remove the translation (so it's absolutely positioned with respect to the cursor)
            {...i.props}
            x1={i.props.x1 - (boundRect.left + translationx + 1) / scalex}
            x2={i.props.x2 - (boundRect.left + translationx + 1) / scalex}
            y1={i.props.y1 - (boundRect.top + translationy + 1) / scaley}
            y2={i.props.y2 - (boundRect.top + translationy + 1) / scaley}
        />)
}

// Returns the new lines
// *All* permenant lines are made using this funciton, except paste (todo)
export function addLine(state, props, to=undefined){
    const {translationx, translationy, stroke, strokeWidth, lines, scalex, scaley} = state

    // If it doesn't have any length, don't make a new line, just skip it
    if (props.x1 === props.x2 && props.y1 === props.y2)
        return lines

    props.x1 = (props.x1 - translationx) / scalex
    props.x2 = (props.x2 - translationx) / scalex
    props.y1 = (props.y1 - translationy) / scaley
    props.y2 = (props.y2 - translationy) / scaley

    return [...(to !== undefined ? to : lines),
        <line {...props}
            // transform={`translate(${-translationx - offsetx} ${-translationy - offsety})`}
            stroke={stroke}
            strokeWidth={strokeWidth / scalex}
            key={JSON.stringify(props)}
        />]
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
            left:   Math.min(...bounds.map(i => i[0] + scaledTranslationx)),
            right:  Math.max(...bounds.map(i => i[0] + scaledTranslationx)),
            top:    Math.min(...bounds.map(i => i[1] + scaledTranslationy)),
            bottom: Math.max(...bounds.map(i => i[1] + scaledTranslationy)),
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

export function eventMatchesKeycode(event, code){
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
