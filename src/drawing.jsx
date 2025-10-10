// Stuff which gets called by Paper to draw parts of the paper
import { MIRROR_AXIS, MIRROR_ROT, MIRROR_TYPE } from "./globals"
import options from "./options"
import {
  getHalf,
  getDebugBox,
  getBoundRect,
  getAllClipboardLines,
  getAllIntersections,
  getClipboardButtonsPos,
  isMobile,
  getAllCursorPoints,
} from "./utils"
import Line from "./helper/Line"
import Point from "./helper/Point"
import { useContext, useEffect } from "react"
import { StateContext } from "./Contexts"
import Snackbar from "@mui/material/Snackbar"
import { useTheme } from "@mui/material/styles"
// TODO: memoization
// import {memo, useMemo} from 'react'

import HelpPage from "./Menus/HelpPage"
import ColorMenu from "./Menus/ColorMenu"
import FilePage from "./Menus/FilePage"
import SettingsPage from "./Menus/SettingsPage"
import NavMenu from "./Menus/NavMenu"
import RepeatMenu from "./Menus/RepeatMenu"
import MirrorMenu from "./Menus/MirrorMenu"
import ExtraMenu from "./Menus/ExtraMenu"
import ClipboardMenu from "./Menus/ClipboardMenu"
import DeleteMenu from "./Menus/DeleteMenu"
import SelectMenu from "./Menus/SelectMenu"
import { MirrorAxisIcon, MirrorRotIcon } from "./Menus/MirrorIcons"
import CheckIcon from "@mui/icons-material/Check"
import ClearIcon from "@mui/icons-material/Clear"
import useMediaQuery from "@mui/material/useMediaQuery"

// For debugging
function useActiveBreakpoint() {
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.only("xs"))
  const isSm = useMediaQuery(theme.breakpoints.only("sm"))
  const isMd = useMediaQuery(theme.breakpoints.only("md"))
  const isLg = useMediaQuery(theme.breakpoints.only("lg"))
  const isXl = useMediaQuery(theme.breakpoints.only("xl"))

  if (isXl) return "xl"
  if (isLg) return "lg"
  if (isMd) return "md"
  if (isSm) return "sm"
  return "xs" // default fallback
}

var debugTextOffset = 80
const debugTextX = "75%"

// This is slightly inelegant, but it works, and it's just a debug function
// Color is the color of the text and cirlce, fill overrides the color of the circle
export function DebugPoint({
  name,
  point,
  decimals = undefined,
  yoff = 0,
  color = "black",
  r = 5,
  fill = undefined,
  inflated = false,
  omitText = false,
  omitCircle = false,
  ...props
}) {
  useEffect(() => {
    // Reset the global every render
    debugTextOffset = 80
  })
  debugTextOffset += 20
  const { state } = useContext(StateContext)
  let x, y, label
  try {
    if (point instanceof Point) {
      const { x: _x, y: _y } = point.asViewport(state)
      x = _x
      y = _y
    } else if (Array.isArray(point)) {
      x = point[0]
      y = point[1]
    } else {
      x = point.x
      y = point.y
    }

    // const {x: dispx, y: dispy} = Point.fromViewport(state, x, y, inflated).asViewport(state, inflated)
    if (inflated) label = `${name}: (${x.toFixed(decimals ?? 0)}, ${y.toFixed(decimals ?? 0)})`
    else label = `${name}: [${x.toFixed(decimals ?? 1) / state.scalex}, ${y.toFixed(decimals ?? 1) / state.scaley}]`
    // console.log(label)
  } catch (e) {
    label = `${name}: ${typeof point}: ${JSON.stringify(point)}`
  }

  return (
    state.debug && (
      <>
        {!omitText && (
          <text x={debugTextX} y={debugTextOffset} fill={color} fontWeight="bold">
            {label}
          </text>
        )}
        {!omitCircle && (
          <g key={`point-${name}`}>
            {!omitText && (
              <text x={x - label.length * 4} y={y - 10 + yoff} fill={color} fontWeight="bold">
                {label}
              </text>
            )}
            <circle cx={x} cy={y} {...props} r={r} fill={fill || color} />
          </g>
        )}
      </>
    )
  )
}

