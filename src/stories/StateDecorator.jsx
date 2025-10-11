import { StateContext } from "../Contexts"
import { validateStorage } from "../fileUtils"
import getInitialState from "../states"
import { useReducer } from "react"
import reducer from "../reducer"

// eslint-disable-next-line no-unused-vars
export default function StateDecorator(Story, context) {
  validateStorage()
  const [state, dispatch] = useReducer(reducer, getInitialState())
  return (
    <StateContext.Provider value={{ state, dispatch }}>
      <Story />
    </StateContext.Provider>
  )
}
