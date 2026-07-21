import { useContext } from "react"
import Typography from "@mui/material/Typography"
import { StateContext } from "../Contexts"

const actionsMatch = (left, right) => {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  return [...keys].every((key) => left[key] === right[key])
}

const asAction = (action) => (typeof action === "string" ? { action } : action)

const formatShortcut = (shortcut) =>
  shortcut
    .split("+")
    .map((part) => {
      const labels = {
        alt: "Alt",
        backspace: "Backspace",
        ctrl: "Ctrl",
        delete: "Delete",
        shift: "Shift",
        space: "Space",
      }
      return labels[part] ?? (part.length === 1 ? part.toUpperCase() : part)
    })
    .join("+")

export default function ShortcutHint({ action, actions }) {
  const { state } = useContext(StateContext)
  if (state.mobile) return null
  const applicableActions = (actions ?? [action]).filter(Boolean).map(asAction)
  const shortcuts = Object.entries(state.keybindings ?? {})
    .filter(([, binding]) => applicableActions.some((applicableAction) => actionsMatch(binding, applicableAction)))
    .map(([shortcut]) => formatShortcut(shortcut))

  if (!shortcuts.length) return null

  return (
    <Typography
      component="span"
      variant="caption"
      color="text.disabled"
      aria-label={`Keyboard shortcut${shortcuts.length > 1 ? "s" : ""}: ${shortcuts.join(", ")}`}
      sx={{ ml: "auto", pl: 3, fontFamily: "monospace", letterSpacing: 0.25, whiteSpace: "nowrap" }}
    >
      {shortcuts.join(" · ")}
    </Typography>
  )
}
