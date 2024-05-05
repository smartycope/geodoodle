import {mirror} from './globals.js'
import { lineIn, removeLine, pointIn, removePoint, addLine, calc, getSelected, eventMatchesKeycode, pointEq } from './utils'
import defaultOptions, { keybindings } from './options.jsx'

export default function reducer(state, data){
    const {
        // spacingx,
        // spacingy,
        boundRadius,
        cursorPos,
        stroke,
        strokeWidth,
        partials,
        lines,
        curLine,
        bounds,
        // pattern,
        mirrorState,
        eraser,
        clipboard,
        translationx,
        translationy,
        scalex,
        scaley,
        rotatex,
        rotatey,
        shearx,
        sheary,
        invertedScroll,
        scrollSensitivity,
        removeSelectionAfterDelete,
        debug,
    } = state

    const {
        halfx,
        halfy,
        offsetx,
        offsety,
        selectionOverlap,
        boundRect,
        relCursorPos,
    } = calc(state)

    if (debug && !(['cursor moved', 'translate', 'scale'].includes(data.action))){
        console.debug(data);
        console.debug(state);
    }

    switch (data.action){
        case 'cursor moved':
            return {...state,
                cursorPos: [
                    // The extra - offsetx is just to align the cursor with the mouse a little more accurately,
                    // so it doesn't move too much when guessing where the mouse is when translating
                    (Math.round((data.x - offsetx) / scalex) * scalex) + offsetx + 1,
                    (Math.round(data.y / scaley) * scaley) + offsety + 1,
                ]
            }

        case 'key press':
            var take = null
            Object.entries(keybindings).forEach(([shortcut, action]) => {
                if (eventMatchesKeycode(data.event, shortcut)){
                    take = action
                    if (action === 'cut') console.log('cutting!');
                }
            })
            return take ? reducer(state, {action: take}) : state

        case 'translate':
            return reducer({...state,
                translationx: translationx + data.x * (invertedScroll ? -1 : 1) * scrollSensitivity,
                translationy: translationy + data.y * (invertedScroll ? -1 : 1) * scrollSensitivity,
                curLine: null,
            // The -8 is a fudge factor to get a better guess at where the mouse is
            }, {action: 'cursor moved', x: cursorPos[0], y: cursorPos[1] - 8})

        case 'scale':
            const max = Math.min(window.visualViewport.width, window.visualViewport.height) / 4
            return reducer({...state,
                scalex: Math.min(max, Math.max(4, scalex + data.amt * (invertedScroll ? -1 : 1) * (scrollSensitivity / 8))),
                scaley: Math.min(max, Math.max(4, scaley + data.amt * (invertedScroll ? -1 : 1) * (scrollSensitivity / 8))),
            // TODO: This doesn't work
            }, {action: 'translate', x: translationx + cursorPos[0], y: translationy + cursorPos[1]})
            // }, {action: 'cursor moved', x: cursorPos[0], y: cursorPos[1] - 8})

        // Actions which can be set to various keyboard shortcuts
        case 'go home':         return {...state, translationx: 0, translationy: 0, scalex: defaultOptions.scalex, scaley: defaultOptions.scaley}
        case 'left':            return {...state, cursorPos: [cursorPos[0] - scalex, cursorPos[1]]}
        case 'right':           return {...state, cursorPos: [cursorPos[0] + scalex, cursorPos[1]]}
        case 'up':              return {...state, cursorPos: [cursorPos[0], cursorPos[1] - scaley]}
        case 'down':            return {...state, cursorPos: [cursorPos[0], cursorPos[1] + scaley]}
        case 'clear':           return {...state, lines: [], bounds: []}
        case 'clear bounds':    return {...state, bounds: []}
        case 'toggle partials': return {...state, partials: !partials}
        case 'copy':            return {...state, clipboard: getSelected(state), curLine: null}
        case 'paste':
            if (clipboard)
                // TODO: Make this use addLine instead
                return {...state,
                    lines: [...lines, ...clipboard.map(i =>
                        <line {...i.props}
                            x1={i.props.x1 + cursorPos[0] - 1}
                            x2={i.props.x2 + cursorPos[0] - 1}
                            y1={i.props.y1 + cursorPos[1] - 1}
                            y2={i.props.y2 + cursorPos[1] - 1}
                            transform={`translate(${-translationx} ${-translationy})`}
                            key={`${i.props.x1 + cursorPos[0] - 1}
                                  ${i.props.x2 + cursorPos[0] - 1}
                                  ${i.props.y1 + cursorPos[1] - 1}
                                  ${i.props.y2 + cursorPos[1] - 1}`}
                        />
                    )]
                }
            return state
        case 'cut': {
            const selected = getSelected(state)
            console.log(selected);
            return {...reducer(state, {action: 'delete selected'}),
                clipboard: selected,
                curLine: null
            }
        }
        case 'delete selected':
            return {...state,
                lines: bounds.length < 2 ? lines : lines.filter(i => !(
                    i.props.x1 + translationx >= boundRect.left &&
                    i.props.x1 + translationx <= boundRect.right &&
                    i.props.y1 + translationy >= boundRect.top &&
                    i.props.y1 + translationy <= boundRect.bottom
                ) && (partials || (
                    i.props.x2 + translationx >= boundRect.left &&
                    i.props.x2 + translationx <= boundRect.right &&
                    i.props.y2 + translationy >= boundRect.top &&
                    i.props.y2 + translationy <= boundRect.bottom
                ))),
                bounds: removeSelectionAfterDelete ? [] : bounds,
            }
        case 'delete line':
            if (pointIn(bounds, relCursorPos))
                return {...state, bounds: removePoint(bounds, relCursorPos)}
            else if (curLine)
                return {...state, curLine: null}
             else
                return {...state,
                    lines: eraser ? (lines.filter(i => !((
                            pointEq(state, [i.props.x1, i.props.y1], relCursorPos) ||
                            pointEq(state, [i.props.x2, i.props.y2], relCursorPos)
                        ) && (
                            pointEq(state, [i.props.x1, i.props.y1], eraser) ||
                            pointEq(state, [i.props.x2, i.props.y2], eraser)
                        )
                    ))) : lines,
                    eraser: eraser ? null : relCursorPos
                }

        case 'delete':
            if (pointIn(bounds, cursorPos))
                return {...state, bounds: removePoint(bounds, cursorPos)}
             else if (curLine)
                return {...state, curLine: null}
            else if (clipboard)
                return {...state, clipboard: null}
             else {
                return {...state, lines: (lines.filter(i =>
                    !((pointEq(state, [i.props.x1, i.props.y1], relCursorPos) ||
                      (pointEq(state, [i.props.x2, i.props.y2], relCursorPos)))
                    )
                ))}
            }

        case 'nevermind':
            if (clipboard)
                return {...state, clipboard: null}
            else if (curLine)
                return {...state, curLine: null}
            else if (bounds.length)
                return {...state, bounds: []}
                // return reducer(state, {action: 'clear bounds'})
            return state

        case 'add line':
            if (clipboard)
                return {...reducer(state, {action: 'paste'}), clipboard: data.continue ? clipboard : null}
            else {
                // Add mirrored lines
                if (curLine){
                    var newLines = addLine(state, {
                        ...curLine,
                        x2: cursorPos[0],
                        y2: cursorPos[1],
                    })
                    if (mirrorState === mirror.VERT || mirrorState === mirror.BOTH)
                        // matrix(-1, 0, 0, 1, halfx*2, 0)
                        newLines = addLine(state, {
                            x1: curLine.x1 * -1 + halfx*2,
                            y1: curLine.y1,
                            x2: cursorPos[0] * -1 + halfx*2,
                            y2: cursorPos[1],
                        }, newLines)
                    if (mirrorState === mirror.HORZ || mirrorState === mirror.BOTH)
                        // matrix(1, 0, 0, -1, 0, halfy*2)
                        newLines = addLine(state, {
                            x1: curLine.x1,
                            y1: curLine.y1 * -1 + halfy*2,
                            x2: cursorPos[0],
                            y2: cursorPos[1] * -1 + halfy*2,
                        }, newLines)
                    if (mirrorState === mirror.BOTH)
                        // matrix(-1, 0, 0, -1, halfx*2, halfy*2)
                        newLines = addLine(state, {
                            x1: curLine.x1 * -1 + halfx*2,
                            y1: curLine.y1 * -1 + halfy*2,
                            x2: cursorPos[0] * -1 + halfx*2,
                            y2: cursorPos[1] * -1 + halfy*2,
                        }, newLines)
                    }

                return {...state,
                    curLine: curLine === null ? {
                        x1: cursorPos[0],
                        y1: cursorPos[1],
                    } : null,
                    lines: curLine === null ? lines : newLines
                }
            }

        case 'continue line':
            return {...reducer(state, {action: 'add line', continue: true}),
                curLine: clipboard ? curLine : {
                    x1: cursorPos[0],
                    y1: cursorPos[1],
                }
            }

        case 'add bound':
            if (pointIn(bounds, cursorPos))
                return {...state, bounds: removePoint(bounds, cursorPos)}
            else
                return {...state, bounds: [...bounds, relCursorPos]}

        case 'toggle mirror':
            // eslint-disable-next-line default-case
            switch (mirrorState){
                case mirror.NONE: return {...state, mirrorState: mirror.VERT}
                case mirror.VERT: return {...state, mirrorState: mirror.HORZ}
                case mirror.HORZ: return {...state, mirrorState: mirror.BOTH}
                case mirror.BOTH: return {...state, mirrorState: mirror.NONE}
            } return state // This shouldn't be possible, but whatever

        default:
            console.warn(`Unknown action: ${data.action}`)
            return state
    }
}
