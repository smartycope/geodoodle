import "../styling/ExtraMenu.css"
import { FaSave } from "react-icons/fa";
import { MdHome, MdOutlineFileCopy } from "react-icons/md";
import { MdDashboard } from "react-icons/md";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { RiNavigationFill } from "react-icons/ri";
import {StateContext} from "../Contexts";
import {useContext} from "react";
import {useAlignWithElement} from "./MenuHooks";

// Only made for mobile
export default function ExtraMenu({align}){
    const [state, dispatch] = useContext(StateContext)
    const style = useAlignWithElement(align)

    var extraButton
    switch (state.extraButton) {
        case 'copy image':
            extraButton = <button onClick={() => dispatch({action: 'copy image'})}
                className="menu-toggle-button-mobile extra-button bonus-button"
                id='copy-button-extra'
            ><MdOutlineFileCopy className="main-menu-icon extra-icon" />Copy as<br/> Image
            </button>
            break
        // Home is the default
        default:
            extraButton = <button id='home-button-extra'
                onClick={() => dispatch({action: "go home"})}
                className="menu-toggle-button-mobile extra-button bonus-button"
                title="Reset position and scale">
                <MdHome className="main-menu-icon extra-icon"/> Home
            </button>
            break;
    }

    return <div id='extra-menu' style={{...style,
            transform: ['left', 'right'].includes(state.side) ? 'translate(0px, -100px)': undefined,
        }}>
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
        {extraButton}
    </div>
}
