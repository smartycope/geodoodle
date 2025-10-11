import { useContext, useMemo, useState } from "react"
import { MIRROR_AXIS, MIRROR_ROT } from "../globals"
import { MirrorAxisIcon, MirrorRotIcon } from "./MirrorIcons"
import Number from "./Number"
import { defaultTrellisControl, getBoundRect } from "../utils"

import { StateContext } from "../Contexts"
import KeyboardTabIcon from "@mui/icons-material/KeyboardTab"
import RedoIcon from "@mui/icons-material/Redo"
import FlipIcon from "@mui/icons-material/Flip"
import { Box, Grid, IconButton, SpeedDial, SpeedDialAction, Typography, useTheme } from "@mui/material"
import ReplayIcon from "@mui/icons-material/Replay"
import ToggleIconButtonGroup from "./ToggleIconButtonGroup"
import BlurOnIcon from "@mui/icons-material/BlurOn"
import BlurOffIcon from "@mui/icons-material/BlurOff"
import DashboardIcon from "@mui/icons-material/Dashboard"

// For reference,
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
// The grid should act as part of the background, but we still need to interact with the stuff it holds
const gridItemSx = {
  "& *": {
    pointerEvents: "all",
  },
}
const numberAlpha = 0.75
const numberProps = (theme) => ({
  textColor: theme.palette.primary.contrast,
  numberColor: theme.palette.text.primary,
  compact: false,
  bold: true,
  bgAlpha: numberAlpha,
})
function SubMenu({ title, byHorizontal, byVertical, transformation, resetVal, everyMin = 1 }) {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { col, row } = state[transformation]

  return (
    <Grid
      container
      direction="row"
      rowSpacing={1}
      columnSpacing={1}
      sx={{
        position: "absolute",
        bottom: ".5rem",
        left: ".5rem",
        zIndex: 3,
        width: "max-content",
        pointerEvents: "none",
        border: state.debug ? "1px solid" : undefined,
        borderColor: state.debug ? "black" : undefined,
        "& > div": {
          border: state.debug ? "1px solid" : undefined,
          borderColor: state.debug ? "black" : undefined,
          display: "flex",
          alignItems: "center",
        },
      }}
    >
      {/* By Vertical */}
      <Grid size={12} sx={gridItemSx}>
        {byVertical}
      </Grid>

      {/* Every Column */}
      <Grid size={"auto"} sx={{ ...gridItemSx, display: "flex", justifyContent: "center" }}>
        <div id="tour3">
          <Number
            onValueChange={(val) => dispatch({ [transformation]: { col: { every: val, val: col.val }, row } })}
            value={col.every}
            vertical
            min={everyMin}
            max={Math.floor(window.innerWidth / state.scaley)}
            {...numberProps(theme)}
          />
        </div>
      </Grid>

      {/* Label */}
      <Grid size={{ xs: 10, sm: 10, md: 10, lg: 11 }} sx={gridItemSx}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: "bold",
            opacity: 0.5,
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            color: theme.palette.primary.contrast,
            pointerEvents: "none",
          }}
        >
          {title}
        </Typography>
      </Grid>

      {/* Reset Button */}
      <Grid size={"auto"} sx={gridItemSx}>
        <IconButton
          onClick={() => dispatch({ [transformation]: defaultTrellisControl(resetVal) })}
          variant="contained"
          sx={{
            // Don't know why borderRadius here is different than in Number
            borderRadius: theme.shape.borderRadius / 2,
            bgcolor: theme.alpha(theme.palette.background.default, 0.95),
            "&:hover": {
              bgcolor: theme.alpha(theme.palette.background.default, numberAlpha),
            },
          }}
        >
          <ReplayIcon />
        </IconButton>
      </Grid>

      {/* Every Row */}
      <Grid size="auto" sx={gridItemSx}>
        <div id="tour2">
          {" "}
          {/* I hate everyone */}
          <Number
            onValueChange={(val) => dispatch({ [transformation]: { row: { every: val, val: row.val }, col } })}
            value={row.every}
            min={everyMin}
            max={Math.floor(window.innerWidth / state.scaley)}
            {...numberProps(theme)}
          />
        </div>
      </Grid>

      {/* By Horizontal */}
      <Grid size="grow" sx={gridItemSx}>
        {byHorizontal}
      </Grid>
    </Grid>
  )
}

function OffsetMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()
  const { col, row } = state.trellisOverlap
  // Only update when bounds change is intentional, the state changes every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { x: patternW, y: patternH } = useMemo(() => getBoundRect(state).wh.asDeflated(), [state.bounds])
  const minx = -patternW * 2 + 1
  const maxx = patternW * 2 - 1
  const miny = -patternH * 2 + 1
  const maxy = patternH * 2 - 1

  return (
    <SubMenu
      title="Offset"
      resetVal={{ x: 0, y: 0 }}
      transformation="trellisOverlap"
      byHorizontal={
        <Grid
          container
          direction="row"
          sx={{
            position: "absolute",
            // This puts it where it already would go, but doesn't take up space in the grid
            bottom: 0,
            pointerEvents: "none",
            border: state.debug ? "1px solid" : undefined,
            borderColor: state.debug ? "blue" : undefined,
            "& > div": {
              border: state.debug ? "1px solid" : undefined,
              borderColor: state.debug ? "blue" : undefined,
              display: "flex",
              alignItems: "center",
            },
          }}
        >
          {/* We have to make our own labels and put them in a grid so they're aligned how we want */}
          <Grid size={"auto"}>
            <Number
              onValueChange={(newVal) =>
                dispatch({
                  trellisOverlap: {
                    row: { every: row.every, val: { x: newVal, y: row.val.y } },
                    col,
                  },
                })
              }
              value={row.val.x}
              max={maxx}
              min={minx}
              {...numberProps(theme)}
            />
          </Grid>
          <Grid size={"grow"}>
            <label
              htmlFor={"x"}
              style={{
                color: theme.palette.primary.contrast,
                fontWeight: "bold",
              }}
            >
              X
            </label>
          </Grid>
          <Grid size={"auto"}>
            <Number
              onValueChange={(newVal) =>
                dispatch({
                  trellisOverlap: {
                    row: { every: row.every, val: { x: row.val.x, y: newVal } },
                    col,
                  },
                })
              }
              value={row.val.y}
              max={maxy}
              min={miny}
              {...numberProps(theme)}
            />
          </Grid>
          <Grid size={"grow"}>
            <label
              htmlFor={"y"}
              style={{
                color: theme.palette.primary.contrast,
                fontWeight: "bold",
              }}
            >
              Y
            </label>
          </Grid>
        </Grid>
      }
      byVertical={
        <>
          <Number
            onValueChange={(newVal) => {
              console.log(newVal)
              dispatch({
                trellisOverlap: { col: { every: col.every, val: { x: newVal, y: col.val.y } }, row },
              })
            }}
            value={col.val.x}
            label="X"
            vertical
            max={maxx}
            min={minx}
            {...numberProps(theme)}
          />
          <Number
            onValueChange={(newVal) =>
              dispatch({
                trellisOverlap: { col: { every: col.every, val: { x: col.val.x, y: newVal } }, row },
              })
            }
            value={col.val.y}
            label="Y"
            vertical
            max={maxy}
            min={miny}
            {...numberProps(theme)}
          />
        </>
      }
    />
  )
}

function SkipMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { row, col } = state.trellisSkip
  const len = 10

  return (
    <SubMenu
      title="Skip"
      resetVal={MIRROR_AXIS.NONE}
      transformation="trellisSkip"
      byVertical={
        <Number
          onValueChange={(val) => dispatch({ trellisSkip: { col: { every: col.every, val }, row } })}
          label="X"
          value={col.val}
          min={0}
          max={len}
          vertical
          {...numberProps(theme)}
        />
      }
      // Just like in OffsetMenu, we have to make our own labels so they're aligned how we want
      byHorizontal={
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "start;" }}>
          <Number
            onValueChange={(val) => dispatch({ trellisSkip: { row: { every: row.every, val }, col } })}
            value={row.val}
            min={0}
            max={len}
            {...numberProps(theme)}
          />
          <label
            htmlFor={"y"}
            style={{
              color: theme.palette.primary.contrast,
              fontWeight: "bold",
            }}
          >
            Y
          </label>
        </Box>
      }
    />
  )
}

// These are shared between the flip and rotate menus
const boxSx = (theme) => ({
  bgcolor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius / 2,
})
const sharedProps = {
  exclusive: true,
  allowNone: true,
}
const sharedButtonGroupProps = (theme) => ({
  // this value is coming from the "width" of the Number component, I believe
  height: "2.5rem",
  color: theme.palette.primary.main,
})

function FlipMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { row, col } = state.trellisFlip
  const props = {
    ...sharedProps,
    buttons: [
      // TODO: I don't love these icons for this, I think they should be different
      { label: "Horz", icon: MirrorAxisIcon(MIRROR_AXIS.Y), value: MIRROR_AXIS.Y },
      { label: "Vert", icon: MirrorAxisIcon(MIRROR_AXIS.X), value: MIRROR_AXIS.X },
      { label: "Both", icon: MirrorAxisIcon(MIRROR_AXIS.BOTH), value: MIRROR_AXIS.BOTH },
    ],
  }

  return (
    <SubMenu
      title="Flip"
      resetVal={MIRROR_AXIS.NONE}
      transformation="trellisFlip"
      byVertical={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            sx={{ width: "2.5rem" }}
            vertical
            buttonGroupSx={sharedButtonGroupProps(theme)}
            value={col.val}
            onChange={(newValue) =>
              dispatch({
                trellisFlip: { col: { every: col.every, val: newValue }, row },
              })
            }
          />
        </Box>
      }
      byHorizontal={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            buttonGroupSx={sharedButtonGroupProps(theme)}
            labelInline
            value={row.val}
            onChange={(newValue) =>
              dispatch({
                trellisFlip: { row: { every: row.every, val: newValue }, col },
              })
            }
          />
        </Box>
      }
    />
  )
}

function RotateMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { row, col } = state.trellisRotate
  const props = {
    ...sharedProps,
    buttons: [
      { label: "90°", icon: MirrorRotIcon(MIRROR_ROT.RIGHT, true), value: MIRROR_ROT.RIGHT },
      { label: "180°", icon: MirrorRotIcon(MIRROR_ROT.STRAIGHT, true), value: MIRROR_ROT.STRAIGHT },
      { label: "270°", icon: MirrorRotIcon(MIRROR_ROT.QUAD, true), value: MIRROR_ROT.QUAD },
    ],
  }

  return (
    <SubMenu
      title="Rotate"
      resetVal={MIRROR_ROT.NONE}
      transformation="trellisRotate"
      byVertical={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            id="tour1"
            sx={{ width: "2.5rem" }}
            vertical
            buttonGroupSx={sharedButtonGroupProps(theme)}
            value={col.val}
            onChange={(newValue) =>
              dispatch({
                trellisRotate: { col: { every: col.every, val: newValue }, row },
              })
            }
          />
        </Box>
      }
      byHorizontal={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            id="tour0"
            buttonGroupSx={sharedButtonGroupProps(theme)}
            labelInline
            value={row.val}
            onChange={(newValue) =>
              dispatch({
                trellisRotate: { row: { every: row.every, val: newValue }, col },
              })
            }
          />
        </Box>
      }
    />
  )
}

export default function RepeatMenu() {
  const { state, dispatch } = useContext(StateContext)
  const [speedDialOpen, setSpeedDialOpen] = useState(false)
  const [openSubMenus, setOpenSubMenus] = useState({
    offset: false,
    skip: false,
    flip: false,
    rotate: false,
  })
  const { side } = state

  // Be sure to close all the others
  const handleSubMenuClick = (subMenu) => {
    setOpenSubMenus({
      offset: subMenu === "offset" && !openSubMenus.offset,
      skip: subMenu === "skip" && !openSubMenus.skip,
      flip: subMenu === "flip" && !openSubMenus.flip,
      rotate: subMenu === "rotate" && !openSubMenus.rotate,
    })
  }

  const vertical = window.innerHeight > window.innerWidth

  // In the corner
  let pos = { top: 16, left: 16 }
  // Below the toolbar FAB
  if (side === "top")
    pos = { top: "5rem", right: 16 }
  // To the left of the toolbar FAB
  else if (side === "right")
    pos = { top: 16, right: "5rem" }

  // For the tooltips
  const placement = vertical ? "right" : "bottom-end"
  // TODO: the vertical here just disables tooltips if the menu is sideways, because SpeedDialActions
  // don't seem to acknowledge the placement prop
  const open = state.mobile && vertical

  return (
    <>
      <SpeedDial
        id="repeat-speed-dial"
        sx={{ position: "absolute", ...pos }}
        ariaLabel="Repeat Menu"
        direction={vertical ? "down" : "left"}
        // direction="down"
        icon={<DashboardIcon />}
        open={speedDialOpen}
        onClick={() => setSpeedDialOpen(!speedDialOpen)}
      >
        {/* TODO: make the tooltips transparent */}
        <SpeedDialAction
          icon={<KeyboardTabIcon />}
          slotProps={{ tooltip: { title: "Offset", open, placement } }}
          // tooltipPlacement={placement}
          onClick={() => handleSubMenuClick("offset")}
        />
        <SpeedDialAction
          icon={<RedoIcon />}
          slotProps={{ tooltip: { title: "Skip", open, placement } }}
          onClick={() => handleSubMenuClick("skip")}
        />
        <SpeedDialAction
          icon={<FlipIcon />}
          slotProps={{ tooltip: { title: "Flip", open, placement } }}
          onClick={() => handleSubMenuClick("flip")}
        />
        <SpeedDialAction
          icon={MirrorRotIcon(MIRROR_ROT.STRAIGHT)}
          slotProps={{ tooltip: { title: "Rotate", open, placement } }}
          onClick={() => handleSubMenuClick("rotate")}
        />
        <SpeedDialAction
          icon={<ReplayIcon />}
          slotProps={{ tooltip: { title: "Reset", open, placement } }}
          onClick={(e) => {
            dispatch({
              trellisOverlap: defaultTrellisControl({ x: 0, y: 0 }),
              trellisSkip: defaultTrellisControl(false),
              trellisFlip: defaultTrellisControl(MIRROR_AXIS.NONE),
              trellisRotate: defaultTrellisControl(MIRROR_ROT.NONE),
            })
            e.stopPropagation()
          }}
          onClickCapture={() => setSpeedDialOpen(true)}
        />
        <SpeedDialAction
          icon={state.hideDots ? <BlurOnIcon /> : <BlurOffIcon />}
          slotProps={{ tooltip: { title: "Toggle Dots", open, placement } }}
          onClick={(e) => {
            dispatch({ hideDots: !state.hideDots })
            e.stopPropagation()
          }}
        />
      </SpeedDial>

      {openSubMenus.offset && <OffsetMenu />}
      {openSubMenus.skip && <SkipMenu />}
      {openSubMenus.flip && <FlipMenu />}
      {openSubMenus.rotate && <RotateMenu />}
    </>
  )
}
