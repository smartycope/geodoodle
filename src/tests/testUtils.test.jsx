// Test the test utils

import { renderPaper, mouseDown, mouseMove, state, setUpDefaultTestingState, getLines, getCursorPos, saveHtml } from "./testUtils";

test('renderPaper', () => {
    const { paper } = renderPaper();
    expect(paper).toBeDefined();
});

test('setUpDefaultTestingState', () => {
    const { paper } = renderPaper();
    setUpDefaultTestingState(paper)
    expect(getLines(paper).length).toBe(4);
    const scale = 20;
    expect(getCursorPos(paper).x).toBe(5*scale);
    expect(getCursorPos(paper).y).toBe(11*scale);
})

test('state', () => {
    const { paper, container } = renderPaper();
    setUpDefaultTestingState(paper)
    // Start creating a line so there's a curline to test
    mouseDown(paper, 100, 100);
    mouseMove(paper, 20, 300);
    const s = state(container)
    expect(s).toBeDefined();
    const {x, y} = s.cursorPos.asSvg(s)
    expect(x).toBe(20);
    expect(y).toBe(300);
    expect(s.scalex).toBe(20);
    expect(s.scaley).toBe(20);
    expect(s.fill).toBe(false);
    expect(s.tempPolys).toBeDefined();
    expect(s.curPolys).toBeDefined();
    expect(s.filledPolys).toBeDefined();
    expect(s.lines).toBeDefined();
    const {x: cx, y: cy} = s.curLinePos.asSvg(s)
    expect(cx).toBe(5);
    expect(cy).toBe(11);
    expect(s.hideDots).toBe(false);
    expect(s.bounds.length).toBe(2);
    expect(s.trellis).toBeDefined();
    expect(s.clipboard).toBeDefined();
});