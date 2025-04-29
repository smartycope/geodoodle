import {useContext, useState} from 'react';
import "../styling/FileMenu.css"
import {localStorageName} from '../globals.js'

import { IoClose } from "react-icons/io5";
import { IoMdDownload } from "react-icons/io";
import { MdOutlineTabUnselected, MdUpload } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { IoIosDownload } from "react-icons/io";
import {Checkbox, Number} from './MenuUtils.jsx';
import {GiNuclear} from 'react-icons/gi';
import { MdOutlineFileCopy } from "react-icons/md";
import { FaMobileScreenButton } from "react-icons/fa6";
import {StateContext} from '../Contexts.jsx';
import {viewportWidth, viewportHeight} from '../utils'

export function FileMenu(){
    const [state, dispatch] = useContext(StateContext)
    const {side} = state

    const [saveName, setSaveName] = useState('');
    const [loadName, setLoadName] = useState('');
    const [downloadName, ] = useState('');
    const [format, setFormat] = useState('svg');
    const [width, setWidth] = useState(viewportWidth());
    const [height, setHeight] = useState(viewportHeight());
    const [x, setx] = useState(0);
    const [y, sety] = useState(0);
    const [selectedOnly, setSelectedOnly] = useState(true);

    function handleFileSelection(e) {
        if (e.target.files.length > 0) {
            var reader = new FileReader()
            reader.onload = function(e) {
                dispatch({action: 'upload', str: e.target.result})
            }
            dispatch({filename: /(.+)\./.exec(e.target.files[0].name)[1]})
            reader.readAsText(e.target.files[0]);
        } else
            alert("Failed to load file");
    }

    const saves = localStorage.getItem(localStorageName)

    return <div id='file-menu'>
        <button id='copy-button' onClick={() => dispatch({action: 'copy image'})}><MdOutlineFileCopy />Copy</button>
        <button id='close-button' onClick={() => dispatch({action: "menu", close: "file"})}><IoClose /></button>
        <h3>Files</h3>

        <details open id='first-details'><summary><IoMdDownload />Download</summary>
            <span className='group'>
                <p>Pattern Name: </p>
                <input type="text" value={state.filename} onChange={(e) => dispatch({filename: e.target.value})}></input>
            </span>
            <span className='group' id='download-buttons'>
                <select onChange={e => setFormat(e.target.value)}>
                    <option value='svg'>SVG</option>
                    <option value='png'>PNG</option>
                    <option value='jpeg'>JPEG</option>
                </select>
                <button onClick={() => dispatch({action: "download",
                    name: downloadName, format, width, height, selectedOnly: selectedOnly && state.bounds.length > 1
                })}>
                    <IoMdDownload /> Download
                </button>
            </span>
            {state.bounds.length > 1 && <Checkbox
                checked={selectedOnly}
                onChange={() => setSelectedOnly(!selectedOnly)}
                label="Only inlucde selection"
            />}
            {format !== 'svg' && !selectedOnly && <span id='gridbox'>
                <Number label="Width:" value={width} onChange={val => setWidth(val)}/>
                <Number label="X:" value={x} onChange={val => setx(val)}/>
                <Number label="Height:" value={height} onChange={val => setHeight(val)}/>
                <Number label="Y:" value={y} onChange={val => sety(val)}/>
                <button className='fit-button' onClick={() => {
                    setWidth(viewportWidth())
                    setHeight(viewportHeight())
                    setx(0)
                    sety(0)
                }}><FaMobileScreenButton /> Screen</button>
                {/* <span></span> */}
                <button className='fit-button' onClick={() => {
                    const rect = document.querySelector('#lines').getBoundingClientRect()
                    setWidth(rect.width)
                    setHeight(rect.height)
                    setx(rect.x)
                    sety(rect.y)
                }}><MdOutlineTabUnselected/> Fit to Pattern</button>
            </span>}
        </details>

        <details><summary><MdUpload /> Upload</summary>
            <span className='group'>
                {/* Upload: */}
                <input type="file" onChange={handleFileSelection}></input>
            </span>
        </details>

        <details><summary><FaSave/> Save</summary>
            <span className='group'>
                <input type="text" onChange={(e) => setSaveName(e.target.value)}></input>
                <button onClick={() => dispatch({action: 'save local', name: saveName})}><FaSave /> Save</button>
            </span>
            <span>
                {/* <input type="text" onChange={(e) => setLoadName(e.target.value)}></input> */}
                <span>
                    {/* <label htmlFor="radio-group">Saves:</label> */}
                    <div id="radio-group">
                        {saves && Object.keys(JSON.parse(saves)).map(key => <div className='group' key={key}>
                            <input key={key} type="radio" id={key} name="saves" value={key} onChange={(e) => setLoadName(e.target.value)}/>
                            <label htmlFor={key}>{key}</label>
                        </div>)}
                        {!saves && <p>No saves yet!</p>}
                    </div>
                </span>
                <span className='group'>
                    {/* Somehow this doesn't work */}
                    <button onClick={() => {dispatch({action: 'load local', name: loadName}); setTimeout(() => document.querySelector('#paper').click(), 200)}}>
                        <IoIosDownload /> Load
                    </button>
                    <button onClick={() =>
                        confirm('Are you sure you want to delete all your saves? This action is irreversible.')
                        ? localStorage.removeItem(localStorageName) : undefined
                    }>
                        <GiNuclear /> Clear Saves
                    </button>
                </span>
            </span>
        </details>

        {/* <footer className="footer"> */}
            {/* I&apos;m reasonably sure that any method of loading files is technically hackable.<br/> */}
            {/* Don&apos;t load or upload files from unknown sources */}
        {/* </footer> */}
        {/* <button onClick={() => dispatch({action: "load", })}><MdUpload />Upload</button> */}
    </div>
}
