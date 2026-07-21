import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import {
  cursor_moved,
  fill,
  clear_fill,
  toggle_fill_mode,
  randomize_color,
  set_color_profile_index,
  paint_selected,
  set_background_image,
  clear_background_image,
  translate,
  scale,
  rotate,
  gesture_transform,
  set_canvas_rotation_allowed,
  increase_scale,
  decrease_scale,
  go_home,
  go_to_selection,
  left,
  right,
  up,
  down,
  clear,
  clear_bounds,
  select_all,
  delete_selected,
  delete_specific_line,
  delete_unselected,
  delete_at_cursor,
  nevermind,
  pick_up_line_end,
  add_line,
  continue_line,
  add_bound,
  undo,
  redo,
  cancel_clipboard,
  paste,
  copy,
  cut,
  increment_clipboard_rotation,
  increment_clipboard_mirror_axis,
  download_file,
  upload_file,
  save_local,
  load_local,
  copy_image,
  start_tour,
  end_tour,
  toggle_partials,
  toggle_dots,
  apply_trellis,
  set_manual,
  menu,
  debug,
  toggle_debugging,
} from "../actions"
import Point from "../helper/Point"
import Dist from "../helper/Dist"
import Line from "../helper/Line"
import Rect from "../helper/Rect"
import { getDefaultTestingState, getState } from "./testUtils"
import { MIRROR_AXIS, MIRROR_ROT, MIRROR_TYPE } from "../globals"
import { viewportHeight, viewportWidth } from "../globals"
import defaultOptions from "../options"
import { getHalf } from "../utils/misc.jsx"
import { getSelected } from "../utils/lines.js"
import { tourState } from "../states"
import { download, image, validateStorage } from "../utils/files.jsx"

// Mock the global objects and functions
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = mockLocalStorage

// Mock the clipboard API
global.navigator.clipboard = {
  write: vi.fn(),
}

// vitest.setup.ts or at top of your test file
globalThis.ClipboardItem = class {
  constructor(items) {
    this.items = items
  }
}

// Mock the document.querySelector
global.document.querySelector = vi.fn(() => ({
  getBBox: () => ({ width: 100, height: 100 }),
}))

// Mock the download and image functions
vi.mock("../utils/files.jsx", async (importOriginal) => ({
  ...(await importOriginal()),
  download: vi.fn(),
  image: vi.fn((state, format, rect, includeBackground, selectedOnly, callback) => {
    // Simulate image creation with a callback
    if (callback) callback("mocked-blob")

    return "mocked-image-url"
  }),
  serializePattern: vi.fn(() => "mocked-serialized-pattern"),
  resolveExportRect: vi.fn((state, selectedOnly) => {
    const objects = selectedOnly ? getSelected(state, false, true) : [...state.lines, ...state.filledPolys]
    const points = objects.flatMap((object) =>
      typeof object.points === "function" ? object.points() : (object.points ?? []),
    )
    return points.length ? Rect.fromPoints(...points) : new Rect(new Point(0, 0), new Point(1, 1))
  }),
  validateStorage: vi.fn(),
  generateName: () => "test name",
  // validateStorage: validateStorage,
  deserializePattern: vi.fn(() => ({
    lines: [],
    bounds: [],
    translation: new Dist(0, 0),
    scalex: 1,
    scaley: 1,
  })),
  // image: vi.fn((state, format, rect, includeBackground, selectedOnly, callback) => {
  //   // Simulate image creation with a callback
  //   if (callback) {
  //     callback('mocked-blob');
  //   }
  //   return 'mocked-image-url';
  // }),
  // serializePattern: vi.fn(() => 'mocked-serialized-pattern'),
  // deserializePattern: vi.fn(() => ({
  //   lines: [],
  //   bounds: [],
  //   translation: new Dist(0, 0),
  //   scalex: 1,
  //   scaley: 1,
  // })),
}))

