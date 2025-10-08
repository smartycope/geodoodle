import { useContext, useEffect, useState } from "react";
import "../styling/RepeatMenu.css"
import { MIRROR_AXIS, MIRROR_ROT } from "../globals";
import { MirrorAxisIcon } from "./MirrorIcons"
import Number from "./Number"
import { defaultTrellisControl, incrementMirrorAxis } from "../utils";

import { FaGripLinesVertical } from "react-icons/fa6";
import { StateContext } from "../Contexts";
import KeyboardTabIcon from '@mui/icons-material/KeyboardTab';
import RedoIcon from '@mui/icons-material/Redo';
import FlipIcon from '@mui/icons-material/Flip';
import LoopIcon from '@mui/icons-material/Loop';
import { Box, Button, Grid, IconButton, SpeedDial, SpeedDialAction, Typography, useTheme } from "@mui/material";
import CropIcon from '@mui/icons-material/Crop';
import theme from "../styling/theme";
import ReplayIcon from '@mui/icons-material/Replay';
import ToggleIconButtonGroup from "./ToggleIconButtonGroup";
import Slider from "@mui/material/Slider";

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
function DesktopRepeatMenu() {
    const { state, dispatch } = useContext(StateContext)
    const { side } = state

    function TrellisControl({ verb, value, extra = '', input }) {
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
    useEffect(() => {
        const draggableElement = document.getElementById('repeat-menu-desktop');

        // Function to handle mouse down event
        function handleMouseDown(event) {
            let x, y
            if (event.type === 'touchstart') {
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
            if (event.type === 'touchmove') {
                const touch = (event.touches[0] || event.changedTouches[0])
                x = touch.pageX
                y = touch.pageY
            } else {
                x = event.clientX
                y = event.clientY
            }
            // Update the element's position based on mouse movement
            draggableElement.style.left = `${x - offsetX}px`;
            draggableElement.style.top = `${y - offsetY}px`;
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
            draggableElement.removeEventListener('touchstart', handleMouseDown, { passive: false })
            document.removeEventListener('touchmove', handleMouseMove, { passive: false })
            document.removeEventListener('touchend', handleMouseUp, { passive: false })
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
        } />
        <TrellisControl value='trellisSkip' verb='Skip' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisSkip = state.trellisSkip
                obj.trellisSkip[rowCol].val = !state.trellisSkip[rowCol].val
                dispatch(obj)
            }}>
                {state.trellisSkip[rowCol].val ? 'True' : 'False'}
            </button>
        } />
        <TrellisControl value='trellisFlip' verb='Flip' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisFlip = state.trellisFlip
                obj.trellisFlip[rowCol].val = incrementMirrorAxis(state.trellisFlip[rowCol].val, true)
                dispatch(obj)
            }}>
                <MirrorAxisIcon val={state.trellisFlip[rowCol].val} />
            </button>
        } />
        <TrellisControl value='trellisRotate' verb='Rotate' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisRotate = state.trellisRotate
                obj.trellisRotate[rowCol].val = incrementMirrorAxis(state.trellisRotate[rowCol].val, true)
                dispatch(obj)
            }}>
                <MirrorRotIcon val={state.trellisRotate[rowCol].val} />
            </button>
        } />

        <button onClick={() => dispatch({
            trellisOverlap: defaultTrellisControl({ x: 0, y: 0 }),
            trellisSkip: defaultTrellisControl(false),
            trellisFlip: defaultTrellisControl(MIRROR_AXIS.NONE_0),
            trellisRotate: defaultTrellisControl(MIRROR_AXIS.NONE_0),
        })}>Reset</button>

        {/* Grip */}
        <FaGripLinesVertical id="grip" color='darkgray' />
    </div>
}

