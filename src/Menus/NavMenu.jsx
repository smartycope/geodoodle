import { useContext } from "react";
// import "../styling/NavMenu.css"
import { Number } from "./MenuUtils";

import { MdHome } from "react-icons/md";
import { PiSelectionAll } from "react-icons/pi";
import defaultOptions from "../options";
import { StateContext } from "../Contexts";
import Dist from "../helper/Dist";
import { Button, Grid, IconButton, Paper, Typography, useTheme } from "@mui/material";
import HomeIcon from '@mui/icons-material/Home';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import { getHalf } from "../utils";

function NavMenu() {
    const { state, dispatch } = useContext(StateContext)

    const { scalex, scaley, translation, side } = state
    const { x: translationx, y: translationy } = translation.asDeflated(state)

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
                    onChange={val => dispatch({ action: "translate", amt: Dist.fromDeflated(state, translationx - val, 0) })}
                    value={translationx}
                    step={scalex}
                />
                <Number
                    label='y:'
                    // TODO: this doesn't work
                    onChange={val => dispatch({ action: "translate", amt: Dist.fromDeflated(state, 0, translationy - val) })}
                    value={translationy}
                    step={scaley}
                />
            </span>
            <div id='sub-grid'>
                <span id='scale-nav-menu'>
                    Scale
                    <Number
                        // TODO: this doesn't work
                        onChange={val => dispatch({ action: "scale", amtx: val, amty: val })}
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

function NavMenuMui() {
    const { state, dispatch } = useContext(StateContext)

    const { scalex, scaley, translation, side } = state
    const { x: translationx, y: translationy } = translation.asDeflated(state)
    const half = getHalf(state)

    const theme = useTheme()
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

    return <Paper id='nav-menu' style={style} sx={{
        width: 350,
        height: 'min-content',
        /* To center it */
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'absolute',
        display: 'flex',
        flexDirection: 'row',
        // color: theme.palette.primary.contrastText,

        // #sub-grid {
        //     display: flex;
        //     flex-direction: column;
        //     align-items: center;
        // },

        // #sub-sub-grid{
        //     display: flex;
        //     flex-direction: row;
        //     align-self: center;
        // },

        // backgroundColor: rgba(20,20,20, .8),
        borderRadius: '10px',
        padding: 1,
        zIndex: 1,
        // color: white,

        // input[type="number"]{
        //     max-width: 60px;
        // }
    }}>
        <Grid container spacing={1}>
            {/* <Grid size={6}> */}
            {/* <Typography variant="h6">Position</Typography> */}
            {/* </Grid> */}

            {/* Position x */}
            <Grid size={6}>
                <Number
                    value={translationx}
                    label="Position x"
                    step={1}
                    //    color={theme.palette.primary.contrastText}
                    largeStep={10}
                    snapOnStep={true}
                    color={theme.palette.primary.contrastText}
                    onValueChange={val => dispatch({ action: "translate", amt: Dist.fromDeflated(state, translationx - val, 0) })}
                />
            </Grid>

            {/* Scale */}
            <Grid size={6}>
                {/* <Typography variant="h6">Scale</Typography> */}
                <Number
                    value={scalex}
                    label='Scale'
                    color={theme.palette.primary.contrastText}
                    onMinus={() => dispatch({ action: "scale", amtx: -scalex/2, amty: -scaley/2, center: half })}
                    onPlus={() => dispatch({ action: "scale", amtx: scalex, amty: scaley, center: half })}
                    // See also: "scale" action in the reducer
                    min={defaultOptions.minScale}
                    max={defaultOptions.maxScale}
                />
            </Grid>
            {/* Position y */}
            <Grid size={6}>
                <Number
                    value={translationy}
                    label="Position y"
                    largeStep={10}
                    snapOnStep={true}
                    step={1}
                    color={theme.palette.primary.contrastText}
                    scrubDirection='vertical' // This doesn't work
                    onValueChange={val => dispatch({ action: "translate", amt: Dist.fromDeflated(state, 0, translationy - val) })}
                />
            </Grid>
            {/* Buttons */}
            <Grid size={6} sx={{m: 'auto'}}>
                <IconButton id='home-button'
                    onClick={() => dispatch('go_home')}
                    title="Reset position and scale"
                    // sx={{color: theme.palette.primary.main}}
                    size='large'
                >
                    <HomeIcon />
                </IconButton>
                <IconButton id='nav-selection-button'
                    onClick={() => dispatch('go_to_selection')}
                    title="Go to the current selection"
                    // sx={{color: theme.palette.primary.main}}
                    size='large'
                >
                    <HighlightAltIcon />
                </IconButton>
            </Grid>
        </Grid>
    </Paper>
}

export default NavMenuMui
