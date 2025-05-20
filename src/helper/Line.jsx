import {getBoundRect} from "../utils";
import Point from "./Point";

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
        this.valid = !a.eq(b)
        this.props = props
    }

    points(){ return [this.a, this.b] }

    // Return an optionally modified copy of this line
    copy(a=this.a, b=this.b, aes=this.aes, props=this.props){
        // Mock the scale here so the constructor can unscale the points, even though it doesn't have to (since it's
        // just a copy, we already did that when *this* line was constructed)
        return new Line({}, a, b, aes, props)
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
            strokeDasharray={this.aes.dash.replace(/\s/, '').split(',').map(i => i/state.scalex).join(',')}
            strokeLinecap={this.aes.lineCap}
            strokeLinejoin={this.aes.lineJoin}
            filter={enableGlow && this.isSelected(state) ? 'url(#glow)' : undefined}
            {...this.props}
            {...props}
            key={key}
        />
    }

    hash(){ return `${this.a.hash()}${this.b.hash()}` }
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
}