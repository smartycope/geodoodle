import { useContext } from "react"

import { IoClose } from "react-icons/io5"
import { StateContext } from "../Contexts"

// TODO: this file is not used yet
export function KeyMenu() {
  const { dispatch } = useContext(StateContext)
  return (
    <div id="key-menu">
      <button id="close-button" onClick={() => dispatch({ action: "menu", close: "key", open: "help" })}>
        <IoClose />
      </button>
      <h3>Keyboard Shortcuts</h3>
    </div>
  )
}
