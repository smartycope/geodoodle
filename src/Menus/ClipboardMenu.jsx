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
import {Button, MenuItem, ListItemIcon} from "@mui/material";
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';

function ClipboardMenu({align}){
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

function ClipboardMenuMui(){
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

export default ClipboardMenuMui