describe("Transformation Actions", () => {
  let state

  beforeEach(() => {
    state = getState()
  })

  describe("cursor_moved", () => {
    test("should update cursor position and set boundDragging to true", () => {
      const point = new Point(50, 50)
      const newState = cursor_moved(state, { point })

      expect(newState.cursorPos).toEqual(point.align(state))
      expect(newState.boundDragging).toBe(true)
      expect(newState.debugDrawPoints.Mouse).toBeDefined()
    })

    test("loops mouse movement across horizontal and vertical viewport edges", () => {
      state = { ...state, loopCursorAtEdges: true }
      const topLeft = Point.fromViewport(state, 0, 0).ceil()
      const bottomRight = Point.fromViewport(state, viewportWidth() - 1, viewportHeight() - 1).floor()

      const fromTopLeft = cursor_moved(state, { point: Point.fromViewport(state, 0, 0) })
      expect(fromTopLeft.cursorPos.eq(bottomRight)).toBe(true)

      const fromBottomRight = cursor_moved(state, {
        point: Point.fromViewport(state, viewportWidth() - 1, viewportHeight() - 1),
      })
      expect(fromBottomRight.cursorPos.eq(topLeft)).toBe(true)
    })

    test("does not loop mouse movement when the setting is disabled", () => {
      const point = Point.fromViewport(state, 0, 0)

      expect(cursor_moved(state, { point }).cursorPos.eq(point.align(state))).toBe(true)
    })

    test("translates to keep an offscreen pointer-driven cursor visible", () => {
      const movement = cursor_moved(state, { point: Point.fromViewport(state, -state.scalex, -state.scaley) })
      const movedState = { ...state, ...movement }
      const viewportCursor = movedState.cursorPos.asViewport(movedState)

      expect(movement.translation).toBeDefined()
      expect(viewportCursor.x).toBeGreaterThanOrEqual(0)
      expect(viewportCursor.y).toBeGreaterThanOrEqual(0)
    })
  })

  describe("translate", () => {
    test("should translate the viewport by the given amount", () => {
      const amt = new Dist(10, 20)
      const newState = translate(state, { amt })

      expect(newState.translation).toEqual(state.translation.add(amt))
    })

    test("should not translate if it would move selection out of viewport when repeating", () => {
      const boundRect = new Rect(new Point(0, 0), new Point(100, 100))
      const amt = new Dist(1000, 1000) // Large translation that would move out of viewport

      const stateWithBounds = {
        ...state,
        boundRect,
        trellis: true, // Enable repeating
      }

      const newState = translate(stateWithBounds, { amt })
      expect(newState).toBeUndefined()
    })
  })

  describe("scale", () => {
    test("should scale the viewport around the center point", () => {
      const center = new Point(50, 50)
      const newState = scale(state, { amtx: 0.5, amty: 0.5, center })

      expect(newState.scalex).toBeGreaterThan(state.scalex)
      expect(newState.scaley).toBeGreaterThan(state.scaley)
      expect(newState.translation).toBeDefined()
    })

    test("keeps the scale center fixed when the canvas is rotated", () => {
      state = { ...state, rotate: 37 }
      const center = new Point(8, 12)
      const before = center.asViewport(state)
      const scaledState = { ...state, ...scale(state, { amtx: 5, amty: 5, center }) }
      const after = center.asViewport(scaledState)

      expect(after.x).toBeCloseTo(before.x)
      expect(after.y).toBeCloseTo(before.y)
    })

    test("should respect min and max scale limits", () => {
      // Test minimum scale
      const minScaleState = { ...state, scalex: defaultOptions.minScale, scaley: defaultOptions.minScale }
      const minScaleResult = scale(minScaleState, { amtx: -1, amty: -1 })
      expect(minScaleResult.scalex).toBe(defaultOptions.minScale)

      // Test maximum scale
      const maxScaleState = { ...state, scalex: defaultOptions.maxScale, scaley: defaultOptions.maxScale }
      const maxScaleResult = scale(maxScaleState, { amtx: 1, amty: 1 })
      expect(maxScaleResult.scalex).toBe(defaultOptions.maxScale)
    })
  })

  describe("rotate", () => {
    test("should rotate the viewport by the given amount", () => {
      const newState = rotate(state, { amt: 90 })
      expect(newState.rotate).toBe(state.rotate + 90)
    })

    test("keeps the rotation center at the same viewport position", () => {
      const center = new Point(8, 12)
      const before = center.asViewport(state)
      const rotatedState = { ...state, ...rotate(state, { amt: 47, center }) }
      const after = center.asViewport(rotatedState)

      expect(after.x).toBeCloseTo(before.x)
      expect(after.y).toBeCloseTo(before.y)
    })

    test("does not rotate when canvas rotation is disabled", () => {
      state = { ...state, allowCanvasRotation: false }

      expect(rotate(state, { amt: 45 })).toEqual({})
    })

    test("disabling canvas rotation resets the angle", () => {
      state = { ...state, rotate: 45 }

      expect(set_canvas_rotation_allowed(state, { allowed: false })).toEqual({
        allowCanvasRotation: false,
        rotate: 0,
      })
    })
  })

  describe("gesture_transform", () => {
    test("moves, scales, and rotates around the two-finger gesture in one update", () => {
      state = { ...state, rotate: 15, gestureTranslateSensitivity: 1 }
      const previousCenter = { x: 200, y: 160 }
      const currentCenter = { x: 230, y: 190 }
      const anchor = Point.fromViewport(state, previousCenter.x, previousCenter.y)
      const transformedState = {
        ...state,
        ...gesture_transform(state, {
          previousCenter,
          currentCenter,
          amtx: 5,
          amty: 5,
          rotateAmt: 30,
        }),
      }
      const movedAnchor = anchor.asViewport(transformedState)

      expect(transformedState.scalex).toBe(state.scalex + 5)
      expect(transformedState.scaley).toBe(state.scaley + 5)
      expect(transformedState.rotate).toBe(45)
      expect(movedAnchor.x).toBeCloseTo(currentCenter.x)
      expect(movedAnchor.y).toBeCloseTo(currentCenter.y)
    })
  })

  describe("go_home", () => {
    test("should reset the viewport to its default position, scale, and rotation", () => {
      const translatedState = {
        ...state,
        translation: new Dist(100, 100),
        scalex: 2,
        scaley: 2,
        rotate: 45,
        shearx: 0.5,
        sheary: 0.5,
      }

      const newState = go_home(translatedState)

      expect(newState.translation).toEqual(Dist.zero())
      expect(newState.scalex).toBe(translatedState.defaultScalex)
      expect(newState.scaley).toBe(translatedState.defaultScaley)
      expect(newState.rotate).toBe(0)
      expect(newState.shearx).toBe(0)
      expect(newState.sheary).toBe(0)
    })
  })
})

describe("Navigation Actions", () => {
  let state

  beforeEach(() => {
    state = getState()
  })

  test("loops keyboard movement across all four viewport edges", () => {
    state = { ...state, loopCursorAtEdges: true }
    const topLeft = Point.fromViewport(state, 0, 0).ceil()
    const bottomRight = Point.fromViewport(state, viewportWidth() - 1, viewportHeight() - 1).floor()

    expect(left({ ...state, cursorPos: topLeft }).cursorPos._x).toBe(bottomRight._x)
    expect(up({ ...state, cursorPos: topLeft }).cursorPos._y).toBe(bottomRight._y)
    expect(right({ ...state, cursorPos: bottomRight }).cursorPos._x).toBe(topLeft._x)
    expect(down({ ...state, cursorPos: bottomRight }).cursorPos._y).toBe(topLeft._y)
  })

  test("translates to keep keyboard movement visible when looping is disabled", () => {
    const topLeft = Point.fromViewport(state, 0, 0).ceil()
    const bottomRight = Point.fromViewport(state, viewportWidth() - 1, viewportHeight() - 1).floor()

    const movements = [
      left({ ...state, cursorPos: topLeft }),
      up({ ...state, cursorPos: topLeft }),
      right({ ...state, cursorPos: bottomRight }),
      down({ ...state, cursorPos: bottomRight }),
    ]

    for (const movement of movements) {
      const movedState = { ...state, ...movement }
      const viewportCursor = movedState.cursorPos.asViewport(movedState)
      expect(viewportCursor.x).toBeGreaterThanOrEqual(0)
      expect(viewportCursor.x).toBeLessThan(viewportWidth())
      expect(viewportCursor.y).toBeGreaterThanOrEqual(0)
      expect(viewportCursor.y).toBeLessThan(viewportHeight())
    }

    expect(movements.every((movement) => movement.translation)).toBe(true)
  })

  describe("go_to_selection", () => {
    test("should center the viewport on the selection", () => {
      // const selectionRect = new Rect(new Point(100, 100), new Point(200, 200));
      const stateWithSelection = {
        ...state,
        // getBoundRect: () => selectionRect,
        bounds: [new Point(100, 100), new Point(200, 200)],
        viewportWidth: () => 800,
        viewportHeight: () => 600,
      }

      const newState = go_to_selection(stateWithSelection)

      // The translation should center the selection in the viewport
      expect(newState.translation).toBeDefined()
      expect(newState.translation._x).toBe(-124.4)
      expect(newState.translation._y).toBe(-130.8)
    })

    test("should center the selection when the canvas is rotated", () => {
      const stateWithSelection = {
        ...state,
        rotate: 38,
        translation: new Dist(4, -7),
        bounds: [new Point(100, 100), new Point(200, 200)],
      }
      const centeredState = { ...stateWithSelection, ...go_to_selection(stateWithSelection) }
      const selectionCenter = new Point(150, 150).asViewport(centeredState)

      expect(selectionCenter.x).toBeCloseTo(viewportWidth() / 2)
      expect(selectionCenter.y).toBeCloseTo(viewportHeight() / 2)
    })

    test("should return undefined if there is no selection", () => {
      const stateWithoutSelection = {
        ...state,
        bounds: [],
      }

      const newState = go_to_selection(stateWithoutSelection)
      expect(newState).toBeUndefined()
    })
  })

  describe("directional navigation", () => {
    test("should move cursor left", () => {
      const newState = left(state)
      expect(newState.cursorPos._x).toBeLessThan(state.cursorPos._x)
    })

    test("should move cursor right", () => {
      const newState = right(state)
      expect(newState.cursorPos._x).toBeGreaterThan(state.cursorPos._x)
    })

    test("should move cursor up", () => {
      const newState = up(state)
      expect(newState.cursorPos._y).toBeLessThan(state.cursorPos._y)
    })

    test("should move cursor down", () => {
      const newState = down(state)
      expect(newState.cursorPos._y).toBeGreaterThan(state.cursorPos._y)
    })
  })
})

