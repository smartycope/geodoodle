import options, { defaultKeybindings } from "./options"
import { START_DEBUGGING, MIRROR_AXIS, MIRROR_TYPE, MIRROR_ROT } from "./globals"
import Point from "./classes/Point"
import { viewportHeight, viewportWidth } from "./globals"
import Line from "./classes/Line"
import { isMobile as getIsMobile } from "./utils/misc"
import Dist from "./classes/Dist"
import { generateName } from "./utils/files"
import { themeDefaults } from "./styling/theme"
import { getActiveLayer, updateActiveLayer } from "./utils/layers"
import DrawingLayer from "./classes/DrawingLayer"

// NOTE: when adding to state, go through options.jsx and add them to reversible, preservable, and saveable, if applicable

const initialLayer = DrawingLayer.createFromIndex(1)
export default function getInitialState() {
  const isMobile = getIsMobile()
  const state = {
    mobile: isMobile,
    // 0 indexed
    colorProfile: 0,
    // A list of hex color string
    stroke: Array(options.commonColorAmt).fill(options.stroke),
    // Coords: Dist, deflated
    strokeWidth: Array(options.commonColorAmt).fill(0.05),
    // A list of hex color strings that gets shifted
    // commonColors: Array(options.commonColorAmt).fill(options.stroke),
    // "a series of comma and/or whitespace separated numbers"
    // The numbers are scaled
    dash: Array(options.commonColorAmt).fill("0"),
    lineCap: options.lineCap,
    lineJoin: options.lineJoin,

    // The index of the currently selected color to fill polygons in with
    // 0 indexed
    // currentFillColorProfileIndex: 0,
    // A list of hex color string
    fill: Array(options.commonColorAmt).fill(options.fill),

    fillMode: false,
    // Constructed when we transition into fillMode, null otherwise. Returns to null after we exit fillMode.
    // A list of Poly objects.
    tempPolys: null,
    // The polygons that the mouse is over currently (as a list, because there might be multiple due to mirroring)
    // A list of Poly objects
    curPolys: [],
    // Durable drawing content lives in ordered layers. The active layer is
    // projected into the state view used by geometry/actions at the boundary.
    layers: [initialLayer],
    activeLayerId: initialLayer.id,

    filename: generateName(options.defaultToMemorableNames),
    username: "",
    // The side of page we have the menu bound to: left, right, top, or bottom
    side: viewportWidth() < viewportHeight() ? "top" : "right",

    // The position of the circle we're drawing to act as a cursor in our application, NOT the actual mouse position
    cursorPos: Point.svgOrigin(),
    // The *actual* mouse location. This is only tracked because fillMode uses it to calculate the preview polygons
    // (otherwise, we couldn't fill say, a 1x1 square)
    // IT SHOULD BE USED CAREFULLY. It's currently only used during fill mode. Everything else should use cursorPos.
    mousePos: Point.svgOrigin(),
    // The starting point of the current line, or null
    curLinePos: null,
    // Whether we're currently dragging the selection rect. If we are, we count the cursorPos as a bound
    boundDragging: false,
    // The snapped origin of an active middle-button erase gesture, or null.
    middleDragStart: null,
    // True while an incomplete area selection will delete its bounded lines when completed.
    deletingSelection: false,
    // A list of Line objects, or null
    clipboard: null,
    // In degrees
    clipboardRotation: MIRROR_ROT.NONE,
    // Of type MIRROR_AXIS
    clipboardMirrorAxis: MIRROR_AXIS.NONE,
    // We need to get the center of the clipboard when we copy, not dynamically from the selection, so if it changes
    // or the selection gets deleted, we can still transform it
    clipboardOffset: null,

    hideDots: false,

    mirrorAxis: MIRROR_AXIS.NONE,
    mirrorRot: MIRROR_ROT.NONE,
    mirrorType: MIRROR_TYPE.CURSOR,
    // Transformations
    translation: Dist.zero(),
    // The scale to go back to after we reset
    defaultScalex: isMobile ? 30 : 20,
    defaultScaley: isMobile ? 30 : 20,
    // The current scale
    scalex: isMobile ? 30 : 20,
    scaley: isMobile ? 30 : 20,
    // In degrees
    rotate: 0,
    // TODO: Look into this eventually
    // shearx: 0,
    // sheary: 0,

    // Options
    removeSelectionAfterDelete: options.removeSelectionAfterDelete,
    removeSelectionAfterCopy: options.removeSelectionAfterCopy,
    partials: options.partials,
    invertedScroll: options.invertedScroll,
    rotateClipboardOnScroll: options.rotateClipboardOnScroll,
    scrollSensitivity: options.scrollSensitivity,
    gestureTranslateSensitivity: 1,
    // 1 tracks the change in distance between two fingers exactly
    gestureScaleSensitivity: 1,
    smoothGestureScale: false,
    dotsAboveArtwork: false,
    // One of options.extraButtons
    extraButton: "home",
    hideHexColor: options.hideHexColor,
    useHSVColorPicker: options.useHSVColorPicker,
    maxUndoAmt: options.maxUndoAmt,
    enableGestureScale: options.enableGestureScale,
    inTour: false,
    defaultToMemorableNames: options.defaultToMemorableNames,
    allowSnapToIntersections: options.allowSnapToIntersections,
    toolbarOpacity: options.toolbarOpacity,
    disableSelectionCanvasButtons: options.disableSelectionCanvasButtons,
    loopCursorAtEdges: options.loopCursorAtEdges,
    reopenMenusWithToolbar: options.reopenMenusWithToolbar,
    allowCanvasRotation: options.allowCanvasRotation,
    useFancyGlow: options.useFancyGlow,
    keybindings: Object.fromEntries(
      Object.entries(defaultKeybindings).map(([shortcut, action]) => [shortcut, { ...action }]),
    ),

    cursor: options.cursor,

    // true if the current pattern has unsaved edits
    // TODO: I don't think this is implemented yet
    saved: false,

    // Set to true if we need to arbitrarily reload the state immediately after the next render
    // It doesn't do anything, just triggers another reducer call
    reloadRequired: false,

    // 'system', 'light' or 'dark'.
    // This is mostly here to allow the theme to be set from the settings page
    // Use theme.palette.mode from useTheme() instead for most things
    themeMode: "system",
    debug: START_DEBUGGING,
    /* debugDrawPoints looks like this:
        {
            "Point 1 name": {
                "point": Point,
            },
            "Point 2 name": {
                "point": Point,
                "color"?: "green",
                "fill"?: "red",
                "textOnly"?: false,
                "yoff"?: 10,
                "inflated"?: true,
                "decimals"?: 1,
                "r"?: 5
                ...additional props are passed to the circle
            },
        }
        */
    debugDrawPoints: {},

    paperColor: themeDefaults.paperColor,
    // Data URLs are kept for the current session only; large images should not be stored in localStorage.
    backgroundImage: null,
    doubleTapTimeMS: options.doubleTapTimeMS,
    holdTapTimeMS: options.holdTapTimeMS,
    holdTapAction: options.holdTapAction,

    // Set to a string to show a toast. It will hide itself after options.toastDuration ms
    toast: null,

    // Menus to reopen when the toolbar is brought back after being hidden.
    toolbarHiddenMenus: [],
    openMenus: {
      // TODO: rename this toolbar eventually
      main: true, // Toolbar
      controls: true,
      color: false,
      navigation: false,
      layers: false,
      file: false,
      settings: false,
      help: false,
      mirror: false,
      key: false,
      extra: false,
      select: false,
      clipboard: false,
      delete: false,
      flip: false,
      rotate: false,
      offset: false,
      skip: false,
    },
  }

  if (START_DEBUGGING) return { ...state, ...debugState(state) }
  else return state
}

