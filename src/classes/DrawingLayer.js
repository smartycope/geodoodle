import Layer from "./Layer"
import Line from "./Line"
import Point from "./Point"
import Poly from "./Poly"

export default class DrawingLayer extends Layer {
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
  } = {}) {
    super({ id, name, visible })
    this.lines = lines
    this.filledPolys = filledPolys
    this.bounds = bounds
    this.specificSelectors = specificSelectors
    this.genericSelectors = genericSelectors
    this.mirrorOrigins = mirrorOrigins
  }

  get isEmpty() {
    return !(
      this.lines.length ||
      this.filledPolys.length ||
      this.bounds.length ||
      this.specificSelectors.length ||
      this.genericSelectors.length ||
      this.mirrorOrigins.length
    )
  }

  static _fromJSON(json) {
    return new DrawingLayer({
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
    })
  }

  reset() {
    return this.copy({
      lines: [],
      filledPolys: [],
      bounds: [],
      specificSelectors: [],
      genericSelectors: [],
      mirrorOrigins: [],
    })
  }
}
