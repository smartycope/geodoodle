import "../styling/MiniControlsMenu.css"

import { MdContentCopy } from "react-icons/md"
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdUndo } from "react-icons/md";
import { MdRedo } from "react-icons/md";
import { GiNuclear } from "react-icons/gi";
import { PiSelectionPlusDuotone } from "react-icons/pi";
import { PiSelectionSlashDuotone } from "react-icons/pi";
import { MdDelete } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { BiArea } from "react-icons/bi";
import { BiSolidArea } from "react-icons/bi";

// Depricated: no longer used: undo button is now a regular button
// eslint-disable-next-line no-unused-vars
export function UndoMenu({dispatch, state, align}){
    const to = document.querySelector("#" + align).getBoundingClientRect()
    return <div id='undo-menu' className="main-mobile-sub-menu" style={{top: to.bottom, left: to.left}}>
        <button onClick={() => dispatch({action: "undo"})} title="Undo" className="mobile-button">
            <MdUndo className="mobile-icon"/> Undo
        </button>
        <button onClick={() => dispatch({action: "redo"})} title="Redo" className="mobile-button">
            <MdRedo className="mobile-icon"/> Redo
        </button>
    </div>
}
export function SelectMenu({dispatch, state, align}){
    const to = document.querySelector("#" + align).getBoundingClientRect()
    return <div id='select-menu' className="main-mobile-sub-menu" style={{top: to.bottom, left: to.left}}>
        {/* <span className='selection-group' style={{width: state.bounds.length > 1 ? '100%' : 'auto'}}> */}
        <button title="Add selection bound" onClick={() => dispatch({action: 'add bound'})} id='add-bound' className="mobile-button">
            <PiSelectionPlusDuotone className="mobile-icon"/> Add Bound
        </button>
        {state.bounds.length > 1 && <>
            <button title="Clear selection" onClick={() => dispatch({action: "clear bounds"})} id="clear-selection" className="mobile-button">
                <PiSelectionSlashDuotone className="mobile-icon"/> Remove<br/> Selection
            </button>
            <span className="checkbox" id='partial-picker'>
                <label htmlFor="partial-picker" title="Include lines that only have one end in the selected area">
                    Partials:
                </label>
                <input
                    type="checkbox"
                    name="partial-picker"
                    onChange={() => dispatch({action: "toggle partials"})}
                    checked={state.partials}
                    title="Include lines that only have one end in the selected area"
                ></input>
            </span>
        </>}
        {/* </span> */}
    </div>
}
// eslint-disable-next-line no-unused-vars
export function ClipboardMenu({dispatch, state, align}){
    const to = document.querySelector("#" + align).getBoundingClientRect()
    return <div id='clipboard-menu' className="main-mobile-sub-menu" style={{top: to.bottom, left: to.left}}>
        <button onClick={() => dispatch({action: "copy"})} title="Copy" className="mobile-button">
            <MdContentCopy className="mobile-icon"/> Copy
        </button>
        <button onClick={() => dispatch({action: "cut"})} title="Cut" className="mobile-button">
            <MdOutlineContentCut className="mobile-icon"/> Cut
        </button>
        <button onClick={() => dispatch({action: "paste"})} title="Paste" className="mobile-button">
            <MdContentPaste className="mobile-icon"/> Paste
        </button>
    </div>
}
export function DeleteMenu({dispatch, state, align}){
    const to = document.querySelector("#" + align).getBoundingClientRect()
    return <div id='delete-menu' className="main-mobile-sub-menu" style={{top: to.bottom, left: to.left}}>

        <button id="delete-lines" onClick={() => dispatch({action: "delete"})} title="Delete all lines attached to a point" className="mobile-button">
            <MdDelete className="mobile-icon" /> Delete Lines
        </button>

        <button id="delete-line" onClick={() => dispatch({action: "delete line"})} title="Delete a specific line" className="mobile-button">
            <MdDeleteForever className="mobile-icon" /> Delete Line
        </button>

        {state.bounds.length > 1 && <span>
            <button
                id="delete-selected"
                onClick={() => dispatch({action: "delete selected"})}
                className="mobile-button"
            >
                <BiSolidArea className="mobile-icon" /> Delete Selected
            </button>
            <button
                id="delete-unselected"
                onClick={() => dispatch({action: "delete unselected"})}
                className="mobile-button"
            >
                <BiArea className="mobile-icon" /> Delete Unselected
            </button>
        </span>}

        <button
            onClick={() => window.confirm("Are you sure you want to delete everything?") ? dispatch({action: "clear"}) : undefined}
            title="Clear all"
            className="mobile-button"
            id='clear-all'
        >   <GiNuclear className="mobile-icon" /> Delete All
        </button>
    </div>
}
