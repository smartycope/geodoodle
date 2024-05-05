import React from "react"

const hashPoint = ([x, y]) => `${x}${y}`
export function pointIn(points, point){
    return points.map(hashPoint).includes(hashPoint(point))
}
export function removePoint(points, point){
    return points.filter(i => hashPoint(i) !== hashPoint(point))
}

const hashLine = line => JSON.stringify(line.props)
export function lineIn(lines, line){
    return lines.map(hashLine).includes(hashLine(line))
}
export function removeLine(lines, line){
    return lines.filter(i => hashLine(i) !== hashLine(line))
}

export function getSelected(state){
    const {translationx, translationy, partials, lines, bounds} = state
    const {boundRect, selectionOverlap} = calc(state)

    return bounds.length < 2 ? [] : lines.filter(i => (
            i.props.x1 + translationx >= boundRect.left &&
            i.props.x1 + translationx <= boundRect.right &&
            i.props.y1 + translationy >= boundRect.top &&
            i.props.y1 + translationy <= boundRect.bottom
        ) && (partials || (
            i.props.x2 + translationx >= boundRect.left &&
            i.props.x2 + translationx <= boundRect.right &&
            i.props.y2 + translationy >= boundRect.top &&
            i.props.y2 + translationy <= boundRect.bottom
        ))).map(i => <line
            // Remove the translation (so it's absolutely positioned with respect to the cursor)
            // Then remove the overlap (since the boundRect intentionally doens't align with the dots)
            {...i.props}
            x1={i.props.x1 - boundRect.left + translationx + 1}
            x2={i.props.x2 - boundRect.left + translationx + 1}
            y1={i.props.y1 - boundRect.top + translationy + 1}
            y2={i.props.y2 - boundRect.top + translationy + 1}
        />)
}

// Returns the new lines
export function addLine(state, props, to=undefined){
    const {translationx, translationy, stroke, strokeWidth, lines} = state
    const {offsetx, offsety} = calc(state)

    // If it doesn't have any length, don't make a new line, just skip it
    if (props.x1 === props.x2 && props.y1 === props.y2)
        return lines

    props.x1 -= translationx - offsetx
    props.x2 -= translationx - offsetx
    props.y1 -= translationy - offsety
    props.y2 -= translationy - offsety


    return [...(to !== undefined ? to : lines),
        <line {...props}
            // transform={`translate(${-translationx - offsetx} ${-translationy - offsety})`}
            stroke={stroke}
            strokeWidth={strokeWidth}
            key={JSON.stringify(props)}
        />]
}

export function calc({spacingx, spacingy, translationx, translationy, boundRadius, bounds, cursorPos}){
    const offsetx = translationx % spacingx
    const offsety = translationy % spacingy
    return {
        halfx: Math.round((window.visualViewport.width  / 2) / spacingx) * spacingx + offsetx + 1,
        halfy: Math.round((window.visualViewport.height / 2) / spacingy) * spacingy + offsety + 1,
        offsetx: offsetx,
        offsety: offsety,
        selectionOverlap: (boundRadius/2),
        boundRect: bounds.length ? {
            left:   Math.min(...bounds.map(i => i[0] + translationx)),
            right:  Math.max(...bounds.map(i => i[0] + translationx)),
            top:    Math.min(...bounds.map(i => i[1] + translationy)),
            bottom: Math.max(...bounds.map(i => i[1] + translationy)),
        } : null,
        relCursorPos: [
            cursorPos[0] - translationx + offsetx,
            cursorPos[1] - translationy + offsety,
        ],
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
