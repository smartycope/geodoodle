# Relevant files

These are the most relevant files in the program (these are all in /src/):
* [Paper.jsx](../src/Paper.jsx)
    * The main component of the program. It's where most (pretty much all) of the drawing happens. Also handles all of the input events
* [reducer.jsx](../src/reducer.jsx)
    * Handles all the state changes. All the events are processed here. You'll see dispatch({action: "..."}) all over the place, that calls the reducer.
* [utils.js](../src/utils.js)
    * Contains utility functions used throughout the program
* [globals.js](../src/globals.js)
    * Contains global constants and yes, a few global variables used throughout the program. See the comments there for more explanations
* [options.jsx](../src/options.jsx)
    * Contains the default options for the program. These get modified in the settings menu
* [fileUtils.jsx](../src/fileUtils.jsx)
    * Contains file handling functions
* [mirrorEngine.jsx](../src/mirrorEngine.jsx)
    * Contains all the math behind mirroring lines.
* [repeatEngine.jsx](../src/repeatEngine.jsx)
    * Contains all the math behind generating the trellis. Just has one function: getTrellis()
* [Menus/](../src/Menus/)
    * Contains the menus. Many of them have seperate desktop and mobile versions
    * [Menus/MenuUtils.jsx](../src/Menus/MenuUtils.jsx)
        * A bunch of reusable components for the menus
    * [Menus/MainMenu.jsx](../src/Menus/MainMenu.jsx)
        * The main menu component, i.e. the top/side bar

    
    
    
