import { useContext } from "react";
import { StateContext } from "../Contexts";
import ToolButton from "./ToolButton";

// menu doesn't
export const extraButtons = {
    copy_image: {action: 'copy_image'},
    home: {action: 'go_home'},
    redo: {action: 'redo'},
}

export default function ExtraButton({style}){
    const {state, dispatch} = useContext(StateContext)

    return <ToolButton
        onClick={() => dispatch(extraButtons[state.extraButton])}
        menu={state.extraButton}
        style={style}
    />
}
