import { test, expect, describe, beforeEach } from "vitest";
import { getState } from "./testUtils";
import defaultOptions, { preservable, saveable } from "../options";
import * as actions from "../actions";
import { reversibleActions, saveSettingActions } from "../options";
import { validateStorage } from "../fileUtils";

// In between each tests, reset the localStorage
beforeEach(() => {
    localStorage.clear();
    // Then readd whatever we need
    validateStorage();
});

describe("Stuff in options.jsx is valid", () => {
    // These are allowed to not be in the state
    // test('keys in default options are in state', () => {
    //     const state = getState();
    //     const stateKeys = Object.keys(state);
    //     for (const key of Object.keys(defaultOptions)) {
    //         const inState = stateKeys.includes(key)
    //         if (!inState) {
    //             console.log('defaultOption key not in state: ' + key);
    //         }
    //         expect(inState).toBe(true);
    //     }
    // });
    test("all reversibleActions are valid", () => {
        const actionKeys = Object.keys(actions);
        for (const action of reversibleActions) {
            const inState = actionKeys.includes(action);
            if (!inState) {
                console.log("reversibleAction not in actions: " + action);
            }
            expect(inState).toBe(true);
        }
    });
    test("all saveSettingActions are valid", () => {
        const actionKeys = Object.keys(actions);
        for (const action of saveSettingActions) {
            const inState = actionKeys.includes(action);
            if (!inState) {
                console.log("saveSettingAction not in actions: " + action);
            }
            expect(inState).toBe(true);
        }
    });
    test("all reversibles are valid", () => {
        const actionKeys = Object.keys(actions);
        for (const action of reversibleActions) {
            const inState = actionKeys.includes(action);
            if (!inState) {
                console.log("reversibleAction not in state: " + action);
            }
            expect(inState).toBe(true);
        }
    });
    test("all preservables are valid", () => {
        const stateKeys = Object.keys(getState());
        for (const key of preservable) {
            const inState = stateKeys.includes(key);
            if (!inState) {
                console.log("preservable key not in state: " + key);
            }
            expect(inState).toBe(true);
        }
    });
    test("all saveables are valid", () => {
        const stateKeys = Object.keys(getState());
        for (const key of saveable) {
            const inState = stateKeys.includes(key);
            if (!inState) {
                console.log("saveable key not in state: " + key);
            }
            expect(inState).toBe(true);
        }
    });
});
