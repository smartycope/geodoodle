import {useContext, useEffect} from "react";
import { MIRROR_METHOD } from "../globals";
import { FaGripLinesVertical } from "react-icons/fa6";
import {incrementMirrorAxis, incrementMirrorMethod, incrementMirrorType} from "../utils";
import {MirrorAxisIcon, MirrorMethodIcon, MirrorTypeIcon} from "./MirrorIcons";
import "../styling/MirrorMenu.css"
import {StateContext} from "../Contexts";
import MiniMenu from "./MiniMenu";
import { ListItemIcon, MenuItem } from "@mui/material";

import { MdContentCopy } from "react-icons/md"
import { MdOutlineContentCut } from "react-icons/md";
import { MdContentPaste } from "react-icons/md";
import { MdUndo } from "react-icons/md";
import { MdRedo } from "react-icons/md";
import { GiNuclear } from "react-icons/gi";
import { PiSelectionPlusDuotone } from "react-icons/pi";
import { PiSelectionSlashDuotone } from "react-icons/pi";
import { MdDelete } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { BiArea } from "react-icons/bi";
import { BiSolidArea } from "react-icons/bi";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
let offsetX, offsetY;
let isDragging = false;


function DesktopMirrorMenu(){
    const {state, dispatch} = useContext(StateContext)

    // Enable dragging - mostly copied from ChatGPT
    useEffect(() =>{
        const draggableElement = document.getElementById('mirror-menu-desktop');

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

    const {mirrorType, mirrorMethod, mirrorAxis, mirrorAxis2} = state

    return <span id="mirror-menu-desktop" className="button-group">
        <button
            id='mirror-type'
            title='Toggle mirror type'
            onClick={() => dispatch({mirrorType: incrementMirrorType(mirrorType)})}
        >
            <MirrorTypeIcon mirrorType={state.mirrorType}/>
        </button>
        <button
            id='mirror-method'
            title='Toggle mirror method'
            onClick={() => dispatch({mirrorMethod: incrementMirrorMethod(mirrorMethod)})}
        >
            <MirrorMethodIcon mirrorMethod={state.mirrorMethod}/>
        </button>
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.FLIP].includes(state.mirrorMethod) &&
            <button
                id='mirror-axis-1'
                title='Toggle mirror axis'
                onClick={() => dispatch({mirrorAxis: incrementMirrorAxis(mirrorAxis)})}
            >
                <MirrorAxisIcon mirrorAxis={state.mirrorAxis} mirrorMethod={MIRROR_METHOD.FLIP}/>
            </button>
        }
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.ROTATE].includes(state.mirrorMethod) &&
            <button
                id='mirror-axis-2'
                title='Toggle mirror rotation angle'
                onClick={() => dispatch({mirrorAxis2: incrementMirrorAxis(mirrorAxis2)})}
            >
                <MirrorAxisIcon mirrorAxis={state.mirrorAxis2} mirrorMethod={MIRROR_METHOD.ROTATE}/>
            </button>
        }
        {/* Grip */}
        <FaGripLinesVertical id="grip"/>
    </span>
}

function MobileMirrorMenu({align}){
    const {state, dispatch} = useContext(StateContext)
    const style = useAlignWithElement(align)
    const {mirrorType, mirrorMethod, mirrorAxis, mirrorAxis2, mirroring} = state

    return <span id="mirror-menu-mobile" className="main-mobile-sub-menu" style={style}>
        {/* Enabled */}
        <Checkbox id='mirror-enabled' checked={mirroring} onChange={() => dispatch({mirroring: !mirroring})} label={"Enabled:"} backwards={true}/>
        Type
        <button
            id='mirror-type'
            title='Toggle mirror type'
            onClick={() => dispatch({mirrorType: incrementMirrorType(mirrorType)})}
        >
            <MirrorTypeIcon mirrorType={mirrorType}/>
        </button>
        Method
        <button
            id='mirror-method'
            title='Toggle mirror method'
            onClick={() => dispatch({mirrorMethod: incrementMirrorMethod(mirrorMethod)})}
        >
            <MirrorMethodIcon mirrorMethod={mirrorMethod}/>
        </button>
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.FLIP].includes(mirrorMethod) &&
            <span>
                Flip
                <button
                    id='mirror-axis-1'
                    title='Toggle mirror axis'
                    onClick={() => dispatch({mirrorAxis: incrementMirrorAxis(mirrorAxis)})}
                >
                    <MirrorAxisIcon mirrorAxis={mirrorAxis} mirrorMethod={MIRROR_METHOD.FLIP}/>
                </button>
            </span>
        }
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.ROTATE].includes(mirrorMethod) &&
            <span>
                Rotate
                <button
                    id='mirror-axis-2'
                    title='Toggle mirror rotation angle'
                    onClick={() => dispatch({mirrorAxis2: incrementMirrorAxis(mirrorAxis2)})}
                >
                    <MirrorAxisIcon mirrorAxis={mirrorAxis2} mirrorMethod={MIRROR_METHOD.ROTATE}/>
                </button>
            </span>
        }
    </span>
}


function MirrorMenuMui({align}){
    const {state, dispatch} = useContext(StateContext)
    const {mirrorType, mirrorMethod, mirrorAxis, mirrorAxis2, mirroring} = state

    return <MiniMenu menu="mirror" id="mirror-menu-mobile">
            <MenuItem onClick={() => dispatch({mirroring: !mirroring})}>
                <ListItemIcon>
                    {mirroring ? <CheckBoxIcon/> : <CheckBoxOutlineBlankIcon/>}
                </ListItemIcon>
                Enabled
            </MenuItem>
        <MenuItem onClick={() => dispatch({mirrorType: incrementMirrorType(mirrorType)})}>
            <ListItemIcon>
                <MirrorTypeIcon mirrorType={mirrorType}/>
            </ListItemIcon>
            Type
        </MenuItem>
        <MenuItem onClick={() => dispatch({mirrorMethod: incrementMirrorMethod(mirrorMethod)})}>
            <ListItemIcon>
                <MirrorMethodIcon mirrorMethod={mirrorMethod}/>
            </ListItemIcon>
            Method
        </MenuItem>
        {state.bounds.length > 1 && <>
            <MenuItem onClick={() => dispatch("clear_bounds")}>
                <ListItemIcon>
                    <PiSelectionSlashDuotone/>
                </ListItemIcon>
                Remove<br/> Selection
            </MenuItem>

        </>}


        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.FLIP].includes(mirrorMethod) &&
            <MenuItem onClick={() => dispatch({mirrorAxis: incrementMirrorAxis(mirrorAxis)})}>
                <ListItemIcon>
                    <MirrorAxisIcon mirrorAxis={mirrorAxis} mirrorMethod={MIRROR_METHOD.FLIP}/>
                </ListItemIcon>
                Flip
            </MenuItem>
        }
        {[MIRROR_METHOD.BOTH, MIRROR_METHOD.ROTATE].includes(mirrorMethod) &&
            <MenuItem onClick={() => dispatch({mirrorAxis2: incrementMirrorAxis(mirrorAxis2)})}>
                <ListItemIcon>
                    <MirrorAxisIcon mirrorAxis={mirrorAxis2} mirrorMethod={MIRROR_METHOD.ROTATE}/>
                </ListItemIcon>
                Rotate
            </MenuItem>
        }
    </MiniMenu>
}

// export {MobileMirrorMenu as MirrorMenu}
export default MirrorMenuMui