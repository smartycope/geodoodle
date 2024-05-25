import React, {useEffect, useRef, useState} from "react";
import "../styling/ColorMenu.css"
import { MdContentCopy } from "react-icons/md"
import { MdHome } from "react-icons/md";
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdCropPortrait } from "react-icons/md";
import { MIRROR_AXIS, MIRROR_METHOD, MIRROR_TYPE } from "../globals";
import { ColorPicker, useColor, ColorService } from "react-color-palette";
import "react-color-palette/css";
import options from "../options";

import { FaGripLinesVertical } from "react-icons/fa6";
import {Number} from "./MenuUtils";


let offsetX, offsetY;
let isDragging = false;

function DesktopColorMenu({dispatch, state}){
    // const [color, setColor] = useColor(state.stroke);
    const [palletteVisible, setPalletteVisible] = useState(false);
    const colorMenu = useRef()

    // Enable dragging - mostly copied from ChatGPT
    useEffect(() =>{
        const draggableElement = document.getElementById('color-menu-desktop');
        const colorPicker = document.getElementById('color-picker-desktop');

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
            // Make the color picker move with the menu
            colorPicker.style.left = draggableElement.style.left
            colorPicker.style.bottom = `${window.visualViewport.height - draggableElement.getBoundingClientRect().top}px`
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

    // console.log(state.commonColors);
    // console.log(ColorService(state.stroke))


    return <>
        <div id='color-picker-desktop' ref={colorMenu}
            style={{
                left: colorMenu.current?.getBoundingClientRect().left,
                bottom:  window.visualViewport.height -colorMenu.current?.getBoundingClientRect().top,
            }}
        >
            {palletteVisible && <ColorPicker color={ColorService.convert('hex', state.stroke)} onChange={(clr) => {
                dispatch({action: 'set manual', stroke: clr.hex});
                // setColor(clr)
            }} hideInput={['hsv', state.hideHexColor ? 'hex' : '']}/>}
        </div>
        <div id="color-menu-desktop" ref={colorMenu}>
            <button id='color-picker-button'
                onClick={() => {
                    if (palletteVisible)
                        dispatch({action: 'add common color', color: state.stroke})
                    setPalletteVisible(!palletteVisible)
                }}
                style={{backgroundColor: state.stroke}}
            >
                {palletteVisible ? "Set" : "Pick Color"}
            </button>

            {/* Recently used buttons */}
            <span className='button-group' id="recent-color-buttons">
                {JSON.parse(JSON.stringify(state.commonColors)).reverse().map((commonColor, i) =>
                    <button
                        onClick={() => dispatch({action: 'set manual', stroke: commonColor})}
                        style={{backgroundColor: commonColor}}
                        key={`colorButton${i}`}
                    >{i+1}</button>
                )}
            </span>

            {/* Stroke input */}
            <Number
                label={"Stroke:"}
                value={state.strokeWidth * 100}
                onChange={(val) => dispatch({strokeWidth: val / 100})}
                id='stroke-input'
            />

            {/* Dash code */}
            <span id="dash-input-area">
                <label htmlFor="dash-input">Dash Code: </label>
                <input
                    id="dash-input"
                    type="text"
                    value={state.dash}
                    style={{width: state.dash.length * 5 + 10}}
                    onChange={(val) => dispatch({action: 'set manual', dash: val.target.value})}
                ></input>
            </span>
            {/* Grip */}
            <FaGripLinesVertical id="grip" color='darkgray'/>
        </div>
    </>
}

function MobileColorMenu({dispatch, state}){
    return <div id="color-menu-mobile">
        {/* The full screen color menu */}
        <div id="color-picker-mobile-actual">
            <ColorPicker
                color={ColorService.convert('hex', state.stroke)}
                onChange={(clr) => dispatch({action: 'set manual', stroke: clr.hex})}
                hideInput={['hsv', state.hideHexColor ? 'hex' : '']}
            />
        </div>

        {/* Recently used buttons */}
        <span className='button-group' id="recent-color-buttons">
            {JSON.parse(JSON.stringify(state.commonColors)).reverse().map((commonColor, i) =>
                <button
                    onClick={() => dispatch({action: 'set manual', stroke: commonColor})}
                    style={{backgroundColor: commonColor}}
                    key={`colorButton${i}`}
                    className="common-color-button"
                >{i+1}</button>
            )}
        </span>

        {/* Stroke input */}
        <Number
            label={"Stroke:"}
            value={state.strokeWidth * 100}
            onChange={(val) => dispatch({strokeWidth: val / 100})}
            id='stroke-input'
        />

        {/* Dash code */}
        <span id="dash-input-area">
            <label htmlFor="dash-input">Dash Code: </label>
            <input
                id="dash-input"
                type="text"
                value={state.dash}
                style={{width: state.dash.length * 5 + 10}}
                onChange={e => dispatch({dash: e.target.value})}
            ></input>
        </span>

        {/* The set button */}
        <button id='color-picker-button-mobile'
            onClick={() => {
                dispatch({action: 'add common color', color: state.stroke})
                dispatch({action: 'menu', close: 'color'})
            }}
            style={{backgroundColor: state.stroke}}
        >
            Set
        </button>
    </div>
}

export default function ColorMenu({dispatch, state}){
    return state.mobile
        ? <MobileColorMenu dispatch={dispatch} state={state}/>
        : <DesktopColorMenu dispatch={dispatch} state={state}/>
}
