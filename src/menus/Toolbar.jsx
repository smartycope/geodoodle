import { useContext, useState, useEffect } from "react"
import { StateContext } from "../Contexts"
import { extraSlots as _extraSlots } from "../utils/misc"
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

// TODO: On a sideways mobile screen, the toolbar goes off the screen
function Toolbar() {
  const { state, dispatch } = useContext(StateContext)
  const [, doReload] = useState()
  const theme = useTheme()

  const { side } = state
  const vertical = ["top", "bottom"].includes(side)
  const extraSlots = _extraSlots(state)

  // Reload this component when the window resizes, so extraSlots updates
  useEffect(() => {
    window.addEventListener("resize", doReload)
    return () => window.removeEventListener("resize", doReload)
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
          flexDirection: vertical ? "row" : "column-reverse",
          margin: 1,
          position: "absolute",
          // Don't allow the user to start lines between the buttons
          pointerEvents: "all",
          width: "min-content",
          height: "min-content",
          cursor: "pointer",
          borderRadius: theme.shape.borderRadius,
          "& .tool-button": {
            mx: vertical ? 1 : 0,
            my: vertical ? 0 : 1,
          },
          background: theme.alpha(theme.palette.background.paper, state.toolbarOpacity),
        }}
      >
        {/* This essentially is the config for the toolbar.
          This defines the order, priority, and conditions of the tool buttons */}
        {/* TODO: turn this into an object in options.jsx */}
        {extraSlots < 9 && <ToolButton menu="extra" disableTooltip={state.openMenus.extra} />}
        {/* This is the button which is dynamically set in settings */}
        {extraSlots >= 1 && <ExtraButton />}
        {extraSlots >= 9 && <ToolButton menu="help" />}
        {extraSlots >= 9 && <ToolButton menu="settings" />}
        {extraSlots >= 6 && <ToolButton menu="file" />}
        {drawing && extraSlots >= 7 && <ToolButton menu="navigation" />}
        {extraSlots >= 4 && <ToolButton menu="layers" />}
        {/* {extraSlots >= 3 && <ToolButton menu="repeat" />} */}
        {/* Leaving it out, for now */}
        {drawing && <ToolButton menu="mirror" />}
        {/* <ToolButton menu="mirror" /> */}
        {drawing && extraSlots >= 8 && <ToolButton menu="clipboard" />}
        {drawing && extraSlots >= 5 && <ToolButton menu="delete" />}
        {drawing && extraSlots >= 2 && <ToolButton menu="select" />}

        {trellis && extraSlots >= 3 && <ToolButton menu="toggle_dots" onClick={() => dispatch("toggle_dots")} />}
        {trellis && <ToolButton menu="reset" onClick={() => dispatch("clear_active_layer")} />}
        {trellis && <ToolButton menu="offset" />}
        {trellis && <ToolButton menu="skip" />}
        {trellis && <ToolButton menu="flip" />}
        {trellis && <ToolButton menu="rotate" />}

        {/* TODO: test and see if I like this in Trellis layers as well */}
        <ToolButton menu="undo" onClick={handleUndoClick} onContextMenu={handleUndoContextMenu} />
        {drawing && <ToolButton menu="color" />}
        <ToolButton menu="main" />
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
