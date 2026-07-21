// NOTE: this doesn't do anything with modifier key events if they're not pressed with something else
export function eventMatchesKeycode(event, code) {
  code = code.toLowerCase().split("+")
  const eventKey = event.key === " " ? "space" : event.key.toLowerCase()
  const expectsCtrl = code.includes("ctrl")
  const expectsMeta = code.includes("meta")
  const primaryModifierMatches = expectsMeta
    ? event.metaKey && event.ctrlKey === expectsCtrl
    : expectsCtrl
      ? event.ctrlKey || event.metaKey
      : !event.ctrlKey && !event.metaKey

  return (
    primaryModifierMatches &&
    event.altKey === code.includes("alt") &&
    event.shiftKey === code.includes("shift") &&
    code.includes(eventKey)
  )
}

export function normalizeShortcut(shortcut) {
  const aliases = {
    command: "ctrl",
    cmd: "ctrl",
    control: "ctrl",
    meta: "ctrl",
    option: "alt",
    " ": "space",
  }
  const parts = shortcut
    .trim()
    .toLowerCase()
    .split("+")
    .map((part) => aliases[part.trim()] ?? part.trim())
    .filter(Boolean)

  const modifiers = ["ctrl", "alt", "shift"].filter((modifier) => parts.includes(modifier))
  const key = parts.find((part) => !["ctrl", "meta", "alt", "shift"].includes(part))
  return key ? [...modifiers, key].join("+") : ""
}

export function shortcutFromKeyboardEvent(event) {
  if (["Shift", "Meta", "Control", "Alt"].includes(event.key)) return ""

  const parts = []
  if (event.ctrlKey || event.metaKey) parts.push("ctrl")
  if (event.altKey) parts.push("alt")
  if (event.shiftKey) parts.push("shift")
  parts.push(event.key === " " ? "space" : event.key.toLowerCase())
  return normalizeShortcut(parts.join("+"))
}
