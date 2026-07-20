import Line from "./Line"
import Point from "./Point"
import Poly from "./Poly"
import Trellis from "./Trellis"

export default class Layer {
  constructor({
    id,
    name = "Layer",
    visible = true,
    lines = [],
    filledPolys = [],
    bounds = [],
    specificSelectors = [],
    genericSelectors = [],
    mirrorOrigins = [],
    trellis = null,
    trellisControls = null,
  } = {}) {
    this.id = id
    this.name = name
    this.visible = visible
    this.lines = lines
    this.filledPolys = filledPolys
    this.bounds = bounds
    this.specificSelectors = specificSelectors
    this.genericSelectors = genericSelectors
    this.mirrorOrigins = mirrorOrigins
    this.trellis = trellis
    this.trellisControls = trellisControls ? new Trellis(trellisControls).controls : (trellis?.controls ?? null)
  }

  copy(updates = {}) {
    return new Layer({ ...this, ...updates })
  }

  get isEmpty() {
    return !(
      this.lines.length ||
      this.filledPolys.length ||
      this.bounds.length ||
      this.specificSelectors.length ||
      this.genericSelectors.length ||
      this.mirrorOrigins.length ||
      this.trellis
    )
  }

  toJSON() {
    return { ...this }
  }

  static fromJSON(json) {
    return new Layer({
      ...json,
      lines: (json.lines ?? []).map((line) => Line.fromJSON(line)),
      filledPolys: (json.filledPolys ?? []).map((poly) => Poly.fromJSON(poly)),
      bounds: (json.bounds ?? []).map((point) => Point.fromJSON(point)),
      specificSelectors: (json.specificSelectors ?? []).map((point) => Point.fromJSON(point)),
      genericSelectors: (json.genericSelectors ?? []).map((point) => Point.fromJSON(point)),
      mirrorOrigins: (json.mirrorOrigins ?? []).map((mirrorOrigin) => ({
        ...mirrorOrigin,
        origin: Point.fromJSON(mirrorOrigin.origin),
      })),
      trellis: Trellis.fromJSON(json.trellis),
      trellisControls: json.trellisControls,
    })
  }
}
