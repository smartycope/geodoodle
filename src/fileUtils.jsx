import { documentSchemaVersion, version } from "./globals"
import { preservable, saveable } from "./options"
import { filterObjectByKeys, getBoundRect, getSelected } from "./utils"
import { renderToStaticMarkup } from "react-dom/server"
import Line from "./helper/Line"
import Point from "./helper/Point"
import Dist from "./helper/Dist"
import Poly from "./helper/Poly"
import Rect from "./helper/Rect"
import { name as nameGenerator } from "naampje"
import { localStorageCloudUsernameName, localStorageName, localStorageSettingsName } from "./globals"
import getInitialState from "./states"
import Layer from "./helper/Layer"
import Trellis from "./helper/Trellis"
import { createLayer, getLayerState, layerOwnedKeys } from "./layerUtils"
import { MAX_TRELLIS_CANDIDATES, MAX_TRELLIS_GROUPS } from "./trellisUtils"

function viewportCanvasRect(state) {
  return Rect.fromPoints(
    Point.fromViewport(state, 0, 0),
    Point.fromViewport(state, window.innerWidth, 0),
    Point.fromViewport(state, 0, window.innerHeight),
    Point.fromViewport(state, window.innerWidth, window.innerHeight),
  )
}

const objectPoints = (object) => (typeof object.points === "function" ? object.points() : (object.points ?? []))

function visualLayers(state) {
  return (state.layers ?? []).map((layer) =>
    layer.id === state.activeLayerId && state.lines && state.filledPolys
      ? layer.copy({ lines: state.lines, filledPolys: state.filledPolys, trellis: state.trellis ?? layer.trellis })
      : layer,
  )
}

export function resolveExportRect(state, selectedOnly = false, requestedRect = null) {
  if (selectedOnly) {
    const selection = getSelected(state, false, true)
    if (selection.length) return Rect.fromPoints(...selection.flatMap(objectPoints))
  }
  if (requestedRect) return requestedRect

  const visibleLayers = visualLayers(state).filter((layer) => layer.visible)
  if (visibleLayers.some((layer) => layer.trellis)) return viewportCanvasRect(state)
  const points = visibleLayers.flatMap((layer) => [...layer.lines, ...layer.filledPolys].flatMap(objectPoints))
  return points.length ? Rect.fromPoints(...points) : new Rect(Point.svgOrigin(), new Point(1, 1), false)
}

function renderExportLayer({ layer, state, rect, maxGroups, maxCandidates }) {
  const layerState = getLayerState(state, layer)
  const exportState = {
    ...layerState,
    translation: new Dist(-rect.topLeft._x, -rect.topLeft._y),
    scalex: 1,
    scaley: 1,
    rotate: 0,
  }
  const tiles = layer.trellis
    ? layer.trellis.visibleTiles(exportState, rect.wh._x, rect.wh._y, { maxGroups, maxCandidates }).tiles
    : []

  return (
    <g key={layer.id} id={`layer-${layer.id}`} data-layer-name={layer.name}>
      {layer.trellis && (
        <g id={`trellis-${layer.id}`}>
          {tiles.map((tile) => (
            <g
              key={`${tile.row}:${tile.column}`}
              data-row={tile.row}
              data-column={tile.column}
              transform={tile.transform}
            >
              {layer.trellis.filledPolys.map((poly, index) =>
                poly.render(layerState, `${layer.id}-trellis-poly-${index}`),
              )}
              {layer.trellis.lines.map((line, index) =>
                line.render(layerState, `${layer.id}-trellis-line-${index}`, {}, false),
              )}
            </g>
          ))}
        </g>
      )}
      <g id={`filled-polys-${layer.id}`}>
        {layer.filledPolys.map((poly, index) => poly.render(layerState, `${layer.id}-poly-${index}`))}
      </g>
      <g id={layer.id === state.activeLayerId ? "lines" : `lines-${layer.id}`}>
        {layer.lines.map((line, index) => line.render(layerState, `${layer.id}-line-${index}`, {}, false))}
      </g>
    </g>
  )
}

