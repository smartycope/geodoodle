import { MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE } from './globals'
import options from './options';
import { RxRotateCounterClockwise } from "react-icons/rx";
import { GoMirror } from "react-icons/go";
import {FaCheck, FaTrash, FaXmark} from 'react-icons/fa6';
import {getHalf, getDebugBox, getBoundRect, splitAllLines, getAllClipboardLines, getAllIntersections, getClipboardButtonsPos} from './utils';
import Line from './helper/Line';
import Point from './helper/Point';
import { useContext, useEffect } from "react";
import { StateContext } from "./Contexts";


var debugTextOffset = 20

// This is slightly inelegant, but it works, and it's just a debug function
// Color is the color of the text and cirlce, fill overrides the color of the circle
export function DebugPoint({name, point, decimals=undefined, yoff=0, color='black', r=5, fill=undefined, inflated=false, omitText=false, omitCircle=false, ...props}){
    useEffect(() => {
        // Reset the global every render
        debugTextOffset = 20
    })
    debugTextOffset += 20
    const {state} = useContext(StateContext)
    let x, y, label
    try {
        if (point instanceof Point){
            const {x: _x, y: _y} = point.asViewport(state)
            x = _x
            y = _y
        }
        else if (Array.isArray(point)){
            x = point[0]
            y = point[1]
        }
        else{
            x = point.x
            y = point.y
        }

        // const {x: dispx, y: dispy} = Point.fromViewport(state, x, y, inflated).asViewport(state, inflated)
        if (inflated)
            label = `${name}: (${x.toFixed(decimals ?? 0)}, ${y.toFixed(decimals ?? 0)})`
        else
            label = `${name}: [${x.toFixed(decimals ?? 1)/state.scalex}, ${y.toFixed(decimals ?? 1)/state.scaley}]`
        // console.log(label)
    } catch (e){
        label = `${name}: ${typeof point}: ${JSON.stringify(point)}`
    }

    return state.debug && <>
        {!omitText && <text x='75%' y={debugTextOffset} fill={color} fontWeight="bold">{label}</text>}
        {!omitCircle && <g key={`point-${name}`}>
            {!omitText && <text x={x-label.length*4} y={y-10+yoff} fill={color} fontWeight="bold">{label}</text>}
            <circle cx={x} cy={y} {...props} r={r} fill={fill || color}/>
        </g>}
    </>
}

export function GlowEffect(){
    return <defs>
        {/* the "filterUnits="userSpaceOnUse" makes it so unsloped lines get rendered */}
        <filter id="glow" x="-1000%" y="-1000%" width="2000%" height="2000%" filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceGraphic" stdDeviation=".3" result="blur" />
            <feFlood floodColor={options.glowColor} floodOpacity="1" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
}

export function DebugInfo(){
    const {state} = useContext(StateContext)
    const {debug, debugDrawPoints, translation, scalex, scaley, openMenus} = state
    const debugBox = getDebugBox(state)
    const origin = Point.fromViewport(state, translation._x, translation._y, false)
    const intersectcions = getAllIntersections(state.lines)

    return debug && <g>
        {/* Repeat box */}
        {openMenus.repeat && debugBox.render(state, {stroke: 'green', strokeWidth: 2, fillOpacity: 0})}

        <DebugPoint name="Translation" point={origin} inflated={false} color='green'/>
        <DebugPoint name="Scale" point={{x: scalex, y: scaley}} omitCircle inflated/>
        {!state.fillMode && <DebugPoint name="Cursor" point={state.cursorPos} yoff={40} fill='transparent'/>}
        {/* <DebugPoint name="SVG Origin" point={Point.svgOrigin(state)} omit/> */}
        {debugDrawPoints && Object.entries(debugDrawPoints).map(([name, spec]) => <DebugPoint key={name} name={name} {...spec} />)}
        {/* Draw intersections */}
        {intersectcions.map((point, i) => <DebugPoint key={i} name={`Intersection ${i}`} point={point} decimals={0} omitText/>)}
        {/* Draw intersections exclusively on the current line */}
        {Line.getCurrentLine(state)?.findIntersections(state.lines).map((point, i) => <DebugPoint key={i} name={`Intersection ${i}`} point={point} decimals={0} omitText/>)}
    </g>
}

export function MirrorMetaLines(){
    const {state} = useContext(StateContext)
    let mirrorMetaLines = []
    const {mirrorType, mirroring, openMenus, mirrorMethod, mirrorAxis, scalex} = state
    const half = getHalf(state)
    const {x: halfx, y: halfy} = half.asViewport(state)

    if (mirrorType === MIRROR_TYPE.PAGE && (mirroring || openMenus.mirror)){
        if (mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH){
            if ((mirrorAxis === MIRROR_AXIS.VERT_90 || mirrorAxis === MIRROR_AXIS.BOTH_360))
                mirrorMetaLines.push(<line x1={halfx} y1={0} x2={halfx} y2="100%" stroke={options.mirrorColor} key="mirror-horz"/>)
            if ((mirrorAxis === MIRROR_AXIS.HORZ_180 || mirrorAxis === MIRROR_AXIS.BOTH_360))
                mirrorMetaLines.push(<line x1={0} y1={halfy} x2="100%" y2={halfy} stroke={options.mirrorColor} key="mirror-vert"/>)
        }
        if (mirrorMethod === MIRROR_METHOD.ROTATE || mirrorMethod === MIRROR_METHOD.BOTH)
            mirrorMetaLines.push(<circle cx={halfx} cy={halfy} r={scalex/3} fill={options.mirrorColor} opacity={.8} strokeOpacity="0" key="mirror-center"/>)
    }
    return mirrorMetaLines
}

