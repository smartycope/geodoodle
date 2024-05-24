import React, {useEffect, useRef, useState} from "react";
import "../styling/NavMenu.css"
import options from "../options";
import {Number} from "./MenuUtils";

import { FaGripLinesVertical } from "react-icons/fa6";
import { TbArrowBigUpLine } from "react-icons/tb";
import { TbArrowBigDownLine } from "react-icons/tb";
import { MdHome } from "react-icons/md";
import { PiSelectionAll } from "react-icons/pi";
import defaultOptions from "../options";


let offsetX, offsetY;
let isDragging = false;

export default function NavMenu({dispatch, state}){
    // const navMenu = useRef()

    const {translationx, translationy, scalex, scaley} = state

    // Enable dragging - mostly copied from ChatGPT
    useEffect(() =>{
        const draggableElement = document.getElementById('nav-menu');

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
            // Had to modify it a little to get it to snap to the bottom instead of the top
            draggableElement.style.left = `${x - offsetX}px`
            draggableElement.style.bottom  = `${window.visualViewport.height - (y - offsetY)-draggableElement.getBoundingClientRect().height}px`
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


    return <>
        <div id='nav-menu' // ref={navMenu}
            // style={{
            //     left: navMenu.current?.getBoundingClientRect().left,
            //     bottom:  window.visualViewport.height -navMenu.current?.getBoundingClientRect().top,
            // }}
        >
            {/* <div> */}
            <span>
                Position
                <Number
                    label="x:"
                    onChange={val => dispatch({translationx: val})}
                    value={state.translationx}
                    step={scalex}
                />
                <Number
                    label='y:'
                    onChange={val => dispatch({translationy: val})}
                    value={state.translationy}
                    step={scaley}
                />
            </span>
            {/* </div> */}
             {/* | {`Scale: ${Math.round(scalex)} | `} */}
             <span>
                Scale
                <Number
                    onChange={val => dispatch({scalex: val, scaley: val})}
                    value={state.scalex}
                    onMinus={prev => prev * 2}
                    onPlus={prev => prev / 2}
                    // See also: "scale" action in the reducer
                    min={defaultOptions.minScale}
                    max={defaultOptions.maxScale}
                />
            </span>
            {/* <span>
                Scale
                <button onClick={() => dispatch({action: 'increase scale', amtx: scalex, amty: scaley})} title="Increase Scale">
                    <TbArrowBigUpLine />
                </button>
                <button onClick={() => dispatch({action: 'decrease scale', amtx: scalex, amty: scaley})} title="Decrease Scale">
                    <TbArrowBigDownLine />
                </button>
            </span> */}

            {/* Home button */}
            <button id='home-button' onClick={() => dispatch({action: "go home"})} title="Reset position and scale">
                <MdHome />
            </button>
            <button id='nav-selection-button' onClick={() => dispatch({action: 'go to selection'})} title="Go to the current selection">
                <PiSelectionAll />
            </button>

            {/* Grip */}
            <FaGripLinesVertical id="grip" color='darkgray'/>
        </div>
    </>
}