function MobileRepeatMenu() {
    const { state, dispatch } = useContext(StateContext)
    const [leftOpen, setLeftOpen] = useState({
        Offset: false,
        Skip: false,
        Flip: false,
        Rotate: false,
    });
    const TrellisControl = ({ verb, value }) => {
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
            <MirrorAxisIcon val={state.trellisFlip[rowCol].val} />
        </button>

    const rotate = rowCol =>
        <button onClick={() => {
            let obj = {}
            obj.trellisRotate = state.trellisRotate
            obj.trellisRotate[rowCol].val = incrementMirrorAxis(state.trellisRotate[rowCol].val, true)
            dispatch(obj)
        }}>
            <MirrorRotIcon val={state.trellisRotate[rowCol].val} />
        </button>

    return <div id="repeat-menu-mobile">
        <div id="repeat-left" className="repeat-side">
            <h4>Every</h4>
            <hr />
            <TrellisControl value='trellisOverlap' verb='Offset' />
            <TrellisControl value='trellisSkip' verb='Skip' />
            <TrellisControl value='trellisFlip' verb='Flip' />
            <TrellisControl value='trellisRotate' verb='Rotate' />
            <hr />
            <details>
                <summary id="settings-summary">Settings</summary>
                <button id='repeat-settings-reset' onClick={() => dispatch({
                    trellisOverlap: defaultTrellisControl({ x: 0, y: 0 }),
                    trellisSkip: defaultTrellisControl(false),
                    trellisFlip: defaultTrellisControl(MIRROR_AXIS.NONE_0),
                    trellisRotate: defaultTrellisControl(MIRROR_AXIS.NONE_0),
                })}>Reset</button>
                <button id='repeat-settings-hide-dots' onClick={() => dispatch({ hideDots: !state.hideDots })}>
                    {state.hideDots ? "Show" : "Hide"} dots
                </button>
            </details>
        </div>


        <div id="repeat-right" className="repeat-side">
            <h4>By</h4>
            <hr />
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

function DesktopRepeatMenuMui() {
    const { state, dispatch } = useContext(StateContext)
    const { side } = state

    function TrellisControl({ verb, value, extra = '', input }) {
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
    useEffect(() => {
        const draggableElement = document.getElementById('repeat-menu-desktop');

        // Function to handle mouse down event
        function handleMouseDown(event) {
            let x, y
            if (event.type === 'touchstart') {
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
            if (event.type === 'touchmove') {
                const touch = (event.touches[0] || event.changedTouches[0])
                x = touch.pageX
                y = touch.pageY
            } else {
                x = event.clientX
                y = event.clientY
            }
            // Update the element's position based on mouse movement
            draggableElement.style.left = `${x - offsetX}px`;
            draggableElement.style.top = `${y - offsetY}px`;
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
            draggableElement.removeEventListener('touchstart', handleMouseDown, { passive: false })
            document.removeEventListener('touchmove', handleMouseMove, { passive: false })
            document.removeEventListener('touchend', handleMouseUp, { passive: false })
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
        } />
        <TrellisControl value='trellisSkip' verb='Skip' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisSkip = state.trellisSkip
                obj.trellisSkip[rowCol].val = !state.trellisSkip[rowCol].val
                dispatch(obj)
            }}>
                {state.trellisSkip[rowCol].val ? 'True' : 'False'}
            </button>
        } />
        <TrellisControl value='trellisFlip' verb='Flip' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisFlip = state.trellisFlip
                obj.trellisFlip[rowCol].val = incrementMirrorAxis(state.trellisFlip[rowCol].val, true)
                dispatch(obj)
            }}>
                <MirrorAxisIcon val={state.trellisFlip[rowCol].val} />
            </button>
        } />
        <TrellisControl value='trellisRotate' verb='Rotate' input={rowCol =>
            <button onClick={() => {
                let obj = {}
                obj.trellisRotate = state.trellisRotate
                obj.trellisRotate[rowCol].val = incrementMirrorAxis(state.trellisRotate[rowCol].val, true)
                dispatch(obj)
            }}>
                <MirrorRotIcon val={state.trellisRotate[rowCol].val} />
            </button>
        } />

        <button onClick={() => dispatch({
            trellisOverlap: defaultTrellisControl({ x: 0, y: 0 }),
            trellisSkip: defaultTrellisControl(false),
            trellisFlip: defaultTrellisControl(MIRROR_AXIS.NONE_0),
            trellisRotate: defaultTrellisControl(MIRROR_AXIS.NONE_0),
        })}>Reset</button>

        {/* Grip */}
        <FaGripLinesVertical id="grip" color='darkgray' />
    </div>
}

// Again,
/*
 *  {
 *     row: {
 *         every: 1,
 *         val: value
 *     },
 *     col: {
 *         every: 1,
 *         val: value
 *     },
 * }
 */
