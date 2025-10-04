import { useContext, useRef, useState } from 'react';
import "../styling/SettingsMenu.css"
import { Number } from "./MenuUtils"
import { KeyMenu } from './KeyMenu';

import { IoClose } from "react-icons/io5";
import { localStorageSettingsName } from '../globals';

import { ColorPicker, ColorService } from "react-color-palette";
// This works, but not in the tests for whatever reason
// import "react-color-palette/css";
import "react-color-palette/dist/css/rcp.css";
import {version} from '../globals';
import { StateContext } from '../Contexts';
import Page from "./Page";
import { Box, Button, Checkbox, FormControlLabel, FormHelperText, List, ListItem, ListItemText, ListSubheader, MenuItem, Popover, Select, Stack, Switch, useTheme } from '@mui/material';
import { Helper } from './Helper';
import styled from '@emotion/styled';
// import useMediaQuery from '@mui/material/useMediaQuery';
import { extraButtons } from './ExtraButton';

function SettingsMenu() {
    const { state, dispatch } = useContext(StateContext)
    const [palletteVisible, setPalletteVisible] = useState(false);
    const colorMenu = useRef()

    const {
        removeSelectionAfterDelete,
        side,
        invertedScroll,
        scrollSensitivity,
        hideHexColor,
        enableGestureScale,
        extraButton,
        hideDots,
        maxUndoAmt,
        debug,
        gestureTranslateSensitivity,
        gestureScaleSensitivity,
        smoothGestureScale,
        dotsAbovefill,
    } = state

    return <>
        <div id='settings-menu'> {/*onAbort={() => dispatch({action: "menu", close: "settings"})}>*/}
            <h3>Settings</h3>
            <button id='close-button' onClick={() => dispatch({ action: "menu", close: "settings" })}><IoClose /></button>
            {/* removeSelectionAfterDelete */}
            <Checkbox label="Invert Scroll"
                title="Controls the scroll direction"
                onChange={() => dispatch({ invertedScroll: !invertedScroll })}
                checked={invertedScroll}
            />
            <Number label="Scroll Sensitivity"
                title="Controls how fast scroll translates"
                onChange={val => dispatch({ scrollSensitivity: val })}
                value={scrollSensitivity}
                step={.1}
            />
            <Number label="2 Finger Move Sensitivity"
                // title="Controls how 2 finger scroll translates"
                onChange={val => dispatch({ gestureTranslateSensitivity: val })}
                value={gestureTranslateSensitivity}
                step={.1}
            />
            <Number label="2 Finger Scale Sensitivity"
                // title="Controls how fast scroll translates"
                onChange={val => dispatch({ gestureScaleSensitivity: val })}
                value={gestureScaleSensitivity}
                step={.1}
            />
            <Checkbox label="Smooth Scale Gesture"
                title="Can help smooth out 2 finger gestures"
                onChange={() => dispatch({ smoothGestureScale: !smoothGestureScale })}
                checked={smoothGestureScale}
            />
            <Checkbox label="Scale with 2 Finger Spread"
                title="Controls whether the 2 finger spread gesture scales the page or not"
                onChange={() => dispatch({ enableGestureScale: !enableGestureScale })}
                checked={enableGestureScale}
            />
            <Checkbox label="Remove Selection after Cut"
                title="Controls if the bounds get removed after the selection gets deleted, whether from cutting or by deleting"
                onChange={() => dispatch({ removeSelectionAfterDelete: !removeSelectionAfterDelete })}
                checked={removeSelectionAfterDelete}
            />

            Extra Button: <select required onChange={e => dispatch({ extraButton: e.target.value })} value={extraButton}>
                {extraButtons.map(i => <option value={i} key={i}>{i}</option>)}
            </select>
            <br />

            Menu Side: <select required onChange={e => dispatch({ side: e.target.value })} value={side}>
                {['top', 'left', 'right', 'bottom'].map(i => <option value={i} key={i}>{i}</option>)}
            </select>
            {/* The color picker */}
            <div ref={colorMenu}>
                {palletteVisible && <ColorPicker color={ColorService.convert('hex', state.paperColor)} onChange={(clr) => {
                    dispatch({ paperColor: clr.hex });
                }} hideInput={['hsv', state.hideHexColor ? 'hex' : '']} />}
            </div>
            <div ref={colorMenu}>
                <button id='color-picker-button'
                    onClick={() => setPalletteVisible(!palletteVisible)}
                    style={{ backgroundColor: state.paperColor, color: 'black' }}
                >
                    {palletteVisible ? "Set" : "Pick Background Color"}
                </button>
            </div>
            <button onClick={() => dispatch({ hideDots: !state.hideDots })}>{hideDots ? "Show" : "Hide"} dots</button>

            <h4>Advanced</h4>
            <Checkbox label="Hide Hex Color"
                title="Controls if the hex color is displayed in the color menu"
                onChange={() => dispatch({ hideHexColor: !hideHexColor })}
                checked={hideHexColor}
            />
            <Checkbox label="Dots above fill"
                title="Controls if the dots are displayed above the filled areas or not"
                onChange={() => dispatch({ dotsAbovefill: !dotsAbovefill })}
                checked={dotsAbovefill}
            />
            <Number label="Max Undo Amount"
                title="Controls how many consecutive undos you can do at once"
                onChange={val => dispatch({ maxUndoAmt: val })}
                value={maxUndoAmt}
                min={2}
            />
            <Checkbox label="Debug Mode"
                title="Adds some visual aids useful for debugging"
                onChange={() => dispatch('toggle_debugging')}
                checked={debug}
            />
            <button onClick={() => {
                if (window.confirm("Reset all settings to default? This will clear the current pattern.")) {
                    localStorage.removeItem(localStorageSettingsName)
                    window.location.reload()
                }
            }} title="Clears the settings cache">
                Reset to Defaults
            </button>

            {!state.mobile && <button
                className='footer'
                onClick={() => dispatch({ action: 'menu', open: 'key', close: 'settings' })}
            >
                Keyboard Shortcuts
            </button>}
        </div>
        {state.openMenus.key && <KeyMenu />}
    </>
}


