import React, {useEffect, useRef, useState} from "react";
import "./NavMenu.css"
import options from "./options";

import { FaGripLinesVertical } from "react-icons/fa6";


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
            {`Position: ${translationx}, ${translationy} | Scale: ${scalex}, ${scaley}`}
            <button onClick={() => dispatch({action: 'increase scale', amtx: scalex, amty: scaley})}>
                Increase scale
            </button>
            {/* Grip */}
            <FaGripLinesVertical id="grip" color='darkgray'/>
        </div>
    </>
}
