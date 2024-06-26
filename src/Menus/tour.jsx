import {mobileAndTabletCheck} from "../utils";

const LOAD_DELAY = 10

const tour = _dispatch => {
    // We have to use this, because the selector selects *before* the action runs, so we need to stick an intermediate
    // step in to open the menu, wait for it to load, and then go to the next step
    const dispatch = args => ({
        content: ({goTo, step}) => setTimeout(() => goTo(step), LOAD_DELAY),
        action: () => _dispatch(args)
    })
    const menu = args => dispatch({action: "menu", ...args})
    const mobile = mobileAndTabletCheck()

    return [
        {content: <>Welcome to GeoDoodle! This is a doodle program, but <em>not</em> a drawing program. All the lines are intended to line up with the dots. This lets you repeat patterns in interesting ways.</>},
        {   selector: "#menu-selector-mobile",
            content: "This is the control bar. You can click the button on the far right to hide it. You can also change the side of the screen it sticks to in settings.",
        },
        menu({open: 'color'}),
        {   selector: "#color-picker-mobile-actual",
            content: "This is the color menu. You can use this to set the color and transparency of the lines."
        },
        {   selector: "#color-profile-buttons",
            content: "These let you keep track of multiple color/stroke/dashes induvidually, so you can swap back and forth quickly." + (!mobile && ' You can also use the number keys to switch between them.'),
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
            content: "Use this button to add bounds: points which select an area. " + (mobile ? "You can also tap and hold" : "You can also press 'b'") +  "to add a bound."
        },
        {   selector: "#clear-selection",
            content: "This button clears the current selection."
        },
        {   selector: "#partial-picker",
            content: "This determines whether you want to include \"partials\" in the selected pattern or not. Partials are lines that only have one end inside the selected area."
        },
        menu({open: 'clipboard'}),
        {   selector: "#clipboard-menu",
            content: "These are your standard copy, cut, and paste buttons. " + (mobile ? "When you're copying, you can long tap to paste, and double tap to cancel." : "They follow the standard keyboard shortcuts.")
        },
        menu({open: 'delete'}),
        {   selector: "#delete-lines",
            content: "This button deletes all the lines attached to a selected point. " + (mobile ? "You can also double tap on a point to do the same thing." : "You can also press the delete key to do the same thing."),
        },
        {   selector: "#delete-line",
            content: "This button lets you erase a specific line. You press it once to leave a marker on one end of a line, and when you press it again on the other end of the line, it only deletes that line." + (!mobile && ' Backspace does the same thing.')
        },
        {   selector: "#delete-selected",
            content: "These buttons let you erase everything in the selection, or everything except what's in the selection.",
            highlightedSelectors: ['#delete-unselected']
        },
        {   selector: "#clear-all",
            content: "This button clears all the lines. Careful!"
        },
        menu({open: 'extra'}),
        // {   selector: "#extra-menu",
        //     content: "Here are some more menus.",
        // },
        {   selector: ".bonus-button",
            content: "This button is customizable in settings, for easy access",
        },
        menu({open: 'navigation', close: 'extra'}),
        {   selector: "#nav-menu",
            content: "This is the navigation menu. You can set the current position and scale here manually, or you can " + (mobile ? "use 2 fingers to move and spread 2 fingers to scale." : "scroll to move vertically, shift+scroll to move horizontally, and ctrl+scroll to scale."),
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
        ...(mobile ? [{   selector: "#repeat-right",
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
        }] : []),
        menu({close: 'repeat'}),
        // {content: "A few last things. "}
        {content: "And that's it! There's also File and Settings menus, but I think you can figure them out yourself. If you have any problems, suggestions, or questions, feel free to email me at smartycope@gmail.com."},
    ]
}
    export default tour
