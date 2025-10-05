# Storage
There's the current state (stored in RAM), and when the user does something relevant (any of the actions marked as `preservable` in options.jsx), it gets saved to localStorage in the `localStorageSettingsName` (set in globals.js) in plain JSON. When the app is opened, it checks localStorage for the `localStorageSettingsName` and if it exists, it loads it into the state.

When the user saves the pattern, it gets saved to localStorage in the `localStorageName` (set in globals.js) in SVG format, which can be loaded by the `deserializePattern` function in fileUtils.js.

## Functions
### Serialization
* serializeState/deserializeState
    * Takes everything `preservable` from the state and serializes it into a JSON string
* serializePattern/deserializePattern
    * Takes everything `saveable` (which is less than is `preservable`) from the state and serializes it into SVG format, which everything that isn't directly part of the pattern (everything other than the lines) as a comment in the SVG in JSON format.

### Storage
Code outside of fileUtils.jsx should not directly interact with localStorage, or other storage APIs. It should use the functions in fileUtils.jsx instead.
* preserveState
    * Stores the state in localStorage in the `localStorageSettingsName` (set in globals.js) in JSON format.
* getSaves
    * Returns the saved patterns from localStorage in the `localStorageName` (set in globals.js) in SVG format.

### Keys
* localStorageSettingsName
    * A single string in JSON format
* localStorageName
    * An object of filename: SVG string