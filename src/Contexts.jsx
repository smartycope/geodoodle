import { createContext } from "react"

// TODO: have this export the providers, not the contexts
// Returns [state, dispatch]
export const StateContext = createContext({})
export const InTourContext = createContext(false)
