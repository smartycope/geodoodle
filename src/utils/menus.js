// These are shared between the flip and rotate menus
// For reference,
/*
 *  {
 *     row: {
 *         every: 1,
 *         val: value
 *     },
 *     col: {
 *         every: 1,
 *         val: value
 *     },
 * }
 */

import { toolbarButtons } from "../options"

export const boxSx = (theme) => ({
  bgcolor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius / 2,
})
export const sharedProps = {
  exclusive: true,
  allowNone: true,
}
export const sharedButtonGroupProps = (theme) => ({
  // this value is coming from the "width" of the Number component, I believe
  height: "2.5rem",
  color: theme.palette.primary.main,
})

export const centeredVerticalLabelStyle = { alignItems: "center" }

export const numberAlpha = 0.8
export const numberProps = (theme) => ({
  textColor: theme.palette.primary.contrast,
  numberColor: theme.palette.text.primary,
  compact: false,
  bold: true,
  bgAlpha: numberAlpha,
})

// The grid should act as part of the background, but we still need to interact with the stuff it holds
export const gridItemSx = {
  display: "flex",
  alignItems: "center",
  "& *": {
    pointerEvents: "all",
  },
}


// For the toolbar
const matchesLayer = (button, layer) => !button.layer || button.layer === layer

export const getToolbarButtonId = (button) => button.menu ?? button.component

export const getLayerToolbarButtons = (layer) => toolbarButtons.items.filter((button) => matchesLayer(button, layer))

export const getToolbarButtons = (priorityLevel, layer) =>
  toolbarButtons.items.filter(
    (button) =>
      matchesLayer(button, layer) &&
      (!button.minSlots || priorityLevel >= button.minSlots) &&
      (button.maxSlots === undefined || priorityLevel <= button.maxSlots),
  )

// Every layer-appropriate button that is not currently in the toolbar belongs
// in the Extra menu. The Extra menu trigger itself is never listed inside it.
export const getExtraMenuButtons = (priorityLevel, layer) =>
  toolbarButtons.items.filter(
    (button) =>
      button.menu !== "extra" && matchesLayer(button, layer) && !getToolbarButtons(priorityLevel, layer).includes(button),
  )

export const getToolbarPriorityLevels = (layer) => {
  const levels = getLayerToolbarButtons(layer)
    .flatMap((button) => [button.minSlots, Number.isFinite(button.maxSlots) ? button.maxSlots + 1 : undefined])
    .filter(Number.isFinite)
  return [...new Set([0, ...levels])].sort((a, b) => b - a)
}

export const getFittingToolbarLevel = ({ availableLength, buttonLengths, paddingLength = 0, layer }) => {
  const levels = getToolbarPriorityLevels(layer)
  return (
    levels.find((level) => {
      const contentLength = getToolbarButtons(level, layer).reduce(
        (total, button) => total + (buttonLengths[getToolbarButtonId(button)] ?? 0),
        paddingLength,
      )
      return contentLength <= availableLength
    }) ?? levels.at(-1)
  )
}
