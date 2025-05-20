import Point from "./Point";
import Dist from "./Dist";

// Internally, values are stored in inflated, svg coordinates, just like Point
// To access left/right/top/bottom/width/height, use asSvg or asViewport
// topLeft/bottomRight/topRight/bottomLeft/center are members/properties that are Points, use their methods to access x and y
// centerOffset is a Dist object, use its methods to access width and height
// wh is a Dist object, even thought it's not really a Dist. It's just a convenient way to access width and height, if you only need those
export default class Rect {
    // round defaults to true because (as of right now) rects only go between the dots, and dots are integers in
    // deflated coordinates. This may change later, depending on usage.
    constructor(topLeft, bottomRight, round=true) {
        this.topLeft = round ? topLeft.round() : topLeft;
        this.bottomRight = round ? bottomRight.round() : bottomRight;
    }
    // points is a list of Point objects
    static fromPoints(...points){
        // The coordinates don't really matter here, we're just comparing values
        const topLeft = new Point(Math.min(...points.map(i => i._x)), Math.min(...points.map(i => i._y)))
        const bottomRight = new Point(Math.max(...points.map(i => i._x)), Math.max(...points.map(i => i._y)))
        return new Rect(topLeft, bottomRight)
    }

    asSvg(state=undefined, inflate=true){
        if (!state && inflate)
            throw new Error("Cannot deflate rect without scalex and scaley")

        const topLeft = this.topLeft.asSvg(state, inflate)
        const bottomRight = this.bottomRight.asSvg(state, inflate)

        return {
            left: topLeft.x,
            right: bottomRight.x,
            top: topLeft.y,
            bottom: bottomRight.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y,
        }
    }

    asViewport(state, inflate=true){
        const topLeft = this.topLeft.asViewport(state, inflate)
        const bottomRight = this.bottomRight.asViewport(state, inflate)
        return {
            left: topLeft.x,
            right: bottomRight.x,
            top: topLeft.y,
            bottom: bottomRight.y,
            width: bottomRight.x - topLeft.x,
            height: bottomRight.y - topLeft.y,
        }
    }

    get bottomLeft(){ return new Point(this.topLeft._x, this.bottomRight._y) }
    get topRight(){ return new Point(this.bottomRight._x, this.topLeft._y) }
    // Note that this rounds to the nearest dot
    // get center(){ return this.bottomRight.add(this.topLeft).div(2).round() }
    get center(){ return new Point(
            this.topLeft._x + ((this.bottomRight._x - this.topLeft._x)/2),
            this.topLeft._y + ((this.bottomRight._y - this.topLeft._y)/2),
        ).round()
    }
    // Note that this rounds to the nearest dot
    get centerOffset(){ return this.bottomRight.sub(this.topLeft).div(2).round().asDist() }

    // width and height, together as a Dist
    get wh(){
        return new Dist(
            this.bottomRight._x - this.topLeft._x,
            this.bottomRight._y - this.topLeft._y,
        )
    }

    render(state, props={}){
        const {left, top, width, height} = this.asViewport(state)
        return <rect
            x={left}
            y={top}
            width={width}
            height={height}
            {...props}
        />
    }

    grow(amount){
        return new Rect(
            this.topLeft.sub(new Dist(amount, amount)),
            this.bottomRight.add(new Dist(amount, amount)),
            false
        )
    }
    shrink(amount){return this.grow(-amount)}
    copy(){return new Rect(this.topLeft.copy(), this.bottomRight.copy())}
    empty(){return this.topLeft.eq(this.bottomRight)}
    within(point){
        return point._x >= this.topLeft._x &&
               point._x <= this.bottomRight._x &&
               point._y >= this.topLeft._y &&
               point._y <= this.bottomRight._y
    }
    onEdge(point){
        return point._x === this.topLeft._x ||
               point._x === this.bottomRight._x ||
               point._y === this.topLeft._y ||
               point._y === this.bottomRight._y
    }
    onCorner(point){
        return point._x === this.topLeft._x &&
               point._y === this.topLeft._y ||
               point._x === this.bottomRight._x &&
               point._y === this.bottomRight._y
    }
}