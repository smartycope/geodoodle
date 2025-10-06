import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE} from "../globals";

import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import VerticalAlignCenterIcon from '@mui/icons-material/VerticalAlignCenter';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import AllOutIcon from '@mui/icons-material/AllOut';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import * as React from 'react';

import { FaPlus } from "react-icons/fa6";
import { RiCursorFill, RiFlipVerticalFill } from "react-icons/ri";
import FlipIcon from '@mui/icons-material/Flip';
import { MdInsertPageBreak } from "react-icons/md";
import { TbArrowsMaximize } from "react-icons/tb";

export function MirrorAxisIcon({mirrorAxis, mirrorMethod}){
    switch(mirrorAxis){
        case MIRROR_AXIS.VERT_90:
            return mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH
                // ? <><FlipIcon /> Vertical</>
                ? <><VerticalAlignCenterIcon transform="rotate(90)" /> Vertical</>
                : <><SubdirectoryArrowRightIcon /> 90°</>
        case MIRROR_AXIS.HORZ_180:
            return mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH
                // ? <><RiFlipVerticalFill /> Horizontal</>
                ? <><VerticalAlignCenterIcon /> Horizontal</>
                : <><OpenInFullIcon /> 180°</>
        case MIRROR_AXIS.BOTH_360:
            return mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH
                // ? <><FaPlus /> Crossed</>
                ? <><OpenWithIcon /> Crossed</>
                // : <><TbArrowsMaximize /> 360°</>
                : <><ZoomOutMapIcon /> 360°</>
        case MIRROR_AXIS.NONE_0:
            return "Off"
        default: console.error(mirrorAxis, 'is not a valid mirror axis');
    }
}

export function MirrorTypeIcon({mirrorType}){
    switch(mirrorType){
        case MIRROR_TYPE.CURSOR: return <><RiCursorFill /> Cursor</>
        // case MIRROR_TYPE.PAGE:   return <><MdInsertPageBreak /> Page</>
        case MIRROR_TYPE.PAGE:   return <><FlipIcon /> Page</>
        case MIRROR_TYPE.NONE:   return "Off"
        default: console.error(mirrorType, 'is not a valid mirror type');
    }
}

export function MirrorMethodIcon({mirrorMethod}){
    switch(mirrorMethod){
        case MIRROR_METHOD.FLIP:   return <><CompareArrowsIcon /> Flip</>
        case MIRROR_METHOD.ROTATE: return <><SettingsBackupRestoreIcon /> Rotate</>
        case MIRROR_METHOD.BOTH:   return <><AllOutIcon /> Both</>
        case MIRROR_METHOD.NONE:   return "Off"
        default: console.error(mirrorMethod, 'is not a valid mirror method');
    }
}
