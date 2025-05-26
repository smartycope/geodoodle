import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cursor_moved,
  fill,
  clear_fill,
  toggle_fill_mode,
  translate,
  scale,
  rotate,
  increase_scale,
  decrease_scale,
  go_home,
  go_to_selection,
  left, right, up, down,
  clear, clear_bounds, delete_selected, delete_unselected, delete_line, delete_at_cursor, nevermind,
  add_line, continue_line, add_bound,
  undo, redo,
  cancel_clipboard, paste, copy, cut,
  increment_clipboard_rotation, increment_clipboard_mirror_axis,
  download_file, upload_file, save_local, load_local, copy_image,
  start_tour, end_tour,
  toggle_partials, toggle_dark_mode,
  set_manual,
  menu,
  debug, toggle_debugging
} from '../actions';
import Point from '../helper/Point';
import Dist from '../helper/Dist';
import Line from '../helper/Line';
import Rect from '../helper/Rect';
import { getDefaultTestingState, getState } from './testUtils';
import { MIRROR_AXIS } from '../globals';
import defaultOptions from '../options';
import * as utils from '../utils.jsx';
import { tourState } from '../states';


vi.spyOn(utils, 'toggleDarkMode');

// Mock the global objects and functions
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = mockLocalStorage;

// Mock the clipboard API
global.navigator.clipboard = {
  write: vi.fn(),
};

// vitest.setup.ts or at top of your test file
globalThis.ClipboardItem = class {
  constructor(items) {
    this.items = items
  }
}


// Mock the document.querySelector
global.document.querySelector = vi.fn(() => ({
  getBBox: () => ({ width: 100, height: 100 }),
}));

// Mock the download and image functions
vi.mock('../fileUtils', () => ({
  download: vi.fn(),
  image: vi.fn((state, format, rect, includeBackground, selectedOnly, callback) => {
    // Simulate image creation with a callback
    if (callback) {
      callback('mocked-blob');
    }
    return 'mocked-image-url';
  }),
  serializePattern: vi.fn(() => 'mocked-serialized-pattern'),
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
}));

describe('Transformation Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
  });

  describe('cursor_moved', () => {
    test('should update cursor position and set boundDragging to true', () => {
      const point = new Point(50, 50);
      const newState = cursor_moved(state, { point });

      expect(newState.cursorPos).toEqual(point.align(state));
      expect(newState.boundDragging).toBe(true);
      expect(newState.debugDrawPoints.Mouse).toBeDefined();
    });
  });

  describe('translate', () => {
    test('should translate the viewport by the given amount', () => {
      const amt = new Dist(10, 20);
      const newState = translate(state, { amt });

      expect(newState.translation).toEqual(state.translation.add(amt));
    });

    test('should not translate if it would move selection out of viewport when repeating', () => {
      const boundRect = new Rect(new Point(0, 0), new Point(100, 100));
      const amt = new Dist(1000, 1000); // Large translation that would move out of viewport

      const stateWithBounds = {
        ...state,
        boundRect,
        trellis: true // Enable repeating
      };

      const newState = translate(stateWithBounds, { amt });
      expect(newState).toBeUndefined();
    });
  });

  describe('scale', () => {
    test('should scale the viewport around the center point', () => {
      const center = new Point(50, 50);
      const newState = scale(state, { amtx: 0.5, amty: 0.5, center });

      expect(newState.scalex).toBeGreaterThan(state.scalex);
      expect(newState.scaley).toBeGreaterThan(state.scaley);
      expect(newState.translation).toBeDefined();
    });

    test('should respect min and max scale limits', () => {
      // Test minimum scale
      const minScaleState = { ...state, scalex: defaultOptions.minScale, scaley: defaultOptions.minScale };
      const minScaleResult = scale(minScaleState, { amtx: -1, amty: -1 });
      expect(minScaleResult.scalex).toBe(defaultOptions.minScale);

      // Test maximum scale
      const maxScaleState = { ...state, scalex: defaultOptions.maxScale, scaley: defaultOptions.maxScale };
      const maxScaleResult = scale(maxScaleState, { amtx: 1, amty: 1 });
      expect(maxScaleResult.scalex).toBe(defaultOptions.maxScale);
    });
  });

  describe('rotate', () => {
    test('should rotate the viewport by the given amount', () => {
      const newState = rotate(state, { amt: 90 });
      expect(newState.rotate).toBe(state.rotate + 90);
    });
  });

  describe('go_home', () => {
    test('should reset the viewport to default position and scale', () => {
      const translatedState = {
        ...state,
        translation: new Dist(100, 100),
        scalex: 2,
        scaley: 2,
        rotate: 45,
        shearx: 0.5,
        sheary: 0.5
      };

      const newState = go_home(translatedState);

      expect(newState.translation).toEqual(Dist.zero());
      expect(newState.scalex).toBe(translatedState.defaultScalex);
      expect(newState.scaley).toBe(translatedState.defaultScaley);
      expect(newState.rotate).toBe(0);
      expect(newState.shearx).toBe(0);
      expect(newState.sheary).toBe(0);
    });
  });
});

