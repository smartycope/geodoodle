import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE} from "../globals";

import { FaPlus } from "react-icons/fa6";
import { RiCursorFill, RiFlipHorizontalLine, RiFlipVerticalFill } from "react-icons/ri";
import { MdHome, MdInsertPageBreak, MdOutlineFileCopy } from "react-icons/md";
import { RxRotateCounterClockwise } from "react-icons/rx";
import { TbArrowsUpRight, TbArrowsVertical, TbArrowsMaximize, TbArrowsRandom } from "react-icons/tb";
import { GoMirror } from "react-icons/go";
import {useContext} from "react";
import {StateContext} from "../Contexts";


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
    title, id, inputId, backwards=false, onPlus, onMinus, round,
}){
    // Make sure everything is a number before adding to it
    min = +min
    max = +max
    step = +step
    value = +value
    if (round === undefined)
        round = !(step >= 1)

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
            value={value.toFixed(round)}
            // readOnly={true}
            onChange={e => onChange(e.target.value)}
            min={min}
            max={max}
            {...inputProps}
            style={{
                // textAlign: 'center',
                border: 'none',
                backgroundColor: "rgb(50,50,50)",
                width: `${String(value).length+1}em`,
                paddingRight: "0px",
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

export function Collapsible({summary, children}){
    return <details>
        <summary>{summary}</summary>
        {children}
    </details>
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

export function ExtraButton({mainMenu=false, style}){
    const [state, dispatch] = useContext(StateContext)

    switch (state.extraButton) {
        case 'copy image':
            return <button onClick={() => dispatch({action: 'copy image'})}
                className="menu-toggle-button-mobile extra-button bonus-button"
                id='copy-button-extra'
                style={style}>
                <MdOutlineFileCopy className={mainMenu ? "main-menu-icon" : 'main-menu-icon extra-icon'} />
                {!mainMenu && <>Copy as<br/> Image</>}
            </button>
        // Home is the default
        default:
            return <button id='home-button-extra'
                onClick={() => dispatch({action: "go home"})}
                className="menu-toggle-button-mobile extra-button bonus-button"
                title="Reset position and scale"
                style={style}>
                <MdHome className={mainMenu ? "main-menu-icon" : 'main-menu-icon extra-icon'}/> {!mainMenu && 'Home'}
            </button>
    }
}
