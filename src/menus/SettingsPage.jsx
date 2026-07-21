import { useContext, useRef, useState } from "react"
import Number from "../components/Number"
import { ColorPicker, ColorService } from "react-color-palette"
import "react-color-palette/dist/css/rcp.css"
import { cursors, version } from "../globals"
import { StateContext } from "../Contexts"
import Page from "../components/Page"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
import ListItemText from "@mui/material/ListItemText"
import ListSubheader from "@mui/material/ListSubheader"
import MenuItem from "@mui/material/MenuItem"
import Popover from "@mui/material/Popover"
import Select from "@mui/material/Select"
import styled from "@emotion/styled"
import { useTheme } from "@mui/material/styles"
import { extraButtons } from "../globals"
import { clearPreservedState } from "../utils/files"
import { Box, Divider, Slider } from "@mui/material"
import defaultOptions from "../options"
import { readBackgroundImage } from "../utils/backgroundImage"

const StyledSubheader = styled(ListSubheader)(({ theme }) => {
  // Yes this inconsistent, but *I like it*
  const bg = theme.palette.mode === "dark" ? theme.palette.background.paper : theme.palette.primary.light
  return {
    backgroundColor: bg,
    width: "100%",
    color: theme.darken(theme.palette.getContrastText(bg), 0.1),
    borderRadius: theme.shape.borderRadius,
  }
})

function Setting({ label, help, children, mobileOnly, desktopOnly }) {
  const { state } = useContext(StateContext)
  if (mobileOnly && !state.mobile) return null
  if (desktopOnly && state.mobile) return null
  return (
    <ListItem>
      <ListItemText primary={label} secondary={help} />
      {children}
    </ListItem>
  )
}

