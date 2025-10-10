import Paper from "./Paper";
import tour from './Menus/tour.jsx';
import Tour from "reactour";
import {useState, useEffect} from "react";
import {localStorageTourTakenName} from "./globals";
import {InTourContext} from "./Contexts.jsx";
import {ThemeProvider} from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import {validateStorage} from "./fileUtils";

// Disable the default right click menu
window.oncontextmenu = () => false

// These SHOULD be states, but for some, inexplicable reason, it doesn't work. So they're global instead.
var steps
var dispatch
const setDispatch = to => {
    steps = tour(to)
    dispatch = to
}

validateStorage()

// The tour needs to be seperate, because when the tour modifies the state, everything re-renders, and if the tour is
// inside Paper, the tour re-renders as well, which re-modifies the state, which causes an infinite loop.
export default function App() {
    const [inTour, setInTour] = useState(false);
    // If we haven't taken the tour before, add a popup that offers it
    if (!localStorage.getItem(localStorageTourTakenName)){
        localStorage.setItem(localStorageTourTakenName, '1')
        setTimeout(() => {
            // TODO: make this a mui dialog
            if (window.confirm("It looks like this is your first time. Would you like to take a guided tour?")){
                dispatch('start_tour')
                setInTour(true)
            }
        // Wait a little bit for everything to load
        }, 1000)
    }

    return <div className="App">
        <CssBaseline />
        <InTourContext.Provider value={setInTour}>
            <Paper setInTour={setInTour} setDispatch={setDispatch}/>
            <Tour
                steps={steps}
                isOpen={inTour}
                onRequestClose={() => {
                    dispatch('end_tour')
                    setInTour(false)
                }}
                // accentColor='#ffddab'
                // startAt={0}
                // The prev button doesn't work, so we just hide it
                prevButton={<></>}
                rounded={8}
                showNavigationNumber={false}
                showNumber={false}
                showNavigation={false}
            />
        </InTourContext.Provider>
    </div>
}
