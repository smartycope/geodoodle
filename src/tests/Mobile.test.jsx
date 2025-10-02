import { render, fireEvent, act } from '@testing-library/react';
import { test, it, expect, beforeEach, describe } from 'vitest';
import Paper from '../Paper';
import defaultOptions from '../options';

// import "../styling/App.css"
import "../styling/index.css"
import "../utils"
import {
  getLines,
  getCurLines,
  getBounds,
  scroll,
  mouseMove,
  mouseDown,
  mouseUp,
  getMatrixValues,
  mouseClick,
  createLine,
  press,
  mouseClickOn,
  saveHtml,
  renderPaper,
  getSelectionRect,
  setUpDefaultTestingState,
  getDefaultTestingState,
  getFilledPolys,
  getCurPolys,
  getCursorPos,
  state,
} from "../tests/testUtils"
import { toggle_fill_mode } from '../actions';
import Line from '../helper/Line';
import Point from '../helper/Point';


// In between each tests, reset the localStorage
beforeEach(() => {
  localStorage.clear();
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Mobile', () => {
    test('single tap moves cursor', () => {
        const { paper } = renderPaper();
        const cursor = getCursorPos(paper)
        fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: cursor.x + 50, pageY: cursor.y + 50 }] });
        fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: cursor.x + 50, pageY: cursor.y + 50 }] });
        expect(getCurLines(paper).length).toBe(0);
        expect(getCursorPos(paper).x).not.toBe(cursor.x);
        expect(getCursorPos(paper).y).not.toBe(cursor.y);
      });

  test('click and drag to create line', () => {
    const { paper } = renderPaper();
    fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: 100, pageY: 100 }] });
    fireEvent.touchMove(paper, { touches: [{ identifier: 1, pageX: 200, pageY: 200 }] });
    fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: 200, pageY: 200 }] });
    expect(getLines(paper).length).toBe(1);
  });

  test('double tap deletes lines', async () => {
    const { paper, container } = renderPaper();
    setUpDefaultTestingState(paper);
    const scale = 20;
    const x = 5 * scale;
    const y = 9 * scale;
    expect(getLines(container).length).toBe(4);
    fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    await wait(defaultOptions.holdTapTimeMS - 100);
    fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    expect(getLines(container).length).toBe(2);
  });

  test('slow double tap does nothing', async () => {
    const { paper, container } = renderPaper();
    setUpDefaultTestingState(paper);
    const scale = 20;
    const x = 5 * scale;
    const y = 9 * scale;
    expect(getLines(container).length).toBe(4);
    fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    // Wait for it to reset
    await wait(defaultOptions.holdTapTimeMS + 100);
    fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    expect(getLines(container).length).toBe(4);
  });

  // TODO: this isn't implemented yet