export function Eraser(){
    const {state} = useContext(StateContext)
    const {eraser, scalex, translation, scaley} = state
    const eraserSvg = eraser?.asSvg(state)
    return eraser && [
        <line
            x1={eraserSvg.x - scalex / 3 + translation.asInflated(state).x}
            y1={eraserSvg.y - scaley / 3 + translation.asInflated(state).y}
            x2={eraserSvg.x + scalex / 3 + translation.asInflated(state).x}
            y2={eraserSvg.y + scaley / 3 + translation.asInflated(state).y}
            stroke={options.eraserColor}
            strokeWidth={options.eraserWidth}
            key="eraser1"
        />,
        <line
            x1={eraserSvg.x + scalex / 3 + translation.asInflated(state).x}
            y1={eraserSvg.y - scaley / 3 + translation.asInflated(state).y}
            x2={eraserSvg.x - scalex / 3 + translation.asInflated(state).x}
            y2={eraserSvg.y + scaley / 3 + translation.asInflated(state).y}
            stroke={options.eraserColor}
            strokeWidth={options.eraserWidth}
            key="eraser2"
        />
    ]
}

export function ClipboardTransformButtons(){
    const {state} = useContext(StateContext)
    const {mobile, clipboard, debug} = state
    const boundRect = getBoundRect(state)
    if (!clipboard || !mobile || !clipboard.length || !boundRect)
        return null

    const {x, y} = getClipboardButtonsPos(state).asViewport(state)
    const buttonHeight = options.clipboardButtonHeight
    const buttonWidth = (options.clipboardButtonWidth * 4) + (options.clipboardButtonGap * 3)

    return <>
        <DebugPoint name="Clipboard Buttons Pos" point={getClipboardButtonsPos(state)}/>
        <foreignObject
            // Apparently foreignObjects don't acknowledge pointer (or possibly any) events.
            // These are "buttons", but they're actually handled manually in touchStart() above
            x={x} y={y}
            // 100 is too much, but it shouldn't matter
            width={buttonWidth} height={buttonHeight}
        >
            <div id="clipboard-transform-buttons-mobile">
                <button><RxRotateCounterClockwise /></button>
                <button> <GoMirror /> </button>
                <button><FaCheck /></button>
                {/* I can't decide between these 2 */}
                <button><FaXmark /></button>
                {/* <button><FaTrash /></button> */}
            </div>
        </foreignObject>
    </>
}

export function SelectionRect(){
    const {state} = useContext(StateContext)
    const {partials, scalex} = state
    let boundRect = getBoundRect(state)

    if (!boundRect)
        return null

    boundRect = boundRect.grow(.5)
    const {width, height, left, top} = boundRect.asViewport(state)

    return <>
        <rect
            id='selection-rect'
            width={width}
            height={height}
            x={left}
            y={top}
            // TODO: this should get moved to CSS
            stroke={options.selectionBorderColor}
            fillOpacity={options.selectionOpacity}
            fill={options.selectionColor}
            rx={partials ? scalex / 2 : 0}
            strokeWidth={.5}
        />
        <DebugPoint name="topLeft" point={boundRect.topLeft}/>
    </>
}

export function Bounds(){
    const {state} = useContext(StateContext)
    const {scalex, bounds, partials} = state
    const boundRadius = scalex / 1
    return <g id='bounds'>
        {bounds.map(bound =>
            <rect
                width={boundRadius}
                height={boundRadius}
                x={bound.asViewport(state).x - (boundRadius / 2)}
                y={bound.asViewport(state).y - (boundRadius / 2)}
                rx={partials ? 4 : 0}
                // rx={4}
                stroke={options.boundColor}
                fillOpacity={0}
                key={`bound-${bound.hash()}`}
            />
        )}
    </g>
}

export function CurrentLines(){
    const {state} = useContext(StateContext)
    const {curLinePos, cursorPos, translation, scalex, scaley} = state
    if (!curLinePos)
        return null
    const line = new Line(state, curLinePos, cursorPos)
    return <g id='cur-lines' style={{backgroundColor: "green"}} transform={`
                translate(${translation.asInflated(state).x} ${translation.asInflated(state).y})
                scale(${scalex} ${scaley})
            `}>
        {line.mirror(state).map((line, i) => line.render(state, `curLine-${i}`))}
        {/* Make the current line visible */}
        {/* {debug && curLines.map((line, i) => line.render(state, `curLine-${i}`, {stroke: `hsl(${i*360/10}, 100%, 50%)`, strokeWidth: 3/scalex}))} */}
    </g>
}