// Serializes editable metadata for every layer while rendering visible artwork only.
export function serializePattern(state, selectedOnly = false, requestedRect = null, transform = "") {
  const rect = resolveExportRect(state, selectedOnly, requestedRect)
  const width = Math.max(1, rect.wh._x * state.scalex)
  const height = Math.max(1, rect.wh._y * state.scaley)
  const visibleLayers = visualLayers(state).filter((layer) => layer.visible)
  const trellisCount = Math.max(1, visibleLayers.filter((layer) => layer.trellis).length)
  const maxGroups = Math.max(1, Math.floor(MAX_TRELLIS_GROUPS / trellisCount))
  const maxCandidates = Math.max(1, Math.floor(MAX_TRELLIS_CANDIDATES / trellisCount))
  const saveme = {
    ...Object.fromEntries(Object.entries(state).filter(([key]) => saveable.includes(key))),
    documentSchemaVersion,
    version,
  }
  const metadata = JSON.stringify(saveme).replaceAll("--", "\\u002d\\u002d")

  let artwork
  if (selectedOnly) {
    const selection = getSelected(state, false, true)
    const layer = new Layer({
      id: state.activeLayerId,
      name: "Selection",
      lines: selection.filter((object) => object instanceof Line),
      filledPolys: selection.filter((object) => object instanceof Poly),
    })
    artwork = renderExportLayer({ layer, state, rect, maxGroups, maxCandidates })
  } else artwork = visibleLayers.map((layer) => renderExportLayer({ layer, state, rect, maxGroups, maxCandidates }))

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
    `<!-- ${metadata} -->\n` +
    `<svg width="${width}" height="${height}" viewBox="${rect.topLeft._x} ${rect.topLeft._y} ${Math.max(1e-9, rect.wh._x)} ${Math.max(1e-9, rect.wh._y)}" transform="${transform}" xmlns="http://www.w3.org/2000/svg">\n` +
    renderToStaticMarkup(artwork) +
    "\n</svg>"
  )
}

// Deserializes parts of the state that can't be done with JSON.parse
function customDeserialize(state) {
  state.translation =
    state.translation instanceof Dist ? state.translation : Dist.fromJSON(state?.translation || { x: 0, y: 0 })

  if (state.layers?.length) {
    state.layers = state.layers.map((layer) => (layer instanceof Layer ? layer : Layer.fromJSON(layer)))
    if (!state.layers.some((layer) => layer.id === state.activeLayerId)) state.activeLayerId = state.layers[0].id
  } else {
    const legacyLayer = createLayer(1, {
      lines: (state.lines ?? []).map((line) => (line instanceof Line ? line : Line.fromJSON(line))),
      filledPolys: (state.filledPolys ?? []).map((poly) => (poly instanceof Poly ? poly : Poly.fromJSON(poly))),
      bounds: (state.bounds ?? []).map((point) => (point instanceof Point ? point : Point.fromJSON(point))),
      specificSelectors: (state.specificSelectors ?? []).map((point) =>
        point instanceof Point ? point : Point.fromJSON(point),
      ),
      genericSelectors: (state.genericSelectors ?? []).map((point) =>
        point instanceof Point ? point : Point.fromJSON(point),
      ),
      mirrorOrigins: (state.mirrorOrigins ?? []).map((mirrorOrigin) => ({
        ...mirrorOrigin,
        origin: mirrorOrigin.origin instanceof Point ? mirrorOrigin.origin : Point.fromJSON(mirrorOrigin.origin),
      })),
    })
    state.layers = [legacyLayer]
    state.activeLayerId = legacyLayer.id

    if (state.trellis) {
      const legacyState = getLayerState(state, legacyLayer)
      const trellis = Trellis.fromSelection(legacyState, state)
      if (trellis?.valid) {
        const boundRect = getBoundRect(legacyState)
        state.layers = [
          legacyLayer.copy({
            lines: legacyLayer.lines.filter((line) => !line.isSelected(legacyState, boundRect)),
            filledPolys: legacyLayer.filledPolys.filter((poly) => !poly.isSelected(legacyState, boundRect)),
            trellis,
          }),
        ]
      }
    }
  }

  for (const key of [...layerOwnedKeys, "trellisOverlap", "trellisSkip", "trellisFlip", "trellisRotate"])
    delete state[key]
  state.dotsAboveArtwork = state.dotsAboveArtwork ?? state.dotsAbovefill ?? false
  delete state.dotsAbovefill
  state.trellisDraft = null
  return state
}