describe("Deletion Actions", () => {
  let state

  beforeEach(() => {
    state = getState()
    // Add some test lines and bounds
    state.lines = [
      new Line(state, new Point(0, 0), new Point(10, 10)),
      new Line(state, new Point(20, 20), new Point(30, 30)),
    ]
    state.bounds = [new Point(5, 5), new Point(25, 25)]
  })

  describe("clear", () => {
    test("should clear all lines and bounds", () => {
      const newState = clear(state)
      expect(newState.layers).toHaveLength(1)
      expect(newState.layers[0].lines).toHaveLength(0)
      expect(newState.layers[0].bounds).toHaveLength(0)
      expect(newState.openMenus.delete).toBe(false)
      expect(newState.openMenus.repeat).toBe(false)
    })
  })

  describe("clear_bounds", () => {
    test("should clear all bounds and cancel clipboard", () => {
      const newState = clear_bounds(state)
      expect(newState.bounds).toHaveLength(0)
      expect(newState.clipboard).toBeNull()
    })
  })

  describe("select_all", () => {
    test("sets bounds to the top-left and bottom-right of every line", () => {
      state.lines = [
        new Line(state, new Point(4, 12), new Point(10, -3)),
        new Line(state, new Point(-6, 8), new Point(2, 20)),
      ]

      expect(select_all(state).bounds).toEqual([new Point(-6, -3), new Point(10, 20)])
    })

    test("clears bounds when there are no lines", () => {
      state.lines = []

      expect(select_all(state).bounds).toEqual([])
    })
  })

  describe("delete_selected", () => {
    test("should delete selected lines", () => {
      // Set up a selection
      const selectedState = {
        ...state,
        bounds: [new Point(0, 0), new Point(15, 15)],
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
      }

      const newState = delete_selected(selectedState)
      expect(newState.lines).toHaveLength(1) // Only one line should remain
      // TODO:
      // expect(newState.bounds).toHaveLength(0); // Bounds should be cleared
    })
  })

  describe("delete_specific_line", () => {
    test("deletes only the line matching both endpoints in either direction", () => {
      const target = new Line(state, new Point(2, 3), new Point(8, 9))
      const sharedEndpoint = new Line(state, new Point(2, 3), new Point(12, 14))
      const unrelated = new Line(state, new Point(20, 21), new Point(22, 23))
      const lineState = { ...state, lines: [target, sharedEndpoint, unrelated] }

      const result = delete_specific_line(lineState, { start: target.b, end: target.a })

      expect(result.lines).toEqual([sharedEndpoint, unrelated])
    })
  })

  describe("delete_unselected", () => {
    test("should delete unselected lines", () => {
      // Set up a selection
      const selectedState = {
        ...state,
        bounds: [new Point(0, 0), new Point(15, 15)],
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
      }

      const newState = delete_unselected(selectedState)
      expect(newState.lines).toHaveLength(1) // Only the selected line should remain
      // TODO:
      // expect(newState.bounds).toHaveLength(0); // Bounds should be cleared
    })
  })

  describe("delete_at_cursor", () => {
    test("should remove a bound if clicked on it", () => {
      const cursorAtBound = {
        ...state,
        cursorPos: new Point(5, 5), // On a bound
        deletingSelection: true,
      }

      const newState = delete_at_cursor(cursorAtBound)
      expect(newState.bounds).toHaveLength(1) // One bound should be removed
      expect(newState.deletingSelection).toBe(false)
    })
    test("should delete a line under cursor", () => {
      const cursorAtLine = {
        ...state,
        cursorPos: new Point(10, 10), // On the first line
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
      }

      const newState = delete_at_cursor(cursorAtLine)
      expect(newState.lines).toHaveLength(1) // One line should be removed
    })

    test.each([
      [
        "two saved mirror origins",
        {
          mirrorAxis: MIRROR_AXIS.NONE,
          mirrorRot: MIRROR_ROT.NONE,
          mirrorOrigins: [
            { origin: new Point(0, 0), axis: MIRROR_AXIS.Y, rot: MIRROR_ROT.NONE },
            { origin: new Point(10, 10), axis: MIRROR_AXIS.X, rot: MIRROR_ROT.NONE },
          ],
        },
      ],
      [
        "the Page origin",
        {
          mirrorType: MIRROR_TYPE.PAGE,
          mirrorAxis: MIRROR_AXIS.BOTH,
          mirrorRot: MIRROR_ROT.NONE,
          mirrorOrigins: [],
        },
      ],
      [
        "the Cursor origin",
        {
          mirrorType: MIRROR_TYPE.CURSOR,
          mirrorAxis: MIRROR_AXIS.BOTH,
          mirrorRot: MIRROR_ROT.NONE,
          mirrorOrigins: [],
        },
      ],
    ])("deletes every line mirrored through %s", (_, mirrorState) => {
      const start = new Point(2, 3)
      const end = new Point(5, 7)
      const drawingState = {
        ...state,
        ...mirrorState,
        curLinePos: start,
        cursorPos: end,
        lines: [],
      }
      const mirroredLines = add_line(drawingState, {}).lines
      const unrelated = new Line(state, new Point(123, 127), new Point(131, 137))

      expect(mirroredLines).toHaveLength(4)

      const result = delete_at_cursor({
        ...drawingState,
        curLinePos: null,
        cursorPos: start,
        lines: [...mirroredLines, unrelated],
      })

      expect(result.lines).toEqual([unrelated])
    })

    test("should clear clipboard if one exists", () => {
      const withClipboard = {
        ...state,
        clipboard: { some: "data" },
      }

      const newState = delete_at_cursor(withClipboard)
      expect(newState.clipboard).toBeNull()
    })
  })

  describe("nevermind", () => {
    test("should cancel clipboard if one exists", () => {
      const withClipboard = {
        ...state,
        clipboard: { some: "data" },
      }

      const newState = nevermind(withClipboard)
      expect(newState.clipboard).toBeNull()
    })

    test("should clear current line if one is being drawn", () => {
      const withCurLine = {
        ...state,
        curLinePos: new Point(10, 10),
      }

      const newState = nevermind(withCurLine)
      expect(newState.curLinePos).toBeNull()
    })

    test("should clear bounds if they exist", () => {
      const withBounds = {
        ...state,
        bounds: [new Point(5, 5)],
      }

      const newState = nevermind(withBounds)
      expect(newState.bounds).toHaveLength(0)
    })
  })
})

