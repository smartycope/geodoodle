import "../styling/MainMenu.css"
import ControlsMenu from "./ControlsMenu";
import {HelpMenu} from "./HelpMenu"
import ColorMenu from "./ColorMenu";
import {FileMenu} from "./FileMenu";
import {SettingsMenu} from "./SettingsMenu";
import NavMenu from "./NavMenu";
import RepeatMenu from "./RepeatMenu";
import MirrorMenu from "./MirrorMenu";
import ExtraMenu from "./ExtraMenu";

import { MdContentCopy } from "react-icons/md"
import { MdUndo } from "react-icons/md";
import { MdDelete } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";
import { FaSliders } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { FaBars } from "react-icons/fa6";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { RiNavigationFill } from "react-icons/ri";
import { GoMirror } from "react-icons/go";
import { BsGrid3X3GapFill } from "react-icons/bs";
import { MdOutlineTabUnselected } from "react-icons/md";
import {ClipboardMenu, DeleteMenu, SelectMenu} from "./MiniControlsMenu";
import {useContext, useState} from "react";
import {StateContext} from "../Contexts";
import {ExtraButton} from "./MenuUtils";
import {extraSlots as _extraSlots} from "../utils";

var tapHolding = false
var touchHoldTimer = null
var redid = false

function DesktopMainMenu(){
    const [state, dispatch] = useContext(StateContext)
    return <>
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
        {/* The menus */}
        {state.openMenus.controls   && <ControlsMenu/>}
        {state.openMenus.color      && <ColorMenu/>}
        {state.openMenus.navigation && <NavMenu/>}
        {state.openMenus.mirror     && <MirrorMenu/>}
        {state.openMenus.repeat     && <RepeatMenu/>}
        {state.openMenus.file       && <FileMenu/>}
        {state.openMenus.settings   && <SettingsMenu/>}
        {state.openMenus.help       && <HelpMenu/>}
    </>
}

