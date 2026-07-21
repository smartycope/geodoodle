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
import TrellisSubMenu from "../components/TrellisSubMenu"
import {
  boxSx,
  sharedProps,
  sharedButtonGroupProps,
  centeredVerticalLabelStyle,
  updateDraft,
  numberAlpha,
  numberProps,
} from "../utils/menus"

export default function FlipMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { row, col } = state.trellisDraft.trellis.flip
  const props = {
    ...sharedProps,
    buttons: [
      // TODO: I don't love these icons for this, I think they should be different
      { label: "Horz", icon: MirrorAxisIcon(MIRROR_AXIS.Y), value: MIRROR_AXIS.Y },
      { label: "Vert", icon: MirrorAxisIcon(MIRROR_AXIS.X), value: MIRROR_AXIS.X },
      { label: "Both", icon: MirrorAxisIcon(MIRROR_AXIS.BOTH), value: MIRROR_AXIS.BOTH },
    ],
  }

  return (
    <TrellisSubMenu
      title="Flip"
      resetVal={MIRROR_AXIS.NONE}
      transformation="flip"
      byVertical={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            sx={{ width: "2.5rem" }}
            vertical
            buttonGroupSx={sharedButtonGroupProps(theme)}
            value={col.val}
            onChange={(newValue) => updateDraft(dispatch, "flip", { col: { every: col.every, val: newValue }, row })}
          />
        </Box>
      }
      byHorizontal={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            buttonGroupSx={sharedButtonGroupProps(theme)}
            labelInline
            value={row.val}
            onChange={(newValue) => updateDraft(dispatch, "flip", { row: { every: row.every, val: newValue }, col })}
          />
        </Box>
      }
    />
  )
}
