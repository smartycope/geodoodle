import {MIRROR_AXIS} from "./globals";
import {getSelected, calc, align} from "./utils";
import options from "./options";

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
        partials,
        debug,
    } = state

    const {boundRect, offsetx, offsety} = calc(state)

    var rtn = []

    // console.log('getTrellis() called!');

    // First, calculate all the variables we need
    // A list of <line> objects, or null
    // Coord: absolute @ (0,0), scaled
    const pattern = getSelected(state)
    // Coord: scalar, scaled
    let areaWidth  = window.visualViewport.width  / scalex
    let areaHeight = window.visualViewport.height / scaley
    // Coord: scalar, scaled
    // The extra - width/height is to make sure we're drawing off the page
    // let startOffsetx = (((boundRect.left * scalex + translationx) % (boundRect.width  * scalex)) / scalex) - boundRect.width
    // let startOffsety = (((boundRect.top  * scaley + translationy) % (boundRect.height * scaley)) / scaley) - boundRect.height
    // let startOffsetx = (translationx % scalex + 1) / scalex
    // let startOffsety = (translationy % scaley + 1) / scaley
    // let startOffsetx = (translationx / scalex)
    // let startOffsety = (translationy / scaley)
    // let startOffsetx = 0
    // let startOffsety = 0

    let width = boundRect.width
    let height = boundRect.height
    // width += trellisOverlap.col.val.x
    // width += trellisOverlap.row.val.x
    // height += trellisOverlap.col.val.y
    // height += trellisOverlap.row.val.y
    let startOffsetx = (((boundRect.left * scalex + translationx) % (width  * scalex)) / scalex) - width
    let startOffsety = (((boundRect.top  * scaley + translationy) % (height * scaley)) / scaley) - height

    if (debug){
        areaWidth = (window.visualViewport.width / 1.5) / scalex
        areaHeight = (window.visualViewport.height / 1.5) / scaley

        const debugBox_xy = align(state, window.visualViewport.width / 4, window.visualViewport.height / 4)
        // areaWidth = (window.visualViewport.width / 2) / scalex
        // areaHeight = (window.visualViewport.height / 2) / scaley
        startOffsetx += debugBox_xy[0] / scalex
        startOffsety += debugBox_xy[1] / scaley
    }

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

                const selected = (row === 4 && col === 4)
                    // (x === ((areaWidth-startOffsetx) / 2) / boundRect.width) &&
                    // (y === ((areaHeight-startOffsety) / 2) / boundRect.height)


                rtn.push(<g
                    transform={transformation}
                    key={`${row}-${col}`}
                    id={selected ? 'selected-trellis-pattern' : undefined}
                >
                    {pattern}
                </g>)
            }
        }
    }

    return rtn
}
