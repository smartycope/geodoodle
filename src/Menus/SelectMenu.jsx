import "../styling/MiniControlsMenu.css"

import { PiSelectionPlusDuotone } from "react-icons/pi";
import {useContext} from "react";
import {StateContext} from "../Contexts";
import MiniMenu from "./MiniMenu";
import {MenuItem, ListItemIcon, Typography} from "@mui/material";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DeselectIcon from '@mui/icons-material/Deselect';

export default function(){
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
        </>}
    </MiniMenu>
}

