import {MIRROR_AXIS} from "./globals";
import {viewportWidth, viewportHeight, getSelected, calc, align} from "./utils";

// This is the main logic for generating the trellis
// It returns a list of groups of the pattern with appropriate translations
export function getTrellis(state){
    /* Indices
        rows:
        -2 <- top row
        -1
        0 <- seed pattern
        1
        2 <- bottom row

        columns:
        left   -2 -1 0 1 2   right
    */

    const {
        trellisOverlap,
        trellisSkip,
        trellisFlip,
        trellisRotate,
        scalex, scaley,
        translationx, translationy,
        debug,
    } = state

    const {boundRect, scaledTranslationx, scaledTranslationy} = calc(state)

    var rtn = new Set()

    // First, calculate all the variables we need
    // A list of <line> objects, or null
    // Coord: absolute @ (0,0), scaled
    const pattern = getSelected(state)

    let width = boundRect.width
    let height = boundRect.height

    // TODO: this could use some refinement, though I think it's pretty solid for now
    // I think this is accurate?
    const dimDiff = (trellisFlip.row.val || trellisFlip.col.val || trellisRotate.row.val || trellisRotate.col.val) ? Math.abs(width - height) : 0
    // Imagine the "default" pattern to be a tellise with no special properties: it's just tesselated evenly across the area
    // This is at most how many dots outside a pattern might go outside of it's "default" position
    const retrogradex_dots = trellisOverlap.row.val.x + trellisOverlap.col.val.x + dimDiff + height + 1
    const retrogradey_dots = trellisOverlap.row.val.y + trellisOverlap.col.val.y + dimDiff + width + 1

    function applyTransformations(x, y, row, col){
        // Skip
        if ((!trellisSkip.row.val || !(col % trellisSkip.row.every)) &&
            (!trellisSkip.col.val || !(row % trellisSkip.col.every))){
        
            // Initial translation
            let transformation = `translate(${x}, ${y})`
            // let transformation = ''

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
                if (trellisFlip.row.val === MIRROR_AXIS.VERT_90 || trellisFlip.row.val === MIRROR_AXIS.BOTH_360)
                    transformation += `matrix(-1, 0, 0, 1, 0, 0)`
                if (trellisFlip.row.val === MIRROR_AXIS.HORZ_180 || trellisFlip.row.val === MIRROR_AXIS.BOTH_360)
                    transformation += `matrix(1, 0, 0, -1, 0, 0)`
            }
            if (!(row % trellisFlip.col.every)){
                if (trellisFlip.col.val === MIRROR_AXIS.VERT_90 || trellisFlip.col.val === MIRROR_AXIS.BOTH_360)
                    transformation += `matrix(-1, 0, 0, 1, 0, 0)`
                if (trellisFlip.col.val === MIRROR_AXIS.HORZ_180 || trellisFlip.col.val === MIRROR_AXIS.BOTH_360)
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

    // Coords: absolute, scaled
    // The base pattern location
    const seedx = boundRect.left + scaledTranslationx 
    const seedy = boundRect.top + scaledTranslationy

    // Coords: realtive, scaled
    let debugBox_xy = align(state, viewportWidth() / 4, viewportHeight() / 4)
    debugBox_xy = [debugBox_xy[0] / scalex, debugBox_xy[1] / scaley]

    const debug_shrink_factor = debug ? 2 : 1
    const areaWidth = (viewportWidth() / debug_shrink_factor) / scalex
    const areaHeight = (viewportHeight() / debug_shrink_factor) / scaley
    const areaRect = {
        left: debug ? debugBox_xy[0] : 0,
        top: debug ? debugBox_xy[1] : 0,
        right: debug ? debugBox_xy[0] + areaWidth : areaWidth,
        bottom: debug ? debugBox_xy[1] + areaHeight : areaHeight,
    }

    // Instead of gracefully trying to calculate what will be needed, instead add all the transformed patterns one at a time
    // First, start at the seed pattern, and add patterns one at a time in each direction until the bounds of the pattern are entirely 
    // outside the area for retrograde* number of patterns
    // That essentially gives us the axes. From there, just fill in each quadrant

    // Top left quadrant
    // This one adds the up and left axis columns
    for (let posx = seedx, col = 0; posx > areaRect.left - retrogradex_dots; posx -= width, col--){
        for (let posy = seedy, row = 0; posy > areaRect.top - retrogradey_dots; posy -= height, row--)
            addPattern(applyTransformations(posx, posy, row, col))
    }
    // Top right quadrant
    for (let posx = seedx + width, col = 1; posx < areaRect.right + retrogradex_dots; posx += width, col++){
        for (let posy = seedy, row = 0; posy > areaRect.top - retrogradey_dots; posy -= height, row--)
            addPattern(applyTransformations(posx, posy, row, col))
    }
    // Bottom left quadrant
    for (let posx = seedx + width, col = 1; posx > areaRect.left - retrogradex_dots; posx -= width, col--){
        for (let posy = seedy + height, row = 1; posy < areaRect.bottom + retrogradey_dots; posy += height, row++)
            addPattern(applyTransformations(posx, posy, row, col))
    }
    // Bottom right quadrant
    // This one adds the down and right axis columns
    for (let posx = seedx, col = 0; posx < areaRect.right + retrogradex_dots; posx += width, col++){
        for (let posy = seedy, row = 0; posy < areaRect.bottom + retrogradey_dots; posy += height, row++)
            addPattern(applyTransformations(posx, posy, row, col))
    }
    
    return Array.from(rtn).map(transformation => <g
        transform={transformation}
        // This seems inneficient, but I can't figure out why it wouldn't work...
        key={transformation}
    > {pattern} </g>)
}
