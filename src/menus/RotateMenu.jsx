import { useContext } from "react"
import { MIRROR_ROT } from "../globals"
import { MirrorRotIcon } from "../components/CustomIcons"
import { StateContext } from "../Contexts"
import { Box, useTheme } from "@mui/material"
import ToggleIconButtonGroup from "../components/ToggleIconButtonGroup"
import TrellisSubMenu from "../components/TrellisSubMenu"
import { boxSx, sharedProps, sharedButtonGroupProps } from "../utils/menus"
import { getActiveLayer } from "../utils/layers"
import TrellisLayer from "../classes/TrellisLayer"

export default function RotateMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const trellis = getActiveLayer(state)
  if (!(trellis instanceof TrellisLayer)) return null
  const { row, col } = trellis.rotate
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
            onChange={(newValue) =>
              dispatch({ action: "update_active_layer", rotate: { col: { every: col.every, val: newValue }, row } })
            }
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
            onChange={(newValue) =>
              dispatch({ action: "update_active_layer", rotate: { row: { every: row.every, val: newValue }, col } })
            }
          />
        </Box>
      }
    />
  )
}
