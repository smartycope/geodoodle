import { useContext, useRef, useState } from 'react';
import "../styling/SettingsMenu.css"
import Number from "./Number"
import { ColorPicker, ColorService } from "react-color-palette";
import "react-color-palette/dist/css/rcp.css";
import { version } from '../globals';
import { StateContext } from '../Contexts';
import Page from "./Page";
import { Box, Button, Checkbox, List, ListItem, ListItemText, ListSubheader, MenuItem, Popover, Select, TextField, useTheme } from '@mui/material';
import styled from '@emotion/styled';
import { extraButtons } from './ExtraButton';
import { clearPreservedState } from '../fileUtils';

const StyledSubheader = styled(ListSubheader)(({ theme }) => {
    // Yes this inconsistent, but *I like it*
    const bg = theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.primary.light
    return {
        backgroundColor: bg,
        width: '100%',
        color: theme.darken(theme.palette.getContrastText(bg), .1),
        borderRadius: theme.shape.borderRadius,
    }
});


function Setting({ label, help, children, mobileOnly, desktopOnly }) {
    const { state } = useContext(StateContext)
    if (mobileOnly && !state.mobile) return null
    if (desktopOnly && state.mobile) return null
    return <ListItem>
        <ListItemText primary={label} secondary={help} />
        {children}
    </ListItem>
}

export default function SettingsPage() {
    const { state, dispatch } = useContext(StateContext)
    const [palletteVisible, setPalletteVisible] = useState(false);
    const colorMenuButton = useRef()
    const theme = useTheme()

    const [tmpColor, setTmpColor] = useState(state.paperColor)
    // const [tmpColor, setTmpColor] = useState(ColorService.convert('hex', state.paperColor))


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
        defaultToMemorableNames,
        themeMode,
    } = state

    // console.log(document.getElementById('color-picker-button'))

    return <Page menu="settings">
        <List subheader={<StyledSubheader>General</StyledSubheader>}>
            {/* General */}
            <Setting label="Extra Button" help="Defines the functionality of the customizable button">
                <Select required onChange={e => dispatch({ extraButton: e.target.value })} value={extraButton}>
                    {Object.keys(extraButtons).map(i => <MenuItem sx={{ width: '100%' }} value={i} key={i}>{(i.charAt(0).toUpperCase() + i.slice(1)).replace(/_/g, ' ')}</MenuItem>)}
                </Select>
            </Setting>

            <Setting label="Menu Side" help="Controls the side of the screen the menu is on">
                <Select required onChange={e => dispatch({ side: e.target.value })} value={side}>
                    {['Top', 'Left', 'Right', 'Bottom'].map(i => <MenuItem sx={{ width: '100%' }} value={i.toLowerCase()} key={i}>{i}</MenuItem>)}
                </Select>
            </Setting>

            {/* Color Menu */}
            {/* TODO: this should work, but it doesn't, I suspect an internal color picker error */}
            {/* TODO: also, once it does work, have it modify the current theme */}

            <Setting label="Background Color">
                <Button ref={colorMenuButton} id='color-picker-button'
                    onClick={() => setPalletteVisible(!palletteVisible)}
                    sx={{ backgroundColor: paperColor, color: theme.palette.getContrastText(paperColor) }}
                >
                     {/* {palletteVisible ? "Set" : "Pick Background Color"} */}
                    Pick Background Color
                </Button>
                 {/* TODO: this should work, but it doesn't, I suspect an internal color picker error */}
                 <Popover
                    open={palletteVisible}
                    onClose={() => {
                        setPalletteVisible(false)
                        // colorMenuButton.current.focus()
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
                {/* Just center it on top */}
                {/* {palletteVisible && <Box sx={{ position: 'absolute', zIndex: 100, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', p:2, bgcolor: 'blue', pointerEvents: 'all'}}> */}
                <ColorPicker
                    color={ColorService.convert('hex', paperColor)}
                    hideInput={['hsv', hideHexColor ? 'hex' : '']}
                    onChange={clr => dispatch({action: 'set_paper_color', color: clr.hex})}
                />
                </Popover>
                {/* </Box>} */}
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
                    value={themeMode}
                    onChange={e => dispatch({ themeMode: e.target.value })}
                >
                    <MenuItem value="system">System</MenuItem>
                    <MenuItem value="dark">  Dark</MenuItem>
                    <MenuItem value="light"> Light</MenuItem>
                </Select>
            </Setting>

            <Setting label="Default to Memorable Names" help="When enabled, patterns will be named using memorable words instead of Unnamed_x">
                <Checkbox
                    checked={defaultToMemorableNames}
                    onChange={() => dispatch({ defaultToMemorableNames: !defaultToMemorableNames })}
                />
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
            <Setting label="Disable Mirror Icons" help="Some browsers (Brave, DuckDuckGo) don't display the mirror icons correctly, if you're seeing giant icons when mirroring, enable this">
                <Checkbox
                    checked={state.disableMirrorIcons}
                    onChange={() => dispatch({ disableMirrorIcons: !state.disableMirrorIcons })}
                />
            </Setting>
            <Setting label="Max Undo Amount" help="Controls how many consecutive undos you can do at once">
                <Number
                    onValueChange={val => dispatch({ maxUndoAmt: val })}
                    value={maxUndoAmt}
                    min={2}
                />
            </Setting>
            {/* TODO: I don't think this will work just like that, some things need to be recalculated */}
            <Setting label="Device Mode" help="Controls if the app is in mobile or desktop mode (experimental)">
                <Select
                    value={state.mobile}
                    onChange={e => dispatch({ mobile: e.target.value })}
                >
                    <MenuItem value={false}>Desktop</MenuItem>
                    <MenuItem value={true}>Mobile</MenuItem>
                </Select>
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
                        clearPreservedState()
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
            <br />
            <footer>v{version}</footer>
        </List>
    </Page>
}
