import {getBoundRect, unique} from "../utils";
import Point from "./Point";
import * as turf from "@turf/turf";

export default class Line {
    // if state is not specified, aes must be specified
    // round defaults to true because (as of right now) lines only go between the dots, and dots are integers in
    // deflated coordinates. This shouldn't be necissary now that I fixed the phantom off by one errors, but it's still
    // usefull and should cover any rounding errors
    constructor(state, a, b, aes={}, props={}, round=true){
        const {stroke, strokeWidth, dash, lineCap, lineJoin, colorProfile} = state
        // For "aesthetics" (concept stolen from ggplot2 in R)
        this.aes = {
            stroke: aes?.stroke ?? stroke[colorProfile],
            width: aes?.width ?? strokeWidth[colorProfile],
            dash: aes?.dash ?? dash[colorProfile],
            lineCap: aes?.lineCap ?? lineCap,
            lineJoin: aes?.lineJoin ?? lineJoin,
        }
        this.a = round ? a.round() : a
        this.b = round ? b.round() : b
        this.props = props
    }

    get valid(){ return this.a && this.b && !this.a.eq(this.b) }

    points(){ return [this.a, this.b] }
    round(){ return this.copy(this.a.round(), this.b.round()) }

    // Return an optionally modified copy of this line
    copy(a=this.a, b=this.b, aes=this.aes, props=this.props, round=true){
        // Mock the scale here so the constructor can unscale the points, even though it doesn't have to (since it's
        // just a copy, we already did that when *this* line was constructed)
        return new Line({}, a, b, {...this.aes, ...aes}, {...this.props, ...props}, round)
    }

    isSelected(state, boundRect=null){
        // Don't recaclulate the bound rect if we don't have to (just for a slight optimization)
        const _boundRect = boundRect ?? getBoundRect(state)
        return _boundRect && this.within(_boundRect, state.partials)
    }

    // Return a React element, optionally adding/overriding props
    render(state, key=this.hash(), props={}, enableGlow=true){
        if (!this.valid)
            return null

        const {x: x1, y: y1} = this.a.asSvg(state, false)
        const {x: x2, y: y2} = this.b.asSvg(state, false)

        return <line
            x1={x1} y1={y1}
            x2={x2} y2={y2}
            stroke={this.aes.stroke}
            strokeWidth={this.aes.width}
            // This should get scaled to the current scale
            // TODO: This scale ratio is wrong? No clue how that's possible, but it is
            strokeDasharray={this.aes.dash.replace(/\s/, '').split(',').map(i => i/state.scalex).join(',')}
            strokeLinecap={this.aes.lineCap}
            strokeLinejoin={this.aes.lineJoin}
            filter={enableGlow && this.isSelected(state) ? 'url(#glow)' : undefined}
            {...this.props}
            {...props}
            key={key}
        />
    }

    hash(){
        // This is simply a way to ensure that the hash is consistent no matter which point is first
        // We want the lines from a -> b and b -> a to have the same hash
        if (this.a._x > this.b._x)
            return `${this.a.hash()}${this.b.hash()}`
        else if (this.a._x < this.b._x)
            return `${this.b.hash()}${this.a.hash()}`
        else if (this.a._y > this.b._y)
            return `${this.a.hash()}${this.b.hash()}`
        else
            return `${this.b.hash()}${this.a.hash()}`
    }
    eq(other){ return this.a.eq(other.a) && this.b.eq(other.b) }
    in(lines){ return lines.some(i => this.eq(i)) }
    remove(lines){ return lines.filter(i => !this.eq(i)) }
    align(state){ return this.copy(this.a.align(state), this.b.align(state)) }
    rotate(angle, origin){ return this.copy(this.a.rotate(angle, origin), this.b.rotate(angle, origin)) }
    flip(mirrorAxis, origin){ return this.copy(this.a.flip(mirrorAxis, origin), this.b.flip(mirrorAxis, origin)) }

    mirror(state, aes=this.aes){
        const as = this.a.mirror(state)
        const bs = this.b.mirror(state)
        return as.map((a, i) => this.copy(a, bs[i], aes))
    }

    mirrorRaw(axis, rot, origin, aes=this.aes){
        const as = this.a.mirrorRaw(axis, rot, origin)
        const bs = this.b.mirrorRaw(axis, rot, origin)
        return as.map((a, i) => this.copy(a, bs[i], aes))
    }

    toJSON(){
        return {
            a: this.a,
            b: this.b,
            aes: this.aes,
            props: this.props,
        }
    }

    static fromJSON(json){ return new Line({}, Point.fromJSON(json.a), Point.fromJSON(json.b), json.aes, json.props) }

    // Note: this ignores any additional props the element may have
    static fromHTML(line){
        const attrs = line.attributes
        return new Line({},
            Point.fromSvg({}, Number(attrs.x1.value), Number(attrs.y1.value), false),
            Point.fromSvg({}, Number(attrs.x2.value), Number(attrs.y2.value), false),
            {
                stroke: attrs.stroke.value,
                width: Number(attrs['stroke-width'].value),
                // TODO: this is probably innacurate, as the scale it started with may not be the current scale
                dash: attrs['stroke-dasharray'].value,
                lineCap: attrs['stroke-linecap'].value,
                lineJoin: attrs['stroke-linejoin'].value,
            },
        )
    }

    within(rect, partials){
        const ais = this.a.within(rect)
        const bis = this.b.within(rect)
        return partials ? (ais || bis) : (ais && bis)
    }

    closeTo(other, threshold){ return this.a.closeTo(other.a, threshold) && this.b.closeTo(other.b, threshold) }
    slope(){ return (this.b.y - this.a.y) / (this.b.x - this.a.x) }
    relativeTo(newOrigin){ return this.copy(this.a.relativeTo(newOrigin), this.b.relativeTo(newOrigin)) }
    translate(...args){ return this.copy(this.a.translate(...args), this.b.translate(...args)) }
    asGeoJson(){ return turf.lineString([this.a.xy(), this.b.xy()]) }

    split(lines){
        // The intersections have to be sorted here, so we can split the line into segments and not have them overlap each other
        const intersections = this.findIntersections(lines, true)
        if (intersections.length === 0)
            return [this]
        let rtn = intersections.flatMap((intersection, i, self) => [
            this.copy(self[i-1] ?? this.a, intersection, {}, {}, false),
            // this.copy(intersection, self[i+1] ?? this.b, {}, {}, false)
        ])
        rtn.push(this.copy(intersections[intersections.length-1], this.b, {}, {}, false))
        return rtn
    }

    // Returns an array of points where this line intersects with the given lines
    // If sort is true, the intersections are sorted in order of closest to point a to further from point a
    findIntersections(otherLines, sort=false){
        const thisLine = this.asGeoJson()
        const intersections = unique(otherLines.flatMap(line => {
            const intersection = turf.lineIntersect(thisLine, line.asGeoJson())
            if (intersection.features.length === 0)
                return []
            // make sure it's not equal to a or b
            return intersection.features.flatMap(feature => {
                const point = Point.fromGeoJson(feature)
                if (point.eq(this.a) || point.eq(this.b))
                    return []
                return [point]
            })
        }))
        return sort ? intersections.sort((a, b) => this.a.dist(a) - this.a.dist(b)) : intersections
    }

    // I would put this in utils, but it needs the Line class
    static getCurrentLine(state){
        if (!state.curLinePos)
            return null
        return new Line(state, state.cursorPos, state.curLinePos)
    }
}