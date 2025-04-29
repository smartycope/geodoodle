import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import Paper from '../Paper';
import fs from 'fs';
// import "../styling/App.css"
import "../styling/index.css"
import "../utils"

// Helper to find SVG lines
function getLines(container) {
  return container.querySelectorAll('#lines > line');
}

// Helper to simulate ctrl+scroll (wheel event)
function ctrlScroll(target, deltaY = -100) {
  fireEvent.wheel(target, { ctrlKey: true, deltaY });
}

// These should be 1 function with a parameter, but parameters stopped working???
function mouseMove(paper, x, y, props={}) {
  const rect = paper.getBoundingClientRect();
  fireEvent.mouseMove(paper, { clientX: x + rect.left, clientY: y + rect.top, ...props});
}

function mouseDown(paper, x, y, button=0, props={}) {
  const rect = paper.getBoundingClientRect();
  fireEvent.mouseDown(paper, { clientX: x + rect.left, clientY: y + rect.top, button, ...props });
}

function mouseUp(paper, x, y, button=0, props={}) {
  const rect = paper.getBoundingClientRect();
  fireEvent.mouseUp(paper, { clientX: x + rect.left, clientY: y + rect.top, button, ...props });
}

function mouseClick(paper, x, y, button=0, props={}) {
  mouseDown(paper, x, y, button, props);
  mouseUp(paper, x, y, button, props);
}

function createLine(paper, x1=100, y1=100, x2=200, y2=200) {
  mouseMove(paper, x1, y1);
  mouseClick(paper, x1, y1);
  mouseMove(paper, x2, y2);
  mouseClick(paper, x2, y2);
}

// For debugging tests, so I can just *look* at it and see what's going on
function saveHtml(container) {
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rendered Component</title>
    <link rel="stylesheet" href="src/styling/index.css">
</head>
<body>
    <div id="root">${container.innerHTML}</div>
</body>
</html>
`;
  fs.writeFileSync('test.html', fullHtml);
}

// In between each tests, reset the localStorage
beforeEach(() => {
  localStorage.clear();
});

describe('Paper interactions', () => {
  test('creates line by clicking two points', () => {
    const { container } = render(<Paper setDispatch={() => {}} />);
    const paper = container.querySelector('#paper');

    mouseMove(paper, 100, 100);
    mouseClick(paper, 100, 100)
    mouseMove(paper, 200, 200);
    mouseClick(paper, 200, 200)

    expect(getLines(container).length).toBe(1);
  });

  test('creates line by click and drag', () => {
    const { container } = render(<Paper setDispatch={() => {}} />);
    const paper = container.querySelector('#paper');
    // Click and drag from (100,100) to (200,200)
    mouseMove(paper, 100, 100);
    mouseDown(paper, 100, 100);
    mouseMove(paper, 150, 150, {buttons: 1});
    mouseUp(paper, 200, 200);
    mouseMove(paper, 200, 300);
    
    expect(getLines(container).length).toBe(1);
  });
  
  test('Ensure localstorage is cleared', () => {
    const { container } = render(<Paper setDispatch={() => {}} />);
    const paper = container.querySelector('#paper');
    createLine(paper);
    expect(getLines(container).length).toBe(1);
  });
  
  // This works... I don't think it should?...
  test('can delete line after scaling', () => {
    const { container } = render(<Paper setDispatch={() => {}} />);
    const paper = container.querySelector('#paper');
    createLine(paper);
    // Sanity check
    expect(getLines(container).length).toBe(1);
    
    ctrlScroll(paper);
    // Delete the line
    mouseClick(getLines(container)[0], 0, 0, 1);
    expect(getLines(container).length).toBe(0);
  });
});
