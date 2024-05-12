import {useState} from 'react';
import Tour from 'reactour'
import "./HelpMenu.css"

import { IoClose } from "react-icons/io5";

const steps = [
    {content: 'Welcome to GeoDoodle! This is a guided tour cause I can do that now.'},
    {   selector: '#controls-menu',
        content: 'This is the controls bar. You can drag it to move it if you\'d like.'
    },
    {   selector: '#mirror-buttons',
        content: 'GeoDoodle has a lot of mirroring features'
    },
    {   selector: '#mirror-type',
        content: 'This is the mirror type. You can have it mirror across the whole page, or just relative to the cursor'
    },
    {   selector: '#mirror-method',
        content: 'This is the mirror method. You can mirror by "mirroring" lines across an axis, or by rotating round the center, or both'
    },
    {   selector: '#mirror-axis-1',
        content: 'This is the mirror axis. Use it to specify what axis to mirror across, or what angle to rotate to'
    },
    {   selector: "#add-bound",
        content: "Use this button on mobile to add bounds, or on desktop, just press 'b'"
    },
    {   selector: '#clear-selection',
        content: 'This button clears the current selection'
    },
    {   selector: '#partial-picker',
        content: 'This determins whether we want to include "partials" in the selection or not. Partials are lines that only have 1 end inside the selected area'
    },
    {   selector: '#clear-all',
        content: 'This button clears all the lines. Careful!'
    },
    {   selector: '#copy-buttons',
        content: 'These are your standard copy, cut, and paste buttons. They also follow the usual keyboard shortcuts'
    },
    {   selector: '#undo-buttons',
        content: 'These are your standard undo/redo buttons. You may have to press undo multiple times'
    },
    {   selector: '#home-button',
        content: 'This button resets the position and scale to the starting position and scale'
    },
    // {   selector: '#',
    //     content: ''
    // },
    // {   selector: '#',
    //     content: ''
    // },
    // {   selector: '#',
    //     content: ''
    // },
]

export function HelpMenu({state, dispatch, setControlsVisible, close}){
    const [inTour, setInTour] = useState(false);

    function startTour(){
        setControlsVisible(true)
        setInTour(true)
        dispatch({action: 'start tour'})
    }

    function endTour(){
        setControlsVisible(false)
        setInTour(false)
        dispatch({action: 'end tour'})
    }

    return <div>
        {!inTour && <div id='help-menu'>
            <button id='close-button' onClick={close}><IoClose /></button>
            <h3>Welcome to GeoDoodle!</h3> <br/>
            This is a drawing program that emulates doodling on graph paper<br/>
            All the lines are intended to line up with the dots
            You can click to draw lines, copy, paste, and mirror lines <br/>
            This is the roadmap of major features: <br/>
            <ul>
                <li>✅ Selection</li>
                <li>✅ Controls Menu</li>
                <li>✅ Mirroring</li>
                <li>✅ Colors &amp; Stroke Patterns</li>
                <li>✅ File Handling</li>
                <li>☑️ Mobile Compatibility</li>
                <li>❌ Repeating</li>
                <li>❌ Settings</li>
                <li>❌ Connect to Google Drive</li>
                <li>❌ Alternate Dot Patterns</li>
                <li>❌ Custom Keyboard Shortcuts</li>
                <li>❌ App</li>
                <li>❌ Curved Lines</li>
                {/* <li>Lines from line intersections: ❌</li> */}
            </ul>
            {/* <div id='expanding'/> */}
            <span>
                <button id='tour-button' onClick={startTour}>Start tour</button>
                {/* <button id='close-button' onClick={close}>Close</button> */}
            </span>
        </div>}
        <Tour
            steps={steps}
            isOpen={inTour}
            onRequestClose={endTour}
            // onAfterOpen={close}
            accentColor='BlanchedAlmond'
            // disableDotsNavigation
            // getCurrentStep
            rounded={8}
            showNavigationNumber={false}
            showNumber={false}
            showNavigation={false}
        />
    </div>
}