// This will overwrite part of the state with the data from the svg, but not the entire state
// Returns a state object from an SVG string
export function deserializePattern(str) {
  try {
    // First, check if there's a script element in it. If it is, red flag that it's a hacking attempt
    if (str.includes("/script")) {
      window.alert(
        "The uploaded file may be trying to run malicious code. To continue, remove any script tags in the file.",
      )
      return {}
    }

    // Parse the comment and get the data from it
    const match = /<!-- (.+) -->/.exec(str)
    let state = match ? JSON.parse(match[1]) || {} : {}

    const parser = new DOMParser()
    const parsed = parser.parseFromString(str.replace("\n", ""), "text/html")
    if (!state.layers) {
      const lineGroup = parsed.querySelector("#lines")
      state.lines = lineGroup ? Array.from(lineGroup.children).map((i) => Line.fromHTML(i)) : []
    }
    return customDeserialize(state)
  } catch (e) {
    console.error(e)
    // return getInitialState()
    return {}
  }
}

// format is one of: 'png', 'jpeg', 'svg', 'blob'
// `func` gets passed the dataUrl or blob (if format == 'blob')
// Coords: width, height: Dist, scaled
// eslint-disable-next-line no-unused-vars
export function image(state, format = "png", rect, dots = false, selectedOnly, func, blob = false, margin = 10) {
  const exportRect = resolveExportRect(state, selectedOnly, rect)
  const { width, height } = exportRect.asSvg(state)
  // This serializes the state (with the function above), then creates a canvas, draws the serialized svg onto the
  // canvas, creates an image from the canvas
  const svgBlob = new Blob([serializePattern(state, selectedOnly, exportRect)], {
    type: "image/svg+xml;charset=utf-8",
  })

  const DOMURL = window.URL || window.webkitURL || window
  const url = DOMURL.createObjectURL(svgBlob)

  const img = new Image()
  img.width = width + margin * 2
  img.height = height + margin * 2
  img.src = url
  img.onload = function () {
    const canvas = document.getElementById("canvas")
    canvas.width = img.width
    canvas.height = img.height

    const ctx = canvas.getContext("2d")
    ctx.fillStyle = state.paperColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.drawImage(img, margin, margin)
    DOMURL.revokeObjectURL(url)

    if (!blob) func(canvas.toDataURL(`image/${format}`).replace(`image/${format}`, "image/octet-stream"))
    else canvas.toBlob(func)
  }
}

export function download(name, mime, { str, blob, url }) {
  if (str) blob = new Blob([str], { type: mime })

  // Create a link (anchor) element
  const link = document.createElement("a")
  // Set the download attribute and href with the Blob
  link.download = name.trim()
  link.href = url || URL.createObjectURL(blob)
  // Append the link to the body and trigger a click event
  document.body.appendChild(link)
  link.click()
  // Remove the link from the body
  document.body.removeChild(link)
}

// Serializes the preservable parts of the state into a JSON string
export function serializeState(state) {
  let documentState
  if (state.layers) {
    const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId)
    const layerPatch = Object.fromEntries(
      layerOwnedKeys.filter((key) => Object.prototype.hasOwnProperty.call(state, key)).map((key) => [key, state[key]]),
    )
    documentState = {
      ...state,
      layers: state.layers.map((layer) =>
        layer.id === activeLayer?.id && Object.keys(layerPatch).length ? layer.copy(layerPatch) : layer,
      ),
    }
  } else documentState = customDeserialize({ ...state })
  return JSON.stringify({
    ...filterObjectByKeys(documentState, preservable),
    documentSchemaVersion,
    version,
  })
}

export function preservedStatesEqual(left, right) {
  return serializeState(left) === serializeState(right)
}

// Returns {} if it can't deserialize properly (like if there's a version mismatch)
// Deserializes the preservable parts of the state from a JSON string
export function deserializeState(str) {
  try {
    const parsed = JSON.parse(str)
    return customDeserialize(parsed)
  } catch (e) {
    console.error(e)
    return {}
  }
}

export function generateName(defaultToMemorableNames) {
  const saves = getSaves() ?? {}
  if (defaultToMemorableNames)
    // naampje occasionally selects one item beyond its word lists and throws.
    // Retry a few times, while also avoiding names that are already in use.
    for (let attempt = 0; attempt < 10; attempt++)
      try {
        const name = nameGenerator()
        if (name && !saves[name]) return name
      } catch {
        // Try another generated name.
      }

  return `Unnamed ${Object.keys(saves).length + 1}`
}

