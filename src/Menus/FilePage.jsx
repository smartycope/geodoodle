import { useContext, useState } from 'react';
import "../styling/FileMenu.css"
import { IoClose } from "react-icons/io5";
import { IoMdDownload } from "react-icons/io";
import { MdOutlineTabUnselected, MdUpload } from "react-icons/md";
import { FaSave } from "react-icons/fa";
import { IoIosDownload } from "react-icons/io";
import Number from './Number.jsx';
import { GiNuclear } from 'react-icons/gi';
import { MdOutlineFileCopy } from "react-icons/md";
import { FaMobileScreenButton } from "react-icons/fa6";
import { StateContext } from '../Contexts.jsx';
import { viewportWidth, viewportHeight } from '../globals.js'
import Rect from '../helper/Rect.jsx'
import Point from '../helper/Point.js'
import Page from './Page.jsx';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import * as React from 'react';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Button, FormControlLabel, Grid, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemSecondaryAction, ListItemText, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import HighlightAltIcon from '@mui/icons-material/HighlightAlt';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderIcon from '@mui/icons-material/Folder';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { getSaves, clearSaves, generateName } from '../fileUtils.jsx';

function FileInput({ label = "Upload File", onChange, accept, multiple }) {
    const handleChange = (e) => {
        if (onChange) {
            onChange(multiple ? Array.from(e.target.files) : e.target.files[0]);
        }
    };

    return (
        <>
            <input
                accept={accept}
                id="mui-file-input"
                type="file"
                multiple={multiple}
                style={{ display: "none" }}
                onChange={handleChange}
            />
            <label htmlFor="mui-file-input">
                <Button variant="contained" component="span">
                    <UploadFileIcon />
                    {label}
                </Button>
            </label>
        </>
    );
}



