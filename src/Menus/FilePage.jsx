import { useContext, useState } from 'react';
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
import { Checkbox } from '@mui/material';
import TabManager from './TabManager';

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


export default function () {
    const { state, dispatch } = useContext(StateContext)
    const { filename, bounds } = state

    const [downloadName,] = useState('pattern');
    const [format, setFormat] = useState('svg');
    const [width, setWidth] = useState(viewportWidth());
    const [height, setHeight] = useState(viewportHeight());
    const [x, setx] = useState(0);
    const [y, sety] = useState(0);
    const [selectedOnly, setSelectedOnly] = useState(true);

    const saves = getSaves()

    const downloadTab = <>
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
        {/* TODO: I need a better way to phrase this */}
        {/* <Typography variant="caption" color="text.secondary">
            Patterns autosave immediately after you make a change
        </Typography> */}
    </>

    const saveTab = <>
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
    </>


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


    return <Page menu='file' title='Files'>
        <TabManager tabs={[
            { label: 'Download/Upload', content: downloadTab },
            { label: 'Save/Load', content: saveTab },
        ]} />
    </Page>
}
