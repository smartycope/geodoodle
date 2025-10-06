import { forwardRef } from 'react'
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { StateContext } from '../Contexts';
import { IconButton, Tooltip } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SaveIcon from '@mui/icons-material/Save';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import AppsIcon from '@mui/icons-material/Apps';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import NearMeIcon from '@mui/icons-material/NearMe';
import PaletteIcon from '@mui/icons-material/Palette';
import { GoMirror } from "react-icons/go";
import HomeIcon from '@mui/icons-material/Home';
import RedoIcon from '@mui/icons-material/Redo';
import FileCopyIcon from '@mui/icons-material/FileCopy';

export const toolButtonStyle = (theme) => ({
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
    color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
    // color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
    // color: theme.palette.primary.main,
    // color: theme.palette.mode === 'dark' ? theme.palette.primary.contrastText : theme.palette.primary.dark,
    // color: theme.palette.background.paper,
})

export const iconMap = {
    extra: <AppsIcon />,
    help: <HelpIcon />,
    settings: <SettingsIcon />,
    file: <SaveIcon />,
    navigation: <NearMeIcon />,
    repeat: <DashboardIcon />,
    color: <PaletteIcon />,
    mirror: <GoMirror />,
    select: <HighlightAltIcon />,
    clipboard: <ContentPasteIcon />,
    delete: <DeleteIcon />,
    home: <HomeIcon />,
    redo: <RedoIcon />,
    copy_image: <FileCopyIcon />,
    main: <MenuRoundedIcon />
}

export const tooltipMap = {
    'main': 'Hide Toolbar',
    'copy_image': 'Copy as Image',
    'home': 'Reset position and scale',
    'redo': 'Redo',
    'extra': 'More Tools'
}

export const getTooltipSide = (side, inExtraMenu) => {
    switch (side){
        case 'right':  return inExtraMenu ? 'top' : 'right';
        case 'left':   return inExtraMenu ? 'top' : 'left';
        case 'bottom': return 'top';
        case 'top':    return 'bottom';
    }
}

const ToolButton = forwardRef(({menu, onClick, inExtraMenu, disableTooltip, ...props}, ref) => {
    const theme = useTheme()
    const {state, dispatch} = useContext(StateContext)

    const btn = <IconButton
        sx={toolButtonStyle(theme)}
        className="menu-toggle-button-mobile"
        onClick={onClick || (() => {dispatch({action: "menu", toggle: menu})})}
        ref={ref}
        {...props}
    >
        {iconMap[menu]}
    </IconButton>

    if (state.beginnerMode)
        return <Tooltip
            // Okay listen
            // We *hide* the tooltip instead of not rendering it because when extra menu opens,
            // the popover component mounts, attaches to the original button, which then
            // gets removed from the DOM because Tooltip wraps it. So we keep it in
            // the DOM, but hide it instead.
            slotProps={{
                tooltip: {
                    sx: {
                        visibility: disableTooltip ? 'hidden' : 'visible'
                    }
                }
            }}
            disableInteractive
            title={tooltipMap[menu] || menu.charAt(0).toUpperCase() + menu.slice(1)}
            placement={getTooltipSide(state.side, inExtraMenu)}
            arrow
        >
            {btn}
        </Tooltip>
    return btn
})

export default ToolButton
