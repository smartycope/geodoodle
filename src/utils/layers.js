import Layer from "../helper/Layer"

export const layerOwnedKeys = [
  "lines",
  "filledPolys",
  "bounds",
  "specificSelectors",
  "genericSelectors",
  "mirrorOrigins",
  "trellis",
]

export function createLayer(index = 1, updates = {}) {
  return new Layer({ id: `layer-${index}`, name: `Layer ${index}`, ...updates })
}

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
  return layer ? { ...state, ...Object.fromEntries(layerOwnedKeys.map((key) => [key, layer[key]])) } : state
}

export function updateLayer(layers, layerId, patch) {
  return layers.map((layer) => (layer.id === layerId ? layer.copy(patch) : layer))
}

export function updateActiveLayer(state, patch) {
  const activeLayer = getActiveLayer(state)
  return activeLayer ? { layers: updateLayer(state.layers, activeLayer.id, patch) } : {}
}

export function normalizeLayerActionResult(state, result) {
  if (!result) return result
  const layerPatch = {}
  const globalPatch = { ...result }
  for (const key of layerOwnedKeys)
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
  return (state.layers ?? []).filter((layer) => layer.visible).flatMap((layer) => layer.lines)
}