function SubMenu({ title, byRow, byCol, onReset, label, transformation, resetVal }) {
    const { state, dispatch } = useContext(StateContext)
    const theme = useTheme()

    const alpha = .75
    const { col, row } = state[transformation]
    // The grid should act as part of the background, but we still need to interact with the stuff it holds
    const gridItemProps = {
        sx: {
            '& *': {
                pointerEvents: 'all',
            },
        },
    }

    return <Grid container direction="row" rowSpacing={1} columnSpacing={1} sx={{
        position: 'absolute',
        bottom: '1em',
        left: '1em',
        zIndex: 3,
        pointerEvents: 'none',
        border: state.debug ? '1px solid' : undefined,
        borderColor: state.debug ? 'black' : undefined,
        '& > div': {
            border: state.debug ? '1px solid' : undefined,
            borderColor: state.debug ? 'black' : undefined,
            display: 'flex',
            alignItems: 'end',
        },
    }}>
        <Grid size={12} {...gridItemProps}>
            {byCol}
        </Grid>
        {/* Every Column */}
        <Grid size={12} {...gridItemProps}>
            <Number
                // label="Every"
                onValueChange={val => dispatch({ [transformation]: { col: { every: val, val: col.val }, row } })}
                value={col.every}
                textColor={theme.palette.background.default}
                numberColor={theme.palette.text.primary}
                vertical
                // compact
                // bold
                bgAlpha={alpha}
            />
        </Grid>
        {/* Reset Button */}
        <Grid size='auto' {...gridItemProps}>
            <IconButton onClick={() => dispatch({ [transformation]: defaultTrellisControl(resetVal) })} variant="contained" sx={{
                // Don't know why borderRadius here is different than in Number
                borderRadius: theme.shape.borderRadius/2,
                bgcolor: theme.alpha(theme.palette.background.default, .95),
                "&:hover": {
                    bgcolor: theme.alpha(theme.palette.background.default, alpha),
                },
            }}>
                <ReplayIcon />
            </IconButton>
        </Grid>
        {/* Every Row */}
        <Grid size='auto' {...gridItemProps}>
            <Number
                // label="Skip Every"
                onValueChange={val => dispatch({ [transformation]: { row: { every: val, val: row.val }, col } })}
                value={row.every}
                textColor={theme.palette.background.default}
                numberColor={theme.palette.text.primary}
                bold
                // compact
                bgAlpha={alpha}
            />
        </Grid>
        <Grid size='grow' {...gridItemProps}>
            {byRow}
        </Grid>
    </Grid>
}

function OffsetMenu() {
    const { state, dispatch } = useContext(StateContext)
    const theme = useTheme()

    return <SubMenu
        title="Offset"
        resetVal={1}
        transformation="trellisOverlap"
        byRow={<>
            <Typography>Row</Typography>
        </>}
        byCol={<>
            <Typography>Col</Typography>
        </>}
    />
}
function SkipMenu() {
    const { state, dispatch } = useContext(StateContext)
    const theme = useTheme()

    const {row, col} = state.trellisSkip

    const sharedProps = {
        step: 1,
        marks: true,
        valueLabelDisplay: "on", // or "auto", I can't decide
        sx: {
            color: theme.palette.background.default,
            '& .MuiSlider-track': {
                bgcolor: theme.palette.background.default,
            },
            '& .MuiSlider-thumb': {
                bgcolor: theme.palette.background.default,
            },
        },
    }

    return <SubMenu
        title="Skip"
        resetVal={MIRROR_AXIS.NONE}
        transformation="trellisSkip"
        byCol={<Box sx={{height: '5rem'}}>
            <Slider
                value={col.val}
                onChange={(event, newValue) => dispatch({ trellisSkip: { col: { every: col.every, val: newValue }, row } })}
                min={0}
                max={10}
                height="5rem"
                orientation="vertical"
                // slotProps={{
                //     valueLabel: {
                //         placement: "right",
                //         sx: {
                //             // bgcolor: theme.palette.background.default,
                //         },
                //     },
                // }}
                // slotProps={{
                //     valueLabel: {
                //       style: {
                //         left: 'auto',
                //         right: 0,
                //         transform: 'translateX(100%)', // push it to the right
                //       },
                //     },
                //   }}
                {...sharedProps}
            />
         </Box>
        }
        byRow={<Box sx={{width: '5rem'}}>
            <Slider
                value={row.val}
                onChange={(event, newValue) => dispatch({ trellisSkip: { row: { every: row.every, val: newValue }, col } })}
                min={0}
                max={10}
                width="5rem"
                {...sharedProps}
            />
         </Box>
        }
    />
}

