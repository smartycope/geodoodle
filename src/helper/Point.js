import Pair from "./Pair";
import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE} from "../globals";
import {getHalf, toRadians} from "../utils";
import Dist from "./Dist";

/*
    A Point class to handle coordinate transformations declaratively for us
    Use the fromViewport and fromSvg static methods to create points, and the asViewport and asSvg methods to access
    x and y. The constructor should only be used in situations where coordinate systems are irrelevant or implied (like
    for comparison operations)
    Similarly, _x and _y should only be accessed directly when coordinate systems are irrelevant or implied. .xy() is
    the preferred method for this.
    Instead use fromViewport and fromSvg and get the x and y from the returned object.

    Note that Points (and Dists and Lines and Pairs and Rects) are immutable.

    Coordinate systems:
        "svg" is the coordinate system of the svg element (previously "relative")
        "viewport" is the coordinate system of the viewport (previously "absolute")
        "inflated" refers to whether the coordinates are scaled or not.
            inflated==true means there is scalex/scaley distance between dots.
            inflated==false means there is 1 unit of distance between dots.

    By default, points are inflated.
    Internally, points are stored in deflated, svg coordinates. The reason for this is because the scale can change,
    so if we create a point from inflated coordinates, change the scale, and then try to access it as a deflated point,
    the point will be scaled down using the new scale, instead of the old scale, and thus be inaccurate. SVG vs viewport
    coordinates is arbitrary, but inflated vs deflated is not.
*/
export default class Point extends Pair{
    static svgOrigin(state=undefined){
        return new Point(0, 0)
    }

    static viewportOrigin({translation}){
        return new Point(-translation._x, -translation._y)
    }

    // To be avoided, just like the constructor
    static fromDist(dist){
        return new Point(dist._x, dist._y)
    }

    static fromViewport({translation, scalex, scaley}, x, y, inflated=true){
        const {x: translationx, y: translationy} = translation.asDeflated()
        if (inflated)
            return new Point((x / scalex) - translationx, (y / scaley) - translationy)
        return new Point(x - translationx, y - translationy)
    }

    // fromSvg(state, x, y, false)           - x and y are deflated
    // fromSvg(state, x, y) or fromSvg(x, y) - x and y are inflated
    static fromSvg(state_or_x, x_or_y, y=undefined, inflated=true){
        // We don't need to inflate it
        if (typeof state_or_x === 'number'){
            if (inflated)
                throw new Error("Cannot create an inflated point from svg coordinates without scalex and scaley")
            return new Point(state_or_x, x_or_y)
        }

        if (inflated){
            const {scalex, scaley} = state_or_x
            return new Point((x_or_y / scalex), (y / scaley))
        }

        return new Point(x_or_y, y)
    }

    asViewport({translation, scalex, scaley}, inflate=true){
        const {x: translationx, y: translationy} = translation.asDeflated()
        if (inflate)
            return {x: (this._x + translationx) * scalex, y: (this._y + translationy) * scaley}
        return {x: this._x + translationx, y: this._y + translationy}
    }

    asSvg({scalex, scaley}={scalex: 1, scaley: 1}, inflate=true){
        if ((!scalex || !scaley) && !inflate)
            throw new Error("Cannot inflate point from svg coordinates without scalex and scaley")
        if (inflate)
            return {x: this._x * scalex, y: this._y * scaley}
        return {x: this._x, y: this._y}
    }

    // Aligns the point to the grid
    align(state){
        return Point.fromSvg(state,
            Math.round(this._x),
            Math.round(this._y),
            false
        )
    }

    // These are basically matrix multiplication by hand
    // I don't remember why I did it this way instead of using actual matrix multiplication, but I sure ain't changin' it now
    rotate(angle, origin){
        // Coordinates are deflated, but otherwise irrelevant here
        const [x, y] = this.xy()
        const [originx, originy] = origin.xy()

        // Optimization
        if (!angle)
            return this

        // For some reason, the math breaks on 180 degrees. No idea why, but this is more efficient anyway
        if (angle === 180)
            return new Point(
                x * -1 + originx*2,
                y * -1 + originy*2,
            )
        else
            return new Point(
                (x * Math.cos(toRadians(angle))) +
                    (y * -Math.sin(toRadians(angle))) +
                    originx*(1-Math.cos(toRadians(angle))) + originy*Math.sin(toRadians(angle)),
                (x * Math.sin(toRadians(angle))) +
                    (y * -Math.cos(toRadians(angle))) +
                    originy*(1-Math.cos(toRadians(angle))) - originx*Math.sin(toRadians(angle)),
            )
    }

