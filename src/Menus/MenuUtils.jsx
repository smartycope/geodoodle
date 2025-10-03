import {MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE} from "../globals";

import { FaPlus } from "react-icons/fa6";
import { RiCursorFill, RiFlipHorizontalLine, RiFlipVerticalFill } from "react-icons/ri";
import { MdHome, MdInsertPageBreak, MdOutlineFileCopy } from "react-icons/md";
import { RxRotateCounterClockwise } from "react-icons/rx";
import { TbArrowsUpRight, TbArrowsVertical, TbArrowsMaximize, TbArrowsRandom } from "react-icons/tb";
import { GoMirror } from "react-icons/go";
import {useContext} from "react";
import {StateContext} from "../Contexts";
import FlipIcon from '@mui/icons-material/Flip';
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight';
import VerticalAlignCenterIcon from '@mui/icons-material/VerticalAlignCenter';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import AllOutIcon from '@mui/icons-material/AllOut';
import InsertPageBreakIcon from '@mui/icons-material/InsertPageBreak';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

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

function Number({label='', onChange, value, min=-Infinity, max=Infinity, step=1, inputProps,
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

import { Box, IconButton, TextField, Tooltip, Typography, useTheme } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

function NumberMui({
    onChange,
    value,
    min = -Infinity,
    max = Infinity,
    step = 1,
    labelLeft = "",
    labelTop = undefined,
    labelBottom = undefined,
    labelRight = "",
    icon,
    inputProps,
    title,
    id,
    inputId,
    onPlus,
    onMinus,
    round,
}) {
    if (!value) value = 0
    if (round === undefined) round = !(step >= 1)

    min = +min;
    max = +max;
    step = +step;
    value = +value;

    const handleMinus = () => onChange(Math.min(max, onPlus ? onPlus(value) : value - step));
    const handlePlus = () => onChange(Math.max(min, onMinus ? onMinus(value) : value + step));

    const buttonStyle = {
        padding: '8px',
        // outline: '1px solid',
        borderRadius: '5px',
        // border: 'none',
    }
    const rounded = value.toFixed(round)
    console.log({value, rounded})
    return (
        <Box
        id={id}
        title={title}
        display="flex"
        alignItems="center"
        gap={1}
        >
        {labelLeft && (
            <Typography variant="body2" sx={{ minWidth: "4ch" }}>{labelLeft}</Typography>
        )}

        <IconButton
            size="small"
            color="primary"
            variant='contained'
            onClick={handleMinus}
            sx={{...buttonStyle, marginLeft: '0px'}}
        >
            <Remove fontSize="small" />
        </IconButton>

        <TextField
            type="number"
            variant="filled"
            label={labelTop}
            helperText={labelBottom}
            margin="dense"
            size="small"
            value={rounded}
            onChange={(e) => onChange(Number(e.target.value))}
            slotProps={{
                htmlInput: {
                    min,
                    max,
                    step,
                    style: { textAlign: "center" },
                    ...inputProps,
                },
                // InputLabel: {
                //     shrink: true,
                // },
            }}
            id={inputId}
            sx={{
                width: `${String(rounded).length + 3}ch`,
                p: 0,
                mx: 1,
                ml: -1,
                mr: -1,
            }}
            />

        <IconButton
            size="small"
            color="primary"
            onClick={handlePlus}
            sx={{...buttonStyle, marginRight: '0px'}}
        >
            <Add fontSize="small" />
        </IconButton>

        {labelRight && (
            <Typography variant="body2">{labelRight}</Typography>
        )}
        </Box>
    );
}

// Modified from
// https://base-ui.com/react/components/number-field

import * as React from 'react';
import { NumberField } from '@base-ui-components/react/number-field';
import styles from '../styling/number-field.module.css';
import ToolButton from "./ToolButton";

// See for allowed props:
// https://base-ui.com/react/components/number-field#api-reference
function NumberBase({
    label,
    id,
    title,
    color,
    inputId,
    onPlus,
    onMinus,
    scrubDirection='horizontal',
    ...props
}){
    id = id || React.useId();
    inputId = inputId || React.useId();
    const theme = useTheme()
    if (color === undefined) color = theme.palette.primary.contrastText

    if (props.snapOnStep && props.value && props.step)
        props.value = Math.round(props.value * 10**props.step) / 10**props.step

    return (
        <Tooltip title={title}>
        <NumberField.Root
            id={id}
            className={styles.Field}
            {...props}
        >
            <label htmlFor={id} className={styles.Label} style={{color: color}}>
            {label}
            </label>

        <NumberField.Group className={styles.Group}>
            <NumberField.Decrement className={styles.Decrement} onClick={onMinus}>
            <Remove fontSize="small" />
            </NumberField.Decrement>
            {/* TODO: scrub direction doens't work */}
            {/* <NumberField.ScrubArea className={styles.ScrubArea} scrubDirection={scrubDirection}> */}
            <NumberField.ScrubArea className={styles.ScrubArea}>
                <NumberField.Input className={styles.Input} id={inputId} style={{color: color}}/>
            </NumberField.ScrubArea>
            <NumberField.Increment className={styles.Increment} onClick={onPlus}>
            <Add fontSize="small" />
            </NumberField.Increment>
        </NumberField.Group>
        </NumberField.Root>
        </Tooltip>
    );
}

export {NumberBase as Number}

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
    const {state, dispatch} = useContext(StateContext)

    switch (state.extraButton) {
        case 'copy image':
            return <button onClick={() => dispatch('copy_image')}
                className="menu-toggle-button-mobile extra-button bonus-button"
                id='copy-button-extra'
                style={style}>
                <MdOutlineFileCopy className={mainMenu ? "main-menu-icon" : 'main-menu-icon extra-icon'} />
                {!mainMenu && <>Copy as<br/> Image</>}
            </button>
        // Home is the default
        default:
            return <button id='home-button-extra'
                onClick={() => dispatch('go_home')}
                className="menu-toggle-button-mobile extra-button bonus-button"
                title="Reset position and scale"
                style={style}>
                <MdHome className={mainMenu ? "main-menu-icon" : 'main-menu-icon extra-icon'}/> {!mainMenu && 'Home'}
            </button>
    }
}
