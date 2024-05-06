import React, {useEffect, useRef, useState} from "react";
import "./ControlsMenu.css"
import { MdContentCopy } from "react-icons/md"
import { MdHome } from "react-icons/md";
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdCropPortrait } from "react-icons/md";
import { MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE } from "./globals";
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

let offsetX, offsetY;
let isDragging = false;

export default function ControlsMenu({dispatch, state}){
    // Enable dragging - mostly copied from ChatGPT
    useEffect(() =>{
        const draggableElement = document.getElementById('controls-menu');

        // Function to handle mouse down event
        function handleMouseDown(event) {
            let x, y
            if (event.type === 'touchstart'){
                const touch = (event.touches[0] || event.changedTouches[0])
                x = touch.pageX
                y = touch.pageY
            } else {
                x = event.clientX
                y = event.clientY
            }
            isDragging = true;
            // Calculate the offset between mouse position and element position
            offsetX = x - draggableElement.getBoundingClientRect().left;
            offsetY = y - draggableElement.getBoundingClientRect().top;
            draggableElement.style.cursor = "grabbing"
            event.stopPropagation()
            // event.preventDefault()
        }

        // Function to handle mouse move event
        function handleMouseMove(event) {
            if (!isDragging) return;
            let x, y
            if (event.type === 'touchmove'){
                const touch = (event.touches[0] || event.changedTouches[0])
                x = touch.pageX
                y = touch.pageY
            } else {
                x = event.clientX
                y = event.clientY
            }
            // Update the element's position based on mouse movement
            draggableElement.style.left = `${x - offsetX}px`;
            draggableElement.style.top  = `${y - offsetY}px`;
            event.stopPropagation()
            // event.preventDefault()
        }

        // Function to handle mouse up event
        function handleMouseUp(event) {
            isDragging = false;
            draggableElement.style.cursor = "grab"
            event.stopPropagation()
            // event.preventDefault()
        }

        // Add event listeners for mouse events
        draggableElement.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        draggableElement.addEventListener('touchstart', handleMouseDown)
        document.addEventListener('touchmove', handleMouseMove)
        document.addEventListener('touchend', handleMouseUp)

        return () => {
            draggableElement.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            draggableElement.removeEventListener('touchstart', handleMouseDown, {passive: false})
            document.removeEventListener('touchmove', handleMouseMove, {passive: false})
            document.removeEventListener('touchend', handleMouseUp, {passive: false})
        }
    }, [])

    let mirrorAxis, mirrorAxis2, mirrorType, mirrorMethod
    switch(state.mirrorAxis){
        case MIRROR_AXIS.VERT_90:
            mirrorAxis = state.mirrorMethod === MIRROR_METHOD.FLIP || state.mirrorMethod === MIRROR_METHOD.BOTH
                ? <><RiFlipHorizontalLine /> Vertical</>
                : <><TbArrowsUpRight /> 90°</>
            break
        case MIRROR_AXIS.HORZ_180:
            mirrorAxis = state.mirrorMethod === MIRROR_METHOD.FLIP || state.mirrorMethod === MIRROR_METHOD.BOTH
                ? <><RiFlipVerticalFill /> Horizontal</>
                : <><TbArrowsVertical /> 180°</>
            break
        case MIRROR_AXIS.BOTH_360:
            mirrorAxis = state.mirrorMethod === MIRROR_METHOD.FLIP || state.mirrorMethod === MIRROR_METHOD.BOTH
                ? <><FaPlus /> Crossed</>
                : <><TbArrowsMaximize /> 360°</>
            break
        default: console.error(state.mirrorAxis, 'is not a valid mirror axis');
    }
    switch(state.mirrorAxis2){
        case MIRROR_AXIS.VERT_90:
            mirrorAxis2 = <><TbArrowsUpRight /> 90°</>
            break
        case MIRROR_AXIS.HORZ_180:
            mirrorAxis2 = <><TbArrowsVertical /> 180°</>
            break
        case MIRROR_AXIS.BOTH_360:
            mirrorAxis2 = <><TbArrowsMaximize /> 360°</>
            break
        default: console.error(state.mirrorAxis2, 'is not a valid mirror axis');
    }
    switch(state.mirrorType){
        case MIRROR_TYPE.CURSOR: mirrorType = <><RiCursorFill /> Cursor</>; break
        case MIRROR_TYPE.PAGE:   mirrorType = <><MdInsertPageBreak /> Page</>; break
        default: console.error(state.mirrorType, 'is not a valid mirror type');
    }
    switch(state.mirrorMethod){
        case MIRROR_METHOD.FLIP:   mirrorMethod = <><RiFlipHorizontalLine /> Flip</>; break
        case MIRROR_METHOD.ROTATE: mirrorMethod = <><RxRotateCounterClockwise /> Rotate</>; break
        case MIRROR_METHOD.BOTH:   mirrorMethod = <><TbArrowsRandom /> Both</>; break
        default: console.error(state.mirrorMethod, 'is not a valid mirror method');
    }

    return <div id="controls-menu">
        {/* <span id='button-group'>
            <span id='mode-picker'>
                <label htmlFor="mode-selector">Mode: </label>
                <select id='mode-selector'
                    name="node-picker"
                    required
                    onChange={e => dispatch({action: 'set mode', mode: Number(e.target.value)})}
                    defaultChecked='line'
                >
                    {/* The values correspond to their enum values
                    <option value="0">Draw</option>
                    <option value="1">Select</option>
                    <option value="2">Delete</option>
                    <option value="3">Repeat</option>
                    {/* <option value="4">Navigate</option>
                </select>
            </span> */}
        <span className="checkbox">
            <label htmlFor="mirror-picker">Mirroring: </label>
            <input
                type="checkbox"
                name="mirror-picker"
                onChange={() => dispatch({action: "toggle mirroring"})}
                checked={state.mirroring}
            ></input>
        </span>

        {state.mirroring && <span id="mirror-buttons" className="button-group">
            <button onClick={() => dispatch({action: "toggle mirror type"})} title='Toggle mirror type'>
                {mirrorType}
            </button>
            <button onClick={() => dispatch({action: "toggle mirror method"})} title='Toggle mirror method'>
                {mirrorMethod}
            </button>
            <button onClick={() => dispatch({action: "toggle mirror axis 1"})} title='Toggle mirror axis/angle'>
                {mirrorAxis}
            </button>
            {state.mirrorMethod === MIRROR_METHOD.BOTH &&
                <button onClick={() => dispatch({action: "toggle mirror axis 2"})} title='Toggle mirror rotation axis/angle'>
                    {mirrorAxis2}
                </button>
            }
        </span>}
        {/* </span> */}

        {window.innerWidth <= 768 && <div className="br"/>}
        {/* <hr/> */}

        {/* Selection buttons */}
        <span className='selection-group' style={{width: state.bounds.length > 1 ? '100%' : 'auto'}}>
            {state.mobile && <button title="Add selection bound" onClick={() => dispatch({action: 'add bound'})}>
                <PiSelectionPlusDuotone />
            </button>}
            {state.bounds.length > 1 && <>
                <button title="Clear selection" onClick={() => dispatch({action: 'nevermind'})}>
                    <PiSelectionSlashDuotone />
                </button>
                <span className="checkbox">
                    <label htmlFor="partial-picker" title="Include lines that only have one end in the selected area">
                        Partials:
                    </label>
                    <input
                        type="checkbox"
                        name="partial-picker"
                        onChange={() => dispatch({action: "toggle partials"})}
                        checked={state.partials}
                        title="Include lines that only have one end in the selected area"
                    ></input>
                </span>
            </>}
        </span>

        {(window.innerWidth <= 768 && state.bounds.length > 1) && <div className="br"/>}

        {/* Clear all button */}
        <button onClick={() => window.confirm("Are you sure you want to delete everything?") ? dispatch({action: "clear"}) : undefined} title="Clear all">
            <GiNuclear />
        </button>

        {/* Clipboard buttons */}
        <span className='button-group'>
            <button onClick={() => dispatch({action: "copy"})} title="Copy">
                <MdContentCopy />
            </button>
            <button onClick={() => dispatch({action: "cut"})} title="Cut">
                <MdOutlineContentCut />
            </button>
            <button onClick={() => dispatch({action: "paste"})} title="Paste">
                <MdContentPaste />
            </button>
        </span>

        {/* Undo/Redo buttons */}
        <span className="button-group">
            <button onClick={() => dispatch({action: "undo"})} title="Undo">
                <MdUndo />
            </button>
            <button onClick={() => dispatch({action: "redo"})} title="Redo">
                <MdRedo />
            </button>
        </span>

        {/* Home button */}
        <button id='home-button' onClick={() => dispatch({action: "go home"})} title="Reset position and scale">
            <MdHome />
        </button>

        {/* Grip */}
        <FaGripLinesVertical id="grip" color='darkgray'/>
    </div>
}
