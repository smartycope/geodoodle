import Paper from "./Paper"
import tour, {
  getPreviousVisibleTourStep,
  prepareTourStep,
  resetTourProgress,
} from "./Menus/tour.jsx"
import Tour from "reactour"
import { useState } from "react"
import { localStorageTourTakenName } from "./globals"
import { InTourContext } from "./Contexts.jsx"
import CssBaseline from "@mui/material/CssBaseline"
import { validateStorage } from "./fileUtils"

// Disable the default right click menu
window.oncontextmenu = () => false

// These SHOULD be states, but for some, inexplicable reason, it doesn't work. So they're global instead.
var steps
var dispatch
const setDispatch = (to) => {
  steps = tour(to)
  dispatch = to
}

validateStorage()

// The tour needs to be seperate, because when the tour modifies the state, everything re-renders, and if the tour is
// inside Paper, the tour re-renders as well, which re-modifies the state, which causes an infinite loop.
export default function App() {
  const [inTour, setInTour] = useState(false)
  const [tourStep, setTourStep] = useState(0)

  const closeTour = () => {
    dispatch("end_tour")
    setInTour(false)
    setTourStep(0)
    resetTourProgress()
  }

  const previousTourStep = () => {
    const previousStep = getPreviousVisibleTourStep(steps, tourStep)
    resetTourProgress()
    prepareTourStep(steps, previousStep, () => setTourStep(previousStep))
  }
  // If we haven't taken the tour before, add a popup that offers it
  if (!localStorage.getItem(localStorageTourTakenName)) {
    localStorage.setItem(localStorageTourTakenName, "1")
    setTimeout(() => {
      // TODO: make this a mui dialog
      if (window.confirm("It looks like this is your first time. Would you like to take a guided tour?")) {
        dispatch("start_tour")
        setInTour(true)
      }
      // Wait a little bit for everything to load
    }, 1000)
  }

  return (
    <div className="App">
      <CssBaseline />
      <InTourContext.Provider value={setInTour}>
        <Paper setInTour={setInTour} setDispatch={setDispatch} />
        <Tour
          className="geodoodle-tour"
          steps={steps}
          isOpen={inTour}
          startAt={0}
          goToStep={tourStep}
          getCurrentStep={setTourStep}
          onRequestClose={closeTour}
          prevStep={previousTourStep}
          // accentColor='#ffddab'
          prevButton={<span className="geodoodle-tour-button">Back</span>}
          nextButton={<span className="geodoodle-tour-button">Next</span>}
          lastStepNextButton={<span className="geodoodle-tour-button">Done</span>}
          rounded={8}
          showNavigationNumber={false}
          showNumber={false}
          showNavigation={false}
        />
      </InTourContext.Provider>
    </div>
  )
}
