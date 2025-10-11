import { isMobile } from "../utils"

const LOAD_DELAY = 10
let alreadyHappened = {}

// TODO: For some reason *which is a later problem* the tour actions seem to be running *six times*, and with inconsistent
// timing. Why, I don't know. Probably has something to do with the StrictMode warning it keeps giving me with no
// stack trace
// To work around this, alreadyHappened is used to make sure the actions only run once
const tour = (_dispatch) => {
  // We have to use this, because the selector selects *before* the action runs, so we need to stick an intermediate
  // step in to open the menu, wait for it to load, and then go to the next step
  const dispatch = (args) => ({
    content: ({ goTo, step }) => {
      setTimeout(() => goTo(step), LOAD_DELAY)
      return <></>
    },
    action: () => _dispatch(args),
  })
  const clickOn = (selector, delay = LOAD_DELAY) => ({
    content: ({ goTo, step }) => {
      setTimeout(() => goTo(step), delay)
      return <></>
    },
    action: () => {
      const el = document.querySelector(selector)
      if (el && !alreadyHappened[selector]) {
        console.log("clicking on", selector)
        el.click()
        alreadyHappened[selector] = true
      } else console.log("already clicked on or can't find", el)
    },
  })
  const menu = (args) => dispatch({ action: "menu", ...args })
  const mobile = isMobile()

  return [
    {
      content: (
        <>
          Welcome to GeoDoodle! This is a doodle program, but <em>not</em> a drawing program. All the lines are intended
          to line up with the dots. This lets you repeat patterns in interesting ways.
          <br />
          <br />
          Let&apos;s walk through some of the basics
        </>
      ),
      actionAfter: () => (alreadyHappened = {}),
    },
    {
      selector: "#menu-selector-mobile",
      content: (
        <>
          This is the toolbar. You can click the button on the far right to minimize it. You can also change the side of
          the screen it sticks to in settings.
        </>
      ),
    },
    menu({ open: "color" }),
    {
      selector: "#color-mini-menu",
      content: (
        <>
          This is the color menu. You can use it to customize lines, including color, transparency, width, and dash
          pattern.
        </>
      ),
    },
    // {   selector: "#dash-input",
    //     content: "This lets you specify the \"dash code\". It lets you draw customized dashed lines. To draw a solid line, just put \"0\".",
    //     highlightedSelectors: ['#color-menu-close-button']
    // },
    menu({ close: "color" }),
    // {   selector: "#dashed-line",
    //     content: "For example, this is what a dash code of \"20, 10\" looks like. To draw a solid line, just put \"0\"."
    // },
    {
      selector: "#undo-tool-button",
      content: (
        <>
          This is the undo button. Tap to undo, and tap and
          {mobile ? "hold to redo." : "right click to redo."}
        </>
      ),
    },
    menu({ open: "mirror" }),
    {
      selector: "#mirror-mini-menu",
      content: <>This is the mirror menu. You can use it to mirror lines across an axis, rotate them, or both.</>,
    },
    {
      selector: "#mirror-type-input",
      content: (
        <>There are 3 ways to mirror lines: around the cursor, the center of the page, or around a specific spot.</>
      ),
    },
    {
      selector: "#mirror-origin-input",
      content: <>Origins are spots you can mirror lines around. You can add or remove them here.</>,
    },
    menu({ open: "select" }),
    {
      selector: "#select-mini-menu",
      content: (
        <>
          This is the selection menu. You can use it to select an area of the page, which you can then use to
          copy/paste, or tesselate.
          {mobile ? " You can also tap and hold to add a bound" : " You can also press 'b' to add a bound"}, which
          defines a selection.
        </>
      ),
    },
    {
      selector: "#partials-picker",
      content: (
        <>
          This determines whether you want to include <em>partials</em> in the selected pattern or not. Partial lines
          are lines that only have one end inside the selected area.
        </>
      ),
    },
    menu({ open: "delete" }),
    // TODO: explain delete_line here too
    {
      selector: "#delete-mini-menu",
      content: (
        <>
          Here, there are several ways to delete lines.
          {mobile ? "Double tapping a point " : "The delete key "}
          deletes all lines attached to that point.
        </>
      ),
    },
    {
      selector: "#extra-tool-button",
      content: <>This button at the end is customizable in settings, for easy access</>,
    },
    menu({ open: "navigation" }),
    {
      selector: "#nav-menu-grid",
      content: (
        <>
          This is the navigation menu. You can set the current position and scale here manually. Additionally, you can
          {mobile
            ? " use 2 fingers to move and spread 2 fingers to scale."
            : " scroll to move vertically, shift+scroll to move horizontally, and ctrl+scroll to scale."}
        </>
      ),
    },
    menu({ close: "navigation" }),
    {
      selector: "#home-button",
      content: <>Home resets the position and scale to the starting position and scale.</>,
    },
    // {   selector: "#nav-selection-button",
    //     content: "This moves you to the current selection.",
    // },
    menu({ open: "repeat", close: "navigation" }),
    clickOn("#repeat-speed-dial", 200), // wait longer, cause SpeedDial has a bit of a transition animation
    {
      selector: "#repeat-speed-dial",
      content: (
        <>
          This is the repeat menu. You can use it to tesselate the selected pattern across the page in order to make
          complex patterns.
          <br />
          It has a lot of options, but the basics are pretty simple.
        </>
      ),
    },
    {
      selector: "#RepeatMenu-actions > button:nth-child(4)",
      content: (
        <>
          This is one of the transformations you can apply to the pattern. There are 4 kinds of transformations you can
          apply:
          <ul>
            <li>Offset</li>
            <li>Flip</li>
            <li>Rotate</li>
            <li>Skip</li>
          </ul>
          You can apply multiple transformations at once. This one is rotate, let&apos;s look at it.
        </>
      ),
    },
    clickOn("#RepeatMenu-actions > button:nth-child(4)"),
    clickOn("#tour2 > div > div > button._Increment_1qe35_103"),
    clickOn("#tour0-90"),
    {
      position: "top",
      selector: "#tour2",
      highlightedSelectors: ["#tour0", "#tour3", "#tour2", "tour1"],
      stepInteraction: true,
      content: (
        <>
          Transformations have 2 parts. The boxes on the bottom control transformations applied to columns, while the
          boxes on the left control transformations applied to rows. The inner box is &quot;every&quot;, while the
          outside box is the transformation applied. So this one reads &quot;once every 2 columns, rotate the pattern
          90°&quot;. The button in the corner resets the current transformation.
        </>
      ),
    },
    // {selector: 'tour0', content: <>
    //     The first box is "every". It controls how often the transformation is applied.
    // </>,},
    // ...(mobile ? [{   selector: "#repeat-right",
    //     content: "This side lets you select transformations to apply to the pattern. They each have different options."
    // },
    // {   selector: "#repeat-left",
    //     content: "This side lets you specify how to apply the associated transformations. For instance, \"every 3 rows, rotate the pattern 90°\"."
    // },
    // {
    //     content: ({goTo, step}) => setTimeout(() => goTo(step), LOAD_DELAY),
    //     action: () => document.querySelector('#settings-summary').click(),
    // },
    // {   selector: "#repeat-settings-reset",
    //     content: "You can use this button to reset to the original settings."
    // },
    // {   selector: "#repeat-settings-hide-dots",
    //     content: "And this button to hide the dots. There's a similar button in settings as well."
    // }] : []),
    // menu({close: 'repeat'}),
    // {content: "A few last things. "}
    // {content: "And that's it! There's also File and Settings menus, but I think you can figure them out yourself. If you have any problems, suggestions, or questions, feel free to email me at smartycope@gmail.com."},
    // menu({open: 'help'}),
    menu({ close: "repeat", open: "main" }),
    {
      selector: "#help-tool-button",
      content: (
        <>
          Finally, this button opens the help menu, which has more detailed information if you have questions, or if you
          want to go through the tour again.
        </>
      ),
    },
    menu({ open: "help" }),
    { content: "Have fun doodling!" },
  ]
}

export default tour
