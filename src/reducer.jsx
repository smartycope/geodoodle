import { undoStack, redoStack } from "./globals"
import { filterObjectByKeys } from "./utils/misc"
import { reversible, reversibleActions, saveSettingActions } from "./options"
import { preserveState } from "./utils/files"
import * as actions from "./actions"
import { getLayerState, normalizeLayerActionResult } from "./utils/layers"
import DrawingLayer from "./classes/DrawingLayer"

const layerContentActions = new Set([
  "add_specific_selector",
  "add_generic_selector",
  "clear_specific_selectors",
  "clear_generic_selectors",
  "convert_last_generic_selector_to_bound",
  "convert_last_specific_selector_to_bound",
  "clear_bounds",
  "select_all",
  "delete_selected",
  "delete_specific_line",
  "delete_unselected",
  "delete_at_cursor",
  "remove_lines_at_intersection",
  "pick_up_line_end",
  "add_line",
  "continue_line",
  "add_bound",
  "paint_selected",
  "fill",
  "clear_fill",
  "toggle_fill_mode",
  "paste",
  "copy",
  "cut",
  "add_mirror_origin",
  "remove_mirror_origin",
  "clear_mirror_origins",
  "add_trellis_layer",
])

// Can accept any of 3 parameters to dispatch:
//                 {action: "...", foo: "bar"}
// "..."        -> {action: "..."}
// {foo: "bar"} -> {action: "set_manual", foo: "bar"}
export default function reducer(state, data) {
  // Some convenience parameter handling
  if (typeof data === "string") data = { action: data }
  if (data.action === undefined) data = { action: "set_manual", ...data }

  if (state.debug && data.action !== "cursor_moved")
    console.debug(data.action, { "Reducer Params": data, "Initial State": state })

  const activeLayer = state.layers?.find((layer) => layer.id === state.activeLayerId)
  if (activeLayer?.visible === false && layerContentActions.has(data.action))
    return { ...state, toast: "Show or add a layer to edit" }
  if (!(activeLayer instanceof DrawingLayer) && layerContentActions.has(data.action))
    return { ...state, toast: "Currently, drawing is not enabled on trellis layers" }

  const baseState = state

  if (reversibleActions.includes(data.action)) {
    undoStack.push(filterObjectByKeys(baseState, reversible))
    redoStack.length = 0
    if (undoStack.length > baseState.maxUndoAmt) undoStack.shift()
  }

  try {
    const actionState = getLayerState(baseState)
    const result = actions[data.action](actionState, data)
    const newState = { ...baseState, ...normalizeLayerActionResult(baseState, result) }
    if (newState.reloadRequired) {
      newState.reloadRequired = false
      // I can't think of a way this would cause a problem, though it is suspicious
      // This just fakes an event that doesn't do anything in order to trigger a re-render
      // TODO: this stopped working and I don't know why
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"))
        // console.log("reloaded")
      }, 10)
    }

    if (saveSettingActions.includes(data.action)) preserveState(newState)

    return newState
  } catch (e) {
    console.error(`Failed to run action "${data.action}". The error it gave is:`, e)
    console.log({ data, state, actions })
    return state
  }
}
