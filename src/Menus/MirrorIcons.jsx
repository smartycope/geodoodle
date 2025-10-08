import {MIRROR_AXIS, MIRROR_ROT, MIRROR_TYPE} from "../globals";
import VerticalAlignCenterIcon from '@mui/icons-material/VerticalAlignCenter';
// import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
// import OpenWithIcon from '@mui/icons-material/OpenWith';
// import OpenInFullIcon from '@mui/icons-material/OpenInFull';
// import Rotate90DegreesCwIcon from '@mui/icons-material/Rotate90DegreesCw';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import DoDisturbAltIcon from '@mui/icons-material/DoDisturbAlt';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';
import SvgIcon from '@mui/material/SvgIcon';

// TODO: these should probably get updated to custom icons as well
export const MirrorAxisIcon = {
    [MIRROR_AXIS.Y]: <VerticalAlignCenterIcon transform="rotate(90)"/>,
    [MIRROR_AXIS.X]: <VerticalAlignCenterIcon/>,
    [MIRROR_AXIS.BOTH]: <ZoomOutMapIcon/>,
    [MIRROR_AXIS.NONE]: <DoDisturbAltIcon/>,
}

const xy = 12
const r = 10
const dash = r * Math.PI / 2
const svgProps = {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: "3",
    stroke: "currentColor",
}
export const MirrorRotIcon = (unscale=1) => ({
    [MIRROR_ROT.RIGHT]: <SvgIcon><svg {...svgProps}><circle
        cx={xy/unscale} cy={xy/unscale} r={r/unscale}
        strokeDasharray={`0 ${dash/unscale} 0 ${dash/unscale} 0 ${dash/unscale} ${dash/unscale}`}
    /></svg></SvgIcon>,
    [MIRROR_ROT.STRAIGHT]: <SvgIcon><svg {...svgProps}><circle
        cx={xy/unscale} cy={xy/unscale} r={r/unscale}
        strokeDasharray={dash/unscale}
        strokeDashoffset={dash/unscale}
    /></svg></SvgIcon>,
    [MIRROR_ROT.QUAD]: <SvgIcon><svg {...svgProps}><circle
        cx={xy/unscale} cy={xy/unscale} r={r/unscale}
        strokeDasharray={`${(dash/unscale)-(2/unscale)} 2`}
        strokeDashoffset={-1}
    /></svg></SvgIcon>,
    [MIRROR_ROT.NONE]: <DoDisturbAltIcon/>,
})

// export const MirrorRotIcon = {
    // // This one fits with the others
    // [MIRROR_ROT.RIGHT]: <SubdirectoryArrowRightIcon/>,
    // // This one is better
    // // [MIRROR_ROT.RIGHT]: <Rotate90DegreesCwIcon/>,
    // [MIRROR_ROT.STRAIGHT]: <OpenInFullIcon/>,
    // [MIRROR_ROT.QUAD]: <OpenWithIcon/>,
    // // [MIRROR_ROT.QUAD]: <ZoomOutMapIcon transform="translate(8 -4) rotate(45) scale(.8)"/>,
    // [MIRROR_ROT.NONE]: <DoDisturbAltIcon/>,
// }

export const MirrorTypeIcon = {
    [MIRROR_TYPE.CURSOR]: <NearMeOutlinedIcon transform="rotate(270)"/>,
    [MIRROR_TYPE.PAGE]: <TvOutlinedIcon/>,
}
