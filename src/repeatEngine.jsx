import {getSelected} from "./utils";

export function getTrellis(state){
    const {} = state
    const pattern = getSelected(state)
    return <g transform="translate(30, 30)">{pattern}</g>
}
