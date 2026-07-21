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

export default function SkipMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { row, col } = state.trellisDraft.trellis.skip
  const len = 10

  return (
    <TrellisSubMenu
      title="Skip"
      resetVal={MIRROR_AXIS.NONE}
      transformation="skip"
      byVertical={
        <Number
          onValueChange={(val) => updateDraft(dispatch, "skip", { col: { every: col.every, val }, row })}
          label="X"
          style={centeredVerticalLabelStyle}
          value={col.val}
          min={0}
          max={len}
          vertical
          {...numberProps(theme)}
        />
      }
      // Just like in OffsetMenu, we have to make our own labels so they're aligned how we want
      byHorizontal={
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <Number
            onValueChange={(val) => updateDraft(dispatch, "skip", { row: { every: row.every, val }, col })}
            value={row.val}
            min={0}
            max={len}
            {...numberProps(theme)}
          />
          <label
            htmlFor={"y"}
            style={{
              color: theme.palette.primary.contrast,
              fontWeight: "bold",
            }}
          >
            Y
          </label>
        </Box>
      }
    />
  )
}