describe('Navigation Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
  });

  describe('go_to_selection', () => {
    test('should center the viewport on the selection', () => {
      // const selectionRect = new Rect(new Point(100, 100), new Point(200, 200));
      const stateWithSelection = {
        ...state,
        // getBoundRect: () => selectionRect,
        bounds: [new Point(100, 100), new Point(200, 200)],
        viewportWidth: () => 800,
        viewportHeight: () => 600
      };

      const newState = go_to_selection(stateWithSelection);

      // The translation should center the selection in the viewport
      expect(newState.translation).toBeDefined();
      expect(newState.translation._x).toBe(-124.4);
      expect(newState.translation._y).toBe(-130.8);

    });

    test('should return undefined if there is no selection', () => {
      const stateWithoutSelection = {
        ...state,
        bounds: [],
      };

      const newState = go_to_selection(stateWithoutSelection);
      expect(newState).toBeUndefined();
    });
  });

  describe('directional navigation', () => {
    test('should move cursor left', () => {
      const newState = left(state);
      expect(newState.cursorPos._x).toBeLessThan(state.cursorPos._x);
    });

    test('should move cursor right', () => {
      const newState = right(state);
      expect(newState.cursorPos._x).toBeGreaterThan(state.cursorPos._x);
    });

    test('should move cursor up', () => {
      const newState = up(state);
      expect(newState.cursorPos._y).toBeLessThan(state.cursorPos._y);
    });

    test('should move cursor down', () => {
      const newState = down(state);
      expect(newState.cursorPos._y).toBeGreaterThan(state.cursorPos._y);
    });
  });
});

