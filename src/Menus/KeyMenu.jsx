import {useContext} from "react";
import "../styling/KeyMenu.css"

import { IoClose } from "react-icons/io5";
import {StateContext} from "../Contexts";


// eslint-disable-next-line no-unused-vars
export function KeyMenu(){
    const [state, dispatch] = useContext(StateContext)
    const {side} = state
    return <div id='key-menu'>
        <button id='close-button' onClick={() => dispatch({action: "menu", close: "key", open: 'help'})}><IoClose /></button>
        <h3>Keyboard Shortcuts</h3>
    </div>
}
