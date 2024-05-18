import React from "react";
import "../styling/MainMenu.css"
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

export default function MainMenu({dispatch, state}){
    const desktop = <>
        {/* The menu button in the corner */}
        <button onClick={() => dispatch({action: "menu", toggle: "main"})} id='menu-button'>
            {/* <img id='menu-icon' src="./menuIcon.png" alt=""/> */}
            <FaBars id='menu-icon' color="black"/>
        </button>
        {state.openMenus.main && <div id='menu-selector-desktop'>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "controls", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <FaSliders /> Controls
            </button>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "color", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <MdColorLens /> Colors
            </button>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "navigation", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <RiNavigationFill /> Navigation
            </button>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "mirror", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <GoMirror /> Mirror
            </button>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "repeat", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <MdDashboard /> Repeat
            </button>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "file", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <FaSave /> File
            </button>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "settings", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <IoMdSettings /> Settings
            </button>
            <button
                onClick={() => {dispatch({action: "menu", toggle: "help", close: "main"})}}
                className="menu-toggle-button-desktop"
            > <MdHelp /> Help
            </button>
        </div>}
    </>

    const mobile = <div id='menu-selector-mobile'>
        <button onClick={() => {dispatch({action: "menu", toggle: "controls", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <FaSliders className="main-menu-icon"/>
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "color", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <MdColorLens className="main-menu-icon"/>
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "navigation", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <RiNavigationFill className="main-menu-icon"/>
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "mirror", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <GoMirror className="main-menu-icon"/>
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "repeat", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <MdDashboard className="main-menu-icon"/>
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "file", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <FaSave className="main-menu-icon"/>
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "settings", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <IoMdSettings className="main-menu-icon"/>
        </button>
        <button onClick={() => {dispatch({action: "menu", toggle: "help", close: "main"})}}
            className="menu-toggle-button-mobile"
            style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
        > <MdHelp className="main-menu-icon"/>
        </button>
        {/* The menu button in the corner */}
        <button onClick={() => dispatch({action: "menu", toggle: "main"})}
            className="menu-toggle-button-mobile"
        > <FaBars color="black" id='menu-icon'/>
        </button>
    </div>


    return <>
        {/* The drop-down menu of toggle buttons */}
        {state.mobile ? mobile : desktop}

        {/* The menus */}
        {state.openMenus.controls   && <ControlsMenu dispatch={dispatch} state={state}/>}
        {state.openMenus.color      && <ColorMenu    dispatch={dispatch} state={state}/>}
        {state.openMenus.navigation && <NavMenu      dispatch={dispatch} state={state}/>}
        {state.openMenus.mirror     && <MirrorMenu   dispatch={dispatch} state={state}/>}
        {state.openMenus.repeat     && <RepeatMenu   dispatch={dispatch} state={state}/>}
        {state.openMenus.file       && <FileMenu     dispatch={dispatch} state={state}/>}
        {state.openMenus.settings   && <SettingsMenu dispatch={dispatch} state={state}/>}
        {state.openMenus.help       && <HelpMenu     dispatch={dispatch} state={state}/>}
    </>
}