function MobileMainMenu(){
    const [state, dispatch] = useContext(StateContext)
    const {side} = state
    const [, doReload] = useState()

    function undoOnTouchHold(){
        if (tapHolding){
            redid = true
            dispatch({action: 'redo'})
            tapHolding = false
        }
    }

    function undoOnTouchStart(){
        setTimeout(() => tapHolding = true, 10)
        touchHoldTimer = setTimeout(undoOnTouchHold, state.holdTapTimeMS)
    }

    function undoOnTouchEnd(){
        clearTimeout(touchHoldTimer)
        tapHolding = false
        if (!redid){
            dispatch({action: 'undo'})
        }
        redid = false
    }

    // Reload this component when the window resizes, so extraSlots updates
    window.addEventListener('resize', doReload)

    let style = {}
    switch (side) {
        case 'right': style = {right: '0px'}
        case 'left':
            style = {...style,
                flexDirection: 'column-reverse',
                height: '93%',
            }
            break
        case 'bottom': style = {bottom: "0px",}
        case 'top':
            style = {...style,
                flexDirection: 'row',
                width: '93%',
            }
    }

    const extraSlots = _extraSlots(state)

    return <>
        <div id='menu-selector-mobile' style={style}>
            {extraSlots < 5 && <> {/*extra */}
                <button onClick={() => {dispatch({action: "menu", toggle: "extra"})}}
                    className="menu-toggle-button-mobile"
                    id="extra-menu-button"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                    }}
                > <BsGrid3X3GapFill className="main-menu-icon" />
                </button>
                {state.openMenus.extra && <ExtraMenu align="extra-menu-button"/>}
            </>}
            {extraSlots >= 3 && <> {/*extra button */}
                <ExtraButton mainMenu={true} style={{visibility: state.openMenus.main ? 'visible': "hidden"}}/>
            </>}
            {extraSlots >= 5 && <> {/*help */}
                <button onClick={() => {dispatch({action: "menu", toggle: "help", close: "extra"})}}
                    className="menu-toggle-button-mobile extra-button"
                    style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
                > <MdHelp className="main-menu-icon"/>
                </button>
            </>}
            {extraSlots >= 5 && <> {/*settings */}
                <button onClick={() => {dispatch({action: "menu", toggle: "settings", close: "extra"})}}
                    className="menu-toggle-button-mobile extra-button"
                    style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
                > <IoMdSettings className="main-menu-icon"/>
                </button>
            </>}
            {extraSlots >= 4 && <> {/*file */}
                <button onClick={() => {dispatch({action: "menu", toggle: "file", close: "extra"})}}
                    className="menu-toggle-button-mobile extra-button"
                    style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
                > <FaSave className="main-menu-icon"/>
                </button>
            </>}
            {extraSlots >= 2 && <> {/*navigation */}
                <button onClick={() => {dispatch({action: "menu", toggle: "navigation", close: "extra"})}}
                    className="menu-toggle-button-mobile extra-button"
                    style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
                > <RiNavigationFill className="main-menu-icon"/>
                </button>
            </>}
            {extraSlots >= 1 && <> {/*repeat */}
                <button onClick={() => {dispatch({action: "menu", toggle: "repeat", close: "extra"})}}
                    className="menu-toggle-button-mobile extra-button"
                    style={{visibility: state.openMenus.main ? 'visible': "hidden"}}
                >   <MdDashboard className="main-menu-icon"/>
                </button>
            </>}
            <> {/*color */}
                <button onClick={() => {dispatch({action: "menu", toggle: "color"})}}
                    className="menu-toggle-button-mobile"
                    id="color-menu-button"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                    }}
                > <MdColorLens className="main-menu-icon"/>
                </button>
                {state.openMenus.color && <ColorMenu align="color-menu-button" />}
            </>
            <> {/*undo */}
                {/* Undo menu */}
                {/* <button onClick={() => {dispatch({action: "menu", toggle: "undo"})}}
                    className="menu-toggle-button-mobile"
                    id="undo-menu-button"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                    }}
                > <MdUndo className="main-menu-icon"/>
                </button>
                {state.openMenus.undo && <UndoMenu align="undo-menu-button" />} */}
                {/* Undo button */}
                <button onTouchStart={undoOnTouchStart}
                    onTouchEnd={undoOnTouchEnd}
                    id="undo-button"
                    className="menu-toggle-button-mobile"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                        backgroundColor: state.mirroring ? "gray" : "transparent"
                    }}
                >   <MdUndo className="main-menu-icon"/>
                </button>
            </>
            <> {/*mirror */}
                <button onClick={() => {dispatch({action: "menu", toggle: "mirror"})}}
                    className="menu-toggle-button-mobile"
                    id="mirror-menu-button"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                        backgroundColor: state.mirroring ? "gray" : "transparent"
                    }}
                > <GoMirror className="main-menu-icon"/>
                </button>
                {state.openMenus.mirror && <MirrorMenu align="mirror-menu-button" />}
            </>
            <> {/*select */}
                <button onClick={() => {dispatch({action: "menu", toggle: "select"})}}
                    className="menu-toggle-button-mobile"
                    id="select-menu-button"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                    }}
                > <MdOutlineTabUnselected className="main-menu-icon"/>
                </button>
                {state.openMenus.select && <SelectMenu align="select-menu-button" />}
            </>
            <> {/*clipboard */}
                <button onClick={() => {dispatch({action: "menu", toggle: "clipboard"})}}
                    className="menu-toggle-button-mobile"
                    id="clipboard-menu-button"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                    }}
                > <MdContentCopy className="main-menu-icon"/>
                </button>
                {state.openMenus.clipboard && <ClipboardMenu align="clipboard-menu-button" />}
            </>
            <> {/*delete */}
                <button onClick={() => {dispatch({action: "menu", toggle: "delete"})}}
                    className="menu-toggle-button-mobile"
                    id="delete-menu-button"
                    style={{
                        visibility: state.openMenus.main ? 'visible': "hidden",
                        pointerEvents: state.openMenus.main ? 'all' : 'none',
                    }}
                > <MdDelete className="main-menu-icon"/>
                </button>
                {state.openMenus.delete && <DeleteMenu align="delete-menu-button" />}
            </>
            {/* The menu button in the corner */}
            <button onClick={() => dispatch({action: "menu", toggle: "main"})}
                className="menu-toggle-button-mobile"
            > <FaBars color="black" id='menu-icon'/>
            </button>
        </div>

        {/* The menus */}
        {state.openMenus.navigation && <NavMenu/>}
        {state.openMenus.repeat     && <RepeatMenu/>}
        {state.openMenus.file       && <FileMenu/>}
        {state.openMenus.settings   && <SettingsMenu/>}
        {state.openMenus.help       && <HelpMenu/>}
    </>
}

export default function MainMenu(){
    return <MobileMainMenu/>
        // : <DesktopMainMenu/>
        // : <MobileMainMenu side={true}/>
}
