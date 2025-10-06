import {MIRROR_AXIS, viewportWidth, viewportHeight} from "./globals";
import {getSelected, getBoundRect, getDebugBox} from "./utils";
import Point from "./helper/Point";
import Rect from "./helper/Rect";
import { useContext } from "react";
import { StateContext } from "./Contexts";
import { DebugPoint } from "./drawing";


/* Indices
    rows:
    -2 <- top row
    -1
    0 <- seed pattern
    1
    2 <- bottom row

    columns:
    left | -2 -1 0 1 2 | right
*/


// This is the main logic for generating the trellis
// It returns a list of groups of the pattern with appropriate translations
export default function Trellis(){
    const {state} = useContext(StateContext)
    const {trellis, openMenus, bounds,  trellisOverlap, trellisSkip, trellisFlip, trellisRotate, debug, translation, scalex, scaley } = state
    const {x: transx, y: transy} = translation.asInflated(state)

    if (!(trellis || openMenus.repeat) || bounds.length <= 1)
        return null

    const boundRect = getBoundRect(state)
    if (!boundRect)
        return []

    var rtn = new Set()
    // First, calculate all the variables we need
    // A list of Line objects, or null
    const pattern = getSelected(state, 'topLeft', true).map(line => line.render(state, undefined, debug ? {stroke: 'red', strokeWidth: 2/scalex} : {}, false))
    const {x: width, y: height} = boundRect.wh.asDeflated(state)

    // TODO: this could use some refinement, though I think it's alright for now
    // I think this is accurate?
    const dimDiff = (trellisFlip.row.val || trellisFlip.col.val || trellisRotate.row.val || trellisRotate.col.val) ? Math.abs(width - height) : 0
    // Imagine the "default" pattern to be a tellise with no special properties: it's just tesselated evenly across the area
    // This is at most how many dots outside a pattern might go outside of it's "default" position
    const retrogradex_dots = trellisOverlap.row.val.x + trellisOverlap.col.val.x + dimDiff + height + 1
    const retrogradey_dots = trellisOverlap.row.val.y + trellisOverlap.col.val.y + dimDiff + width + 2

    function applyTransformations(x, y, row, col){
        // Skip
        if ((!trellisSkip.row.val || !(col % trellisSkip.row.every)) &&
            (!trellisSkip.col.val || !(row % trellisSkip.col.every))){

            // Initial translation
            let transformation = `translate(${x}, ${y})`

            // Offset/Overlap
            if (!(col % trellisOverlap.row.every) && trellisOverlap.row.val.x && trellisOverlap.row.val.y)
                transformation += `translate(${trellisOverlap.row.val.x}, ${trellisOverlap.row.val.y})`
            if (!(row % trellisOverlap.col.every) && trellisOverlap.col.val.x && trellisOverlap.col.val.y)
                transformation += `translate(${trellisOverlap.col.val.x}, ${trellisOverlap.col.val.y})`

            // Rotate
            if (!(col % trellisRotate.row.every) && trellisRotate.row.val)
                transformation += `rotate(${trellisRotate.row.val})`
            if (!(row % trellisRotate.col.every) && trellisRotate.col.val)
                transformation += `rotate(${trellisRotate.col.val})`

            // Flip
            if (!(col % trellisFlip.row.every)){
                if (trellisFlip.row.val === MIRROR_AXIS.Y || trellisFlip.row.val === MIRROR_AXIS.BOTH)
                    transformation += `matrix(-1, 0, 0, 1, 0, 0)`
                if (trellisFlip.row.val === MIRROR_AXIS.X || trellisFlip.row.val === MIRROR_AXIS.BOTH)
                    transformation += `matrix(1, 0, 0, -1, 0, 0)`
            }
            if (!(row % trellisFlip.col.every)){
                if (trellisFlip.col.val === MIRROR_AXIS.Y || trellisFlip.col.val === MIRROR_AXIS.BOTH)
                    transformation += `matrix(-1, 0, 0, 1, 0, 0)`
                if (trellisFlip.col.val === MIRROR_AXIS.X || trellisFlip.col.val === MIRROR_AXIS.BOTH)
                    transformation += `matrix(1, 0, 0, -1, 0, 0)`
            }

            return transformation
        }
        else{
            return null
        }
    }

    // TODO: add a function which checks if the transformation would place it outside the viewport, and skip it if it would
    // we still need to go out a certain retrograde amount, because if we offset a skipped row/col outside of the viewport
    // back inside it
    // This will require calculating the correct translation for each pattern instead of just using 'translate()' from the
    // default position, which is substantially more difficult.
    function addPattern(transformation){
        if (transformation)
            rtn.add(transformation)
    }

    // The base pattern location
    const {x: seedx, y: seedy} = boundRect.topLeft.asSvg(state, false)

    const area = (debug ? getDebugBox(state) : new Rect(
        Point.viewportOrigin(state),
        Point.fromViewport(state, viewportWidth(), viewportHeight()),
    )).asSvg(state, false)

    // Instead of gracefully trying to calculate what will be needed, just add all the transformed patterns one at a time
    // First, start at the seed pattern, and add patterns one at a time in each direction until the bounds of the pattern are entirely
    // outside the area for retrograde* number of patterns
    // That essentially gives us the axes. From there, just fill in each quadrant

    // Add just the seed pattern (for debugging)
    // addPattern(applyTransformations(seedx, seedy, 0, 0))

    // Top left quadrant
    // This one adds the up and left axis columns
    for (var posx = seedx, col = 0; posx > area.left - retrogradex_dots; posx -= width, col--)
        for (var posy = seedy, row = 0; posy > area.top - retrogradey_dots; posy -= height, row--)
            addPattern(applyTransformations(posx, posy, row, col))
    // Top right quadrant
    for (let posx = seedx + width, col = 1; posx < area.right + retrogradex_dots; posx += width, col++)
        for (let posy = seedy, row = 0; posy > area.top - retrogradey_dots; posy -= height, row--)
            addPattern(applyTransformations(posx, posy, row, col))
    // Bottom left quadrant
    for (let posx = seedx + width, col = 1; posx > area.left - retrogradex_dots; posx -= width, col--)
        for (let posy = seedy + height, row = 1; posy < area.bottom + retrogradey_dots; posy += height, row++)
            addPattern(applyTransformations(posx, posy, row, col))
    // Bottom right quadrant
    // This one adds the down and right axis columns
    for (let posx = seedx, col = 0; posx < area.right + retrogradex_dots; posx += width, col++)
        for (let posy = seedy, row = 0; posy < area.bottom + retrogradey_dots; posy += height, row++)
            addPattern(applyTransformations(posx, posy, row, col))

    return <>
        <DebugPoint name="Area top left" point={[area.top, area.left]} color='green'/>
        <DebugPoint name="Seed" point={Point.fromSvg(state, seedx, seedy, false)} color='red'/>
        <g transform={`translate(${transx} ${transy}) scale(${scalex} ${scaley})`}>
            {Array.from(rtn).map(transformation => <g
                transform={transformation}
                // This seems inefficient, but I don't see why it wouldn't work...
                key={transformation}
                > {pattern} </g>)}
        </g>
    </>
}
