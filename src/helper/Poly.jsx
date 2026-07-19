import inside from "point-in-polygon"
import Point from "./Point"

export default class Poly {
  constructor(points, color) {
    this.points = points
    this.color = color
  }

  withColor(color) {
    return new Poly(this.points, color)
  }

  addPoint(point) {
    this.points.push(point)
  }

  asGeoJSON() {
    return {
      type: "Polygon",
      coordinates: [this.points.map((i) => [i._x, i._y])],
    }
  }

  render(state, key, props = {}) {
    const { colorProfile, fill } = state
    if (this.points.length < 3) {
      console.log("invalid poly", this)
      return null
    }
    return (
      <polygon
        points={this.points.map((i) => `${i._x} ${i._y}`).join(" ")}
        fill={this.color ?? fill[colorProfile]}
        stroke="none"
        strokeWidth="0"
        key={key}
        {...props}
      />
    )
  }

  static fromGeoJSON(geojson) {
    // About style: https://gis.stackexchange.com/questions/22474/geojson-styling-information
    return new Poly(
      geojson.coordinates[0].map((i) => new Point(i[0], i[1])),
      geojson.style?.fill,
    )
  }

  contains(point) {
    return inside(point.xy(), this.asGeoJSON().coordinates[0])
  }

  static fromPoints(points, color) {
    return new Poly(points, color)
  }

  static fromFeatureCollection(featureCollection) {
    return featureCollection.features.map((i) => Poly.fromGeoJSON(i.geometry))
  }

  toJSON(includeColor = true) {
    if (typeof includeColor !== "boolean") includeColor = true
    return {
      points: this.points.map((point) => point.toJSON()),
      ...(includeColor ? { color: this.color } : {}),
    }
  }

  static fromJSON(json) {
    // Version 1 stored polygons as arrays and attached color as a non-index
    // property. Accept that legacy shape while using an object in schema v2 so
    // color survives JSON.stringify.
    const pointData = Array.isArray(json) ? json : (json.points ?? [])
    const points = pointData.map((i) => Point.fromJSON(i))
    const color = json.color
    return new Poly(points, color)
  }

  relativeTo(point) {
    return new Poly(
      this.points.map((i) => i.relativeTo(point)),
      this.color,
    )
  }

  isSelected(state, boundRect) {
    if (state.partials) return this.points.some((i) => boundRect.within(i))
    else return this.points.every((i) => boundRect.within(i))
  }
}
