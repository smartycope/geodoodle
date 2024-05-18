import {useState} from 'react';
import "../styling/KeyMenu.css"

import { IoClose } from "react-icons/io5";


export function KeyMenu({state, dispatch}){
    return <div id='key-menu'>
        <button id='close-button' onClick={() => dispatch({action: "menu", close: "key", open: 'help'})}><IoClose /></button>
        <h3>Keyboard Shortcuts</h3>
    </div>
}