export const GlowEffect = () => {
  const theme = useTheme()

  return (
    <defs>
      {/* the "filterUnits="userSpaceOnUse" makes it so unsloped lines get rendered */}
      <filter id="glow" x="-1000%" y="-1000%" width="2000%" height="2000%" filterUnits="userSpaceOnUse">
        <feGaussianBlur in="SourceGraphic" stdDeviation=".3" result="blur" />
        <feFlood floodColor={theme.palette.primary.glow} floodOpacity="1" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )
}

export const DebugInfo = () => {
  const { state } = useContext(StateContext)
  const { debug, debugDrawPoints, translation, scalex, scaley, openMenus } = state
  const debugBox = getDebugBox(state)
  const origin = Point.fromViewport(state, translation._x, translation._y, false)
  const intersectcions = getAllIntersections(state.lines)
  const breakpoint = useActiveBreakpoint()

  return (
    debug && (
      <g>
        {/* Repeat box */}
        <text x={debugTextX} y={debugTextOffset + 20} fill="black">
          {isMobile() ? "mobile" : "desktop"}
          {" - "}
          {breakpoint}
          {" - "}
          {window.innerWidth}
          {" x "}
          {window.innerHeight}
        </text>
        {openMenus.repeat && debugBox.render(state, { stroke: "green", strokeWidth: 2, fillOpacity: 0 })}

        <DebugPoint name="Translation" point={origin} inflated={false} color="green" />
        <DebugPoint name="Scale" point={{ x: scalex, y: scaley }} omitCircle inflated />
        {!state.fillMode && <DebugPoint name="Cursor" point={state.cursorPos} yoff={40} fill="transparent" />}
        {/* <DebugPoint name="SVG Origin" point={Point.svgOrigin(state)} omit/> */}
        {debugDrawPoints &&
          Object.entries(debugDrawPoints).map(([name, spec]) => <DebugPoint key={name} name={name} {...spec} />)}
        {/* Draw intersections */}
        {intersectcions.map((point, i) => (
          <DebugPoint key={i} name={`Intersection ${i}`} point={point} decimals={0} omitText />
        ))}
        {/* Draw intersections exclusively on the current line */}
        {Line.getCurrentLine(state)
          ?.findIntersections(state.lines)
          .map((point, i) => (
            <DebugPoint key={i} name={`Intersection ${i}`} point={point} decimals={0} omitText />
          ))}
      </g>
    )
  )
}

