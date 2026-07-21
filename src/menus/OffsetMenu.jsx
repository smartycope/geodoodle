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
  gridItemSx,
  numberProps,
} from "../utils/menus"

export default function OffsetMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()
  const { col, row } = state.trellisDraft.trellis.overlap
  const { x: patternW, y: patternH } = state.trellisDraft.trellis.sourceSize.asDeflated()
  const minx = -patternW * 2 + 1
  const maxx = patternW * 2 - 1
  const miny = -patternH * 2 + 1
  const maxy = patternH * 2 - 1

  return (
    <TrellisSubMenu
      title="Offset"
      resetVal={{ x: 0, y: 0 }}
      transformation="overlap"
      byHorizontal={
        <Box
          data-testid="offset-horizontal-controls"
          sx={{
            position: "absolute",
            // This puts it where it already would go, but doesn't take up space in the grid
            bottom: 0,
            display: "grid",
            gridTemplateColumns: "auto max-content",
            gridTemplateRows: "repeat(2, auto)",
            columnGap: 0.5,
            alignItems: "center",
            pointerEvents: "none",
            border: state.debug ? "1px solid" : undefined,
            borderColor: state.debug ? "blue" : undefined,
            "& > div": {
              border: state.debug ? "1px solid" : undefined,
              borderColor: state.debug ? "blue" : undefined,
              display: "flex",
              alignItems: "center",
            },
          }}
        >
          {/* We have to make our own labels and put them in a grid so they're aligned how we want */}
          <Box sx={gridItemSx}>
            <Number
              onValueChange={(newVal) =>
                updateDraft(dispatch, "overlap", {
                  row: { every: row.every, val: { x: newVal, y: row.val.y } },
                  col,
                })
              }
              value={row.val.x}
              max={maxx}
              min={minx}
              {...numberProps(theme)}
            />
          </Box>
          <Box sx={gridItemSx}>
            <label
              htmlFor={"x"}
              style={{
                color: theme.palette.primary.contrast,
                fontWeight: "bold",
              }}
            >
              X
            </label>
          </Box>
          <Box sx={gridItemSx}>
            <Number
              onValueChange={(newVal) =>
                updateDraft(dispatch, "overlap", {
                  row: { every: row.every, val: { x: row.val.x, y: newVal } },
                  col,
                })
              }
              value={row.val.y}
              max={maxy}
              min={miny}
              {...numberProps(theme)}
            />
          </Box>
          <Box sx={gridItemSx}>
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
        </Box>
      }
      byVertical={
        <>
          <Number
            onValueChange={(newVal) => {
              updateDraft(dispatch, "overlap", {
                col: { every: col.every, val: { x: newVal, y: col.val.y } },
                row,
              })
            }}
            value={col.val.x}
            label="X"
            style={centeredVerticalLabelStyle}
            vertical
            max={maxx}
            min={minx}
            {...numberProps(theme)}
          />
          <Number
            onValueChange={(newVal) =>
              updateDraft(dispatch, "overlap", {
                col: { every: col.every, val: { x: col.val.x, y: newVal } },
                row,
              })
            }
            value={col.val.y}
            label="Y"
            style={centeredVerticalLabelStyle}
            vertical
            max={maxy}
            min={miny}
            {...numberProps(theme)}
          />
        </>
      }
    />
  )
}