// Interactions with storage
// Preserve the state across sessions
export function preserveState(state) {
  localStorage.setItem(localStorageSettingsName, serializeState(state))
}

// Get the preserved state
export function loadPreservedState() {
  return deserializeState(localStorage.getItem(localStorageSettingsName))
}

// Clear the preserved state
export function clearPreservedState() {
  localStorage.removeItem(localStorageSettingsName)
  window.location.reload()
}

// Get all the saves in localStorage - returns an object of filename: svg string -- does not deserialize!
export function getSaves() {
  return JSON.parse(localStorage.getItem(localStorageName))
}

export function loadCloudUsername() {
  return localStorage.getItem(localStorageCloudUsernameName) ?? ""
}

export function saveCloudUsername(username) {
  localStorage.setItem(localStorageCloudUsernameName, username)
}

export async function requestServer(method, path, body = undefined) {
  method = method.toUpperCase()
  const schema = method === "GET" ? "Accept-Profile" : "Content-Profile"
  const url = `https://db.smartycope.org/${path}`
  const headers = { [schema]: "geodoodle" }
  if (body !== undefined) headers["Content-Type"] = "application/json"

  console.debug("Requesting", method, url)

  const response = await fetch(url, {
    method,
    headers: {
      ...headers,
    },
    ...(body !== undefined && method !== "GET" && method !== "HEAD" ? { body: JSON.stringify(body) } : {}),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Cloud request failed (${response.status} ${response.statusText}): ${detail}`)
  }

  // PostgREST commonly returns an empty body for successful POST/DELETE requests.
  const result = await response.text()
  return result ? JSON.parse(result) : null
}

export async function getCloudSaves(username) {
  if (!username) return []
  const params = new URLSearchParams({ user: `eq.${username}` })
  return (await requestServer("GET", `saves?${params}`)) ?? []
}

export function deleteCloud(user, name) {
  const params = new URLSearchParams({ user: `eq.${user}`, name: `eq.${name}` })
  return requestServer("DELETE", `saves?${params}`)
}

export async function saveCloud(state, user, name) {
  const params = new URLSearchParams({ user: `eq.${user}`, name: `eq.${name}` })
  const path = `saves?${params}`
  const existing = (await requestServer("GET", path)) ?? []
  const modified_at = new Date().toISOString()
  const body = {
    user: user,
    name: name,
    data: serializeState(state),
    version: version,
    modified_at,
  }

  if (existing.length > 0) return requestServer("PATCH", path, body)
  return requestServer("POST", "saves", { ...body, created_at: modified_at })
}

export async function loadCloud(user, name) {
  const params = new URLSearchParams({ user: `eq.${user}`, name: `eq.${name}` })
  const [save] = (await requestServer("GET", `saves?${params}`)) ?? []
  if (!save) return null

  // Cloud rows store the same JSON string used for preserved state.
  return deserializeState(typeof save.data === "string" ? save.data : JSON.stringify(save.data))
}

// Save the pattern to localStorage
export function saveLocally(name, state) {
  let obj = {}
  obj[name.trim()] = serializePattern(state)
  localStorage.setItem(
    localStorageName,
    JSON.stringify({ ...JSON.parse(localStorage.getItem(localStorageName)), ...obj }),
  )
}

// Load the pattern from localStorage
export function loadLocally(name) {
  return deserializePattern(JSON.parse(localStorage.getItem(localStorageName))[name.trim()])
}

export function deleteLocally(name) {
  let obj = JSON.parse(localStorage.getItem(localStorageName))
  delete obj[name.trim()]
  localStorage.setItem(localStorageName, JSON.stringify(obj))
}

// Clear all the saves from localStorage
export function clearSaves() {
  localStorage.removeItem(localStorageName)
}

export function validateStorage() {
  try {
    if (!JSON.parse(localStorage.getItem(localStorageName))) localStorage.setItem(localStorageName, JSON.stringify({}))
  } catch (e) {
    console.error(e)
    localStorage.setItem(localStorageName, JSON.stringify({}))
  }
  try {
    if (!JSON.parse(localStorage.getItem(localStorageSettingsName)))
      localStorage.setItem(localStorageSettingsName, serializeState(getInitialState()))
  } catch (e) {
    console.error(e)
    localStorage.setItem(localStorageSettingsName, serializeState(getInitialState()))
  }
}
