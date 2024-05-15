import {getSelected} from "./utils";

// This is the main logic for generating the trellis
// It returns a list of groups of the pattern with appropriate translations
export function getTrellis(state){
    const {
        trellisRowSkip,
        trellisColSkip,
        trellisOverlapx,
        trellisOverlapy,
        trellisFlipRows,
        trellisFlipCols,
        trellisRotateRows,
        trellisRotateCols,
        scalex, scaley,
        translationx, translationy,
    } = state
    var rtn = []

    // console.log('getTrellis() called!');

    // First, calculate all the variables we need
    // A list of <line> objects, or null
    // Coord: absolute @ (0,0), scaled
    const pattern = getSelected(state)
    // Coord: scalar, scaled
    const xs = pattern.map(i => [i.props.x1, i.props.x2]).flat()
    const ys = pattern.map(i => [i.props.y1, i.props.y2]).flat()
    // Coord: scalar, scaled
    const width  = Math.max(...xs) - Math.min(...xs)
    const height = Math.max(...ys) - Math.min(...ys)
    // Coord: scalar, scaled
    const areaWidth  = window.visualViewport.width  / scalex
    const areaHeight = window.visualViewport.height / scaley
    // Coord: scalar, scaled
    const shiftx = width  + trellisOverlapx
    const shifty = height + trellisOverlapy

    // console.log('areaWidth:', areaWidth);
    // console.log('shiftx:', shiftx);
    // console.log('areaHeight:', areaHeight);
    // console.log('shifty:', shifty);
    // console.log('width:', width);
    // console.log('trellisOverlapx:', trellisOverlapx);
    // console.log('height:', height);
    // console.log('trellisOverlapy:', trellisOverlapy);

    if (xs.length < 1 || shiftx < 1 || shifty < 1 || width < 1 || height < 1)
        return []

    for (let row = 0, x = 0; x < areaWidth; x += shiftx, row++) {
        for (let col = 0, y = 0; y < areaHeight; y += shifty, col++) {
            rtn.push(<g transform={`translate(${x}, ${y})`}>
                {pattern}
            </g>)
        }
    }

    return rtn
}