export const MirrorMetaLines = () => {
  const { state } = useContext(StateContext)
  let mirrorMetaLines = []
  const { cursorPos, mirrorType, mirrorAxis, mirrorRot, scalex, scaley, curLinePos } = state
  const { x: cursorx, y: cursory } = cursorPos.asViewport(state)
  const { x: cursorLinex, y: cursorLiney } = curLinePos === null ? { x: null, y: null } : curLinePos.asViewport(state)
  const half = getHalf(state)
  const { x: halfx, y: halfy } = half.asViewport(state)
  const theme = useTheme()

  function MetaLines({ x, y, axis, rot, axisOpacity }) {
    let lines = []

    // Axis lines
    if (axis === MIRROR_AXIS.Y || axis === MIRROR_AXIS.BOTH)
      lines.push(
        <line
          x1={x}
          y1={0}
          x2={x}
          y2="100%"
          stroke={theme.palette.primary.mirror}
          strokeOpacity={axisOpacity}
          key={`mmoh`}
        />,
      )
    if (axis === MIRROR_AXIS.X || axis === MIRROR_AXIS.BOTH)
      lines.push(
        <line
          x1={0}
          y1={y}
          x2="100%"
          y2={y}
          stroke={theme.palette.primary.mirror}
          strokeOpacity={axisOpacity}
          key={`mmov`}
        />,
      )

    // Rotation lines
    // NOTE: this breaks in some browsers (Brave & DuckDuckGo at least)
    if (!state.disableMirrorIcons || state.debug) {
      if (rot === MIRROR_ROT.RIGHT)
        lines.push(
          <g color={theme.palette.primary.mirror} key={`mms`} transform={`translate(${x - 12} ${y - 12}) `}>
            {MirrorRotIcon(MIRROR_ROT.RIGHT)}
          </g>,
        )
      if (rot === MIRROR_ROT.STRAIGHT)
        lines.push(
          <g color={theme.palette.primary.mirror} key={`mms`} transform={`translate(${x - 12} ${y - 12}) `}>
            {MirrorRotIcon(MIRROR_ROT.STRAIGHT)}
          </g>,
        )
      if (rot === MIRROR_ROT.QUAD)
        lines.push(
          <g color={theme.palette.primary.mirror} key={`mmq`} transform={`translate(${x - 12} ${y - 12}) `}>
            {MirrorRotIcon(MIRROR_ROT.QUAD)}
          </g>,
        )
    }
    return <g key="mm">{lines}</g>
  }

  // Origin meta lines
  for (const { origin, rot, axis } of state.mirrorOrigins) {
    const { x: originx, y: originy } = origin.asViewport(state)
    // The origin circle
    mirrorMetaLines.push(
      <circle
        cx={originx}
        cy={originy}
        r={scalex / 6}
        fill={theme.palette.primary.mirror}
        opacity={0.6}
        strokeOpacity="0"
        key={`mo-${origin.hash()}`}
      />,
    )

    mirrorMetaLines.push(
      <MetaLines x={originx} y={originy} axis={axis} rot={rot} axisOpacity={0.2} key={`ml-${origin.hash()}`} />,
    )
  }

  // Page meta lines
  if (mirrorType === MIRROR_TYPE.PAGE)
    mirrorMetaLines.push(<MetaLines x={halfx} y={halfy} axis={mirrorAxis} rot={mirrorRot} key="mp" />)

  // Cursor metalines
  if (mirrorType === MIRROR_TYPE.CURSOR)
    mirrorMetaLines.push(
      <MetaLines x={cursorLinex || cursorx} y={cursorLiney || cursory} axis={mirrorAxis} rot={mirrorRot} key="mc" />,
    )

  return <g id="m">{mirrorMetaLines}</g>
}

export const Eraser = () => {
  const { state } = useContext(StateContext)
  const { eraser, scalex, translation, scaley } = state
  const eraserSvg = eraser?.asSvg(state)
  const theme = useTheme()
  return (
    eraser && [
      <line
        x1={eraserSvg.x - scalex / 3 + translation.asInflated(state).x}
        y1={eraserSvg.y - scaley / 3 + translation.asInflated(state).y}
        x2={eraserSvg.x + scalex / 3 + translation.asInflated(state).x}
        y2={eraserSvg.y + scaley / 3 + translation.asInflated(state).y}
        stroke={theme.palette.primary.eraser}
        strokeWidth={options.eraserWidth}
        key="eraser1"
      />,
      <line
        x1={eraserSvg.x + scalex / 3 + translation.asInflated(state).x}
        y1={eraserSvg.y - scaley / 3 + translation.asInflated(state).y}
        x2={eraserSvg.x - scalex / 3 + translation.asInflated(state).x}
        y2={eraserSvg.y + scaley / 3 + translation.asInflated(state).y}
        stroke={theme.palette.primary.eraser}
        strokeWidth={options.eraserWidth}
        key="eraser2"
      />,
    ]
  )
}

export const ClipboardTransformButtons = () => {
  const { state } = useContext(StateContext)
  const { mobile, clipboard, clipboardRotation, clipboardMirrorAxis } = state
  const boundRect = getBoundRect(state)
  if (!clipboard || !mobile || !clipboard.length || !boundRect) return null

  const { x, y } = getClipboardButtonsPos(state).asViewport(state)
  const buttonHeight = options.clipboardButtonHeight
  const buttonWidth = options.clipboardButtonWidth * 4 + options.clipboardButtonGap * 3
  console.log(clipboardMirrorAxis)
  const btnProps = {
    width: options.clipboardButtonWidth,
    height: options.clipboardButtonHeight,
    // gap: options.clipboardButtonGap,
  }

  return (
    <>
      <DebugPoint name="Clipboard Buttons Pos" point={getClipboardButtonsPos(state)} />
      <foreignObject
        // Apparently foreignObjects don't acknowledge pointer (or possibly any) events.
        // These are "buttons", but they're actually handled manually in touchStart() above
        // For that reason, I'm intentionally keeping them as non-MUI buttons
        x={x}
        y={y}
        width={buttonWidth}
        height={buttonHeight}
      >
        <div id="clipboard-transform-buttons-mobile">
          <button {...btnProps}>{MirrorRotIcon(clipboardRotation, true)}</button>
          <button {...btnProps}>{MirrorAxisIcon(clipboardMirrorAxis)}</button>
          {/* <button> <GoMirror /> </button> */}
          <button {...btnProps}>
            <CheckIcon />
          </button>
          {/* I can't decide between these 2 */}
          <button {...btnProps}>
            <ClearIcon />
          </button>
          {/* <button><FaTrash /></button> */}
        </div>
      </foreignObject>
    </>
  )
}

