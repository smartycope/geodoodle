import "../styling/MiniControlsMenu.css"
import {useContext} from "react";
import {StateContext} from "../Contexts";
import MiniMenu from "./MiniMenu";
import {MenuItem, ListItemIcon} from "@mui/material";
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';


function ClipboardMenu(){
    const {dispatch} = useContext(StateContext)
    return <MiniMenu menu="clipboard">
        <MenuItem onClick={() => dispatch("copy")}>
            <ListItemIcon>
                <ContentCopyIcon/>
            </ListItemIcon>
            Copy
        </MenuItem>
        <MenuItem onClick={() => dispatch("cut")}>
            <ListItemIcon>
                <ContentCutIcon/>
            </ListItemIcon>
            Cut
        </MenuItem>
        <MenuItem onClick={() => dispatch("paste")}>
            <ListItemIcon>
                <ContentPasteIcon/>
            </ListItemIcon>
            Paste
        </MenuItem>
    </MiniMenu>
}

export default ClipboardMenu