import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE} from "../globals";

import { MdContentCopy } from "react-icons/md"
import { MdHome } from "react-icons/md";
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdCropPortrait } from "react-icons/md";

import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { PiLineVerticalBold } from "react-icons/pi";
import { MdUndo } from "react-icons/md";
import { MdRedo } from "react-icons/md";
import { GiNuclear } from "react-icons/gi";
import { BsSlash } from "react-icons/bs";
import { RiCursorFill } from "react-icons/ri";
import { FaGripLinesVertical } from "react-icons/fa6";
import { MdInsertPageBreak } from "react-icons/md";
import { RiFlipHorizontalLine } from "react-icons/ri";
import { RxRotateCounterClockwise } from "react-icons/rx";
import { RiFlipVerticalFill } from "react-icons/ri";
import { FaChevronRight } from "react-icons/fa";
import { TbArrowsUpRight } from "react-icons/tb";
import { TbArrowsVertical } from "react-icons/tb";
import { TbArrowsMaximize } from "react-icons/tb";
import { PiSelectionDuotone } from "react-icons/pi";
import { TbArrowsRandom } from "react-icons/tb";
import { PiSelectionPlusDuotone } from "react-icons/pi";
import { PiSelectionSlashDuotone } from "react-icons/pi";
import { MdDelete } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { GoMirror } from "react-icons/go";
import {incrementMirrorAxis, incrementMirrorMethod, incrementMirrorType} from "../utils";


export function Checkbox({label, onChange, checked, title, id, inputId, backwards=false}){
    const lab = <label htmlFor={label}>{label}</label>

    return <span className="checkbox" id={id} title={title}>
        {backwards && lab}
        <input
            type="checkbox"
            name={label}
            id={inputId}
            onChange={(e) => onChange(e.target.value === 'on')}
            checked={checked}
        ></input>
        {!backwards && lab}
    </span>
}

export function Input({label, onChange, type, value, inputProps, title, id, inputId, backwards=false}){
    const lab = <label htmlFor={label}>{label}</label>

    return <span className="checkbox" id={id} title={title}>
        {!backwards && lab}
        <input
            type={type}
            name={label}
            id={inputId}
            value={value}
            onChange={onChange}
            {...inputProps}
        ></input>
        {backwards && lab}
    </span>
}

export function Number({label='', onChange, value, min=-Infinity, max=Infinity, step=1, inputProps,
    title, id, inputId, backwards=false, onPlus, onMinus,
}){
    // Make sure everything is a number before adding to it
    min = +min
    max = +max
    step = +step
    value = +value

    const lab = <label htmlFor={label}>{label}</label>

    return <span className="checkbox" id={id} title={title} style={{
        border: "2px",
    }}>
        {!backwards && lab}
        <button onClick={() => onChange(Math.min(max, onPlus ? onPlus(value) : value - step))}
            style={{
                padding: '8px',
        }}>-</button>
        <input
            type="number"
            name={label}
            id={inputId}
            value={value}
            readOnly={true}
            min={min}
            max={max}
            {...inputProps}
            style={{
                textAlign: 'center',
                border: 'none',
                backgroundColor: "rgb(50,50,50)",
                width: `${String(value).length*10}px`
            }}
        ></input>
        <button onClick={() => onChange(Math.max(min, onMinus ? onMinus(value) : value + step))}
            style={{
                marginLeft: "0px",
                padding: '8px',
        }}>+</button>
        {backwards && lab}
    </span>
}


export function MirrorAxisIcon({mirrorAxis, mirrorMethod}){
    switch(mirrorAxis){
        case MIRROR_AXIS.VERT_90:
            return mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH
                ? <><RiFlipHorizontalLine /> Vertical</>
                : <><TbArrowsUpRight /> 90°</>
        case MIRROR_AXIS.HORZ_180:
            return mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH
                ? <><RiFlipVerticalFill /> Horizontal</>
                : <><TbArrowsVertical /> 180°</>
        case MIRROR_AXIS.BOTH_360:
            return mirrorMethod === MIRROR_METHOD.FLIP || mirrorMethod === MIRROR_METHOD.BOTH
                ? <><FaPlus /> Crossed</>
                : <><TbArrowsMaximize /> 360°</>
        case MIRROR_AXIS.NONE_0:
            return "Off"
        default: console.error(mirrorAxis, 'is not a valid mirror axis');
    }
}

export function MirrorTypeIcon({mirrorType}){
    switch(mirrorType){
        case MIRROR_TYPE.CURSOR: return <><RiCursorFill /> Cursor</>
        case MIRROR_TYPE.PAGE:   return <><MdInsertPageBreak /> Page</>
        case MIRROR_TYPE.NONE:   return "Off"
        default: console.error(mirrorType, 'is not a valid mirror type');
    }
}

export function MirrorMethodIcon({mirrorMethod}){
    switch(mirrorMethod){
        case MIRROR_METHOD.FLIP:   return <><GoMirror /> Flip</>
        case MIRROR_METHOD.ROTATE: return <><RxRotateCounterClockwise /> Rotate</>
        case MIRROR_METHOD.BOTH:   return <><TbArrowsRandom /> Both</>
        case MIRROR_METHOD.NONE:   return "Off"
        default: console.error(mirrorMethod, 'is not a valid mirror method');
    }
}
