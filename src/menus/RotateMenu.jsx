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

export default function RotateMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { row, col } = state.trellisDraft.trellis.rotate
  const props = {
    ...sharedProps,
    buttons: [
      { label: "90°", icon: MirrorRotIcon(MIRROR_ROT.RIGHT, true), value: MIRROR_ROT.RIGHT },
      { label: "180°", icon: MirrorRotIcon(MIRROR_ROT.STRAIGHT, true), value: MIRROR_ROT.STRAIGHT },
      { label: "270°", icon: MirrorRotIcon(MIRROR_ROT.QUAD, true), value: MIRROR_ROT.QUAD },
    ],
  }

  return (
    <TrellisSubMenu
      title="Rotate"
      resetVal={MIRROR_ROT.NONE}
      transformation="rotate"
      byVertical={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            id="tour1"
            sx={{ width: "2.5rem" }}
            vertical
            buttonGroupSx={sharedButtonGroupProps(theme)}
            value={col.val}
            onChange={(newValue) => updateDraft(dispatch, "rotate", { col: { every: col.every, val: newValue }, row })}
          />
        </Box>
      }
      byHorizontal={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            id="tour0"
            buttonGroupSx={sharedButtonGroupProps(theme)}
            labelInline
            value={row.val}
            onChange={(newValue) => updateDraft(dispatch, "rotate", { row: { every: row.every, val: newValue }, col })}
          />
        </Box>
      }
    />
  )
}
