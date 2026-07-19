import { useContext, useEffect, useId, useState } from "react"
import { GiNuclear } from "react-icons/gi"
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined"
import DeleteIcon from "@mui/icons-material/Delete"
import DownloadIcon from "@mui/icons-material/Download"
import FileCopyIcon from "@mui/icons-material/FileCopy"
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined"
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined"
import FolderIcon from "@mui/icons-material/Folder"
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined"
import HighlightAltIcon from "@mui/icons-material/HighlightAlt"
import SaveIcon from "@mui/icons-material/Save"
import ScreenshotMonitorIcon from "@mui/icons-material/ScreenshotMonitor"
import ShareIcon from "@mui/icons-material/Share"
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined"
import SyncIcon from "@mui/icons-material/Sync"
import Number from "./Number.jsx"
import { StateContext } from "../Contexts.jsx"
import { viewportHeight, viewportWidth } from "../globals.js"
import Rect from "../helper/Rect.jsx"
import Point from "../helper/Point.js"
import Page from "./Page.jsx"
import {
  deleteCloud,
  generateName,
  getCloudSaves,
  getSaves,
  loadCloud,
  preservedStatesEqual,
  saveCloud,
} from "../fileUtils.jsx"
import TabManager from "./TabManager"
import { sharePatternLink } from "../shareUtils"

const cloudHelpText =
  "Files are stored on Cope's semi-reliable server. They'll probably be safe? But if you have a pattern you really care about, " +
  "download it to be safe.\n" +
  "Patterns are keyed to the username you enter. You can see other people's patterns if you enter their username, and vice versa.\n" +
  "There is no privacy! Currently, anyway."

