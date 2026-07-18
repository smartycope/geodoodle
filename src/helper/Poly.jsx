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
    const json = this.points.map((i) => i.toJSON())
    if (includeColor) json.color = this.color
    return json
  }

  static fromJSON(json) {
    const points = json.map((i) => Point.fromJSON(i))
    const color = json.color // Allow undefined
    return new Poly(points, color)
  }

  relativeTo(point) {
    return new Poly(this.points.map((i) => i.relativeTo(point)))
  }

  isSelected(state, boundRect) {
    if (state.partials) return this.points.some((i) => boundRect.within(i))
    else return this.points.every((i) => boundRect.within(i))
  }
}
