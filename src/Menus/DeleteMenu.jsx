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
import LayersClearIcon from "@mui/icons-material/LayersClear"

function DeleteMenu() {
  const { dispatch, state } = useContext(StateContext)
  const activeLayer = state.layers.find((layer) => layer.id === state.activeLayerId)

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
          state.debug || activeLayer?.isEmpty || window.confirm("Clear the active layer?")
            ? dispatch("clear_active_layer")
            : undefined
        }
      >
        <ListItemIcon>
          <LayersClearIcon />
        </ListItemIcon>
        Clear Active Layer
      </MenuItem>
      <MenuItem
        onClick={() =>
          state.debug || window.confirm("Delete the entire document and all of its layers?")
            ? dispatch("clear")
            : undefined
        }
      >
        <ListItemIcon>
          <GiNuclear />
        </ListItemIcon>
        Delete Entire Document
        <ShortcutHint action="clear" />
      </MenuItem>
    </MiniMenu>
  )
}

export default DeleteMenu
