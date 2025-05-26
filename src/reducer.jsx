import { localStorageSettingsName, undoStack, redoStack } from './globals'
import { filterObjectByKeys, eventMatchesKeycode } from './utils'
import { reversible, reversibleActions, saveSettingActions, keybindings } from './options'
import {serializeState} from './fileUtils'
import * as actions from './actions'

// TODO: This is a bad solution:
// When an event happens we want to persist (saveSettingActions), it saves the *current* state, not the state *after*
// the action has run, because that's what we have. Instead of catching all the return statements and refactoring
// *everything*, instead we just remove the limit and the next state saves instead. There's usually at least a cursor
// movement or something, so it should work pretty well
var saveNext = false

// Can accept any of 3 parameters to dispatch:
//                 {action: "...", foo: "bar"}
// "..."        -> {action: "..."}
// {foo: "bar"} -> {action: "set manual", foo: "bar"}
export default function reducer(state, data){
    // Some convenience parameter handling
    if (typeof data === "string")
        data = {action: data}
    if (data.action === undefined)
        data = {action: "set_manual", ...data}

    if (state.debug && data.action !== 'cursor_moved')
        console.debug(data.action, data, state)

    if (saveNext){
        localStorage.setItem(localStorageSettingsName, serializeState(state))
        saveNext = false
    }
    if (saveSettingActions.includes(data.action))
        saveNext = true

    if (reversibleActions.includes(data.action)){
        if (undoStack.push(filterObjectByKeys(state, reversible)) > state.maxUndoAmt){
            undoStack.shift()
            redoStack.length = 0
        }
    }

    try {
        return {...state, ...actions[data.action](state, data)}
    } catch (e) {
        console.error(`Failed to run action "${data.action}"`, e)
        return state
    }
}
