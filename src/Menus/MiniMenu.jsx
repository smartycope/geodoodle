// An "abstract" component that lays out a mini menu (a menu that gets toggled
// by the toolbar buttons)

import React from "react";
import { Popper, Paper } from "@mui/material";
import { useContext } from "react";
import { StateContext } from "../Contexts";

// TODO: This... works? It needs much more testing
// TODO: thsi has a bug where if the menu wouldn't fit on the page, it swaps sides instead of just clipping a little bit
export default function MiniMenu({menu, children}){
    const {state, dispatch} = useContext(StateContext)
    const {side} = state

    let placement = `${side}-start`

    const el = document.getElementById(`${menu}-tool-button`)

    // Don't render the menu if the button doesn't exist (it would otherwise default to top left corner)
    if (!el){
        return null
    }
    return <Popper
        open={state.openMenus[menu]}
        anchorEl={el}
        onClose={() => dispatch({action: "menu", close: menu})}
        placement={placement}
        sx={{zIndex: 2}}
        modifiers={[
            {
                name: 'transformOrigin',
                enabled: true,
                phase: 'write',
                fn({ state }) {
                    // emulate Popover's transformOrigin
                    state.styles.popper.transformOrigin = placement;
                },
            },
            // These don't seem to do anything
            { name: 'flip', enabled: true },
            { name: 'preventOverflow', enabled: true },
            // { name: 'offset', options: { offset: [0, 16] } },
            // { name: 'preventOverflow', options: { padding: 16 } },
            // { name: 'flip', options: { altBoundary: true } },
        ]}
      >
        <Paper id={`${menu}-mini-menu`} sx={{
            p: 1,
            // This value relates to the Toolbar padding value
            // I'm honestly not sure why these values work, but they do?
            m: {xs: 1, sm: 1.5, md: .5, lg: .5, xl: .5},
            width: "max-content",
        }}>
            {children}
        </Paper>
      </Popper>
}