function FileMenu() {
    const { state, dispatch } = useContext(StateContext)
    const { filename, bounds } = state

    const [saveName, setSaveName] = useState('');
    const [loadName, setLoadName] = useState('');
    const [downloadName,] = useState('pattern');
    const [format, setFormat] = useState('svg');
    const [width, setWidth] = useState(viewportWidth());
    const [height, setHeight] = useState(viewportHeight());
    const [x, setx] = useState(0);
    const [y, sety] = useState(0);
    const [selectedOnly, setSelectedOnly] = useState(true);

    function handleFileSelection(e) {
        if (e.target.files.length > 0) {
            var reader = new FileReader()
            reader.onload = function (e) {
                dispatch({ action: 'upload_file', str: e.target.result })
            }
            dispatch({ filename: /(.+)\./.exec(e.target.files[0].name)[1] })
            reader.readAsText(e.target.files[0]);
        } else
            alert("Failed to load file");
    }

    const saves = getSaves()

    return <div id='file-menu'>
        <button id='copy-button' onClick={() => dispatch('copy_image')}><MdOutlineFileCopy />Copy</button>
        <button id='close-button' onClick={() => dispatch({ action: "menu", close: "file" })}><IoClose /></button>
        <h3>Files</h3>

        <details open id='first-details'><summary><IoMdDownload />Download</summary>
            <span className='group'>
                <p>Pattern Name: </p>
                <input type="text" value={filename} onChange={(e) => dispatch({ filename: e.target.value })}></input>
            </span>
            <span className='group' id='download-buttons'>
                <select onChange={e => setFormat(e.target.value)}>
                    <option value='svg'>SVG</option>
                    <option value='png'>PNG</option>
                    <option value='jpeg'>JPEG</option>
                </select>
                <button onClick={() => dispatch({
                    action: "download_file",
                    name: downloadName, format, rect: new Rect(
                        Point.fromViewport(state, x, y),
                        Point.fromViewport(state, x + width, y + height)
                    ), selectedOnly: selectedOnly && bounds.length > 1
                })}>
                    <IoMdDownload /> Download
                </button>
            </span>
            {bounds.length > 1 && <Checkbox
                checked={selectedOnly}
                onChange={() => setSelectedOnly(!selectedOnly)}
                label="Only inlucde selection"
            />}
            {format !== 'svg' && !selectedOnly && <span id='gridbox'>
                <Number label="Width:" value={width} onChange={val => setWidth(val)} />
                <Number label="X:" value={x} onChange={val => setx(val)} />
                <Number label="Height:" value={height} onChange={val => setHeight(val)} />
                <Number label="Y:" value={y} onChange={val => sety(val)} />
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
                }}><MdOutlineTabUnselected /> Fit to Pattern</button>
            </span>}
        </details>

        <details><summary><MdUpload /> Upload</summary>
            <span className='group'>
                {/* Upload: */}
                <input type="file" onChange={handleFileSelection}></input>
            </span>
        </details>

        <details><summary><FaSave /> Save</summary>
            <span className='group'>
                <input type="text" onChange={(e) => setSaveName(e.target.value)}></input>
                <button onClick={() => dispatch({ action: 'save_local', name: saveName })}><FaSave /> Save</button>
            </span>
            <span>
                {/* <input type="text" onChange={(e) => setLoadName(e.target.value)}></input> */}
                <span>
                    {/* <label htmlFor="radio-group">Saves:</label> */}
                    <div id="radio-group">
                        {saves && Object.keys(JSON.parse(saves)).map(key => <div className='group' key={key}>
                            <input key={key} type="radio" id={key} name="saves" value={key} onChange={(e) => setLoadName(e.target.value)} />
                            <label htmlFor={key}>{key}</label>
                        </div>)}
                        {!saves && <p>No saves yet!</p>}
                    </div>
                </span>
                <span className='group'>
                    {/* Somehow this doesn't work */}
                    <button onClick={() => { dispatch({ action: 'load_local', name: loadName }); setTimeout(() => document.querySelector('#paper').dispatchEvent(new MouseEvent('click', { bubbles: true })), 200) }}>
                        <IoIosDownload /> Load
                    </button>
                    <button onClick={() =>
                        confirm('Are you sure you want to delete all your saves? This action is irreversible.')
                            ? clearSaves() : undefined
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

function FilePageMui() {
    const { state, dispatch } = useContext(StateContext)
    const { filename, bounds } = state

    // const [saveName, setSaveName] = useState('');
    const [loadName, setLoadName] = useState('');
    const [downloadName,] = useState('pattern');
    const [format, setFormat] = useState('svg');
    const [width, setWidth] = useState(viewportWidth());
    const [height, setHeight] = useState(viewportHeight());
    const [x, setx] = useState(0);
    const [y, sety] = useState(0);
    const [selectedOnly, setSelectedOnly] = useState(true);



    const [value, setValue] = React.useState('1');
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };


    function handleFileSelection(e) {
        if (e.target.files.length > 0) {
            var reader = new FileReader()
            reader.onload = function (e) {
                dispatch({ action: 'upload_file', str: e.target.result })
            }
            dispatch({ filename: /(.+)\./.exec(e.target.files[0].name)[1] })
            reader.readAsText(e.target.files[0]);
        } else
            alert("Failed to load file");
    }

    const saves = getSaves()

    return <Page menu='file' title='Files'>
        <Box sx={{ width: '100%', typography: 'body1' }}>
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleChange} aria-label="Download/Upload or Save/Load">
                        <Tab label="Download/Upload" value="1" icon={<DownloadIcon />} iconPosition='start' />
                        <Tab label="Save/Load" value="2" icon={<SaveIcon />} iconPosition='start' />
                    </TabList>
                </Box>
                <TabPanel value="1">
                    <Stack>
                        <Button id='copy-button' onClick={() => dispatch('copy_image')}>
                            <MdOutlineFileCopy />Copy Pattern
                        </Button>
                        {bounds.length > 1 && <FormControlLabel
                            control={<Checkbox checked={selectedOnly} onChange={() => setSelectedOnly(!selectedOnly)} />}
                            label="Only include selection"
                        />}
                        <Stack direction="row">
                            <TextField
                                label="Pattern Name"
                                value={filename}
                                onChange={(e) => dispatch({ filename: e.target.value })}
                            />
                            <Select
                                label="Format"
                                value={format}
                                onChange={e => setFormat(e.target.value)}
                            >
                                <MenuItem value='svg'>SVG</MenuItem>
                                <MenuItem value='png'>PNG</MenuItem>
                                <MenuItem value='jpeg'>JPEG</MenuItem>
                            </Select>
                            <Button variant="outlined" onClick={() => dispatch({
                                action: "download_file",
                                name: downloadName, format, rect: new Rect(
                                    Point.fromViewport(state, x, y),
                                    Point.fromViewport(state, x + width, y + height)
                                ), selectedOnly: selectedOnly && bounds.length > 1
                            })}>
                                <IoMdDownload /> Download
                            </Button>
                        </Stack>
                        {format !== 'svg' && !selectedOnly &&
                            <Grid container>
                                <Grid size={6}>
                                    <Number label="Width" value={width} onChange={val => setWidth(val)} />
                                    <Number label="Height" value={height} onChange={val => setHeight(val)} />
                                    <Button className='fit-button' onClick={() => {
                                        setWidth(viewportWidth())
                                        setHeight(viewportHeight())
                                        setx(0)
                                        sety(0)
                                    }}><ScreenshotMonitorIcon sx={{ mr: 1 }} />Current Screen</Button>
                                </Grid>
                                <Grid size={6}>
                                    <Number label="X" value={x} onChange={val => setx(val)} />
                                    <Number label="Y" value={y} onChange={val => sety(val)} />
                                    <Button className='fit-button' onClick={() => {
                                        const rect = document.querySelector('#lines').getBoundingClientRect()
                                        setWidth(rect.width)
                                        setHeight(rect.height)
                                        setx(rect.x)
                                        sety(rect.y)
                                    }}><HighlightAltIcon sx={{ mr: 1 }} />Selection</Button>
                                </Grid>
                            </Grid>
                        }
                        <FileInput onChange={handleFileSelection} accept=".svg" />
                        <Typography variant="caption" color="text.secondary">
                            Patterns autosave immediately after you make a change
                        </Typography>
                    </Stack>
                </TabPanel>
                {/* Save/Load Tab */}
                <TabPanel value="2">
                    <Stack direction='row'>
                        <TextField
                            label="Pattern Name"
                            value={filename}
                            onChange={(e) => dispatch({ filename: e.target.value })}
                        />
                        <Button variant="outlined" onClick={() => dispatch({ action: 'save_local', name: filename })}>
                            <SaveIcon /> Save
                        </Button>
                        <Button variant="outlined" onClick={() => dispatch({ filename: generateName(state.defaultToMemorableNames) })}>
                            Generate Random Name
                        </Button>
                    </Stack>
                    {/* TODO: this needs more work */}
                    <List dense>
                        {saves && Object.keys(saves).map(key => <ListItem key={key} secondaryAction={
                            <IconButton edge="end" aria-label="delete">
                                <DeleteIcon />
                            </IconButton>
                        }>
                            <ListItemIcon>
                                <FolderIcon />
                            </ListItemIcon>
                            <ListItemButton onClick={() => {
                                dispatch({ action: 'load_local', name: key });
                                // dispatch({ reloadRequired: true })
                            }}>
                                <ListItemText primary={key} />
                            </ListItemButton>
                        </ListItem>)}
                    </List>
                    <Button onClick={() =>
                        confirm('Are you sure you want to delete all your saves? This action is irreversible.')
                            ? dispatch({ action: 'clear_saves' }) : undefined
                    }>
                        <GiNuclear style={{ marginRight: '1em' }} /> Clear Saves
                    </Button>
                </TabPanel>
            </TabContext>
        </Box>



        {/* <footer className="footer"> */}
        {/* I&apos;m reasonably sure that any method of loading files is technically hackable.<br/> */}
        {/* Don&apos;t load or upload files from unknown sources */}
        {/* </footer> */}
        {/* <button onClick={() => dispatch({action: "load", })}><MdUpload />Upload</button> */}
    </Page>
}

export default FilePageMui