//   test('tap and drag creates 2 bounds', () => {
//     const { paper } = renderPaper();
//     setUpDefaultTestingState(paper, false);
//     expect(getBounds(paper).length).toBe(0);
//     const scale = 20;
//     fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: 4*scale, pageY: 9*scale }] });
//     fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: 4*scale, pageY: 9*scale }] });
//     await wait(50);
//     fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: 4*scale, pageY: 9*scale }] });
//     fireEvent.touchMove(paper, { touches: [{ identifier: 1, pageX: 6*scale, pageY: 13*scale }] });
//     fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: 6*scale, pageY: 13*scale }] });
//     expect(getBounds(paper).length).toBe(2);
//   });

  test('tap and hold creates a bound', async () => {
    const { paper } = renderPaper();
    setUpDefaultTestingState(paper, false);
    expect(getBounds(paper).length).toBe(0);
    const scale = 20;
    const x = 5 * scale;
    const y = 11 * scale;
    fireEvent.touchStart(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    await wait(defaultOptions.holdTapTimeMS + 100);
    fireEvent.touchEnd(paper, { touches: [{ identifier: 1, pageX: x, pageY: y }] });
    expect(getBounds(paper).length).toBe(1);
  });

  test('2 finger spread increases scale', () => {
    const { paper, container } = renderPaper();
    setUpDefaultTestingState(paper, false);
    // expect(getMatrixValues(paper).scale).toBe(1);
    const scale = 20;
    const x = 5 * scale;
    const y = 11 * scale;

    const centerX = 150
    const centerY = 150

    const finger1Start = { pageX: centerX, pageY: centerY }
    const finger2Start = { pageX: centerX, pageY: centerY }

    const finger1End = { pageX: centerX - 50, pageY: centerY - 50 }
    const finger2End = { pageX: centerX + 50, pageY: centerY + 50 }

    fireEvent.touchStart(paper, {
      touches: [
        { identifier: 1, ...finger1Start },
        { identifier: 2, ...finger2Start },
      ],
    })

    // saveHtml(container)

    fireEvent.touchMove(paper, {
        touches: [
            { identifier: 1, ...finger1End },
            { identifier: 2, ...finger2End },
        ],
    })

    // saveHtml(container)
    fireEvent.touchEnd(paper, {
        changedTouches: [
            { identifier: 1, ...finger1End },
            { identifier: 2, ...finger2End },
        ],
    })
    saveHtml(container)
    expect(state(paper).scalex).toBeGreaterThan(20);
  });

  test('2 finger pinch decreases scale', () => {
    const { paper } = renderPaper();
    setUpDefaultTestingState(paper, false);
    expect(state(paper).scalex).toBe(1);
    const scale = 20;
    const x = 5 * scale;
    const y = 11 * scale;

    const centerX = 150
    const centerY = 150

    const finger1Start = { pageX: centerX, pageY: centerY }
    const finger2Start = { pageX: centerX, pageY: centerY }

    const finger1End = { pageX: centerX + 50, pageY: centerY + 50 }
    const finger2End = { pageX: centerX - 50, pageY: centerY - 50 }

    fireEvent.touchStart(paper, {
      touches: [
        { identifier: 1, ...finger1Start },
        { identifier: 2, ...finger2Start },
      ],
    })

    fireEvent.touchMove(paper, {
      touches: [
        { identifier: 1, ...finger1End },
        { identifier: 2, ...finger2End },
      ],
    })

    fireEvent.touchEnd(paper, {
      changedTouches: [
        { identifier: 1, ...finger1End },
        { identifier: 2, ...finger2End },
      ],
    })
    expect(state(paper).scalex).toBeLessThan(20);
  });

  test('bounds dont get deleted when pinch or spread', () => {
    const { paper } = renderPaper();
    setUpDefaultTestingState(paper);
    expect(getBounds(paper).length).toBe(2);
    const scale = 20;
    const x = 5 * scale;
    const y = 11 * scale;

    const centerX = 150
    const centerY = 150

    const finger1Start = { pageX: centerX, pageY: centerY }
    const finger2Start = { pageX: centerX, pageY: centerY }

    const finger1End = { pageX: centerX + 50, pageY: centerY + 50 }
    const finger2End = { pageX: centerX - 50, pageY: centerY - 50 }

    // Create bounds first
    fireEvent.touchStart(paper, { pageX: x, pageY: y });
    fireEvent.touchMove(paper, { pageX: x + 10, pageY: y });
    fireEvent.touchEnd(paper, { pageX: x + 10, pageY: y });

    fireEvent.touchStart(paper, {
      touches: [
        { identifier: 1, ...finger1Start },
        { identifier: 2, ...finger2Start },
      ],
    })

    fireEvent.touchMove(paper, {
      touches: [
        { identifier: 1, ...finger1End },
        { identifier: 2, ...finger2End },
      ],
    })

    fireEvent.touchEnd(paper, {
      changedTouches: [
        { identifier: 1, ...finger1End },
        { identifier: 2, ...finger2End },
      ],
    })
    expect(getBounds(paper).length).toBe(2);
  });
});
