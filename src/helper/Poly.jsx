import inside from "point-in-polygon";
import Point from "./Point";

export default class Poly {
    constructor(points = []) {
        this.points = points;
    }

    addPoint(point) {
        this.points.push(point);
    }

    asGeoJSON() {
        return {
            type: "Polygon",
            coordinates: [this.points.map((i) => [i._x, i._y])],
        };
    }

    render(state, key, props = {}) {
        const { colorProfile, fill } = state;
        return (
            <polygon
                points={this.points.map((i) => `${i._x} ${i._y}`).join(" ")}
                fill={fill[colorProfile]}
                stroke="none"
                strokeWidth="0"
                key={key}
                {...props}
            />
        );
    }

    static fromGeoJSON(geojson) {
        return new Poly(geojson.coordinates[0].map((i) => new Point(i[0], i[1])));
    }

    contains(point) {
        return inside(point.xy(), this.asGeoJSON().coordinates[0]);
    }

    static fromPoints(points) {
        return new Poly(points);
    }

    static fromFeatureCollection(featureCollection) {
        return featureCollection.features.map((i) => Poly.fromGeoJSON(i.geometry));
    }

    toJSON() {
        return this.points.map((i) => i.toJSON());
    }

    static fromJSON(json) {
        return new Poly(json.map((i) => Point.fromJSON(i)));
    }

    relativeTo(point) {
        return new Poly(this.points.map((i) => i.relativeTo(point)));
    }

    isSelected(state, boundRect) {
        if (state.partials) return this.points.some((i) => boundRect.within(i));
        else return this.points.every((i) => boundRect.within(i));
    }
}
