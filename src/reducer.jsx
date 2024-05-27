import {MIRROR_AXIS, MIRROR_TYPE, localStorageSettingsName, localStorageName} from './globals'
import {
    toRadians,
    pointIn,
    removePoint,
    calc,
    getSelected,
    createLine,
    eventMatchesKeycode,
    pointEq,
    toggleDarkMode,
    align,
    filterObjectByKeys
} from './utils'
import defaultOptions, { keybindings, reversible, reversibleActions, saveSettingActions } from './options'
import {deserialize, download, image, serialize, serializeState} from './fileUtils';
import {applyManualFlip, applyManualRotation, getMirrored, getStateMirrored} from './mirrorEngine';
import {setTapHolding} from './globals';


var undoStack = []
var redoStack = []
var preTourState = null
// This is a bad solution:
// When an event happens we want to persist (saveSettingActions), it saves the *current* state, not the state *after*
// the action has run, because that's what we have. Instead of catching all the return statements and refactoring
// *everything*, instead we just remove the limit and the next state saves instead. There's usually at least a cursor
// movement or something, so it should work pretty well
var saveNext = false
const miniMenus = ['extra', 'color', 'mirror', 'select', 'clipboard', 'delete']

// Can accept any of 3 parameters to dispatch:
//                 {action: "...", foo: "bar"}
// "..."        -> {action: "..."}
// {foo: "bar"} -> {action: "set manual", foo: "bar"}
export default function reducer(state, data){
    // Some convenience parameter handling
    if (typeof data === String)
        data = {action: data}
    if (data?.action === undefined)
        data = {action: "set manual", ...data}

    const {
        mobile,
        cursorPos,
        rotate,
        partials,
        lines,
        curLine,
        bounds,
        mirroring,
        mirrorAxis,
        mirrorAxis2,
        mirrorType,
        hideDots,
        mirrorMethod,
        eraser,
        clipboard,
        clipboardRotation,
        clipboardMirrorAxis,
        translationx,
        translationy,
        scalex,
        scaley,
        removeSelectionAfterDelete,
        openMenus,
        defaultScalex,
        defaultScaley,
    } = state

    const {
        halfx,
        halfy,
        clipx, clipy,
        boundRect,
        relCursorPos,
    } = calc(state)

    if (saveNext){
        localStorage.setItem(localStorageSettingsName, serializeState(state))
        saveNext = false
    }
    if (saveSettingActions.includes(data.action))
        saveNext = true

    if (reversibleActions.includes(data.action)){
        if (undoStack.push(filterObjectByKeys(state, reversible)) > state.maxUndoAmt){
            undoStack.shift()
            redoStack = []
        }
    }

    switch (data.action){
        case 'cursor moved': // args: x, y
            // This is here so when a touch is being held, and has moved enough to move the cursor, it disables the hold action
            const newPos = align(state, data.x, data.y)
            if (JSON.stringify(newPos) !== JSON.stringify(cursorPos))
                setTapHolding(false)
            return {...state, cursorPos: newPos, debug_rawCursorPos: [data.x, data.y]}
        case 'key press': // args: event
            // If it's just a modifier key, don't do anything (it'll falsely trigger things)
            if (['Shift', 'Meta', 'Control', 'Alt'].includes(data.event.key))
                return state

            var take = null
            Object.entries(keybindings).forEach(([shortcut, action]) => {
                if (eventMatchesKeycode(data.event, shortcut))
                    take = action
            })
            return take ? reducer(state, take) : state

        // Transformation Actions
        case 'translate': { // args: x, y (delta values)
            const newState = {...state,
                translationx: translationx + data.x,
                translationy: translationy + data.y,
                cursorPos: [cursorPos[0] + data.x, cursorPos[1] + data.y],
                // cursorPos: align(state, cursorPos[0], cursorPos[1]),
                curLine: null,
            }
            // The -8 is a fudge factor to get a better guess at where the mouse is
            // return reducer(newState, {action: 'cursor moved', x: halfx, y: halfy})
            // return reducer(newState, {action: 'cursor moved', x: cursorPos[0], y: cursorPos[1]})
            return newState
        }
        // Arg Coords: absolute, not scaled
        case 'scale':{ // args: amtx, amty (delta values), optional: cx, cy (center x/y) (defaults to cursorPos)
            // This took FOREVER to figure out
            const cx = (-(data.cx ?? cursorPos[0])) + translationx
            const cy = (-(data.cy ?? cursorPos[1])) + translationy

            const x = Math.min(defaultOptions.maxScale, Math.max(defaultOptions.minScale, scalex + data.amtx))
            const y = Math.min(defaultOptions.maxScale, Math.max(defaultOptions.minScale, scaley + data.amty))

            return {...state,
                scalex: x,
                scaley: y,
                translationx: translationx + ((cx/scalex)*x) - cx,
                translationy: translationy + ((cy/scaley)*y) - cy,
                curLine: null,
            }
        }
        case 'rotate': // args: amt
            return {...state, rotate: rotate + data.amt}
        case 'increase scale':  return {...state, scalex: scalex*2, scaley: scaley*2}
        case 'decrease scale':  return {...state, scalex: scalex/2, scaley: scaley/2}
        case 'go home':
            return {...state,
                translationx: 0,
                translationy: 0,
                scalex: defaultScalex,
                scaley: defaultScaley,
                rotate: 0,
            }
        case 'go to selection':
            if (!boundRect)
                return state
            else
                return {...state,
                    translationx: boundRect.left - (window.visualViewport.width / 2) / scalex,
                    translationy: boundRect.top - (window.visualViewport.height / 2) / scaley
                }
        // Direction actions
        case 'left':            return {...state, cursorPos: [cursorPos[0] - scalex, cursorPos[1]]}
        case 'right':           return {...state, cursorPos: [cursorPos[0] + scalex, cursorPos[1]]}
        case 'up':              return {...state, cursorPos: [cursorPos[0], cursorPos[1] - scaley]}
        case 'down':            return {...state, cursorPos: [cursorPos[0], cursorPos[1] + scaley]}
        // Destruction Actions
        case 'clear':           return {...state, lines: [], bounds: [], openMenus: {...openMenus, delete: false}}
        case 'clear bounds':    return {...state, bounds: []}
        case 'delete selected':
            return {...state,
                lines: getSelected(state, 'remove'),
                bounds: removeSelectionAfterDelete ? [] : bounds,
            }

        case 'delete unselected':
            return {...state,
                lines: getSelected(state, 'only'),
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
                var points = []
                if (mirroring || openMenus.mirror){
                    // points = getStateMirrored(state, () => ({x: cursorPos[0], y: cursorPos[1]}), true)
                    // TODO: the 0 here doesn't work, I don't know why.
                    const originx = mirrorType === MIRROR_TYPE.PAGE ? halfx : cursorPos[0]
                    const originy = mirrorType === MIRROR_TYPE.PAGE ? halfy : cursorPos[1]
                    points = getMirrored(
                        mirrorMethod,
                        mirrorAxis,
                        mirrorAxis2,
                        originx,
                        originy,
                        () => ({x: cursorPos[0], y: cursorPos[1]}),
                        applyManualRotation,
                        applyManualFlip,
                    )
                }
                else
                    points.push({x: cursorPos[0], y: cursorPos[1]})

                // getMirrored() works in absolute, not scaled coords, where the lines are in relative, scaled coords
                points = points.map(i => [(i.x - translationx) / scalex, (i.y - translationy) / scaley])

                return {...state, lines: (lines.filter(i =>
                    !(pointIn(points, [i.props.x1, i.props.y1]) || pointIn(points, [i.props.x2, i.props.y2]))
                )), deleteme: points}
            }

        case 'nevermind':
            if (openMenus.main && !mobile)
                return {...state, openMenus: {...openMenus, main: false}}
            else if (clipboard)
                return {...state, clipboard: null, clipboardMirrorAxis: null, clipboardRotation: 0}
            else if (curLine)
                return {...state, curLine: null}
            else if (bounds.length)
                return {...state, bounds: []}
                // return reducer(state, {action: 'clear bounds'})
            return state

        // Creation actions
        case 'add line':
            if (clipboard && !mobile)
                return {...reducer(state, {action: 'paste'}),
                    clipboard:           data.continue ? clipboard           : null,
                    clipboardMirrorAxis: data.continue ? clipboardMirrorAxis : null,
                    clipboardRotation:   data.continue ? clipboardRotation   : 0,
                }
            else {
                // This is so you undo the whole line all at once, instead of only undoing half the line at a time
                if (curLine !== null)
                    undoStack.pop()

                var newLines = []
                if (curLine != null){
                    if (mirroring || openMenus.mirror){
                        const start = getStateMirrored(state, () => ({x: curLine.x1, y: curLine.y1}), true)
                        const end = getStateMirrored(state, () => ({x: cursorPos[0], y: cursorPos[1]}), true)
                        for (let i = 0; i < start.length; i++){
                            newLines.push(createLine(state, {
                                x1: start[i].x,
                                y1: start[i].y,
                                x2: end[i].x,
                                y2: end[i].y,
                            }))
                        }
                    } else {
                        newLines.push(createLine(state, {
                            ...curLine,
                            x2: cursorPos[0],
                            y2: cursorPos[1],
                        }))
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

        // Undo Actions
        case 'undo':
            const prevState = undoStack.pop()
            if (prevState !== undefined){
                redoStack.push(prevState)
                // TODO: have this maintain the current state except for the undo keys
                return reducer(state, prevState)
            } else
                return state

        case 'redo':
            const nextState = redoStack.pop()
            if (nextState === undefined)
                return state
            undoStack.push(nextState)
            return {...state, ...nextState}
        // Clipboard Actions
        case 'copy':            return {...state, clipboard: getSelected(state), curLine: null}
        case 'paste':
            if (clipboard){
                console.log('pasting');
                const clipboardx = (clipx - translationx) / scalex
                const clipboardy = (clipy - translationy) / scaley
                function transform({x1, y1, x2, y2}){
                    const rad = toRadians(clipboardRotation)

                    // We have to do this so in setting the rotation, they don't cascade on each other and set
                    // values that are used in the next calculation
                    const __x1 = x1 + clipboardx
                    const __y1 = y1 + clipboardy
                    const __x2 = x2 + clipboardx
                    const __y2 = y2 + clipboardy

                    // We have to do this, because parameters are const or something?
                    let _x1 = __x1
                    let _y1 = __y1
                    let _x2 = __x2
                    let _y2 = __y2

                    if (clipboardRotation !== 180 && clipboardRotation !== 0){
                        // rotate(rad, clipboardx, clipboardy)
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

                    // I honestly have no idea why this uses relCursorPos instead of clipboardxy.
                    // But it works, so I'm not questioning it
                    if (clipboardMirrorAxis === MIRROR_AXIS.VERT_90 ||
                        clipboardMirrorAxis === MIRROR_AXIS.BOTH_360
                    ){
                        // matrix(-1, 0, 0, 1, clipboardx*2, 0)
                        _x1 = _x1 * -1 + relCursorPos[0]*2
                        _x2 = _x2 * -1 + relCursorPos[0]*2
                    }
                    if (clipboardMirrorAxis === MIRROR_AXIS.HORZ_180 ||
                        clipboardMirrorAxis === MIRROR_AXIS.BOTH_360
                    ){
                        // matrix(1, 0, 0, -1, 0, clipboardy*2)
                        _y1 = _y1 * -1 + relCursorPos[1]*2
                        _y2 = _y2 * -1 + relCursorPos[1]*2
                    }

                    // We do 180 rotation by flipping accross both axis. I still don't know why.
                    if (clipboardRotation === 180){
                        _y1 = _y1 * -1 + relCursorPos[1]*2
                        _y2 = _y2 * -1 + relCursorPos[1]*2
                        _x1 = _x1 * -1 + relCursorPos[0]*2
                        _x2 = _x2 * -1 + relCursorPos[0]*2
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
        case 'increment clipboard rotation': return {...state, clipboardRotation: (clipboardRotation + 90) % 360}
        case 'increment clipboard mirror axis':
            switch (clipboardMirrorAxis){
                case MIRROR_AXIS.VERT_90:  return {...state, clipboardMirrorAxis: MIRROR_AXIS.BOTH_360};
                case MIRROR_AXIS.BOTH_360: return {...state, clipboardMirrorAxis: MIRROR_AXIS.HORZ_180};
                case MIRROR_AXIS.HORZ_180: return {...state, clipboardMirrorAxis: null};
                default:                   return {...state, clipboardMirrorAxis: MIRROR_AXIS.VERT_90}
            }

        // File Actions
        case "download": // args: name (string)
            switch (data.format) {
                case 'svg':
                    download(data.name, 'image/svg+xml', {str: serialize(state, data.selectedOnly)})
                    break
                case 'png':
                case 'jpeg':
                    // Data has width, height, and format
                    image(state,
                        data.format,
                        data.width, data.height,
                        data.x, data.y,
                        false,
                        data.selectedOnly && bounds.length > 1,
                        url => download(data.name + '.' + data.format, `image/${data.format}`, {url})
                    )
                    break
                default:
                    console.error('Invalid format given to download:', data.format)
                    break
            }
            return state

        case "upload":
            return {...state, ...deserialize(data.str)} // args: str (serialized data)

        case "save local": // args: name (string)
            // localStorage.setItem(data.name, serialize(state))
            let obj = {}
            obj[data.name.trim()] = serialize(state)
            localStorage.setItem(localStorageName, JSON.stringify({...JSON.parse(localStorage.getItem(localStorageName)), ...obj}))
            setTimeout(() => reducer(state, {action: 'cursor moved'}), 100)
            return state

        case "load local": // args: name (string)
            return {...state, ...deserialize(JSON.parse(localStorage.getItem(localStorageName))[data.name.trim()])}

        case 'copy image':
            const rect = document.querySelector('#lines').getBBox()
            image(state,
                'png',
                bounds.length > 1 ? boundRect.width  * scalex : rect.width * scalex,
                bounds.length > 1 ? boundRect.height * scaley : rect.height * scaley,
                0, 0,
                false,
                bounds.length > 1, // Default to selectedOnly
                blob => {
                    try {
                        navigator.clipboard.write([
                            new ClipboardItem({
                                'image/png': blob
                            })
                        ]);
                    } catch (error) {
                        console.error(error);
                    }
                },
                true
            )
            return state

        // Misc Actions
        // TODO: remove toggle partials
        case 'toggle partials': return {...state, partials: !partials}
        case "toggle dark mode":
            console.log("toggling dark mode");
            toggleDarkMode()
            return state

        case 'start tour':
            preTourState = state
            console.log('starting tour');
            return {...reducer(state, {action: 'go home'}),
                inTour: true,
                openMenus: {
                    main: true,
                    controls: false,
                    color: false,
                    navigation: false,
                    repeat: false,
                    file: false,
                    settings: false,
                    help: false,
                    mirror: false,
                },
                bounds: [
                    [6.05, 13.05],
                    [4.05, 9.05],
                ],
                curLine: null,
                dash: ['0', "20, 10", '0', '0', '0'],
                colorProfile: 1,
                mobile: true,
                stroke: ['#000000', '#000000', '#ffddab', '#ff784b', '#1a31ff'],
                lines: [
                    <line key='dashed-line' id="dashed-line" {...{
                        "x1": 5.05 + 4,
                        "y1": 13.05 + 4,
                        "x2": 6.05 + 6,
                        "y2": 11.05 + 10,
                        "stroke": "black",
                        "strokeWidth": 0.05,
                        "strokeDasharray": '1, .5'
                    }}/>,
                    <line key="tour-line-1" {...{
                        "x1": 5.05,
                        "y1": 13.05,
                        "x2": 6.05,
                        "y2": 11.05,
                        "stroke": "black",
                        "strokeWidth": 0.05,
                    }}/>,
                    <line key="tour-line-2" {...{
                        "x1": 6.05,
                        "y1": 11.05,
                        "x2": 5.05,
                        "y2": 9.05,
                        "stroke": "black",
                        "strokeWidth": 0.05
                    }}/>,
                    <line key="tour-line-3" {...{
                        "x1": 5.05,
                        "y1": 9.05,
                        "x2": 4.05,
                        "y2": 11.05,
                        "stroke": "black",
                        "strokeWidth": 0.05
                    }}/>,
                    <line key="tour-line-4" {...{
                        "x1": 4.05,
                        "y1": 11.05,
                        "x2": 5.05,
                        "y2": 13.05,
                        "stroke": "black",
                        "strokeWidth": 0.05
                    }}/>,
                ]
            }
        case 'end tour':
            console.log('ending tour');
            return preTourState

        case 'set manual': {
            // Don't know why I can't just delete action from DATA, but WHATEVER I guess
            let newState = {...state, ...data}
            delete newState.action
            // if (Object.keys(data).includes('enableGestureScale')){
            //     console.log('enableGestureScale is now', data['enableGestureScale']);
            //     console.log(newState)
            // }
            return newState
        }
        case 'menu': { // args: any one of toggle, open, or close: the menu to do that to
            let copy = JSON.parse(JSON.stringify(openMenus))
            if (data.toggle !== undefined)
                copy[data.toggle] = !copy[data.toggle]
            if (data.open !== undefined)
                copy[data.open] = true
            if (data.close !== undefined)
                copy[data.close] = false

            // Only allow one mini menu to be open at a time
            if (((data.open !== undefined && miniMenus.includes(data.open)) ||
                (data.toggle !== undefined && copy[data.toggle] && miniMenus.includes(data.toggle)))
            ){
                const setFalse = miniMenus.filter(i => i !== data.open && i !== data.toggle)
                Object.keys(copy).forEach(key => {
                    copy[key] = setFalse.includes(key) ? false : copy[key]
                })
            }

            // If we close the main menu, close the mini menus as well
            if ((data.close === 'main' || (data.toggle === 'main' && !copy[data.toggle])) && mobile){
                Object.keys(copy).forEach(key => {
                    copy[key] = miniMenus.includes(key) ? false : copy[key]
                })
            }

            return {...reducer(state, "nevermind"),
                openMenus: {...copy},
                // If we close the repeat menu, and we have dots turned off, turn them back on
                hideDots: !(openMenus.repeat && !copy.repeat) && hideDots,
            }
        }
        case "debug":
            return state
        default:
            console.warn(`Unknown action: ${data.action}`)
            return state
    }
}
