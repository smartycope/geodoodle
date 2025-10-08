import { useContext } from "react";
import { ColorPicker, ColorService } from "react-color-palette";
import options from "../options";
import Number from "./Number";
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';
import MiniMenu from "./MiniMenu";

import { StateContext } from "../Contexts";
import { getShowableStroke } from "../utils";
import { FormControlLabel, Stack, TextField, useTheme } from "@mui/material";


export default function ColorMenu() {
    const { state, dispatch } = useContext(StateContext)
    const theme = useTheme()

    const { stroke, strokeWidth, dash, colorProfile, scalex, fillMode, fill } = state
    const colors = fillMode ? fill : stroke

    return <MiniMenu menu="color">
        <Box sx={{
            // Squishes sideways if the screen is too small - this works for all toolbar sides
            '@media (max-height: 784px)': {
                display: 'flex',
            },
        }}>
        {/* The full screen color menu */}
        <Box sx={{
            // I can't style the ColorPicker directly, so I have to style the children of it's parent
            '& *': {
                backgroundColor: 'inherit',
                color: 'inherit',
            },
        }}>
            <ColorPicker
                color={ColorService.convert('hex', colors[colorProfile])}
                hideInput={['hsv', state.hideHexColor ? 'hex' : '']}
                onChange={clr => dispatch({action: 'set_color', color: clr.hex})}
            />
        </Box>

        <Stack spacing={1} sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
        }}>
            {/* Color profile buttons */}
            {/* TODO: there should be a way to get this to expand horizontally */}
            <ButtonGroup variant="contained" sx={{
                // '& :hover': {
                //     outline: '2px solid rgb(0, 132, 176)',
                // },
            }}>
                {Array(options.commonColorAmt).fill().map((_, i) =>
                    <Button
                        onClick={() => dispatch({ colorProfile: i })}
                        sx={{
                            backgroundColor: fillMode ? fill[i] : state.paperColor,
                            outline: i === colorProfile ? "2px solid rgb(0, 132, 176)" : "none",
                            color: getShowableStroke(fillMode ? fill[i] : state.paperColor),
                            width: '100%',
                        }}
                        key={`colorButton${i}`}
                    >{i + 1}<svg width="100%" height='20' viewBox="-7 0 20 20" preserveAspectRatio="xMidYMid meet"><line
                        x1={0} x2="100%" y1={10} y2={10}
                        stroke={fillMode ? 'black' : stroke[i]}
                        strokeWidth={strokeWidth[i] * scalex}
                        strokeLinecap="round"
                    /></svg></Button>
                )}
            </ButtonGroup>

            {/* Stroke input */}
            {!fillMode && <Number
                id='stroke-input'
                label="Stroke"
                min={1}
                step={1}
                // color={theme.palette.primary.contrastText}
                largeStep={5}
                snapOnStep={true}
                allowWheelScrub={true}
                value={strokeWidth[colorProfile] * 100}
                onValueChange={val => dispatch({ action: 'set_stroke_width', strokeWidth: val / 100 })}
            />}

            {/* Dash code */}
            {!fillMode && <TextField
                id="dash-input"
                size="small"
                label="Dash Code"
                value={dash[colorProfile]}
                onChange={e => dispatch({ action: 'set_dash', dash: e.target.value })}
            />}

            {/* Toggle fill mode button */}
            {/* TODO: I don't like this here, but I don't know where else to put it yet */}
            <FormControlLabel control={
                <Switch
                    id='color-menu-fill-button'
                    label="Fill"
                    checked={fillMode}
                    onChange={() => dispatch('toggle_fill_mode')}
                />
            } label="Fill Mode" labelPlacement="start" sx={{color: theme.palette.text.primary}}/>


            <Button id='color-menu-close-button'
                onClick={() => {
                    dispatch({ action: 'menu', close: 'color' })
                }}
                sx={{
                    backgroundColor: state.paperColor,
                    width: '80%',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '10px',
                    borderRadius: '10px',
                    color: theme.palette.primary.contrast,
                }}
            >
                Close
                <svg width="90%" height='10'><line
                    x1='0' x2="90%" y1={5} y2={5}
                    stroke={fillMode ? 'black' : stroke[colorProfile]}
                    strokeWidth={strokeWidth[colorProfile] * scalex}
                    // TODO: this doesn't match the actual line
                    strokeDasharray={dash[colorProfile]}
                    strokeLinecap="round"
                /></svg>
            </Button>
        </Stack>
        </Box>
    </MiniMenu>
}