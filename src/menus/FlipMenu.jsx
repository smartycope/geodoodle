import { useContext } from "react"
import { MIRROR_AXIS } from "../globals"
import { MirrorAxisIcon } from "../components/CustomIcons"
import { StateContext } from "../Contexts"
import { Box, useTheme } from "@mui/material"
import ToggleIconButtonGroup from "../components/ToggleIconButtonGroup"
import TrellisSubMenu from "../components/TrellisSubMenu"
import { boxSx, sharedProps, sharedButtonGroupProps } from "../utils/menus"
import { getActiveLayer } from "../utils/layers"
import TrellisLayer from "../classes/TrellisLayer"

export default function FlipMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const trellis = getActiveLayer(state)
  if (!(trellis instanceof TrellisLayer)) return null
  const { row, col } = trellis.flip
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
            onChange={(newValue) =>
              dispatch({ action: "update_active_layer", flip: { col: { every: col.every, val: newValue }, row } })
            }
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
            onChange={(newValue) =>
              dispatch({ action: "update_active_layer", flip: { row: { every: row.every, val: newValue }, col } })
            }
          />
        </Box>
      }
    />
  )
}
