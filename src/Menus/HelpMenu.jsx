import "../styling/HelpMenu.css"

import { IoClose } from "react-icons/io5";
import { version } from "../../package.json"
import {InTourContext, StateContext} from "../Contexts";
import {useContext} from "react";


// eslint-disable-next-line no-unused-vars
export function HelpMenu(){
    const [state, dispatch] = useContext(StateContext)
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
        This is the roadmap of major features:
        <ul>
            <li>✅ Selection</li>
            <li>✅ Controls Menu</li>
            <li>✅ Mirroring</li>
            <li>✅ Colors &amp; Stroke Patterns</li>
            <li>✅ File Handling</li>
            <li>✅ Settings</li>
            <li>✅ Repeating</li>
            <li>✅ Mobile Compatibility</li>
            <li>❌ Connect to Google Drive</li>
            <li>❌ Alternate Dot Patterns</li>
            <li>❌ Custom Keyboard Shortcuts</li>
            <li>❌ App</li>
            <li>❌ Curved Lines</li>
            {/* <li>Lines from line intersections: ❌</li> */}
        </ul>
        This is a passion project of Copeland Carter.
        To see one of the other things he&apos;s really proud of,
        check out <a href='http://ezregex.org/'>EZRegex.org</a>! <br/>
        This project is entirely open source, and the code is available on
        <a href='https://github.com/smartycope/geodoodle'>GitHub</a>
        <span>
            <button id='tour-button' onClick={() => {dispatch({action: "start tour"}); setInTour(true)}}>
                Start full tour
            </button>
        </span>
        <footer id='version'>v{version}</footer>
    </div>
}
