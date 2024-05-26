import Paper from "./Paper";
import tour from './Menus/tour.jsx';
import Tour from "reactour";
import {mobileAndTabletCheck} from "./utils";
import {useState} from "react";
import {localStorageTourTakenName} from "./globals";

// These SHOULD be states, but for some, inexplicable reason, it doesn't work. So they're global instead.
var steps
var dispatch
export const setDispatch = to => {
    steps = tour(to)[mobileAndTabletCheck() ? 'mobile' : 'desktop']
    dispatch = to
}

// The tour needs to be seperate, because when the tour modifies the state, everything re-renders, and if the tour is
// inside Paper, the tour re-renders as well, which re-modifies the state, which causes an infinite loop.
export default function App() {
    const [inTour, setInTour] = useState(false);

    // If we haven't taken the tour before, add a popup that offers it
    if (!localStorage.getItem(localStorageTourTakenName)){
        localStorage.setItem(localStorageTourTakenName, '1')
        setTimeout(() => {
            if (window.confirm("It looks like this is your first time. Would you like to take a guided tour?")){
                dispatch({action: 'start tour'})
                setInTour(true)
            }
        // Wait a little bit for everything to load
        }, 1000)
    }

    return <div className="App">
        <Paper setInTour={setInTour}/>
        <Tour
            steps={steps}
            isOpen={inTour}
            onRequestClose={() => {
                dispatch({action: 'end tour'})
                setInTour(false)
            }}
            accentColor='#ffddab'
            // startAt={0}
            rounded={8}
            showNavigationNumber={false}
            showNumber={false}
            showNavigation={false}
        />
    </div>
}
