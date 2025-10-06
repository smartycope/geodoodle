import { useContext } from "react";
import { MIRROR_AXIS, MIRROR_TYPE, MIRROR_ROT } from "../globals";
import { StateContext } from "../Contexts";
import MiniMenu from "./MiniMenu";
import { Stack } from "@mui/material";
import ToggleIconButtonGroup from "./ToggleIconButtonGroup";
import { MirrorTypeIcon, MirrorAxisIcon, MirrorRotIcon } from "./MirrorIcons";


// TODO: when the mirror menu is open, and you move the mouse enough (especially
// if theres a bunch of lines on screen), it gives a max recusion error in the console
// No clue why, investigation needed


export default function () {
    const { state, dispatch } = useContext(StateContext)
    const { mirrorType, mirrorAxis, mirrorRot } = state
    const labelInline = true

    return <MiniMenu menu="mirror" id="mirror-menu-mobile">
        <Stack spacing={1} sx={{ px: 1.5, py: .5 }}>
            {/* Type */}
            <ToggleIconButtonGroup
                buttons={[
                    { label: "Cursor", icon: MirrorTypeIcon[MIRROR_TYPE.CURSOR], value: MIRROR_TYPE.CURSOR },
                    { label: "Page",   icon: MirrorTypeIcon[MIRROR_TYPE.PAGE], value: MIRROR_TYPE.PAGE },
                ]}
                labelInline={labelInline}
                exclusive
                label="Type"
                value={mirrorType}
                onChange={(newValue) => dispatch({ mirrorType: newValue })}
            />

            {/* Flip */}
            <ToggleIconButtonGroup
                buttons={[
                    { label: "Horizontally", icon: MirrorAxisIcon[MIRROR_AXIS.Y], value: MIRROR_AXIS.Y },
                    { label: "Vertically",   icon: MirrorAxisIcon[MIRROR_AXIS.X], value: MIRROR_AXIS.X },
                    { label: "Crossed",      icon: MirrorAxisIcon[MIRROR_AXIS.BOTH], value: MIRROR_AXIS.BOTH },
                ]}
                labelInline={labelInline}
                exclusive
                allowNone
                label="Flip"
                value={mirrorAxis}
                onChange={(newValue) => dispatch({ mirrorAxis: newValue })}
            />

            {/* Rotate */}
            <ToggleIconButtonGroup
                buttons={[
                    { label: "90°",  icon: MirrorRotIcon[MIRROR_ROT.RIGHT], value: MIRROR_ROT.RIGHT },
                    { label: "180°", icon: MirrorRotIcon[MIRROR_ROT.STRAIGHT], value: MIRROR_ROT.STRAIGHT },
                    { label: "x4",   icon: MirrorRotIcon[MIRROR_ROT.QUAD], value: MIRROR_ROT.QUAD },
                ]}
                labelInline={labelInline}
                exclusive
                allowNone
                label="Rotate"
                value={mirrorRot}
                onChange={(newValue) => dispatch({ mirrorRot: newValue })}
            />
        </Stack>
    </MiniMenu>
}
