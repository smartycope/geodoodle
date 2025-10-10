import { test, it, expect, describe } from "vitest";
import Point from "../helper/Point";
import Dist from "../helper/Dist";
import Pair from "../helper/Pair";
import Line from "../helper/Line";
import Rect from "../helper/Rect";
import { getState } from "./testUtils";
import { MIRROR_AXIS } from "../globals";

describe("Pair", () => {
    test("should create a new Pair with x and y coordinates", () => {
        const pair = new Pair(10, 20);
        expect(pair._x).toBe(10);
        expect(pair._y).toBe(20);
    });

    test("should create a copy of itself", () => {
        const pair1 = new Pair(5, 10);
        const pair2 = pair1.copy();
        expect(pair2).not.toBe(pair1); // Should be a new instance
        expect(pair2._x).toBe(5);
        expect(pair2._y).toBe(10);
    });

    test("should check if two Pairs are equal", () => {
        const pair1 = new Pair(3, 4);
        const pair2 = new Pair(3, 4);
        const pair3 = new Pair(3, 5);

        expect(pair1.eq(pair2)).toBe(true);
        expect(pair1.eq(pair3)).toBe(false);
    });

    test("should add two Pairs", () => {
        const pair1 = new Pair(1, 2);
        const pair2 = new Pair(3, 4);
        const result = pair1.add(pair2);

        expect(result._x).toBe(4);
        expect(result._y).toBe(6);
    });

    test("should subtract two Pairs", () => {
        const pair1 = new Pair(5, 5);
        const pair2 = new Pair(2, 3);
        const result = pair1.sub(pair2);

        expect(result._x).toBe(3);
        expect(result._y).toBe(2);
    });

    test("should multiply two Pairs", () => {
        const pair1 = new Pair(2, 3);
        const pair2 = new Pair(4, 5);
        const result = pair1.mul(pair2);

        expect(result._x).toBe(8);
        expect(result._y).toBe(15);
    });

    test("should divide two Pairs", () => {
        const pair1 = new Pair(10, 20);
        const pair2 = new Pair(2, 4);
        const result = pair1.div(pair2);

        expect(result._x).toBe(5);
        expect(result._y).toBe(5);
    });

    test("should round coordinates", () => {
        const pair = new Pair(1.4, 2.6);
        const rounded = pair.round();

        expect(rounded._x).toBe(1);
        expect(rounded._y).toBe(3);
    });

    test("should round coordinates to specified decimal places", () => {
        const pair = new Pair(1.2345, 2.5678);
        const rounded = pair.round(2);

        expect(rounded._x).toBeCloseTo(1.23);
        expect(rounded._y).toBeCloseTo(2.57);
    });

    test("should check if a point is close to another point within threshold", () => {
        const pair1 = new Pair(1, 1);
        const pair2 = new Pair(1.5, 1.5);

        expect(pair1.closeTo(pair2, 1)).toBe(true);
        expect(pair1.closeTo(pair2, 0.4)).toBe(false);
    });

    test("should check if a point is in an array of points", () => {
        const points = [new Pair(1, 1), new Pair(2, 2), new Pair(3, 3)];
        const point = new Pair(2, 2);

        expect(point.in(points)).toBe(true);
        expect(new Pair(4, 4).in(points)).toBe(false);
    });

    test("should remove a point from an array of points", () => {
        const points = [new Pair(1, 1), new Pair(2, 2), new Pair(3, 3)];
        const point = new Pair(2, 2);
        const filtered = point.remove(points);

        expect(filtered).toHaveLength(2);
        expect(filtered.some((p) => p.eq(point))).toBe(false);
    });

    test("should handle clipping to bounds", () => {
        const point = new Pair(15, 25);
        const bounds = { xlow: 10, xhigh: 20, ylow: 20, yhigh: 30 };
        const clipped = point.clip(bounds);

        expect(clipped._x).toBe(15);
        expect(clipped._y).toBe(25);

        const outOfBounds = new Pair(5, 35);
        const clipped2 = outOfBounds.clip(bounds);
        expect(clipped2._x).toBe(10); // Clipped to xlow
        expect(clipped2._y).toBe(30); // Clipped to yhigh
    });
});

