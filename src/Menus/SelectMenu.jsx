// import { PiSelectionPlusDuotone } from "react-icons/pi"
import { useContext } from "react"
import { StateContext } from "../Contexts"
import MiniMenu from "./MiniMenu"
import MenuItem from "@mui/material/MenuItem"
import ListItemIcon from "@mui/material/ListItemIcon"
import Typography from "@mui/material/Typography"
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank"
import CheckBoxIcon from "@mui/icons-material/CheckBox"
import { SelectorIcon } from "./CustomIcons"

export default function SelectMenu() {
  const { dispatch, state } = useContext(StateContext)

  return (
    <MiniMenu menu="select">
      {/* If we're on desktop, we can't both click the button, and move the cursor to where we want to add the bound */}
      {state.mobile && (
        <>
          <MenuItem onClick={() => dispatch("add_bound")}>
            <ListItemIcon>
              {/* This is so good though... */}
              {/* <PiSelectionPlusDuotone /> */}
              {SelectorIcon("area")}
            </ListItemIcon>
            Add Bound
          </MenuItem>

          <MenuItem onClick={() => dispatch("add_generic_selector")} id="generic-selector">
            <ListItemIcon>{SelectorIcon("generic")}</ListItemIcon>
            Add a Generic Selector
          </MenuItem>

          <MenuItem onClick={() => dispatch("add_specific_selector")} id="specific-selector">
            <ListItemIcon>{SelectorIcon("specific")}</ListItemIcon>
            Add a Specific Selector
          </MenuItem>
        </>
      )}

      {!state.mobile && state.bounds.length < 2 && <Typography sx={{ m: 1 }}>Press B to add a bound</Typography>}
      {state.bounds.length > 1 && (
        <>
          <MenuItem onClick={() => dispatch("clear_bounds")}>
            <ListItemIcon>{SelectorIcon("area", true)}</ListItemIcon>
            Clear Area Selection
          </MenuItem>

          <MenuItem onClick={() => dispatch("toggle_partials")} id="partials-picker">
            <ListItemIcon sx={{ ml: 2 }}>
              {state.partials ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
            </ListItemIcon>
            Partials
          </MenuItem>
        </>
      )}
      {!state.mobile && state.genericSelectors.length < 1 && (
        <Typography sx={{ m: 1 }}>Press N to add a generic selector</Typography>
      )}
      {!state.mobile && state.specificSelectors.length < 1 && (
        <Typography sx={{ m: 1 }}>Press shift+N to add a specific selector</Typography>
      )}
      {state.genericSelectors.length > 0 && (
        <MenuItem onClick={() => dispatch("clear_generic_selectors")} id="generic-selectors-clear">
          <ListItemIcon>{SelectorIcon("generic", true)}</ListItemIcon>
          Clear Generic Selectors
        </MenuItem>
      )}
      {state.specificSelectors.length > 0 && (
        <MenuItem onClick={() => dispatch("clear_specific_selectors")} id="specific-selectors-clear">
          <ListItemIcon>{SelectorIcon("specific", true)}</ListItemIcon>
          Clear Specific Selectors
        </MenuItem>
      )}
    </MiniMenu>
  )
}
