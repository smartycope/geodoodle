import {useContext, useRef, useState} from 'react';
import "../styling/SettingsMenu.css"
import {Checkbox, Number} from "./MenuUtils"
import { KeyMenu } from './KeyMenu';

import { IoClose } from "react-icons/io5";
import {localStorageSettingsName} from '../globals';

import { ColorPicker, ColorService } from "react-color-palette";
// This works, but not in the tests for whatever reason
// import "react-color-palette/css";
import "react-color-palette/dist/css/rcp.css";
import {extraButtons} from "../options";
import {StateContext} from '../Contexts';

export function SettingsMenu(){
    const [state, dispatch] = useContext(StateContext)
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
    } = state

    return <>
        <div id='settings-menu'> {/*onAbort={() => dispatch({action: "menu", close: "settings"})}>*/}
            <h3>Settings</h3>
            <button id='close-button' onClick={() => dispatch({action: "menu", close: "settings"})}><IoClose /></button>
            {/* removeSelectionAfterDelete */}
            <Checkbox label="Invert Scroll"
                title="Controls the scroll direction"
                onChange={() => dispatch({invertedScroll: !invertedScroll})}
                checked={invertedScroll}
            />
            <Number label="Scroll Sensitivity"
                title="Controls how fast scroll translates"
                onChange={val => dispatch({scrollSensitivity: val})}
                value={scrollSensitivity}
                step={.1}
            />
            <Number label="2 Finger Move Sensitivity"
                // title="Controls how 2 finger scroll translates"
                onChange={val => dispatch({gestureTranslateSensitivity: val})}
                value={gestureTranslateSensitivity}
                step={.1}
            />
            <Number label="2 Finger Scale Sensitivity"
                // title="Controls how fast scroll translates"
                onChange={val => dispatch({gestureScaleSensitivity: val})}
                value={gestureScaleSensitivity}
                step={.1}
            />
            <Checkbox label="Smooth Scale Gesture"
                title="Can help smooth out 2 finger gestures"
                onChange={() => dispatch({smoothGestureScale: !smoothGestureScale})}
                checked={smoothGestureScale}
            />
            <Checkbox label="Scale with 2 Finger Spread"
                title="Controls whether the 2 finger spread gesture scales the page or not"
                onChange={() => dispatch({enableGestureScale: !enableGestureScale})}
                checked={enableGestureScale}
            />
            <Checkbox label="Remove Selection after Cut"
                title="Controls if the bounds get removed after the selection gets deleted, whether from cutting or by deleting"
                onChange={() => dispatch({removeSelectionAfterDelete: !removeSelectionAfterDelete})}
                checked={removeSelectionAfterDelete}
            />

            Extra Button: <select required onChange={e => dispatch({extraButton: e.target.value })} value={extraButton}>
                {extraButtons.map(i => <option value={i} key={i}>{i}</option>)}
            </select>
            <br/>

            Menu Side: <select required onChange={e => dispatch({side: e.target.value})} value={side}>
                {['top', 'left', 'right', 'bottom'].map(i => <option value={i} key={i}>{i}</option>)}
            </select>
            {/* The color picker */}
            <div ref={colorMenu}>
                {palletteVisible && <ColorPicker color={ColorService.convert('hex', state.paperColor)} onChange={(clr) => {
                    dispatch({paperColor: clr.hex});
                }} hideInput={['hsv', state.hideHexColor ? 'hex' : '']}/>}
            </div>
            <div ref={colorMenu}>
                <button id='color-picker-button'
                    onClick={() => setPalletteVisible(!palletteVisible)}
                    style={{backgroundColor: state.paperColor, color: 'black'}}
                >
                    {palletteVisible ? "Set" : "Pick Background Color"}
                </button>
            </div>
            <button onClick={() => dispatch({hideDots: !state.hideDots})}>{hideDots ? "Show" : "Hide"} dots</button>

            <h4>Advanced</h4>
            <Checkbox label="Hide Hex Color"
                title="Controls if the hex color is displayed in the color menu"
                onChange={() => dispatch({hideHexColor: !hideHexColor})}
                checked={hideHexColor}
            />
            <Number label="Max Undo Amount"
                title="Controls how many consecutive undos you can do at once"
                onChange={val => dispatch({maxUndoAmt: val})}
                value={maxUndoAmt}
                min={2}
            />
            <Checkbox label="Debug Mode"
                title="Adds some visual aids useful for debugging"
                onChange={() => dispatch({debug: !debug})}
                checked={debug}
            />
            <button onClick={() => {
                if (window.confirm("Reset all settings to default? This will clear the current pattern.")){
                    localStorage.removeItem(localStorageSettingsName)
                    window.location.reload()
                }}} title="Clears the settings cache">
                Reset to Defaults
            </button>

            {!state.mobile && <button
                className='footer'
                onClick={() => dispatch({action: 'menu', open: 'key', close: 'settings'})}
            >
                Keyboard Shortcuts
            </button>}
        </div>
        {state.openMenus.key && <KeyMenu />}
    </>
}
