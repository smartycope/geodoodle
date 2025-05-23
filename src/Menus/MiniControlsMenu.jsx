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
import {useContext} from "react";
import {StateContext} from "../Contexts";
import {useAlignWithElement} from "./MenuHooks";

// Depricated: no longer used: undo button is now a regular button
// eslint-disable-next-line no-unused-vars
export function UndoMenu({align}){
    const {dispatch} = useContext(StateContext)
    const style = useAlignWithElement(align)

    return <div id='undo-menu' className="main-mobile-sub-menu" style={style}>
        <button onClick={() => dispatch('undo')} title="Undo" className="mobile-button">
            <MdUndo className="mobile-icon"/> Undo
        </button>
        <button onClick={() => dispatch('redo')} title="Redo" className="mobile-button">
            <MdRedo className="mobile-icon"/> Redo
        </button>
    </div>
}
export function SelectMenu({align}){
    const {state, dispatch} = useContext(StateContext)
    const style = useAlignWithElement(align)

    return <div id='select-menu' className="main-mobile-sub-menu" style={style}>
        {/* <span className='selection-group' style={{width: state.bounds.length > 1 ? '100%' : 'auto'}}> */}
        <button title="Add selection bound" onClick={() => dispatch("add_bound")} id='add-bound' className="mobile-button">
            <PiSelectionPlusDuotone className="mobile-icon"/> Add Bound
        </button>
        {state.bounds.length > 1 && <>
            <button title="Clear selection" onClick={() => dispatch("clear_bounds")} id="clear-selection" className="mobile-button">
                <PiSelectionSlashDuotone className="mobile-icon"/> Remove<br/> Selection
            </button>
            <span className="checkbox" id='partial-picker'>
                <label htmlFor="partial-picker" title="Include lines that only have one end in the selected area">
                    Partials:
                </label>
                <input
                    type="checkbox"
                    name="partial-picker"
                    onChange={() => dispatch("toggle_partials")}
                    checked={state.partials}
                    title="Include lines that only have one end in the selected area"
                ></input>
            </span>
        </>}
        {/* </span> */}
    </div>
}
// eslint-disable-next-line no-unused-vars
export function ClipboardMenu({align}){
    const {dispatch} = useContext(StateContext)
    const style = useAlignWithElement(align)

    return <div id='clipboard-menu' className="main-mobile-sub-menu" style={style}>
        <button onClick={() => dispatch("copy")} title="Copy" className="mobile-button">
            <MdContentCopy className="mobile-icon"/> Copy
        </button>
        <button onClick={() => dispatch("cut")} title="Cut" className="mobile-button">
            <MdOutlineContentCut className="mobile-icon"/> Cut
        </button>
        <button onClick={() => dispatch("paste")} title="Paste" className="mobile-button">
            <MdContentPaste className="mobile-icon"/> Paste
        </button>
    </div>
}
export function DeleteMenu({align}){
    const {state, dispatch} = useContext(StateContext)
    const style = useAlignWithElement(align)

    return <div id='delete-menu' className="main-mobile-sub-menu" style={style}>

        <button id="delete-lines" onClick={() => dispatch("delete_at_cursor")} title="Delete all lines attached to a point" className="mobile-button">
            <MdDelete className="mobile-icon" /> Delete Lines
        </button>

        <button id="delete-line" onClick={() => dispatch("delete_line")} title="Delete a specific line" className="mobile-button">
            <MdDeleteForever className="mobile-icon" /> Delete Line
        </button>

        {state.bounds.length > 1 && <span>
            <button
                id="delete-selected"
                onClick={() => dispatch("delete_selected")}
                className="mobile-button"
            >
                <BiSolidArea className="mobile-icon" /> Delete Selected
            </button>
            <button
                id="delete-unselected"
                onClick={() => dispatch("delete_unselected")}
                className="mobile-button"
            >
                <BiArea className="mobile-icon" /> Delete Unselected
            </button>
        </span>}

        <button
            onClick={() => window.confirm("Are you sure you want to delete everything?") ? dispatch("clear") : undefined}
            title="Clear all"
            className="mobile-button"
            id='clear-all'
        >   <GiNuclear className="mobile-icon" /> Delete All
        </button>
    </div>
}
