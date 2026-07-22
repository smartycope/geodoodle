import { afterEach, describe, expect, test } from "vitest"
import { extraSlots } from "../utils/misc"
import { getExtraMenuButtons, getToolbarButtons, toolbarButtons } from "../options"

const originalVisualViewport = Object.getOwnPropertyDescriptor(window, "visualViewport")
const buttonId = (button) => button.menu ?? button.component

afterEach(() => {
  if (originalVisualViewport) Object.defineProperty(window, "visualViewport", originalVisualViewport)
  else delete window.visualViewport
})

describe("toolbar button availability", () => {
  test.each([
    ["narrow horizontal", "top", 400, 768],
    ["small horizontal", "top", 520, 768],
    ["medium horizontal", "top", 760, 768],
    ["wide horizontal", "top", 940, 768],
    ["narrow vertical", "left", 1024, 400],
    ["wide vertical", "left", 1024, 940],
  ])("keeps every %s-layer button in the toolbar or Extra menu", (_, side, width, height) => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: { width, height },
    })
    const slots = extraSlots({ side })

    for (const layer of ["drawing", "trellis"]) {
      const toolbar = getToolbarButtons(slots, layer)
      const extraMenu = getExtraMenuButtons(slots, layer)
      const available = [...toolbar, ...extraMenu]
        .filter((button) => button.menu !== "extra")
        .map(buttonId)
        .sort()
      const expected = toolbarButtons.items
        .filter((button) => button.menu !== "extra" && (!button.layer || button.layer === layer))
        .map(buttonId)
        .sort()

      expect(toolbar.map(buttonId).filter((id) => extraMenu.map(buttonId).includes(id))).toEqual([])
      expect(available).toEqual(expected)
    }
  })
})
