export const version = "1.8.0"

export const MIRROR_TYPE = {
  PAGE: 1,
  CURSOR: 2,
}

export const MIRROR_AXIS = {
  NONE: 0b00,
  Y: 0b01,
  X: 0b10,
  BOTH: 0b11,
}

// TODO: make this use radians instead, it only comes in increments of 90 degrees, there's no reason not to use radians
export const MIRROR_ROT = {
  NONE: 0,
  RIGHT: 90,
  STRAIGHT: 180,
  QUAD: 270,
}

export const localStorageName = "GeoDoodleSaves"
export const localStorageSettingsName = "GeoDoodleState"
export const localStorageTourTakenName = "GeoDoodleTourTaken"
export const localStorageCloudUsernameName = "GeoDoodleCloudUsername"

// Mutable globals -- these are here so the vite HMR fast refresh will work. They should be in Paper.jsx

// The only places this is touched, is in reducer.jsx in 'cursor moved' and events.jsx
// export var tapHolding = false
// export const setTapHolding = to => tapHolding = to

// If the visual viewport is not available, assume we're in a testing environment
export const viewportWidth = () => (window ? window.visualViewport?.width || 1024 : 1024)
export const viewportHeight = () => (window ? window.visualViewport?.height || 768 : 768)

export function isMobile() {
  const smallDim = 768
  const smallWidth = window.innerWidth <= smallDim
  const smallHeight = window.innerHeight <= smallDim
  const phoneRatio =
    Math.min(window.innerWidth, window.innerHeight) / Math.max(window.innerWidth, window.innerHeight) < 0.6
  return phoneRatio ? smallWidth || smallHeight : smallWidth && smallHeight
}

// These are used in reducer.jsx (which saves the current state for the undoStack) and in actions.jsx (which does stuff with them)
export var undoStack = []
export var redoStack = []

// For debugging
// eslint-disable-next-line no-undef
export const START_DEBUGGING = process.env.NODE_ENV === "development" && true
export const PREVENT_LOADING_STATE = START_DEBUGGING

// This is here for hot refresh reasons
export const extraButtons = {
  copy_image: { action: "copy_image" },
  home: { action: "go_home" },
  redo: { action: "redo" },
  generic_select: { action: "add_generic_selector" },
  toggle_dots: { action: "toggle_dots" },
}

export const cursors = ["circle", "crosshair", "x"]
