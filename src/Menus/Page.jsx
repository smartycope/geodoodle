// An "abstract" component, similar to MiniMenu, but for full page menus
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {useAlignWithElement} from "./MenuHooks";
import { Box, Menu, Popper, Paper, IconButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useContext } from "react";
import { StateContext } from "../Contexts";
import { useTheme } from "@mui/material/styles";



export default function Page({menu, title, children, sx}){
    const {state, dispatch} = useContext(StateContext)
    const {side} = state
    if (title === undefined) title = menu.charAt(0).toUpperCase() + menu.slice(1)
    const theme = useTheme()

    return (
        <Dialog
            open={state.openMenus[menu]}
            onClose={() => dispatch({action: "menu", close: menu})}
            // fullWidth
            maxWidth="lg"
            // fullScreen
            scroll="paper"
            // slotProps={{
            //     paper: {
            //         sx: {
            //             position: "absolute",
            //             top: "50%",
            //             left: "50%",
            //             transform: "translate(-50%, -50%)",
            //             m: 0, // remove default margin if needed
            //         },
            //     },
            // }}
            sx={{
                ...sx,
                // '& .MuiDialog-container': {
                //     alignItems: 'center',
                //     justifyContent: 'center',
                // },
                // '& .MuiPaper-root': {
                //     margin: 2,
                //     width: '100%',
                //     maxWidth: '90vw',
                // }
            }}
        >
            <IconButton
          aria-label="close"
          onClick={() => dispatch({action: "menu", close: menu})}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>
            <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
            <DialogContent>
                {children}
            </DialogContent>
            <DialogActions>
            <Button onClick={() => dispatch({action: "menu", close: menu})} autoFocus>Close</Button>
            </DialogActions>
        </Dialog>
    );
}