function debugState(state) {
  const debug_aes = {
    stroke: "black",
    width: 0.05,
    dash: "0",
    lineCap: "butt",
    lineJoin: "miter",
  }

  const layerPatch = {
    lines: [
      new Line({}, new Point(5, 13), new Point(6, 11), debug_aes),
      new Line({}, new Point(5, 13), new Point(4, 11), debug_aes),
      new Line({}, new Point(6, 11), new Point(5, 9), debug_aes),
      new Line({}, new Point(5, 9), new Point(4, 11), debug_aes),
    ],
    bounds: [Point.fromSvg(state, 6, 13, false), Point.fromSvg(state, 4, 9, false)],
  }
  return {
    ...updateActiveLayer(state, layerPatch),
    openMenus: {
      ...state.openMenus,
      main: true,
    },
    side: "top",
    debug: true,
  }
}

export function tourState(state) {
  const activeLayer = getActiveLayer(state)
  return {
    inTour: true,
    debug: false,
    debugDrawPoints: {},
    openMenus: {
      main: true,
      controls: false,
      color: false,
      navigation: false,
      file: false,
      settings: false,
      help: false,
      mirror: false,
    },
    side: "top",
    ...updateActiveLayer(state, {
      ...activeLayer,
      bounds: [Point.fromSvg(state, 6, 13, false), Point.fromSvg(state, 4, 9, false)],
      lines: [
        new Line(
          state,
          Point.fromSvg(state, 5, 13, false),
          Point.fromSvg(state, 6, 11, false),
          { stroke: "black", strokeWidth: 0, dash: "1, .5" },
          { id: "dashed-line" },
        ),
        new Line(state, Point.fromSvg(state, 5, 13, false), Point.fromSvg(state, 6, 11, false), {
          stroke: "black",
          strokeWidth: 0,
        }),
        new Line(state, Point.fromSvg(state, 6, 11, false), Point.fromSvg(state, 5, 9, false), {
          stroke: "black",
          strokeWidth: 0,
        }),
        new Line(state, Point.fromSvg(state, 5, 9, false), Point.fromSvg(state, 4, 11, false), {
          stroke: "black",
          strokeWidth: 0,
        }),
        new Line(state, Point.fromSvg(state, 4, 11, false), Point.fromSvg(state, 5, 13, false), {
          stroke: "black",
          strokeWidth: 0,
        }),
      ],
    }),
    curLinePos: null,
    dash: ["0", "20, 10", "0", "0", "0"],
    colorProfile: 1,
    stroke: ["#000000", "#000000", "#ddddab", "#ff784b", "#1a31ff"],
  }
}
