import "../styling/MainMenu.css"
import ControlsMenu from "./ControlsMenu";
import HelpMenu from "./HelpMenu"
import ColorMenu from "./ColorMenu";
import {FileMenu} from "./FileMenu";
import SettingsMenu from "./SettingsMenu";
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
import ClipboardMenu from "./ClipboardMenu";
import DeleteMenu from "./DeleteMenu";
import SelectMenu from "./SelectMenu";
import React, {useContext, useRef, useState} from "react";
import {StateContext} from "../Contexts";
import {ExtraButton} from "./MenuUtils";
import {extraSlots as _extraSlots} from "../utils";

import { styled, useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { AppBar, Box, Fab, IconButton, Paper as MuiPaper } from "@mui/material";
import { lighten, alpha, darken } from '@mui/material/styles';
import ToolButton, {toolButtonStyle} from "./ToolButton";

// import * as React from 'react';
// import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
// import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
// import SaveIcon from '@mui/icons-material/Save';
// import PrintIcon from '@mui/icons-material/Print';
// import ShareIcon from '@mui/icons-material/Share';


var tapHolding = false
var touchHoldTimer = null
var redid = false


function Toolbar(){
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

    function getAlignmentCoords(ref){
        const rect = ref.current.getBoundingClientRect()
        switch (side) {
            case 'right': return {right: rect.right, top: rect.top}
            case 'left': return {left: rect.left, top: rect.top}
            case 'bottom': return {bottom: rect.bottom, left: rect.left}
            case 'top': return {top: rect.top, left: rect.left}
        }
    }

    // Reload this component when the window resizes, so extraSlots updates
    window.addEventListener('resize', doReload)

    let style = {}
    switch (side) {
        case 'right': style = {right: '0px'}
        case 'left':
            style = {...style,
                flexDirection: 'column-reverse',
                height: '97%',
            }
            break
        case 'bottom': style = {bottom: "0px",}
        case 'top':
            style = {...style,
                flexDirection: 'row',
                width: '97%',
            }
    }

    const extraSlots = _extraSlots(state)

    // Because the repeat menu is on the sides, if the repeat menu is open, make sure we're not on the side so we can close it again
    const horizontal = ['left', 'right'].includes(side)
    const vertical = !horizontal //['top', 'bottom'].includes(side)
    if (state.openMenus.repeat && state.mobile && horizontal)
        style = {
            flexDirection: 'row',
            width: '97%',
        }

    // Returns the Toolbar, as well as all the menus
    const toolbar = <>
        <MuiPaper id='menu-selector-mobile' elevation={4} sx={{
            padding: 1,
            margin: 1,
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
                    // marginRight: horizontal ? 2 : undefined,
                    // marginTop: vertical ? 2 : undefined,
                    // marginBottom: vertical ? 2 : undefined,
                    ...style,
                }}
            >
                {extraSlots < 5 && <ToolButton toggleMenu="extra" icon={<BsGrid3X3GapFill/>} id="extra-tool-button"/>}
                {/* This is the button which is dynamically set in settings */}
                {/* TODO: not yet reviewed for Mui compatibility */}
                {extraSlots >= 3 && <ExtraButton mainMenu={true}/>}
                {extraSlots >= 5 && <ToolButton toggleMenu="help" icon={<MdHelp/>} id="help-tool-button"/>}
                {extraSlots >= 5 && <ToolButton toggleMenu="settings" icon={<IoMdSettings/>} id="settings-tool-button"/>}
                {extraSlots >= 4 && <ToolButton toggleMenu="file" icon={<FaSave/>} id="file-tool-button"/>}
                {extraSlots >= 2 && <ToolButton toggleMenu="navigation" icon={<RiNavigationFill/>} id="navigation-tool-button"/>}
                {extraSlots >= 1 && <ToolButton toggleMenu="repeat" icon={<MdDashboard/>} id="repeat-tool-button"/>}
                <ToolButton toggleMenu="color" icon={<MdColorLens/>} id="color-tool-button"/>
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
                <ToolButton toggleMenu="mirror" icon={<GoMirror/>} id="mirror-tool-button"/>
                <ToolButton toggleMenu="select" icon={<MdOutlineTabUnselected/>} id="select-tool-button"/>
                <ToolButton toggleMenu="clipboard" icon={<MdContentCopy/>} id="clipboard-tool-button"/>
                <ToolButton toggleMenu="delete" icon={<MdDelete/>} id="delete-tool-button"/>
            </Box>

            {/* The menu button in the corner */}
            <ToolButton toggleMenu="main" icon={<FaBars/>} sx={{
                marginLeft: side == horizontal ? 2 : undefined,
                // marginRight: side == 'bottom' ? 2 : undefined,
                marginBottom: side == vertical ? 2 : undefined,
                // marginTop: side == 'right' ? 2 : undefined,
            }}/>
        </MuiPaper>
    </>

    const menus = <React.Fragment key="menus">
        {/* Menus */}
        {state.openMenus.select    && <SelectMenu    menu="select"/>}
        {state.openMenus.clipboard && <ClipboardMenu menu="clipboard"/>}
        {state.openMenus.delete    && <DeleteMenu    menu="delete"/>}
        {state.openMenus.mirror    && <MirrorMenu    menu="mirror"/>}
        {state.openMenus.color     && <ColorMenu     menu="color"/>}
        {state.openMenus.extra     && <ExtraMenu     menu="extra"/>}
        {state.openMenus.repeat    && <RepeatMenu    menu="repeat"/>}
        {state.openMenus.file      && <FileMenu      menu="file"/>}
        {state.openMenus.settings  && <SettingsMenu  menu="settings"/>}
        {state.openMenus.help      && <HelpMenu      menu="help"/>}
        {/* Pages */}
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




const StyledSpeedDial = styled(SpeedDial)(({ theme }) => ({
    position: 'absolute',
    '&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft': {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
    '&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight': {
      top: theme.spacing(2),
      left: theme.spacing(2),
    },
  }));

const speedDialButtonStyle = (theme) => ({
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

function SpeedDialButton({toggleMenu, icon, ...props}){
    const theme = useTheme()
    const {state, dispatch} = useContext(StateContext)

    return <SpeedDialAction
        icon={icon}
        // slotProps={{
        //     tooltip: {
        //         title: toggleMenu,
        //     },
        // }}
        onClick={() => {dispatch({action: "menu", toggle: toggleMenu})}}
        {...props}
    />
}

// Unfinished, good start though
function SpeedDialToolbar(){
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

    function getAlignmentCoords(ref){
        const rect = ref.current.getBoundingClientRect()
        switch (side) {
            case 'right': return {right: rect.right, top: rect.top}
            case 'left': return {left: rect.left, top: rect.top}
            case 'bottom': return {bottom: rect.bottom, left: rect.left}
            case 'top': return {top: rect.top, left: rect.left}
        }
    }

    // Reload this component when the window resizes, so extraSlots updates
    window.addEventListener('resize', doReload)

    const extraSlots = _extraSlots(state)

    // Because the repeat menu is on the sides, if the repeat menu is open, make sure we're not on the side so we can close it again
    if (state.openMenus.repeat && state.mobile && ['left', 'right'].includes(side))
        style = {
            flexDirection: 'row',
            width: '93%',
        }

    const menus = <React.Fragment key="menus">
        {/* Menus */}
        {state.openMenus.select    && <SelectMenu    align={getAlignmentCoords(selectButton)}/>}
        {state.openMenus.clipboard && <ClipboardMenu align={getAlignmentCoords(clipboardButton)}/>}
        {state.openMenus.delete    && <DeleteMenu    align={getAlignmentCoords(deleteButton)}/>}
        {state.openMenus.mirror    && <MirrorMenu    align={getAlignmentCoords(mirrorButton)}/>}
        {state.openMenus.color     && <ColorMenu     align={getAlignmentCoords(colorButton)}/>}
        {state.openMenus.extra     && <ExtraMenu     align={getAlignmentCoords(extraButton)}/>}
        {state.openMenus.repeat    && <RepeatMenu    align={getAlignmentCoords(repeatButton)}/>}
        {state.openMenus.file      && <FileMenu      align={getAlignmentCoords(fileButton)}/>}
        {state.openMenus.settings  && <SettingsMenu  align={getAlignmentCoords(settingsButton)}/>}
        {state.openMenus.help      && <HelpMenu      align={getAlignmentCoords(helpButton)}/>}
        {/* Pages */}
        {state.openMenus.navigation && <NavMenu/>}
        {state.openMenus.repeat     && <RepeatMenu/>}
        {state.openMenus.file       && <FileMenu/>}
        {state.openMenus.settings   && <SettingsMenu/>}
        {state.openMenus.help       && <HelpMenu/>}
    </React.Fragment>
    console.log(state.openMenus.main)
    return <>
        {/* <Box sx={{
            // height: '100%',
            // transform: 'translateZ(0px)',
            flexGrow: 1,
            // flex: '1 1 auto',
            position: 'absolute',
            bottom: 0,
            right: 0,
        }}> */}
            <SpeedDial
                ariaLabel="Toolbar"
                sx={{
                    flexGrow: 1,
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    // flexDirection: 'column',
                    // height: '93%',
                }}
                icon={<SpeedDialIcon />}
                onClose={() => dispatch({action: "menu", close: "main"})}
                onOpen={() => dispatch({action: "menu", open: "main"})}
                open={state.openMenus.main}
                // open={false}
                direction='up'
            >
                {extraSlots < 5 && <ToolButton toggleMenu="extra" icon={<BsGrid3X3GapFill/>}/>}
                {/* This is the button which is dynamically set in settings */}
                {/* TODO: not yet reviewed for Mui compatibility */}
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
            </SpeedDial>
        {/* </Box> */}
        {menus}
    </>
}

export default Toolbar;