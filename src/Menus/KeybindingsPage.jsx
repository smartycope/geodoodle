import { useContext, useEffect, useState } from "react"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import KeyboardIcon from "@mui/icons-material/Keyboard"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import IconButton from "@mui/material/IconButton"
import MenuItem from "@mui/material/MenuItem"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { StateContext } from "../Contexts"
import { defaultKeybindings, keybindable } from "../options"
import { normalizeShortcut, shortcutFromKeyboardEvent } from "../utils"
import Page from "./Page"

const actionsMatch = (left, right) => {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  return [...keys].every((key) => left[key] === right[key])
}

const cloneAction = (action) => ({ ...action })

function BindingRow({ shortcut, action, onShortcutChange, onActionChange, onRecord, onDelete }) {
  const [shortcutText, setShortcutText] = useState(shortcut)
  const actionId = keybindable.find((entry) => actionsMatch(entry.action, action))?.id ?? ""

  useEffect(() => setShortcutText(shortcut), [shortcut])

  const commitShortcut = () => {
    if (!onShortcutChange(shortcut, shortcutText)) setShortcutText(shortcut)
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "minmax(9rem, 0.65fr) auto minmax(13rem, 1fr) auto" },
        gap: 1,
        alignItems: "center",
        p: 1,
        border: 0,
        borderColor: "divider",
        borderRadius: 1,
      }}
    >
      <TextField
        label="Shortcut"
        size="small"
        value={shortcutText}
        onChange={(event) => setShortcutText(event.target.value)}
        onBlur={commitShortcut}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        inputProps={{ "aria-label": `Shortcut for ${actionId || "action"}` }}
      />
      <IconButton aria-label={`Record shortcut for ${actionId || "action"}`} onClick={() => onRecord(shortcut)}>
        <KeyboardIcon />
      </IconButton>
      <TextField
        select
        label="Action"
        size="small"
        value={actionId}
        onChange={(event) => onActionChange(shortcut, event.target.value)}
        sx={{ gridColumn: { xs: "1 / -2", sm: "auto" } }}
      >
        {keybindable.map((entry) => (
          <MenuItem key={entry.id} value={entry.id}>
            {entry.label}
          </MenuItem>
        ))}
      </TextField>
      <IconButton aria-label={`Delete shortcut ${shortcut}`} onClick={() => onDelete(shortcut)}>
        <DeleteIcon />
      </IconButton>
    </Box>
  )
}

export default function KeybindingsPage() {
  const { state, dispatch } = useContext(StateContext)
  const [recordingFor, setRecordingFor] = useState(null)
  const [recordedShortcut, setRecordedShortcut] = useState("")
  const keybindings = state.keybindings ?? defaultKeybindings

  const saveKeybindings = (nextKeybindings) =>
    dispatch({ action: "set_manual_and_save_settings", keybindings: nextKeybindings })

  const changeShortcut = (oldShortcut, shortcutText) => {
    const newShortcut = normalizeShortcut(shortcutText)
    if (!newShortcut) return false
    if (newShortcut === oldShortcut) return true

    const nextKeybindings = {}
    for (const [shortcut, action] of Object.entries(keybindings))
      if (shortcut === oldShortcut) nextKeybindings[newShortcut] = action
      else if (shortcut !== newShortcut) nextKeybindings[shortcut] = action
    saveKeybindings(nextKeybindings)
    return true
  }

  const changeAction = (shortcut, actionId) => {
    const bindableAction = keybindable.find((entry) => entry.id === actionId)
    if (bindableAction)
      saveKeybindings({
        ...keybindings,
        [shortcut]: cloneAction(bindableAction.action),
      })
  }

  const openRecorder = (shortcut = "") => {
    setRecordingFor(shortcut)
    setRecordedShortcut("")
  }

  const closeRecorder = () => {
    setRecordingFor(null)
    setRecordedShortcut("")
  }

  const applyRecordedShortcut = () => {
    if (!recordedShortcut) return

    if (recordingFor) changeShortcut(recordingFor, recordedShortcut)
    else {
      const nextKeybindings = { ...keybindings }
      nextKeybindings[recordedShortcut] = cloneAction(keybindable[0].action)
      saveKeybindings(nextKeybindings)
    }
    closeRecorder()
  }

  return (
    <Page menu="key" title="Keyboard Shortcuts">
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Type shortcuts with + between modifiers and keys, such as ctrl+z or shift+b. Ctrl shortcuts also work with
          Command on a Mac.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openRecorder()}>
            Add Shortcut
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              saveKeybindings(
                Object.fromEntries(
                  Object.entries(defaultKeybindings).map(([shortcut, action]) => [shortcut, cloneAction(action)]),
                ),
              )
            }
          >
            Reset Shortcuts
          </Button>
          <Button variant="text" onClick={() => dispatch({ action: "menu", close: "key", open: "settings" })}>
            Back to Settings
          </Button>
        </Stack>

        {Object.entries(keybindings).map(([shortcut, action]) => (
          <BindingRow
            key={shortcut}
            shortcut={shortcut}
            action={action}
            onShortcutChange={changeShortcut}
            onActionChange={changeAction}
            onRecord={openRecorder}
            onDelete={(deletedShortcut) =>
              saveKeybindings(
                Object.fromEntries(Object.entries(keybindings).filter(([key]) => key !== deletedShortcut)),
              )
            }
          />
        ))}
      </Stack>

      <Dialog
        open={recordingFor !== null}
        onClose={closeRecorder}
        onKeyDown={(event) => {
          const shortcut = shortcutFromKeyboardEvent(event)
          if (!shortcut) return
          event.preventDefault()
          event.stopPropagation()
          setRecordedShortcut(shortcut)
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Record Shortcut</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>Press the key combination you want to use.</Typography>
            <TextField
              label="Recorded shortcut"
              value={recordedShortcut}
              placeholder="Waiting for input…"
              inputProps={{ readOnly: true }}
              autoFocus
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRecorder}>Cancel</Button>
          <Button variant="contained" disabled={!recordedShortcut} onClick={applyRecordedShortcut}>
            Use Shortcut
          </Button>
        </DialogActions>
      </Dialog>
    </Page>
  )
}
