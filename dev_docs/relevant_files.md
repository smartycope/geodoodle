# Relevant files

These are the most relevant files in the program (these are all in /src/):
* [Paper.jsx](../src/Paper.jsx)
    * The main component of the program. It's where most (pretty much all) of the drawing happens. Also handles all of the input events
* [reducer.jsx](../src/reducer.jsx)
    * Handles all the state changes. All the events are processed here. You'll see dispatch({action: "..."}) all over the place, that calls the reducer.
* [actions.jsx](../src/actions.jsx)
    * Contains all the actions that can be dispatched. These are executed by the reducer, and they return modifications to the state.
* [drawing.jsx](../src/drawing.jsx)
    * Has all of the components that Paper uses, except for Trellis
* [Trellis.jsx](../src/Trellis.jsx)
    * The component that draws the trellis. It holds the logic for the repeating algorithm
* ~~[events.js](../src/events.js)~~
    * Holds all the event handlers. This doesn't exist yet, but I'll get to it.
* [utils.js](../src/utils.js)
    * Contains utility functions used throughout the program
* [globals.js](../src/globals.js)
    * Contains global constants and yes, a few global variables used throughout the program. See the comments there for more explanations
* [options.jsx](../src/options.jsx)
    * Contains the default options for the program. These get modified in the settings menu
* [fileUtils.jsx](../src/fileUtils.jsx)
    * Contains file handling functions
* ~~[mirrorEngine.jsx](../src/mirrorEngine.jsx)~~
    * Contains all the math behind mirroring lines. This file no longer exists, and has all been moved directly into Point.jsx
* [styling/](../src/styling/)
    * Contains all the CSS
* [Menus/](../src/Menus/)
    * Contains the menus. Many of them have seperate desktop and mobile versions
    * [Menus/MenuUtils.jsx](../src/Menus/MenuUtils.jsx)
        * A bunch of reusable components for the menus
    * [Menus/MainMenu.jsx](../src/Menus/MainMenu.jsx)
        * The main menu component, i.e. the top/side bar with all the controls in it
* [helper/](../src/helper/)
    * Classes to encapsulate some of the coordinate math
    * [helper/Pair.jsx](../src/helper/Pair.jsx)
        * An abstract class to encapsulate similar logic between Dist and Point
    * [helper/Point.jsx](../src/helper/Point.jsx)
        * A class to encapsulate coordinate logic. See the top comment in the file for more details
    * [helper/Dist.jsx](../src/helper/Dist.jsx)
        * It's for things that might be scaled, but aren't points, so they don't really have a coordinate system (like translation). It's to Point what TimeDelta is to DateTime.
    * [helper/Line.jsx](../src/helper/Line.jsx)
    * [helper/Rect.jsx](../src/helper/Rect.jsx)


