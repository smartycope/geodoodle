import { afterEach, describe, expect, test, vi } from "vitest"
import { getPreviousVisibleTourStep, prepareTourStep } from "../components/tour"

describe("tour navigation", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test("back navigation skips hidden auto-advance steps", () => {
    const steps = [
      { content: "First" },
      { autoAdvance: true, loadDelay: 10 },
      { content: "Second" },
      { autoAdvance: true, loadDelay: 10 },
      { autoAdvance: true, loadDelay: 20 },
      { content: "Third" },
    ]

    expect(getPreviousVisibleTourStep(steps, 5)).toBe(2)
    expect(getPreviousVisibleTourStep(steps, 2)).toBe(0)
    expect(getPreviousVisibleTourStep(steps, 0)).toBe(0)
  })

  test("replays a visible step's hidden setup before navigating back to it", () => {
    vi.useFakeTimers()
    const actions = []
    const done = vi.fn()
    const steps = [
      { content: "First" },
      { autoAdvance: true, loadDelay: 10, action: () => actions.push("open menu") },
      { autoAdvance: true, loadDelay: 20, action: () => actions.push("open control") },
      { content: "Second" },
    ]

    prepareTourStep(steps, 3, done)

    vi.advanceTimersByTime(10)
    expect(actions).toEqual(["open menu", "open control"])
    expect(done).not.toHaveBeenCalled()

    vi.advanceTimersByTime(20)
    expect(done).toHaveBeenCalledOnce()
  })
})
