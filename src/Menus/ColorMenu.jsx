import { useContext, useEffect, useRef, useState } from "react";
// import "../styling/ColorMenu.css"
import { ColorPicker, ColorService } from "react-color-palette";
// This works, but not in the tests for whatever reason
// import "react-color-palette/css";
// import "react-color-palette/dist/css/rcp.css";
import options from "../options";
import { Number } from "./MenuUtils";
import { useAlignWithElement } from "./MenuHooks";
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import MiniMenu from "./MiniMenu";

import { FaGripLinesVertical } from "react-icons/fa6";
import { StateContext } from "../Contexts";
import { viewportHeight } from "../globals";
import { getShowableStroke } from "../utils";
import { FormControlLabel, Stack, TextField, useTheme } from "@mui/material";

let offsetX, offsetY;
let isDragging = false;

function DesktopColorMenu() {
    const { state, dispatch } = useContext(StateContext)
    const { side } = state

    // const [color, setColor] = useColor(state.stroke);
    const [palletteVisible, setPalletteVisible] = useState(false);
    const colorMenu = useRef()

    // Enable dragging - mostly copied from ChatGPT
    useEffect(() => {
        const draggableElement = document.getElementById('color-menu-desktop');
        const colorPicker = document.getElementById('color-picker-desktop');

        // Function to handle mouse down event
        function handleMouseDown(event) {
            let x, y
            if (event.type === 'touchstart') {
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
            if (event.type === 'touchmove') {
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
            draggableElement.style.bottom = `${viewportHeight() - (y - offsetY) - draggableElement.getBoundingClientRect().height}px`
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
            draggableElement.removeEventListener('touchstart', handleMouseDown, { passive: false })
            document.removeEventListener('touchmove', handleMouseMove, { passive: false })
            document.removeEventListener('touchend', handleMouseUp, { passive: false })
        }
    }, [])


    return <>
        <div id='color-picker-desktop' ref={colorMenu}
            style={{
                left: colorMenu.current?.getBoundingClientRect().left,
                bottom: viewportHeight() - colorMenu.current?.getBoundingClientRect().top,
            }}
        >
            {palletteVisible && <ColorPicker color={ColorService.convert('hex', state.stroke)} onChange={(clr) => {
                dispatch({ stroke: clr.hex });
                // setColor(clr)
            }} hideInput={['hsv', state.hideHexColor ? 'hex' : '']} />}
        </div>
        <div id="color-menu-desktop" ref={colorMenu}>
            <button id='color-picker-button'
                onClick={() => {
                    if (palletteVisible)
                        dispatch({ action: 'add_common_color', color: state.stroke })
                    setPalletteVisible(!palletteVisible)
                }}
                style={{ backgroundColor: state.stroke }}
            >
                {palletteVisible ? "Set" : "Pick Color"}
            </button>

            {/* Recently used buttons */}
            <span className='button-group' id="recent-color-buttons">
                {JSON.parse(JSON.stringify(state.commonColors)).reverse().map((commonColor, i) =>
                    <button
                        onClick={() => dispatch({ stroke: commonColor })}
                        style={{ backgroundColor: commonColor }}
                        key={`colorButton${i}`}
                    >{i + 1}</button>
                )}
            </span>

            {/* Stroke input */}
            <Number
                label={"Stroke:"}
                value={state.strokeWidth * 100}
                onChange={(val) => dispatch({ strokeWidth: val / 100 })}
                id='stroke-input'
            />

            {/* Dash code */}
            <span id="dash-input-area">
                <label htmlFor="dash-input">Dash Code: </label>
                <input
                    id="dash-input"
                    type="text"
                    value={state.dash}
                    style={{ width: state.dash.length * 5 + 10 }}
                    onChange={(val) => dispatch({ dash: val.target.value })}
                ></input>
            </span>
            {/* Grip */}
            <FaGripLinesVertical id="grip" color='darkgray' />
        </div>
    </>
}

function MobileColorMenu({ align }) {
    const { state, dispatch } = useContext(StateContext)
    const style = useAlignWithElement(align)

    const { stroke, strokeWidth, dash, colorProfile, scalex, fillMode, fill } = state
    const currentIndex = fillMode ? colorProfile : colorProfile
    const colors = fillMode ? fill : stroke

    return <div id="color-menu-mobile" style={{
        ...style,
        top: ['left', 'right'].includes(state.side) ? undefined : style.top,
        // Custom style to make it look better
        transform: state.side === 'left' ? 'translate(10px, 0)' : undefined,
    }}>
        {/* The full screen color menu */}
        <div id="color-picker-mobile-actual">
            <ColorPicker
                color={ColorService.convert('hex', colors[currentIndex])}
                hideInput={['hsv', state.hideHexColor ? 'hex' : '']}
                onChange={(clr) => {
                    let copy = JSON.parse(JSON.stringify(colors))
                    copy[currentIndex] = clr.hex
                    dispatch(fillMode ? { fill: copy } : { stroke: copy })
                }}
            />
        </div>

        {/* Color profile buttons */}
        <span className='button-group' id="color-profile-buttons">
            {Array(options.commonColorAmt).fill().map((_, i) =>
                <button
                    onClick={() => dispatch(fillMode ? { colorProfile: i } : { colorProfile: i })}
                    style={{
                        backgroundColor: fillMode ? fill[i] : state.paperColor,
                        outline: i === currentIndex ? "2px solid rgb(0, 132, 176)" : "none",
                        color: getShowableStroke(fillMode ? fill[i] : state.paperColor)
                    }}
                    key={`colorButton${i}`}
                    className="common-color-button"
                >{i + 1}<svg width="30" height='20'><line
                    x1={0} x2="90%" y1={10} y2={10}
                    stroke={fillMode ? 'black' : stroke[i]}
                    strokeWidth={strokeWidth[i] * scalex}
                    strokeDasharray={dash[i].replace(/\s/, '').split(',').map(k => k / 3).join(',')}
                    strokeLinecap="round"
                /></svg></button>
            )}
        </span>

        {/* Stroke input */}
        {!fillMode && <Number
            id='stroke-input'
            label="Stroke"
            min={1}
            step={1}
            largeStep={5}
            snapOnStep={true}
            allowWheelScrub={true}
            value={strokeWidth[colorProfile] * 100}
            onValueChange={val => {
                let copy = JSON.parse(JSON.stringify(strokeWidth))
                copy[colorProfile] = val / 100
                dispatch({ strokeWidth: copy })
            }}
        />}

        {/* Dash code */}
        {!fillMode && <span id="dash-input-area">
            <label htmlFor="dash-input">Dash Code: </label>
            <input
                id="dash-input"
                type="text"
                value={dash[colorProfile]}
                style={{ width: dash.length * 5 + 10 }}
                onChange={e => {
                    let copy = JSON.parse(JSON.stringify(dash))
                    copy[colorProfile] = e.target.value
                    dispatch({ dash: copy })
                }}
            ></input>
        </span>}

        {/* Toggle fill mode button */}
        {/* TODO: I don't like this here, but I don't know where else to put it yet */}
        <button id='color-menu-fill-button'
            onClick={() => dispatch('toggle_fill_mode')}
            // I also don't love this
            style={{ backgroundColor: fillMode ? "green" : "red" }}
        >
            Fill {fillMode ? "On" : "Off"}
        </button>

        {/* The set button */}
        <button id='color-menu-close-button'
            onClick={() => {
                // dispatch({action: 'add common color', color: state.stroke})
                dispatch({ action: 'menu', close: 'color' })
            }}
            style={{ backgroundColor: state.paperColor }}
        >
            Close
            <svg width="90%" height='10'><line
                x1='0' x2="90%" y1={5} y2={5}
                stroke={fillMode ? 'black' : stroke[colorProfile]}
                strokeWidth={strokeWidth[colorProfile] * scalex}
                strokeDasharray={dash[colorProfile]}
                strokeLinecap="round"
            /></svg>
        </button>
    </div>
}


function ColorMenuMui() {
    const { state, dispatch } = useContext(StateContext)

    const { stroke, strokeWidth, dash, colorProfile, scalex, fillMode, fill } = state
    const currentIndex = fillMode ? colorProfile : colorProfile
    const colors = fillMode ? fill : stroke
    const theme = useTheme()

    return <MiniMenu menu="color">
        {/* The full screen color menu */}
        <Box sx={{
            height: '100%',
            width: '100%',
        }}>
            <ColorPicker
                color={ColorService.convert('hex', colors[currentIndex])}
                hideInput={['hsv', state.hideHexColor ? 'hex' : '']}
                onChange={(clr) => {
                    let copy = JSON.parse(JSON.stringify(colors))
                    copy[currentIndex] = clr.hex
                    dispatch(fillMode ? { fill: copy } : { stroke: copy })
                }}
            />
        </Box>

        <Stack spacing={1} sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
        }}>
            {/* Color profile buttons */}
            {/* TODO: there should be a way to get this to expand horizontally */}
            <ButtonGroup variant="contained" sx={{
                // '& :hover': {
                //     outline: '2px solid rgb(0, 132, 176)',
                // },
            }}>
                {Array(options.commonColorAmt).fill().map((_, i) =>
                    <Button
                        onClick={() => dispatch(fillMode ? { colorProfile: i } : { colorProfile: i })}
                        sx={{
                            backgroundColor: fillMode ? fill[i] : state.paperColor,
                            outline: i === currentIndex ? "2px solid rgb(0, 132, 176)" : "none",
                            color: getShowableStroke(fillMode ? fill[i] : state.paperColor),
                            width: '100%',
                        }}
                        key={`colorButton${i}`}
                    >{i + 1}<svg width="100%" height='20' viewBox="-7 0 20 20" preserveAspectRatio="xMidYMid meet"><line
                        x1={0} x2="100%" y1={10} y2={10}
                        stroke={fillMode ? 'black' : stroke[i]}
                        strokeWidth={strokeWidth[i] * scalex}
                        strokeDasharray={dash[i].replace(/\s/, '').split(',').map(k => k / 3).join(',')}
                        strokeLinecap="round"
                    /></svg></Button>
                )}
            </ButtonGroup>

            {/* Stroke input */}
            {!fillMode && <Number
                id='stroke-input'
                label="Stroke"
                min={1}
                step={1}
                color={theme.palette.primary.contrastText}
                largeStep={5}
                snapOnStep={true}
                allowWheelScrub={true}
                value={strokeWidth[colorProfile] * 100}
                onValueChange={val => {
                    let copy = JSON.parse(JSON.stringify(strokeWidth))
                    copy[colorProfile] = val / 100
                    dispatch({ strokeWidth: copy })
                }}
            />}

            {/* Dash code */}
            {!fillMode && <TextField
                id="dash-input"
                size="small"
                label="Dash Code"
                value={dash[colorProfile]}
                onChange={e => {
                    let copy = JSON.parse(JSON.stringify(dash))
                    copy[colorProfile] = e.target.value
                    dispatch({ dash: copy })
                }}
            />}

            {/* Toggle fill mode button */}
            {/* TODO: I don't like this here, but I don't know where else to put it yet */}
            <FormControlLabel control={
                <Switch
                    id='color-menu-fill-button'
                    label="Fill"
                    checked={fillMode}
                    onChange={() => dispatch('toggle_fill_mode')}
                />
            } label="Fill Mode" labelPlacement="start" sx={{
                color: 'primary.contrastText',
            }}/>


            <Button id='color-menu-close-button'
                onClick={() => {
                    dispatch({ action: 'menu', close: 'color' })
                }}
                sx={{
                    backgroundColor: state.paperColor,
                    width: '80%',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '10px',
                    borderRadius: '10px',
                    color: 'black',
                }}
            >
                Close
                <svg width="90%" height='10'><line
                    x1='0' x2="90%" y1={5} y2={5}
                    stroke={fillMode ? 'black' : stroke[colorProfile]}
                    strokeWidth={strokeWidth[colorProfile] * scalex}
                    strokeDasharray={dash[colorProfile]}
                    strokeLinecap="round"
                /></svg>
            </Button>
        </Stack>
    </MiniMenu>
}

export default ColorMenuMui