describe("Point", () => {
    test("should create a point from viewport coordinates", () => {
        const state = {
            translation: new Dist(10, 20),
            scalex: 2,
            scaley: 3,
        };

        // Test with inflated coordinates (default)
        const point1 = Point.fromViewport(state, 30, 60);
        expect(point1._x).toBe(5); // (30/2) - 10
        expect(point1._y).toBe(0); // (60/3) - 20

        // Test with deflated coordinates
        const point2 = Point.fromViewport(state, 30, 60, false);
        expect(point2._x).toBe(20); // 30 - 10
        expect(point2._y).toBe(40); // 60 - 20
    });

    test("should convert to viewport coordinates", () => {
        const state = {
            translation: new Dist(10, 20),
            scalex: 2,
            scaley: 3,
        };

        const point = new Point(5, 10);

        // Test with inflated coordinates (default)
        const viewport1 = point.asViewport(state);
        expect(viewport1.x).toBe(30); // (5 + 10) * 2
        expect(viewport1.y).toBe(90); // (10 + 20) * 3

        // Test with deflated coordinates
        const viewport2 = point.asViewport(state, false);
        expect(viewport2.x).toBe(15); // 5 + 10
        expect(viewport2.y).toBe(30); // 10 + 20
    });

    test("should convert to SVG coordinates", () => {
        const state = {
            scalex: 2,
            scaley: 3,
        };

        const point = new Point(5, 10);

        // Test with inflated coordinates (default)
        const svg1 = point.asSvg(state);
        expect(svg1.x).toBe(10); // 5 * 2
        expect(svg1.y).toBe(30); // 10 * 3

        // Test with deflated coordinates
        const svg2 = point.asSvg(state, false);
        expect(svg2.x).toBe(5);
        expect(svg2.y).toBe(10);
    });

    test("should rotate a point around an origin", () => {
        const point = new Point(10, 10);
        const origin = new Point(5, 5);

        // 90 degree rotation
        const rotated90 = point.rotate(90, origin);
        expect(rotated90._x).toBeCloseTo(0, 5);
        expect(rotated90._y).toBeCloseTo(10, 5);

        // 180 degree rotation
        const rotated180 = point.rotate(180, origin);
        expect(rotated180._x).toBeCloseTo(0, 5);
        expect(rotated180._y).toBeCloseTo(0, 5);
    });

    test("should flip a point across an axis", () => {
        const point = new Point(10, 10);
        const origin = new Point(5, 5);

        // Vertical flip
        const flippedVert = point.flip(MIRROR_AXIS.Y, origin);
        expect(flippedVert._x).toBe(0); // 5 - (10 - 5)
        expect(flippedVert._y).toBe(10);

        // Horizontal flip
        const flippedHorz = point.flip(MIRROR_AXIS.X, origin);
        expect(flippedHorz._x).toBe(10);
        expect(flippedHorz._y).toBe(0); // 5 - (10 - 5)
    });

    test("should check if a point is within a rectangle", () => {
        const rect = {
            topLeft: new Point(0, 0),
            bottomRight: new Point(10, 10),
        };

        const inside = new Point(5, 5);
        const outside = new Point(15, 15);
        const onEdge = new Point(10, 5);

        expect(inside.within(rect)).toBe(true);
        expect(outside.within(rect)).toBe(false);
        expect(onEdge.within(rect)).toBe(true);
    });
});

describe("Dist", () => {
    test("should create a zero distance", () => {
        const zero = Dist.zero();
        expect(zero._x).toBe(0);
        expect(zero._y).toBe(0);
    });

    test("should create a distance from deflated values", () => {
        const dist = Dist.fromDeflated(10, 20);
        expect(dist._x).toBe(10);
        expect(dist._y).toBe(20);
    });

    test("should create a distance from inflated values", () => {
        const state = { scalex: 2, scaley: 3 };
        const dist = Dist.fromInflated(state, 20, 30);
        expect(dist._x).toBe(10); // 20 / 2
        expect(dist._y).toBe(10); // 30 / 3
    });

    test("should convert to deflated values", () => {
        const dist = new Dist(10, 20);
        const deflated = dist.asDeflated();
        expect(deflated.x).toBe(10);
        expect(deflated.y).toBe(20);
    });

    test("should convert to inflated values", () => {
        const state = { scalex: 2, scaley: 3 };
        const dist = new Dist(10, 20);
        const inflated = dist.asInflated(state);
        expect(inflated.x).toBe(20); // 10 * 2
        expect(inflated.y).toBe(60); // 20 * 3
    });
});

