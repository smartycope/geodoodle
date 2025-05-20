import {useContext} from "react";
import "../styling/NavMenu.css"
import {Number} from "./MenuUtils";

import { MdHome } from "react-icons/md";
import { PiSelectionAll } from "react-icons/pi";
import defaultOptions from "../options";
import {StateContext} from "../Contexts";
import Dist from "../helper/Dist";

export default function NavMenu(){
    const {state, dispatch} = useContext(StateContext)

    const {scalex, scaley, translation, side} = state
    const {x: translationx, y: translationy} = translation.asDeflated(state)

    let style
    if (side === 'bottom')
        style = {
            borderTopLeftRadius: '0px',
            borderTopRightRadius: '0px',
            top: '0px',
        }
    else
        style = {
            borderEndStartRadius: '0px',
            borderBottomRightRadius: '0px',
            bottom: '0px',
        }

        return <>
        <div id='nav-menu' style={style}>
            <span id='pos-nav-menu'>
                Position
                <Number
                    label="x:"
                    // TODO: this doesn't work
                    onChange={val => dispatch({action: "translate", amt: Dist.fromDeflated(state, translationx-val, 0)})}
                    value={translationx}
                    step={scalex}
                    />
                <Number
                    label='y:'
                    // TODO: this doesn't work
                    onChange={val => dispatch({action: "translate", amt: Dist.fromDeflated(state, 0, translationy-val)})}
                    value={translationy}
                    step={scaley}
                />
            </span>
             <div id='sub-grid'>
             <span id='scale-nav-menu'>
                Scale
                <Number
                    // TODO: this doesn't work
                    onChange={val => dispatch({action: "scale", amtx: val, amty: val})}
                    value={scalex}
                    onMinus={prev => prev * 2}
                    onPlus={prev => prev / 2}
                    // See also: "scale" action in the reducer
                    min={defaultOptions.minScale}
                    max={defaultOptions.maxScale}
                />
            </span>

            {/* Rotation */}
            {/* <Number
                label="Rotation:"
                onChange={val => dispatch({rotate: val})}
                value={state.rotate}
                step={30}
            /> */}

            {/* Home button */}
            <span id='sub-sub-grid'>
            <button id='home-button' onClick={() => dispatch('go_home')} title="Reset position and scale">
                <MdHome />
            </button>
            <button id='nav-selection-button' onClick={() => dispatch('go_to_selection')} title="Go to the current selection">
                <PiSelectionAll />
            </button>
            </span>
            </div>
        </div>
    </>
}
