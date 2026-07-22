import { StateContext } from "../Contexts"
import { useContext } from "react"
import ExtraButton from "./ExtraButton"
import { extraSlots as _extraSlots } from "../utils/misc"
import MiniMenu from "../components/MiniMenu"
import Grid from "@mui/material/Grid"
import ToolButton from "../components/ToolButton"
import {
getExtraMenuButtons } from "../utils/menus"
import { getActiveLayer } from "../utils/layers"
import TrellisLayer from "../classes/TrellisLayer"
import DrawingLayer from "../classes/DrawingLayer"

function ExtraMenuMui() {
  const { state, dispatch } = useContext(StateContext)

  const extraSlots = Math.max(_extraSlots(state), 0)
  const activeLayer = getActiveLayer(state)
  const activeLayerType = activeLayer instanceof TrellisLayer ? "trellis" : activeLayer instanceof DrawingLayer ? "drawing" : undefined
  const overflowButtons = getExtraMenuButtons(extraSlots, activeLayerType)

  if (!overflowButtons.length) return null

  // TODO: I want these 2 be in 2 columns, instead of 1 row
  const gridProps = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    size: "auto",
  }

  return (
    <MiniMenu menu="extra">
      <Grid container spacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        {overflowButtons.map((button) => (
          <Grid {...gridProps} key={button.menu ?? button.component}>
            {button.component === "extraButton" ? (
              <ExtraButton />
            ) : (
              <ToolButton
                inExtraMenu
                menu={button.menu}
                onClick={button.action ? () => dispatch(button.action) : undefined}
              />
            )}
          </Grid>
        ))}
      </Grid>
    </MiniMenu>
  )
}

export default ExtraMenuMui