describe('Deletion Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
    // Add some test lines and bounds
    state.lines = [
      new Line(state, new Point(0, 0), new Point(10, 10)),
      new Line(state, new Point(20, 20), new Point(30, 30)),
    ];
    state.bounds = [new Point(5, 5), new Point(25, 25)];
  });

  describe('clear', () => {
    test('should clear all lines and bounds', () => {
      const newState = clear(state);
      expect(newState.lines).toHaveLength(0);
      expect(newState.bounds).toHaveLength(0);
      expect(newState.openMenus.delete).toBe(false);
      expect(newState.openMenus.repeat).toBe(false);
    });
  });

  describe('clear_bounds', () => {
    test('should clear all bounds and cancel clipboard', () => {
      const newState = clear_bounds(state);
      expect(newState.bounds).toHaveLength(0);
      expect(newState.clipboard).toBeNull();
    });
  });

  describe('delete_selected', () => {
    test('should delete selected lines', () => {
      // Set up a selection
      const selectedState = {
        ...state,
        bounds: [new Point(0, 0), new Point(15, 15)],
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
      };

      const newState = delete_selected(selectedState);
      expect(newState.lines).toHaveLength(1); // Only one line should remain
      // TODO:
      // expect(newState.bounds).toHaveLength(0); // Bounds should be cleared
    });
  });

  describe('delete_unselected', () => {
    test('should delete unselected lines', () => {
      // Set up a selection
      const selectedState = {
        ...state,
        bounds: [new Point(0, 0), new Point(15, 15)],
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
      };

      const newState = delete_unselected(selectedState);
      expect(newState.lines).toHaveLength(1); // Only the selected line should remain
      // TODO:
      // expect(newState.bounds).toHaveLength(0); // Bounds should be cleared
    });
  });

  describe('delete_line', () => {
    test('should delete a line under cursor', () => {
      const cursorAtLine = {
        ...state,
        eraser: new Point(0, 0),
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        cursorPos: new Point(10, 10) // On the first line
      };

      const newState = delete_line(cursorAtLine);
      expect(newState.lines).toHaveLength(1); // One line should be removed
    });

    test('should not delete a line under cursor if eraser is not active', () => {
      const cursorAtLine = {
        ...state,
        eraser: null,
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        cursorPos: new Point(10, 10) // On the first line
      };

      const newState = delete_line(cursorAtLine);
      expect(newState.lines).toHaveLength(2); // One line should be removed
    });

    test('should remove a bound if clicked on it', () => {
      const cursorAtBound = {
        ...state,
        cursorPos: new Point(5, 5) // On a bound
      };

      const newState = delete_line(cursorAtBound);
      expect(newState.bounds).toHaveLength(1); // One bound should be removed
    });
  });

  describe('delete_at_cursor', () => {
    test('should delete a line under cursor', () => {
      const cursorAtLine = {
        ...state,
        cursorPos: new Point(10, 10), // On the first line
        lines: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
      };

      const newState = delete_at_cursor(cursorAtLine);
      expect(newState.lines).toHaveLength(1); // One line should be removed
    });

    test('should clear clipboard if one exists', () => {
      const withClipboard = {
        ...state,
        clipboard: { some: 'data' }
      };

      const newState = delete_at_cursor(withClipboard);
      expect(newState.clipboard).toBeNull();
    });
  });

  describe('nevermind', () => {
    test('should cancel clipboard if one exists', () => {
      const withClipboard = {
        ...state,
        clipboard: { some: 'data' }
      };

      const newState = nevermind(withClipboard);
      expect(newState.clipboard).toBeNull();
    });

    test('should clear current line if one is being drawn', () => {
      const withCurLine = {
        ...state,
        curLinePos: new Point(10, 10)
      };

      const newState = nevermind(withCurLine);
      expect(newState.curLinePos).toBeNull();
    });

    test('should clear bounds if they exist', () => {
      const withBounds = {
        ...state,
        bounds: [new Point(5, 5)]
      };

      const newState = nevermind(withBounds);
      expect(newState.bounds).toHaveLength(0);
    });
  });
});

describe('Line Creation Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
    state.lines = [];
    state.cursorPos = new Point(100, 100);
  });

  describe('add_line', () => {
    test('should add a new line between two points', () => {
      const withStartPoint = {
        ...state,
        curLinePos: new Point(50, 50)
      };

      const newState = add_line(withStartPoint, {});
      expect(newState.lines).toHaveLength(1);
      expect(newState.curLinePos).toBeNull();
    });

    test('should paste clipboard content if clipboard exists', () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        lines: []
      };

      // Mock the paste function
      // const originalPaste = paste;
      // const mockPaste = vi.fn(() => ({ lines: [new Line(state, new Point(0, 0), new Point(10, 10)), new Line(state, new Point(20, 20), new Point(30, 30))] }));
      // global.paste = mockPaste;

      const newState = add_line(withClipboard, {});

      // expect(mockPaste).toHaveBeenCalled();
      expect(newState.lines).toHaveLength(2);

      // Restore original
      // global.paste = originalPaste;
    });
  });

  describe('continue_line', () => {
    test('should continue a line from the last point', () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        curLinePos: new Point(50, 50)
      };

      const newState = continue_line(withClipboard);
      expect(newState.curLinePos).toEqual(withClipboard.curLinePos);
    });

    test('should start a new line from cursor if no clipboard', () => {
      const newState = continue_line(state);
      expect(newState.curLinePos).toEqual(state.cursorPos);
    });
  });

  describe('add_bound', () => {
    test('should add a bound at cursor position', () => {
      const newState = add_bound(state);
      expect(newState.bounds).toContainEqual(state.cursorPos);
    });

    test('should remove bound if clicked on existing one', () => {
      const withBound = {
        ...state,
        bounds: [state.cursorPos]
      };

      const newState = add_bound(withBound);
      expect(newState.bounds).not.toContainEqual(state.cursorPos);
    });

    test('should create a selection rect with exactly two bounds', () => {
      // First bound
      const afterFirstBound = add_bound(state);
      expect(afterFirstBound.bounds).toHaveLength(1);

      // Second bound
      const secondPoint = new Point(200, 200);
      const afterSecondBound = add_bound({
        ...afterFirstBound,
        cursorPos: secondPoint
      });

      expect(afterSecondBound.bounds).toHaveLength(2);
    });
  });
});

