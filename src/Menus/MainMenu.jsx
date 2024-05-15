import React, {useState} from "react";
import "../styling/MainMenu.css"
import ControlsMenu from "./ControlsMenu";
import { FaSave } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";
import { MdOutlineSettings } from "react-icons/md";
import { FaSliders } from "react-icons/fa6";
import { MdCropFree } from "react-icons/md";
import { MdDashboard } from "react-icons/md";
// import { MdMenu } from "react-icons/md"; <MdMenu />
import { FaBars } from "react-icons/fa6";
import { MdHelpOutline } from "react-icons/md";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import {HelpMenu} from "./HelpMenu"
import ColorMenu from "./ColorMenu";
import {FileMenu} from "./FileMenu";
import {SettingsMenu} from "./SettingsMenu";
import NavMenu from "./NavMenu";
import { RiNavigationFill } from "react-icons/ri";
import RepeatMenu from "./RepeatMenu";

export default function MainMenu({dispatch, state}){
    return <>
        {/* The menu button in the corner */}
        <button onClick={() => dispatch({action: "menu", toggle: "main"})} id='menu-button'>
            {/* <img id='menu-icon' src="./menuIcon.png" alt=""/> */}
            <FaBars id='menu-icon' color="black"/>
        </button>

        {/* The drop-down menu of toggle buttons */}
        {state.openMenus.main && <div id='menu-selector'>
            <button onClick={() => {
                dispatch({action: "menu", toggle: "controls", close: "main"})
                dispatch('nevermind')
            }} className="menu-toggle-button">
                <FaSliders /> Controls
            </button>
            <button onClick={() => {
                dispatch({action: "menu", toggle: "color", close: "main"})
                dispatch('nevermind')
            }} className="menu-toggle-button">
                <MdColorLens /> Colors
            </button>
            <button onClick={() => {
                dispatch({action: "menu", toggle: "navigation", close: "main"})
                dispatch('nevermind')
            }} className="menu-toggle-button">
                <RiNavigationFill /> Navigation
            </button>
            <button onClick={() => {
                dispatch({action: "menu", toggle: "repeat", close: "main"})
                dispatch('nevermind')
            }} className="menu-toggle-button">
                <MdDashboard /> Repeat
            </button>
            <button onClick={() => {
                dispatch({action: "menu", toggle: "file", close: "main"})
                dispatch('nevermind')
            }} className="menu-toggle-button">
                <FaSave /> File
            </button>
            <button onClick={() => {
                dispatch({action: "menu", toggle: "settings", close: "main"})
                dispatch('nevermind')
            }} className="menu-toggle-button">
                <IoMdSettings /> Settings
            </button>
            <button onClick={() => {
                dispatch({action: "menu", toggle: "help", close: "main"})
                dispatch('nevermind')
            }} className="menu-toggle-button">
                <MdHelp /> Help
            </button>
        </div>}

        {/* The menus */}
        {state.openMenus.controls   && <ControlsMenu dispatch={dispatch} state={state}/>}
        {state.openMenus.color      && <ColorMenu    dispatch={dispatch} state={state}/>}
        {state.openMenus.navigation && <NavMenu      dispatch={dispatch} state={state}/>}
        {state.openMenus.repeat     && <RepeatMenu   dispatch={dispatch} state={state}/>}
        {state.openMenus.file       && <FileMenu     dispatch={dispatch} state={state}/>}
        {state.openMenus.settings   && <SettingsMenu dispatch={dispatch} state={state}/>}
        {state.openMenus.help       && <HelpMenu     dispatch={dispatch} state={state}/>}
    </>
}
