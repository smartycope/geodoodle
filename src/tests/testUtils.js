import fs from 'fs';
import { render, fireEvent } from '@testing-library/react';
import Paper from '../Paper';
import "../styling/index.css";
import getInitialState from '../states';

export function renderPaper(startPoint=[100, 100]) {
  const rendered = render(<Paper setDispatch={() => {}} />);
  const paper = rendered.container.querySelector('#paper');
  mouseMove(paper, ...startPoint);
  return { paper, ...rendered };
}


// Helpers to get parts of the Paper
export function getLines(container) {
  return container.querySelectorAll('#lines > line');
}

export function getCurLines(container) {
  return container.querySelectorAll('#cur-lines > line');
}

export function getBounds(container) {
  return container.querySelectorAll('#bounds > rect');
}

export function getSelectionRect(container) {
  return container.querySelector('#selection-rect');
}

export function getMatrixValues(container) {
  const dots = container.querySelector('#dots')
  return {
    x: Number(dots.getAttribute('x')),
    y: Number(dots.getAttribute('y')),
    width: Number(dots.getAttribute('width')),
    height: Number(dots.getAttribute('height')),
    // rotation: dots.getAttribute('transform').match(/\d+/g).map(Number)
  }
}

// Event helpers
export function scroll(target, deltaY = -100, deltaX = 0, props={}) {
  fireEvent.wheel(target, { deltaY, deltaX, ...props });
}

export function mouseMove(paper, x, y, props={}) {
  const rect = paper.getBoundingClientRect();
  fireEvent.mouseMove(paper, { clientX: x + rect.left, clientY: y + rect.top, ...props});
}

export function mouseDown(paper, x, y, button=0, props={}) {
  const rect = paper.getBoundingClientRect();
  fireEvent.mouseDown(paper, { clientX: x + rect.left, clientY: y + rect.top, button, ...props });
}

export function mouseUp(paper, x, y, button=0, props={}) {
  const rect = paper.getBoundingClientRect();
  fireEvent.mouseUp(paper, { clientX: x + rect.left, clientY: y + rect.top, button, ...props });
}

export function mouseClick(paper, x, y, button=0, props={}) {
  mouseDown(paper, x, y, button, props);
  mouseUp(paper, x, y, button, props);
}

export function mouseClickOn(paper, object) {
  fireEvent.click(object);
}

export function createLine(paper, x1=100, y1=100, x2=200, y2=200) {
  mouseMove(paper, x1, y1);
  mouseClick(paper, x1, y1);
  mouseMove(paper, x2, y2);
  mouseClick(paper, x2, y2);
}

export function press(paper, key) {
  fireEvent.keyDown(paper, { key });
  fireEvent.keyUp(paper, { key });
}


// For debugging tests, so I can just *look* at it and see what's going on
export function saveHtml(container) {
  // TODO: format the HTML nicely
  const formattedHtml = container.innerHTML
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
    <div id="root">${formattedHtml}</div>
</body>
</html>
`;
  fs.writeFileSync('test.html', fullHtml);
}

// A standard function for whenever we need just an average state
export function getState() {
  return getInitialState();
}

