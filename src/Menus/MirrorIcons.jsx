import {MIRROR_AXIS, MIRROR_ROT, MIRROR_TYPE} from "../globals";
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import VerticalAlignCenterIcon from '@mui/icons-material/VerticalAlignCenter';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import DoDisturbAltIcon from '@mui/icons-material/DoDisturbAlt';
import TvOutlinedIcon from '@mui/icons-material/TvOutlined';
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined';

export const MirrorAxisIcon = {
    [MIRROR_AXIS.Y]: <VerticalAlignCenterIcon transform="rotate(90)"/>,
    [MIRROR_AXIS.X]: <VerticalAlignCenterIcon/>,
    [MIRROR_AXIS.BOTH]: <OpenWithIcon/>,
    [MIRROR_AXIS.NONE]: <DoDisturbAltIcon/>,
}

export const MirrorRotIcon = {
    [MIRROR_ROT.RIGHT]: <SubdirectoryArrowRightIcon/>,
    [MIRROR_ROT.STRAIGHT]: <OpenInFullIcon/>,
    [MIRROR_ROT.QUAD]: <ZoomOutMapIcon/>,
    [MIRROR_ROT.NONE]: <DoDisturbAltIcon/>,
}

export const MirrorTypeIcon = {
    [MIRROR_TYPE.CURSOR]: <NearMeOutlinedIcon transform="rotate(270)"/>,
    [MIRROR_TYPE.PAGE]: <TvOutlinedIcon/>,
}
