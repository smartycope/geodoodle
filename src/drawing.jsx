// Stuff which gets called by Paper to draw parts of the paper
import { MIRROR_AXIS, MIRROR_ROT, MIRROR_TYPE } from "./globals"
import { getAllCursorPoints } from "./utils/misc"
import { viewportHeight, viewportWidth } from "./globals"
import options from "./options"
import { getHalf, isMobile } from "./utils/misc"
import { getBoundRect, getAllClipboardLines } from "./utils/lines"
import { getClipboardButtonStrip, getSelectionButtonStrip } from "./utils/canvasButton"
import Line from "./helper/Line"
import Point from "./helper/Point"
import { useContext, useEffect, useMemo } from "react"
import { StateContext } from "./Contexts"
import Snackbar from "@mui/material/Snackbar"
import { useTheme } from "@mui/material/styles"
// TODO: memoization
// import {memo, useMemo} from 'react'

import HelpPage from "./menus/HelpPage"
import ColorMenu from "./menus/ColorMenu"
import FilePage from "./menus/FilePage"
import SettingsPage from "./menus/SettingsPage"
import KeybindingsPage from "./menus/KeybindingsPage"
import NavMenu from "./menus/NavMenu"
import RepeatMenu from "./menus/RepeatMenu"
import MirrorMenu from "./menus/MirrorMenu"
import ExtraMenu from "./menus/ExtraMenu"
import ClipboardMenu from "./menus/ClipboardMenu"
import DeleteMenu from "./menus/DeleteMenu"
import SelectMenu from "./menus/SelectMenu"
import LayersPanel from "./menus/LayersPanel"

const EMPTY_ARRAY = Object.freeze([])
import { MirrorAxisIcon, MirrorRotIcon } from "./components/CustomIcons"
import CheckIcon from "@mui/icons-material/Check"
import ClearIcon from "@mui/icons-material/Clear"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import ContentCutIcon from "@mui/icons-material/ContentCut"
import RuleIcon from "@mui/icons-material/Rule"
import useMediaQuery from "@mui/material/useMediaQuery"
import { themeDefaults } from "./styling/theme"
import {
  createViewportLineCuller,
  getCanvasRotationTransform,
  getCanvasTransform,
  rotateCoordinates,
} from "./utils/transform"
import useViewportSize from "./useViewportSize"
import { getRenderedBoundRect, getRenderedBounds } from "./utils/trellisSelection"
import Trellis from "./Trellis"
import { getLayerState } from "./utils/layers"
import { MAX_TRELLIS_CANDIDATES, MAX_TRELLIS_GROUPS, trellisOwnsSource } from "./utils/trellis"
import { getAllIntersections } from "./utils/math"