describe('Clipboard Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
    state.lines = [
      new Line(state, new Point(0, 0), new Point(10, 10), {}, {}, true),
      new Line(state, new Point(20, 20), new Point(30, 30), {}, {}, true),
    ];
    state.bounds = [new Point(0, 0), new Point(30, 30)];
  });

  describe('cancel_clipboard', () => {
    test('should clear all clipboard-related state', () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        clipboardMirrorAxis: MIRROR_AXIS.VERT_90,
        clipboardRotation: 90,
        clipboardOffset: new Dist(10, 10)
      };

      const newState = cancel_clipboard(withClipboard);

      expect(newState.clipboard).toBeNull();
      expect(newState.clipboardMirrorAxis).toBeNull();
      expect(newState.clipboardRotation).toBe(0);
      expect(newState.clipboardOffset).toBeNull();
    });
  });

  describe('copy', () => {
    test('should set clipboard with selected lines', () => {
      const newState = copy(state);

      expect(newState.clipboard).toBeDefined();
      expect(newState.curLinePos).toBeNull();
      expect(newState.clipboardOffset).toBeDefined();
    });
  });

  describe('cut', () => {
    test('should copy and delete selected lines', () => {
      const newState = cut(state);

      expect(newState.clipboard).toBeDefined();
      expect(newState.lines).toHaveLength(0); // All lines were in the selection
      expect(newState.bounds).toHaveLength(0); // Bounds should be cleared
    });
  });

  describe('paste', () => {
    test('should add clipboard lines to the document', () => {
      const withClipboard = {
        ...state,
        clipboard: [
          new Line(state, new Point(0, 0), new Point(10, 10)),
          new Line(state, new Point(20, 20), new Point(30, 30)),
        ],
        lines: []
      };

      const newState = paste(withClipboard);
      expect(newState.lines).toEqual(withClipboard.clipboard);
    });
  });

  describe('increment_clipboard_rotation', () => {
    test('should rotate clipboard by 90 degrees', () => {
      const withClipboard = { ...state, clipboardRotation: 0 };
      let newState = increment_clipboard_rotation(withClipboard);
      expect(newState.clipboardRotation).toBe(90);

      newState = increment_clipboard_rotation(newState);
      expect(newState.clipboardRotation).toBe(180);

      newState = increment_clipboard_rotation(newState);
      expect(newState.clipboardRotation).toBe(270);

      newState = increment_clipboard_rotation(newState);
      expect(newState.clipboardRotation).toBe(0); // Wraps around
    });
  });

  describe('increment_clipboard_mirror_axis', () => {
    test('should cycle through mirror axes', () => {
      const withClipboard = { ...state, clipboardMirrorAxis: null };

      let newState = increment_clipboard_mirror_axis(withClipboard);
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.VERT_90);

      newState = increment_clipboard_mirror_axis(newState);
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.HORZ_180);

      newState = increment_clipboard_mirror_axis(newState);
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.BOTH_360);

      newState = increment_clipboard_mirror_axis(newState);
      expect(newState.clipboardMirrorAxis).toBe(MIRROR_AXIS.VERT_90); // Wraps around
    });
  });
});