export default function SettingsPage() {
  const { state, dispatch } = useContext(StateContext)
  const [palletteVisible, setPalletteVisible] = useState(false)
  const colorMenuButton = useRef()
  const theme = useTheme()

  const {
    removeSelectionAfterDelete,
    removeSelectionAfterCopy,
    side,
    invertedScroll,
    rotateClipboardOnScroll,
    scrollSensitivity,
    hideHexColor,
    useHSVColorPicker,
    enableGestureScale,
    cursor,
    extraButton,
    hideDots,
    maxUndoAmt,
    debug,
    gestureTranslateSensitivity,
    gestureScaleSensitivity,
    smoothGestureScale,
    dotsAboveArtwork,
    paperColor,
    backgroundImage,
    defaultToMemorableNames,
    themeMode,
    allowSnapToIntersections,
    toolbarOpacity,
    disableSelectionCanvasButtons,
    loopCursorAtEdges,
    defaultScalex,
    allowCanvasRotation,
    useFancyGlow,
    holdTapAction,
  } = state
  const reopenMenusWithToolbar = state.reopenMenusWithToolbar ?? true

  const handleBackgroundImageChange = async (event) => {
    const [file] = event.target.files ?? []
    if (!file) return

    try {
      const { image, color } = await readBackgroundImage(file)
      dispatch({ action: "set_background_image", image, color })
    } catch (error) {
      console.error("Failed to set background image", error)
      dispatch({ toast: "Unable to use that image as a background" })
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Page
      menu="settings"
      sx={{
        "& .MuiListItemText-primary, & .MuiListItemText-secondary, & .MuiListSubheader-root, & .MuiButton-root, & .MuiSelect-select":
          {
            fontSize: { xs: "0.70rem", sm: "0.875rem", md: "1rem" },
          },
      }}
    >
      <List subheader={<StyledSubheader>General</StyledSubheader>}>
        {/* General */}
        <Setting label="Background">
          <Button
            ref={colorMenuButton}
            id="color-picker-button"
            onClick={() => setPalletteVisible(!palletteVisible)}
            sx={{ backgroundColor: paperColor, color: theme.palette.getContrastText(paperColor) }}
          >
            Pick Background
          </Button>
          <Popover
            open={palletteVisible}
            onClose={() => {
              setPalletteVisible(false)
            }}
            anchorEl={document.getElementById("color-picker-button")}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <Box sx={{ p: 0.75 }}>
              <ColorPicker
                color={ColorService.convert("hex", paperColor)}
                hideAlpha={true}
                hideInput={["hsv", hideHexColor ? "hex" : ""]}
                onChange={(clr) => dispatch({ action: "set_paper_color", color: clr.hex })}
              />
              <Divider sx={{ my: 0.75 }} />
              <Box sx={{ display: "flex", gap: 0.75, justifyContent: "flex-end" }}>
                <Button component="label" size="small" variant="outlined">
                  Upload Image
                  <input hidden type="file" accept="image/*" onChange={handleBackgroundImageChange} />
                </Button>
                {backgroundImage && (
                  <Button size="small" onClick={() => dispatch("clear_background_image")}>
                    Remove Image
                  </Button>
                )}
              </Box>
            </Box>
          </Popover>
        </Setting>

        <Setting label="Hide Dots" help="Useful for saving images or admiring your creation">
          <Checkbox checked={hideDots} onChange={() => dispatch({ action: "toggle_dots" })} />
        </Setting>

        <Setting label="Menu Side" help="Controls the side of the screen the menu is on">
          <Select
            required
            onChange={(e) => dispatch({ action: "set_manual_and_save_settings", side: e.target.value })}
            value={side}
          >
            {["Top", "Left", "Right", "Bottom"].map((i) => (
              <MenuItem sx={{ width: "100%" }} value={i.toLowerCase()} key={i}>
                {i}
              </MenuItem>
            ))}
          </Select>
        </Setting>

        <Setting label="Extra Button" help="Defines the functionality of the customizable button">
          <Select
            required
            onChange={(e) => dispatch({ action: "set_manual_and_save_settings", extraButton: e.target.value })}
            value={extraButton}
          >
            {Object.keys(extraButtons).map((i) => (
              <MenuItem sx={{ width: "100%" }} value={i} key={i}>
                {(i.charAt(0).toUpperCase() + i.slice(1)).replace(/_/g, " ")}
              </MenuItem>
            ))}
          </Select>
        </Setting>

        <Setting
          label="Remove Selection"
          help="Controls when selection bounds are removed after copying, cutting, or deleting selected lines"
        >
          <Select
            value={removeSelectionAfterCopy ? "always" : removeSelectionAfterDelete ? "cut" : "never"}
            onChange={(e) => {
              const removeAfterCut = e.target.value !== "never"
              dispatch({
                action: "set_manual_and_save_settings",
                removeSelectionAfterDelete: removeAfterCut,
                removeSelectionAfterCopy: e.target.value === "always",
              })
            }}
          >
            <MenuItem value="never">Never Remove</MenuItem>
            <MenuItem value="cut">Remove only after Cut</MenuItem>
            <MenuItem value="always">Always Remove</MenuItem>
          </Select>
        </Setting>

        <Setting label="Dark Mode" help="Controls if the app is in dark mode or not">
          <Select
            value={themeMode}
            onChange={(e) => dispatch({ action: "set_manual_and_save_settings", themeMode: e.target.value })}
          >
            <MenuItem value="system">System</MenuItem>
            <MenuItem value="dark"> Dark</MenuItem>
            <MenuItem value="light"> Light</MenuItem>
          </Select>
        </Setting>

        <Setting
          label="Default to Memorable Names"
          help="When enabled, patterns will be named using memorable words instead of Unnamed_x"
        >
          <Checkbox
            checked={defaultToMemorableNames}
            onChange={() =>
              dispatch({ action: "set_manual_and_save_settings", defaultToMemorableNames: !defaultToMemorableNames })
            }
          />
        </Setting>

        <Setting label="Home Scale" help="The zoom level restored by the Home action">
          <Number
            value={defaultScalex}
            min={defaultOptions.minScale}
            max={defaultOptions.maxScale}
            step={1}
            onValueChange={(value) =>
              dispatch({
                action: "set_manual_and_save_settings",
                defaultScalex: value,
                defaultScaley: value,
              })
            }
          />
        </Setting>

        <Setting
          label="Snap to Intersections"
          help="If enabled, this will allow you to draw lines from the intersections of two lines. NOTE: Enabling this may cause performance issues on large patterns."
        >
          <Checkbox
            checked={allowSnapToIntersections}
            onChange={() =>
              dispatch({ action: "set_manual_and_save_settings", allowSnapToIntersections: !allowSnapToIntersections })
            }
          />
        </Setting>

        {/* Controls */}
        <StyledSubheader>Controls</StyledSubheader>
        <Setting label="Keyboard Shortcuts" help="Customize which keys perform each action">
          <Button variant="outlined" onClick={() => dispatch({ action: "menu", open: "key", close: "settings" })}>
            Customize
          </Button>
        </Setting>

        <Setting
          label="Allow Canvas Rotation"
          help="Enable scroll, touch, and navigation controls that rotate the canvas"
        >
          <Checkbox
            checked={allowCanvasRotation}
            onChange={() =>
              dispatch({
                action: "set_canvas_rotation_allowed",
                allowed: !allowCanvasRotation,
              })
            }
          />
        </Setting>

        <Setting
          label="Disable Selection Canvas Buttons"
          help="Hide the copy, cut, delete, and clear buttons shown beside a bounded selection"
        >
          <Checkbox
            checked={disableSelectionCanvasButtons}
            onChange={() =>
              dispatch({
                action: "set_manual_and_save_settings",
                disableSelectionCanvasButtons: !disableSelectionCanvasButtons,
              })
            }
          />
        </Setting>

        <Setting label="Tap + Hold" help="Choose what a tap and hold adds">
          <Select
            value={holdTapAction}
            onChange={(e) => dispatch({ action: "set_manual_and_save_settings", holdTapAction: e.target.value })}
          >
            <MenuItem value="add_generic_selector">Add a generic selector</MenuItem>
            <MenuItem value="add_specific_selector">Add a specific selector</MenuItem>
            <MenuItem value="add_bound">Add a bound</MenuItem>
          </Select>
        </Setting>

        <Setting label="Cursor" help="Which cursor to use">
          <Select
            value={cursor}
            onChange={(e) => dispatch({ action: "set_manual_and_save_settings", cursor: e.target.value })}
          >
            {cursors.map((i) => (
              <MenuItem sx={{ width: "100%" }} value={i} key={i}>
                {i.charAt(0).toUpperCase() + i.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </Setting>

        <Setting
          label="Loop Cursor at Edges"
          help="Move the cursor to the opposite side when it reaches a horizontal or vertical screen edge"
        >
          <Checkbox
            checked={loopCursorAtEdges}
            onChange={() =>
              dispatch({
                action: "set_manual_and_save_settings",
                loopCursorAtEdges: !loopCursorAtEdges,
              })
            }
          />
        </Setting>

        <Setting desktopOnly label="Invert Scroll" help="Controls if the scroll is inverted">
          <Checkbox
            checked={invertedScroll}
            onChange={() => dispatch({ action: "set_manual_and_save_settings", invertedScroll: !invertedScroll })}
          />
        </Setting>

        <Setting
          desktopOnly
          label="Rotate Clipboard on Scroll"
          help="Rotate an active clipboard instead of moving the canvas when scrolling"
        >
          <Checkbox
            checked={rotateClipboardOnScroll}
            onChange={() =>
              dispatch({
                action: "set_manual_and_save_settings",
                rotateClipboardOnScroll: !rotateClipboardOnScroll,
              })
            }
          />
        </Setting>

        <Setting desktopOnly label="Scroll Sensitivity" help="Controls how fast scroll translates">
          <Number
            onValueChange={(val) => dispatch({ action: "set_manual_and_save_settings", scrollSensitivity: val })}
            value={scrollSensitivity}
            min={0}
            max={10}
            step={0.1}
          />
        </Setting>

        <Setting label="Two Finger Move Sensitivity" help="Controls how two finger scroll translates">
          <Number
            onValueChange={(val) =>
              dispatch({ action: "set_manual_and_save_settings", gestureTranslateSensitivity: val })
            }
            value={gestureTranslateSensitivity}
            step={0.1}
            min={0}
            max={10}
          />
        </Setting>

        <Setting label="Two Finger Scale Sensitivity" help="Controls how closely pinch zoom follows your fingers">
          <Number
            onValueChange={(val) => dispatch({ action: "set_manual_and_save_settings", gestureScaleSensitivity: val })}
            value={gestureScaleSensitivity}
            step={0.1}
            min={0}
            max={10}
          />
        </Setting>

        <Setting label="Smooth Scale Gesture" help="Can help smooth out two finger gestures">
          <Checkbox
            checked={smoothGestureScale}
            onChange={() =>
              dispatch({ action: "set_manual_and_save_settings", smoothGestureScale: !smoothGestureScale })
            }
          />
        </Setting>

        <Setting
          label="Two Finger Spread Gesture Scales Page"
          help="Controls whether the two finger spread gesture scales the page or not"
        >
          <Checkbox
            checked={enableGestureScale}
            onChange={() =>
              dispatch({ action: "set_manual_and_save_settings", enableGestureScale: !enableGestureScale })
            }
          />
        </Setting>

        {/* Advanced */}
        <StyledSubheader>Advanced</StyledSubheader>
        <Setting
          label="Use Fancy Glow"
          help="Uses a prettier glow effect, but may reduce performance on large patterns or on mobile devices"
        >
          <Checkbox
            checked={useFancyGlow}
            onChange={() => dispatch({ action: "set_manual_and_save_settings", useFancyGlow: !useFancyGlow })}
          />
        </Setting>

        <Setting label="Reopen Menus with Toolbar" help="Restore open menus after the toolbar is shown again">
          <Checkbox
            checked={reopenMenusWithToolbar}
            onChange={() =>
              dispatch({
                action: "set_manual_and_save_settings",
                reopenMenusWithToolbar: !reopenMenusWithToolbar,
              })
            }
          />
        </Setting>

        <Setting label="Toolbar Opacity" help="Controls the opacity of the toolbar">
          <Slider
            onChange={(e, val) =>
              dispatch({ action: "set_manual_and_save_settings", toolbarOpacity: Math.log10(val) + 1 })
            }
            value={toolbarOpacity}
            min={0}
            max={1}
            step={0.1}
          />
        </Setting>

        <Setting label="Hide Hex Color" help="Controls if the hex color is displayed in the color menu">
          <Checkbox
            checked={hideHexColor}
            onChange={() => dispatch({ action: "set_manual_and_save_settings", hideHexColor: !hideHexColor })}
          />
        </Setting>

        <Setting
          label="Use HSV Color Picker"
          help="Show hue, saturation, and value controls instead of red, green, and blue controls in the color menu"
        >
          <Checkbox
            checked={useHSVColorPicker}
            onChange={() => dispatch({ action: "set_manual_and_save_settings", useHSVColorPicker: !useHSVColorPicker })}
          />
        </Setting>

        <Setting
          label="Dots above patterns"
          help="Display the dots above everything else instead of below everything else"
        >
          <Checkbox
            checked={dotsAboveArtwork}
            onChange={() => dispatch({ action: "set_manual_and_save_settings", dotsAboveArtwork: !dotsAboveArtwork })}
          />
        </Setting>

        <Setting label="Max Undo Amount" help="Controls how many consecutive undos you can do at once">
          <Number
            onValueChange={(val) => dispatch({ action: "set_manual_and_save_settings", maxUndoAmt: val })}
            value={maxUndoAmt}
            min={2}
          />
        </Setting>

        {/* TODO: I don't think this will work just like that, some things need to be recalculated */}
        <Setting
          label="Device Mode"
          help="Controls if the app is in mobile or desktop mode (useful for touchscreen laptops)"
        >
          <Select
            value={state.mobile}
            onChange={(e) => dispatch({ action: "set_manual_and_save_settings", mobile: e.target.value })}
          >
            <MenuItem value={false}>Desktop</MenuItem>
            <MenuItem value={true}>Mobile</MenuItem>
          </Select>
        </Setting>

        <Setting label="Debug Mode" help="Adds some visual aids useful for debugging">
          <Checkbox checked={debug} onChange={() => dispatch("toggle_debugging")} />
        </Setting>

        <Setting label="Reset Settings">
          <Button
            variant="outlined"
            onClick={() => {
              if (window.confirm("Reset all settings to default? This will clear the current pattern."))
                clearPreservedState()
            }}
          >
            Reset to Defaults
          </Button>
        </Setting>

        <br />
        <footer>v{version}</footer>
      </List>
    </Page>
  )
}