    flip(mirrorAxis, origin){
        // Coordinates are deflated, but otherwise irrelevant here
        let [x, y] = this.xy()
        const [originx, originy] = origin.xy()

        if (mirrorAxis === MIRROR_AXIS.VERT_90 || mirrorAxis === MIRROR_AXIS.BOTH_360)
            x = x * -1 + originx*2
        if (mirrorAxis === MIRROR_AXIS.HORZ_180 || mirrorAxis === MIRROR_AXIS.BOTH_360)
            y = y * -1 + originy*2
        return new Point(x, y)
    }

    // This can accept Dist, Point, a single number, or a pair of numbers, either as an array, an object, or as arguments
    translate(...args){ return this.add(...args) }

    // Mirror the point according to the current state
    // Returns an array of points
    // If we're not currently mirroring, just returns [this]
    mirror(state){
        const {mirrorMethod, mirrorAxis, mirrorAxis2, mirroring, openMenus, mirrorType, curLinePos, cursorPos} = state
        const half = getHalf(state)
        const origin = mirrorType === MIRROR_TYPE.PAGE ? half : (curLinePos || cursorPos)
        var array = [this]

        if (!mirroring && !openMenus.mirror)
            return array

        // mirrorAxis controls the flip axis
        // mirrorAxis2 controls the rotation angle
        if ([MIRROR_METHOD.FLIP, MIRROR_METHOD.BOTH].includes(mirrorMethod)){
            array.push(this.flip(mirrorAxis, origin))
            if (mirrorAxis === MIRROR_AXIS.BOTH_360){
                array.push(this.flip(MIRROR_AXIS.VERT_90, origin))
                array.push(this.flip(MIRROR_AXIS.HORZ_180, origin))
            }
        }
        if ([MIRROR_METHOD.ROTATE, MIRROR_METHOD.BOTH].includes(mirrorMethod)){
            // Optimization: 180 degree rotation == flipping both vertically & horizontally: that line already exists
            // if (mirrorAxis !== MIRROR_AXIS.BOTH_360 || (mirrorAxis2 !== MIRROR_AXIS.HORZ_180 && mirrorMethod === MIRROR_METHOD.BOTH))
            if (!(mirrorMethod === MIRROR_METHOD.BOTH && mirrorAxis === MIRROR_AXIS.BOTH_360 && mirrorAxis2 === MIRROR_AXIS.HORZ_180))
                array.push(this.rotate(mirrorAxis2, origin))
            if (mirrorAxis2 === MIRROR_AXIS.BOTH_360){
                array.push(this.rotate(MIRROR_AXIS.VERT_90, origin))
                if (!(mirrorMethod === MIRROR_METHOD.BOTH && mirrorAxis === MIRROR_AXIS.BOTH_360 && mirrorAxis2 === MIRROR_AXIS.BOTH_360))
                    array.push(this.rotate(MIRROR_AXIS.HORZ_180, origin))
            }
        }
        if (mirrorMethod === MIRROR_METHOD.BOTH){
            if (mirrorAxis === MIRROR_AXIS.BOTH_360 && mirrorAxis2 === MIRROR_AXIS.BOTH_360){
                array.push(this.rotate(MIRROR_AXIS.BOTH_360, origin))
                array.push(this.flip(MIRROR_AXIS.HORZ_180, origin).rotate(MIRROR_AXIS.VERT_90, origin))
            }
            // The extra if here is just because when we add the extra line, it behaves identically to crossed flipping
            else if (mirrorAxis2 !== MIRROR_AXIS.HORZ_180)
                array.push(this.flip(mirrorAxis, origin).rotate(mirrorAxis2, origin))
        }

        return array
    }

    // This is >=, so it includes the line
    within(rect){
        return this._x >= rect.topLeft._x
            && this._x <= rect.bottomRight._x
            && this._y >= rect.topLeft._y
            && this._y <= rect.bottomRight._y
    }

    relativeTo(newOrigin){ return new Point(this._x - newOrigin._x, this._y - newOrigin._y) }
    asDist(){ return new Dist(this._x, this._y) }
}