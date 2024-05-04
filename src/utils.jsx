import React from "react"

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
            x1={i.props.x1 - boundRect.left + translationx - selectionOverlap + 1}
            x2={i.props.x2 - boundRect.left + translationx - selectionOverlap + 1}
            y1={i.props.y1 - boundRect.top + translationy - selectionOverlap + 1}
            y2={i.props.y2 - boundRect.top + translationy - selectionOverlap + 1}
        />)
}

// Returns the new lines
export function addLine(state, props){
    const {translationx, translationy, stroke, strokeWidth, lines} = state
    const {offsetx, offsety} = calc(state)

    props.x1 -= translationx - offsetx
    props.x2 -= translationx - offsetx
    props.y1 -= translationy - offsety
    props.y2 -= translationy - offsety


    return [...lines, <line {...props} stroke={stroke} strokeWidth={strokeWidth} key={JSON.stringify(props)}/>]
}

export function calc({spacingx, spacingy, translationx, translationy, boundRadius, bounds}){
    return {
        halfx: Math.round((window.visualViewport.width  / 2) / spacingx) * spacingx,
        halfy: Math.round((window.visualViewport.height / 2) / spacingy) * spacingy,
        offsetx: translationx % spacingx,
        offsety: translationy % spacingy,
        selectionOverlap: (boundRadius/2),
        boundRect: bounds.length ? {
            left:   Math.min(...bounds.map(i => i[0] + translationx)),
            right:  Math.max(...bounds.map(i => i[0] + translationx)),
            top:    Math.min(...bounds.map(i => i[1] + translationy)),
            bottom: Math.max(...bounds.map(i => i[1] + translationy)),
        } : null
    }
}
