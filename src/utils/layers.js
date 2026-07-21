import DrawingLayer from "../classes/DrawingLayer"
import TrellisLayer from "../classes/TrellisLayer"

// TODO: does this need to be updated?
export const drawingLayerOwnedKeys = [
  "lines",
  "filledPolys",
  "bounds",
  "specificSelectors",
  "genericSelectors",
  "mirrorOrigins",
]

export function nextLayerNumber(layers) {
  const used = new Set(layers.map((layer) => Number(/^layer-(\d+)$/.exec(layer.id)?.[1])).filter(Number.isFinite))
  let value = 1
  while (used.has(value)) value++
  return value
}

export function getActiveLayer(state) {
  return state.layers?.find((layer) => layer.id === state.activeLayerId) ?? state.layers?.[0] ?? null
}

export function getLayerState(state, layer = getActiveLayer(state)) {
  return layer instanceof DrawingLayer
    ? { ...state, ...Object.fromEntries(drawingLayerOwnedKeys.map((key) => [key, layer[key]])) }
    : state
}

export function updateLayer(layers, layerId, patch) {
  return layers.map((layer) => (layer.id === layerId ? layer.copy(patch) : layer))
}

export function updateActiveLayer(state, patch) {
  const activeLayer = getActiveLayer(state)
  return activeLayer ? { layers: updateLayer(state.layers, activeLayer.id, patch) } : {}
}

export function setActiveLayer(state, layerInstance, id = layerInstance.id) {
  return state.layers.map((layer) => (layer.id === id ? layerInstance : layer))
}

export function normalizeLayerActionResult(state, result) {
  if (!result) return result
  if (!(getActiveLayer(state) instanceof DrawingLayer)) return result
  const layerPatch = {}
  const globalPatch = { ...result }
  for (const key of drawingLayerOwnedKeys)
    if (Object.prototype.hasOwnProperty.call(globalPatch, key)) {
      layerPatch[key] = globalPatch[key]
      delete globalPatch[key]
    }

  if (Object.keys(layerPatch).length) {
    const layers = globalPatch.layers ?? state.layers
    globalPatch.layers = updateLayer(layers, state.activeLayerId, layerPatch)
  }
  return globalPatch
}

export function allVisibleLines(state) {
  return (state.layers ?? [])
    .filter((layer) => layer.visible && layer instanceof DrawingLayer)
    .flatMap((layer) => layer.lines)
}

export function layerFromJSON(json) {
  if (!json) return
  if (json.type === "TrellisLayer") return TrellisLayer._fromJSON(json)
  if (json.type === "DrawingLayer" || json.type === "Layer" || !json.type) return DrawingLayer._fromJSON(json)
  throw new Error(`Unknown layer type: ${json.type}`)
}

export function activeLayerIsTrellis(state) {
  return getActiveLayer(state) instanceof TrellisLayer
}

export function activeLayerIsDrawing(state) {
  return getActiveLayer(state) instanceof DrawingLayer
}
