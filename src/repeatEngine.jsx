import {MIRROR_AXIS} from "./globals";
import {getSelected, calc} from "./utils";

// This is the main logic for generating the trellis
// It returns a list of groups of the pattern with appropriate translations
export function getTrellis(state){
    const {
        trellisOverlap,
        trellisSkip,
        trellisFlip,
        trellisRotate,
        scalex, scaley,
        translationx, translationy,
        bounds,
    } = state

    const {boundRect, offsetx, offsety} = calc(state)

    var rtn = []

    // console.log('getTrellis() called!');

    // First, calculate all the variables we need
    // A list of <line> objects, or null
    // Coord: absolute @ (0,0), scaled
    const pattern = getSelected(state)
    // Coord: scalar, scaled
    const areaWidth  = window.visualViewport.width  / scalex
    const areaHeight = window.visualViewport.height / scaley
    // Coord: scalar, scaled
    // We round here just to account for floating point errors
    // The extra - width/height is to make sure we're drawing off the page
    const startOffsetx = (((boundRect.left * scalex + translationx) % (boundRect.width  * scalex)) / scalex) - boundRect.width
    const startOffsety = (((boundRect.top  * scaley + translationy) % (boundRect.height * scaley)) / scaley) - boundRect.height

    // console.warn('area:', areaWidth, areaHeight);
    // console.log('shift:', shiftx, shifty);
    // console.log('boundRect:', boundRect);
    // console.log('trellisOverlap:', trellisOverlap);
    // console.log('lhs:', ((boundRect.left * scalex) - translationx) / scalex);
    // console.log('rhs:', (boundRect.width  * scalex) / scalex);
    // console.log('startOffset:', startOffsetx, startOffsety);
    // console.log('bounds:', bounds);
    // console.log('pattern:', pattern);

    // Checking that we don't try to do something that ruins our math (i.e. /0)
    if (pattern.length < 1 || boundRect.width < 1 || boundRect.height < 1)
        return []

    let center

    for (let row = 0, x = startOffsetx; x < areaWidth; x += boundRect.width, row++) {
        for (let col = 0, y = startOffsety; y < areaHeight; y += boundRect.height, col++) {
            // Skip
            if ((!trellisSkip.row.val || !(col % trellisSkip.row.every)) &&
                (!trellisSkip.col.val || !(row % trellisSkip.col.every))){

                // Initial translation
                let transformation = `translate(${x}, ${y}) `

                // Offset/Overlap
                if (!(col % trellisOverlap.row.every))
                    transformation += `translate(${trellisOverlap.row.val.x}, ${trellisOverlap.row.val.y})`
                if (!(row % trellisOverlap.col.every))
                    transformation += `translate(${trellisOverlap.col.val.x}, ${trellisOverlap.col.val.y})`

                // Rotate
                if (!(col % trellisRotate.row.every))
                    transformation += `rotate(${trellisRotate.row.val})`
                if (!(row % trellisRotate.col.every))
                    transformation += `rotate(${trellisRotate.col.val})`

                // Flip
                if (!(col % trellisFlip.row.every)){
                    if (trellisFlip.row.val === MIRROR_AXIS.VERT_90 || trellisFlip.row.val === MIRROR_AXIS.BOTH_360)
                        transformation += `matrix(-1, 0, 0, 1, 0, 0) `
                    if (trellisFlip.row.val === MIRROR_AXIS.HORZ_180 || trellisFlip.row.val === MIRROR_AXIS.BOTH_360)
                        transformation += `matrix(1, 0, 0, -1, 0, 0) `
                }
                if (!(row % trellisFlip.col.every)){
                    if (trellisFlip.col.val === MIRROR_AXIS.VERT_90 || trellisFlip.col.val === MIRROR_AXIS.BOTH_360)
                        transformation += `matrix(-1, 0, 0, 1, 0, 0) `
                    if (trellisFlip.col.val === MIRROR_AXIS.HORZ_180 || trellisFlip.col.val === MIRROR_AXIS.BOTH_360)
                        transformation += `matrix(1, 0, 0, -1, 0, 0) `
                }

                // if ((areaWidth/2) / boundRect.width === x && (areaHeight/2) / boundRect.height === y)
                //     center = pattern

                rtn.push(<g transform={transformation} key={`${row}-${col}`}>
                    {pattern}
                </g>)
            }
        }
    }
    // return [rtn, rtn[rtn.length/2].props.transform]
    return rtn
}
