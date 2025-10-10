// An "abstract" component, similar to MiniMenu, but for full page menus
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import { useContext } from "react";
import { StateContext } from "../Contexts";

export default function Page({ menu, title, children, sx }) {
    const { state, dispatch } = useContext(StateContext);
    if (title === undefined) title = menu.charAt(0).toUpperCase() + menu.slice(1);

    return (
        <Dialog
            open={state.openMenus[menu]}
            onClose={() => dispatch({ action: "menu", close: menu })}
            fullWidth
            maxWidth="md"
            scroll="paper"
            sx={sx}
        >
            <IconButton
                aria-label="close"
                onClick={() => dispatch({ action: "menu", close: menu })}
                sx={(theme) => ({
                    position: "absolute",
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>
            <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
            <DialogContent>{children}</DialogContent>
            <DialogActions>
                <Button onClick={() => dispatch({ action: "menu", close: menu })} autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
