import './styling/App.css';
import {useEffect, useReducer, useRef} from 'react';
import { localStorageSettingsName, PREVENT_LOADING_STATE } from './globals'
import reducer from './reducer';
import MainMenu from './Menus/MainMenu';
import {deserializeState} from './fileUtils';
import {StateContext} from './Contexts';
import {
    GlowEffect,
    DebugInfo,
    MirrorMetaLines,
    Eraser,
    ClipboardTransformButtons,
    SelectionRect,
    Bounds,
    CurrentLines,
    Lines,
    Clipboard,
    Cursor,
    Dots,
    Polygons,
    CurrentPolys,
} from './drawing';
import Trellis from './Trellis';
import getInitialState from './states';
import * as events from './events'

// This is for the mouse/touch events that need to be bound non-passively, but also need access to the state
// This is hacky, but I can't think of a better way
var _state = {}

export default function Paper({setDispatch}) {
    const paper = useRef()
    const [state, dispatch] = useReducer(reducer, getInitialState())
    const {dotsAbovefill, paperColor, fillMode} = state

    // Forcibly disallow scrolling
    window.scrollX = 0
    window.scrollY = 0

    _state = state

    // Capture touch events non-passively so we can prevent default
    useEffect(() => {
        const onTouchMove  = e => events.onTouchMove( _state, dispatch, e)
        const onTouchEnd   = e => events.onTouchEnd(  _state, dispatch, e)
        const onTouchStart = e => events.onTouchStart(_state, dispatch, e)
        const onScroll     = e => events.onScroll(    _state, dispatch, e)

        // See https://stackoverflow.com/questions/63663025/react-onwheel-handler-cant-preventdefault-because-its-a-passive-event-listenev
        // for why we have to do it this way (because of the zoom browser shortcut)
        const _paper = paper.current
        _paper.addEventListener('wheel', onScroll, { passive: false })
        _paper.addEventListener('touchend', onTouchEnd, { passive: false })
        _paper.addEventListener('touchstart', onTouchStart, { passive: false })
        _paper.addEventListener('touchmove', onTouchMove, { passive: false })
        return () => {
            _paper?.removeEventListener('wheel', onScroll)
            _paper?.removeEventListener('touchend', onTouchEnd)
            _paper?.removeEventListener('touchstart', onTouchStart)
            _paper?.removeEventListener('touchmove', onTouchMove)
        }
    }, [])

    // Perserve settings
    useEffect(() => {
        const local = localStorage.getItem(localStorageSettingsName)
        if (!PREVENT_LOADING_STATE && local)
            dispatch(deserializeState(local))
    }, [])

    // So the tour can effect state
    useEffect(() => setDispatch(dispatch), [setDispatch])

    // Focus the paper element first thing
    useEffect(() => paper.current.focus(), [])

    return <StateContext.Provider value={{state, dispatch}}>
        <div>
            <MainMenu/>
            {/* onCopy, onPaste, and onCut are implemented with keyboard shortcuts instead of here, so they can be changed */}
            <svg id='paper'
                width="100%"
                height="101vh"
                tabIndex={0}
                ref={paper}
                onKeyDown={ e => events.onKeyDown(state, dispatch, e)}
                onMouseMove={ e => events.onMouseMove(state, dispatch, e)}
                onMouseDown={ e => events.onMouseDown(state, dispatch, e)}
                onMouseUp={ e => events.onMouseUp(state, dispatch, e)}
                onBlur={ e => events.onBlur(state, dispatch, e)}
                style={{
                    backgroundColor: paperColor,
                    cursor: fillMode ? 'pointer' : 'none',
                }}
            >
                {/* This order is intentional */}
                <GlowEffect/>
                {!dotsAbovefill && <Dots/>}
                <Trellis/>
                <Polygons/>
                <CurrentPolys/>
                {dotsAbovefill && <Dots/>}
                <DebugInfo/>
                <Cursor/>
                <Lines/>
                <CurrentLines/>
                <Bounds/>
                <SelectionRect/>
                <ClipboardTransformButtons/>
                <MirrorMetaLines/>
                <Eraser/>
                <Clipboard/>
            </svg>
            {/* For exporting to images */}
            <canvas id="canvas"></canvas>
        </div>
    </StateContext.Provider>
}
