import {useContext, useEffect, useRef, useState} from "react";
import "../styling/ColorMenu.css"
import { ColorPicker, ColorService } from "react-color-palette";
// This works, but not in the tests for whatever reason
// import "react-color-palette/css";
import "react-color-palette/dist/css/rcp.css";
import options from "../options";
import {Number} from "./MenuUtils";
import {useAlignWithElement} from "./MenuHooks";

import { FaGripLinesVertical } from "react-icons/fa6";
import {StateContext} from "../Contexts";
import {viewportHeight} from "../globals";

let offsetX, offsetY;
let isDragging = false;

function DesktopColorMenu(){
    const {state, dispatch} = useContext(StateContext)
    const {side} = state

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
            draggableElement.style.bottom  = `${viewportHeight() - (y - offsetY)-draggableElement.getBoundingClientRect().height}px`
            // Make the color picker move with the menu
            colorPicker.style.left = draggableElement.style.left
            colorPicker.style.bottom = `${viewportHeight() - draggableElement.getBoundingClientRect().top}px`
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
        <div id='color-picker-desktop' ref={colorMenu}
            style={{
                left: colorMenu.current?.getBoundingClientRect().left,
                bottom:  viewportHeight() -colorMenu.current?.getBoundingClientRect().top,
            }}
        >
            {palletteVisible && <ColorPicker color={ColorService.convert('hex', state.stroke)} onChange={(clr) => {
                dispatch({stroke: clr.hex});
                // setColor(clr)
            }} hideInput={['hsv', state.hideHexColor ? 'hex' : '']}/>}
        </div>
        <div id="color-menu-desktop" ref={colorMenu}>
            <button id='color-picker-button'
                onClick={() => {
                    if (palletteVisible)
                        dispatch({action: 'add_common_color', color: state.stroke})
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
                        onClick={() => dispatch({stroke: commonColor})}
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
                    onChange={(val) => dispatch({dash: val.target.value})}
                ></input>
            </span>
            {/* Grip */}
            <FaGripLinesVertical id="grip" color='darkgray'/>
        </div>
    </>
}

function MobileColorMenu({align}){
    const {state, dispatch} = useContext(StateContext)
    const style = useAlignWithElement(align)

    const {stroke, strokeWidth, dash, colorProfile, scalex, side} = state

    return <div id="color-menu-mobile" style={{...style,
            top: ['left', 'right'].includes(side) ? undefined : style.top,
            // Custom style to make it look better
            transform: side === 'left' ? 'translate(10px, 0)' : undefined,
        }}>
        {/* The full screen color menu */}
        <div id="color-picker-mobile-actual">
            <ColorPicker
                color={ColorService.convert('hex', stroke[colorProfile])}
                hideInput={['hsv', state.hideHexColor ? 'hex' : '']}
                onChange={(clr) => {
                    let copy = JSON.parse(JSON.stringify(stroke))
                    copy[colorProfile] = clr.hex
                    dispatch({stroke: copy})
                }}
            />
        </div>

        {/* Color profile buttons */}
        <span className='button-group' id="color-profile-buttons">
            {Array(options.commonColorAmt).fill().map((_, i) =>
                <button
                    onClick={() => dispatch({colorProfile: i})}
                    // // style={{backgroundColor: stroke[i]}}
                    // style={{backgroundColor: i === colorProfile ? "rgb(100,100,100)" : "rgb(60,60,60)"}}
                    style={{backgroundColor: i === colorProfile ? "#aa9578" : state.paperColor}}
                    key={`colorButton${i}`}
                    className="common-color-button"
                >{i+1}<svg width="30" height='20'><line
                    x1={0} x2="90%" y1={10} y2={10}
                    // stroke="black"
                    stroke={stroke[i]}
                    strokeWidth={strokeWidth[i] * scalex}
                    strokeDasharray={dash[i].replace(/\s/, '').split(',').map(k => k/3).join(',')}
                    strokeLinecap="round"
                /></svg></button>
            )}
        </span>

        {/* Stroke input */}
        <Number
            id='stroke-input'
            label="Stroke:"
            value={strokeWidth[colorProfile] * 100}
            onChange={val => {
                let copy = JSON.parse(JSON.stringify(strokeWidth))
                copy[colorProfile] = val / 100
                dispatch({strokeWidth: copy})
            }}
        />

        {/* Dash code */}
        <span id="dash-input-area">
            <label htmlFor="dash-input">Dash Code: </label>
            <input
                id="dash-input"
                type="text"
                value={dash[colorProfile]}
                style={{width: dash.length * 5 + 10}}
                onChange={e => {
                    let copy = JSON.parse(JSON.stringify(dash))
                    copy[colorProfile] = e.target.value
                    dispatch({dash: copy})
                }}
            ></input>
        </span>

        {/* The set button */}
        <button id='color-menu-close-button'
            onClick={() => {
                // dispatch({action: 'add common color', color: state.stroke})
                dispatch({action: 'menu', close: 'color'})
            }}
            style={{backgroundColor: state.paperColor}}
        >
            Close
        <svg width="90%" height='10'><line
            x1='0' x2="90%" y1={5} y2={5}
            stroke={stroke[colorProfile]}
            strokeWidth={strokeWidth[colorProfile] * scalex}
            strokeDasharray={dash[colorProfile]}
            strokeLinecap="round"
        /></svg>
        </button>
    </div>
}

export default function ColorMenu({align}){
    // const [state, ] = useContext(StateContext)

    // return state.mobile
    return <MobileColorMenu align={align}/>
        // : <DesktopColorMenu/>
}
