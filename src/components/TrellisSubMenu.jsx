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
import {
  boxSx,
  sharedProps,
  sharedButtonGroupProps,
  centeredVerticalLabelStyle,
  gridItemSx,
  updateDraft,
  numberAlpha,
  numberProps,
} from "../utils/menus"

export default function TrellisSubMenu({ title, byHorizontal, byVertical, transformation, resetVal, everyMin = 1 }) {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { col, row } = state.trellisDraft.trellis[transformation]

  return (
    <Box
      data-testid="repeat-submenu"
      sx={{
        position: "absolute",
        bottom: ".5rem",
        left: ".5rem",
        zIndex: 3,
        width: "max-content",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pointerEvents: "none",
        border: state.debug ? "1px solid" : undefined,
        borderColor: state.debug ? "black" : undefined,
        "& > div": {
          border: state.debug ? "1px solid" : undefined,
          borderColor: state.debug ? "black" : undefined,
        },
      }}
    >
      {/* By Vertical */}
      <Box sx={gridItemSx}>{byVertical}</Box>

      <Box
        data-testid="repeat-submenu-control-row"
        sx={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 1, alignItems: "center" }}
      >
        {/* Every Column */}
        <Box sx={{ ...gridItemSx, justifyContent: "center" }}>
          <div id="tour3">
            <Number
              onValueChange={(val) => updateDraft(dispatch, transformation, { col: { every: val, val: col.val }, row })}
              value={col.every}
              vertical
              min={everyMin}
              max={Math.floor(window.innerWidth / state.scaley)}
              {...numberProps(theme)}
            />
          </div>
        </Box>

        {/* Label */}
        <Box sx={{ ...gridItemSx, alignSelf: "stretch", alignItems: "flex-end", justifyContent: "flex-start" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              opacity: 0.5,
              color: theme.palette.primary.contrast,
              pointerEvents: "none",
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>

      <Box data-testid="repeat-submenu-horizontal-row" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {/* Reset Button */}
        <Box sx={gridItemSx}>
          <IconButton
            aria-label={`Reset ${title}`}
            onClick={() =>
              updateDraft(dispatch, transformation, {
                row: { every: 1, val: resetVal },
                col: { every: 1, val: resetVal },
              })
            }
            variant="contained"
            sx={{
              // Don't know why borderRadius here is different than in Number
              borderRadius: theme.shape.borderRadius / 2,
              bgcolor: theme.alpha(theme.palette.background.default, 0.95),
              "&:hover": {
                bgcolor: theme.alpha(theme.palette.background.default, numberAlpha),
              },
            }}
          >
            <ReplayIcon />
          </IconButton>
        </Box>

        {/* Every Row */}
        <Box sx={gridItemSx}>
          <div id="tour2">
            <Number
              onValueChange={(val) => updateDraft(dispatch, transformation, { row: { every: val, val: row.val }, col })}
              value={row.every}
              min={everyMin}
              max={Math.floor(window.innerWidth / state.scaley)}
              {...numberProps(theme)}
            />
          </div>
        </Box>

        {/* By Horizontal */}
        <Box sx={{ ...gridItemSx, flex: 1 }}>{byHorizontal}</Box>
      </Box>
    </Box>
  )
}
