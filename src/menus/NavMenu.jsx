import { useContext } from "react"
import Number from "../components/Number"

import defaultOptions from "../options"
import { StateContext } from "../Contexts"
import Dist from "../helper/Dist"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import Paper from "@mui/material/Paper"
import HomeIcon from "@mui/icons-material/Home"
import HighlightAltIcon from "@mui/icons-material/HighlightAlt"
import { getHalf } from "../utils/misc"
import Point from "../helper/Point"
import { viewportHeight, viewportWidth } from "../globals"

export default function NavMenu() {
  const { state, dispatch } = useContext(StateContext)

  const { scalex, scaley, defaultScalex, defaultScaley, translation, rotate, allowCanvasRotation, mobile, side } = state
  const { x: translationx, y: translationy } = translation.asDeflated(state)
  const half = getHalf(state)
  const rotationCenter = Point.fromViewport(state, viewportWidth() / 2, viewportHeight() / 2)

  let style
  if (side === "bottom")
    style = {
      borderTopLeftRadius: "0px",
      borderTopRightRadius: "0px",
      top: "0px",
    }
  else
    style = {
      borderEndStartRadius: "0px",
      borderBottomRightRadius: "0px",
      bottom: "0px",
    }

  return (
    <Paper
      id="nav-menu"
      style={style}
      sx={{
        width: 430,
        maxWidth: "calc(100vw - 16px)",
        height: "min-content",
        /* To center it */
        left: "50%",
        transform: "translateX(-50%)",
        position: "absolute",
        display: "flex",
        flexDirection: "row",
        borderRadius: "10px",
        padding: 1,
        // Above default, below MiniMenus
        zIndex: 1,
      }}
    >
      <Grid container spacing={1} id="nav-menu-grid">
        {/* Position x */}
        <Grid size={6}>
          <Number
            value={translationx}
            label="Position x"
            step={1}
            largeStep={10}
            snapOnStep={true}
            compact={mobile}
            onValueChange={(val) =>
              dispatch({ action: "translate", amt: Dist.fromDeflated(state, translationx - val, 0) })
            }
            onReset={() => dispatch({ action: "translate", amt: Dist.fromDeflated(state, -translationx, 0) })}
            resetTitle="Reset Position x"
          />
        </Grid>

        {/* Scale */}
        <Grid size={6}>
          <Number
            value={scalex}
            label="Scale"
            compact={mobile}
            onMinus={() => dispatch({ action: "scale", amtx: -scalex / 2, amty: -scaley / 2, center: half })}
            onPlus={() => dispatch({ action: "scale", amtx: scalex, amty: scaley, center: half })}
            onReset={() =>
              dispatch({
                action: "scale",
                amtx: defaultScalex - scalex,
                amty: defaultScaley - scaley,
                center: half,
              })
            }
            resetTitle="Reset Scale"
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
            compact={mobile}
            onValueChange={(val) =>
              dispatch({ action: "translate", amt: Dist.fromDeflated(state, 0, translationy - val) })
            }
            onReset={() => dispatch({ action: "translate", amt: Dist.fromDeflated(state, 0, -translationy) })}
            resetTitle="Reset Position y"
          />
        </Grid>

        {/* Rotation */}
        <Grid size={6}>
          <Number
            value={rotate}
            label="Rotation"
            compact={mobile}
            step={1}
            min={-180}
            max={180}
            disabled={!allowCanvasRotation}
            onValueChange={(angle) => dispatch({ action: "rotate", angle, center: rotationCenter })}
            onReset={() => dispatch({ action: "rotate", angle: 0, center: rotationCenter })}
            resetTitle="Reset Rotation"
          />
        </Grid>
        {/* Buttons */}
        <Grid size={12} sx={{ m: "auto", textAlign: "center" }}>
          <IconButton
            id="home-button"
            onClick={() => dispatch("go_home")}
            title="Reset position, scale, and rotation"
            size="large"
          >
            <HomeIcon />
          </IconButton>
          <IconButton
            id="nav-selection-button"
            onClick={() => dispatch("go_to_selection")}
            title="Go to the current selection"
            size="large"
          >
            <HighlightAltIcon />
          </IconButton>
        </Grid>
      </Grid>
    </Paper>
  )
}
