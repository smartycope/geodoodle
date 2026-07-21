import Point from "../helper/Point"
import { themeDefaults } from "../styling/theme"
import { getClipboardRect } from "./lines"
import { getRenderedBoundRect } from "./trellisSelection"

const canvasButtons = themeDefaults.canvasButtons

export const clipboardTransformButtons = [
  { action: "increment_clipboard_rotation", label: "Rotate clipboard" },
  { action: "increment_clipboard_mirror_axis", label: "Mirror clipboard" },
  { action: "paste", label: "Paste clipboard" },
  { action: "cancel_clipboard", label: "Cancel clipboard" },
]

export const selectionOptionButtons = [
  { action: "copy", label: "Copy selection" },
  { action: "cut", label: "Cut selection" },
  // { action: "delete_selected", label: "Delete selected lines" },
  // { action: "delete_unselected", label: "Delete unselected lines" },
  { action: "toggle_partials", label: "Toggle partials" },
  { action: "clear_bounds", label: "Clear bounds" },
]

export function getClipboardButtonsPos(state) {
  const { cursorPos, scalex } = state
  const { height: buttonHeight } = canvasButtons
  const { x: cursorx, y: cursory } = cursorPos.asViewport(state)
  const { width: boundWidth, height: boundHeight } = getClipboardRect(state).asViewport(state, true)
  // x={cursorx - width/2 - scalex/2} y={cursory - height/2 - buttonHeight}
  return Point.fromViewport(state, cursorx - boundWidth / 2 - scalex / 2, cursory - boundHeight / 2 - buttonHeight)
}

export function getSelectionButtonsPos(state) {
  const boundRect = getRenderedBoundRect(state).grow(0.5)
  const { left, top } = boundRect.asViewport(state)
  return Point.fromViewport(state, left, top - canvasButtons.height)
}

export function getClipboardButtonStrip(state) {
  if (!state.mobile || !state.clipboard?.length) return null // || state.bounds.length < 2
  return {
    id: "clipboard-transform-buttons-mobile",
    position: getClipboardButtonsPos(state),
    buttons: clipboardTransformButtons,
  }
}

export function getSelectionButtonStrip(state) {
  if (state.disableSelectionCanvasButtons || state.clipboard || state.bounds.length < 2 || state.openMenus.repeat)
    return null
  return {
    id: "selection-option-buttons",
    position: getSelectionButtonsPos(state),
    buttons: selectionOptionButtons,
  }
}

export function getActiveCanvasButtonStrip(state) {
  return getClipboardButtonStrip(state) ?? getSelectionButtonStrip(state)
}

export function getCanvasButtonAt(state, x, y) {
  const strip = getActiveCanvasButtonStrip(state)
  if (!strip) return null

  const { x: left, y: top } = strip.position.asViewport(state)
  const { width, height, gap } = canvasButtons
  if (y < top || y > top + height || x < left) return null

  const stride = width + gap
  const offset = x - left
  const index = Math.floor(offset / stride)
  if (index < 0 || index >= strip.buttons.length || offset - index * stride > width) return null
  return strip.buttons[index]
}