// TODO: file action tests
/*
describe('File Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
    vi.clearAllMocks();
  });

  describe('download_file', () => {
    test('should call appropriate download function based on format', () => {
      const { download } = require('../fileUtils');

      // Test SVG format
      download_file(state, { format: 'svg', name: 'test' });
      expect(download).toHaveBeenCalledWith('test', 'image/svg+xml', { str: 'mocked-serialized-pattern' });

      // Test PNG format
      download_file(state, { format: 'png', name: 'test' });
      // The image function is mocked to call the callback with 'mocked-blob'
      // and the download function is called with that blob
      expect(download).toHaveBeenCalledWith('test.png', 'image/png', { url: 'mocked-blob' });
    });
  });

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

describe('UI Actions', () => {
  let state;

  beforeEach(() => {
    state = getState();
  });

  describe('toggle_partials', () => {
    test('should toggle the partials flag', () => {
      const initialState = { ...state, partials: false };

      const afterFirstToggle = toggle_partials(initialState);
      expect(afterFirstToggle.partials).toBe(true);

      const afterSecondToggle = toggle_partials(afterFirstToggle);
      expect(afterSecondToggle.partials).toBe(false);
    });
  });

  describe('toggle_dark_mode', () => {

    test('should toggle dark mode', () => {
      // utils.toggleDarkMode.mockReturnValueOnce(true);

      const newState = toggle_dark_mode(state);
      expect(newState).toBeFalsy(); // The actual state update happens in the toggleDarkMode function
      expect(utils.toggleDarkMode).toHaveBeenCalled();
    });
  });

  describe('set_manual', () => {
    test('should set manual state values', () => {
      const updates = {
        someKey: 'someValue',
        anotherKey: 123
      };

      const newState = set_manual(state, updates);
      expect(newState).toEqual(updates);
    });
  });

  describe('menu', () => {
    test('should toggle a menu', () => {
      const newState = menu(state, { toggle: 'extra' });
      expect(newState.openMenus.extra).toBe(!state.openMenus.extra);
    });

    test('should open a specific menu', () => {
      const newState = menu(state, { open: 'color' });
      expect(newState.openMenus.color).toBe(true);
    });

    test('should close a specific menu', () => {
      const withOpenMenu = {
        ...state,
        openMenus: { ...state.openMenus, color: true }
      };

      const newState = menu(withOpenMenu, { close: 'color' });
      expect(newState.openMenus.color).toBe(false);
    });

    test('should only allow one mini menu to be open at a time', () => {
      // Open the color menu
      const afterOpenColor = menu(state, { open: 'color' });
      expect(afterOpenColor.openMenus.color).toBe(true);

      // Open the mirror menu - should close the color menu
      const afterOpenMirror = menu(afterOpenColor, { open: 'mirror' });
      expect(afterOpenMirror.openMenus.color).toBe(false);
      expect(afterOpenMirror.openMenus.mirror).toBe(true);
    });
  });
});

describe('Tour Actions', () => {
  describe('start_tour', () => {
    test('should save the current state and return tour state', () => {
      const state = getState();
      const newState = start_tour(state);

      // Should return the tour state with home position
      expect(newState).toMatchObject(tourState(state));
    });
  });

  describe('end_tour', () => {
    test('should return the pre-tour state', () => {
      const preTourState = getState();
      // Set the preTourState by calling start_tour
      start_tour(preTourState);

      const result = end_tour({});
      expect(result).toEqual(preTourState);
    });
  });
});


// TODO come back to these
describe('Fill Actions', () => {
  describe('fill', () => {
    test('should fill the line', () => {
      const state = getDefaultTestingState();
      const newState = fill({...state, ...toggle_fill_mode(state)});
      expect(newState.filledPolys).toHaveLength(1);
    });
  });

  describe('toggle_fill_mode', () => {
    test('should toggle fill mode', () => {
      const state = getDefaultTestingState();
      const newState = toggle_fill_mode(state);
      expect(newState.fillMode).toBe(!state.fillMode);
      expect(newState.curPolys).toHaveLength(1);
      expect(newState.tempPolys).toHaveLength(1);
    });
  })

  describe('clear_fill', () => {
    test('should clear the fill', () => {
      const state = getDefaultTestingState();
      const newState = clear_fill({...state, ...fill({...state, ...toggle_fill_mode(state)})})
      expect(newState.filledPolys).toHaveLength(0);
    });
  })
})