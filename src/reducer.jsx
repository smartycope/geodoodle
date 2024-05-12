import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE} from './globals.js'
import { toRadians, lineIn, removeLine, pointIn, removePoint, calc, getSelected, createLine, eventMatchesKeycode, pointEq, toggleDarkMode } from './utils'
import defaultOptions, { keybindings, reversibleActions } from './options.jsx'

var undoStack = []
var redoStack = []
var preTourState = null

export default function reducer(state, data){
    const {
        // spacingx,
        // spacingy,
        mobile,
        cursorPos,
        commonColors,
        stroke,
        strokeWidth,
        dash,
        partials,
        lines,
        curLine,
        bounds,
        // pattern,
        mirroring,
        mirrorAxis,
        mirrorAxis2,
        mirrorType,
        mirrorMethod,
        repeating,
        eraser,
        clipboard,
        clipboardRotation,
        clipboardMirrorAxis,
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
        mode,
        debug,
    } = state

    const {
        halfx,
        halfy,
        offsetx,
        offsety,
        boundRect,
        relCursorPos,
        scaledTranslationx,
        scaledTranslationy,
    } = calc(state)

    if (debug && !(['cursor moved', 'translate', 'scale'].includes(data.action))){
        console.debug(data);
        console.debug(state);
    }

    if (reversibleActions.includes(data.action)){
        if (undoStack.push(state) > defaultOptions.maxUndoAmt){
            undoStack.shift()
        }
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
            // If it's just a modifier key, don't do anything (it'll falsely trigger things)
            if (['Shift', 'Meta', 'Control', 'Alt'].includes(data.event.key))
                return state

            var take = null
            Object.entries(keybindings).forEach(([shortcut, action]) => {
                if (eventMatchesKeycode(data.event, shortcut))
                    take = action
            })
            return take ? reducer(state, take) : state

        case 'translate':
            return reducer({...state,
                translationx: translationx + data.x,
                translationy: translationy + data.y,
                curLine: null,
            // The -8 is a fudge factor to get a better guess at where the mouse is
            }, {action: 'cursor moved', x: cursorPos[0], y: cursorPos[1]})

        case 'scale':{
            const max = Math.min(window.visualViewport.width, window.visualViewport.height) / 4
            const cx = data.cx ?? cursorPos[0]
            const cy = data.cy ?? cursorPos[1]
            console.log(data.amtx, data.amty)
            // console.log(cx, cy)

            const x = Math.min(max, Math.max(4, scalex + data.amtx))
            const y = Math.min(max, Math.max(4, scaley + data.amty))

            // TODO: This still doesn't work
            return {...state,
                scalex: x,
                scaley: y,
                translationx: translationx,
                translationy: translationy,
                curLine: null,
            }
        }
        // Actions which can be set to various keyboard shortcuts
        case 'increase scale':  return {...state, scalex: scalex*2, scaley: scaley*2}
        case 'decrease scale':  return {...state, scalex: scalex/2, scaley: scaley/2}
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
            if (clipboard){
                function transform({x1, y1, x2, y2}){
                    const rad = toRadians(clipboardRotation)

                    // We have to do this so in setting the rotation, they don't cascade on each other and set
                    // values that are used in the next calculation
                    const __x1 = x1 + relCursorPos[0]
                    const __y1 = y1 + relCursorPos[1]
                    const __x2 = x2 + relCursorPos[0]
                    const __y2 = y2 + relCursorPos[1]

                    // We have to do this, because parameters are const or something?
                    let _x1 = __x1
                    let _y1 = __y1
                    let _x2 = __x2
                    let _y2 = __y2

                    if (clipboardRotation !== 180 && clipboardRotation !== 0){
                        // rotate(rad, cursorPos[0], cursorPos[1])
                        _x1 = (__x1 * Math.cos(rad)) +
                            (__y1 * -Math.sin(rad)) +
                            relCursorPos[0]*(1-Math.cos(rad)) + relCursorPos[1]*Math.sin(rad)
                        _y1 = (__x1 * Math.sin(rad)) +
                            (__y1 * -Math.cos(rad)) +
                            relCursorPos[1]*(1-Math.cos(rad)) - relCursorPos[0]*Math.sin(rad)
                        _x2 = (__x2 * Math.cos(rad)) +
                            (__y2 * -Math.sin(rad)) +
                            relCursorPos[0]*(1-Math.cos(rad)) + relCursorPos[1]*Math.sin(rad)
                        _y2 = (__x2 * Math.sin(rad)) +
                            (__y2 * -Math.cos(rad)) +
                            relCursorPos[1]*(1-Math.cos(rad)) - relCursorPos[0]*Math.sin(rad)
                    }

                    if (clipboardMirrorAxis === MIRROR_AXIS.VERT_90 || clipboardMirrorAxis === MIRROR_AXIS.BOTH_360 || clipboardRotation === 180){
                        // matrix(-1, 0, 0, 1, cursorPos[0]*2, 0)
                        _x1 = _x1 * -1 + relCursorPos[0]*2
                        _x2 = _x2 * -1 + relCursorPos[0]*2
                    }
                    if (clipboardMirrorAxis === MIRROR_AXIS.HORZ_180 || clipboardMirrorAxis === MIRROR_AXIS.BOTH_360 || clipboardRotation === 180){
                        // matrix(1, 0, 0, -1, 0, cursorPos[1]*2)
                        _y1 = _y1 * -1 + relCursorPos[1]*2
                        _y2 = _y2 * -1 + relCursorPos[1]*2
                    }
                    return {x1: _x1, y1: _y1, x2: _x2, y2: _y2}
                }

                return {...state,
                    lines: [...lines, ...clipboard.reduce((acc, line) => {
                        acc.push(createLine(state, {
                            ...line.props,
                            ...transform(line.props),
                        }, false, false, true))
                        return acc
                    }, [])]
                }
            }
            return state
        case 'cut': {
            const selected = getSelected(state)
            return {...reducer(state, {action: 'delete selected'}),
                clipboard: selected,
                curLine: null
            }
        }
        case 'delete selected':
            return {...state,
                lines: getSelected(state, true),
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
                            pointEq(state, [i.props.x1, i.props.y1], relCursorPos, .3) ||
                            pointEq(state, [i.props.x2, i.props.y2], relCursorPos, .3)
                        ) && (
                            pointEq(state, [i.props.x1, i.props.y1], eraser, .3) ||
                            pointEq(state, [i.props.x2, i.props.y2], eraser, .3)
                        )
                    ))) : lines,
                    eraser: eraser ? null : relCursorPos
                }

        case 'delete':
            if (pointIn(bounds, relCursorPos))
                return {...state, bounds: removePoint(bounds, relCursorPos)}
             else if (curLine)
                return {...state, curLine: null}
            else if (clipboard)
                return {...state, clipboard: null, clipboardMirrorAxis: null, clipboardRotation: 0}
            // else if (bounds.length >= 2)
            //     return reducer(state, {action: 'delete selected'})
            else {
                return {...state, lines: (lines.filter(i =>
                    !((pointEq(state, [i.props.x1, i.props.y1], relCursorPos, .3) ||
                      (pointEq(state, [i.props.x2, i.props.y2], relCursorPos, .3)))
                    )
                ))}
            }

        case 'nevermind':
            if (clipboard)
                return {...state, clipboard: null, clipboardMirrorAxis: null, clipboardRotation: 0}
            else if (curLine)
                return {...state, curLine: null}
            else if (bounds.length)
                return {...state, bounds: []}
                // return reducer(state, {action: 'clear bounds'})
            return state

        case 'add line':
            if (clipboard && !mobile)
                return {...reducer(state, {action: 'paste'}),
                    clipboard:           data.continue ? clipboard           : null,
                    clipboardMirrorAxis: data.continue ? clipboardMirrorAxis : null,
                    clipboardRotation:   data.continue ? clipboardRotation   : 0,
                }
            else {
                var newLines = []
                if (curLine != null){
                    const originx = mirrorType === MIRROR_TYPE.PAGE ? halfx : curLine.x1
                    const originy = mirrorType === MIRROR_TYPE.PAGE ? halfy : curLine.y1
                    const pi = Math.PI

                    // First off, add the base line
                    newLines.push(createLine(state, {
                        ...curLine,
                        x2: cursorPos[0],
                        y2: cursorPos[1],
                    }))

                    // These if statements mirror (pun intended) the ones in App.jsx to create the mirrored curLines.
                    // This is intentional. The operations are manual implementations of the matrix transformations there
                    if (mirroring){
                        if (mirrorAxis === MIRROR_AXIS.VERT_90 || mirrorAxis === MIRROR_AXIS.BOTH_360){
                            if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH)
                                // matrix(-1, 0, 0, 1, originx*2, 0)
                                newLines.push(createLine(state, {
                                    x1: curLine.x1 * -1 + originx*2,
                                    y1: curLine.y1,
                                    x2: cursorPos[0] * -1 + originx*2,
                                    y2: cursorPos[1],
                                }))

                            if (mirrorMethod === MIRROR_METHOD.ROTATE)
                                // rotate(90, originx, originy)
                                newLines.push(createLine(state, {
                                    x1: (curLine.x1 * Math.cos(pi/2)) +
                                        (curLine.y1 * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y1: (curLine.x1 * Math.sin(pi/2)) +
                                        (curLine.y1 * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2),
                                    x2: (cursorPos[0] * Math.cos(pi/2)) +
                                        (cursorPos[1] * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y2: (cursorPos[0] * Math.sin(pi/2)) +
                                        (cursorPos[1] * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2),
                                }))
                        }

                        if (mirrorAxis === MIRROR_AXIS.HORZ_180 || mirrorAxis === MIRROR_AXIS.BOTH_360){
                            if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH)
                                // matrix(1, 0, 0, -1, 0, originy*2)
                                newLines.push(createLine(state, {
                                    x1: curLine.x1,
                                    y1: curLine.y1 * -1 + originy*2,
                                    x2: cursorPos[0],
                                    y2: cursorPos[1] * -1 + originy*2,
                                }))

                            if (mirrorMethod === MIRROR_METHOD.ROTATE)
                                // rotate(180, originx, originy)
                                newLines.push(createLine(state, {
                                    x1: curLine.x1 * -1 + originx*2,
                                    y1: curLine.y1 * -1 + originy*2,
                                    x2: cursorPos[0] * -1 + originx*2,
                                    y2: cursorPos[1] * -1 + originy*2,
                                }))
                        }

                        if (mirrorAxis === MIRROR_AXIS.BOTH_360){
                            if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH)
                                // matrix(-1, 0, 0, -1, originx*2, originy*2)
                                newLines.push(createLine(state, {
                                    x1: curLine.x1 * -1 + originx*2,
                                    y1: curLine.y1 * -1 + originy*2,
                                    x2: cursorPos[0] * -1 + originx*2,
                                    y2: cursorPos[1] * -1 + originy*2,
                                }))
                            if (mirrorMethod === MIRROR_METHOD.ROTATE)
                                // rotate(270, originx, originy)
                                newLines.push(createLine(state, {
                                    x1: (curLine.x1 * Math.cos(3*pi/2)) +
                                        (curLine.y1 * -Math.sin(3*pi/2)) +
                                        originx*(1-Math.cos(3*pi/2)) + originy*Math.sin(3*pi/2),
                                    y1: (curLine.x1 * Math.sin(3*pi/2)) +
                                        (curLine.y1 * -Math.cos(3*pi/2)) +
                                        originy*(1-Math.cos(3*pi/2)) - originx*Math.sin(3*pi/2),
                                    x2: (cursorPos[0] * Math.cos(3*pi/2)) +
                                        (cursorPos[1] * -Math.sin(3*pi/2)) +
                                        originx*(1-Math.cos(3*pi/2)) + originy*Math.sin(3*pi/2),
                                    y2: (cursorPos[0] * Math.sin(3*pi/2)) +
                                        (cursorPos[1] * -Math.cos(3*pi/2)) +
                                        originy*(1-Math.cos(3*pi/2)) - originx*Math.sin(3*pi/2),
                                }))
                        }

                        // Handling the mirrorMethod == BOTH situation seperately: these are directy copies of the
                        // rotation lines above
                        if (mirrorMethod === MIRROR_METHOD.BOTH){
                            if (mirrorAxis2 === MIRROR_AXIS.VERT_90 || mirrorAxis2 === MIRROR_AXIS.BOTH_360){
                                // rotate(90, originx, originy)
                                newLines.push(createLine(state, {
                                    x1: (curLine.x1 * Math.cos(pi/2)) +
                                        (curLine.y1 * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y1: (curLine.x1 * Math.sin(pi/2)) +
                                        (curLine.y1 * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2),
                                    x2: (cursorPos[0] * Math.cos(pi/2)) +
                                        (cursorPos[1] * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y2: (cursorPos[0] * Math.sin(pi/2)) +
                                        (cursorPos[1] * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2),
                                }))
                                // matrix(1, 0, 0, -1, 0, originy*2) rotate(90, originx originy)
                                newLines.push(createLine(state, {
                                    x1: (curLine.x1 * Math.cos(pi/2)) +
                                        (curLine.y1 * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y1: ((curLine.x1 * Math.sin(pi/2)) +
                                        (curLine.y1 * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2)) * -1 + originy*2,
                                    x2: (cursorPos[0] * Math.cos(pi/2)) +
                                        (cursorPos[1] * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y2: ((cursorPos[0] * Math.sin(pi/2)) +
                                        (cursorPos[1] * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2))  * -1 + originy*2,
                                }))
                            }
                            if (mirrorAxis2 === MIRROR_AXIS.HORZ_180 || mirrorAxis2 === MIRROR_AXIS.BOTH_360){
                                // Optimization: 180 degree rotation == flipping both vertically & horizontally: that line already exists
                                if (mirrorAxis !== MIRROR_AXIS.BOTH_360)
                                    // rotate(180, originx, originy)
                                    newLines.push(createLine(state, {
                                        x1: curLine.x1 * -1 + originx*2,
                                        y1: curLine.y1 * -1 + originy*2,
                                        x2: cursorPos[0] * -1 + originx*2,
                                        y2: cursorPos[1] * -1 + originy*2,
                                    }))
                                // matrix(1, 0, 0, -1, 0, originy*2) rotate(270, originx originy)
                                newLines.push(createLine(state, {
                                    x1: (curLine.x1 * Math.cos(3*pi/2)) +
                                        (curLine.y1 * -Math.sin(3*pi/2)) +
                                        originx*(1-Math.cos(3*pi/2)) + originy*Math.sin(3*pi/2),
                                    y1: ((curLine.x1 * Math.sin(3*pi/2)) +
                                        (curLine.y1 * -Math.cos(3*pi/2)) +
                                        originy*(1-Math.cos(3*pi/2)) - originx*Math.sin(3*pi/2)) * -1 + originy*2,
                                    x2: (cursorPos[0] * Math.cos(3*pi/2)) +
                                        (cursorPos[1] * -Math.sin(3*pi/2)) +
                                        originx*(1-Math.cos(3*pi/2)) + originy*Math.sin(3*pi/2),
                                    y2: ((cursorPos[0] * Math.sin(3*pi/2)) +
                                        (cursorPos[1] * -Math.cos(3*pi/2)) +
                                        originy*(1-Math.cos(3*pi/2)) - originx*Math.sin(3*pi/2))  * -1 + originy*2,
                                }))
                            }
                            if (mirrorAxis2 === MIRROR_AXIS.BOTH_360)
                                // rotate(270, originx, originy)
                                newLines.push(createLine(state, {
                                    x1: (curLine.x1 * Math.cos(3*pi/2)) +
                                        (curLine.y1 * -Math.sin(3*pi/2)) +
                                        originx*(1-Math.cos(3*pi/2)) + originy*Math.sin(3*pi/2),
                                    y1: (curLine.x1 * Math.sin(3*pi/2)) +
                                        (curLine.y1 * -Math.cos(3*pi/2)) +
                                        originy*(1-Math.cos(3*pi/2)) - originx*Math.sin(3*pi/2),
                                    x2: (cursorPos[0] * Math.cos(3*pi/2)) +
                                        (cursorPos[1] * -Math.sin(3*pi/2)) +
                                        originx*(1-Math.cos(3*pi/2)) + originy*Math.sin(3*pi/2),
                                    y2: (cursorPos[0] * Math.sin(3*pi/2)) +
                                        (cursorPos[1] * -Math.cos(3*pi/2)) +
                                        originy*(1-Math.cos(3*pi/2)) - originx*Math.sin(3*pi/2),
                                }))

                            if (mirrorAxis2 === MIRROR_AXIS.HORZ_180 && mirrorAxis === MIRROR_AXIS.BOTH_360)
                                // matrix(1, 0, 0, -1, 0, originy*2) rotate(90, originx originy)
                                newLines.push(createLine(state, {
                                    x1: (curLine.x1 * Math.cos(pi/2)) +
                                        (curLine.y1 * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y1: ((curLine.x1 * Math.sin(pi/2)) +
                                        (curLine.y1 * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2)) * -1 + originy*2,
                                    x2: (cursorPos[0] * Math.cos(pi/2)) +
                                        (cursorPos[1] * -Math.sin(pi/2)) +
                                        originx*(1-Math.cos(pi/2)) + originy*Math.sin(pi/2),
                                    y2: ((cursorPos[0] * Math.sin(pi/2)) +
                                        (cursorPos[1] * -Math.cos(pi/2)) +
                                        originy*(1-Math.cos(pi/2)) - originx*Math.sin(pi/2))  * -1 + originy*2,
                                }))
                        }
                    }
                }

                return {...state,
                    curLine: curLine === null ? {
                        x1: cursorPos[0],
                        y1: cursorPos[1],
                    } : null,
                    lines: Array.prototype.concat(lines, newLines)
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
            return {...state, bounds: pointIn(bounds, relCursorPos)
                ? removePoint(bounds, relCursorPos)
                : [...bounds, relCursorPos],
            }

        case 'undo':
            const prevState = undoStack.pop()
            redoStack.push(prevState)
            return prevState

        case 'redo':
            const nextState = redoStack.pop()
            if (nextState === undefined)
                return state
            undoStack.push(nextState)
            return nextState

        case 'set manual': {
            // Don't know why I can't just delete action from DATA, but WHATEVER I guess
            let newState = {...state, ...data}
            delete newState.action
            return newState
        }
        case 'add common color':
            let copy = JSON.parse(JSON.stringify(commonColors))
            copy.push(data.color)
            copy.shift()
            return {...state,
                commonColors: copy
            }

        case `set to common color`:
            if (data.index > commonColors.length)
                return state
            return {...state,
                // Because they're displayed inverted
                stroke: commonColors[commonColors.length - data.index]
            }

        case 'increment clipboard rotation': return {...state, clipboardRotation: (clipboardRotation + 90) % 360}
        case 'increment clipboard mirror axis':
            // eslint-disable-next-line default-case
            switch (clipboardMirrorAxis){
                case null:                 return {...state, clipboardMirrorAxis: MIRROR_AXIS.VERT_90};
                case MIRROR_AXIS.VERT_90:  return {...state, clipboardMirrorAxis: MIRROR_AXIS.BOTH_360};
                case MIRROR_AXIS.BOTH_360: return {...state, clipboardMirrorAxis: MIRROR_AXIS.HORZ_180};
                case MIRROR_AXIS.HORZ_180: return {...state, clipboardMirrorAxis: null};
            } return state // Unreachable

        case 'toggle mirroring': return {...state, mirroring: !mirroring}
        case 'toggle mirror axis 1':
            // eslint-disable-next-line default-case
            switch (mirrorAxis){
                case MIRROR_AXIS.VERT_90:  return {...state, mirrorAxis: MIRROR_AXIS.HORZ_180}
                case MIRROR_AXIS.HORZ_180: return {...state, mirrorAxis: MIRROR_AXIS.BOTH_360}
                case MIRROR_AXIS.BOTH_360: return {...state, mirrorAxis: MIRROR_AXIS.VERT_90}
            } return state // This shouldn't be possible, but whatever

        case 'toggle mirror axis 2':
            // eslint-disable-next-line default-case
            switch (mirrorAxis2){
                case MIRROR_AXIS.VERT_90:  return {...state, mirrorAxis2: MIRROR_AXIS.HORZ_180}
                case MIRROR_AXIS.HORZ_180: return {...state, mirrorAxis2: MIRROR_AXIS.BOTH_360}
                case MIRROR_AXIS.BOTH_360: return {...state, mirrorAxis2: MIRROR_AXIS.VERT_90}
            } return state // This shouldn't be possible, but whatever

        case 'toggle mirror type':
            return {...state,
                mirrorType: mirrorType === MIRROR_TYPE.CURSOR ? MIRROR_TYPE.PAGE : MIRROR_TYPE.CURSOR
            }

        case 'toggle mirror method':
            // eslint-disable-next-line default-case
            switch (mirrorMethod){
                case MIRROR_METHOD.FLIP:   return {...state, mirrorMethod: MIRROR_METHOD.ROTATE}
                case MIRROR_METHOD.ROTATE: return {...state, mirrorMethod: MIRROR_METHOD.BOTH}
                case MIRROR_METHOD.BOTH:   return {...state, mirrorMethod: MIRROR_METHOD.FLIP}
            } return state // This shouldn't be possible, but whatever

        case "toggle dark mode":
            console.log("toggling dark mode");
            toggleDarkMode()
            return state
        case 'start tour':
            preTourState = state
            return {...reducer(state, {action: 'go home'}),
                mirroring: true,
                bounds: [
                    [20.05, 27.05],
                    [18.05, 23.05],
                ],
                curLine: null,
                mobile: true,
                lines: [
                    <line {...{
                        "x1": 19.05,
                        "y1": 27.05,
                        "x2": 20.05,
                        "y2": 25.05,
                        "stroke": "black",
                        "strokeWidth": 0.05
                    }}/>,
                    <line {...{
                        "x1": 20.05,
                        "y1": 25.05,
                        "x2": 19.05,
                        "y2": 23.05,
                        "stroke": "black",
                        "strokeWidth": 0.05
                    }}/>,
                    <line {...{
                        "x1": 19.05,
                        "y1": 23.05,
                        "x2": 18.05,
                        "y2": 25.05,
                        "stroke": "black",
                        "strokeWidth": 0.05
                    }}/>,
                    <line {...{
                        "x1": 18.05,
                        "y1": 25.05,
                        "x2": 19.05,
                        "y2": 27.05,
                        "stroke": "black",
                        "strokeWidth": 0.05
                    }}/>,
                ]
            }
        case 'end tour':
            return preTourState
        default:
            // console.log(bounds);
            // console.log(lines);
            console.warn(`Unknown action: ${data.action}`)
            return state
    }
}
