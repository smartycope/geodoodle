import { useContext, useState, useEffect } from "react";
import Number from "./Number.jsx";
import { GiNuclear } from "react-icons/gi";
import { StateContext } from "../Contexts.jsx";
import { viewportWidth, viewportHeight } from "../globals.js";
import Rect from "../helper/Rect.jsx";
import Point from "../helper/Point.js";
import Page from "./Page.jsx";
import { getSaves, generateName } from "../fileUtils.jsx";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ScreenshotMonitorIcon from "@mui/icons-material/ScreenshotMonitor";
import HighlightAltIcon from "@mui/icons-material/HighlightAlt";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Checkbox from "@mui/material/Checkbox";
import TabManager from "./TabManager";
import ShareIcon from "@mui/icons-material/Share";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import SyncIcon from "@mui/icons-material/Sync";

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

export default function FilePage() {
    const { state, dispatch } = useContext(StateContext);
    const { filename, bounds } = state;

    const [downloadName] = useState("pattern");
    const [format, setFormat] = useState("svg");
    const [width, setWidth] = useState(viewportWidth());
    const [height, setHeight] = useState(viewportHeight());
    const [x, setx] = useState(0);
    const [y, sety] = useState(0);
    const [selectedOnly, setSelectedOnly] = useState(true);

    const saves = getSaves();

    useEffect(() => {
        // TODO: this requires debugging in the main branch (because WebShare API only works in secure contexts)
        const share = () => {
            console.log("Share clicked");
            if (navigator.share) {
                try {
                    navigator.share({
                        title: "Check this out!",
                        text: "Here’s something cool.",
                        url: window.location.href,
                    });
                } catch (err) {
                    console.error("Share failed:", err);
                }
            } else {
                alert("Share not supported");
            }
        };

        const shareButton = document.getElementById("share-button");
        if (shareButton) shareButton.addEventListener("click", share);
        else console.error("Share button not found");

        return () => shareButton?.removeEventListener("click", share);
    }, []);

    const downloadTab = (
        <>
            {bounds.length > 1 && (
                <FormControlLabel
                    control={<Checkbox checked={selectedOnly} onChange={() => setSelectedOnly(!selectedOnly)} />}
                    label="Only include selection"
                />
            )}
            <Stack direction="row">
                <TextField
                    label="Pattern Name"
                    value={filename}
                    onChange={(e) => dispatch({ filename: e.target.value })}
                />
                <Select label="Format" value={format} onChange={(e) => setFormat(e.target.value)}>
                    <MenuItem value="svg">SVG</MenuItem>
                    <MenuItem value="png">PNG</MenuItem>
                    <MenuItem value="jpeg">JPEG</MenuItem>
                </Select>
                <IconButton
                    variant="outlined"
                    onClick={() =>
                        dispatch({
                            action: "download_file",
                            name: downloadName,
                            format,
                            rect: new Rect(
                                Point.fromViewport(state, x, y),
                                Point.fromViewport(state, x + width, y + height),
                            ),
                            selectedOnly: selectedOnly && bounds.length > 1,
                        })
                    }
                >
                    <DownloadIcon />
                </IconButton>
            </Stack>
            {format !== "svg" && !selectedOnly && (
                <Grid container>
                    <Grid size={6}>
                        <Number label="Width" value={width} onChange={(val) => setWidth(val)} />
                        <Number label="Height" value={height} onChange={(val) => setHeight(val)} />
                        <Button
                            className="fit-button"
                            onClick={() => {
                                setWidth(viewportWidth());
                                setHeight(viewportHeight());
                                setx(0);
                                sety(0);
                            }}
                        >
                            <ScreenshotMonitorIcon sx={{ mr: 1 }} />
                            Current Screen
                        </Button>
                    </Grid>
                    <Grid size={6}>
                        <Number label="X" value={x} onChange={(val) => setx(val)} />
                        <Number label="Y" value={y} onChange={(val) => sety(val)} />
                        <Button
                            className="fit-button"
                            onClick={() => {
                                const rect = document.querySelector("#lines").getBoundingClientRect();
                                setWidth(rect.width);
                                setHeight(rect.height);
                                setx(rect.x);
                                sety(rect.y);
                            }}
                        >
                            <HighlightAltIcon sx={{ mr: 1 }} />
                            Selection
                        </Button>
                    </Grid>
                </Grid>
            )}
            <FileInput onChange={handleFileSelection} accept=".svg" />
            {/* TODO: I need a better way to phrase this */}
            {/* <Typography variant="caption" color="text.secondary">
            Patterns autosave immediately after you make a change
        </Typography> */}
        </>
    );

    const saveTab = (
        <>
            <Stack direction="row">
                <TextField
                    label="Pattern Name"
                    value={filename}
                    onChange={(e) => dispatch({ filename: e.target.value })}
                />
                <Button
                    variant="outlined"
                    onClick={() => dispatch({ filename: generateName(state.defaultToMemorableNames) })}
                >
                    <SyncIcon sx={{ mr: 1 }} />
                    Random Name
                </Button>
                <IconButton variant="outlined" onClick={() => dispatch({ action: "save_local", name: filename })}>
                    <SaveIcon />
                </IconButton>
            </Stack>

            {/* TODO: this needs more work */}
            <List
                dense
                sx={(theme) => ({
                    outline: "1px solid " + theme.palette.divider,
                    borderRadius: theme.shape.borderRadius / 2,
                })}
            >
                {saves &&
                    Object.keys(saves).map((key) => (
                        <ListItem
                            key={key}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={() => dispatch({ action: "delete_local", name: key })}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemIcon>
                                <FolderIcon />
                            </ListItemIcon>
                            <ListItemButton
                                onClick={() => {
                                    dispatch({ action: "load_local", name: key });
                                    // dispatch({ reloadRequired: true })
                                }}
                            >
                                <ListItemText primary={key} />
                            </ListItemButton>
                        </ListItem>
                    ))}
            </List>
            <Button
                onClick={() =>
                    confirm("Are you sure you want to delete all your saves? This action is irreversible.")
                        ? dispatch({ action: "clear_saves" })
                        : undefined
                }
            >
                <GiNuclear style={{ marginRight: "1em" }} /> Clear Saves
            </Button>
        </>
    );

    function handleFileSelection(e) {
        if (e.target.files.length > 0) {
            var reader = new FileReader();
            reader.onload = function (e) {
                dispatch({ action: "upload_file", str: e.target.result });
            };
            dispatch({ filename: /(.+)\./.exec(e.target.files[0].name)[1] });
            reader.readAsText(e.target.files[0]);
        } else alert("Failed to load file");
    }

    return (
        <Page
            menu="file"
            title={
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mr: 5,
                        mt: -1,
                    }}
                >
                    Files
                    <div>
                        <IconButton id="share-button">
                            <ShareIcon />
                        </IconButton>
                        <IconButton onClick={() => dispatch("copy_image")}>
                            <FileCopyIcon />
                        </IconButton>
                    </div>
                </Box>
            }
        >
            <TabManager
                tabs={[
                    { label: "Download/Upload", content: downloadTab },
                    { label: "Save/Load", content: saveTab },
                ]}
            />
        </Page>
    );
}
