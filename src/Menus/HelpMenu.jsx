import "../styling/HelpMenu.css"

import { IoClose } from "react-icons/io5";
import {version} from '../globals';
import {InTourContext, StateContext} from "../Contexts";
import {useContext} from "react";
import Page from "./Page";
import { Typography } from "@mui/material";


// eslint-disable-next-line no-unused-vars
function HelpMenu(){
    const {state, dispatch} = useContext(StateContext)
    const setInTour = useContext(InTourContext)
    const {side} = state

    return <div id='help-menu'>
        <button id='close-button' onClick={() => dispatch({action: "menu", close: "help"})}>
            <IoClose />
        </button>
        <h3>Welcome to GeoDoodle!</h3>
        This is a drawing program that emulates doodling on graph paper.
        All the lines are intended to line up with the dots. <br/>
        {/* You can click to draw lines, copy, paste, and mirror lines <br/> */}
        This is a rough roadmap of major features:
        <ul>
            <li>✅ Selection</li>
            <li>✅ Controls Menu</li>
            <li>✅ Mirroring</li>
            <li>✅ Colors &amp; Stroke Patterns</li>
            <li>✅ File Handling</li>
            <li>✅ Settings</li>
            <li>✅ Repeating</li>
            <li>✅ Mobile Compatibility</li>
            <li>❌ Allow lines to be drawn from line intersections</li>
            <li>❌ Connect to Google Drive</li>
            <li>❌ Alternate Dot Patterns</li>
            <li>❌ Custom Keyboard Shortcuts</li>
            <li>❌ App</li>
            <li>❌ Curved Lines</li>
        </ul>
        This is a passion project of Copeland Carter.
        To see one of the other things he&apos;s really proud of,
        check out <a href='http://ezregex.org/'>EZRegex.org</a>! <br/>
        This project is entirely open source, and the code is available
        on <a href='https://github.com/smartycope/geodoodle'>GitHub</a>
        <span>
            <button id='tour-button' onClick={() => {dispatch('start_tour'); setInTour(true)}}>
                Start full tour
            </button>
        </span>
        <footer id='version'>v{version}</footer>
    </div>
}

// eslint-disable-next-line no-unused-vars
function HelpMenuMui(){
    const {state, dispatch} = useContext(StateContext)
    const setInTour = useContext(InTourContext)
    const {side} = state



    return <Page menu='help' title='Welcome to GeoDoodle!'>
        <Typography >This is a drawing program that emulates doodling on graph paper.
        All the lines are intended to line up with the dots. <br/>
        {/* You can click to draw lines, copy, paste, and mirror lines <br/> */}
        This is a rough roadmap of major features:</Typography>
        <ul>
            <li>✅ Selection</li>
            <li>✅ Controls Menu</li>
            <li>✅ Mirroring</li>
            <li>✅ Colors &amp; Stroke Patterns</li>
            <li>✅ File Handling</li>
            <li>✅ Settings</li>
            <li>✅ Repeating</li>
            <li>✅ Mobile Compatibility</li>
            <li>❌ Allow lines to be drawn from line intersections</li>
            <li>❌ Connect to Google Drive</li>
            <li>❌ Alternate Dot Patterns</li>
            <li>❌ Custom Keyboard Shortcuts</li>
            <li>❌ App</li>
            <li>❌ Curved Lines</li>
        </ul>
        This is a passion project of Copeland Carter.
        To see one of the other things he&apos;s really proud of,
        check out <a href='http://ezregex.org/'>EZRegex.org</a>! <br/>
        This project is entirely open source, and the code is available
        on <a href='https://github.com/smartycope/geodoodle'>GitHub</a>
        <span>
            <button id='tour-button' onClick={() => {dispatch('start_tour'); setInTour(true)}}>
                Start full tour
            </button>
        </span>
        <footer id='version'>v{version}</footer>
    </Page>
}

export default HelpMenuMui