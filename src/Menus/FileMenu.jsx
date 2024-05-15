import {useState} from 'react';
import "../styling/FileMenu.css"
import {localStorageName} from '../globals.js'

import { IoClose } from "react-icons/io5";
import { IoMdDownload } from "react-icons/io";
import { MdUpload } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { IoIosDownload } from "react-icons/io";

export function FileMenu({state, dispatch}){
    const [saveName, setSaveName] = useState('');
    const [loadName, setLoadName] = useState('');
    const [downloadName, setDownloadName] = useState('');

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

    return <div id='file-menu' onAbort={() => dispatch({action: "menu", close: "file"})}>
        <h3>Load & Save Files</h3>
        <button id='close-button' onClick={() => dispatch({action: "menu", close: "file"})}><IoClose /></button>
        <span className='group'>
            <p>Name: </p>
            <input type="text" onChange={(e) => setDownloadName(e.target.value)}></input>
            <button onClick={() => dispatch({action: "download", name: downloadName})}><IoMdDownload /> Download</button>
        </span>
        <span className='group'>
            <p><MdUpload /> Upload: </p>
            <input type="file" onChange={handleFileSelection}></input>
        </span>
        <span className='group'>
            <input type="text" onChange={(e) => setSaveName(e.target.value)}></input>
            <button onClick={() => dispatch({action: 'save local', name: saveName})}><FaSave /> Save</button>
        </span>
        <span className='group'>
            {/* <input type="text" onChange={(e) => setLoadName(e.target.value)}></input> */}
            <span>
                <label htmlFor="radio-group">Saves:</label>
                <div id="radio-group">
                    {saves && Object.keys(JSON.parse(saves)).map(key => <div className='group'>
                        <input key={key} type="radio" id={key} name="saves" value={key} onChange={(e) => setLoadName(e.target.value)}/>
                        <label htmlFor={key}>{key}</label>
                    </div>)}
                </div>
            </span>
            <button onClick={() => dispatch({action: 'load local', name: loadName})}><IoIosDownload /> Load</button>
        </span>

        <footer className="footer">
            I'm reasonably sure that any method of loading files is technically hackable.<br/>
            Don't load or upload files from unknown sources
        </footer>
        {/* <button onClick={() => dispatch({action: "load", })}><MdUpload />Upload</button> */}
    </div>
}
