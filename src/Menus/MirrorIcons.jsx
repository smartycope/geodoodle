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
    // [MIRROR_AXIS.BOTH]: <SvgIcon><path
    //     fillRule="evenodd"
    //     d="M3 3v8h8V3zm6 6H5V5h4zm-6 4v8h8v-8zm6 6H5v-4h4zm4-16v8h8V3zm6 6h-4V5h4zm-6 4v8h8v-8zm6 6h-4v-4h4z"
    // /></SvgIcon>,
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
        strokeDasharray={dash/unscale*3}
        strokeDashoffset={dash/unscale*3}
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
    // Only used in the repeat menu (since we reuse MIRROR_ROT for repeat rotation,
    // even though it's slightly different than mirror rotation)
    [MIRROR_ROT.THREE_QUARTERS]: <SvgIcon><svg {...svgProps}><circle
        cx={xy/unscale} cy={xy/unscale} r={r/unscale}
        strokeDasharray={`${dash*3} ${dash}`}
        strokeDashoffset={dash}
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
