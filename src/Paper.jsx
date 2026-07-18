import "./styling/App.css"
import { useEffect, useReducer, useRef, useMemo, useState } from "react"
import { PREVENT_LOADING_STATE } from "./globals"
import reducer from "./reducer"
import Toolbar from "./Menus/Toolbar"
import {
  loadCloud,
  loadCloudUsername,
  loadPreservedState,
  preserveState,
  saveCloudUsername,
  saveLocally,
} from "./fileUtils"
import { StateContext } from "./Contexts"
import generateTheme from "./styling/theme"
import useMediaQuery from "@mui/material/useMediaQuery"
import { ThemeProvider } from "@mui/material/styles"
import {
  GlowEffect,
  DebugInfo,
  MirrorMetaLines,
  ClipboardTransformButtons,
  SelectionOptionButtons,
  SelectionRect,
  Bounds,
  SpecificSelectors,
  GenericSelectors,
  CurrentLines,
  Lines,
  Clipboard,
  Cursor,
  Dots,
  Polygons,
  CurrentPolys,
  Menus,
  Toast,
} from "./drawing"
import Trellis from "./Trellis"
import getInitialState from "./states"
import * as events from "./events"
import SharedPatternDialog from "./Menus/SharedPatternDialog"
import { getSharedPatternParams, syncPatternQueryParams } from "./shareUtils"

