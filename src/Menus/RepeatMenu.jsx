import React, {useEffect} from "react";
import "../styling/RepeatMenu.css"
import { MIRROR_AXIS, MIRROR_METHOD } from "../globals";
import { MirrorAxisIcon, Number } from "./MenuUtils"
import {defaultTrellisControl, incrementMirrorAxis} from "../utils";

import { FaGripLinesVertical } from "react-icons/fa6";

let offsetX, offsetY;
let isDragging = false;

// const defaultTrellisControl = {
//     row: {
//         every: 1,
//         val: 0
//     },
//     col: {
//         every: 1,
//         val: 0
//     },
// }

export default function RepeatMenu({dispatch, state}){
    function TrellisControl({verb, value, extra='', input}){
        const line = (rowCol) => <span className="trellis-control">
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
        const draggableElement = document.getElementById('repeat-menu');

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


    return <div id="repeat-menu">
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
            <button onClick={e => {
                let obj = {}
                obj.trellisSkip = state.trellisSkip
                obj.trellisSkip[rowCol].val = !state.trellisSkip[rowCol].val
                dispatch(obj)
            }}>
                {state.trellisSkip[rowCol].val ? 'True' : 'False'}
            </button>
        }/>
        <TrellisControl value='trellisFlip' verb='Flip' input={rowCol =>
            <button onClick={e => {
                let obj = {}
                obj.trellisFlip = state.trellisFlip
                obj.trellisFlip[rowCol].val = incrementMirrorAxis(state.trellisFlip[rowCol].val, true)
                dispatch(obj)
            }}>
                <MirrorAxisIcon mirrorAxis={state.trellisFlip[rowCol].val} mirrorMethod={MIRROR_METHOD.FLIP}/>
            </button>
        }/>
        <TrellisControl value='trellisRotate'  verb='Rotate' input={rowCol =>
            <button onClick={e => {
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
        {/* <Input
            type="number"
            label="x Offset"
            onChange={(e) => dispatch({trellisOverlapx: e.target.value})}
            value={trellisOverlapx}
        ></Input>
        <Input
            type="number"
            label="y Offset"
            onChange={(e) => dispatch({trellisOverlapy: e.target.value})}
            value={trellisOverlapy}
        ></Input>
        <Input
            type="number"
            label="Row Skip"
            onChange={(e) => dispatch({trellisRowSkip: e.target.value})}
            value={trellisRowSkip}
        ></Input>
        <Input
            type="number"
            label="Column Skip"
            onChange={(e) => dispatch({trellisColSkip: e.target.value})}
            value={trellisColSkip}
        ></Input>
        <Input
            type="number"
            label="Column Skip"
            onChange={(e) => dispatch({trellisColSkip: e.target.value})}
            value={trellisColSkip}
        ></Input>

        <label htmlFor="trellisFlipRows">Flip Rows: </label>
        <button name="trellisFlipRows" onClick={() => dispatch({trellisFlipRows: incrementMirrorAxis(trellisFlipRows, true)})}>
            <MirrorAxisIcon
                mirrorAxis={trellisFlipRows}
                mirrorMethod={MIRROR_METHOD.FLIP}
            />
        </button>
        <label htmlFor="trellisFlipCols">Flip Columns: </label>
        <button name="trellisFlipCols" onClick={() => dispatch({trellisFlipCols: incrementMirrorAxis(trellisFlipCols, true)})}>
            <MirrorAxisIcon
                mirrorAxis={trellisFlipCols}
                mirrorMethod={MIRROR_METHOD.FLIP}
            />
        </button>
        <label htmlFor="trellisRotateRows">Rotate Rows: </label>
        <button name="trellisRotateRows" onClick={() => dispatch({trellisRotateRows: incrementMirrorAxis(trellisRotateRows, true)})}>
            <MirrorAxisIcon
                mirrorAxis={trellisRotateRows}
                mirrorMethod={MIRROR_METHOD.ROTATE}
            />
        </button>
        <label htmlFor="trellisRotateCols">Rotate Columns: </label>
        <button name="trellisRotateCols" onClick={() => dispatch({trellisRotateCols: incrementMirrorAxis(trellisRotateCols, true)})}>
            <MirrorAxisIcon
                mirrorAxis={trellisRotateCols}
                mirrorMethod={MIRROR_METHOD.ROTATE}
            />
        </button> */}


        {/* Grip */}
        <FaGripLinesVertical id="grip" color='darkgray'/>
    </div>
}
