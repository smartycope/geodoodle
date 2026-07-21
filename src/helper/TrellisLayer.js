import Dist from "./Dist"
import Line from "./Line"
import Point from "./Point"
import Poly from "./Poly"
import Rect from "./Rect"
import { MIRROR_AXIS, MIRROR_ROT } from "../globals"
import { getBoundRect, getSelected } from "../utils/lines"
import { defaultTrellisControl } from "../utils/trellis"
import { buildVisibleTrellisTiles, createTrellisTileDescriptor, transformAffinePoint } from "../utils/trellis"
import Layer from "./Layer"
import { nextLayerNumber } from "../utils/layers"

const cloneControl = (control, fallback) => ({
  row: { every: control?.row?.every ?? 1, val: control?.row?.val ?? fallback },
  col: { every: control?.col?.every ?? 1, val: control?.col?.val ?? fallback },
})

const transformPoint = (matrix, point) => {
  const transformed = transformAffinePoint(matrix, point._x, point._y)
  return new Point(transformed.x, transformed.y)
}

// These might be necissary later
// sourceLineIndexes: state.lines.flatMap((line, index) => (line.isSelected(state, boundRect) ? [index] : [])),
// sourcePolyIndexes: state.filledPolys.flatMap((poly, index) =>
//   boundRect && poly.isSelected(state, boundRect) ? [index] : [],
// ),

/** Durable, serializable repeated-pattern model. */
export default class TrellisLayer extends Layer {
  constructor({
    id,
    name = "Layer",
    visible = true,
    sourceOrigin = Point.svgOrigin(),
    sourceSize = Dist.zero(),
    lines = [],
    filledPolys = [],
    overlap = defaultTrellisControl({ x: 0, y: 0 }),
    skip = defaultTrellisControl(0),
    flip = defaultTrellisControl(MIRROR_AXIS.NONE),
    rotate = defaultTrellisControl(MIRROR_ROT.NONE),
  } = {}) {
    super({ id, name, visible })
    this.sourceOrigin = sourceOrigin
    this.sourceSize = sourceSize
    this.lines = lines
    this.filledPolys = filledPolys
    this.overlap = cloneControl(overlap, { x: 0, y: 0 })
    this.skip = cloneControl(skip, 0)
    this.flip = cloneControl(flip, MIRROR_AXIS.NONE)
    this.rotate = cloneControl(rotate, MIRROR_ROT.NONE)
  }

  static fromSelection(state, controls = {}) {
    const index = nextLayerNumber(state.layers)
    const boundRect = getBoundRect(state)

    if (!boundRect || boundRect.wh._x <= 0 || boundRect.wh._y <= 0) return null

    const selected = getSelected(state, "topLeft", true)

    return this.createFromIndex(index, {
      sourceOrigin: boundRect.topLeft,
      sourceSize: boundRect.wh,
      lines: selected.filter((object) => object instanceof Line),
      filledPolys: selected.filter((object) => object instanceof Poly),
      overlap: controls.trellisOverlap ?? controls.overlap,
      skip: controls.trellisSkip ?? controls.skip,
      flip: controls.trellisFlip ?? controls.flip,
      rotate: controls.trellisRotate ?? (typeof controls.rotate === "object" ? controls.rotate : undefined),
    })
  }

  get valid() {
    return this.sourceSize._x > 0 && this.sourceSize._y > 0 && Boolean(this.lines.length || this.filledPolys.length)
  }

  get boundRect() {
    return new Rect(this.sourceOrigin, this.sourceOrigin.add(this.sourceSize), false)
  }

  get pattern() {
    return [...this.lines, ...this.filledPolys]
  }

  get controls() {
    return {
      overlap: cloneControl(this.overlap, { x: 0, y: 0 }),
      skip: cloneControl(this.skip, 0),
      flip: cloneControl(this.flip, MIRROR_AXIS.NONE),
      rotate: cloneControl(this.rotate, MIRROR_ROT.NONE),
    }
  }

  reset() {
    return this.withControls({
      overlap: defaultTrellisControl({ x: 0, y: 0 }),
      skip: defaultTrellisControl(0),
      flip: defaultTrellisControl(MIRROR_AXIS.NONE),
      rotate: defaultTrellisControl(MIRROR_ROT.NONE),
    })
  }

  withControls({ overlap, skip, flip, rotate } = {}) {
    return this.copy({
      overlap: overlap ?? this.overlap,
      skip: skip ?? this.skip,
      flip: flip ?? this.flip,
      rotate: rotate ?? this.rotate,
    })
  }

  tileDescriptor(row, column) {
    return createTrellisTileDescriptor({
      row,
      column,
      seed: { x: this.sourceOrigin._x, y: this.sourceOrigin._y },
      width: this.sourceSize._x,
      height: this.sourceSize._y,
      overlap: this.overlap,
      flip: this.flip,
      rotate: this.rotate,
    })
  }

  sourceTileDescriptor() {
    return this.tileDescriptor(0, 0)
  }

  visibleTiles(state, viewportWidth, viewportHeight, limits = {}) {
    return buildVisibleTrellisTiles({
      pattern: this.pattern,
      state: {
        ...state,
        trellisOverlap: this.overlap,
        trellisSkip: this.skip,
        trellisFlip: this.flip,
        trellisRotate: this.rotate,
      },
      boundRect: this.boundRect,
      viewportWidth,
      viewportHeight,
      ...limits,
    })
  }

  materializeSource() {
    const matrix = this.sourceTileDescriptor().matrix
    return {
      lines: this.lines.map((line) => line.copy(transformPoint(matrix, line.a), transformPoint(matrix, line.b))),
      filledPolys: this.filledPolys.map(
        (poly) =>
          new Poly(
            poly.points.map((point) => transformPoint(matrix, point)),
            poly.color,
          ),
      ),
    }
  }

  // TODO: update this
  static _fromJSON(json) {
    if (!json) return null
    return new TrellisLayer({
      ...json,
      sourceOrigin: Point.fromJSON(json.sourceOrigin),
      sourceSize: Dist.fromJSON(json.sourceSize),
      lines: (json.lines ?? []).map((line) => Line.fromJSON(line)),
      filledPolys: (json.filledPolys ?? []).map((poly) => Poly.fromJSON(poly)),
    })
  }
}