describe("Line Creation Actions", () => {
  let state

  beforeEach(() => {
    state = getState()
    state.lines = []
    state.cursorPos = new Point(100, 100)
  })

  describe("pick_up_line_end", () => {
    test("removes the line and keeps its opposite endpoint as the current line start", () => {
      const pickedUpEnd = new Point(100, 100)
      const fixedEnd = new Point(50, 50)
      const line = new Line(state, fixedEnd, pickedUpEnd)
      const untouchedLine = new Line(state, new Point(0, 0), new Point(10, 10))
      const withLine = {
        ...state,
        cursorPos: pickedUpEnd,
        lines: [line, untouchedLine],
      }

      const newState = pick_up_line_end(withLine)

      expect(newState.lines).toEqual([untouchedLine])
      expect(newState.curLinePos.eq(fixedEnd)).toBe(true)
    })

    test("does nothing when the cursor is not on a line endpoint", () => {
      const withLine = {
        ...state,
        lines: [new Line(state, new Point(0, 0), new Point(10, 10))],
      }

      expect(pick_up_line_end(withLine)).toEqual({})
    })

    test("the picked-up endpoint can be placed using the normal add-line action", () => {
      const originalEnd = new Point(100, 100)
      const fixedEnd = new Point(50, 50)
      const destination = new Point(120, 80)
      const line = new Line(state, fixedEnd, originalEnd)
      const pickedUp = pick_up_line_end({ ...state, cursorPos: originalEnd, lines: [line] })

      const moved = add_line({ ...state, ...pickedUp, cursorPos: destination }, {})

      expect(moved.lines).toHaveLength(1)
      expect(moved.lines[0].a.eq(fixedEnd)).toBe(true)
      expect(moved.lines[0].b.eq(destination)).toBe(true)
      expect(moved.curLinePos).toBeNull()
    })
  })

  describe("add_line", () => {
    test("should add a new line between two points", () => {
      const withStartPoint = {
        ...state,
        curLinePos: new Point(50, 50),
      }

      const newState = add_line(withStartPoint, {})
      expect(newState.lines).toHaveLength(1)
      expect(newState.curLinePos).toBeNull()
    })

    test("should paste clipboard content if clipboard exists", () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        lines: [],
      }

      // Mock the paste function
      // const originalPaste = paste;
      // const mockPaste = vi.fn(() => ({ lines: [new Line(state, new Point(0, 0), new Point(10, 10)), new Line(state, new Point(20, 20), new Point(30, 30))] }));
      // global.paste = mockPaste;

      const newState = add_line(withClipboard, {})

      // expect(mockPaste).toHaveBeenCalled();
      expect(newState.lines).toHaveLength(2)

      // Restore original
      // global.paste = originalPaste;
    })
  })

  describe("continue_line", () => {
    test("should continue a line from the last point", () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        curLinePos: new Point(50, 50),
      }

      const newState = continue_line(withClipboard)
      expect(newState.curLinePos).toEqual(withClipboard.curLinePos)
    })

    test("should start a new line from cursor if no clipboard", () => {
      const newState = continue_line(state)
      expect(newState.curLinePos).toEqual(state.cursorPos)
    })
  })

  describe("add_bound", () => {
    test("should add a bound at cursor position", () => {
      const newState = add_bound(state)
      expect(newState.bounds).toContainEqual(state.cursorPos)
    })

    test("should remove bound if clicked on existing one", () => {
      const withBound = {
        ...state,
        bounds: [state.cursorPos],
      }

      const newState = add_bound(withBound)
      expect(newState.bounds).not.toContainEqual(state.cursorPos)
    })

    test("should create a selection rect with exactly two bounds", () => {
      // First bound
      const afterFirstBound = add_bound(state)
      expect(afterFirstBound.bounds).toHaveLength(1)

      // Second bound
      const secondPoint = new Point(200, 200)
      const afterSecondBound = add_bound({
        ...afterFirstBound,
        cursorPos: secondPoint,
      })

      expect(afterSecondBound.bounds).toHaveLength(2)
    })

    test("completing a deleting selection removes lines in the area and clears its bounds", () => {
      const inside = new Line(state, new Point(2, 2), new Point(8, 8))
      const genericOutside = new Line(state, new Point(20, 20), new Point(30, 30))
      const specificOutside = new Line(state, new Point(40, 40), new Point(50, 50))
      const deletingState = {
        ...state,
        lines: [inside, genericOutside, specificOutside],
        bounds: [new Point(0, 0)],
        cursorPos: new Point(10, 10),
        deletingSelection: true,
        removeSelectionAfterDelete: false,
        genericSelectors: [genericOutside.a],
        specificSelectors: specificOutside.points(),
      }

      const result = add_bound(deletingState)

      expect(result.lines).toEqual([genericOutside, specificOutside])
      expect(result.bounds).toEqual([])
      expect(result.deletingSelection).toBe(false)
      expect(result.boundDragging).toBe(false)
    })
  })
})

