import {useEffect, useState} from "react";
import "../styling/RepeatMenu.css"
import { MIRROR_AXIS, MIRROR_METHOD } from "../globals";
import { MirrorAxisIcon, Number } from "./MenuUtils"
import {defaultTrellisControl, incrementMirrorAxis} from "../utils";

import { FaGripLinesVertical } from "react-icons/fa6";

let offsetX, offsetY;
let isDragging = false;
/*
const defaultTrellisControl = {
    row: {
        every: 1,
        val: 0
    },
    col: {
        every: 1,
        val: 0
    },
}
*/
function DesktopRepeatMenu({dispatch, state}){
    function TrellisControl({verb, value, extra='', input}){
        const line = (rowCol) => <span className="trellis-control-desktop">
            {verb} every
            <Number
                onChange={val => {
                    let obj = {}
                    obj[value] = state[value]
                    obj[value][rowCol].every = val
                    dispatch(obj)
                }}
                value={state[value][rowCol].every}
                min="1"
                step="1"
            ></Number>
            {rowCol === 'row' ? "rows" : 'columns'} {extra}
            {input(rowCol)}
        </span>

        return <span>
            {line('row')}
            {line('col')}
        </span>
    }

    // Enable dragging - mostly copied from ChatGPT
    useEffect(() =>{
        const draggableElement = document.getElementById('repeat-menu-desktop');

        // Function to handle mouse down event
        function handleMouseDown(event) {
            let x, y
            if (event.type === 'touchstart'){
                const touch = (event.touches[0] || event.changedTouches[0])
                x = touch.pageX
                y = touch.pageY
            } else {
                x = event.clientX
                y = event.clientY
            }
            isDragging = true;
            // Calculate the offset between mouse position and element position
            offsetX = x - draggableElement.getBoundingClientRect().left;
            offsetY = y - draggableElement.getBoundingClientRect().top;
            draggableElement.style.cursor = "grabbing"
            event.stopPropagation()
            // event.preventDefault()
        }

        // Function to handle mouse move event
        function handleMouseMove(event) {
            if (!isDragging) return;
            let x, y
            if (event.type === 'touchmove'){
                const touch = (event.touches[0] || event.changedTouches[0])
                x = touch.pageX
                y = touch.pageY
            } else {
                x = event.clientX
                y = event.clientY
            }
            // Update the element's position based on mouse movement
            draggableElement.style.left = `${x - offsetX}px`;
            draggableElement.style.top  = `${y - offsetY}px`;
            event.stopPropagation()
            // event.preventDefault()
        }

        // Function to handle mouse up event
        function handleMouseUp(event) {
            isDragging = false;
            draggableElement.style.cursor = "grab"
            event.stopPropagation()
            // event.preventDefault()
        }

        // Add event listeners for mouse events
        draggableElement.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        draggableElement.addEventListener('touchstart', handleMouseDown)
        document.addEventListener('touchmove', handleMouseMove)
        document.addEventListener('touchend', handleMouseUp)

        return () => {
            draggableElement.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            draggableElement.removeEventListener('touchstart', handleMouseDown, {passive: false})
            document.removeEventListener('touchmove', handleMouseMove, {passive: false})
            document.removeEventListener('touchend', handleMouseUp, {passive: false})
        }
    }, [])


    return <div id="repeat-menu-desktop">
        <TrellisControl value='trellisOverlap' verb='Offset' extra='by' input={rowCol =>
            <span>
                x <Number
                    type="number"
                    onChange={val => {
                        let obj = {}
                        obj.trellisOverlap = state.trellisOverlap
                        obj.trellisOverlap[rowCol].val.x = val
                        dispatch(obj)
                    }}
                    value={state.trellisOverlap[rowCol].val.x}
                ></Number>
                y <Number
                    type="number"
                    onChange={val => {
                        let obj = {}
                        obj.trellisOverlap = state.trellisOverlap
                        obj.trellisOverlap[rowCol].val.y = val
                        dispatch(obj)
                    }}
                    value={state.trellisOverlap[rowCol].val.y}
                ></Number>
            </span>
        }/>
        <TrellisControl value='trellisSkip' verb='Skip' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisSkip = state.trellisSkip
                obj.trellisSkip[rowCol].val = !state.trellisSkip[rowCol].val
                dispatch(obj)
            }}>
                {state.trellisSkip[rowCol].val ? 'True' : 'False'}
            </button>
        }/>
        <TrellisControl value='trellisFlip' verb='Flip' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisFlip = state.trellisFlip
                obj.trellisFlip[rowCol].val = incrementMirrorAxis(state.trellisFlip[rowCol].val, true)
                dispatch(obj)
            }}>
                <MirrorAxisIcon mirrorAxis={state.trellisFlip[rowCol].val} mirrorMethod={MIRROR_METHOD.FLIP}/>
            </button>
        }/>
        <TrellisControl value='trellisRotate'  verb='Rotate' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisRotate = state.trellisRotate
                obj.trellisRotate[rowCol].val = incrementMirrorAxis(state.trellisRotate[rowCol].val, true)
                dispatch(obj)
            }}>
                <MirrorAxisIcon mirrorAxis={state.trellisRotate[rowCol].val} mirrorMethod={MIRROR_METHOD.ROTATE}/>
            </button>
        }/>

        <button onClick={() => dispatch({
            trellisOverlap: defaultTrellisControl({x: 0, y: 0}),
            trellisSkip:    defaultTrellisControl(false),
            trellisFlip:    defaultTrellisControl(MIRROR_AXIS.NONE_0),
            trellisRotate:  defaultTrellisControl(MIRROR_AXIS.NONE_0),
        })}>Reset</button>

        {/* Grip */}
        <FaGripLinesVertical id="grip" color='darkgray'/>
    </div>
}

