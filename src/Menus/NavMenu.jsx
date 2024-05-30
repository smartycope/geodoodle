import {useContext} from "react";
import "../styling/NavMenu.css"
import {Number} from "./MenuUtils";

import { MdHome } from "react-icons/md";
import { PiSelectionAll } from "react-icons/pi";
import defaultOptions from "../options";
import {StateContext} from "../Contexts";


export default function NavMenu(){
    const [state, dispatch] = useContext(StateContext)
    const {side} = state

    const {scalex, scaley} = state

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
                    onChange={val => dispatch({translationx: val})}
                    value={state.translationx}
                    step={scalex}
                />
                <Number
                    label='y:'
                    onChange={val => dispatch({translationy: val})}
                    value={state.translationy}
                    step={scaley}
                />
            </span>
             <div id='sub-grid'>
             <span id='scale-nav-menu'>
                Scale
                <Number
                    onChange={val => dispatch({scalex: val, scaley: val})}
                    value={state.scalex}
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
            <button id='home-button' onClick={() => dispatch({action: "go home"})} title="Reset position and scale">
                <MdHome />
            </button>
            <button id='nav-selection-button' onClick={() => dispatch({action: 'go to selection'})} title="Go to the current selection">
                <PiSelectionAll />
            </button>
            </span>
            </div>
        </div>
    </>
}