// These are shared between the flip and rotate menus
const boxSx = theme => ({
    bgcolor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius/2,
})
const sharedProps = {
    exclusive: true,
    allowNone: true,
}
const sharedButtonGroupProps = theme => ({
    // I honestly don't know where 2.5rem is coming from
    height: '2.5rem',
    color: theme.palette.primary.main,
})
function FlipMenu() {
    const { state, dispatch } = useContext(StateContext)
    const theme = useTheme()

    const {row, col} = state.trellisFlip
    const props = {...sharedProps,
        buttons: [
            { label: "Horz", icon: MirrorAxisIcon[MIRROR_AXIS.Y], value: MIRROR_AXIS.Y },
            { label: "Vert", icon: MirrorAxisIcon[MIRROR_AXIS.X], value: MIRROR_AXIS.X },
            { label: "Both", icon: MirrorAxisIcon[MIRROR_AXIS.BOTH], value: MIRROR_AXIS.BOTH },
        ],
    }

    return <SubMenu
        title="Flip"
        resetVal={MIRROR_AXIS.NONE}
        transformation="trellisFlip"
        byCol={<Box sx={boxSx(theme)}>
            <ToggleIconButtonGroup
                {...props}
                vertical
                buttonGroupSx={sharedButtonGroupProps(theme)}
                value={col.val}
                onChange={(newValue) => dispatch({
                    trellisFlip: { col: { every: col.every, val: newValue }, row },
                })}
            />
        </Box>}
        byRow={<Box sx={boxSx(theme)}>
            <ToggleIconButtonGroup
                {...props}
                buttonGroupSx={sharedButtonGroupProps(theme)}
                labelInline
                value={row.val}
                onChange={(newValue) => dispatch({
                    trellisFlip: { row: { every: row.every, val: newValue }, col },
                })}
            />
        </Box>}
    />
}
function RotateMenu() {
    const { state, dispatch } = useContext(StateContext)
    const theme = useTheme()

    const {row, col} = state.trellisRotate
    const props = {...sharedProps,
        buttons: [
            { label: "90°", icon: MirrorAxisIcon[MIRROR_AXIS.Y], value: MIRROR_ROT.RIGHT },
            { label: "180°", icon: MirrorAxisIcon[MIRROR_AXIS.X], value: MIRROR_ROT.STRAIGHT },
            { label: "270°", icon: MirrorAxisIcon[MIRROR_AXIS.BOTH], value: MIRROR_ROT.QUAD },
        ],
    }

    return <SubMenu
        title="Rotate"
        resetVal={MIRROR_ROT.NONE}
        transformation="trellisRotate"
        byCol={<Box sx={boxSx(theme)}>
            <ToggleIconButtonGroup
                {...props}
                vertical
                buttonGroupSx={sharedButtonGroupProps(theme)}
                value={col.val}
                onChange={(newValue) => dispatch({
                    trellisRotate: { col: { every: col.every, val: newValue }, row },
                })}
            />
        </Box>}
        byRow={<Box sx={boxSx(theme)}>
            <ToggleIconButtonGroup
                {...props}
                buttonGroupSx={sharedButtonGroupProps(theme)}
                labelInline
                value={row.val}
                onChange={(newValue) => dispatch({
                    trellisRotate: { row: { every: row.every, val: newValue }, col },
                })}
            />
        </Box>}
    />
}

function MobileRepeatMenuMui() {
    const { state, dispatch } = useContext(StateContext)
    const [speedDialOpen, setSpeedDialOpen] = useState(false)
    const [openSubMenus, setOpenSubMenus] = useState({
        offset: false,
        skip: false,
        flip: false,
        rotate: false,
    })

    // Be sure to close all the others
    const handleSubMenuClick = (subMenu) => {
        setOpenSubMenus({
            offset: subMenu === 'offset' && !openSubMenus.offset,
            skip: subMenu === 'skip' && !openSubMenus.skip,
            flip: subMenu === 'flip' && !openSubMenus.flip,
            rotate: subMenu === 'rotate' && !openSubMenus.rotate,
        })
    }
    // const [leftOpen, setLeftOpen] = useState({
    //     Offset: false,
    //     Skip: false,
    //     Flip: false,
    //     Rotate: false,
    // });

    return <>
        <SpeedDial
            sx={{ position: 'absolute', bottom: 16, right: 16 }}
            ariaLabel="Repeat Menu"
            // Working icon
            icon={<CropIcon />}
            open={speedDialOpen}
            // onClose={() => setSpeedDialOpen(false)}
            onClick={() => setSpeedDialOpen(!speedDialOpen)}
        >
            <SpeedDialAction icon={<KeyboardTabIcon />} slotProps={{ tooltip: { title: "Offset" } }} onClick={() => handleSubMenuClick('offset')} />
            <SpeedDialAction icon={<RedoIcon />} slotProps={{ tooltip: { title: "Skip" } }} onClick={() => handleSubMenuClick('skip')} />
            <SpeedDialAction icon={<FlipIcon />} slotProps={{ tooltip: { title: "Flip" } }} onClick={() => handleSubMenuClick('flip')} />
            <SpeedDialAction icon={<LoopIcon />} slotProps={{ tooltip: { title: "Rotate" } }} onClick={() => handleSubMenuClick('rotate')} />
        </SpeedDial>

        {openSubMenus.offset && <OffsetMenu />}
        {openSubMenus.skip && <SkipMenu />}
        {openSubMenus.flip && <FlipMenu />}
        {openSubMenus.rotate && <RotateMenu />}
    </>
}

export default MobileRepeatMenuMui

// export default function (){
//     const {state} = useContext(StateContext)
//     return state.mobile
//         ? <MobileRepeatMenuMui/>
//         : <DesktopRepeatMenuMui/>
// }
