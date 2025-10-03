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
import MiniMenu from "./MiniMenu";
import {MenuItem, ListItemIcon, Typography} from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DeselectIcon from '@mui/icons-material/Deselect';

function SelectMenu({align}){
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
    </div>
}

function SelectMenuMui(){
    const {dispatch, state} = useContext(StateContext)
    return <MiniMenu menu="select">
        {/* If we're on desktop, we can't both click the button, and move the cursor to where we
            want to add the bound */}
        {state.mobile && <MenuItem onClick={() => dispatch("add_bound")}>
            <ListItemIcon>
                <PiSelectionPlusDuotone/>
            </ListItemIcon>
            Add Bound
        </MenuItem>}
        {!state.mobile && state.bounds.length < 2 && <Typography>
            Press B to add a bound
        </Typography>}
        {state.bounds.length > 1 && <>
            <MenuItem onClick={() => dispatch("clear_bounds")}>
                <ListItemIcon>
                    <DeselectIcon/>
                </ListItemIcon>
                Remove<br/> Selection
            </MenuItem>
            <MenuItem onClick={() => dispatch("toggle_partials")}>
                <ListItemIcon>
                    {state.partials ? <CheckBoxIcon/> : <CheckBoxOutlineBlankIcon/>}
                </ListItemIcon>
                Partials
            </MenuItem>
            {/* <span className="checkbox" id='partial-picker'>
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
            </span> */}
        </>}
    </MiniMenu>
}

export default SelectMenuMui