function MobileRepeatMenu({dispatch, state}){
    const [leftOpen, setLeftOpen] = useState({
        Offset: false,
        Skip: false,
        Flip: false,
        Rotate: false,
    });
    const TrellisControl = ({verb, value}) => {
        const line = (rowCol) => <span className="trellis-control-mobile">
            {/* <hr/> */}
            {rowCol === 'row' ? "Rows" : 'Columns'}
            <Number
                onChange={val => {
                    let obj = {}
                    obj[value] = state[value]
                    obj[value][rowCol].every = val
                    dispatch(obj)
                }}
                value={state[value][rowCol].every}
                min="1"
                step="1"
            ></Number>
        </span>

        // So the even onToggle and onClick here:
        // For SOME REASON (I *still* don't know why) details toggles itself whenever it's clicked, not just in the
        // summary. I'm baffled by this because none of the other details elements do this, and I can't find a difference.
        // Anyway, how I'm getting around it, is to manually control the open state of details with the `open` prop, then
        // whenever it tries to toggle, reset it to what it's *supposed* to be (the manual state). Then, the summary
        // toggles the state.
        return <details open={leftOpen[verb]} onToggle={e => {
            e.target.open = leftOpen[verb]
        }}>
            <summary onClick={() => {
                const copy = JSON.parse(JSON.stringify(leftOpen))
                copy[verb] = !copy[verb]
                setLeftOpen(copy)
            }}>{verb}</summary>
            {line('row')}
            {line('col')}
        </details>
    }
    const overlap = rowCol => <span>
            <span className="align-horz">x:<Number
                type="number"
                onChange={val => {
                    let obj = {}
                    obj.trellisOverlap = state.trellisOverlap
                    obj.trellisOverlap[rowCol].val.x = val
                    dispatch(obj)
                }}
                value={state.trellisOverlap[rowCol].val.x}
            ></Number>
            </span>
            <span className="align-horz">y:<Number
                type="number"
                onChange={val => {
                    let obj = {}
                    obj.trellisOverlap = state.trellisOverlap
                    obj.trellisOverlap[rowCol].val.y = val
                    dispatch(obj)
                }}
                value={state.trellisOverlap[rowCol].val.y}
            ></Number>
            </span>
        </span>

    const skip = rowCol =>
        <button onClick={() => {
            let obj = {}
            obj.trellisSkip = state.trellisSkip
            obj.trellisSkip[rowCol].val = !state.trellisSkip[rowCol].val
            dispatch(obj)
        }}>
            {state.trellisSkip[rowCol].val ? 'True' : 'False'}
        </button>

    const flip = rowCol =>
        <button onClick={() => {
            let obj = {}
            obj.trellisFlip = state.trellisFlip
            obj.trellisFlip[rowCol].val = incrementMirrorAxis(state.trellisFlip[rowCol].val, true)
            dispatch(obj)
        }}>
            <MirrorAxisIcon mirrorAxis={state.trellisFlip[rowCol].val} mirrorMethod={MIRROR_METHOD.FLIP}/>
        </button>

    const rotate = rowCol =>
        <button onClick={() => {
            let obj = {}
            obj.trellisRotate = state.trellisRotate
            obj.trellisRotate[rowCol].val = incrementMirrorAxis(state.trellisRotate[rowCol].val, true)
            dispatch(obj)
        }}>
            <MirrorAxisIcon mirrorAxis={state.trellisRotate[rowCol].val} mirrorMethod={MIRROR_METHOD.ROTATE}/>
        </button>

    return <div id="repeat-menu-mobile">
        <div id="repeat-left" className="repeat-side">
            <h4>Every</h4>
            <hr/>
            <TrellisControl value='trellisOverlap' verb='Offset' />
            <TrellisControl value='trellisSkip'    verb='Skip' />
            <TrellisControl value='trellisFlip'    verb='Flip' />
            <TrellisControl value='trellisRotate'  verb='Rotate' />
            <hr/>
            <details>
                <summary id="settings-summary">Settings</summary>
                <button id='repeat-settings-reset' onClick={() => dispatch({
                    trellisOverlap: defaultTrellisControl({x: 0, y: 0}),
                    trellisSkip:    defaultTrellisControl(false),
                    trellisFlip:    defaultTrellisControl(MIRROR_AXIS.NONE_0),
                    trellisRotate:  defaultTrellisControl(MIRROR_AXIS.NONE_0),
                })}>Reset</button>
                <button id='repeat-settings-hide-dots' onClick={() => dispatch({hideDots: !state.hideDots})}>
                    {state.hideDots ? "Show" : "Hide"} dots
                </button>
            </details>
        </div>


        <div id="repeat-right" className="repeat-side">
            <h4>By</h4>
            <hr/>
            <details>
                <summary>Offset</summary>
                Rows
                {overlap('row')}
                Columns
                {overlap('col')}
            </details>
            <details>
                <summary>Skip</summary>
                Rows
                {skip('row')}
                Columns
                {skip('col')}
            </details>
            <details>
                <summary>Flip</summary>
                Rows
                {flip('row')}
                Columns
                {flip('col')}
            </details>
            <details>
                <summary>Rotate</summary>
                Rows
                {rotate('row')}
                Columns
                {rotate('col')}
            </details>
        </div>
    </div>
}

export default function RepeatMenu({dispatch, state}){
    return state.mobile
        ? <MobileRepeatMenu dispatch={dispatch} state={state}/>
        : <DesktopRepeatMenu dispatch={dispatch} state={state}/>
}
