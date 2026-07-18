import { render, fireEvent, act } from "@testing-library/react"
import { test, it, expect, beforeEach, describe } from "vitest"
import Paper from "../Paper"
import defaultOptions from "../options"

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
} from "../tests/testUtils"
import { toggle_fill_mode } from "../actions"
import Line from "../helper/Line"
import Point from "../helper/Point"
import { validateStorage } from "../fileUtils"

// In between each tests, reset the localStorage
beforeEach(() => {
  localStorage.clear()
  // Then readd whatever we need
  validateStorage()
})

// TODO:
describe("Fill", () => {
  test("can see fill on entering fill mode", () => {
    const { container, paper } = renderPaper()
    setUpDefaultTestingState(paper)
    press(paper, "f")
    expect(getFilledPolys(container)).toHaveLength(0)
    expect(getCurPolys(container)).toHaveLength(1)
  })

  test("can fill a space", () => {
    const { container, paper } = renderPaper()
    setUpDefaultTestingState(paper)
    press(paper, "f")
    const scale = 20
    mouseClick(paper, 5 * scale, 11 * scale)
    expect(getCurPolys(container)).toHaveLength(1)
  })

  test("can use intersections to make polygons", () => {
    let state = getDefaultTestingState()
    state = { ...state, lines: [...state.lines, new Line(state, new Point(7, 9), new Point(3, 13))] }
    state = toggle_fill_mode(state)
    expect(state.tempPolys.length).toBe(2)
  })
  test("previews one fill space when mirroring is not enabled", () => {
    const { container, paper } = renderPaper()
    setUpDefaultTestingState(paper)
    press(paper, "f")
    expect(getCurPolys(container)).toHaveLength(1)
  })

  // TODO:
  // test("can fill in multiple spaces whmen mirroring", () => {
  //   const { container, paper } = renderPaper()
  //   press(paper, "m")
  //   setUpDefaultTestingState(paper)
  //   press(paper, "f")
  //   const scale = 20
  //   mouseClick(paper, 5 * scale, 11 * scale)
  //   expect(getFilledPolys(container)).toHaveLength(2)
  // })

  // TODO:
  test("can fill in multiple spaces when repeating", () => {
    const { container, paper } = renderPaper()
    setUpDefaultTestingState(paper)
    press(paper, "r")
    press(paper, "f")
    const scale = 20
    mouseClick(paper, 5 * scale, 11 * scale)
    expect(container.querySelectorAll("polygon").length).toBeGreaterThan(3)
  })

  test("can fill multiple different colors", () => {
    const { container, paper } = renderPaper()
    setUpDefaultTestingState(paper)
    // Add another closed polygon
    const scale = 20
    const a = { x: 10 * scale, y: 12 * scale }
    const b = { x: 20 * scale, y: 12 * scale }
    const c = { x: 20 * scale, y: 10 * scale }
    const d = { x: 10 * scale, y: 10 * scale }
    createLine(paper, a.x, a.y, b.x, b.y)
    createLine(paper, b.x, b.y, c.x, c.y)
    createLine(paper, c.x, c.y, d.x, d.y)
    createLine(paper, d.x, d.y, a.x, a.y)

    const p1 = { x: 90, y: 190 }
    const p2 = { x: 11 * scale, y: 11 * scale }
    press(paper, "f")
    mouseMove(paper, p1.x, p1.y)
    saveHtml(container)
    //
    // press(paper, "r")
    // press(paper, "f")
    // const scale = 20
    // mouseClick(paper, 5 * scale, 11 * scale)
    // expect(container.querySelectorAll("polygon").length).toBeGreaterThan(3)
  })
})
