import {StateContext} from "../Contexts";
import {useContext} from "react";
import ExtraButton from "./ExtraButton";
import {extraSlots as _extraSlots} from "../utils";
import MiniMenu from "./MiniMenu";
import { Grid } from "@mui/material";
import ToolButton from "./ToolButton";

function ExtraMenuMui(){
    const {state} = useContext(StateContext)

    const extraSlots = Math.max(_extraSlots(state), 0)

    // TODO: I want these 2 be in 2 columns, instead of 1 row
    const gridProps = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        size: "auto",
    }

    return <MiniMenu menu="extra">
        <Grid container spacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
            {extraSlots < 2 && <Grid {...gridProps}><ToolButton inExtraMenu menu="navigation"/></Grid>}
            {extraSlots < 1 && <Grid {...gridProps}><ToolButton inExtraMenu menu="repeat"/></Grid>}
            {extraSlots < 4 && <Grid {...gridProps}><ToolButton inExtraMenu menu="file"/></Grid>}
            {extraSlots < 5 && <Grid {...gridProps}><ToolButton inExtraMenu menu="settings"/></Grid>}
            {extraSlots < 6 && <Grid {...gridProps}><ToolButton inExtraMenu menu="help"/></Grid>}
            {extraSlots < 3 && <Grid {...gridProps}><ExtraButton/></Grid>}
        </Grid>
    </MiniMenu>
}

export default ExtraMenuMui
