// An "abstract" component that lays out a mini menu (a menu that gets toggled
// by the toolbar buttons)

import React from "react";
import {useAlignWithElement} from "./MenuHooks";
import { Box, Menu, Popper, Paper } from "@mui/material";
import { useContext } from "react";
import { StateContext } from "../Contexts";
import { useTheme } from "@mui/material/styles";

// TODO: This... works? It needs much more testing
export default function MiniMenu({menu, children}){
    const {state, dispatch} = useContext(StateContext)
    const {side} = state
    const theme = useTheme()

    let placement = 'bottom-start'
    let transform = 'bottom-start'
    switch (side) {
        case 'right':
            placement = 'right-start';
            transform = 'right-start'
            break;
        // props = {
        //     anchorOrigin: {vertical: "top", horizontal: "left"},
        //     transformOrigin: {vertical: "top", horizontal: "right"}
        // }; break;
        case 'left':
            placement = 'left-start';
            transform = 'left-start'
            break;
        // props = {
        //     anchorOrigin: {vertical: "top", horizontal: "right"},
        //     transformOrigin: {vertical: "top", horizontal: "left"}
        // }; break;
        case 'bottom':
            placement = 'bottom-start';
            transform = 'bottom-start'
            break;
        // props = {
        //     anchorOrigin: {vertical: "top", horizontal: "center"},
        //     transformOrigin: {vertical: "bottom", horizontal: "center"}
        // }; break;
        case 'top':
            placement = 'top-start';
            transform = 'top-start'
            break;
        // props = {
        //     anchorOrigin: {vertical: "bottom", horizontal: "center"},
        //     transformOrigin: {vertical: "top", horizontal: "center"}
        // }; break;
    }

    // const placementMap = {
    //   top: { left: 'top-start', center: 'top', right: 'top-end' },
    //   bottom: { left: 'bottom-start', center: 'bottom', right: 'bottom-end' },
    //   left: { top: 'left-start', center: 'left', bottom: 'left-end' },
    //   right: { top: 'right-start', center: 'right', bottom: 'right-end' },
    // };

    // const placement = placementMap[anchorOrigin.vertical]?.[anchorOrigin.horizontal] ?? 'bottom';

    return <Popper
        open={state.openMenus[menu]}
        anchorEl={document.getElementById(`${menu}-tool-button`) || null}
        onClose={() => dispatch({action: "menu", close: menu})}
        placement={placement}
        modifiers={[
          {
            name: 'transformOrigin',
            enabled: true,
            phase: 'write',
            fn({ state }) {
              // emulate Popover's transformOrigin
              state.styles.popper.transformOrigin = transform;
                // `${transform.vertical} ${transform.horizontal}`;
            },
          },
        ]}
        // {...props}
      >
        <Paper
        sx={{
            p: 1,
            width: "max-content",
            // color: theme.palette.secondary.contrastText,
            // bgcolor: theme.darken(theme.alpha(theme.palette.primary.main, .95), .2),
        }}>
          {children}
        </Paper>
      </Popper>
}