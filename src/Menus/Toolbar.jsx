import "../styling/MainMenu.css"
import ControlsMenu from "./ControlsMenu";
import {HelpMenu} from "./HelpMenu"
import ColorMenu from "./ColorMenu";
import {FileMenu} from "./FileMenu";
import {SettingsMenu} from "./SettingsMenu";
import NavMenu from "./NavMenu";
import RepeatMenu from "./RepeatMenu";
import MirrorMenu from "./MirrorMenu";
import ExtraMenu from "./ExtraMenu";

import { MdContentCopy } from "react-icons/md"
import { MdUndo } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";
import { FaSliders } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { FaBars } from "react-icons/fa6";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { RiNavigationFill } from "react-icons/ri";
import { GoMirror } from "react-icons/go";
import { BsGrid3X3GapFill } from "react-icons/bs";
import { MdOutlineTabUnselected } from "react-icons/md";
import {ClipboardMenu, DeleteMenu, SelectMenu} from "./MiniControlsMenu";
import React, {useContext, useState} from "react";
import {StateContext} from "../Contexts";
import {ExtraButton} from "./MenuUtils";
import {extraSlots as _extraSlots} from "../utils";

import { styled, useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { AppBar, Box, Fab, IconButton, Paper as MuiPaper } from "@mui/material";
import { lighten, alpha, darken } from '@mui/material/styles';

var tapHolding = false
var touchHoldTimer = null
var redid = false

const toolButtonStyle = (theme) => ({
    border: 'none',
    cursor: 'pointer',
    pointerEvents: 'all',
    textAlign: 'center',
    navIndex: -1,
    scale: 1.5,
    opacity: 90,
    outlineStyle: 'none',
    boxShadow: 'none',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    color: theme.palette.primary.dark,
})

function ToolButton({toggleMenu, icon, ...props}){
    const theme = useTheme()
    const {state, dispatch} = useContext(StateContext)

    return <IconButton
        sx={toolButtonStyle(theme)}
        className="menu-toggle-button-mobile"
        onClick={() => {dispatch({action: "menu", toggle: toggleMenu})}}
        {...props}
    >
        {icon}
    </IconButton>
}

export default function Toolbar(){
    const {state, dispatch} = useContext(StateContext)
    const {side} = state
    const [, doReload] = useState()
    const theme = useTheme()

    function undoOnTouchHold(){
        if (tapHolding){
            redid = true
            dispatch('redo')
            tapHolding = false
        }
    }

    function undoOnTouchStart(){
        setTimeout(() => tapHolding = true, 10)
        touchHoldTimer = setTimeout(undoOnTouchHold, state.holdTapTimeMS)
    }

    function undoOnTouchEnd(){
        clearTimeout(touchHoldTimer)
        tapHolding = false
        if (!redid){
            dispatch('undo')
        }
        redid = false
    }

    // Reload this component when the window resizes, so extraSlots updates
    window.addEventListener('resize', doReload)

    let style = {}
    switch (side) {
        case 'right': style = {right: '0px'}
        case 'left':
            style = {...style,
                flexDirection: 'column-reverse',
                height: '93%',
            }
            break
        case 'bottom': style = {bottom: "0px",}
        case 'top':
            style = {...style,
                flexDirection: 'row',
                width: '93%',
            }
    }

    const extraSlots = _extraSlots(state)

    // Because the repeat menu is on the sides, if the repeat menu is open, make sure we're not on the side so we can close it again
    if (state.openMenus.repeat && state.mobile && ['left', 'right'].includes(side))
        style = {
            flexDirection: 'row',
            width: '93%',
        }

    // Returns the Toolbar, as well as all the menus
    const toolbar = <React.Fragment key="toolbar">
        <MuiPaper id='menu-selector-mobile' elevation={4} sx={{
            padding: '1%',
            margin: '1%',
            position: 'absolute',
            borderRadius: 4,
            backgroundColor: theme.darken(theme.palette.primary.main, 0.05),
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            ...style,
        }}>
            <Box
                // visibility={state.openMenus.main ? 'visible': "hidden"}
                // pointerEvents={state.openMenus.main ? 'all' : 'none'}
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    ...style,
                }}
            >
                {extraSlots < 5 && <ToolButton toggleMenu="extra" icon={<BsGrid3X3GapFill/>}/>}
                {extraSlots >= 3 && <ExtraButton mainMenu={true}/>}
                {extraSlots >= 5 && <ToolButton toggleMenu="help" icon={<MdHelp/>}/>}
                {extraSlots >= 5 && <ToolButton toggleMenu="settings" icon={<IoMdSettings/>}/>}
                {extraSlots >= 4 && <ToolButton toggleMenu="file" icon={<FaSave/>}/>}
                {extraSlots >= 2 && <ToolButton toggleMenu="navigation" icon={<RiNavigationFill/>}/>}
                {extraSlots >= 1 && <ToolButton toggleMenu="repeat" icon={<MdDashboard/>}/>}
                <ToolButton toggleMenu="color" icon={<MdColorLens/>}/>
                {/* Undo button */}
                <IconButton onTouchStart={undoOnTouchStart}
                    onTouchEnd={undoOnTouchEnd}
                    // So it works in desktop mode as well
                    onClick={() => dispatch({action: "undo"})}
                    id="undo-button"
                    className="menu-toggle-button-mobile"
                    sx={toolButtonStyle}
                >
                    <MdUndo/>
                </IconButton>
                <ToolButton toggleMenu="mirror" icon={<GoMirror/>}/>
                <ToolButton toggleMenu="select" icon={<MdOutlineTabUnselected/>}/>
                <ToolButton toggleMenu="clipboard" icon={<MdContentCopy/>}/>
                <ToolButton toggleMenu="delete" icon={<MdDelete/>}/>
            </Box>

            {/* The menu button in the corner */}
            <ToolButton toggleMenu="main" icon={<FaBars/>}/>
        </MuiPaper>
    </React.Fragment>

    const menus = <React.Fragment key="menus">
        {state.openMenus.select    && <SelectMenu    align="select-menu-button"/>}
        {state.openMenus.clipboard && <ClipboardMenu align="clipboard-menu-button"/>}
        {state.openMenus.delete    && <DeleteMenu    align="delete-menu-button"/>}
        {state.openMenus.mirror    && <MirrorMenu    align="mirror-menu-button"/>}
        {state.openMenus.color     && <ColorMenu     align="color-menu-button"/>}
        {state.openMenus.extra     && <ExtraMenu     align="extra-menu-button"/>}
        {state.openMenus.repeat    && <RepeatMenu    align="repeat-menu-button"/>}
        {state.openMenus.file      && <FileMenu      align="file-menu-button"/>}
        {state.openMenus.settings  && <SettingsMenu  align="settings-menu-button"/>}
        {state.openMenus.help      && <HelpMenu      align="help-menu-button"/>}
        {/* The menus */}
        {state.openMenus.navigation && <NavMenu/>}
        {state.openMenus.repeat     && <RepeatMenu/>}
        {state.openMenus.file       && <FileMenu/>}
        {state.openMenus.settings   && <SettingsMenu/>}
        {state.openMenus.help       && <HelpMenu/>}
    </React.Fragment>

    const fab = <Fab
        sx={{
            color: theme.palette.primary.dark,
            backgroundColor: theme.palette.primary.main,
            position: 'absolute',
            top: '20px',
            right: '20px',
            ":hover": {
                // TODO: I don't love this, it should be the same as the hover of the ToolButtons
                backgroundColor: theme.palette.primary.light,
            },

        }}
        onClick={() => dispatch({action: "menu", toggle: "main"})}
        key="menu-button"
    >
        <FaBars style={{transform: 'scale(2)'}}/>
    </Fab>

    return <>
        {state.openMenus.main ? toolbar : fab}
        {menus}
    </>
}

