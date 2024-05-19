import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE, localStorageSettingsName, localStorageName} from './globals'
import { toRadians, pointIn, removePoint, calc, getSelected, createLine, eventMatchesKeycode, pointEq, toggleDarkMode, align, filterObjectByKeys } from './utils'
import defaultOptions, { keybindings, reversible, reversibleActions, saveSettingActions } from './options'
import {deserialize, serialize, serializeState} from './fileUtils';
import {applyManualFlip, applyManualRotation, getMirrored, getStateMirrored} from './mirrorEngine';


var undoStack = []
var redoStack = []
var preTourState = null
// This is a bad solution:
// When an event happens we want to persist (saveSettingActions), it saves the *current* state, not the state *after*
// the action has run, because that's what we have. Instead of catching all the return statements and refactoring
// *everything*, instead we just remove the limit and the next state saves instead. There's usually at least a cursor
// movement or something, so it should work pretty well
var saveNext = false

// Can accept any of 3 parameters to dispatch:
//                 {action: "...", foo: "bar"}
// "..."        -> {action: "..."}
// {foo: "bar"} -> {action: "set manual", foo: "bar"}
export default function reducer(state, data){
    // Some convenience parameter handling
    if (typeof data === String)
        var data = {action: data}
    else if (data.action === undefined)
        var data = {action: "set manual", ...data}


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
        mirrorAxis,
        mirrorAxis2,
        mirrorType,
        mirrorMethod,
        trellis,
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
        openMenus,
        defaultScalex,
        defaultScaley,
    } = state

    const {
        halfx,
        halfy,
        offsetx,
        offsety,
        mirrorOriginx,
        mirrorOriginy,
        boundRect,
        relCursorPos,
        scaledTranslationx,
        scaledTranslationy,
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
        }
    }

    switch (data.action){
        case 'cursor moved': return {...state, cursorPos: align(state, data.x, data.y), debug_rawCursorPos: [data.x, data.y]} // args: x, y
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
        case 'scale':{ // args: amtx, amty (delta values), cx, cy (center x/y)
            // See also: nav menu scale number input
            const max = Math.min(window.visualViewport.width, window.visualViewport.height) / 4
            const cx = data.cx ?? cursorPos[0]
            const cy = data.cy ?? cursorPos[1]

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
        case 'increase scale':  return {...state, scalex: scalex*2, scaley: scaley*2}
        case 'decrease scale':  return {...state, scalex: scalex/2, scaley: scaley/2}
        case 'go home':         return {...state, translationx: 0, translationy: 0, scalex: defaultScalex, scaley: defaultScaley}
        // Direction actions
        case 'left':            return {...state, cursorPos: [cursorPos[0] - scalex, cursorPos[1]]}
        case 'right':           return {...state, cursorPos: [cursorPos[0] + scalex, cursorPos[1]]}
        case 'up':              return {...state, cursorPos: [cursorPos[0], cursorPos[1] - scaley]}
        case 'down':            return {...state, cursorPos: [cursorPos[0], cursorPos[1] + scaley]}
        // Destruction Actions
        case 'clear':           return {...state, lines: [], bounds: []}
        case 'clear bounds':    return {...state, bounds: []}
        case 'delete selected':
            return {...state,
                lines: getSelected(state, 'remove'),
                bounds: removeSelectionAfterDelete ? [] : bounds,
            }

        case 'delete not selected':
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
            console.log('deletign');
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
                if (openMenus.mirror)
                    points = getStateMirrored(state, () => ({x: cursorPos[0], y: cursorPos[1]}), true)
                else
                    points.push({x: cursorPos[0], y: cursorPos[1]})

                // getMirrored() works in absolute, not scaled coords, where the lines are in relative, scaled coords
                console.log(points.length);
                points = points.map(i => [(i.x - translationx) / scalex, (i.y - translationy) / scaley])

                // console.log(points);
                // console.log(lines);

                return {...state, lines: (lines.filter(i =>{
                    // !((pointEq(state, [i.props.x1, i.props.y1], relCursorPos, .3) ||
                    //   (pointEq(state, [i.props.x2, i.props.y2], relCursorPos, .3)))
                    // )
                    // return !(points.includes(
                    //         {x: (i.props.x1 + translationx) * scalex, y: (i.props.y1 + translationy) * scaley}
                    //     ) || points.includes(
                    //         {x: (i.props.x2 + translationx) * scalex, y: (i.props.y2 + translationy) * scaley}
                    //     )
                    // )
                    // console.log(points, [i.props.x1, i.props.y1])
                    return !(pointIn(points, [i.props.x1, i.props.y1]) || pointIn(points, [i.props.x2, i.props.y2]))
                }
                )), deleteme: points}
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

        // Creation actions
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
                    if (openMenus.mirror){
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
        case 'increment clipboard rotation': return {...state, clipboardRotation: (clipboardRotation + 90) % 360}
        case 'increment clipboard mirror axis':
            // eslint-disable-next-line default-case
            switch (clipboardMirrorAxis){
                case null:                 return {...state, clipboardMirrorAxis: MIRROR_AXIS.VERT_90};
                case MIRROR_AXIS.VERT_90:  return {...state, clipboardMirrorAxis: MIRROR_AXIS.BOTH_360};
                case MIRROR_AXIS.BOTH_360: return {...state, clipboardMirrorAxis: MIRROR_AXIS.HORZ_180};
                case MIRROR_AXIS.HORZ_180: return {...state, clipboardMirrorAxis: null};
            } return state // Unreachable

        // Color & Stroke Actions
        case 'add common color': // args: color (hex string)
            let copy = JSON.parse(JSON.stringify(commonColors))
            copy.push(data.color)
            copy.shift()
            return {...state,
                commonColors: copy
            }

        case 'set to common color': // args: index
            if (data.index > commonColors.length)
                return state
            return {...state,
                // Because they're displayed inverted
                stroke: commonColors[commonColors.length - data.index]
            }

        // File Actions
        case "download": // args: name (string)
            // Create a Blob with the contents and set the MIME type
            const blob = new Blob([serialize(state)], { type: 'image/svg+xml' });
            // Create a link (anchor) element
            const link = document.createElement('a');
            // Set the download attribute and href with the Blob
            link.download = data.name.trim()
            link.href = URL.createObjectURL(blob);
            // Append the link to the body and trigger a click event
            document.body.appendChild(link);
            link.click();
            // Remove the link from the body
            document.body.removeChild(link);
            return state

        case "upload":
            return {...state, ...deserialize(data.str)} // args: str (serialized data)

        case "save local": // args: name (string)
            // localStorage.setItem(data.name, serialize(state))
            let obj = {}
            obj[data.name.trim()] = serialize(state)
            localStorage.setItem(localStorageName, JSON.stringify({...JSON.parse(localStorage.getItem(localStorageName)), ...obj}))
            return state

        case "load local": // args: name (string)
            return {...state, ...deserialize(JSON.parse(localStorage.getItem(localStorageName))[data.name.trim()])}

        // Misc Actions
        // TODO: remove toggle partials
        case 'toggle partials': return {...state, partials: !partials}
        case "toggle dark mode":
            console.log("toggling dark mode");
            toggleDarkMode()
            return state

        case 'start tour':
            preTourState = state
            return {...reducer(state, {action: 'go home'}),
                openMenus: {
                    main: false,
                    controls: true,
                    color: true,
                    navigation: true,
                    repeat: true,
                    file: false,
                    settings: false,
                    help: false,
                    mirror: true,
                },
                bounds: [
                    [20.05, 27.05],
                    [18.05, 23.05],
                ],
                curLine: null,
                dash: "20, 10",
                mobile: true,
                commonColors: ['#000000', '#000000', '#ffddab', '#ff784b', '#1a31ff'],
                lines: [
                    <line id="dashed-line" {...{
                        "x1": 19.05 + 4,
                        "y1": 27.05 + 4,
                        "x2": 20.05 + 6,
                        "y2": 25.05 + 10,
                        "stroke": "black",
                        "strokeWidth": 0.05,
                        "strokeDasharray": '1, .5'
                    }}/>,
                    <line {...{
                        "x1": 19.05,
                        "y1": 27.05,
                        "x2": 20.05,
                        "y2": 25.05,
                        "stroke": "black",
                        "strokeWidth": 0.05,
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

        case 'set manual': {
            // Don't know why I can't just delete action from DATA, but WHATEVER I guess
            let newState = {...state, ...data}
            delete newState.action
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
            return {...reducer(state, "nevermind"), openMenus: {...copy}}
        }
        case "debug":
            // console.log((<line x1="2" x2="3" y1="4" y2="5" stroke="black"></line>).);
            // function saveSvg(svgEl, name) {
            //     // svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            //     var svgData = svgEl.outerHTML;
            //     var pre = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\r\n<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">';
            //     var post = '</svg>';
            //     var svgBlob = new Blob([pre + svgData + post], {type:"image/svg+xml;charset=utf-8"});
            //     var svgUrl = URL.createObjectURL(svgBlob);
            //     var downloadLink = document.createElement("a");
            //     downloadLink.href = svgUrl;
            //     downloadLink.download = name;
            //     document.body.appendChild(downloadLink);
            //     downloadLink.click();
            //     document.body.removeChild(downloadLink);
            // }
            // saveSvg(document.querySelector('#lines'), 'lines.svg')
            // const ReactDOMServer = require('react-dom/server');
            // const HtmlToReactParser = require('html-to-react').Parser;
            // const htmlInput = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
            // '<!-- {"repeating":false,"translationx":0,"translationy":0,"scalex":20,"scaley":20,"rotatex":0,"rotatey":0,"shearx":0,"sheary":0} -->' +
            // '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
            // '<g id="lines" transform="translate(0 0) scale(20 20)" xmlns="http://www.w3.org/2000/svg"> <line x1="27.05" y1="11.05" x2="17.05" y2="21.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line><line x1="36.05" y1="14.05" x2="43.05" y2="21.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line><line x1="50.05" y1="25.05" x2="45.05" y2="31.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line><line x1="35.05" y1="41.05" x2="28.05" y2="41.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line><line x1="19.05" y1="41.05" x2="13.05" y2="40.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line><line x1="7.05" y1="35.05" x2="5.05" y2="30.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line><line x1="35.05" y1="12.05" x2="23.05" y2="24.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line><line x1="15.05" y1="10.05" x2="32.05" y2="23.05" stroke="#000000" stroke-width="0.05" stroke-dasharray="0"></line> </g>' +
            // '</svg>'

            // // const htmlInput = '<div><h1>Title</h1><p>A paragraph</p></div>';
            // // const htmlToReactParser = new HtmlToReactParser();
            // // const reactElement = htmlToReactParser.parse(htmlInput)[0].props.children.props.children;
            // // console.log(reactElement);

            // console.log(/<!-- (.+) -->/.exec(htmlInput))
            return state
        default:
            console.warn(`Unknown action: ${data.action}`)
            return state
    }
}
