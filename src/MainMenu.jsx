import React, {useState} from "react";
import "./MainMenu.css"
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

export default function MainMenu({dispatch, state}){
    const [visible, setVisible] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(false);
    const [colorVisible, setColorVisible] = useState(false)
    const [repeatVisible, setRepeatVisible] = useState(false)
    const [fileVisible, setFileVisible] = useState(false)
    const [settingsVisible, setSettingsVisible] = useState(false)
    const [helpVisible, setHelpVisible] = useState(false)

    return <>
        {/* The menu button in the corner */}
        <button onClick={() => setVisible(!visible)} id='menu-button'>
            {/* <img id='menu-icon' src="./menuIcon.png" alt=""/> */}
            <FaBars id='menu-icon' color="black"/>
        </button>

        {/* The drop-down menu of toggle buttons */}
        {visible && <div id='menu-selector'>
            <button onClick={() => {setControlsVisible(!controlsVisible); setVisible(false)}} class="menu-toggle-button">
                <FaSliders /> Controls
            </button>
            <button onClick={() => {setColorVisible(!colorVisible); setVisible(false)}} class="menu-toggle-button">
                <MdColorLens /> Colors
            </button>
            <button onClick={() => {setRepeatVisible(!repeatVisible); setVisible(false)}} class="menu-toggle-button">
                <MdDashboard /> Repeat
            </button>
            <button onClick={() => {setFileVisible(!fileVisible); setVisible(false)}} class="menu-toggle-button">
                <FaSave /> File
            </button>
            <button onClick={() => {setSettingsVisible(!settingsVisible); setVisible(false)}} class="menu-toggle-button">
                <IoMdSettings /> Settings
            </button>
            <button onClick={() => {setHelpVisible(!helpVisible); setVisible(false)}} class="menu-toggle-button">
                <MdHelp /> Help
            </button>

        </div>}

        {/* The menus */}
        {controlsVisible && <ControlsMenu dispatch={dispatch} state={state}/>}
        {colorVisible && <div>color menu!</div>}
        {repeatVisible && <div>repeat menu!</div>}
        {fileVisible && <div>file menu!</div>}
        {settingsVisible && <div>settings menu!</div>}
        {helpVisible && <div>help menu!</div>}
    </>
}