// This is for the mouse/touch events that need to be bound non-passively, but also need access to the state
// This is hacky, but I can't think of a better way
var _state = {}
export default function Paper({ setDispatch }) {
  const paper = useRef()
  const initialState = useMemo(() => getInitialState(), [])
  const sharedPatternParams = useMemo(() => getSharedPatternParams(), [])
  const initialCloudUsername = useMemo(() => loadCloudUsername(), [])
  const [state, dispatch] = useReducer(reducer, initialState)
  const [cloudUsername, setCloudUsername] = useState(initialCloudUsername)
  const [resolvingSharedLink, setResolvingSharedLink] = useState(Boolean(sharedPatternParams))
  const [sharedPatternConflict, setSharedPatternConflict] = useState(null)
  const { dotsAbovefill, paperColor, fillMode, themeMode } = state
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
  const theme = useMemo(
    () => generateTheme(paperColor, themeMode, prefersDarkMode ? "dark" : "light"),
    [paperColor, themeMode, prefersDarkMode],
  )

  // Forcibly disallow scrolling (just in case)
  window.scrollX = 0
  window.scrollY = 0

  _state = state

  useEffect(() => {
    if (resolvingSharedLink) return
    saveCloudUsername(cloudUsername)
    syncPatternQueryParams(cloudUsername, state.filename)
  }, [cloudUsername, resolvingSharedLink, state.filename])

  // Capture touch events non-passively so we can prevent default
  useEffect(() => {
    const onTouchMove = (e) => events.onTouchMove(_state, dispatch, e)
    const onTouchEnd = (e) => events.onTouchEnd(_state, dispatch, e)
    const onTouchStart = (e) => events.onTouchStart(_state, dispatch, e)
    const onScroll = (e) => events.onScroll(_state, dispatch, e)

    // See https://stackoverflow.com/questions/63663025/react-onwheel-handler-cant-preventdefault-because-its-a-passive-event-listenev
    // for why we have to do it this way (because of the zoom browser shortcut)
    const _paper = paper.current
    _paper.addEventListener("wheel", onScroll, { passive: false })
    _paper.addEventListener("touchend", onTouchEnd, { passive: false })
    _paper.addEventListener("touchstart", onTouchStart, { passive: false })
    _paper.addEventListener("touchmove", onTouchMove, { passive: false })
    return () => {
      _paper?.removeEventListener("wheel", onScroll)
      _paper?.removeEventListener("touchend", onTouchEnd)
      _paper?.removeEventListener("touchstart", onTouchStart)
      _paper?.removeEventListener("touchmove", onTouchMove)
    }
  }, [])

  // Restore preserved state, then resolve a shared cloud pattern if the URL points to one.
  useEffect(() => {
    const local = PREVENT_LOADING_STATE ? null : loadPreservedState()
    if (local) dispatch({ action: "deserialize", data: local })

    if (!sharedPatternParams) return
    if (local && sharedPatternParams.user === initialCloudUsername && sharedPatternParams.pattern === local.filename) {
      setResolvingSharedLink(false)
      return
    }

    let current = true
    loadCloud(sharedPatternParams.user, sharedPatternParams.pattern)
      .then((shared) => {
        if (!current) return
        if (!shared) {
          dispatch({ toast: "Shared cloud pattern not found" })
          setResolvingSharedLink(false)
          return
        }

        const restoredState = { ...initialState, ...(local ?? {}) }
        const nextState = { ...restoredState, ...shared, filename: sharedPatternParams.pattern }
        if (local?.lines?.length) {
          setSharedPatternConflict({ ...sharedPatternParams, local: restoredState, shared })
          return
        }

        dispatch({ action: "deserialize", data: nextState })
        preserveState(nextState)
        setCloudUsername(sharedPatternParams.user)
        setResolvingSharedLink(false)
      })
      .catch((error) => {
        console.error("Unable to load shared cloud pattern:", error)
        if (current) {
          dispatch({ toast: "Unable to load shared cloud pattern" })
          setResolvingSharedLink(false)
        }
      })

    return () => {
      current = false
    }
  }, [initialCloudUsername, initialState, sharedPatternParams])

  const loadPendingSharedPattern = () => {
    if (!sharedPatternConflict) return
    const nextState = {
      ...state,
      ...sharedPatternConflict.shared,
      filename: sharedPatternConflict.pattern,
    }
    dispatch({ action: "deserialize", data: nextState })
    preserveState(nextState)
    setCloudUsername(sharedPatternConflict.user)
    setResolvingSharedLink(false)
    setSharedPatternConflict(null)
  }

  const cancelSharedPatternLoad = () => {
    setResolvingSharedLink(false)
    setSharedPatternConflict(null)
  }

  const saveCurrentAndLoadSharedPattern = (name) => {
    saveLocally(name, sharedPatternConflict.local)
    loadPendingSharedPattern()
  }

  // So the tour can effect state
  useEffect(() => setDispatch(dispatch), [setDispatch])

  // Focus the paper element first thing
  useEffect(() => paper.current.focus(), [])

  return (
    <ThemeProvider theme={theme}>
      <StateContext.Provider value={{ state, dispatch, cloudUsername, setCloudUsername }}>
        <SharedPatternDialog
          conflict={sharedPatternConflict}
          onCancel={cancelSharedPatternLoad}
          onIgnore={loadPendingSharedPattern}
          onSave={saveCurrentAndLoadSharedPattern}
        />
        <div>
          <Toast />
          <Toolbar />
          <Menus />
          {/* onCopy, onPaste, and onCut are implemented with keyboard shortcuts instead of here, so they can be changed */}
          <svg
            id="paper"
            width="100%"
            height="101vh"
            tabIndex={0}
            ref={paper}
            onKeyDown={(e) => events.onKeyDown(state, dispatch, e)}
            onKeyUp={(e) => events.onKeyUp(state, dispatch, e)}
            onMouseMove={(e) => events.onMouseMove(state, dispatch, e)}
            onMouseDown={(e) => events.onMouseDown(state, dispatch, e)}
            onMouseUp={(e) => events.onMouseUp(state, dispatch, e)}
            onBlur={(e) => events.onBlur(state, dispatch, e)}
            style={{
              backgroundColor: paperColor,
              cursor: fillMode ? "pointer" : "none",
            }}
          >
            {/* This order is intentional */}
            <GlowEffect />
            {!dotsAbovefill && <Dots />}
            <Trellis />
            <Polygons />
            <CurrentPolys />
            {dotsAbovefill && <Dots />}
            <DebugInfo />
            <Cursor />
            <Lines />
            <CurrentLines />
            <Bounds />
            <SpecificSelectors />
            <GenericSelectors />
            <SelectionRect />
            <SelectionOptionButtons />
            <ClipboardTransformButtons />
            <MirrorMetaLines />
            <Clipboard />
          </svg>
          {/* For exporting to images */}
          <canvas id="canvas"></canvas>
        </div>
      </StateContext.Provider>
    </ThemeProvider>
  )
}
