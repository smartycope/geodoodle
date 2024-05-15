import {useState} from 'react';
import "../styling/SettingsMenu.css"
import {Checkbox, Input} from "./MenuUtils"

import { IoClose } from "react-icons/io5";


export function SettingsMenu({state, dispatch}){
    const {
        removeSelectionAfterDelete,
        invertedScroll,
        scrollSensitivity,
        hideHexColor,
        enableGestureScale,
        maxUndoAmt,
        debug,
    } = state

    return <div id='settings-menu' onAbort={() => dispatch({action: "menu", close: "settings"})}>
        <h3>Settings</h3>
        <button id='close-button' onClick={() => dispatch({action: "menu", close: "settings"})}><IoClose /></button>
        {/* removeSelectionAfterDelete */}
        <Checkbox label="Invert Scroll"
            title="Controls the scroll direction"
            onChange={(val) => dispatch({action: 'set manual', invertedScroll: !invertedScroll})}
            checked={invertedScroll}
        />
        <Input label="Scroll Sensitivity"
            type="number"
            title="Controls how fast scroll translates"
            onChange={(e) => dispatch({action: 'set manual', scrollSensitivity: e.target.value})}
            value={-scrollSensitivity}
            inputProps={{step: .1}}
        />
        <Checkbox label="Scale with 2 Finger Spread"
            title="Controls whether the 2 finger spread gesture scales the page or not"
            onChange={(val) => dispatch({action: 'set manual', enableGestureScale: !enableGestureScale})}
            checked={enableGestureScale}
        />
        <Checkbox label="Remove Selection after Cut"
            title="Controls if the bounds get removed after the selection gets deleted, whether from cutting or by deleting"
            onChange={(val) => dispatch({action: 'set manual', removeSelectionAfterDelete: !removeSelectionAfterDelete})}
            checked={removeSelectionAfterDelete}
        />
        <h4>Advanced</h4>
        <Checkbox label="Hide Hex Color"
            title="Controls if the hex color is displayed in the color menu"
            onChange={(val) => dispatch({action: 'set manual', hideHexColor: !hideHexColor})}
            checked={hideHexColor}
        />
        <Input label="Max Undo Amount"
            type="number"
            title="Controls how many consecutive undos you can do at once"
            onChange={(e) => dispatch({action: 'set manual', maxUndoAmt: e.target.value})}
            value={maxUndoAmt}
            inputProps={{min: 2}}
        />
        <Checkbox label="Debug Mode"
            title="Adds some visual aids useful for debugging"
            onChange={(val) => dispatch({action: 'set manual', debug: !debug})}
            checked={debug}
        />
    </div>
}