export const SelectionRect = () => {
  const { state } = useContext(StateContext)
  const { partials, scalex } = state
  let boundRect = getBoundRect(state)

  if (!boundRect) return null

  boundRect = boundRect.grow(0.5)
  const { width, height, left, top } = boundRect.asViewport(state)

  return (
    <>
      <rect
        id="selection-rect"
        width={width}
        height={height}
        x={left}
        y={top}
        // TODO: this should get moved to CSS
        stroke={options.selectionBorderColor}
        fillOpacity={options.selectionOpacity}
        fill={options.selectionColor}
        rx={partials ? scalex / 2 : 0}
        strokeWidth={0.5}
      />
      <DebugPoint name="topLeft" point={boundRect.topLeft} />
    </>
  )
}

export const Bounds = () => {
  const { state } = useContext(StateContext)
  const { scalex, bounds, partials } = state
  const boundRadius = scalex / 1
  const theme = useTheme()

  return (
    <g id="bounds">
      {bounds.map((bound) => (
        <rect
          width={boundRadius}
          height={boundRadius}
          x={bound.asViewport(state).x - boundRadius / 2}
          y={bound.asViewport(state).y - boundRadius / 2}
          rx={partials ? 4 : 0}
          // rx={4}
          stroke={theme.palette.primary.bounds}
          fillOpacity={0}
          key={`bound-${bound.hash()}`}
        />
      ))}
    </g>
  )
}

export const CurrentLines = () => {
  const { state } = useContext(StateContext)
  const { curLinePos, cursorPos, translation, scalex, scaley, mirrorOrigins } = state
  if (!curLinePos) return null

  const line = new Line(state, curLinePos, cursorPos)
  const lines = line.mirror(state)
  for (const { origin, axis, rot } of mirrorOrigins) lines.push(...line.mirrorRaw(axis, rot, origin))

  return (
    <g
      id="cur-lines"
      transform={`
                translate(${translation.asInflated(state).x} ${translation.asInflated(state).y})
                scale(${scalex} ${scaley})
            `}
    >
      {lines.map((l, i) => l.render(state, `curLine-${i}`))}
    </g>
  )
}

export const Lines = () => {
  const { state } = useContext(StateContext)
  const { lines, translation, scalex, scaley } = state
  const { x: transx, y: transy } = translation.asInflated(state)
  return (
    <g
      id="lines"
      transform={`
            translate(${transx} ${transy})
            scale(${scalex} ${scaley})
        `}
    >
      {/* Make all the individual lines visible */}
      {lines.map((line, i) => line.render(state, `line-${i}`))}
      {/* Show each line as separate lines, for debugging */}
      {/* {debug && splitAllLines(lines).map((line, i) => line.render(state, `line-${i}`, {strokeWidth: 3/scalex, stroke: `hsl(${i*360/lines.length}, 100%, 50%)`}))} */}
    </g>
  )
}

export const Clipboard = () => {
  const { state } = useContext(StateContext)
  const { clipboard, translation, scalex, scaley } = state
  const { x: transx, y: transy } = translation.asInflated(state)
  const { x: cursorx, y: cursory } = state.cursorPos.asSvg(state)

  if (!clipboard) return null

  const clipLines = getAllClipboardLines(state, false)
  return (
    clipLines && (
      <g
        id="clipboard"
        transform={`
            translate(${transx + cursorx} ${transy + cursory})
            scale(${scalex} ${scaley})
        `}
      >
        {clipLines.map((line, i) => line.render(state, `clip-${i}`, {}, false))}
      </g>
    )
  )
}

