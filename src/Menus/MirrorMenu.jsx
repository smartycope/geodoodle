import React, {useEffect} from "react";
import { MIRROR_METHOD } from "../globals";
import { FaGripLinesVertical } from "react-icons/fa6";
import {incrementMirrorAxis, incrementMirrorMethod, incrementMirrorType} from "../utils";
import {Checkbox, MirrorAxisIcon, MirrorMethodIcon, MirrorTypeIcon} from "./MenuUtils";
import "../styling/MirrorMenu.css"

let offsetX, offsetY;
let isDragging = false;


function DesktopMirrorMenu({dispatch, state}){
    // Enable dragging - mostly copied from ChatGPT
    useEffect(() =>{
        const draggableElement = document.getElementById('mirror-menu-desktop');

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

    const {mirrorType, mirrorMethod, mirrorAxis, mirrorAxis2} = state

    return <span id="mirror-menu-desktop" className="button-group">
        <button
            id='mirror-type'
            title='Toggle mirror type'
            onClick={() => dispatch({mirrorType: incrementMirrorType(mirrorType)})}
        >
            <MirrorTypeIcon mirrorType={state.mirrorType}/>
        </button>
        <button
            id='mirror-method'
            title='Toggle mirror method'
            onClick={() => dispatch({mirrorMethod: incrementMirrorMethod(mirrorMethod)})}
        >
            <MirrorMethodIcon mirrorMethod={state.mirrorMethod}/>
        </button>
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.FLIP].includes(state.mirrorMethod) &&
            <button
                id='mirror-axis-1'
                title='Toggle mirror axis'
                onClick={() => dispatch({mirrorAxis: incrementMirrorAxis(mirrorAxis)})}
            >
                <MirrorAxisIcon mirrorAxis={state.mirrorAxis} mirrorMethod={MIRROR_METHOD.FLIP}/>
            </button>
        }
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.ROTATE].includes(state.mirrorMethod) &&
            <button
                id='mirror-axis-2'
                title='Toggle mirror rotation angle'
                onClick={() => dispatch({mirrorAxis2: incrementMirrorAxis(mirrorAxis2)})}
            >
                <MirrorAxisIcon mirrorAxis={state.mirrorAxis2} mirrorMethod={MIRROR_METHOD.ROTATE}/>
            </button>
        }
        {/* Grip */}
        <FaGripLinesVertical id="grip" color='darkgray'/>
    </span>
}

function MobileMirrorMenu({dispatch, state, align}){
    const {mirrorType, mirrorMethod, mirrorAxis, mirrorAxis2, mirroring} = state
    const to = document.querySelector("#" + align).getBoundingClientRect()

    return <span id="mirror-menu-mobile" className="main-mobile-sub-menu" style={{top: to.bottom, left: to.left}}>
        {/* Enabled */}
        <Checkbox checked={mirroring} onChange={() => dispatch({mirroring: !mirroring})} label={"Enabled:"} backwards={true}/>
        Type
        <button
            id='mirror-type'
            title='Toggle mirror type'
            onClick={() => dispatch({mirrorType: incrementMirrorType(mirrorType)})}
        >
            <MirrorTypeIcon mirrorType={state.mirrorType}/>
        </button>
        Method
        <button
            id='mirror-method'
            title='Toggle mirror method'
            onClick={() => dispatch({mirrorMethod: incrementMirrorMethod(mirrorMethod)})}
        >
            <MirrorMethodIcon mirrorMethod={state.mirrorMethod}/>
        </button>
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.FLIP].includes(state.mirrorMethod) &&
            <span>
                Flip
                <button
                    id='mirror-axis-1'
                    title='Toggle mirror axis'
                    onClick={() => dispatch({mirrorAxis: incrementMirrorAxis(mirrorAxis)})}
                >
                    <MirrorAxisIcon mirrorAxis={state.mirrorAxis} mirrorMethod={MIRROR_METHOD.FLIP}/>
                </button>
            </span>
        }
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.ROTATE].includes(state.mirrorMethod) &&
            <span>
                Rotate
                <button
                    id='mirror-axis-2'
                    title='Toggle mirror rotation angle'
                    onClick={() => dispatch({mirrorAxis2: incrementMirrorAxis(mirrorAxis2)})}
                >
                    <MirrorAxisIcon mirrorAxis={state.mirrorAxis2} mirrorMethod={MIRROR_METHOD.ROTATE}/>
                </button>
            </span>
        }
    </span>
}

export default function MirrorMenu({dispatch, state, align}){
    return state.mobile
        ? <MobileMirrorMenu dispatch={dispatch} state={state} align={align}/>
        : <DesktopMirrorMenu dispatch={dispatch} state={state}/>
}
