import { render, fireEvent, act } from '@testing-library/react';
import Paper from '../Paper';
import defaultOptions from '../options';

// import "../styling/App.css"
import "../styling/index.css"
import "../utils"
import { getLines, 
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
} from "../tests/testUtils.js"

// In between each tests, reset the localStorage
beforeEach(() => {
  localStorage.clear();
});

describe('Paper interactions', () => {
  test('creates line by clicking two points', () => {
    const { container, paper } = renderPaper();
    mouseClick(paper, 100, 100)
    mouseMove(paper, 200, 200);
    mouseClick(paper, 200, 200)

    expect(getLines(container).length).toBe(1);
  });

  test('creates line by click and drag', () => {
    const { container, paper } = renderPaper();
    // Click and drag from (100,100) to (200,200)
    mouseDown(paper, 100, 100);
    mouseMove(paper, 150, 150, {buttons: 1});
    mouseUp(paper, 200, 200);
    mouseMove(paper, 200, 300);
    
    expect(getLines(container).length).toBe(1);
  });
  
  test('Ensure localstorage is cleared', () => {
    const { container } = renderPaper();
    createLine(paper);
    expect(getLines(container).length).toBe(1);
  });
  
  // This works... I don't think it should?...
  test('can delete line after scaling', () => {
    const { container, paper } = renderPaper();
    createLine(paper);
    // Sanity check
    expect(getLines(container).length).toBe(1);
    
    scroll(paper, -100, 0, {ctrlKey: true});
    // Delete the line
    mouseClick(getLines(container)[0], 0, 0, 1);
    expect(getLines(container).length).toBe(0);
  });

  // Test that using right click continues making new lines
  test('right click continues lines', () => {
    const { container, paper } = renderPaper();
    mouseClick(paper, 100, 100)
    mouseMove(paper, 200, 200);
    mouseClick(paper, 200, 200, 2)
    expect(getLines(container).length).toBe(1);
    expect(getCurLines(container).length).toBe(1);
    mouseMove(paper, 200, 300);
    mouseClick(paper, 200, 300)
    expect(getLines(container).length).toBe(2);
  });

  // Test that pressing b adds a bound
  test('b adds a bound', () => {
    const { container, paper } = renderPaper();
    press(paper, 'b')
    expect(getBounds(container).length).toBe(1);
  });

  // Test that making multiple bounds creates a selection rect
  test('multiple bounds create a selection rect', () => {
    const { container, paper } = renderPaper();
    press(paper, 'b')
    mouseMove(paper, 350, 300)
    press(paper, 'b')
    expect(getBounds(container).length).toBe(2);
    expect(getSelectionRect(container)).not.toBeNull();
  });

  // Test all the scroll events (regular translates vertically, shift translates horizontally, ctrl scales)
  test('scroll translates vertically', () => {
    const { container, paper } = renderPaper();
    const {x, y} = getMatrixValues(container);
    scroll(paper);
    const {x: x2, y: y2} = getMatrixValues(container);
    expect(Number(x2)).toBe(Number(x));
    expect(Number(y2)).toBe(Number(y + 100 * defaultOptions.scrollSensitivity));
  });
  test('shift+scroll translates horizontally', () => {
    const { container, paper } = renderPaper();
    const {x, y} = getMatrixValues(container);
    scroll(paper, -100, 0, {shiftKey: true});
    const {x: x2, y: y2} = getMatrixValues(container);
    expect(Number(x2)).toBe(Number(x + 100 * defaultOptions.scrollSensitivity));
    expect(Number(y2)).toBe(Number(y));
  });
  test('horizontal scroll translates horizontally', () => {
    const { container, paper } = renderPaper();
    const {x, y} = getMatrixValues(container);
    scroll(paper, 0, -100);
    const {x: x2, y: y2} = getMatrixValues(container);
    expect(Number(x2)).toBe(Number(x + 100 * defaultOptions.scrollSensitivity));
    expect(Number(y2)).toBe(Number(y));
  });
  test('ctrl+scroll scales', () => {
    const { container, paper } = renderPaper();
    const {width, height} = getMatrixValues(container);
    scroll(paper, -100 * defaultOptions.scrollSensitivity, 0, {ctrlKey: true});
    const {width: width2, height: height2} = getMatrixValues(container);
    // The precise amount it scales is complicated, so just check that it's not the same
    expect(Number(width2)).not.toBe(Number(width));
    expect(Number(height2)).not.toBe(Number(height));
  });
  // test('clicking on the main menu opens it', () => {
  //   const { container, paper } = renderPaper();
  //   // mouseClickOn(paper, document.getElementById('menu-selector-mobile'))
  //   mouseClickOn(paper, container.querySelector('#menu-selector-mobile'))
  //   saveHtml(container)
  // });
});
