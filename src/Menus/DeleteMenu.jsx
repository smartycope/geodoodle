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
import { ListItemIcon, MenuItem } from "@mui/material";
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import CancelPresentationTwoToneIcon from '@mui/icons-material/CancelPresentationTwoTone';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import DeselectIcon from '@mui/icons-material/Deselect';

function DeleteMenu({align}){
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

function DeleteMenuMui(){
    const {dispatch, state} = useContext(StateContext)

    return <MiniMenu menu="delete">
        {/* We can't click the button and move the cursor to the current position on desktop */}
        {state.mobile && <>
            <MenuItem onClick={() => dispatch("delete_at_cursor")}>
                <ListItemIcon>
                    <MdDelete/>
                </ListItemIcon>
                Delete Lines
            </MenuItem>
            <MenuItem onClick={() => dispatch("delete_line")}>
                <ListItemIcon>
                    <MdDeleteForever/>
                </ListItemIcon>
                Delete Line
            </MenuItem>
            </>
        }
        {state.bounds.length > 1 && <span>
            <MenuItem onClick={() => dispatch("delete_selected")}>
                {/* <BiSolidArea/> */}
                <CancelPresentationTwoToneIcon sx={{mr: 1}}/>
                {/* <DeselectIcon/> */}
                Delete Selected
            </MenuItem>
            <MenuItem onClick={() => dispatch("delete_unselected")}>
                {/* <BiArea/> */}
                <CancelPresentationIcon sx={{mr: 1}}/>
                {/* <SelectAllIcon/> */}
                Delete Unselected
            </MenuItem>
        </span>}
        <MenuItem onClick={() => window.confirm("Are you sure you want to delete everything?") ? dispatch("clear") : undefined}>
            <ListItemIcon>
                <GiNuclear/>
            </ListItemIcon>
            Delete All
        </MenuItem>
    </MiniMenu>
}

export default DeleteMenuMui