export function Lines(){
    const {state} = useContext(StateContext)
    const {lines, translation, scalex, scaley} = state
    const {x: transx, y: transy} = translation.asInflated(state)
    return <g id='lines' transform={`
            translate(${transx} ${transy})
            scale(${scalex} ${scaley})
        `}>
        {/* Make all the individual lines visible */}
        {lines.map((line, i) => line.render(state, `line-${i}`))}
        {/* Show each line as separate lines, for debugging */}
        {/* {debug && splitAllLines(lines).map((line, i) => line.render(state, `line-${i}`, {strokeWidth: 3/scalex, stroke: `hsl(${i*360/lines.length}, 100%, 50%)`}))} */}
    </g>
}

export function Clipboard(){
    const {state} = useContext(StateContext)
    const {clipboard, translation, scalex, scaley} = state
    const {x: transx, y: transy} = translation.asInflated(state)
    const {x: cursorx, y: cursory} = state.cursorPos.asSvg(state)

    if (!clipboard)
        return null

    const clipLines = getAllClipboardLines(state, false)
    return clipLines && <g id='clipboard' transform={`
            translate(${transx+cursorx} ${transy+cursory})
            scale(${scalex} ${scaley})
        `}>
        {clipLines.map((line, i) => line.render(state, `clip-${i}`, {}, false))}
    </g>
}

export function Cursor(){
    const {state} = useContext(StateContext)
    const {cursorPos, scalex, mirroring, openMenus, mirrorType, mirrorMethod, mirrorAxis, fillMode} = state
    const cursorPosViewport = cursorPos.asViewport(state)
    // Construct the cursor (internal mirror lines, etc)
    let cursor = [
        <circle
            cx={cursorPosViewport.x}
            cy={cursorPosViewport.y}
            r={scalex / 3}
            stroke={options.cursorColor}
            fill={options.mirrorColor}
            // Make it filled if we're cursor rotating
            fillOpacity={Number(
                (mirroring || openMenus.mirror) &&
                mirrorType === MIRROR_TYPE.CURSOR &&
                [MIRROR_METHOD.ROTATE, MIRROR_METHOD.BOTH].includes(mirrorMethod))
            }
            key='cursor'
        />,
    ]

    if ((mirroring || openMenus.mirror) && mirrorType === MIRROR_TYPE.CURSOR){
        if ([MIRROR_METHOD.FLIP, MIRROR_METHOD.BOTH].includes(mirrorMethod)){
            if ([MIRROR_AXIS.HORZ_180, MIRROR_AXIS.BOTH_360].includes(mirrorAxis))
                cursor.push(<line
                    x1={cursorPosViewport.x + scalex/3} y1={cursorPosViewport.y}
                    x2={cursorPosViewport.x - scalex/3} y2={cursorPosViewport.y}
                    stroke={options.mirrorColor}
                    key='cursor-horz'
                />)
            if ([MIRROR_AXIS.VERT_90, MIRROR_AXIS.BOTH_360].includes(mirrorAxis))
                cursor.push(<line
                    x1={cursorPosViewport.x} y1={cursorPosViewport.y + scalex/3}
                    x2={cursorPosViewport.x} y2={cursorPosViewport.y - scalex/3}
                    stroke={options.mirrorColor}
                    key="cursor-vert"
                />)
        }
    }

    return !fillMode && <g id="cursor-group">{cursor}</g>
}

export function Dots(){
    const {state} = useContext(StateContext)
    const {translation, scalex, scaley, rotate, hideDots} = state
    const {x: transx, y: transy} = translation.asInflated(state)
    return !hideDots && <>
        <pattern id="dots"
            // This makes it line up with everything else just a little better. I don't know why
            x={transx-1}
            y={transy-1}
            width={scalex}
            height={scaley}
            patternUnits='userSpaceOnUse'
            patternTransform={`rotate(${rotate})`}
        >
            <rect
                x={0} y={0}
                width={options.dotRadius}
                height={options.dotRadius}
                fill={options.dotColor}
            />
        </pattern>
        <rect fill="url(#dots)" stroke="black" width="100%" height="100%" />
    </>
}

export function Polygons(){
    const {state} = useContext(StateContext)
    const {filledPolys, translation, scalex, scaley} = state
    const {x: transx, y: transy} = translation.asInflated(state)
    return <g id='filled-polys' transform={`translate(${transx} ${transy}) scale(${scalex} ${scaley})`}>
        {filledPolys.map((poly, i) => poly.render(state, `filled-poly-${i}`))}
    </g>
}

export function CurrentPolys(){
    const {state} = useContext(StateContext)
    const {curPolys, translation, scalex, scaley} = state
    const {x: transx, y: transy} = translation.asInflated(state)
    return curPolys && <g id='cur-polys' transform={`translate(${transx} ${transy}) scale(${scalex} ${scaley})`}>
        {curPolys.map((poly, i) => poly.render(state, `cur-poly-${i}`))}
    </g>
}
