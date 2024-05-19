import React from "react";
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
import { MdHome } from "react-icons/md";
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdUndo } from "react-icons/md";
import { MdRedo } from "react-icons/md";
import { GiNuclear } from "react-icons/gi";
import { FaGripLinesVertical } from "react-icons/fa6";
import { PiSelectionPlusDuotone } from "react-icons/pi";
import { PiSelectionSlashDuotone } from "react-icons/pi";
import { MdDelete } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { MdColorLens } from "react-icons/md";
import { FaSliders } from "react-icons/fa6";
import { MdDashboard } from "react-icons/md";
import { FaBars } from "react-icons/fa6";
import { MdHelp } from "react-icons/md";
import { IoMdSettings } from "react-icons/io";
import { CgMenuGridR } from "react-icons/cg";
import { RiNavigationFill } from "react-icons/ri";
import {GoMirror} from "react-icons/go";
import { CgMenuGridO } from "react-icons/cg";
import { BsGrid3X3GapFill } from "react-icons/bs";
import { MdOutlineTabUnselected } from "react-icons/md";
import {ClipboardMenu, DeleteMenu, SelectMenu, UndoMenu} from "./MiniControlsMenu";


export default function MainMenu({dispatch, state}){
    if (!state.mobile)
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
            {state.openMenus.controls   && <ControlsMenu dispatch={dispatch} state={state}/>}
            {state.openMenus.color      && <ColorMenu    dispatch={dispatch} state={state}/>}
            {state.openMenus.navigation && <NavMenu      dispatch={dispatch} state={state}/>}
            {state.openMenus.mirror     && <MirrorMenu   dispatch={dispatch} state={state}/>}
            {state.openMenus.repeat     && <RepeatMenu   dispatch={dispatch} state={state}/>}
            {state.openMenus.file       && <FileMenu     dispatch={dispatch} state={state}/>}
            {state.openMenus.settings   && <SettingsMenu dispatch={dispatch} state={state}/>}
            {state.openMenus.help       && <HelpMenu     dispatch={dispatch} state={state}/>}
        </>
    else
        return <>
            <div id='menu-selector-mobile' >
                <> {/*extra */}
                    <button onClick={() => {dispatch({action: "menu", toggle: "extra"})}}
                        className="menu-toggle-button-mobile"
                        id="extra-menu-button"
                        style={{
                            visibility: state.openMenus.main ? 'visible': "hidden",
                            pointerEvents: state.openMenus.main ? 'all' : 'none',
                        }}
                    > <BsGrid3X3GapFill className="main-menu-icon" />
                    </button>
                    {state.openMenus.extra && <ExtraMenu dispatch={dispatch} state={state} align="extra-menu-button"/>}
                </>
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
                    {state.openMenus.color && <ColorMenu dispatch={dispatch} state={state} align="color-menu-button" />}
                </>
                <> {/*undo */}
                    <button onClick={() => {dispatch({action: "menu", toggle: "undo"})}}
                        className="menu-toggle-button-mobile"
                        id="undo-menu-button"
                        style={{
                            visibility: state.openMenus.main ? 'visible': "hidden",
                            pointerEvents: state.openMenus.main ? 'all' : 'none',
                        }}
                    > <MdUndo className="main-menu-icon"/>
                    </button>
                    {state.openMenus.undo && <UndoMenu dispatch={dispatch} state={state} align="undo-menu-button" />}
                </>
                <> {/*mirror */}
                    <button onClick={() => {dispatch({action: "menu", toggle: "mirror"})}}
                        className="menu-toggle-button-mobile"
                        id="mirror-menu-button"
                        style={{
                            visibility: state.openMenus.main ? 'visible': "hidden",
                            pointerEvents: state.openMenus.main ? 'all' : 'none',
                        }}
                    > <GoMirror className="main-menu-icon"/>
                    </button>
                    {state.openMenus.mirror && <MirrorMenu dispatch={dispatch} state={state} align="mirror-button-menu" />}
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
                    {state.openMenus.select && <SelectMenu dispatch={dispatch} state={state} align="select-menu-button" />}
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
                    {state.openMenus.clipboard && <ClipboardMenu dispatch={dispatch} state={state} align="clipboard-menu-button" />}
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
                    {state.openMenus.delete && <DeleteMenu dispatch={dispatch} state={state} align="delete-menu-button" />}
                </>
                {/* The menu button in the corner */}
                <button onClick={() => dispatch({action: "menu", toggle: "main"})}
                    className="menu-toggle-button-mobile"
                > <FaBars color="black" id='menu-icon'/>
                </button>

            </div>
            {/* The menus */}
            {/* {state.openMenus.controls   && <ControlsMenu dispatch={dispatch} state={state}/>} */}
            {/* {state.openMenus.color      && <ColorMenu    dispatch={dispatch} state={state}/>} */}
            {state.openMenus.navigation && <NavMenu      dispatch={dispatch} state={state}/>}
            {/* {state.openMenus.mirror     && <MirrorMenu   dispatch={dispatch} state={state}/>} */}
            {state.openMenus.repeat     && <RepeatMenu   dispatch={dispatch} state={state}/>}
            {state.openMenus.file       && <FileMenu     dispatch={dispatch} state={state}/>}
            {state.openMenus.settings   && <SettingsMenu dispatch={dispatch} state={state}/>}
            {state.openMenus.help       && <HelpMenu     dispatch={dispatch} state={state}/>}
        </>
}
