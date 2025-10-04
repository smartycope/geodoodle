import "../styling/ExtraMenu.css"
import { FaSave } from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { RiNavigationFill } from "react-icons/ri";
import {StateContext} from "../Contexts";
import {useContext} from "react";
import {useAlignWithElement} from "./MenuHooks";
import ExtraButton from "./ExtraButton";
import {extraSlots as _extraSlots} from "../utils";
import { useTheme } from "@mui/material/styles";
import MiniMenu from "./MiniMenu";
import { Grid } from "@mui/material";
import ToolButton from "./ToolButton";

function ExtraMenu({align}){
    const {state, dispatch} = useContext(StateContext)
    const theme = useTheme()

    let alignStyle = useAlignWithElement(align)
    const extraSlots = _extraSlots(state)

    let style = alignStyle

    if (['left', 'right'].includes(state.side) && extraSlots < 3)
        style = {...alignStyle,
            transform: 'translateY(-50%)'
        }

    // Because the repeat menu is on the sides, if the repeat menu is open, make sure we're not on the side so we can close it again
    // I'm not entirely sure why it's 25%, but it works
    if (state.openMenus.repeat && state.mobile && ['left', 'right'].includes(state.side))
        style = {...alignStyle,
            transform: 'translateY(25%)',
            left: 0,
        }

    return <div id='extra-menu' style={style}>
        {extraSlots < 2 && <button onClick={() => {dispatch({action: "menu", toggle: "navigation", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <RiNavigationFill className="main-menu-icon extra-icon"/> Navigation
        </button>}
        {extraSlots < 1 && <button onClick={() => {dispatch({action: "menu", toggle: "repeat", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <MdDashboard className="main-menu-icon extra-icon"/> Repeat
        </button>}
        {extraSlots < 4 && <button onClick={() => {dispatch({action: "menu", toggle: "file", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <FaSave className="main-menu-icon extra-icon"/> File
        </button>}
        {extraSlots < 5 && <button onClick={() => {dispatch({action: "menu", toggle: "settings", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <IoMdSettings className="main-menu-icon extra-icon"/> Settings
        </button>}
        {extraSlots < 6 && <button onClick={() => {dispatch({action: "menu", toggle: "help", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <MdHelp className="main-menu-icon extra-icon"/> Help
        </button>}
        {extraSlots < 3 && <ExtraButton/>}
    </div>
}

function ExtraMenuMui(){
    const {state, dispatch} = useContext(StateContext)
    const theme = useTheme()

    const extraSlots = Math.max(_extraSlots(state), 0)

    // TODO: I want these 2 be in 2 columns, instead of 1 row
    const gridProps = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        size: "auto",
        // size: 6,
    }

    return <MiniMenu menu="extra">
        <Grid container spacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            {extraSlots < 2 && <Grid {...gridProps}><ToolButton inExtraMenu menu="navigation"/></Grid>}
            {extraSlots < 1 && <Grid {...gridProps}><ToolButton inExtraMenu menu="repeat"/></Grid>}
            {extraSlots < 4 && <Grid {...gridProps}><ToolButton inExtraMenu menu="file"/></Grid>}
            {extraSlots < 5 && <Grid {...gridProps}><ToolButton inExtraMenu menu="settings"/></Grid>}
            {extraSlots < 6 && <Grid {...gridProps}><ToolButton inExtraMenu menu="help"/></Grid>}
            {extraSlots < 3 && <Grid {...gridProps}><ExtraButton/></Grid>}
        </Grid>
    </MiniMenu>
}

export default ExtraMenuMui
