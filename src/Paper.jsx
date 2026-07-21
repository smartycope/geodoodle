import "./styling/App.css"
import { useEffect, useReducer, useRef, useMemo, useState } from "react"
import { PREVENT_LOADING_STATE } from "./globals"
import reducer from "./reducer"
import Toolbar from "./menus/Toolbar"
import { loadCloud, loadUsername, loadPreservedState, preserveState, saveUsername, saveLocally } from "./utils/files"
import { StateContext } from "./Contexts"
import generateTheme from "./styling/theme"
import useMediaQuery from "@mui/material/useMediaQuery"
import { ThemeProvider } from "@mui/material/styles"
import {
  GlowEffect,
  BackgroundImage,
  DebugInfo,
  MirrorMetaLines,
  ClipboardTransformButtons,
  SelectionOptionButtons,
  SelectionRect,
  Bounds,
  SpecificSelectors,
  GenericSelectors,
  CurrentLines,
  // ActiveSelectionLines,
  ArtworkLayers,
  Clipboard,
  Cursor,
  Dots,
  CurrentPolys,
  Menus,
  Toast,
} from "./drawing"
import getInitialState from "./states"
import * as events from "./events"
import SharedPatternDialog from "./menus/SharedPatternDialog"
import { getSharedPatternParams, syncPatternQueryParams } from "./utils/share"
import { getLayerState } from "./utils/layers"

// This is for the mouse/touch events that need to be bound non-passively, but also need access to the state
// This is hacky, but I can't think of a better way
var _state = {}
export default function Paper({ setDispatch }) {
  const paper = useRef()
  const initialState = useMemo(() => getInitialState(), [])
  const sharedPatternParams = useMemo(() => getSharedPatternParams(), [])
  const initialUsername = useMemo(() => loadUsername(), [])
  const [state, dispatch] = useReducer(reducer, initialState)
  const activeState = useMemo(() => getLayerState(state), [state])
  const [resolvingSharedLink, setResolvingSharedLink] = useState(Boolean(sharedPatternParams))
  const [sharedPatternConflict, setSharedPatternConflict] = useState(null)
  const { dotsAboveArtwork, paperColor, fillMode, themeMode } = activeState
  const editingEnabled = state.layers.find((layer) => layer.id === state.activeLayerId)?.visible !== false
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)")
  const theme = useMemo(
    () => generateTheme(paperColor, themeMode, prefersDarkMode ? "dark" : "light"),
    [paperColor, themeMode, prefersDarkMode],
  )

  // Forcibly disallow scrolling (just in case)
  window.scrollX = 0
  window.scrollY = 0

  _state = activeState

  useEffect(() => {
    if (resolvingSharedLink) return
    saveUsername(state.username)
    syncPatternQueryParams(state.username, state.filename)
  }, [state.username, resolvingSharedLink, state.filename])

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
    if (local && sharedPatternParams.user === initialUsername && sharedPatternParams.pattern === local.filename) {
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
        if (local?.layers?.some((layer) => !layer.isEmpty)) {
          setSharedPatternConflict({ ...sharedPatternParams, local: restoredState, shared })
          return
        }

        dispatch({ action: "deserialize", data: nextState })
        preserveState(nextState)
        dispatch({ username: sharedPatternParams.user })
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
  }, [initialUsername, initialState, sharedPatternParams])

  const loadPendingSharedPattern = () => {
    if (!sharedPatternConflict) return
    const nextState = {
      ...state,
      ...sharedPatternConflict.shared,
      filename: sharedPatternConflict.pattern,
    }
    dispatch({ action: "deserialize", data: nextState })
    preserveState(nextState)
    dispatch({ username: sharedPatternConflict.user })
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
      <StateContext.Provider value={{ state: activeState, dispatch }}>
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
            onKeyDown={(e) => events.onKeyDown(activeState, dispatch, e)}
            onKeyUp={(e) => events.onKeyUp(activeState, dispatch, e)}
            onMouseMove={(e) => events.onMouseMove(activeState, dispatch, e)}
            onMouseDown={(e) => events.onMouseDown(activeState, dispatch, e)}
            onMouseUp={(e) => events.onMouseUp(activeState, dispatch, e)}
            onBlur={(e) => events.onBlur(activeState, dispatch, e)}
            style={{
              backgroundColor: paperColor,
              cursor: fillMode ? "pointer" : "none",
            }}
          >
            {/* This order is intentional -- lower elements are on top */}
            <DebugInfo />
            <GlowEffect />
            <BackgroundImage />
            {!dotsAboveArtwork && <Dots />}
            <ArtworkLayers />
            {dotsAboveArtwork && <Dots />}
            {editingEnabled && (
              <>
                <CurrentPolys />
                {/* <ActiveSelectionLines /> */}
                <Cursor />
                <CurrentLines />
                <Bounds />
                <SpecificSelectors />
                <GenericSelectors />
                <SelectionRect />
                <SelectionOptionButtons />
                <ClipboardTransformButtons />
                <MirrorMetaLines />
                <Clipboard />
              </>
            )}
          </svg>
          {/* For exporting to images */}
          <canvas id="canvas"></canvas>
        </div>
      </StateContext.Provider>
    </ThemeProvider>
  )
}
