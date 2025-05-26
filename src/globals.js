export const version = '1.6.2'
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

// The only places this is touched, is in reducer.jsx in 'cursor moved' and events.jsx
export var tapHolding = false
export const setTapHolding = to => tapHolding = to

// If the visual viewport is not available, assume we're in a testing environment
export const viewportWidth  = () => window ? window.visualViewport?.width || 1024 : 1024
export const viewportHeight = () => window ? window.visualViewport?.height || 768 : 768


// These are used in reducer.jsx (which saves the current state for the undoStack) and in actions.jsx (which does stuff with them)
export var undoStack = []
export var redoStack = []

// For debugging
// ChatGPT said this works
// eslint-disable-next-line no-undef
export const START_DEBUGGING = process.env.NODE_ENV === 'development'
export const PREVENT_LOADING_STATE = START_DEBUGGING
