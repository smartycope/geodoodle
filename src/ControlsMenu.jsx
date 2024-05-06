import React, {useEffect, useRef, useState} from "react";
import "./ControlsMenu.css"
import { MdContentCopy } from "react-icons/md"
import { MdHome } from "react-icons/md";
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdCropPortrait } from "react-icons/md";
import { MIRROR_AXIS } from "./globals";
import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { PiLineVerticalBold } from "react-icons/pi";
import { MdUndo } from "react-icons/md";
import { MdRedo } from "react-icons/md";
import { BsSlash } from "react-icons/bs";

let offsetX, offsetY;
let isDragging = false;

export default function ControlsMenu({dispatch, state}){
    // Enable dragging - mostly copied from ChatGPT
    useEffect(() =>{
        const draggableElement = document.getElementById('controls-menu');

        // Function to handle mouse down event
        function handleMouseDown(event) {
            isDragging = true;
            // Calculate the offset between mouse position and element position
            offsetX = event.clientX - draggableElement.getBoundingClientRect().left;
            offsetY = event.clientY - draggableElement.getBoundingClientRect().top;
            draggableElement.style.cursor = "grabbing"
            event.stopPropagation()
        }

        // Function to handle mouse move event
        function handleMouseMove(event) {
            if (!isDragging) return;
            // Update the element's position based on mouse movement
            draggableElement.style.left = `${event.clientX - offsetX}px`;
            draggableElement.style.top = `${event.clientY - offsetY}px`;
            event.stopPropagation()
        }

        // Function to handle mouse up event
        function handleMouseUp(event) {
            isDragging = false;
            draggableElement.style.cursor = "grab"
            event.stopPropagation()
        }

        // Add event listeners for mouse events
        draggableElement.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            draggableElement.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

    }, [])

    let mirror
    // eslint-disable-next-line default-case
    switch(state.mirrorAxis){
        case MIRROR_AXIS.VERT: mirror = <><PiLineVerticalBold /> Vertical</>; break
        case MIRROR_AXIS.HORZ: mirror = <><FaMinus /> Horizontal</>; break
        case MIRROR_AXIS.BOTH: mirror = <><FaPlus /> Crossed</>; break
        case MIRROR_AXIS.NONE: mirror = <><MdCropPortrait /> Mirror</>; break
    }

    return <div id="controls-menu">
        <span id='mode-picker'>
            <label htmlFor="mode-selector">Mode: </label>
            <select id='mode-selector'
                name="node-picker"
                required
                onChange={e => dispatch({action: 'set mode', mode: Number(e.target.value)})}
                defaultChecked='line'
            >
                {/* The values correspond to their enum values  */}
                <option value="0">Line</option>
                <option value="1">Selection</option>
                <option value="2">Delete</option>
                <option value="3">Repeat</option>
            </select>
        </span>

        <button onClick={() => dispatch({action: "toggle mirror"})} title='Toggle mirror'>
            {mirror}
        </button>

        <label htmlFor="partial-picker" title="Include lines that only have one end in the selected area">
            Include Partials:
        </label>
        <input
            type="checkbox"
            name="partial-picker"
            onChange={() => dispatch({action: "toggle partials"})}
            checked={state.partials}
            title="Include lines that only have one end in the selected area"
        ></input>

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

        <span className="button-group">
            <button onClick={() => dispatch({action: "undo"})} title="Undo">
                <MdUndo />
            </button>
            <button onClick={() => dispatch({action: "redo"})} title="Redo">
                <MdRedo />
            </button>
        </span>

        <button id='home-button' onClick={() => dispatch({action: "go home"})} title="Reset position and scale">
            <MdHome />
        </button>
    </div>
}
