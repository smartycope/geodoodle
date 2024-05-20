import {useState} from 'react';
import Tour from 'reactour'
import "../styling/HelpMenu.css"

import { IoClose } from "react-icons/io5";
import {version} from '../globals';


export function HelpMenu({state, dispatch}){
    const [inTour, setInTour] = useState(false);

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
        {   selector: '#copy-buttons',
        content: 'These are your standard copy, cut, and paste buttons. They also follow the usual keyboard shortcuts'
        },
        {   selector: '#clear-all',
            content: 'This button clears all the lines. Careful!'
        },
        {   selector: '#delete-lines',
            content: 'This button deletes all the lines attached to a point. On desktop, just press the delete key'
        },
        {   selector: '#delete-line',
            content: 'This button lets you erase a specific line. You press it once to leave a marker on one end of a line, and when you press it again on the other end of the line, it only deletes the line that starts and ends at the 2 points you specified. On desktop, it\'s the backspace key'
        },
        {   selector: '#undo-buttons',
            content: 'These are your standard undo/redo buttons. You may have to press undo multiple times to undo a line completely'
        },
        {   selector: '#home-button',
            content: 'This button resets the position and scale to the starting position and scale'
        },
        {   selector: '#color-menu',
            content: 'This is the color menu'
        },
        {   selector: '#color-picker-button',
            content: 'Use this to set the color of the current line'
        },
        {   selector: '#recent-color-buttons',
            content: 'As you select colors, these buttons keep your most recently used colors. You can click on them to jump back to that color',
            // action: () => dispatch({action: 'add common color', color: '#ff0000'})
        },
        {   selector: '#stoke-input-area',
            content: 'The stroke is the width of the line. It scales with the page'
        },
        {   selector: '#dash-input-area',
            content: 'This lets you specify the "dash code". It lets you draw customized dashed lines.',
            // action: () => dispatch({action: 'set manual', dash: '#'})
        },
        {   selector: '#dashed-line',
            content: 'This is what a dash code of "20, 10" looks like. To draw a solid line, just put "0"'
        },
        // {   selector: '#',
        //     content: ''
        // },
        // {   selector: '#',
        //     content: ''
        // },
        {content: 'That\'s all! Happy doodling!'},
    ]

    function startTour(){
        setInTour(true)
        dispatch({action: 'start tour'})
    }

    function endTour(){
        setInTour(false)
        dispatch({action: 'end tour'})
    }

    return <div>
        {!inTour && <div id='help-menu'>
            <button id='close-button' onClick={() => dispatch({action: "menu", close: "help"})}>
                <IoClose />
            </button>
            <h3>Welcome to GeoDoodle!</h3> <br/>
            This is a drawing program that emulates doodling on graph paper<br/>
            All the lines are intended to line up with the dots <br/>
            {/* You can click to draw lines, copy, paste, and mirror lines <br/> */}
            This is the roadmap of major features: <br/>
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
            This is the (a) passion project of Copeland Carter. <br/>
            To see one of the other things he's really proud of,
            check out <a href='http://ezregex.org/'>EZRegex.org</a>! <br/>
            This project is entirely open source, and the code is available on
            <a href='https://github.com/smartycope/geodoodle'>GitHub</a>
            <span>
                <button id='tour-button' onClick={startTour}>Start full tour</button>
                {/* <button id='close-button' onClick={close}>Close</button> */}
            </span>
            <footer className='footer'>v{version}</footer>
        </div>}
        <Tour
            steps={steps}
            isOpen={inTour}
            onRequestClose={endTour}
            // onAfterOpen={close}
            accentColor='BlanchedAlmond'
            // disableDotsNavigation
            // getCurrentStep
            startAt={15}
            rounded={8}
            showNavigationNumber={false}
            showNumber={false}
            showNavigation={false}
        />
    </div>
}
