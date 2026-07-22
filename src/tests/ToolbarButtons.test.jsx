import { describe, expect, test } from "vitest"
import { toolbarButtons } from "../options"
import {
  getExtraMenuButtons,
  getFittingToolbarLevel,
  getToolbarButtonId,
  getToolbarButtons,
  getToolbarPriorityLevels,
} from "../utils/menus"

const toolbarLength = (level, layer, buttonLengths, paddingLength) =>
  getToolbarButtons(level, layer).reduce(
    (length, button) => length + buttonLengths[getToolbarButtonId(button)],
    paddingLength,
  )

describe("toolbar button sizing and availability", () => {
  test.each([
    ["narrow horizontal", 340],
    ["small horizontal", 460],
    ["medium horizontal", 600],
    ["wide horizontal", 900],
    ["narrow vertical", 360],
    ["wide vertical", 920],
  ])("uses all available room at a %s viewport size", (_, viewportLength) => {
    const endClearance = 16
    const paddingLength = 16
    const availableLength = viewportLength - endClearance

    for (const layer of ["drawing", "trellis"]) {
      const layerButtons = toolbarButtons.items.filter((button) => !button.layer || button.layer === layer)
      const buttonLengths = Object.fromEntries(
        layerButtons.map((button, index) => [getToolbarButtonId(button), 44 + (index % 3) * 4]),
      )
      const level = getFittingToolbarLevel({ availableLength, buttonLengths, paddingLength, layer })
      const toolbar = getToolbarButtons(level, layer)
      const extraMenu = getExtraMenuButtons(level, layer)
      const availableButtons = [...toolbar, ...extraMenu]
        .filter((button) => button.menu !== "extra")
        .map(getToolbarButtonId)
        .sort()
      const expectedButtons = layerButtons
        .filter((button) => button.menu !== "extra")
        .map(getToolbarButtonId)
        .sort()

      expect(toolbarLength(level, layer, buttonLengths, paddingLength)).toBeLessThanOrEqual(availableLength)
      for (const higherLevel of getToolbarPriorityLevels(layer).filter((candidate) => candidate > level))
        expect(toolbarLength(higherLevel, layer, buttonLengths, paddingLength)).toBeGreaterThan(availableLength)
      expect(availableButtons).toEqual(expectedButtons)
    }
  })
})