describe("Color Actions", () => {
  test.each([0, 1, 2, 3, 4])("selects color profile %i without replacing either palette", (index) => {
    const state = getState()

    const result = set_color_profile_index(state, { index })

    expect(result).toEqual({ colorProfile: index })
    expect(state.stroke).toHaveLength(defaultOptions.commonColorAmt)
    expect(state.fill).toHaveLength(defaultOptions.commonColorAmt)
  })

  test("paints selected lines with the active line aesthetics", () => {
    const state = getState()
    const selected = new Line(state, new Point(0, 0), new Point(10, 10), {
      stroke: "#111111",
      width: 0.1,
      dash: "1, 2",
      lineCap: "butt",
      lineJoin: "miter",
    })
    const unselected = new Line(state, new Point(20, 20), new Point(30, 30), { stroke: "#222222" })
    const selectedState = {
      ...state,
      colorProfile: 1,
      stroke: ["#000000", "#abcdef"],
      strokeWidth: [0.05, 0.25],
      dash: ["0", "4, 8"],
      lineCap: "round",
      lineJoin: "bevel",
      bounds: [new Point(0, 0), new Point(15, 15)],
      lines: [selected, unselected],
    }

    const result = paint_selected(selectedState)

    expect(result.lines[0]).not.toBe(selected)
    expect(result.lines[0].aes).toEqual({
      stroke: "#abcdef",
      width: 0.25,
      dash: "4, 8",
      lineCap: "round",
      lineJoin: "bevel",
    })
    expect(result.lines[1]).toBe(unselected)
  })

  test("sets and clears a background image while keeping the paper color in sync", () => {
    const state = getState()
    const image = "data:image/png;base64,background"

    expect(set_background_image(state, { image, color: "#aabbcc" })).toEqual({
      backgroundImage: image,
      paperColor: "#aabbcc",
    })
    expect(clear_background_image()).toEqual({ backgroundImage: null })
  })

  test("ignores an out-of-range color profile", () => {
    const state = getState()

    expect(set_color_profile_index(state, { index: defaultOptions.commonColorAmt })).toEqual({})
  })

  test("randomizes only the active color with a background-compatible color", () => {
    const state = { ...getState(), paperColor: "#996b6b", colorProfile: 2 }
    const random = vi.spyOn(Math, "random").mockReturnValue(0.5)

    const result = randomize_color(state)

    expect(Object.keys(result)).toEqual(["stroke"])
    expect(result.stroke).toHaveLength(defaultOptions.commonColorAmt)
    expect(result.stroke.slice(0, 2)).toEqual(state.stroke.slice(0, 2))
    expect(result.stroke.slice(3)).toEqual(state.stroke.slice(3))
    expect(result.stroke[2]).toMatch(/^#[\da-f]{6}$/i)
    expect(result.stroke[2]).not.toBe(state.stroke[2])

    random.mockRestore()
  })
})

describe("Clipboard Actions", () => {
  let state

  beforeEach(() => {
    state = getState()
    state.lines = [
      new Line(state, new Point(0, 0), new Point(10, 10), {}, {}, true),
      new Line(state, new Point(20, 20), new Point(30, 30), {}, {}, true),
    ]
    state.bounds = [new Point(0, 0), new Point(30, 30)]
  })

  describe("cancel_clipboard", () => {
    test("should clear all clipboard-related state", () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        clipboardMirrorAxis: MIRROR_AXIS.Y,
        clipboardRotation: 90,
        clipboardOffset: new Dist(10, 10),
      }

      const newState = cancel_clipboard(withClipboard)

      expect(newState.clipboard).toBeNull()
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.NONE)
      expect(newState.clipboardRotation).toBe(MIRROR_ROT.NONE)
      expect(newState.clipboardOffset).toBeNull()
    })
  })

  describe("copy", () => {
    test("should set clipboard with selected lines and retain bounds by default", () => {
      const newState = copy(state)

      expect(newState.clipboard).toBeDefined()
      expect(newState.curLinePos).toBeNull()
      expect(newState.clipboardOffset).toBeDefined()
      expect(newState.bounds).toEqual(state.bounds)
    })

    test("should clear bounds when removeSelectionAfterCopy is enabled", () => {
      const newState = copy({ ...state, removeSelectionAfterCopy: true })

      expect(newState.clipboard).toBeDefined()
      expect(newState.bounds).toEqual([])
    })
  })

  describe("cut", () => {
    test("should copy and delete selected lines", () => {
      const newState = cut(state)

      expect(newState.clipboard).toBeDefined()
      expect(newState.lines).toHaveLength(0) // All lines were in the selection
      expect(newState.bounds).toHaveLength(0) // Bounds should be cleared
    })

    test("should retain bounds when selection removal after cut is disabled", () => {
      const newState = cut({ ...state, removeSelectionAfterDelete: false })

      expect(newState.lines).toHaveLength(0)
      expect(newState.bounds).toEqual(state.bounds)
    })
  })

  describe("paste", () => {
    test("should add clipboard lines to the document", () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        lines: [],
      }

      const newState = paste(withClipboard)
      expect(newState.lines).toEqual(withClipboard.clipboard)
    })

    test("mirrors clipboard lines around the cursor after positioning them", () => {
      const cursorPos = new Point(10, 10)
      const clipboardLine = new Line(state, new Point(-1, 0), new Point(1, 0))
      const withClipboard = {
        ...state,
        cursorPos,
        clipboard: [clipboardLine],
        lines: [],
        mirrorType: MIRROR_TYPE.CURSOR,
        mirrorAxis: MIRROR_AXIS.Y,
      }

      const newState = paste(withClipboard)
      const positionedLine = clipboardLine.translate(cursorPos)

      expect(newState.lines).toHaveLength(2)
      expect(newState.lines[0].eq(positionedLine)).toBe(true)
      expect(newState.lines[1].eq(positionedLine.flip(MIRROR_AXIS.Y, cursorPos))).toBe(true)
    })

    test("mirrors clipboard lines around the page after positioning them", () => {
      const cursorPos = new Point(10, 10)
      const clipboardLine = new Line(state, new Point(-1, 0), new Point(1, 0))
      const withClipboard = {
        ...state,
        cursorPos,
        clipboard: [clipboardLine],
        lines: [],
        mirrorType: MIRROR_TYPE.PAGE,
        mirrorAxis: MIRROR_AXIS.Y,
      }

      const newState = paste(withClipboard)
      const positionedLine = clipboardLine.translate(cursorPos)

      expect(newState.lines).toHaveLength(2)
      expect(newState.lines[0].eq(positionedLine)).toBe(true)
      expect(newState.lines[1].eq(positionedLine.flip(MIRROR_AXIS.Y, getHalf(state)))).toBe(true)
    })

    test("mirrors clipboard lines around saved mirror origins after positioning them", () => {
      const cursorPos = new Point(10, 10)
      const origin = new Point(20, 10)
      const clipboardLine = new Line(state, new Point(-1, 0), new Point(1, 0))
      const withClipboard = {
        ...state,
        cursorPos,
        clipboard: [clipboardLine],
        lines: [],
        mirrorAxis: MIRROR_AXIS.NONE,
        mirrorOrigins: [{ origin, axis: MIRROR_AXIS.Y, rot: MIRROR_ROT.NONE }],
      }

      const newState = paste(withClipboard)
      const positionedLine = clipboardLine.translate(cursorPos)

      expect(newState.lines).toHaveLength(2)
      expect(newState.lines[0].eq(positionedLine)).toBe(true)
      expect(newState.lines[1].eq(positionedLine.flip(MIRROR_AXIS.Y, origin))).toBe(true)
    })
  })

  describe("increment_clipboard_rotation", () => {
    test("should rotate clipboard by 90 degrees", () => {
      const withClipboard = { ...state, clipboardRotation: 0 }
      let newState = increment_clipboard_rotation(withClipboard)
      expect(newState.clipboardRotation).toBe(90)

      newState = increment_clipboard_rotation(newState)
      expect(newState.clipboardRotation).toBe(180)

      newState = increment_clipboard_rotation(newState)
      expect(newState.clipboardRotation).toBe(270)

      newState = increment_clipboard_rotation(newState)
      expect(newState.clipboardRotation).toBe(0) // Wraps around
    })

    test("can rotate the clipboard counterclockwise", () => {
      expect(increment_clipboard_rotation({ ...state, clipboardRotation: 0 }, { amt: -90 }).clipboardRotation).toBe(270)
    })
  })

  describe("increment_clipboard_mirror_axis", () => {
    test("should cycle through mirror axes", () => {
      const withClipboard = { ...state, clipboardMirrorAxis: MIRROR_AXIS.NONE }

      let newState = increment_clipboard_mirror_axis(withClipboard)
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.Y)

      newState = increment_clipboard_mirror_axis(newState)
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.X)

      newState = increment_clipboard_mirror_axis(newState)
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.BOTH)

      newState = increment_clipboard_mirror_axis(newState)
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.NONE) // Wraps around
    })
  })
})

