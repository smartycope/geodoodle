import { useContext } from "react"
import { StateContext } from "../Contexts"
import MiniMenu from "../components/MiniMenu"
import ListItemIcon from "@mui/material/ListItemIcon"
import MenuItem from "@mui/material/MenuItem"
import ContentCutIcon from "@mui/icons-material/ContentCut"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import ContentPasteIcon from "@mui/icons-material/ContentPaste"
import ShortcutHint from "../components/ShortcutHint"

function ClipboardMenu() {
  const { dispatch } = useContext(StateContext)
  return (
    <MiniMenu menu="clipboard">
      <MenuItem onClick={() => dispatch("copy")}>
        <ListItemIcon>
          <ContentCopyIcon />
        </ListItemIcon>
        Copy
        <ShortcutHint action="copy" />
      </MenuItem>
      <MenuItem onClick={() => dispatch("cut")}>
        <ListItemIcon>
          <ContentCutIcon />
        </ListItemIcon>
        Cut
        <ShortcutHint action="cut" />
      </MenuItem>
      <MenuItem onClick={() => dispatch("paste")}>
        <ListItemIcon>
          <ContentPasteIcon />
        </ListItemIcon>
        Paste
        <ShortcutHint action="paste" />
      </MenuItem>
    </MiniMenu>
  )
}

export default ClipboardMenu
