import {useRef, useState} from 'react';
import "../styling/FileMenu.css"
import {localStorageName} from '../globals.js'

import { IoClose } from "react-icons/io5";
import { IoMdDownload } from "react-icons/io";
import { MdUpload } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { IoIosDownload } from "react-icons/io";
import {Number} from './MenuUtils.jsx';
import {GiNuclear} from 'react-icons/gi';
import { MdOutlineFileCopy } from "react-icons/md";

export function FileMenu({state, dispatch}){
    const [saveName, setSaveName] = useState('');
    const [loadName, setLoadName] = useState('');
    const [downloadName, setDownloadName] = useState('');
    const [width, setWidth] = useState(window.visualViewport.width);
    const [height, setHeight] = useState(window.visualViewport.height);
    const [format, setFormat] = useState('svg');
    // const [saves, setSaves] = useState(localStorage.getItem(localStorageName))

    function handleFileSelection(e) {
        if (e.target.files.length > 0) {
            var reader = new FileReader()
            reader.onload = function(e) {
                dispatch({action: 'upload', str: e.target.result})
            }
            reader.readAsText(e.target.files[0]);
        } else
            alert("Failed to load file");
    }

    const saves = localStorage.getItem(localStorageName)

    return <div id='file-menu'> {/*onAbort={() => dispatch({action: "menu", close: "file"})}>*/}
        <h2>Files</h2>
        <h3><IoMdDownload />Download</h3>
        <button id='copy-button' onClick={() => dispatch({action: 'copy image'})}><MdOutlineFileCopy />Copy</button>
        <button id='close-button' onClick={() => dispatch({action: "menu", close: "file"})}><IoClose /></button>
        <span className='group'>
            <p>Pattern Name: </p>
            <input type="text" onChange={(e) => setDownloadName(e.target.value)}></input>
        </span>
        <span className='group' id='download-buttons'>
            <select onChange={e => setFormat(e.target.value)}>
                <option value='svg'>SVG</option>
                <option value='png'>PNG</option>
                <option value='jpeg'>JPEG</option>
            </select>
            <button onClick={() => dispatch({action: "download", name: downloadName, format, width, height})}>
                <IoMdDownload /> Download
            </button>
        </span>
        {format !== 'svg' && <span>
            <Number label="Width:" value={width} onChange={val => setWidth(val)}/>
            <Number label="Height:" value={height} onChange={val => setHeight(val)}/>
        </span>}

        <hr/>

        <h3><MdUpload /> Upload</h3>
        <span className='group'>
            {/* Upload: */}
            <input type="file" onChange={handleFileSelection}></input>
        </span>
        <hr/>
        <h3><FaSave/> Save</h3>
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

        <footer className="footer">
            {/* I&apos;m reasonably sure that any method of loading files is technically hackable.<br/> */}
            Don&apos;t load or upload files from unknown sources
        </footer>
        {/* <button onClick={() => dispatch({action: "load", })}><MdUpload />Upload</button> */}
    </div>
}
