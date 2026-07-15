import { useContext } from "react"
import { ColorPicker, ColorService } from "react-color-palette"
import "react-color-palette/dist/css/rcp.css"
import options from "../options"
import Number from "./Number"
import Button from "@mui/material/Button"
import Switch from "@mui/material/Switch"
import Box from "@mui/material/Box"
import Divider from "@mui/material/Divider"
import MiniMenu from "./MiniMenu"
import Typography from "@mui/material/Typography"

import { StateContext } from "../Contexts"
import { getShowableStroke } from "../utils"
import useMediaQuery from "@mui/material/useMediaQuery"
import { useTheme } from "@mui/material/styles"
import FormControlLabel from "@mui/material/FormControlLabel"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Tooltip from "@mui/material/Tooltip"
import CasinoOutlinedIcon from "@mui/icons-material/CasinoOutlined"
import CloseIcon from "@mui/icons-material/Close"

export default function ColorMenu() {
  const { state, dispatch } = useContext(StateContext)
  const theme = useTheme()
  const shortViewport = useMediaQuery("@media (max-height: 784px)")

  const {
    stroke,
    strokeWidth,
    dash,
    colorProfile,
    scalex,
    fillMode,
    fill,
    mobile,
    paperColor,
    useHSVColorPicker,
  } = state
  const colors = fillMode ? fill : stroke
  const compact = mobile || shortViewport

  return (
    <MiniMenu menu="color">
      <Stack
        spacing={compact ? 0.75 : 1}
        sx={{
          width: compact ? "min(19rem, calc(100vw - 2rem))" : "20rem",
          boxSizing: "border-box",
          maxHeight: "calc(100vh - 2rem)",
          overflowY: "auto",
          overflowX: "hidden",
          p: compact ? 0.25 : 0.5,
        }}
      >
        <Box
          sx={{
            "--rcp-background-color": "transparent",
            "--rcp-field-input-color": theme.palette.text.primary,
            "--rcp-field-input-border-color": theme.palette.divider,
            "--rcp-field-label-color": theme.palette.text.secondary,
            "& .rcp": { backgroundColor: "transparent" },
            "& .rcp-body": {
              gap: compact ? "0.5rem" : "0.75rem",
              padding: compact ? "0.5rem 0.25rem 0.25rem" : "0.75rem 0.25rem 0.25rem",
            },
            "& .rcp-section, & .rcp-fields": { gap: compact ? "0.4rem" : "0.6rem" },
            "& .rcp-fields-floor": { gap: "0.4rem" },
            "& .rcp-field-input": { py: 0.25 },
          }}
        >
          <ColorPicker
            height={compact ? 108 : 148}
            color={ColorService.convert("hex", colors[colorProfile])}
            hideInput={[useHSVColorPicker ? "rgb" : "hsv", ...(state.hideHexColor ? ["hex"] : [])]}
            onChange={(clr) => dispatch({ action: "set_color", color: clr.hex })}
          />
        </Box>

        <Divider />

        <Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 0.5 }}>
              {fillMode ? "FILL PALETTE" : "LINE PALETTE"}
            </Typography>
            <Tooltip
              describeChild
              enterDelay={0}
              title="Not truly random: it randomizes hues, while matches the paper value, and increasing the paper saturation."
            >
              <Button
                id="color-menu-randomize-button"
                size="small"
                startIcon={<CasinoOutlinedIcon fontSize="small" />}
                onClick={() => dispatch("randomize_colors")}
                sx={{ minHeight: 28, px: 1, py: 0.25, textTransform: "none" }}
              >
                Randomize
              </Button>
            </Tooltip>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${options.commonColorAmt}, 1fr)`, gap: 0.5 }}>
            {Array.from({ length: options.commonColorAmt }, (_, i) => {
              const swatchBackground = fillMode ? fill[i] : paperColor
              return (
                <Button
                  key={`color-preset-${i}`}
                  aria-label={`Color preset ${i + 1}`}
                  onClick={() => dispatch({ colorProfile: i })}
                  sx={{
                    minWidth: 0,
                    height: compact ? 38 : 44,
                    p: 0.4,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.1,
                    backgroundColor: swatchBackground,
                    color: getShowableStroke(swatchBackground),
                    border: "6px solid",
                    borderColor: i === colorProfile ? "primary.main" : "transparent",
                    boxShadow: i === colorProfile ? `0 0 0 1px ${theme.palette.background.paper}` : "none",
                    "&:hover": {
                      backgroundColor: swatchBackground,
                      filter: "brightness(0.94)",
                    },
                  }}
                >
                  <Typography component="span" variant="caption" sx={{ lineHeight: 1, fontWeight: 700 }}>
                    {i + 1}
                  </Typography>
                  {!fillMode && (
                    <svg width="100%" height="12" viewBox="0 0 36 12" preserveAspectRatio="none">
                      <line
                        x1={3}
                        x2={33}
                        y1={6}
                        y2={6}
                        stroke={stroke[i]}
                        strokeWidth={Math.max(1, Math.min(6, strokeWidth[i] * scalex))}
                        strokeDasharray={dash[i]}
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </Button>
              )
            })}
          </Box>
        </Box>

        {!fillMode && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "auto minmax(7rem, 1fr)",
              alignItems: "end",
              gap: 1,
              pt: 0.25,
            }}
          >
            <Number
              compact
              id="stroke-input"
              label="Width"
              min={1}
              step={1}
              largeStep={5}
              snapOnStep
              allowWheelScrub
              value={strokeWidth[colorProfile] * 100}
              onValueChange={(val) => dispatch({ action: "set_stroke_width", strokeWidth: val / 100 })}
            />
            <TextField
              id="dash-input"
              size="small"
              label="Dash"
              value={dash[colorProfile]}
              onChange={(e) => dispatch({ action: "set_dash", dash: e.target.value })}
              sx={{ "& .MuiInputBase-root": { height: 32 } }}
            />
          </Box>
        )}

        <Divider />

        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                id="color-menu-fill-button"
                size="small"
                checked={fillMode}
                onChange={() => dispatch("toggle_fill_mode")}
              />
            }
            label="Fill mode"
            sx={{ m: 0, color: "text.primary", "& .MuiFormControlLabel-label": { fontSize: "0.875rem" } }}
          />

          <Button
            id="color-menu-close-button"
            size="small"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={() => dispatch({ action: "menu", close: "color" })}
            sx={{ px: 1.25, textTransform: "none" }}
          >
            Close
          </Button>
        </Box>
      </Stack>
    </MiniMenu>
  )
}
