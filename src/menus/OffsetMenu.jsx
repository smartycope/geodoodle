import { useContext } from "react"
import Number from "../components/Number"
import { StateContext } from "../Contexts"
import { Box, useTheme } from "@mui/material"
import TrellisSubMenu from "../components/TrellisSubMenu"
import { centeredVerticalLabelStyle, gridItemSx, numberProps } from "../utils/menus"
import { getActiveLayer } from "../utils/layers"
import TrellisLayer from "../classes/TrellisLayer"

export default function OffsetMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()
  const trellis = getActiveLayer(state)
  if (!(trellis instanceof TrellisLayer)) return null
  const { col, row } = trellis.overlap
  const { x: patternW, y: patternH } = trellis.sourceSize.asDeflated()
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
                dispatch({
                  action: "update_active_layer",
                  overlap: { row: { every: row.every, val: { x: newVal, y: row.val.y } }, col },
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
                dispatch({
                  action: "update_active_layer",
                  overlap: { row: { every: row.every, val: { x: row.val.x, y: newVal } }, col },
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
              dispatch({
                action: "update_active_layer",
                overlap: { col: { every: col.every, val: { x: newVal, y: col.val.y } }, row },
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
              dispatch({
                action: "update_active_layer",
                overlap: { col: { every: col.every, val: { x: col.val.x, y: newVal } }, row },
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
