import React from "react";
import "../styling/ExtraMenu.css"
import ControlsMenu from "./ControlsMenu";
import { FaSave } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";
import { FaSliders } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { FaBars } from "react-icons/fa6";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import {HelpMenu} from "./HelpMenu"
import ColorMenu from "./ColorMenu";
import {FileMenu} from "./FileMenu";
import {SettingsMenu} from "./SettingsMenu";
import NavMenu from "./NavMenu";
import { RiNavigationFill } from "react-icons/ri";
import RepeatMenu from "./RepeatMenu";
import {GoMirror} from "react-icons/go";
import MirrorMenu from "./MirrorMenu";
import { FaEye } from "react-icons/fa";

// Only made for mobile
export default function ExtraMenu({dispatch, state, align}){
    const to = document.querySelector("#" + align).getBoundingClientRect()

    return <div id='extra-menu' style={{top: to.bottom+5, left: to.left}}>
        <button onClick={() => {dispatch({action: "menu", toggle: "navigation", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <RiNavigationFill className="main-menu-icon extra-icon"/> Navigation
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "repeat", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <MdDashboard className="main-menu-icon extra-icon"/> Repeat
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "file", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <FaSave className="main-menu-icon extra-icon"/> File
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "settings", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <IoMdSettings className="main-menu-icon extra-icon"/> Settings
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "help", close: "extra"})}}
            className="menu-toggle-button-mobile extra-button"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <MdHelp className="main-menu-icon extra-icon"/> Help
        </button>
    </div>
}