describe("Line", () => {
    test("should create a valid line between two points", () => {
        const state = getState();
        const a = new Point(0, 0);
        const b = new Point(10, 10);
        const line = new Line(state, a, b, {}, {}, true);

        expect(line.valid).toBe(true);
        expect(line.a).toEqual(a);
        expect(line.b).toEqual(b);
    });

    test("should create an invalid line when points are the same", () => {
        const state = getState();
        const a = new Point(5, 5);
        const line = new Line(state, a, a, {}, {}, true);
        expect(line.valid).toBe(false);
    });

    test("should check if two lines are equal", () => {
        const state = getState();
        const line1 = new Line(state, new Point(0, 0), new Point(10, 10), {}, {}, true);
        const line2 = new Line(state, new Point(0, 0), new Point(10, 10), {}, {}, true);
        const line3 = new Line(state, new Point(0, 0), new Point(20, 20), {}, {}, true);

        expect(line1.eq(line2)).toBe(true);
        expect(line1.eq(line3)).toBe(false);
    });

    test("should check if a line is in an array of lines", () => {
        const state = getState();
        const lines = [
            new Line(state, new Point(0, 0), new Point(10, 10), {}, {}, true),
            new Line(state, new Point(20, 20), new Point(30, 30), {}, {}, true),
        ];
        const line = new Line(state, new Point(0, 0), new Point(10, 10), {}, {}, true);

        expect(line.in(lines)).toBe(true);
        expect(new Line(state, new Point(5, 5), new Point(15, 15), {}, {}, true).in(lines)).toBe(false);
    });

    test("should create a copy of a line with optional modifications", () => {
        const state = getState();
        const line = new Line(state, new Point(0, 0), new Point(10, 10), { stroke: "red" }, { id: 1 }, true);
        const newA = new Point(5, 5);
        const newB = new Point(15, 15);
        const newAes = { stroke: "blue" };
        const newProps = { id: 2 };

        const copy = line.copy(newA, newB, newAes, newProps);

        expect(copy.a.eq(newA)).toBe(true);
        expect(copy.b.eq(newB)).toBe(true);
        expect(copy.aes.stroke).toBe("blue");
        expect(copy.props.id).toBe(2);
    });
});

describe("Rect", () => {
    test("should create a rectangle from two points", () => {
        const topLeft = new Point(0, 0);
        const bottomRight = new Point(10, 20);
        const rect = new Rect(topLeft, bottomRight);

        expect(rect.topLeft).toEqual(topLeft);
        expect(rect.bottomRight).toEqual(bottomRight);
    });

    test("should create a rectangle from multiple points", () => {
        const points = [new Point(10, 20), new Point(0, 30), new Point(15, 5), new Point(5, 15)];

        const rect = Rect.fromPoints(...points);

        expect(rect.topLeft._x).toBe(0);
        expect(rect.topLeft._y).toBe(5);
        expect(rect.bottomRight._x).toBe(15);
        expect(rect.bottomRight._y).toBe(30);
    });

    test("should calculate width and height", () => {
        const rect = new Rect(new Point(0, 0), new Point(10, 20));
        expect(rect.wh._x).toBe(10);
        expect(rect.wh._y).toBe(20);
    });

    test("should calculate center point", () => {
        const rect = new Rect(new Point(0, 0), new Point(10, 20));
        const center = rect.center;

        expect(center._x).toBe(5);
        expect(center._y).toBe(10);
    });

    test("should check if a point is within the rectangle", () => {
        const rect = new Rect(new Point(0, 0), new Point(10, 10));
        const inside = new Point(5, 5);
        const outside = new Point(15, 15);
        const onEdge = new Point(10, 5);

        expect(rect.within(inside)).toBe(true);
        expect(rect.within(outside)).toBe(false);
        expect(rect.within(onEdge)).toBe(true);
    });

    test("should grow and shrink the rectangle", () => {
        const rect = new Rect(new Point(5, 5), new Point(15, 15));

        // Grow by 2 units
        const grown = rect.grow(2);
        expect(grown.topLeft._x).toBe(3);
        expect(grown.topLeft._y).toBe(3);
        expect(grown.bottomRight._x).toBe(17);
        expect(grown.bottomRight._y).toBe(17);

        // Shrink by 2 units
        const shrunk = rect.shrink(2);
        expect(shrunk.topLeft._x).toBe(7);
        expect(shrunk.topLeft._y).toBe(7);
        expect(shrunk.bottomRight._x).toBe(13);
        expect(shrunk.bottomRight._y).toBe(13);
    });
});