describe("selector-based selection", () => {
  let state

  beforeEach(() => {
    state = getState()
  })

  test("a generic selector selects every line with an endpoint at that point", () => {
    const selector = new Point(0, 0)
    const selectedLines = [new Line(state, selector, new Point(10, 0)), new Line(state, selector, new Point(0, 10))]
    const unselectedLine = new Line(state, new Point(20, 20), new Point(30, 30))
    const selectorState = {
      ...state,
      bounds: [],
      lines: [...selectedLines, unselectedLine],
      genericSelectors: [selector],
      specificSelectors: [],
    }

    expect(getSelected(selectorState)).toEqual(selectedLines)
  })

  test("a generic selector selects lines crossing at that intersection", () => {
    const crossingLines = [
      new Line(state, new Point(0, 0), new Point(10, 10)),
      new Line(state, new Point(0, 10), new Point(10, 0)),
    ]
    const selectorState = {
      ...state,
      bounds: [],
      lines: crossingLines,
      genericSelectors: [new Point(5, 5)],
      specificSelectors: [],
    }

    expect(getSelected(selectorState)).toEqual(crossingLines)
  })

  test("specific selectors select only a line whose two endpoints are selected", () => {
    const a = new Point(0, 0)
    const b = new Point(10, 0)
    const selectedLine = new Line(state, a, b)
    const sharesOneEndpoint = new Line(state, a, new Point(0, 10))
    const selectorState = {
      ...state,
      bounds: [],
      lines: [selectedLine, sharesOneEndpoint],
      genericSelectors: [],
      specificSelectors: [a, b],
    }

    expect(getSelected(selectorState)).toEqual([selectedLine])
  })

  test("selector-selected lines can be translated relative to their center for copying", () => {
    const line = new Line(state, new Point(2, 4), new Point(6, 8))
    const selectorState = {
      ...state,
      bounds: [],
      lines: [line],
      genericSelectors: [line.a],
      specificSelectors: [],
    }

    const [relativeLine] = getSelected(selectorState, "center")

    expect(relativeLine.a.eq(new Point(-2, -2))).toBe(true)
    expect(relativeLine.b.eq(new Point(2, 2))).toBe(true)
  })
})

