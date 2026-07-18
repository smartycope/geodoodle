import { useEffect, useState } from "react"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogContentText from "@mui/material/DialogContentText"
import DialogTitle from "@mui/material/DialogTitle"
import TextField from "@mui/material/TextField"

export default function SharedPatternDialog({ conflict, onCancel, onIgnore, onSave }) {
  const [name, setName] = useState("")

  useEffect(() => setName(conflict?.local?.filename ?? ""), [conflict])

  return (
    <Dialog open={Boolean(conflict)} aria-labelledby="shared-pattern-dialog-title">
      <DialogTitle id="shared-pattern-dialog-title">Save your current pattern?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          This link opens <strong>{conflict?.pattern}</strong> from <strong>{conflict?.user}</strong>. Save the pattern
          already in this browser before replacing it, or continue without saving it.
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          label="Current pattern name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && name.trim()) onSave(name.trim())
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap" }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" onClick={onIgnore}>
          Ignore &amp; load
        </Button>
        <Button variant="contained" disabled={!name.trim()} onClick={() => onSave(name.trim())}>
          Save &amp; load
        </Button>
      </DialogActions>
    </Dialog>
  )
}
