import { useContext } from "react";
import { StateContext } from "../Contexts";
import ToolButton from "./ToolButton";
import { extraButtons } from "../globals";

export default function ExtraButton({ style }) {
    const { state, dispatch } = useContext(StateContext);

    return (
        <ToolButton
            id="extra-tool-button"
            onClick={() => dispatch(extraButtons[state.extraButton])}
            menu={state.extraButton}
            style={style}
        />
    );
}