const StyledSubheader = styled(ListSubheader)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? undefined : theme.palette.primary.light,
    width: '100%',
    borderRadius: theme.shape.borderRadius,
}));

function SettingsMenuMui() {
    const { state, dispatch } = useContext(StateContext)
    const [palletteVisible, setPalletteVisible] = useState(false);
    const colorMenuButton = useRef()
    const theme = useTheme()
    // const systemDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    function Setting({ label, help, children, mobileOnly, desktopOnly }) {
        if (mobileOnly && !state.mobile) return null
        if (desktopOnly && state.mobile) return null
        return <ListItem>
            <ListItemText primary={label} secondary={help} />
            {children}
        </ListItem>
    }

    const {
        removeSelectionAfterDelete,
        side,
        invertedScroll,
        scrollSensitivity,
        hideHexColor,
        enableGestureScale,
        extraButton,
        hideDots,
        maxUndoAmt,
        debug,
        gestureTranslateSensitivity,
        gestureScaleSensitivity,
        smoothGestureScale,
        dotsAbovefill,
        paperColor,
        darkMode,
        beginnerMode,
    } = state

    return <Page menu="settings">
        {/* <Stack spacing={2}> */}
        <List subheader={<StyledSubheader>General</StyledSubheader>}>
            {/* General */}
            <Setting label="Extra Button" help="Defines the functionality of the customizable button">
                <Select required onChange={e => dispatch({ extraButton: e.target.value })} value={extraButton}>
                    {Object.keys(extraButtons).map(i => <MenuItem sx={{width: '100%'}} value={i} key={i}>{(i.charAt(0).toUpperCase() + i.slice(1)).replace(/_/g, ' ')}</MenuItem>)}
                </Select>
            </Setting>

            <Setting label="Menu Side" help="Controls the side of the screen the menu is on">
                <Select required onChange={e => dispatch({ side: e.target.value })} value={side}>
                    {['Top', 'Left', 'Right', 'Bottom'].map(i => <MenuItem sx={{width: '100%'}} value={i.toLowerCase()} key={i}>{i}</MenuItem>)}
                </Select>
            </Setting>

            {/* Color Menu */}
            {/* TODO: this should work, but it doesn't, I suspect an internal color picker error */}
            {/* TODO: also, once it does work, have it modify the current theme */}
            <Setting label="Background Color">
                <Button ref={colorMenuButton} id='color-picker-button'
                    onClick={() => setPalletteVisible(!palletteVisible)}
                    sx={{ backgroundColor: paperColor, color: 'black' }}
                >
                    {/* {palletteVisible ? "Set" : "Pick Background Color"} */}
                    Pick Background Color
                </Button>
                <Popover
                    open={palletteVisible}
                    onClose={() => {
                        setPalletteVisible(false)
                        colorMenuButton.current.focus()
                    }}
                    // anchorEl={colorMenuButton.current}
                    anchorEl={document.getElementById('color-picker-button')}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                >
                    <ColorPicker
                        color={ColorService.convert('hex', paperColor)}
                        onChangeComplete={(clr) => dispatch({ paperColor: clr.hex })}
                        hideInput={['hsv', hideHexColor ? 'hex' : '']}
                    />
                </Popover>
            </Setting>

            <Setting label="Hide Dots" help="Useful for saving images or admiring your creation">
                <Checkbox
                    checked={hideDots}
                    onChange={() => dispatch({ hideDots: !hideDots })}
                />
            </Setting>

            <Setting label="Remove Selection after Cut" help="Controls if the bounds get removed after the selection gets deleted, whether from cutting or by deleting">
                <Checkbox
                    checked={removeSelectionAfterDelete}
                    onChange={() => dispatch({ removeSelectionAfterDelete: !removeSelectionAfterDelete })}
                />
            </Setting>

            <Setting label="Dark Mode" help="Controls if the app is in dark mode or not">
                <Select
                    value={darkMode}
                    onChange={e => dispatch({ action: 'set_dark_mode', darkMode: e.target.value })}
                >
                    {/* <MenuItem value="system">System</MenuItem> */}
                    <MenuItem value={true}>Dark</MenuItem>
                    <MenuItem value={false}>Light</MenuItem>
                </Select>
            </Setting>

            {/* Controls */}
            <StyledSubheader>Controls</StyledSubheader>
            <Setting desktopOnly label="Invert Scroll" help="Controls if the scroll is inverted">
                <Checkbox
                    checked={invertedScroll}
                    onChange={() => dispatch({ invertedScroll: !invertedScroll })}
                />
            </Setting>

            <Setting desktopOnly label="Scroll Sensitivity" help="Controls how fast scroll translates">
                <Number
                    onValueChange={val => dispatch({ scrollSensitivity: val })}
                    value={scrollSensitivity}
                    min={0}
                    max={10}
                    step={.1}
                />
            </Setting>
            <Setting label="Two Finger Move Sensitivity" help="Controls how two finger scroll translates">
                <Number
                    onValueChange={val => dispatch({ gestureTranslateSensitivity: val })}
                    value={gestureTranslateSensitivity}
                    step={.1}
                    min={0}
                    max={10}
                />
            </Setting>
            <Setting label="Two Finger Scale Sensitivity" help="Controls how fast scroll translates">
                <Number
                    onValueChange={val => dispatch({ gestureScaleSensitivity: val })}
                    value={gestureScaleSensitivity}
                    step={.1}
                    min={0}
                    max={10}
                />
            </Setting>
            <Setting label="Smooth Scale Gesture" help="Can help smooth out two finger gestures">
                <Checkbox
                    checked={smoothGestureScale}
                    onChange={() => dispatch({ smoothGestureScale: !smoothGestureScale })}
                />
            </Setting>
            <Setting label="Two Finger Spread Gesture Scales Page" help="Controls whether the two finger spread gesture scales the page or not">
                <Checkbox
                    checked={enableGestureScale}
                    onChange={() => dispatch({ enableGestureScale: !enableGestureScale })}
                />
            </Setting>

            <StyledSubheader>Advanced</StyledSubheader>
            <Setting label="Beginner Mode" help="Shows extra tooltips and other beginner-friendly features">
                <Checkbox
                    checked={beginnerMode}
                    onChange={() => dispatch({ beginnerMode: !beginnerMode })}
                />
            </Setting>

            <Setting label="Hide Hex Color" help="Controls if the hex color is displayed in the color menu">
                <Checkbox
                    checked={hideHexColor}
                    onChange={() => dispatch({ hideHexColor: !hideHexColor })}
                />
            </Setting>
            <Setting label="Dots above fill" help="Controls if the dots are displayed above the filled areas or not">
                <Checkbox
                    checked={dotsAbovefill}
                    onChange={() => dispatch({ dotsAbovefill: !dotsAbovefill })}
                />
            </Setting>
            <Setting label="Max Undo Amount" help="Controls how many consecutive undos you can do at once">
                <Number
                    onValueChange={val => dispatch({ maxUndoAmt: val })}
                    value={maxUndoAmt}
                    min={2}
                />
            </Setting>
            <Setting label="Debug Mode" help="Adds some visual aids useful for debugging">
                <Checkbox
                    checked={debug}
                    onChange={() => dispatch('toggle_debugging')}
                />
            </Setting>
            <Setting label="Reset to Defaults" help="Clear the settings cache">
                <Button variant="outlined" onClick={() => {
                    if (window.confirm("Reset all settings to default? This will clear the current pattern.")) {
                        localStorage.removeItem(localStorageSettingsName)
                        window.location.reload()
                    }
                }}>
                    Reset to Defaults
                </Button>
            </Setting>

            <Setting desktopOnly label="Keyboard Shortcuts" help="View the keyboard shortcuts">
                <Button variant="outlined" onClick={() => dispatch({ action: 'menu', open: 'key', close: 'settings' })}>
                    Keyboard Shortcuts
                </Button>
            </Setting>
            <br/>
            <footer>v{version}</footer>
        </List>
    </Page>
}

export default SettingsMenuMui