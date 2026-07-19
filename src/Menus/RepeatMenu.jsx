import { useContext, useEffect, useState } from "react"
import { MIRROR_AXIS, MIRROR_ROT } from "../globals"
import { MirrorAxisIcon, MirrorRotIcon } from "./CustomIcons"
import Number from "./Number"

import { StateContext } from "../Contexts"
import KeyboardTabIcon from "@mui/icons-material/KeyboardTab"
import RedoIcon from "@mui/icons-material/Redo"
import FlipIcon from "@mui/icons-material/Flip"
import { Box, IconButton, SpeedDial, SpeedDialAction, Typography, useTheme } from "@mui/material"
import ReplayIcon from "@mui/icons-material/Replay"
import ToggleIconButtonGroup from "./ToggleIconButtonGroup"
import BlurOnIcon from "@mui/icons-material/BlurOn"
import BlurOffIcon from "@mui/icons-material/BlurOff"
import DashboardIcon from "@mui/icons-material/Dashboard"
import CheckIcon from "@mui/icons-material/Check"
import FindReplaceIcon from "@mui/icons-material/FindReplace"
import CallMadeIcon from "@mui/icons-material/CallMade"

const updateDraft = (dispatch, key, value) => dispatch({ action: "update_trellis_draft", key, value })

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
  display: "flex",
  alignItems: "center",
  "& *": {
    pointerEvents: "all",
  },
}
const numberAlpha = 0.8
const numberProps = (theme) => ({
  textColor: theme.palette.primary.contrast,
  numberColor: theme.palette.text.primary,
  compact: false,
  bold: true,
  bgAlpha: numberAlpha,
})
const centeredVerticalLabelStyle = { alignItems: "center" }
function SubMenu({ title, byHorizontal, byVertical, transformation, resetVal, everyMin = 1 }) {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { col, row } = state.trellisDraft.trellis[transformation]

  return (
    <Box
      data-testid="repeat-submenu"
      sx={{
        position: "absolute",
        bottom: ".5rem",
        left: ".5rem",
        zIndex: 3,
        width: "max-content",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pointerEvents: "none",
        border: state.debug ? "1px solid" : undefined,
        borderColor: state.debug ? "black" : undefined,
        "& > div": {
          border: state.debug ? "1px solid" : undefined,
          borderColor: state.debug ? "black" : undefined,
        },
      }}
    >
      {/* By Vertical */}
      <Box sx={gridItemSx}>{byVertical}</Box>

      <Box
        data-testid="repeat-submenu-control-row"
        sx={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 1, alignItems: "center" }}
      >
        {/* Every Column */}
        <Box sx={{ ...gridItemSx, justifyContent: "center" }}>
          <div id="tour3">
            <Number
              onValueChange={(val) => updateDraft(dispatch, transformation, { col: { every: val, val: col.val }, row })}
              value={col.every}
              vertical
              min={everyMin}
              max={Math.floor(window.innerWidth / state.scaley)}
              {...numberProps(theme)}
            />
          </div>
        </Box>

        {/* Label */}
        <Box sx={{ ...gridItemSx, alignSelf: "stretch", alignItems: "flex-end", justifyContent: "flex-start" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              opacity: 0.5,
              color: theme.palette.primary.contrast,
              pointerEvents: "none",
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>

      <Box data-testid="repeat-submenu-horizontal-row" sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        {/* Reset Button */}
        <Box sx={gridItemSx}>
          <IconButton
            aria-label={`Reset ${title}`}
            onClick={() =>
              updateDraft(dispatch, transformation, {
                row: { every: 1, val: resetVal },
                col: { every: 1, val: resetVal },
              })
            }
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
        </Box>

        {/* Every Row */}
        <Box sx={gridItemSx}>
          <div id="tour2">
            <Number
              onValueChange={(val) => updateDraft(dispatch, transformation, { row: { every: val, val: row.val }, col })}
              value={row.every}
              min={everyMin}
              max={Math.floor(window.innerWidth / state.scaley)}
              {...numberProps(theme)}
            />
          </div>
        </Box>

        {/* By Horizontal */}
        <Box sx={{ ...gridItemSx, flex: 1 }}>{byHorizontal}</Box>
      </Box>
    </Box>
  )
}

function OffsetMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()
  const { col, row } = state.trellisDraft.trellis.overlap
  const { x: patternW, y: patternH } = state.trellisDraft.trellis.sourceSize.asDeflated()
  const minx = -patternW * 2 + 1
  const maxx = patternW * 2 - 1
  const miny = -patternH * 2 + 1
  const maxy = patternH * 2 - 1

  return (
    <SubMenu
      title="Offset"
      resetVal={{ x: 0, y: 0 }}
      transformation="overlap"
      byHorizontal={
        <Box
          data-testid="offset-horizontal-controls"
          sx={{
            position: "absolute",
            // This puts it where it already would go, but doesn't take up space in the grid
            bottom: 0,
            display: "grid",
            gridTemplateColumns: "auto max-content",
            gridTemplateRows: "repeat(2, auto)",
            columnGap: 0.5,
            alignItems: "center",
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
          <Box sx={gridItemSx}>
            <Number
              onValueChange={(newVal) =>
                updateDraft(dispatch, "overlap", {
                  row: { every: row.every, val: { x: newVal, y: row.val.y } },
                  col,
                })
              }
              value={row.val.x}
              max={maxx}
              min={minx}
              {...numberProps(theme)}
            />
          </Box>
          <Box sx={gridItemSx}>
            <label
              htmlFor={"x"}
              style={{
                color: theme.palette.primary.contrast,
                fontWeight: "bold",
              }}
            >
              X
            </label>
          </Box>
          <Box sx={gridItemSx}>
            <Number
              onValueChange={(newVal) =>
                updateDraft(dispatch, "overlap", {
                  row: { every: row.every, val: { x: row.val.x, y: newVal } },
                  col,
                })
              }
              value={row.val.y}
              max={maxy}
              min={miny}
              {...numberProps(theme)}
            />
          </Box>
          <Box sx={gridItemSx}>
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
        </Box>
      }
      byVertical={
        <>
          <Number
            onValueChange={(newVal) => {
              updateDraft(dispatch, "overlap", {
                col: { every: col.every, val: { x: newVal, y: col.val.y } },
                row,
              })
            }}
            value={col.val.x}
            label="X"
            style={centeredVerticalLabelStyle}
            vertical
            max={maxx}
            min={minx}
            {...numberProps(theme)}
          />
          <Number
            onValueChange={(newVal) =>
              updateDraft(dispatch, "overlap", {
                col: { every: col.every, val: { x: col.val.x, y: newVal } },
                row,
              })
            }
            value={col.val.y}
            label="Y"
            style={centeredVerticalLabelStyle}
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

  const { row, col } = state.trellisDraft.trellis.skip
  const len = 10

  return (
    <SubMenu
      title="Skip"
      resetVal={MIRROR_AXIS.NONE}
      transformation="skip"
      byVertical={
        <Number
          onValueChange={(val) => updateDraft(dispatch, "skip", { col: { every: col.every, val }, row })}
          label="X"
          style={centeredVerticalLabelStyle}
          value={col.val}
          min={0}
          max={len}
          vertical
          {...numberProps(theme)}
        />
      }
      // Just like in OffsetMenu, we have to make our own labels so they're aligned how we want
      byHorizontal={
        <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <Number
            onValueChange={(val) => updateDraft(dispatch, "skip", { row: { every: row.every, val }, col })}
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

  const { row, col } = state.trellisDraft.trellis.flip
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
      transformation="flip"
      byVertical={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            sx={{ width: "2.5rem" }}
            vertical
            buttonGroupSx={sharedButtonGroupProps(theme)}
            value={col.val}
            onChange={(newValue) => updateDraft(dispatch, "flip", { col: { every: col.every, val: newValue }, row })}
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
            onChange={(newValue) => updateDraft(dispatch, "flip", { row: { every: row.every, val: newValue }, col })}
          />
        </Box>
      }
    />
  )
}

function RotateMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()

  const { row, col } = state.trellisDraft.trellis.rotate
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
      transformation="rotate"
      byVertical={
        <Box sx={boxSx(theme)}>
          <ToggleIconButtonGroup
            {...props}
            id="tour1"
            sx={{ width: "2.5rem" }}
            vertical
            buttonGroupSx={sharedButtonGroupProps(theme)}
            value={col.val}
            onChange={(newValue) => updateDraft(dispatch, "rotate", { col: { every: col.every, val: newValue }, row })}
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
            onChange={(newValue) => updateDraft(dispatch, "rotate", { row: { every: row.every, val: newValue }, col })}
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
  const draft = state.trellisDraft
  const hasCompletedSelection = state.bounds.length > 1

  // Selection-removing actions can discard the draft while this menu (and an
  // open submenu) is mounted. Close through the normal menu action so toolbar
  // state is restored consistently.
  useEffect(() => {
    if (!draft && state.openMenus.repeat) dispatch({ action: "menu", close: "repeat" })
  }, [dispatch, draft, state.openMenus.repeat])

  if (!draft) return null

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
  if (side === "top") pos = { top: "5rem", right: 16 }
  // To the left of the toolbar FAB
  else if (side === "right") pos = { top: 16, right: "5rem" }

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
          id="repeat-apply"
          icon={<CheckIcon />}
          slotProps={{ tooltip: { title: "Apply", open, placement } }}
          onClick={(e) => {
            dispatch("apply_trellis")
            e.stopPropagation()
          }}
        />
        {state.trellis && hasCompletedSelection && (
          <SpeedDialAction
            icon={<FindReplaceIcon />}
            slotProps={{ tooltip: { title: "Replace", open, placement } }}
            onClick={(e) => {
              dispatch("replace_trellis")
              e.stopPropagation()
            }}
          />
        )}
        {state.trellis && (
          <SpeedDialAction
            icon={<CallMadeIcon />}
            slotProps={{ tooltip: { title: "Release", open, placement } }}
            onClick={(e) => {
              dispatch("release_trellis")
              e.stopPropagation()
            }}
          />
        )}
        <SpeedDialAction
          icon={<ReplayIcon />}
          slotProps={{ tooltip: { title: "Reset", open, placement } }}
          onClick={(e) => {
            dispatch("reset_trellis_draft")
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
