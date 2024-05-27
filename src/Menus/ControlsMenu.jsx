import {useEffect} from "react";
import "../styling/ControlsMenu.css"

import { MdContentCopy } from "react-icons/md"
import { MdHome } from "react-icons/md";
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdUndo } from "react-icons/md";
import { MdRedo } from "react-icons/md";
import { GiNuclear } from "react-icons/gi";
import { FaGripLinesVertical } from "react-icons/fa6";
import { PiSelectionPlusDuotone } from "react-icons/pi";
import { PiSelectionSlashDuotone } from "react-icons/pi";
import { MdDelete } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";

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


    return <div id="controls-menu">
        {window.innerWidth <= 768 && <div className="br"/>}

        {/* Selection buttons */}
        <span className='selection-group' style={{width: state.bounds.length > 1 ? '100%' : 'auto'}}>
            {state.mobile && <button title="Add selection bound" onClick={() => dispatch({action: 'add bound'})} id='add-bound'>
                <PiSelectionPlusDuotone />
            </button>}
            {state.bounds.length > 1 && <>
                <button title="Clear selection" onClick={() => dispatch('nevermind')} id="clear-selection">
                    <PiSelectionSlashDuotone />
                </button>
                <span className="checkbox" id='partial-picker'>
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
        <button
            onClick={() => window.confirm("Are you sure you want to delete everything?") ? dispatch({action: "clear"}) : undefined}
            title="Clear all"
            id='clear-all'
        >
            <GiNuclear />
        </button>

        {/* Clipboard buttons */}
        <span className='button-group' id='copy-buttons'>
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

        {/* Delete buttons */}
        {state.mobile && <span className="button-group">
            <button id="delete-lines" onClick={() => dispatch({action: "delete"})} title="Delete all lines attached to a point">
                <MdDelete />
            </button>
            <button id="delete-line" onClick={() => dispatch({action: "delete line"})} title="Delete a specific line">
                <MdDeleteForever />
            </button>
        </span>}

        {/* Undo/Redo buttons */}
        <span className="button-group" id='undo-buttons'>
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
