import { undoStack, redoStack } from './globals'
import { filterObjectByKeys } from './utils'
import { reversible, reversibleActions, saveSettingActions } from './options'
import {preserveState} from './fileUtils'
import * as actions from './actions'

// TODO: This is a bad solution:
// When an event happens we want to persist (saveSettingActions), it saves the *current* state, not the state *after*
// the action has run, because that's what we have. Instead of catching all the return statements and refactoring
// *everything*, instead we just remove the limit and the next state saves instead. There's usually at least a cursor
// movement or something, so it should work pretty well
// var saveNext = false

// Can accept any of 3 parameters to dispatch:
//                 {action: "...", foo: "bar"}
// "..."        -> {action: "..."}
// {foo: "bar"} -> {action: "set_manual", foo: "bar"}
export default function reducer(state, data){
    // Some convenience parameter handling
    if (typeof data === "string")
        data = {action: data}
    if (data.action === undefined)
        data = {action: "set_manual", ...data}

    if (state.debug && data.action !== 'cursor_moved')
        console.debug(data.action, data, state)

    if (reversibleActions.includes(data.action)){
        if (undoStack.push(filterObjectByKeys(state, reversible)) > state.maxUndoAmt){
            undoStack.shift()
            redoStack.length = 0
        }
    }

    try {
        const newState = {...state, ...actions[data.action](state, data)}
        if (newState.reloadRequired){
            newState.reloadRequired = false
            // I can't think of a way this would cause a problem, though it is suspicious
            // This just fakes an event that doesn't do anything in order to trigger a re-render
            setTimeout(() => window.dispatchEvent(new Event('resize')), 1)
        }

        if (saveSettingActions.includes(data.action))
            preserveState(newState)

        return newState
    } catch (e) {
        console.error(`Failed to run action "${data.action}"`, e)
        return state
    }
}
