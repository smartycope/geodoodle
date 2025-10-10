import { forwardRef } from "react";
import { useTheme } from "@mui/material/styles";
import { useContext } from "react";
import { StateContext } from "../Contexts";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SaveIcon from "@mui/icons-material/Save";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpIcon from "@mui/icons-material/Help";
import AppsIcon from "@mui/icons-material/Apps";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import NearMeIcon from "@mui/icons-material/NearMe";
import PaletteIcon from "@mui/icons-material/Palette";
import HomeIcon from "@mui/icons-material/Home";
import RedoIcon from "@mui/icons-material/Redo";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import FlipIcon from "@mui/icons-material/Flip";
import UndoIcon from "@mui/icons-material/Undo";
import { isMobile } from "../utils";
import { PiSelectionPlusDuotone } from "react-icons/pi";

const mobile = isMobile();
const toolButtonStyle = (theme) => ({
    border: "none",
    cursor: "pointer",
    pointerEvents: "all",
    textAlign: "center",
    navIndex: -1,
    outlineStyle: "none",
    boxShadow: "none",
    borderColor: "transparent",
    // NOTE: margin is controlled by Toolbar, not here (because it's dynamic with respect to side)
    p: mobile ? 0.25 : 1,
    scale: mobile ? 1 : 1.5,
    backgroundColor: "transparent",
    color: theme.palette.mode === "dark" ? theme.palette.primary.light : theme.palette.primary.dark,
});

const iconMap = {
    extra: <AppsIcon />,
    help: <HelpIcon />,
    settings: <SettingsIcon />,
    file: <SaveIcon />,
    navigation: <NearMeIcon />,
    repeat: <DashboardIcon />,
    color: <PaletteIcon />,
    mirror: <FlipIcon />,
    select: <HighlightAltIcon />,
    clipboard: <ContentPasteIcon />,
    delete: <DeleteIcon />,
    home: <HomeIcon />,
    redo: <RedoIcon />,
    copy_image: <FileCopyIcon />,
    undo: <UndoIcon />,
    main: <MenuRoundedIcon />,
    add_bound: <PiSelectionPlusDuotone />,
};

const tooltipMap = (mobile) => {
    return {
        main: mobile ? "Hide" : "Hide Toolbar",
        copy_image: mobile ? "Copy" : "Copy as Image",
        home: mobile ? "Home" : "Reset position and scale",
        redo: "Redo",
        extra: mobile ? "More" : "More Tools",
        navigation: mobile ? "Nav" : "Navigation",
        clipboard: mobile ? "Clip" : "Clipboard",
        // This only exists on mobile
        add_bound: "Bound",
    };
};

const getTooltipSide = (side, inExtraMenu) => {
    switch (side) {
        case "right":
            return inExtraMenu ? "top" : "right";
        case "left":
            return inExtraMenu ? "top" : "left";
        case "bottom":
            return "top";
        case "top":
            return "bottom";
    }
};

const ToolButton = forwardRef(function ToolButton({ menu, onClick, inExtraMenu, disableTooltip, ...props }, ref) {
    const theme = useTheme();
    const { state, dispatch } = useContext(StateContext);
    const tooltip = tooltipMap(state.mobile)[menu] || menu.charAt(0).toUpperCase() + menu.slice(1);

    const btn = (
        <IconButton
            sx={{
                ...toolButtonStyle(theme),
                // Highlight the currently open menu
                bgcolor: state.openMenus[menu] && menu !== "main" ? theme.palette.action.selected : "transparent",
                borderRadius: state.openMenus[menu] && menu !== "main" ? theme.shape.borderRadius / 2 : undefined,
            }}
            id={menu + "-tool-button"}
            className="tool-button"
            onClick={
                onClick === undefined
                    ? () => {
                          dispatch({ action: "menu", toggle: menu });
                      }
                    : onClick
            }
            ref={ref}
            {...props}
        >
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {iconMap[menu]}
                {state.mobile && <Typography variant="caption">{tooltip}</Typography>}
            </Box>
        </IconButton>
    );

    if (state.mobile) return btn;
    else
        return (
            <Tooltip
                // Okay listen
                // We *hide* the tooltip instead of not rendering it because when extra menu opens,
                // the popover component mounts, attaches to the original button, which then
                // gets removed from the DOM because Tooltip wraps it. So we keep it in
                // the DOM, but hide it instead.
                slotProps={{
                    tooltip: {
                        sx: {
                            visibility: disableTooltip ? "hidden" : "visible",
                        },
                    },
                }}
                disableInteractive
                title={tooltip}
                placement={getTooltipSide(state.side, inExtraMenu)}
                arrow
            >
                {btn}
            </Tooltip>
        );
});

export default ToolButton;

// It's the only ToolButton that's custom, that's why it's in this file
// Also, most of the code is the same as ToolButton
export const UndoButton = () => {
    const { state, dispatch } = useContext(StateContext);
    const theme = useTheme();

    const handleClick = (e) => {
        // prevent right-click from also triggering undo
        if (e.type === "click" && e.button === 0) {
            dispatch("undo");
        }
    };

    const handleContextMenu = (e) => {
        // prevent browser context menu (just in case)
        e.preventDefault();
        dispatch("redo");
    };

    // const handleTouchStart = () => {
    //   timerRef.current = setTimeout(() => {
    //     dispatch("redo");
    //     timerRef.current = null;
    //   }, 500); // long press threshold
    // };

    // const handleTouchEnd = () => {
    //   if (timerRef.current) {
    //     clearTimeout(timerRef.current);
    //     dispatch("undo"); // short press = undo
    //   }
    // };

    const btn = (
        <IconButton
            sx={toolButtonStyle(theme)}
            className="tool-button"
            onClick={handleClick}
            // This automatically handles long-press for us
            onContextMenu={handleContextMenu}
            // onTouchStart={handleTouchStart}
            // onTouchEnd={handleTouchEnd}
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
