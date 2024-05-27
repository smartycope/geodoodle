const LOAD_DELAY = 10

const tour = _dispatch => {
    // We have to use this, because the selector selects *before* the action runs, so we need to stick an intermediate
    // step in to open the menu, wait for it to load, and then go to the next step
    const dispatch = args => ({
        content: ({goTo, step}) => setTimeout(() => goTo(step), LOAD_DELAY),
        action: () => _dispatch(args)
    })
    const menu = args => dispatch({action: "menu", ...args})

    return {
    "desktop": [
        {content: "Welcome to GeoDoodle! This is a guided tour cause I can do that now. Warning: the desktop tutorial *might* be broken at the moment, but the mobile tutorial works"},
        {   selector: "#controls-menu",
            content: "This is the controls bar. You can drag it to move it if you\"d like."
        },
        {   selector: "#mirror-buttons",
            content: "GeoDoodle has a lot of mirroring features"
        },
        {   selector: "#mirror-type",
            content: "This is the mirror type. You can have it mirror across the whole page, or just relative to the cursor"
        },
        {   selector: "#mirror-method",
            content: "This is the mirror method. You can mirror by 'mirrorin' lines across an axis, or by rotating round the center, or both"
        },
        {   selector: "#mirror-axis-1",
            content: "This is the mirror axis. Use it to specify what axis to mirror across, or what angle to rotate to"
        },
        {   selector: "#add-bound",
            content: "Use this button on mobile to add bounds, or on desktop, just press 'b'"
        },
        {   selector: "#clear-selection",
            content: "This button clears the current selection"
        },
        {   selector: "#partial-picker",
            content: "This determins whether we want to include 'partials' in the selection or not. Partials are lines that only have 1 end inside the selected area"
        },
        {   selector: "#copy-buttons",
            content: "These are your standard copy, cut, and paste buttons. They also follow the usual keyboard shortcuts"
        },
        {   selector: "#clear-all",
            content: "This button clears all the lines. Careful!"
        },
        {   selector: "#delete-lines",
            content: "This button deletes all the lines attached to a point. On desktop, just press the delete key"
        },
        {   selector: "#delete-line",
            content: "This button lets you erase a specific line. You press it once to leave a marker on one end of a line, and when you press it again on the other end of the line, it only deletes the line that starts and ends at the 2 points you specified. On desktop, it\"s the backspace key"
        },
        {   selector: "#undo-buttons",
            content: "These are your standard undo/redo buttons. You may have to press undo multiple times to undo a line completely"
        },
        {   selector: "#home-button",
            content: "This button resets the position and scale to the starting position and scale"
        },
        {   selector: "#color-menu",
            content: "This is the color menu"
        },
        {   selector: "#color-picker-button",
            content: "Use this to set the color of the current line"
        },
        {   selector: "#recent-color-buttons",
            content: "These induvidually keep track of ",
        },
        {   selector: "#stoke-input-area",
            content: "The stroke is the width of the line. It scales with the page"
        },
        {   selector: "#dash-input-area",
            content: "This lets you specify the 'dash code'. It lets you draw customized dashed lines.",
        },
        {   selector: "#dashed-line",
            content: "This is what a dash code of '20, 10' looks like. To draw a solid line, just put '0'"
        },
        // {   selector: "#",
        //     content: ""
        // },
        // {   selector: "#",
        //     content: ""
        // },
        {content: "That\"s all! Happy doodling!"},
    ],
    "mobile": [
        {content: <>Welcome to GeoDoodle! This is a doodle program, but <em>not</em> a drawing program. All the lines are intended to line up with the dots. This lets you repeat patterns in interesting ways.</>},
        {   selector: "#menu-selector-mobile",
            content: "This is the control bar. You can click the button on the far right to hide it.",
        },
        menu({open: 'color'}),
        {   selector: "#color-picker-mobile-actual",
            content: "This is the color menu. You can use this to set the color and transparency of the lines."
        },
        {   selector: "#color-profile-buttons",
            content: "These let you keep track of multiple color/stroke/dashes induvidually, so you can swap back and forth quickly.",
        },
        {   selector: "#stroke-input",
            content: "The stroke is the width of the line. It scales with the page."
        },
        {   selector: "#dash-input",
            content: "This lets you specify the \"dash code\". It lets you draw customized dashed lines. To draw a solid line, just put \"0\".",
            highlightedSelectors: ['#color-menu-close-button']
        },
        menu({close: 'color'}),
        // {   selector: "#dashed-line",
        //     content: "For example, this is what a dash code of \"20, 10\" looks like. To draw a solid line, just put \"0\"."
        // },
        {   selector: "#undo-button",
            content: "This is the undo button. Tap to undo, and tap and hold to redo."
        },
        menu({open: 'mirror'}),
        {   selector: "#mirror-menu-mobile",
            content: "This is the mirror menu.",
        },
        {   selector: "#mirror-enabled",
            content: "This lets you keep mirroring after you close the menu.",
        },
        {   selector: "#mirror-type",
            content: "This is the mirror type. You can have it mirror across the whole page, or around the cursor."
        },
        {   selector: "#mirror-method",
            content: "This is the mirror method. You can mirror by flipping lines across an axis, by rotating round the center, or both."
        },
        {   selector: "#mirror-axis-1",
            content: "This is the mirror axis. You can use it to specify what axis to mirror across/what angle to rotate to."
        },
        menu({open: "select"}),
        {   selector: "#select-menu",
            content: "This is the selection menu."
        },
        {   selector: "#add-bound",
            content: "Use this button to add bounds: points which select an area. You can also tap and hold to add a bound."
        },
        {   selector: "#clear-selection",
            content: "This button clears the current selection."
        },
        {   selector: "#partial-picker",
            content: "This determines whether you want to include \"partials\" in the selected pattern or not. Partials are lines that only have one end inside the selected area."
        },
        menu({open: 'clipboard'}),
        {   selector: "#clipboard-menu",
            content: "These are your standard copy, cut, and paste buttons. When you're copying, you can long tap to paste, and double tap to cancel."
        },
        menu({open: 'delete'}),
        {   selector: "#delete-lines",
            content: "This button deletes all the lines attached to a selected point. You can also double tap on a point to do the same thing."
        },
        {   selector: "#delete-line",
            content: "This button lets you erase a specific line. You press it once to leave a marker on one end of a line, and when you press it again on the other end of the line, it only deletes that line."
        },
        {   selector: "#delete-selected",
            content: "These buttons let you erase everything in the selection, or everything except what's in the selection.",
            highlightedSelectors: ['#delete-unselected']
        },
        {   selector: "#clear-all",
            content: "This button clears all the lines. Careful!"
        },
        menu({open: 'extra'}),
        {   selector: "#extra-menu",
            content: "Here are some more menus.",
        },
        {   selector: ".bonus-button",
            content: "This button is customizable in settings, for easy access",
        },
        menu({open: 'navigation', close: 'extra'}),
        {   selector: "#nav-menu",
            content: "This is the navigation menu. You can set the current position and scale here manually, or you can use 2 fingers to move and spread 2 fingers to scale.",
        },
        {   selector: "#home-button",
            content: "This button resets the position and scale to the starting position and scale.",
        },
        {   selector: "#nav-selection-button",
            content: "This moves you to the current selection.",
        },
        menu({open: 'repeat', close: 'navigation'}),
        {   position: "bottom",
            content: "This is the repeat menu. You can use it to tesselate the selected pattern across the page." // copy instead of tesselate?
        },
        {   selector: "#repeat-right",
            content: "This side lets you select transformations to apply to the pattern. They each have different options."
        },
        {   selector: "#repeat-left",
            content: "This side lets you specify how to apply the associated transformations. For instance, \"every 3 rows, rotate the pattern 90°\"."
        },
        {
            content: ({goTo, step}) => setTimeout(() => goTo(step), LOAD_DELAY),
            action: () => document.querySelector('#settings-summary').click(),
        },
        {   selector: "#repeat-settings-reset",
            content: "You can use this button to reset to the original settings."
        },
        {   selector: "#repeat-settings-hide-dots",
            content: "And this button to hide the dots. There's a similar button in settings as well."
        },
        menu({close: 'repeat'}),
        // {content: "A few last things. "}
        {content: "And that's it! There's also File and Settings menus, but I think you can figure them out yourself. If you have any problems, suggestions, or questions, feel free to email me at smartycope@gmail.com."},
    ]}}
    export default tour
