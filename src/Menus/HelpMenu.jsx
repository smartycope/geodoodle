import {useState} from 'react';
import Tour from 'reactour'
import "../styling/HelpMenu.css"

import { IoClose } from "react-icons/io5";
import {localStorageTourTakenName, version} from '../globals';


export function HelpMenu({state, dispatch, setInTour}){
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
        This is a passion project of Copeland Carter, Computer Goblin.
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
