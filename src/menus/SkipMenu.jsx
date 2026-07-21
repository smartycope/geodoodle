import { useContext } from "react"
import { MIRROR_AXIS } from "../globals"
import Number from "../components/Number"
import { StateContext } from "../Contexts"
import { Box, useTheme } from "@mui/material"
import TrellisSubMenu from "../components/TrellisSubMenu"
import { centeredVerticalLabelStyle, numberProps } from "../utils/menus"
import { getActiveLayer } from "../utils/layers"
import TrellisLayer from "../classes/TrellisLayer"

export default function SkipMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const trellis = getActiveLayer(state)
  if (!(trellis instanceof TrellisLayer)) return null
  const { row, col } = trellis.skip
  const len = 10

  return (
    <TrellisSubMenu
      title="Skip"
      resetVal={MIRROR_AXIS.NONE}
      transformation="skip"
      byVertical={
        <Number
          onValueChange={(val) =>
            dispatch({ action: "update_active_layer", skip: { col: { every: col.every, val: val }, row } })
          }
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
            onValueChange={(val) =>
              dispatch({ action: "update_active_layer", skip: { row: { every: row.every, val: val }, col } })
            }
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