function SectionCard({ icon, title, description, action, children }) {
  return (
    <Paper component="section" variant="outlined" sx={{ borderRadius: 3, overflow: "hidden", backgroundImage: "none" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: { xs: 2, sm: 2.5 }, py: 2 }}>
        {icon && (
          <Box
            sx={(theme) => ({
              width: 40,
              height: 40,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: 2,
              color: "primary.main",
              bgcolor: theme.alpha(theme.palette.primary.main, 0.1),
            })}
          >
            {icon}
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      <Divider />
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
    </Paper>
  )
}

function FileInput({ label = "Choose SVG file", onFile, accept = ".svg,image/svg+xml" }) {
  const inputId = useId()

  return (
    <Box
      sx={(theme) => ({
        p: 2.5,
        display: "grid",
        placeItems: "center",
        gap: 1,
        textAlign: "center",
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
        bgcolor: theme.alpha(theme.palette.primary.main, 0.025),
      })}
    >
      <FileUploadOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
      <Box>
        <Typography variant="body2" fontWeight={700}>
          Open a GeoDoodle SVG
        </Typography>
        <Typography variant="caption" color="text.secondary">
          This replaces the current pattern.
        </Typography>
      </Box>
      <input
        accept={accept}
        id={inputId}
        type="file"
        style={{ display: "none" }}
        onChange={(event) => onFile?.(event.target.files?.[0])}
      />
      <label htmlFor={inputId}>
        <Button variant="outlined" component="span" startIcon={<FileUploadOutlinedIcon />}>
          {label}
        </Button>
      </label>
    </Box>
  )
}

function SavedPatternList({ names, emptyMessage, onLoad, onDelete, deleteLabel }) {
  if (!names.length)
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <FolderIcon sx={{ mb: 1, fontSize: 36, color: "text.disabled" }} />
        <Typography variant="body2" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    )

  return (
    <List disablePadding aria-label="Saved patterns">
      {names.map((name, index) => (
        <ListItem
          disablePadding
          divider={index < names.length - 1}
          key={name}
          secondaryAction={
            <Tooltip title={`Delete ${name}`}>
              <IconButton edge="end" aria-label={`${deleteLabel} ${name}`} onClick={() => onDelete(name)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemButton onClick={() => onLoad(name)} sx={{ pr: 7, borderRadius: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 42 }}>
              <FolderIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary={name} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}

export default function FilePage() {
  const { state, dispatch, cloudUsername: username, setCloudUsername } = useContext(StateContext)
  const { filename, bounds } = state

  const [cloudSaves, setCloudSaves] = useState([])
  const [cloudRefresh, setCloudRefresh] = useState(0)
  const [format, setFormat] = useState("svg")
  const [width, setWidth] = useState(viewportWidth())
  const [height, setHeight] = useState(viewportHeight())
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [selectedOnly, setSelectedOnly] = useState(true)
  const [sharing, setSharing] = useState(false)

  const localSaveNames = Object.keys(getSaves() ?? {})
  const hasSelection = bounds.length > 1
  const exportingSelection = hasSelection && selectedOnly

  useEffect(() => {
    let current = true
    const cloudUsername = username.trim()

    getCloudSaves(cloudUsername)
      .then((saves) => {
        if (current) setCloudSaves(saves)
      })
      .catch((error) => {
        console.error("Unable to load cloud saves:", error)
        if (current) {
          setCloudSaves([])
          dispatch({ toast: "Unable to load cloud saves" })
        }
      })

    return () => {
      current = false
    }
  }, [username, cloudRefresh, dispatch])

  const refreshCloudSaves = () => setCloudRefresh((refresh) => refresh + 1)

  const handleCloudSave = async () => {
    const cloudUsername = username.trim()
    if (!cloudUsername) return

    try {
      await saveCloud(state, cloudUsername, filename)
      refreshCloudSaves()
    } catch (error) {
      console.error("Unable to save to the cloud:", error)
      dispatch({ toast: "Unable to save to the cloud" })
    }
  }

  const handleCloudDelete = async (name) => {
    try {
      await deleteCloud(username.trim(), name)
      refreshCloudSaves()
    } catch (error) {
      console.error("Unable to delete the cloud save:", error)
      dispatch({ toast: "Unable to delete the cloud save" })
    }
  }

  const handleCloudLoad = async (name) => {
    try {
      const data = await loadCloud(username.trim(), name)
      if (data) dispatch({ action: "deserialize", data })
      else dispatch({ toast: "Cloud save not found" })
    } catch (error) {
      console.error("Unable to load the cloud save:", error)
      dispatch({ toast: "Unable to load the cloud save" })
    }
  }

  const clearCloudSaves = async () => {
    if (!confirm("Are you sure you want to delete all your cloud saves? This action is irreversible.")) return
    try {
      await Promise.all(cloudSaves.map((save) => deleteCloud(username.trim(), save.name)))
      refreshCloudSaves()
    } catch (error) {
      console.error("Unable to clear cloud saves:", error)
      dispatch({ toast: "Unable to clear cloud saves" })
    }
  }

  const handleSharePattern = async () => {
    const cloudUsername = username.trim()
    const patternName = filename.trim()
    const saveFirstToast = "Save this pattern to the cloud before sharing it"

    if (!cloudUsername || !patternName) {
      dispatch({ toast: saveFirstToast })
      return
    }

    setSharing(true)
    try {
      const cloudPattern = await loadCloud(cloudUsername, patternName)
      if (!cloudPattern || !preservedStatesEqual(state, cloudPattern)) {
        dispatch({ toast: saveFirstToast })
        return
      }

      const result = await sharePatternLink(cloudUsername, patternName)
      if (result === "copied") dispatch({ toast: "Share link copied to clipboard" })
      else if (result === "failed" || result === "unsupported") dispatch({ toast: "Unable to share this link" })
    } catch (error) {
      console.error("Unable to verify the cloud save before sharing:", error)
      dispatch({ toast: "Unable to verify the cloud save before sharing" })
    } finally {
      setSharing(false)
    }
  }

  const randomizeName = () => dispatch({ filename: generateName(state.defaultToMemorableNames) })

  const patternNameControls = ({ onSave, saveLabel, saveDisabled = false }) => (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "stretch" }}>
      <TextField
        fullWidth
        label="Pattern name"
        value={filename}
        onChange={(event) => dispatch({ filename: event.target.value })}
      />
      <Button variant="outlined" startIcon={<SyncIcon />} onClick={randomizeName} sx={{ whiteSpace: "nowrap" }}>
        New name
      </Button>
      <Button
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={onSave}
        disabled={saveDisabled}
        sx={{ minWidth: "max-content", flexShrink: 0, whiteSpace: "nowrap" }}
      >
        {saveLabel}
      </Button>
    </Stack>
  )

  const downloadPattern = () =>
    dispatch({
      action: "download_file",
      name: filename.trim() || "pattern",
      format,
      rect: Rect.fromPoints(
        Point.fromViewport(state, x, y),
        Point.fromViewport(state, x + width, y),
        Point.fromViewport(state, x, y + height),
        Point.fromViewport(state, x + width, y + height),
      ),
      selectedOnly: exportingSelection,
    })

  const fitCurrentScreen = () => {
    setWidth(viewportWidth())
    setHeight(viewportHeight())
    setX(0)
    setY(0)
  }

  const fitArtwork = () => {
    const visibleLayers = state.layers.filter((layer) => layer.visible)
    if (visibleLayers.some((layer) => layer.trellis)) {
      fitCurrentScreen()
      return
    }
    const points = visibleLayers.flatMap((layer) => [
      ...layer.lines.flatMap((line) => line.points()),
      ...layer.filledPolys.flatMap((poly) => poly.points),
    ])
    if (!points.length) return
    const viewportPoints = points.map((point) => point.asViewport(state))
    const left = Math.min(...viewportPoints.map((point) => point.x))
    const right = Math.max(...viewportPoints.map((point) => point.x))
    const top = Math.min(...viewportPoints.map((point) => point.y))
    const bottom = Math.max(...viewportPoints.map((point) => point.y))
    setWidth(right - left)
    setHeight(bottom - top)
    setX(left)
    setY(top)
  }

  const handleFileSelection = (file) => {
    if (!file) {
      alert("Failed to load file")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => dispatch({ action: "upload_file", str: event.target.result })
    dispatch({ filename: file.name.replace(/\.[^/.]+$/, "") })
    reader.readAsText(file)
  }

  const exportTab = (
    <Grid container spacing={2} alignItems="flex-start">
      <Grid size={{ xs: 12, md: 8 }}>
        <SectionCard
          icon={<FileDownloadOutlinedIcon />}
          title="Download pattern"
          description="Export an editable SVG or a ready-to-share image."
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "stretch" }}>
              <TextField
                fullWidth
                label="File name"
                value={filename}
                onChange={(event) => dispatch({ filename: event.target.value })}
              />
              <FormControl sx={{ minWidth: { sm: 130 } }}>
                <InputLabel id="download-format-label">Format</InputLabel>
                <Select
                  labelId="download-format-label"
                  label="Format"
                  value={format}
                  onChange={(event) => setFormat(event.target.value)}
                >
                  <MenuItem value="svg">SVG</MenuItem>
                  <MenuItem value="png">PNG</MenuItem>
                  <MenuItem value="jpeg">JPEG</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={downloadPattern}
                sx={{ minWidth: 140, whiteSpace: "nowrap" }}
              >
                Download
              </Button>
            </Stack>

            {hasSelection && (
              <FormControlLabel
                control={<Checkbox checked={selectedOnly} onChange={() => setSelectedOnly((current) => !current)} />}
                label="Only include the current selection"
              />
            )}

            {!exportingSelection && (
              <Box
                sx={(theme) => ({
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.alpha(theme.palette.primary.main, 0.045),
                })}
              >
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Image area
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Choose the size and top-left position of the exported image.
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Number label="Width" value={width} onValueChange={setWidth} />
                        <Number label="Height" value={height} onValueChange={setHeight} />
                      </Stack>
                      <Button variant="outlined" startIcon={<ScreenshotMonitorIcon />} onClick={fitCurrentScreen}>
                        Use current screen
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack spacing={1.5}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Number label="X" value={x} onValueChange={setX} />
                        <Number label="Y" value={y} onValueChange={setY} />
                      </Stack>
                      <Button variant="outlined" startIcon={<HighlightAltIcon />} onClick={fitArtwork}>
                        Fit artwork
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Stack>
        </SectionCard>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <SectionCard
          icon={<FileUploadOutlinedIcon />}
          title="Open pattern"
          description="Continue working from an exported GeoDoodle file."
        >
          <FileInput onFile={handleFileSelection} />
        </SectionCard>
      </Grid>
    </Grid>
  )

  const localTab = (
    <Stack spacing={2}>
      <SectionCard
        icon={<SaveIcon />}
        title="Save current pattern"
        description="Keep an editable copy in this browser."
      >
        {patternNameControls({
          onSave: () => dispatch({ action: "save_local", name: filename }),
          saveLabel: "Save here",
        })}
      </SectionCard>

      <SectionCard
        icon={<StorageOutlinedIcon />}
        title="Saved on this device"
        description="These patterns stay in this browser's local storage."
        action={<Chip size="small" label={localSaveNames.length} />}
      >
        <SavedPatternList
          names={localSaveNames}
          emptyMessage="No patterns saved on this device yet."
          onLoad={(name) => dispatch({ action: "load_local", name })}
          onDelete={(name) => dispatch({ action: "delete_local", name })}
          deleteLabel="Delete local pattern"
        />
        {localSaveNames.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              color="error"
              startIcon={<GiNuclear />}
              onClick={() =>
                confirm("Are you sure you want to delete all your saves? This action is irreversible.")
                  ? dispatch({ action: "clear_saves" })
                  : undefined
              }
            >
              Clear device saves
            </Button>
          </Box>
        )}
      </SectionCard>
    </Stack>
  )

  const cloudTab = (
    <Stack spacing={2}>
      <Alert
        severity="warning"
        action={
          <Tooltip title="How cloud saves work">
            <IconButton aria-label="Cloud save help" color="inherit" size="small" onClick={() => alert(cloudHelpText)}>
              <HelpOutlineOutlinedIcon />
            </IconButton>
          </Tooltip>
        }
      >
        Cloud saves are public and experimental. Download anything important.
      </Alert>

      <SectionCard
        icon={<CloudOutlinedIcon />}
        title="Cloud workspace"
        description="Use a username to access its shared collection of patterns."
      >
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(event) => setCloudUsername(event.target.value.trim().toLowerCase())}
            helperText="Anyone using this username can see and change its patterns."
          />
          {patternNameControls({ onSave: handleCloudSave, saveLabel: "Save to cloud", saveDisabled: !username.trim() })}
        </Stack>
      </SectionCard>

      <SectionCard
        icon={<CloudOutlinedIcon />}
        title="Cloud patterns"
        description={username.trim() ? `Patterns stored for ${username.trim()}.` : "Enter a username to view patterns."}
        action={<Chip size="small" label={cloudSaves.length} />}
      >
        <SavedPatternList
          names={cloudSaves.map((save) => save.name)}
          emptyMessage={username.trim() ? "No cloud saves yet." : "Enter a username above to get started."}
          onLoad={handleCloudLoad}
          onDelete={handleCloudDelete}
          deleteLabel="Delete cloud pattern"
        />
        {cloudSaves.length > 0 && (
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button color="error" startIcon={<GiNuclear />} onClick={clearCloudSaves}>
              Clear cloud saves
            </Button>
          </Box>
        )}
      </SectionCard>
    </Stack>
  )

  return (
    <Page
      menu="file"
      maxWidth="lg"
      sx={{
        "& .MuiDialog-paper": { borderRadius: { xs: 0, sm: 3 } },
        "& .MuiDialogContent-root": { px: { xs: 1.5, sm: 3 } },
      }}
      title={
        <Box
          sx={{
            mr: 5,
            display: "flex",
            gap: 2,
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box>
            <Typography variant="h5" component="span" fontWeight={800}>
              Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Move your pattern between GeoDoodle, this device, and the world.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Button
              id="share-button"
              size="small"
              variant="outlined"
              startIcon={<ShareIcon />}
              onClick={handleSharePattern}
              disabled={sharing}
            >
              {sharing ? "Checking cloud…" : "Share link"}
            </Button>
            <Button size="small" variant="outlined" startIcon={<FileCopyIcon />} onClick={() => dispatch("copy_image")}>
              Copy image
            </Button>
          </Stack>
        </Box>
      }
    >
      <TabManager
        id="files"
        contentSx={{ p: { xs: 1.5, sm: 2.5 } }}
        tabs={[
          { label: "This device", content: localTab },
          { label: "Cloud", content: cloudTab },
          { label: "Import & Export", content: exportTab },
        ]}
      />
    </Page>
  )
}