describe("copy_image", () => {
  let state

  beforeEach(() => {
    state = getState()
    image.mockClear()
    navigator.clipboard.write.mockClear()
  })

  test("copies all selected lines using their actual bounding rectangle", () => {
    const selectedLine = new Line(state, new Point(5, 7), new Point(15, 20))
    const unselectedLine = new Line(state, new Point(-30, -40), new Point(50, 60))
    const withSelection = {
      ...state,
      lines: [selectedLine, unselectedLine],
      bounds: [],
      genericSelectors: [],
      specificSelectors: selectedLine.points(),
    }

    copy_image(withSelection)

    expect(image).toHaveBeenCalledWith(withSelection, "png", expect.any(Rect), false, true, expect.any(Function), true)
    const rect = image.mock.calls[0][2]
    expect(rect.topLeft.eq(selectedLine.a)).toBe(true)
    expect(rect.bottomRight.eq(selectedLine.b)).toBe(true)
    expect(navigator.clipboard.write).toHaveBeenCalledOnce()
  })

  test("copies every line when no lines are selected", () => {
    const lines = [
      new Line(state, new Point(-5, 3), new Point(10, 8)),
      new Line(state, new Point(2, -7), new Point(20, 15)),
    ]
    const withoutSelection = {
      ...state,
      lines,
      bounds: [],
      genericSelectors: [],
      specificSelectors: [],
    }

    copy_image(withoutSelection)

    expect(image).toHaveBeenCalledWith(
      withoutSelection,
      "png",
      expect.any(Rect),
      false,
      false,
      expect.any(Function),
      true,
    )
    const rect = image.mock.calls[0][2]
    expect(rect.topLeft.eq(new Point(-5, -7))).toBe(true)
    expect(rect.bottomRight.eq(new Point(20, 15))).toBe(true)
  })

  test("does nothing when the pattern has no lines", () => {
    copy_image({ ...state, lines: [], bounds: [], genericSelectors: [], specificSelectors: [] })

    expect(image).not.toHaveBeenCalled()
    expect(navigator.clipboard.write).not.toHaveBeenCalled()
  })
})
/*
describe('File Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
    // vi.stubGlobal('URL', {
    //   createObjectURL: vi.fn(() => 'blob://mock-url'),
    //   revokeObjectURL: vi.fn(),
    // })
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => {
        return {
          download: '',
          href: '',
          click: vi.fn(),
        }
      }),
      revokeObjectURL: vi.fn(),
    })

    // vi.clearAllMocks();
  });

  describe('download_file', () => {
    test('downloads an SVG file', () => {
      const createElementSpy = vi.spyOn(document, 'createElement')
      const appendChildSpy = vi.spyOn(document.body, 'appendChild')
      const removeChildSpy = vi.spyOn(document.body, 'removeChild')

      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      }

      createElementSpy.mockReturnValue(mockAnchor)

      // Test SVG format
      // download_file(state, { format: 'svg', name: 'test' });
      const str = 'hello world'
      // const blob = new Blob([str], { type: 'image/svg+xml' })
      // const url = URL.createObjectURL(blob)
      download('test', 'image/svg+xml', { str })
      // expect(download).toHaveBeenCalledWith('test', 'image/svg+xml', { str: 'mocked-serialized-pattern' });

      // Test PNG format
      // download_file(state, { format: 'png', name: 'test' });
      // The image function is mocked to call the callback with 'mocked-blob'
      // and the download function is called with that blob
      // expect(download).toHaveBeenCalledWith('test.png', 'image/png', { url: 'mocked-blob' });

      // console.log(mockAnchor)
      expect(mockAnchor.click).toHaveBeenCalled()
      expect(mockAnchor.href).toBeTruthy()
      expect(mockAnchor.download).toBe('test.svg')

      // Cleanup
      // URL.revokeObjectURL(url)
    });
  });

  describe('download()', () => {
    let createElementSpy
    let appendChildSpy
    let removeChildSpy
    let createObjectURLSpy
    let anchorMock

    beforeEach(() => {
      anchorMock = {
        download: '',
        href: '',
        click: vi.fn(),
      }

      // createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchorMock)
      // appendChildSpy = vi.spyOn(document.body, 'appendChild')
      // removeChildSpy = vi.spyOn(document.body, 'removeChild')
      // createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://mock-url')
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('creates a Blob from string and triggers download with correct name and href', () => {
      download('test.txt', 'text/plain', { str: 'hello world' })

      expect(anchorMock.download).toBe('test.txt')
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(anchorMock.href).toBe('blob://mock-url')
      expect(anchorMock.click).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalledWith(anchorMock)
      expect(removeChildSpy).toHaveBeenCalledWith(anchorMock)
    })

    it('uses provided blob and skips string->blob conversion', () => {
      const testBlob = new Blob(['test'], { type: 'text/plain' })
      download('blob.txt', 'text/plain', { blob: testBlob })

      expect(createObjectURLSpy).toHaveBeenCalledWith(testBlob)
      expect(anchorMock.download).toBe('blob.txt')
      expect(anchorMock.click).toHaveBeenCalled()
    })

    it('uses provided URL if given', () => {
      download('url.txt', 'text/plain', { url: 'https://example.com/file.txt' })

      expect(anchorMock.href).toBe('https://example.com/file.txt')
      expect(createObjectURLSpy).not.toHaveBeenCalled()
    })
  })


  describe('upload_file', () => {
    test('should deserialize the uploaded file content', () => {
      const mockData = 'mocked-serialized-data';
      const result = upload_file(state, { str: mockData });

      const { deserializePattern } = require('../fileUtils');
      expect(deserializePattern).toHaveBeenCalledWith(mockData);
    });
  });

  describe('save_local', () => {
    test('should save the current pattern to localStorage', () => {
      const patternName = 'test-pattern';
      save_local(state, { name: patternName });

      expect(localStorage.setItem).toHaveBeenCalled();
      const [storeName, storeValue] = localStorage.setItem.mock.calls[0];
      expect(storeName).toBe('geodoodle');
      expect(JSON.parse(storeValue)[patternName]).toBeDefined();
    });
  });

  describe('load_local', () => {
    test('should load a pattern from localStorage', () => {
      const patternName = 'test-pattern';
      const mockPattern = { lines: [], bounds: [] };

      localStorage.getItem.mockReturnValueOnce(JSON.stringify({ [patternName]: 'mocked-serialized-data' }));

      const { deserializePattern } = require('../fileUtils');
      deserializePattern.mockReturnValueOnce(mockPattern);

      const result = load_local(state, { name: patternName });

      expect(localStorage.getItem).toHaveBeenCalledWith('geodoodle');
      expect(deserializePattern).toHaveBeenCalledWith('mocked-serialized-data');
      expect(result).toEqual(mockPattern);
    });
  });

  describe('copy_image', () => {
    test('should copy an image of the selection to clipboard', async () => {
      // Mock document.querySelector to return a mock element with getBBox
      const mockElement = { getBBox: () => ({ width: 100, height: 100 }) };
      document.querySelector = vi.fn().mockReturnValue(mockElement);

      // Mock the clipboard API
      const mockWrite = vi.fn();
      global.navigator.clipboard = { write: mockWrite };

      // Call with a selection
      const withSelection = {
        ...state,
        bounds: [new Point(0, 0), new Point(10, 10)]
      };

      await copy_image(withSelection);

      // Should call the image function with selectedOnly=true
      const { image } = require('../fileUtils');
      expect(image).toHaveBeenCalledWith(
        withSelection,
        'png',
        expect.any(Rect),
        false,
        true,
        expect.any(Function),
        true
      );

      // The clipboard write should have been called with the blob
      expect(mockWrite).toHaveBeenCalled();
    });
  });
});
 */
