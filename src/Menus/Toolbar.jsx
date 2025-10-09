import "../styling/MainMenu.css"
import HelpPage from "./HelpPage"
import ColorMenu from "./ColorMenu";
import FilePage from "./FilePage";
import SettingsPage from "./SettingsPage";
import NavMenu from "./NavMenu";
import RepeatMenu from "./RepeatMenu";
import MirrorMenu from "./MirrorMenu";
import ExtraMenu from "./ExtraMenu";

import { MdContentCopy } from "react-icons/md"
import { MdUndo } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";
import { MdDashboard } from "react-icons/md";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { RiNavigationFill } from "react-icons/ri";
import { GoMirror } from "react-icons/go";
import { BsGrid3X3GapFill } from "react-icons/bs";
import { MdOutlineTabUnselected } from "react-icons/md";
import ClipboardMenu from "./ClipboardMenu";
import DeleteMenu from "./DeleteMenu";
import SelectMenu from "./SelectMenu";
import { useContext, useState, useEffect } from "react";
import { StateContext } from "../Contexts";
import { extraSlots as _extraSlots } from "../utils";
import { styled, useTheme } from '@mui/material/styles';
import { Box, Fab, IconButton, Paper as MuiPaper, Tooltip } from "@mui/material";
import ToolButton, { getTooltipSide, toolButtonStyle, UndoButton } from "./ToolButton";
import ExtraButton from "./ExtraButton";
import { isMobile } from '../utils';

import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

var tapHolding = false
var touchHoldTimer = null
var redid = false

