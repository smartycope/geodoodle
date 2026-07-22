import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { StateContext, ToolbarLayoutContext } from "../Contexts"
import { useTheme } from "@mui/material/styles"
import Box from "@mui/material/Box"
import MuiPaper from "@mui/material/Paper"
import Fab from "@mui/material/Fab"
import MenuRoundedIcon from "@mui/icons-material/MenuRounded"
import ToolButton from "../components/ToolButton"
import ExtraButton from "./ExtraButton"
import { isMobile } from "../utils/misc"
import { getActiveLayer } from "../utils/layers"
import TrellisLayer from "../classes/TrellisLayer"
import DrawingLayer from "../classes/DrawingLayer"
import {
  getFittingToolbarLevel,
  getLayerToolbarButtons,
  getToolbarButtonId,
  getToolbarButtons,
} from "../utils/menus"
import { viewportHeight, viewportWidth } from "../globals"

function Toolbar() {
  const { state, dispatch } = useContext(StateContext)
  const { priorityLevel, setPriorityLevel } = useContext(ToolbarLayoutContext)
  const toolbarRef = useRef(null)
  const [measuring, setMeasuring] = useState(true)
  const [measuredLayout, setMeasuredLayout] = useState(null)
  const theme = useTheme()

  const { side } = state
  const horizontal = ["top", "bottom"].includes(side)

  useEffect(() => {
    const remeasure = () => setMeasuring(true)
    window.addEventListener("resize", remeasure)
    window.visualViewport?.addEventListener("resize", remeasure)
    return () => {
      window.removeEventListener("resize", remeasure)
      window.visualViewport?.removeEventListener("resize", remeasure)
    }
  }, [])

  const handleUndoClick = (e) => {
    // prevent right-click from also triggering undo
    if (e.type === "click" && e.button === 0) dispatch("undo")
  }

  const handleUndoContextMenu = (e) => {
    e.preventDefault() // prevent browser context menu
    dispatch("redo")
  }

  let style = {}
  let fabPos = {} // this entirely depends on the values of the MuiPaper flexDirection below
  // This creates an empty space on the appropriate along the entire side of the screen
  switch (side) {
    case "right":
      style = {
        right: 0,
        width: 0,
        height: "100%",
        justifyContent: "flex-end",
        alignItems: "center",
      }
      fabPos = { right: 0, top: 0 }
      break
    case "left":
      style = {
        left: 0,
        width: 0,
        height: "100%",
        justifyContent: "flex-start",
        alignItems: "center",
      }
      fabPos = { left: 0, top: 0 }
      break
    case "bottom":
      style = {
        bottom: 0,
        width: "100%",
        height: 0,
        justifyContent: "center",
        alignItems: "flex-end",
      }
      fabPos = { right: 0, bottom: 0 }
      break
    case "top":
      style = {
        top: 0,
        width: "100%",
        height: 0,
        justifyContent: "center",
        alignItems: "flex-start",
      }
      fabPos = { right: 0, top: 0 }
      break
  }

  const activeLayer = getActiveLayer(state)
  const trellis = activeLayer instanceof TrellisLayer
  const drawing = activeLayer instanceof DrawingLayer
  const activeLayerType = trellis ? "trellis" : drawing ? "drawing" : undefined
  const layoutKey = `${side}:${activeLayerType}:${state.mobile}`
  const needsMeasurement = measuring || measuredLayout !== layoutKey

  useLayoutEffect(() => {
    if (!state.openMenus.main || !needsMeasurement || !toolbarRef.current) return

    const toolbar = toolbarRef.current
    const toolbarStyle = getComputedStyle(toolbar)
    const paddingLength = horizontal
      ? parseFloat(toolbarStyle.paddingLeft) + parseFloat(toolbarStyle.paddingRight)
      : parseFloat(toolbarStyle.paddingTop) + parseFloat(toolbarStyle.paddingBottom)
    const buttonLengths = Object.fromEntries(
      [...toolbar.querySelectorAll("[data-toolbar-item]")].map((element) => {
        const style = getComputedStyle(element)
        const size = horizontal ? element.offsetWidth : element.offsetHeight
        const margins = horizontal
          ? parseFloat(style.marginLeft) + parseFloat(style.marginRight)
          : parseFloat(style.marginTop) + parseFloat(style.marginBottom)
        return [element.dataset.toolbarItem, size + margins]
      }),
    )
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    const sideLength = horizontal ? viewportWidth() : viewportHeight()
    const nextPriorityLevel = getFittingToolbarLevel({
      availableLength: sideLength - rootFontSize,
      buttonLengths,
      paddingLength,
      layer: activeLayerType,
    })

    setPriorityLevel(nextPriorityLevel)
    setMeasuredLayout(layoutKey)
    setMeasuring(false)
  }, [activeLayerType, horizontal, layoutKey, needsMeasurement, setPriorityLevel, state.openMenus.main])

  const renderButton = (button) => {
    const buttonId = getToolbarButtonId(button)

    if (button.component === "extraButton")
      return <ExtraButton key={buttonId} data-toolbar-item={buttonId} />

    const props = {
      menu: button.menu,
      "data-toolbar-item": buttonId,
    }
    if (button.disableTooltip) props.disableTooltip = state.openMenus[button.menu]
    if (button.action === "undoRedo") {
      props.onClick = handleUndoClick
      props.onContextMenu = handleUndoContextMenu
    } else if (button.action) props.onClick = () => dispatch(button.action)

    return <ToolButton {...props} key={buttonId} />
  }

  const visibleButtons = needsMeasurement
    ? getLayerToolbarButtons(activeLayerType)
    : getToolbarButtons(priorityLevel, activeLayerType)

  // Returns the Toolbar, as well as all the menus
  const toolbar = (
    <Box
      sx={{
        display: "flex",
        position: "absolute",
        paddingTop: "env(safe-area-inset-top)",
        ...style,
      }}
    >
      <MuiPaper
        ref={toolbarRef}
        id="menu-selector-mobile"
        elevation={4}
        sx={{
          // Where the crap did this come from???
          // "-webkit-tap-highlight-color": "transparent",
          WebkitTapHighlightColor: "transparent",
          // TODO: should this be state.mobile?
          px: isMobile() ? 0.5 : 1,
          py: isMobile() ? 0.5 : 1,
          focusVisible: false,
          display: "flex",
          // TODO: I can't decide if this should be 'row' or 'row-reverse' -- I need feedback
          flexDirection: horizontal ? "row" : "column-reverse",
          margin: "0.5em",
          position: "absolute",
          // Don't allow the user to start lines between the buttons
          pointerEvents: "all",
          width: "max-content",
          height: "max-content",
          visibility: needsMeasurement ? "hidden" : "visible",
          cursor: "pointer",
          borderRadius: theme.shape.borderRadius,
          "& .tool-button": {
            mx: horizontal ? 1 : 0,
            my: horizontal ? 0 : 1,
          },
          background: theme.alpha(theme.palette.background.paper, state.toolbarOpacity),
        }}
      >
        {visibleButtons.map(renderButton)}
      </MuiPaper>
    </Box>
  )

  const fab = (
    <Fab
      sx={{
        color: theme.palette.primary.contrast,
        bgcolor: theme.alpha(theme.palette.primary.contrast, 0.1),
        position: "absolute",
        margin: 2,
        ...fabPos,
        ":hover": {
          // TODO: I don't love this, it should be the same as the hover of the ToolButtons
          backgroundColor: theme.palette.mode === "dark" ? theme.palette.primary.dark : theme.palette.primary.light,
        },
      }}
      onClick={() => dispatch({ action: "menu", toggle: "main" })}
    >
      <MenuRoundedIcon sx={{ bgcolor: "transparent" }} />
    </Fab>
  )

  return state.openMenus.main ? toolbar : fab
}

export default Toolbar
