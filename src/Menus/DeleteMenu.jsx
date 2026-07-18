import { GiNuclear } from "react-icons/gi"
import DeleteIcon from "@mui/icons-material/Delete"
import { useContext } from "react"
import { StateContext } from "../Contexts"
import MiniMenu from "./MiniMenu"
import ListItemIcon from "@mui/material/ListItemIcon"
import MenuItem from "@mui/material/MenuItem"
import CancelPresentationIcon from "@mui/icons-material/CancelPresentation"
import CancelPresentationTwoToneIcon from "@mui/icons-material/CancelPresentationTwoTone"
import { getSelected } from "../utils"
import ShortcutHint from "./ShortcutHint"

function DeleteMenu() {
  const { dispatch, state } = useContext(StateContext)

  return (
    <MiniMenu menu="delete">
      {/* We can't click the button and move the cursor to the current position on desktop */}
      {state.mobile && (
        <>
          <MenuItem onClick={() => dispatch("delete_at_cursor")}>
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            Delete
            <ShortcutHint
              actions={[{ action: "delete_at_cursor" }, { action: "delete_at_cursor", allowDeleteSelected: true }]}
            />
          </MenuItem>
        </>
      )}
      {/* TODO: this could be optimized */}
      {getSelected(state).length > 0 && (
        <span>
          <MenuItem onClick={() => dispatch("delete_selected")}>
            <CancelPresentationTwoToneIcon sx={{ mr: 1 }} />
            Delete Selected
            <ShortcutHint
              actions={[{ action: "delete_selected" }, { action: "delete_at_cursor", allowDeleteSelected: true }]}
            />
          </MenuItem>
          <MenuItem onClick={() => dispatch("delete_unselected")}>
            <CancelPresentationIcon sx={{ mr: 1 }} />
            Delete Unselected
            <ShortcutHint action="delete_unselected" />
          </MenuItem>
        </span>
      )}
      <MenuItem
        onClick={() =>
          state.debug || window.confirm("Are you sure you want to delete everything?") ? dispatch("clear") : undefined
        }
      >
        <ListItemIcon>
          <GiNuclear />
        </ListItemIcon>
        Delete All
        <ShortcutHint action="clear" />
      </MenuItem>
    </MiniMenu>
  )
}

export default DeleteMenu
