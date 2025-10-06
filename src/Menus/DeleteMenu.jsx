import { GiNuclear } from "react-icons/gi";
import { MdDelete } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import {useContext} from "react";
import {StateContext} from "../Contexts";
import MiniMenu from "./MiniMenu";
import { ListItemIcon, MenuItem } from "@mui/material";
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import CancelPresentationTwoToneIcon from '@mui/icons-material/CancelPresentationTwoTone';

import SelectAllIcon from '@mui/icons-material/SelectAll';
import { BiArea } from "react-icons/bi";
import DeselectIcon from '@mui/icons-material/Deselect';
import { BiSolidArea } from "react-icons/bi";

function DeleteMenu(){
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

export default DeleteMenu