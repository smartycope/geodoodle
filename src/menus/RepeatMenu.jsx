import { useContext, useEffect, useState } from "react"
import { MIRROR_AXIS, MIRROR_ROT } from "../globals"
import { MirrorAxisIcon, MirrorRotIcon } from "../components/CustomIcons"
import Number from "../components/Number"

import { StateContext } from "../Contexts"
import KeyboardTabIcon from "@mui/icons-material/KeyboardTab"
import RedoIcon from "@mui/icons-material/Redo"
import FlipIcon from "@mui/icons-material/Flip"
import { Box, IconButton, SpeedDial, SpeedDialAction, Typography, useTheme } from "@mui/material"
import ReplayIcon from "@mui/icons-material/Replay"
import ToggleIconButtonGroup from "../components/ToggleIconButtonGroup"
import BlurOnIcon from "@mui/icons-material/BlurOn"
import BlurOffIcon from "@mui/icons-material/BlurOff"
import DashboardIcon from "@mui/icons-material/Dashboard"
import CheckIcon from "@mui/icons-material/Check"
import FindReplaceIcon from "@mui/icons-material/FindReplace"
import CallMadeIcon from "@mui/icons-material/CallMade"

export default function RepeatMenu() {
  const { state, dispatch } = useContext(StateContext)
  const [speedDialOpen, setSpeedDialOpen] = useState(false)
  const [openSubMenus, setOpenSubMenus] = useState({
    offset: false,
    skip: false,
    flip: false,
    rotate: false,
  })
  const { side } = state
  const draft = state.trellisDraft
  const hasCompletedSelection = state.bounds.length > 1

  // Selection-removing actions can discard the draft while this menu (and an
  // open submenu) is mounted. Close through the normal menu action so toolbar
  // state is restored consistently.
  useEffect(() => {
    if (!draft && state.openMenus.repeat) dispatch({ action: "menu", close: "repeat" })
  }, [dispatch, draft, state.openMenus.repeat])

  if (!draft) return null

  // Be sure to close all the others
  const handleSubMenuClick = (subMenu) => {
    setOpenSubMenus({
      offset: subMenu === "offset" && !openSubMenus.offset,
      skip: subMenu === "skip" && !openSubMenus.skip,
      flip: subMenu === "flip" && !openSubMenus.flip,
      rotate: subMenu === "rotate" && !openSubMenus.rotate,
    })
  }

  const vertical = window.innerHeight > window.innerWidth

  // In the corner
  let pos = { top: 16, left: 16 }
  // Below the toolbar FAB
  if (side === "top") pos = { top: "5rem", right: 16 }
  // To the left of the toolbar FAB
  else if (side === "right") pos = { top: 16, right: "5rem" }

  // For the tooltips
  const placement = vertical ? "right" : "bottom-end"
  // TODO: the vertical here just disables tooltips if the menu is sideways, because SpeedDialActions
  // don't seem to acknowledge the placement prop
  const open = state.mobile && vertical

  return (
    <>
      <SpeedDial
        id="repeat-speed-dial"
        sx={{ position: "absolute", ...pos }}
        ariaLabel="Repeat Menu"
        direction={vertical ? "down" : "left"}
        // direction="down"
        icon={<DashboardIcon />}
        open={speedDialOpen}
        onClick={() => setSpeedDialOpen(!speedDialOpen)}
      >
        {/* TODO: make the tooltips transparent */}
        <SpeedDialAction
          icon={<KeyboardTabIcon />}
          slotProps={{ tooltip: { title: "Offset", open, placement } }}
          // tooltipPlacement={placement}
          onClick={() => handleSubMenuClick("offset")}
        />
        <SpeedDialAction
          icon={<RedoIcon />}
          slotProps={{ tooltip: { title: "Skip", open, placement } }}
          onClick={() => handleSubMenuClick("skip")}
        />
        <SpeedDialAction
          icon={<FlipIcon />}
          slotProps={{ tooltip: { title: "Flip", open, placement } }}
          onClick={() => handleSubMenuClick("flip")}
        />
        <SpeedDialAction
          icon={MirrorRotIcon(MIRROR_ROT.STRAIGHT)}
          slotProps={{ tooltip: { title: "Rotate", open, placement } }}
          onClick={() => handleSubMenuClick("rotate")}
        />
        {/* <SpeedDialAction
          id="repeat-apply"
          icon={<CheckIcon />}
          slotProps={{ tooltip: { title: "Apply", open, placement } }}
          onClick={(e) => {
            dispatch("apply_trellis")
            e.stopPropagation()
          }}
        /> */}
        {/* {state.trellis && hasCompletedSelection && (
          <SpeedDialAction
            icon={<FindReplaceIcon />}
            slotProps={{ tooltip: { title: "Replace", open, placement } }}
            onClick={(e) => {
              dispatch("replace_trellis")
              e.stopPropagation()
            }}
          />
        )} */}
        {/* {state.trellis && (
          <SpeedDialAction
            icon={<CallMadeIcon />}
            slotProps={{ tooltip: { title: "Release", open, placement } }}
            onClick={(e) => {
              dispatch("release_trellis")
              e.stopPropagation()
            }}
          />
        )} */}
        <SpeedDialAction
          icon={<ReplayIcon />}
          slotProps={{ tooltip: { title: "Reset", open, placement } }}
          onClick={(e) => {
            dispatch("clear_active_layer")
            e.stopPropagation()
          }}
          onClickCapture={() => setSpeedDialOpen(true)}
        />
        <SpeedDialAction
          icon={state.hideDots ? <BlurOnIcon /> : <BlurOffIcon />}
          slotProps={{ tooltip: { title: "Toggle Dots", open, placement } }}
          onClick={(e) => {
            dispatch("toggle_dots")
            e.stopPropagation()
          }}
        />
      </SpeedDial>

      {openSubMenus.offset && <OffsetMenu />}
      {openSubMenus.skip && <SkipMenu />}
      {openSubMenus.flip && <FlipMenu />}
      {openSubMenus.rotate && <RotateMenu />}
    </>
  )
}