// TODO: On a sideways mobile screen, the toolbar goes off the screen
function Toolbar() {
    const { state, dispatch } = useContext(StateContext)
    const { side } = state
    const [, doReload] = useState()
    const theme = useTheme()
    const numToolButtons = 13
    const vertical = ['top', 'bottom'].includes(side)
    const horizontal = !vertical
    const extraSlots = _extraSlots(state)

    // Reload this component when the window resizes, so extraSlots updates
    useEffect(() => {
        window.addEventListener('resize', doReload)
        return () => window.removeEventListener('resize', doReload)
    }, [])

    const handleUndoClick = (e) => {
        // prevent right-click from also triggering undo
        if (e.type === "click" && e.button === 0) {
          dispatch("undo");
        }
      };

      const handleUndoContextMenu = (e) => {
        e.preventDefault(); // prevent browser context menu
        dispatch("redo");
      };

    let style = {}
    let fabPos = {} // this entirely depends on the values of the MuiPaper flexDirection below
    // This creates an empty space on the appropriate along the entire side of the screen
    switch (side) {
        case 'right':
            style = {
                right: 0,
                width: 0,
                height: '100%',
                justifyContent: 'flex-end',
                alignItems: 'center',
            };
            fabPos = { right: 0, top: 0 };
            break;
        case 'left':
            style = {
                left: 0,
                width: 0,
                height: '100%',
                justifyContent: 'flex-start',
                alignItems: 'center',
            };
            fabPos = { left: 0, top: 0 };
            break;
        case 'bottom':
            style = {
                bottom: 0,
                width: '100%',
                height: 0,
                justifyContent: 'center',
                alignItems: 'flex-end',
            };
            fabPos = { right: 0, bottom: 0 };
            break;
        case 'top':
            style = {
                top: 0,
                width: '100%',
                height: 0,
                justifyContent: 'center',
                alignItems: 'flex-start',
            };
            fabPos = { right: 0, top: 0 };
            break;
    }

    // Because the repeat menu is on the sides, if the repeat menu is open, make sure we're not on the side so we can close it again
    if (state.openMenus.repeat && state.mobile && horizontal)
        style = {
            flexDirection: 'row',
            width: '97%',
        }
    // Returns the Toolbar, as well as all the menus
    const toolbar = <Box sx={{
        display: 'flex',
        position: 'absolute',
        ...style,
    }}>
        <MuiPaper id='menu-selector-mobile' elevation={4} sx={{
            // These intentionally get overridden by the mobile breakpoint
            // px: vertical ? .5 : {xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2},
            // py: vertical ? {xs: 1, sm: 1.5, md: 2, lg: 2, xl: 2} : .5,
            // TODO: should this be state.mobile?
            px: isMobile() ? .5 : 1,
            py: isMobile() ? .5 : 1,
            // [theme.breakpoints.desktop]: {
            //     px: 2,
            //     py: 2,
            // },
            // [theme.breakpoints.mobile]: {
            //     px: .5,
            //     py: .5,
            // },
            display: 'flex',
            // TODO: I can't decide if this should be 'row' or 'row-reverse'
            flexDirection: vertical ? 'row' : 'column-reverse',
            margin: 1,
            // p: 1,
            position: 'absolute',
            // Don't allow the user to start lines between the buttons
            pointerEvents: 'all',
            width: 'min-content',
            height: 'min-content',
            cursor: 'pointer',
            borderRadius: theme.shape.borderRadius,
            // backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light,
            // backgroundColor: theme.palette.background.paper,
            '& .tool-button': {
                mx: vertical ? 1 : 0,
                my: vertical ? 0 : 1,
            },
            // backgroundColor: theme.palette.mode === 'dark' ? theme.darken(theme.palette.primary.dark, 0.1) : theme.lighten(theme.palette.primary.light, 0.1),
            // backgroundColor: theme.palette.primary.main,
        }}>
            {extraSlots < 5 && <ToolButton menu="extra" disableTooltip={state.openMenus.extra} />}
            {/* This is the button which is dynamically set in settings */}
            {/* TODO: not yet reviewed for Mui compatibility */}
            {extraSlots >= 3 && <ExtraButton />}
            {extraSlots >= 5 && <ToolButton menu="help" />}
            {extraSlots >= 5 && <ToolButton menu="settings" />}
            {extraSlots >= 4 && <ToolButton menu="file" />}
            {extraSlots >= 2 && <ToolButton menu="navigation" />}
            {extraSlots >= 1 && <ToolButton menu="repeat" />}
            <ToolButton menu="color" />
            {/* Undo button */}
            {/* <UndoButton /> */}
            <ToolButton menu="undo" onClick={handleUndoClick} onContextMenu={handleUndoContextMenu}/>
            <ToolButton menu="mirror" />
            {(state.mobile && state.bounds.length < 2) ? <ToolButton menu="add_bound" onClick={() => dispatch('add_bound')}/> : <ToolButton menu="select"/>}
            <ToolButton menu="clipboard" />
            <ToolButton menu="delete" />
            {/* The menu button in the corner */}
            <ToolButton menu="main" />
        </MuiPaper>
    </Box>

    const fab = <Fab
        sx={{
            color: theme.palette.primary.contrast,
            // backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light,
            bgcolor: theme.alpha(theme.palette.primary.contrast, 0.1),
            position: 'absolute',
            // opacity: 0.1,
            margin: 2,
            ...fabPos,
            // bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light,
            // bgcolor: theme.palette.primary.main,
            ":hover": {
                // TODO: I don't love this, it should be the same as the hover of the ToolButtons
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light,
                // backgroundColor: theme.palette.primary.main,
            },

        }}
        onClick={() => dispatch({ action: "menu", toggle: "main" })}
    >
        <MenuRoundedIcon sx={{ bgcolor: 'transparent' }}/>
    </Fab>

    return state.openMenus.main ? toolbar : fab
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

function SpeedDialButton({ toggleMenu, icon, ...props }) {
    const theme = useTheme()
    const { state, dispatch } = useContext(StateContext)

    return <SpeedDialAction
        icon={icon}
        // slotProps={{
        //     tooltip: {
        //         title: toggleMenu,
        //     },
        // }}
        onClick={() => { dispatch({ action: "menu", toggle: toggleMenu }) }}
        {...props}
    />
}

// Unfinished, good start though
function SpeedDialToolbar() {
    const { state, dispatch } = useContext(StateContext)
    const { side } = state
    const [, doReload] = useState()
    const theme = useTheme()

    function undoOnTouchHold() {
        if (tapHolding) {
            redid = true
            dispatch('redo')
            tapHolding = false
        }
    }

    function undoOnTouchStart() {
        setTimeout(() => tapHolding = true, 10)
        touchHoldTimer = setTimeout(undoOnTouchHold, state.holdTapTimeMS)
    }

    function undoOnTouchEnd() {
        clearTimeout(touchHoldTimer)
        tapHolding = false
        if (!redid) {
            dispatch('undo')
        }
        redid = false
    }

    function getAlignmentCoords(ref) {
        const rect = ref.current.getBoundingClientRect()
        switch (side) {
            case 'right': return { right: rect.right, top: rect.top }
            case 'left': return { left: rect.left, top: rect.top }
            case 'bottom': return { bottom: rect.bottom, left: rect.left }
            case 'top': return { top: rect.top, left: rect.left }
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
        {state.openMenus.select && <SelectMenu align={getAlignmentCoords(selectButton)} />}
        {state.openMenus.clipboard && <ClipboardMenu align={getAlignmentCoords(clipboardButton)} />}
        {state.openMenus.delete && <DeleteMenu align={getAlignmentCoords(deleteButton)} />}
        {state.openMenus.mirror && <MirrorMenu align={getAlignmentCoords(mirrorButton)} />}
        {state.openMenus.color && <ColorMenu align={getAlignmentCoords(colorButton)} />}
        {state.openMenus.extra && <ExtraMenu align={getAlignmentCoords(extraButton)} />}
        {state.openMenus.repeat && <RepeatMenu align={getAlignmentCoords(repeatButton)} />}
        {state.openMenus.file && <FilePage align={getAlignmentCoords(fileButton)} />}
        {state.openMenus.settings && <SettingsPage align={getAlignmentCoords(settingsButton)} />}
        {state.openMenus.help && <HelpPage align={getAlignmentCoords(helpButton)} />}
        {/* Pages */}
        {state.openMenus.navigation && <NavMenu />}
        {state.openMenus.repeat && <RepeatMenu />}
        {state.openMenus.file && <FilePage />}
        {state.openMenus.settings && <SettingsPage />}
        {state.openMenus.help && <HelpPage />}
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
            onClose={() => dispatch({ action: "menu", close: "main" })}
            onOpen={() => dispatch({ action: "menu", open: "main" })}
            open={state.openMenus.main}
            // open={false}
            direction='up'
        >
            {extraSlots < 5 && <ToolButton toggleMenu="extra" icon={<BsGrid3X3GapFill />} />}
            {/* This is the button which is dynamically set in settings */}
            {/* TODO: not yet reviewed for Mui compatibility */}
            {extraSlots >= 3 && <ExtraButton />}
            {extraSlots >= 5 && <ToolButton toggleMenu="help" icon={<MdHelp />} />}
            {extraSlots >= 5 && <ToolButton toggleMenu="settings" icon={<IoMdSettings />} />}
            {extraSlots >= 4 && <ToolButton toggleMenu="file" icon={<FaSave />} />}
            {extraSlots >= 2 && <ToolButton toggleMenu="navigation" icon={<RiNavigationFill />} />}
            {extraSlots >= 1 && <ToolButton toggleMenu="repeat" icon={<MdDashboard />} />}
            <ToolButton toggleMenu="color" icon={<MdColorLens />} />
            {/* Undo button */}
            <IconButton onTouchStart={undoOnTouchStart}
                onTouchEnd={undoOnTouchEnd}
                // So it works in desktop mode as well
                onClick={() => dispatch({ action: "undo" })}
                id="undo-button"
                className="menu-toggle-button-mobile"
                sx={toolButtonStyle}
            >
                <MdUndo />
            </IconButton>
            <ToolButton toggleMenu="mirror" icon={<GoMirror />} />
            <ToolButton toggleMenu="select" icon={<MdOutlineTabUnselected />} />
            <ToolButton toggleMenu="clipboard" icon={<MdContentCopy />} />
            <ToolButton toggleMenu="delete" icon={<MdDelete />} />
        </SpeedDial>
        {/* </Box> */}
        {menus}
    </>
}

export default Toolbar