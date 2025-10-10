import { StateContext } from "../Contexts";
import { validateStorage } from "../fileUtils";
import getInitialState from "../states";
import { useReducer } from "react";
import reducer from "../reducer";

export default (Story, context) => {
    validateStorage();
    const [state, dispatch] = useReducer(reducer, getInitialState());
    return (
        <StateContext.Provider value={{ state, dispatch }}>
            <Story />
        </StateContext.Provider>
    );
};