// For debugging
function useActiveBreakpoint() {
  const theme = useTheme()
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

export function BackgroundImage() {
  const { state } = useContext(StateContext)
  if (!state.backgroundImage) return null

  return (
    <image
      id="background-image"
      href={state.backgroundImage}
      x="0"
      y="0"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
    />
  )
}

// This is slightly inelegant, but it works, and it's just a debug function
// Color is the color of the text and circle, fill overrides the color of the circle
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

const GlowFilter = ({ id, color }) => (
  // The userSpaceOnUse filter units make unsloped lines render correctly.
  <filter id={id} x="-100%" y="-100%" width="200%" height="200%" filterUnits="userSpaceOnUse">
    <feGaussianBlur in="SourceGraphic" stdDeviation=".2" result="blur" />
    <feFlood floodColor={color} floodOpacity="1" result="color" />
    <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
    <feMerge>
      <feMergeNode in="coloredBlur" />
      <feMergeNode in="coloredBlur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
)

export const GlowEffect = () => {
  const theme = useTheme()
  const { state } = useContext(StateContext)
  const deletingSelectionTheme = (theme.geodoodle ?? themeDefaults).deletingSelection
  const glowColor = theme.palette.primary.glow ?? themeDefaults.glowColor.light

  // Defining a filter is cheap; browsers only rasterize it when a line references it.
  if (!state.useFancyGlow) return null
  return (
    <defs>
      <GlowFilter id="glow" color={glowColor} />
      {state.deletingSelection && <GlowFilter id="deleting-glow" color={deletingSelectionTheme.glowColor} />}
    </defs>
  )
}

export const DebugInfo = () => {
  const { state } = useContext(StateContext)
  const breakpoint = useActiveBreakpoint()

  if (!state.debug) return null

  const { debugDrawPoints, translation, scalex, scaley } = state
  const origin = Point.fromViewport(state, translation._x, translation._y, false)
  const intersectcions = getAllIntersections(state.lines)

  return (
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
}

export const MirrorMetaLines = () => {
  const { state } = useContext(StateContext)
  let mirrorMetaLines = []
  const { cursorPos, mirrorType, mirrorAxis, mirrorRot, scalex, curLinePos, rotate } = state
  const { x: cursorx, y: cursory } = cursorPos.asViewport(state)
  const { x: cursorLinex, y: cursorLiney } = curLinePos === null ? { x: null, y: null } : curLinePos.asViewport(state)
  const half = getHalf(state)
  const { x: halfx, y: halfy } = half.asViewport(state)
  const theme = useTheme()

  function MetaLines({ x, y, axis, rot, axisOpacity }) {
    let lines = []
    const length = Math.hypot(viewportWidth(), viewportHeight())

    // Axis lines
    if (axis === MIRROR_AXIS.Y || axis === MIRROR_AXIS.BOTH) {
      const direction = rotateCoordinates(0, 1, rotate)
      lines.push(
        <line
          x1={x - direction.x * length}
          y1={y - direction.y * length}
          x2={x + direction.x * length}
          y2={y + direction.y * length}
          stroke={theme.palette.primary.mirror}
          strokeOpacity={axisOpacity}
          key={`mmoh`}
        />,
      )
    }
    if (axis === MIRROR_AXIS.X || axis === MIRROR_AXIS.BOTH) {
      const direction = rotateCoordinates(1, 0, rotate)
      lines.push(
        <line
          x1={x - direction.x * length}
          y1={y - direction.y * length}
          x2={x + direction.x * length}
          y2={y + direction.y * length}
          stroke={theme.palette.primary.mirror}
          strokeOpacity={axisOpacity}
          key={`mmov`}
        />,
      )
    }

    // Rotation lines
    // TODO: this icon should scale with the current scale -- should it?
    if (rot === MIRROR_ROT.RIGHT)
      lines.push(
        <g color={theme.palette.primary.mirror} key={`mms`} transform={`translate(${x - 12} ${y - 12})`}>
          {MirrorRotIcon(MIRROR_ROT.RIGHT, false, 1, false)}
        </g>,
      )
    if (rot === MIRROR_ROT.STRAIGHT)
      lines.push(
        <g color={theme.palette.primary.mirror} key={`mms`} transform={`translate(${x - 12} ${y - 12})`}>
          {MirrorRotIcon(MIRROR_ROT.STRAIGHT, false, 1, false)}
        </g>,
      )
    if (rot === MIRROR_ROT.QUAD)
      lines.push(
        <g color={theme.palette.primary.mirror} key={`mmq`} transform={`translate(${x - 12} ${y - 12})`}>
          {MirrorRotIcon(MIRROR_ROT.QUAD, false, 1, false)}
        </g>,
      )
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

function CanvasButtonStrip({ state, strip, icons }) {
  const theme = useTheme()
  if (!strip) return null

  const { x, y } = strip.position.asViewport(state)
  const { width: buttonWidth, height: buttonHeight, gap: buttonGap } = (theme.geodoodle ?? themeDefaults).canvasButtons
  const stripWidth = buttonWidth * strip.buttons.length + buttonGap * (strip.buttons.length - 1)

  return (
    <>
      <DebugPoint name={`${strip.id} position`} point={strip.position} />
      <foreignObject
        // Apparently foreignObjects don't acknowledge pointer (or possibly any) events.
        // These are "buttons", but their actions are handled manually in events.jsx.
        // For that reason, I'm intentionally keeping them as non-MUI buttons
        x={x}
        y={y}
        width={stripWidth}
        height={buttonHeight}
      >
        <div
          id={strip.id}
          className="canvas-option-buttons"
          style={{ display: "flex", gap: buttonGap, pointerEvents: "all" }}
        >
          {strip.buttons.map(({ action, label }, index) => (
            <button
              key={action}
              type="button"
              aria-label={label}
              title={label}
              tabIndex={-1}
              style={{ width: buttonWidth, height: buttonHeight, flex: `0 0 ${buttonWidth}px`, margin: 0 }}
            >
              {icons[index]}
            </button>
          ))}
        </div>
      </foreignObject>
    </>
  )
}

export const ClipboardTransformButtons = () => {
  const { state } = useContext(StateContext)
  const strip = getClipboardButtonStrip(state)
  const icons = [
    MirrorRotIcon(state.clipboardRotation, true),
    MirrorAxisIcon(state.clipboardMirrorAxis),
    <CheckIcon key="paste" />,
    <ClearIcon key="cancel" />,
  ]
  return <CanvasButtonStrip state={state} strip={strip} icons={icons} />
}

export const SelectionOptionButtons = () => {
  const { state } = useContext(StateContext)
  const strip = getSelectionButtonStrip(state)
  const icons = [
    <ContentCopyIcon key="copy" />,
    <ContentCutIcon key="cut" />,
    // <CancelPresentationTwoToneIcon key="delete-selected" />,
    // <CancelPresentationIcon key="delete-unselected" />,
    // I don't *love* the rule icon, but it's the best I could find for toggle partials
    <RuleIcon key="toggle-partials" />,
    <ClearIcon key="clear-bounds" />,
  ]
  return <CanvasButtonStrip state={state} strip={strip} icons={icons} />
}

export const SelectionRect = () => {
  const { state } = useContext(StateContext)
  const { deletingSelection, partials } = state
  const theme = useTheme()
  const geodoodleTheme = theme.geodoodle ?? themeDefaults
  const selectionTheme = deletingSelection ? geodoodleTheme.deletingSelection : geodoodleTheme.selection
  let boundRect = getRenderedBoundRect(state)

  if (!boundRect) return null

  boundRect = boundRect.grow(0.5)
  const { width, height, left, top } = boundRect.asSvg(state, false)

  return (
    <>
      <g transform={getCanvasTransform(state)}>
        <rect
          id="selection-rect"
          width={width}
          height={height}
          x={left}
          y={top}
          stroke={selectionTheme.borderColor}
          fillOpacity={selectionTheme.opacity}
          fill={selectionTheme.color}
          rx={partials ? 0.5 : 0}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <DebugPoint name="topLeft" point={boundRect.topLeft} />
    </>
  )
}

export const Bounds = () => {
  const { state } = useContext(StateContext)
  const { scalex, bounds, deletingSelection, partials } = state
  const radius = scalex / 1
  const theme = useTheme()
  const deletingSelectionTheme = (theme.geodoodle ?? themeDefaults).deletingSelection
  const renderedBounds = getRenderedBounds(state)

  return (
    <g id="bounds">
      {renderedBounds.map((bound, index) => (
        <rect
          width={radius}
          height={radius}
          x={bound.asViewport(state).x - radius / 2}
          y={bound.asViewport(state).y - radius / 2}
          rx={partials ? 4 : 0}
          // rx={4}
          stroke={deletingSelection ? deletingSelectionTheme.borderColor : theme.palette.primary.bounds}
          fillOpacity={0}
          key={`bound-${bounds[index].hash()}`}
        />
      ))}
    </g>
  )
}

export const SpecificSelectors = () => {
  const { state } = useContext(StateContext)
  const { scalex, specificSelectors } = state
  const radius = scalex / 2
  const theme = useTheme()

  return (
    <g id="specificSelectors">
      {specificSelectors.map((selector) => (
        <rect
          width={radius}
          height={radius}
          x={selector.asViewport(state).x - radius / 2}
          y={selector.asViewport(state).y - radius / 2}
          rx={0}
          stroke={theme.palette.primary.specificSelectors}
          fillOpacity={0}
          key={`specific-${selector.hash()}`}
        />
      ))}
    </g>
  )
}

export const GenericSelectors = () => {
  const { state } = useContext(StateContext)
  const { scalex, genericSelectors } = state
  const radius = scalex / 2
  const theme = useTheme()

  return (
    <g id="genericSelectors">
      {genericSelectors.map((selector) => (
        <rect
          width={radius}
          height={radius}
          x={selector.asViewport(state).x - radius / 2}
          y={selector.asViewport(state).y - radius / 2}
          rx={4}
          stroke={theme.palette.primary.genericSelectors}
          fillOpacity={0}
          key={`generic-${selector.hash()}`}
        />
      ))}
    </g>
  )
}

export const CurrentLines = () => {
  const { state } = useContext(StateContext)
  const { curLinePos, cursorPos } = state
  if (!curLinePos) return null

  const line = new Line(state, curLinePos, cursorPos)
  const lines = line.mirror(state)

  return (
    <g id="cur-lines" transform={getCanvasTransform(state)}>
      {lines.map((l, i) => l.render(state, `curLine-${i}`))}
    </g>
  )
}

export const Lines = ({
  layerState,
  id = "lines",
  transformed = true,
  interactive = true,
  selectionOverlayOnly = false,
  suppressedIndices = [],
} = {}) => {
  const { state: contextState } = useContext(StateContext)
  const state = layerState ?? contextState
  const theme = useTheme()
  const viewportSize = useViewportSize()
  const {
    lines,
    scalex,
    scaley,
    translation,
    rotate,
    bounds: storedBounds,
    boundDragging,
    useFancyGlow,
    cursorPos,
    partials,
    genericSelectors: storedGenericSelectors,
    specificSelectors: storedSpecificSelectors,
    deletingSelection: storedDeletingSelection,
    trellis,
    openMenus,
  } = state
  const bounds = interactive ? storedBounds : EMPTY_ARRAY
  const genericSelectors = interactive ? storedGenericSelectors : EMPTY_ARRAY
  const specificSelectors = interactive ? storedSpecificSelectors : EMPTY_ARRAY
  const deletingSelection = interactive && storedDeletingSelection
  const { glowWidth, glowOpacity } = theme.geodoodle ?? themeDefaults
  const deletingSelectionTheme = (theme.geodoodle ?? themeDefaults).deletingSelection
  const glowColor = theme.palette.primary.glow ?? themeDefaults.glowColor.light
  const deletingGlowColor = deletingSelectionTheme.glowColor
  // The cursor only affects permanent-line selection while a bound is being
  // dragged. In every other mode, moving it should not rebuild every SVG line.
  const activeBoundCursor = boundDragging && bounds.length === 1 ? cursorPos : null
  const { selectionUnderlays, renderedLines } = useMemo(() => {
    const isLineInViewport = createViewportLineCuller(
      { scalex, scaley, translation, rotate },
      viewportSize.width,
      viewportSize.height,
    )
    const hasPossibleHighlights = bounds.length > 0 || genericSelectors.length > 0 || specificSelectors.length > 0
    // The manual underlay extends glowWidth/2 beyond the ordinary stroke. A
    // Gaussian blur is effectively contained within three standard deviations
    // (3 * .2 canvas units). Apply the larger allowance to every candidate so
    // highlighted strokes never pop at a viewport edge.
    const glowPadding = hasPossibleHighlights ? Math.max(glowWidth / 2, useFancyGlow ? 0.6 : 0) : 0
    const strokeScale = Math.max(Math.abs(scalex), Math.abs(scaley))
    const visibleLineIndices = []
    const suppressed = new Set(suppressedIndices)
    for (let i = 0; i < lines.length; i++) {
      if (suppressed.has(i)) continue
      const strokePadding = Math.max(0, Number(lines[i].aes.width) || 0) / 2
      const viewportPadding = (strokePadding + glowPadding) * strokeScale + 1
      if (isLineInViewport(lines[i], viewportPadding)) visibleLineIndices.push(i)
    }

    const renderState = {
      lines,
      bounds,
      scalex,
      cursorPos: activeBoundCursor,
      scaley,
      genericSelectors,
      specificSelectors,
      boundDragging,
      activeBoundCursor,
      partials,
      useFancyGlow,
    }
    const boundRect = bounds?.length > 0 ? getBoundRect(renderState) : null
    const trellisState = { trellis, openMenus: { repeat: openMenus.repeat }, bounds }
    let renderedLineIndices =
      typeof trellis === "boolean" && trellisOwnsSource(trellisState, boundRect)
        ? visibleLineIndices.filter((lineIndex) => !lines[lineIndex].isSelected(renderState, boundRect))
        : visibleLineIndices
    const deletingAreaState = deletingSelection ? { ...renderState, genericSelectors: [], specificSelectors: [] } : null
    const deletingBoundRect = deletingAreaState ? getBoundRect(deletingAreaState) : null
    const selectorState = deletingSelection
      ? { ...renderState, bounds: [], boundDragging: false, cursorPos: null, activeBoundCursor: null }
      : null
    let highlightTypes = renderedLineIndices.map((i) => {
      const line = lines[i]
      if (!deletingSelection) return line.isSelected(renderState, boundRect) ? "selected" : null
      if (line.isSelected(deletingAreaState, deletingBoundRect)) return "deleting"
      return line.isSelected(selectorState, null) ? "selected" : null
    })
    if (selectionOverlayOnly) {
      renderedLineIndices = renderedLineIndices.filter((_, index) => Boolean(highlightTypes[index]))
      highlightTypes = highlightTypes.filter(Boolean)
    }
    const fancyGlow = useFancyGlow && highlightTypes.filter(Boolean).length <= options.maxFancyGlowingLines

    if (fancyGlow)
      return {
        selectionUnderlays: [],
        renderedLines: renderedLineIndices.map((lineIndex, i) =>
          lines[lineIndex].render(
            renderState,
            `${id}-line-${lineIndex}`,
            {
              filter: highlightTypes[i]
                ? `url(#${highlightTypes[i] === "deleting" ? "deleting-glow" : "glow"})`
                : undefined,
            },
            false,
            boundRect,
          ),
        ),
      }

    const selectionUnderlays = []
    const renderedLines = []
    let tooManySelectedLines = false

    renderedLineIndices.forEach((lineIndex, i) => {
      const line = lines[lineIndex]
      if (!tooManySelectedLines && highlightTypes[i]) {
        const reachedHighlightLimit = selectionUnderlays.length >= options.maxGlowingLines
        if (reachedHighlightLimit) {
          selectionUnderlays.length = 0
          tooManySelectedLines = true
        } else
          selectionUnderlays.push(
            line.render(
              renderState,
              `${id}-selected-line-${lineIndex}`,
              {
                stroke: highlightTypes[i] === "deleting" ? deletingGlowColor : glowColor,
                strokeWidth: line.aes.width + glowWidth,
                strokeOpacity: glowOpacity,
                strokeLinecap: "round",
                strokeLinejoin: "round",
              },
              false,
            ),
          )
      }
      renderedLines.push(line.render(renderState, `${id}-line-${lineIndex}`, {}, false))
    })

    return { selectionUnderlays, renderedLines }
  }, [
    lines,
    scalex,
    scaley,
    translation,
    rotate,
    viewportSize.width,
    viewportSize.height,
    bounds,
    boundDragging,
    activeBoundCursor,
    partials,
    genericSelectors,
    specificSelectors,
    deletingSelection,
    glowColor,
    deletingGlowColor,
    glowWidth,
    glowOpacity,
    useFancyGlow,
    trellis,
    openMenus.repeat,
    suppressedIndices,
    selectionOverlayOnly,
    id,
  ])

  return (
    <g id={id} transform={transformed ? getCanvasTransform(state) : undefined}>
      {selectionUnderlays.length > 0 && (
        <g id="selected-line-highlights" pointerEvents="none">
          {selectionUnderlays}
        </g>
      )}
      {/* Make all the individual lines visible */}
      {renderedLines}
      {/* Show each line as separate lines, for debugging */}
      {/* {debug && splitAllLines(lines).map((line, i) => line.render(state, `line-${i}`, {strokeWidth: 3/scalex, stroke: `hsl(${i*360/lines.length}, 100%, 50%)`}))} */}
    </g>
  )
}

export const Clipboard = () => {
  const { state } = useContext(StateContext)
  const { clipboard } = state

  if (!clipboard) return null

  const clipLines = getAllClipboardLines(state)
  return (
    clipLines && (
      <g id="clipboard" transform={getCanvasTransform(state)}>
        {clipLines.map((line, i) => line.render(state, `clip-${i}`, {}, false))}
      </g>
    )
  )
}

export const Cursor = () => {
  const { state } = useContext(StateContext)
  const { cursor, cursorPos, scalex, fillMode } = state
  const theme = useTheme()
  if (fillMode) return null

  const cursorPosViewport = cursorPos.asViewport(state)

  function getCursor(x, y, key, props = {}) {
    const r = scalex / 3
    switch (cursor) {
      case "circle":
        return <circle key={key} cx={x} cy={y} r={r} stroke={theme.palette.primary.cursor} fillOpacity={0} {...props} />
      case "crosshair":
        return (
          <g key={key}>
            <line x1={x} y1={y - r} x2={x} y2={y + r} stroke={theme.palette.primary.cursor} {...props} />
            <line x1={x + r} y1={y} x2={x - r} y2={y} stroke={theme.palette.primary.cursor} {...props} />
          </g>
        )
      case "x":
        return (
          <g key={key}>
            <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} stroke={theme.palette.primary.cursor} {...props} />
            <line x1={x - r} y1={y + r} x2={x + r} y2={y - r} stroke={theme.palette.primary.cursor} {...props} />
          </g>
        )
    }
  }

  // We do our own seperately so we can control it's opacity independently
  let cursors = [getCursor(cursorPosViewport.x, cursorPosViewport.y, "cursor-main")]

  let i = 0
  for (const point of getAllCursorPoints(state, false)) {
    const { x, y } = point.asViewport(state)
    cursors.push(getCursor(x, y, `cursor-${i}`, { strokeOpacity: 0.25 }))
    i++
  }

  return <g id="cursor-group">{cursors}</g>
}

export const Dots = () => {
  const { state } = useContext(StateContext)
  const { translation, scalex, scaley, hideDots } = state
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
          patternTransform={getCanvasRotationTransform(state)}
        >
          <rect
            x={0}
            y={0}
            width={(theme.geodoodle ?? themeDefaults).dots.size}
            height={(theme.geodoodle ?? themeDefaults).dots.size}
            fill={theme.palette.primary.dots}
          />
        </pattern>
        <rect fill="url(#dots)" stroke="black" width="100%" height="100%" />
      </>
    )
  )
}

export const Polygons = ({ layerState, id = "filled-polys", transformed = true, suppressedIndices = [] } = {}) => {
  const { state: contextState } = useContext(StateContext)
  const state = layerState ?? contextState
  const { filledPolys, fill, colorProfile, bounds, partials, trellis, openMenus } = state
  const renderedPolys = useMemo(() => {
    const trellisState = { trellis, openMenus: { repeat: openMenus.repeat }, bounds }
    const boundRect = bounds.length > 1 ? getBoundRect(trellisState) : null
    const legacyPolys =
      typeof trellis === "boolean" && trellisOwnsSource(trellisState, boundRect)
        ? filledPolys.filter((poly) => !poly.isSelected({ partials }, boundRect))
        : filledPolys
    const suppressed = new Set(suppressedIndices)
    return legacyPolys
      .filter((_, index) => !suppressed.has(index))
      .map((poly, i) => poly.render({ fill, colorProfile }, `${id}-poly-${i}`))
  }, [filledPolys, fill, colorProfile, bounds, partials, trellis, openMenus.repeat, suppressedIndices, id])

  return (
    <g id={id} transform={transformed ? getCanvasTransform(state) : undefined}>
      {renderedPolys}
    </g>
  )
}

export const ArtworkLayers = () => {
  const { state } = useContext(StateContext)
  const visibleLayers = state.layers.filter((layer) => layer.visible)
  const visibleTrellises = visibleLayers.filter(
    (layer) => (layer.id === state.activeLayerId && state.trellisDraft?.trellis) || layer.trellis,
  ).length
  const maxGroups = Math.max(1, Math.floor(MAX_TRELLIS_GROUPS / Math.max(1, visibleTrellises)))
  const maxCandidates = Math.max(1, Math.floor(MAX_TRELLIS_CANDIDATES / Math.max(1, visibleTrellises)))

  return visibleLayers.map((layer) => {
    const active = layer.id === state.activeLayerId
    const layerState = getLayerState(state, layer)
    const draft = active ? state.trellisDraft : null
    const trellis = draft?.trellis ?? layer.trellis
    const suppressDraftSource = draft && ["create", "replace"].includes(draft.mode)
    const suffix = active ? "" : `-${layer.id}`

    return (
      <g key={layer.id} id={`artwork-${layer.id}`} data-layer-id={layer.id} transform={getCanvasTransform(state)}>
        {trellis && (
          <Trellis
            trellis={trellis}
            layerState={layerState}
            id={`trellis${suffix}`}
            transformed={false}
            maxGroups={maxGroups}
            maxCandidates={maxCandidates}
          />
        )}
        <Polygons
          layerState={layerState}
          id={`filled-polys${suffix}`}
          transformed={false}
          suppressedIndices={suppressDraftSource ? draft.sourcePolyIndexes : []}
        />
        <Lines
          layerState={layerState}
          id={`lines${suffix}`}
          transformed={false}
          interactive={false}
          suppressedIndices={suppressDraftSource ? draft.sourceLineIndexes : []}
        />
      </g>
    )
  })
}

export const ActiveSelectionLines = () => {
  const { state } = useContext(StateContext)
  const draft = state.trellisDraft
  const suppressedIndices = draft && ["create", "replace"].includes(draft.mode) ? draft.sourceLineIndexes : EMPTY_ARRAY
  return <Lines id="active-selection-lines" selectionOverlayOnly suppressedIndices={suppressedIndices} />
}

export const CurrentPolys = () => {
  const { state } = useContext(StateContext)
  const { curPolys } = state
  return (
    curPolys && (
      <g id="cur-polys" transform={getCanvasTransform(state)}>
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
      {openMenus.layers && <LayersPanel />}

      {/* Pages */}
      {openMenus.navigation && <NavMenu />}
      {openMenus.repeat && <RepeatMenu />}
      {openMenus.file && <FilePage />}
      {openMenus.settings && <SettingsPage />}
      {openMenus.key && <KeybindingsPage />}
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