export const Cursor = () => {
  const { state } = useContext(StateContext)
  const { cursorPos, scalex, fillMode, debug } = state
  const cursorPosViewport = cursorPos.asViewport(state)
  const theme = useTheme()

  // We do our own seperately so we can control it's opacity independently
  let cursor = [
    <circle
      cx={cursorPosViewport.x}
      cy={cursorPosViewport.y}
      r={scalex / 3}
      stroke={theme.palette.primary.cursor}
      fillOpacity={0}
      key="cursor"
    />,
  ]

  let i = 0
  for (const point of getAllCursorPoints(state, false)) {
    const { x, y } = point.asViewport(state)
    cursor.push(
      <circle
        cx={x}
        cy={y}
        r={scalex / 3}
        stroke={theme.palette.primary.cursor}
        fillOpacity={0}
        // TODO: this should be in theme
        strokeOpacity={0.25}
        key={`cursor-${i}`}
      />,
    )
    i++
  }

  return (!fillMode || debug) && <g id="cursor-group">{cursor}</g>
}

export const Dots = () => {
  const { state } = useContext(StateContext)
  const { translation, scalex, scaley, rotate, hideDots, paperColor } = state
  const { x: transx, y: transy } = translation.asInflated(state)
  const theme = useTheme()

  return (
    !hideDots && (
      <>
        <pattern
          id="dots"
          // This makes it line up with everything else just a little better. I don't know why
          x={transx - 1}
          y={transy - 1}
          width={scalex}
          height={scaley}
          patternUnits="userSpaceOnUse"
          patternTransform={`rotate(${rotate})`}
        >
          <rect x={0} y={0} width={options.dotRadius} height={options.dotRadius} fill={theme.palette.primary.dots} />
        </pattern>
        <rect fill="url(#dots)" stroke="black" width="100%" height="100%" />
      </>
    )
  )
}

export const Polygons = () => {
  const { state } = useContext(StateContext)
  const { filledPolys, translation, scalex, scaley } = state
  const { x: transx, y: transy } = translation.asInflated(state)
  return (
    <g id="filled-polys" transform={`translate(${transx} ${transy}) scale(${scalex} ${scaley})`}>
      {filledPolys.map((poly, i) => poly.render(state, `filled-poly-${i}`))}
    </g>
  )
}

export const CurrentPolys = () => {
  const { state } = useContext(StateContext)
  const { curPolys, translation, scalex, scaley } = state
  const { x: transx, y: transy } = translation.asInflated(state)
  return (
    curPolys && (
      <g id="cur-polys" transform={`translate(${transx} ${transy}) scale(${scalex} ${scaley})`}>
        {curPolys.map((poly, i) => poly.render(state, `cur-poly-${i}`))}
      </g>
    )
  )
}

export const Menus = () => {
  const { state } = useContext(StateContext)
  const { openMenus } = state

  return (
    <>
      {/* Menus */}
      {openMenus.select && <SelectMenu menu="select" />}
      {openMenus.clipboard && <ClipboardMenu menu="clipboard" />}
      {openMenus.delete && <DeleteMenu menu="delete" />}
      {openMenus.mirror && <MirrorMenu menu="mirror" />}
      {openMenus.color && <ColorMenu menu="color" />}
      {openMenus.extra && <ExtraMenu menu="extra" />}

      {/* Pages */}
      {openMenus.navigation && <NavMenu />}
      {openMenus.repeat && <RepeatMenu />}
      {openMenus.file && <FilePage />}
      {openMenus.settings && <SettingsPage />}
      {openMenus.help && <HelpPage />}
    </>
  )
}

export const Toast = () => {
  const { state, dispatch } = useContext(StateContext)

  return (
    <Snackbar
      open={Boolean(state.toast)}
      autoHideDuration={options.toastDuration}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      onClose={() => {
        dispatch({ toast: null })
      }}
      message={state.toast}
    />
  )
}

// Trellis is in it's own file