describe("UI Actions", () => {
  let state

  beforeEach(() => {
    state = getState()
  })

  describe("toggle_partials", () => {
    test("should toggle the partials flag", () => {
      const initialState = { ...state, partials: false }

      const afterFirstToggle = toggle_partials(initialState)
      expect(afterFirstToggle.partials).toBe(true)

      const afterSecondToggle = toggle_partials(afterFirstToggle)
      expect(afterSecondToggle.partials).toBe(false)
    })
  })

  describe("toggle_dots", () => {
    test("should toggle dot visibility", () => {
      const visibleState = { ...state, hideDots: false }

      const hiddenState = toggle_dots(visibleState)
      expect(hiddenState.hideDots).toBe(true)

      expect(toggle_dots({ ...visibleState, ...hiddenState }).hideDots).toBe(false)
    })
  })

  describe("apply_trellis", () => {
    test("moves the selected source into a persistent Trellis", () => {
      const line = new Line(state, new Point(1, 1), new Point(3, 3))
      const layer = state.layers[0].copy({
        lines: [line],
        bounds: [new Point(0, 0), new Point(4, 4)],
      })
      const source = { ...state, layers: [layer], lines: layer.lines, bounds: layer.bounds }

      const result = apply_trellis(source)

      expect(result.layers[0].trellis).not.toBeNull()
      expect(result.layers[0].trellis.lines).toHaveLength(1)
      expect(result.layers[0].lines).toHaveLength(0)
      expect(result.layers[0].bounds).toEqual([])
    })
  })

  describe("set_manual", () => {
    test("should set manual state values", () => {
      const updates = {
        someKey: "someValue",
        anotherKey: 123,
      }

      const newState = set_manual(state, updates)
      expect(newState).toEqual(updates)
    })
  })

  describe("menu", () => {
    test("should toggle a menu", () => {
      const newState = menu(state, { toggle: "extra" })
      expect(newState.openMenus.extra).toBe(!state.openMenus.extra)
    })

    test("should open a specific menu", () => {
      const newState = menu(state, { open: "color" })
      expect(newState.openMenus.color).toBe(true)
    })

    test("should close a specific menu", () => {
      const withOpenMenu = {
        ...state,
        openMenus: { ...state.openMenus, color: true },
      }

      const newState = menu(withOpenMenu, { close: "color" })
      expect(newState.openMenus.color).toBe(false)
    })

    test("should only allow one mini menu to be open at a time", () => {
      // Open the color menu
      const afterOpenColor = menu(state, { open: "color" })
      expect(afterOpenColor.openMenus.color).toBe(true)

      // Open the mirror menu - should close the color menu
      const afterOpenMirror = menu(afterOpenColor, { open: "mirror" })
      expect(afterOpenMirror.openMenus.color).toBe(false)
      expect(afterOpenMirror.openMenus.mirror).toBe(true)
    })

    test("restores non-repeat menus when the toolbar is reopened", () => {
      const withOpenMenus = {
        ...state,
        bounds: [new Point(0, 0), new Point(10, 10)],
        openMenus: { ...state.openMenus, color: true, navigation: true, repeat: true },
      }

      const afterHidingToolbar = menu(withOpenMenus, { toggle: "main" })
      expect(afterHidingToolbar.openMenus).toMatchObject({ main: false, color: false, navigation: false, repeat: true })
      expect(afterHidingToolbar.toolbarHiddenMenus).toEqual(["color", "navigation"])

      const afterShowingToolbar = menu({ ...withOpenMenus, ...afterHidingToolbar }, { toggle: "main" })
      expect(afterShowingToolbar.openMenus).toMatchObject({ main: true, color: true, navigation: true, repeat: true })
      expect(afterShowingToolbar.toolbarHiddenMenus).toEqual([])
    })

    test("does not restore menus when reopening the toolbar preference is disabled", () => {
      const withOpenMenu = {
        ...state,
        reopenMenusWithToolbar: false,
        openMenus: { ...state.openMenus, color: true },
      }

      const afterHidingToolbar = menu(withOpenMenu, { toggle: "main" })
      const afterShowingToolbar = menu({ ...withOpenMenu, ...afterHidingToolbar }, { toggle: "main" })

      expect(afterHidingToolbar.toolbarHiddenMenus).toEqual([])
      expect(afterShowingToolbar.openMenus.color).toBe(false)
    })
  })
})

describe("Tour Actions", () => {
  describe("start_tour", () => {
    test("should save the current state and return tour state", () => {
      const state = getState()
      const newState = start_tour(state)

      // Should return the tour state with home position
      expect(newState).toMatchObject(tourState(state))
    })
  })

  describe("end_tour", () => {
    test("should return the pre-tour state", () => {
      const preTourState = getState()
      // Set the preTourState by calling start_tour
      start_tour(preTourState)

      const result = end_tour({})
      expect(result).toEqual(preTourState)
    })
  })
})

// TODO come back to these
describe("Fill Actions", () => {
  describe("fill", () => {
    test("should fill the line", () => {
      const state = getDefaultTestingState()
      const newState = fill({ ...state, ...toggle_fill_mode(state) })
      expect(newState.filledPolys).toHaveLength(1)
    })
  })

  describe("toggle_fill_mode", () => {
    test("should toggle fill mode", () => {
      const state = getDefaultTestingState()
      const newState = toggle_fill_mode(state)
      expect(newState.fillMode).toBe(!state.fillMode)
      expect(newState.curPolys).toHaveLength(1)
      expect(newState.tempPolys).toHaveLength(1)
    })
  })

  describe("clear_fill", () => {
    test("should clear the fill", () => {
      const state = getDefaultTestingState()
      const newState = clear_fill({ ...state, ...fill({ ...state, ...toggle_fill_mode(state) }) })
      expect(newState.filledPolys).toHaveLength(0)
    })
  })
})
