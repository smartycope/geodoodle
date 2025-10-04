import { mobileAndTabletCheck } from "./utils"
import options from "./options"
import { viewportWidth, viewportHeight, START_DEBUGGING, MIRROR_AXIS, MIRROR_TYPE, MIRROR_METHOD } from "./globals"
import Point from "./helper/Point"
import Line from "./helper/Line"
import { defaultTrellisControl } from "./utils"
import Dist from "./helper/Dist"

const debug_aes = {
    stroke: 'black',
    width: .05,
    dash: '0',
    lineCap: 'butt',
    lineJoin: 'miter',
}

export default function getInitialState(systemDarkMode){
    console.log('The user prefers ' + (systemDarkMode ? 'dark' : 'light'))
    const isMobile = mobileAndTabletCheck()
    return {
        mobile: isMobile,
        // 0 indexed
        colorProfile: 0,
        // A list of hex color string
        stroke: Array(options.commonColorAmt).fill(options.stroke),
        // Coords: Dist, deflated
        strokeWidth: Array(options.commonColorAmt).fill(.05),
        // A list of hex color strings that gets shifted
        // commonColors: Array(options.commonColorAmt).fill(options.stroke),
        // "a series of comma and/or whitespace separated numbers"
        // The numbers are scaled
        dash: Array(options.commonColorAmt).fill('0'),
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
        // A list of Poly objects that have been filled. We draw these
        filledPolys: [],

        filename: "",
        // The side of page we have the menu bound to: left, right, top, or bottom
        side: viewportWidth() < viewportHeight() ? 'top' : 'right',

        // The position of the circle we're drawing to act as a cursor in our application, NOT the actual mouse position
        cursorPos: Point.svgOrigin(),
        // A list of Line objects, or an empty list
        lines: START_DEBUGGING ? [
            new Line({}, new Point(5, 13), new Point(6, 11), debug_aes),
            new Line({}, new Point(5, 13), new Point(4, 11), debug_aes),
            new Line({}, new Point(6, 11), new Point(5, 9), debug_aes),
            new Line({}, new Point(5, 9), new Point(4, 11), debug_aes),
        ] : [],
        // The starting point of the current line, or null
        curLinePos: null,
        // A list of points specifying the bounderies that define the selection rect
        bounds: [],
        // Whether we're currently dragging the selection rect. If we are, we count the cursorPos as a bound
        boundDragging: false,
        // The point of the eraser, or null
        eraser: null,
        // A list of Line objects, or null
        clipboard: null,
        // In degrees
        // TODO: make this use radians instead, it only comes in increments of 90 degrees, there's no reason not to use radians
        clipboardRotation: 0,
        // Of type MIRROR_AXIS or null
        clipboardMirrorAxis: null,
        // We need to get the center of the clipboard when we copy, not dynamically from the selection, so if it changes
        // or the selection gets deleted, we can still transform it
        clipboardOffset: null,

        trellis: false,
        // See the definition of defaultTrellisControl (in utils.jsx) for what this type looks like
        // Type: number
        trellisOverlap: defaultTrellisControl({x: 0, y: 0}),
        // Type: bool
        trellisSkip: defaultTrellisControl(false),
        // Type: MIRROR_AXIS
        trellisFlip: defaultTrellisControl(MIRROR_AXIS.NONE_0),
        // Type: MIRROR_AXIS
        trellisRotate: defaultTrellisControl(MIRROR_AXIS.NONE_0),
        hideDots: false,

        mirroring: false,
        mirrorAxis: MIRROR_AXIS.VERT_90,
        // The second one is only used when mirrorMethod == BOTH, and it used for the Rotation one
        mirrorAxis2: MIRROR_AXIS.BOTH_360,
        mirrorType: MIRROR_TYPE.PAGE,
        mirrorMethod: MIRROR_METHOD.FLIP,

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
        partials: options.partials,
        invertedScroll: options.invertedScroll,
        scrollSensitivity: options.scrollSensitivity,
        gestureTranslateSensitivity: 1,
        gestureScaleSensitivity: .3,
        smoothGestureScale: false,
        dotsAbovefill: true,
        // One of options.extraButtons
        extraButton: 'home',
        hideHexColor: options.hideHexColor,
        maxUndoAmt: options.maxUndoAmt,
        enableGestureScale: options.enableGestureScale,
        inTour: false,

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

        paperColor: options.paperColor,
        darkMode: systemDarkMode,
        doubleTapTimeMS: options.doubleTapTimeMS,
        holdTapTimeMS: options.holdTapTimeMS,

        // Set to a string to show a toast. It will hide itself after options.toastDuration ms
        toast: null,

        openMenus: {
            main: true,
            controls: true,
            color: false,
            navigation: false,
            repeat: false,
            file: false,
            settings: false,
            help: false,
            mirror: false,
            key: false,
            extra: false,
            select: false,
            clipboard: false,
            delete: false,
        },
    }
}

export function tourState(state){
    return {
        inTour: true,
        debug: false,
        debugDrawPoints: {},
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
        side: 'top',
        bounds: [
            Point.fromSvg(state, 6, 13, false),
            Point.fromSvg(state, 4, 9, false),
        ],
        curLinePos: null,
        dash: ['0', "20, 10", '0', '0', '0'],
        colorProfile: 1,
        // mobile: true,
        stroke: ['#000000', '#000000', '#ddddab', '#ff784b', '#1a31ff'],
        lines: [
            new Line(state, Point.fromSvg(state, 5, 13, false), Point.fromSvg(state, 6, 11, false), {stroke: 'black', strokeWidth: 0, dash: '1, .5'}, {id: 'dashed-line'}),
            new Line(state, Point.fromSvg(state, 5, 13, false), Point.fromSvg(state, 6, 11, false), {stroke: 'black', strokeWidth: 0}),
            new Line(state, Point.fromSvg(state, 6, 11, false), Point.fromSvg(state, 5, 9, false), {stroke: 'black', strokeWidth: 0}),
            new Line(state, Point.fromSvg(state, 5, 9, false), Point.fromSvg(state, 4, 11, false), {stroke: 'black', strokeWidth: 0}),
            new Line(state, Point.fromSvg(state, 4, 11, false), Point.fromSvg(state, 5, 13, false), {stroke: 'black', strokeWidth: 0}),
        ]
    }
}