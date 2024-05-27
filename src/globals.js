export const version = '1.4.4'
export const MIRROR_AXIS = {
    NONE_0: 0,
    VERT_90: 90,
    HORZ_180: 180,
    BOTH_360: 270,
}

export const MIRROR_TYPE = {
    NONE: 0,
    PAGE: 1,
    CURSOR: 2,
}

export const MIRROR_METHOD = {
    NONE: 0,
    FLIP: 1,
    ROTATE: 2,
    BOTH: 3,
}

export const localStorageName = 'GeoDoodleSaves'
export const localStorageSettingsName = "GeoDoodleState"
export const localStorageTourTakenName = "GeoDoodleTourTaken"


// Mutable globals -- these are here so the vite HMR fast refresh will work. They should be in Paper.jsx

// The only place outside this file that this is touched, is in reducer.jsx in 'cursor moved'
export var tapHolding = false
export const setTapHolding = to => tapHolding = to

// Explanation:
// We use the bounding rect to get the selection while repeating, so we can select something that's guarenteed to be a
// pattern. Because of that, we have to get the rect *after* it's been displayed. This means we're always 1 render behind.
// Because of that, every other render it's null, because the selection is null. This stablizes that.
// The same thing also happens in utils for getSelected()
export var selected = null
export const setSelected = to => selected = to
