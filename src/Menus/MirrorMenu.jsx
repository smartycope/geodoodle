import { useContext } from "react"
import { MIRROR_AXIS, MIRROR_TYPE, MIRROR_ROT } from "../globals"
import { StateContext } from "../Contexts"
import MiniMenu from "./MiniMenu"
import Stack from "@mui/material/Stack"
import ToggleIconButtonGroup from "./ToggleIconButtonGroup"
import { MirrorTypeIcon, MirrorAxisIcon, MirrorRotIcon } from "./MirrorIcons"
import AddIcon from "@mui/icons-material/Add"
import ClearIcon from "@mui/icons-material/Clear"

// TODO: when the mirror menu is open, and you move the mouse enough (especially
// if theres a bunch of lines on screen), it gives a max recusion error in the console
// No clue why, investigation needed -- I suspect it doesn't have to do with
// MirrorMenu specifically

export default function MirrorMenu() {
  const { state, dispatch } = useContext(StateContext)
  const { mirrorType, mirrorAxis, mirrorRot, mirrorOrigins, mobile } = state

  return (
    <MiniMenu menu="mirror" id="mirror-menu-mobile">
      <Stack spacing={1} sx={{ px: 1.5, py: 0.5 }}>
        {/* Type */}
        <Stack direction="row" spacing={mobile ? 1 : -2}>
          {" "}
          {/* I don't know why this spacing is wonky */}
          <ToggleIconButtonGroup
            id="mirror-type-input"
            buttons={[
              { label: "Cursor", icon: MirrorTypeIcon(MIRROR_TYPE.CURSOR), value: MIRROR_TYPE.CURSOR },
              { label: "Page", icon: MirrorTypeIcon(MIRROR_TYPE.PAGE), value: MIRROR_TYPE.PAGE },
            ]}
            exclusive
            label="Type"
            value={mirrorType}
            onChange={(newValue) => dispatch({ mirrorType: newValue })}
          />
          <ToggleIconButtonGroup
            id="mirror-origin-input"
            buttons={[
              mobile
                ? { label: "Add", icon: <AddIcon />, value: "add_mirror_origin" }
                : { label: "Press o to Add", icon: null, value: "ignoreme" },
              { label: "Clear ", icon: <ClearIcon />, value: "clear_mirror_origins" },
            ]}
            disabled={{
              ignoreme: true,
              add_mirror_origin: !(mirrorAxis || mirrorRot),
              clear_mirror_origins: !mirrorOrigins.length,
            }}
            allowNone
            label="Origins"
            alwaysShowLabel
            // Makes it not allowed to select any of them and act like buttons
            value={null}
            onChange={(newValue) => (newValue === "ignoreme" ? null : dispatch({ action: newValue }))}
          />
        </Stack>

        {/* Flip */}
        <ToggleIconButtonGroup
          id="mirror-flip-input"
          buttons={[
            { label: "Horizontally", icon: MirrorAxisIcon(MIRROR_AXIS.Y), value: MIRROR_AXIS.Y },
            { label: "Vertically", icon: MirrorAxisIcon(MIRROR_AXIS.X), value: MIRROR_AXIS.X },
            { label: "Crossed", icon: MirrorAxisIcon(MIRROR_AXIS.BOTH), value: MIRROR_AXIS.BOTH },
          ]}
          labelInline
          exclusive
          allowNone
          label="Flip"
          value={mirrorAxis}
          onChange={(newValue) => dispatch({ mirrorAxis: newValue })}
        />

        {/* Rotate */}
        <ToggleIconButtonGroup
          id="mirror-rotate-input"
          buttons={[
            { label: "90°", icon: MirrorRotIcon(MIRROR_ROT.RIGHT), value: MIRROR_ROT.RIGHT },
            { label: "180°", icon: MirrorRotIcon(MIRROR_ROT.STRAIGHT), value: MIRROR_ROT.STRAIGHT },
            { label: "x4", icon: MirrorRotIcon(MIRROR_ROT.QUAD), value: MIRROR_ROT.QUAD },
          ]}
          labelInline
          exclusive
          allowNone
          label="Rotate"
          value={mirrorRot}
          onChange={(newValue) => dispatch({ mirrorRot: newValue })}
        />
      </Stack>
    </MiniMenu>
  )
}
