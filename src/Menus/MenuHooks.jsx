import {useContext} from "react";
import {StateContext} from "../Contexts";

export function useAlignWithElement(id){
    const {state} = useContext(StateContext)

    const to = document.querySelector("#" + id)?.getBoundingClientRect()
    if (!to) return {}

    let style = {}
    switch (state.side) {
        case 'right':
            style = {
                right: to.width*2,
                top: to.top,
            }
            break
        case 'left':
            style = {
                left: to.right,
                top: to.top,
            }
            break
        case 'bottom':
            style = {
                bottom: to.height * 2,
                left: to.left,
            }
            break
        case 'top':
            style = {
                top: to.bottom,
                left: to.left,
            }
    }
    return style
}
