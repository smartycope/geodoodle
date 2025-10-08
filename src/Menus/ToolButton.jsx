import { forwardRef } from 'react'
import { useTheme } from '@mui/material/styles';
import { useContext, useRef } from 'react';
import { StateContext } from '../Contexts';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
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
import UndoIcon from '@mui/icons-material/Undo';

export const toolButtonStyle = (theme) => ({
    border: 'none',
    cursor: 'pointer',
    pointerEvents: 'all',
    textAlign: 'center',
    navIndex: -1,
    scale: { xs: 1, sm: 1, md: 1.5 },
    opacity: 90,
    outlineStyle: 'none',
    boxShadow: 'none',
    borderColor: 'transparent',
    // NOTE: margin is controlled by Toolbar, not here (because it's dynamic with respect to side)
    p: {xs: .25, sm: .25, md: 1, lg: 1, xl: 1},
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
    undo: <UndoIcon />,
    main: <MenuRoundedIcon />
}

export const tooltipMap = (mobile) => {
    return {
        'main': mobile ? 'Hide' : 'Hide Toolbar',
        'copy_image': mobile ? 'Copy' : 'Copy as Image',
        'home': mobile ? 'Home' : 'Reset position and scale',
        'redo': 'Redo',
        'extra': mobile ? 'More' : 'More Tools',
        'navigation': mobile ? 'Nav' : 'Navigation',
        'clipboard': mobile ? 'Clip' : 'Clipboard',
    }
}

export const getTooltipSide = (side, inExtraMenu) => {
    switch (side) {
        case 'right': return inExtraMenu ? 'top' : 'right';
        case 'left': return inExtraMenu ? 'top' : 'left';
        case 'bottom': return 'top';
        case 'top': return 'bottom';
    }
}

const ToolButton = forwardRef(({ menu, onClick, inExtraMenu, disableTooltip, ...props }, ref) => {
    const theme = useTheme()
    const { state, dispatch } = useContext(StateContext)
    const tooltip = tooltipMap(state.mobile)[menu] || menu.charAt(0).toUpperCase() + menu.slice(1)

    const btn = <IconButton
        sx={{...toolButtonStyle(theme),
          // Highlight the currently open menu
          bgcolor: (state.openMenus[menu] && menu !== 'main') ? theme.palette.action.selected : 'transparent',
          borderRadius: (state.openMenus[menu] && menu !== 'main') ? theme.shape.borderRadius : undefined,
        }}

        className="tool-button"
        onClick={onClick || (() => { dispatch({ action: "menu", toggle: menu }) })}
        ref={ref}
        {...props}
    >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {iconMap[menu]}
            {state.mobile && <Typography variant="caption">{tooltip}</Typography>}
        </Box>
    </IconButton>

    if (state.mobile)
        return btn
    else
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
            title={tooltip}
            placement={getTooltipSide(state.side, inExtraMenu)}
            arrow
        >
            {btn}
        </Tooltip>
})

// I don't know what this is but the linter was bugging me for it
ToolButton.displayName = 'ToolButton';
export default ToolButton

// var tapHolding = false
// var touchHoldTimer = null
// var redid = false


// function undoOnTouchHold() {
//     if (tapHolding) {
//         redid = true
//         dispatch('redo')
//         tapHolding = false
//     }
// }

// function undoOnTouchStart() {
//     setTimeout(() => tapHolding = true, 10)
//     touchHoldTimer = setTimeout(undoOnTouchHold, state.holdTapTimeMS)
// }

// function undoOnTouchEnd() {
//     clearTimeout(touchHoldTimer)
//     tapHolding = false
//     if (!redid) {
//         dispatch('undo')
//     }
//     redid = false
// }

// It's the only ToolButton that's custom, that's why it's in this file
// Also, most of the code is the same as ToolButton
export const UndoButton = () => {
  const { state, dispatch } = useContext(StateContext);
  const theme = useTheme();
  const timerRef = useRef(null);

  const handleClick = (e) => {
    // prevent right-click from also triggering undo
    if (e.type === "click" && e.button === 0) {
      dispatch("undo");
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault(); // prevent browser context menu
    dispatch("redo");
  };

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      dispatch("redo");
      timerRef.current = null;
    }, 500); // long press threshold
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      dispatch("undo"); // short press = undo
    }
  };

  const btn = (
    <IconButton
      sx={toolButtonStyle(theme)}
      className="tool-button"
      onClick={handleClick}
    //   This automatically handles long-press for us
      onContextMenu={handleContextMenu}
    //   onTouchStart={handleTouchStart}
    //   onTouchEnd={handleTouchEnd}
      onMouseDown={(e) => e.preventDefault()} // prevents focus highlight on right click
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {iconMap["undo"]}
        {state.mobile && <Typography variant="caption">Undo</Typography>}
      </Box>
    </IconButton>
  );

  return (
    <Tooltip title="Undo" arrow placement={getTooltipSide(state.side, false)}>
      {btn}
    </Tooltip>
  );
};
