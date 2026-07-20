import { useContext, useEffect, useMemo, useState } from "react"
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { move } from "@dnd-kit/helpers"
import { Badge, Box, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import DeleteIcon from "@mui/icons-material/Delete"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import VisibilityIcon from "@mui/icons-material/Visibility"
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff"
import { StateContext } from "../Contexts"

const PREVIEW_WIDTH = 76
const PREVIEW_HEIGHT = 56

function LayerPreview({ layer }) {
  const geometry = useMemo(() => {
    if (layer.trellis) return layer.trellis.materializeSource()
    return { lines: layer.lines, filledPolys: layer.filledPolys }
  }, [layer])
  const points = [
    ...geometry.lines.flatMap((line) => line.points()),
    ...geometry.filledPolys.flatMap((poly) => poly.points),
  ]
  if (!points.length)
    return (
      <Box
        aria-label="Empty layer preview"
        sx={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, bgcolor: "action.hover", borderRadius: 1 }}
      />
    )

  const xs = points.map((point) => point._x)
  const ys = points.map((point) => point._y)
  const left = Math.min(...xs)
  const top = Math.min(...ys)
  const width = Math.max(1, Math.max(...xs) - left)
  const height = Math.max(1, Math.max(...ys) - top)
  const pad = Math.max(width, height) * 0.08 + 0.2

  const rtn = (
    <svg
      aria-label={`${layer.name} preview`}
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
      viewBox={`${left - pad} ${top - pad} ${width + pad * 2} ${height + pad * 2}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ overflow: "hidden", borderRadius: 6, background: "rgba(127,127,127,.08)" }}
    >
      {geometry.filledPolys.map((poly, index) => (
        <polygon
          key={`poly-${index}`}
          points={poly.points.map((point) => `${point._x},${point._y}`).join(" ")}
          fill={poly.color ?? "currentColor"}
          stroke="none"
        />
      ))}
      {geometry.lines.map((line, index) => (
        <line
          key={`line-${index}`}
          x1={line.a._x}
          y1={line.a._y}
          x2={line.b._x}
          y2={line.b._y}
          stroke={line.aes.stroke}
          strokeWidth={Math.max(Number(line.aes?.width) || 0.05, Math.max(width, height) / 80)}
          strokeDasharray={line.aes?.dash || undefined}
          strokeLinecap={line.aes?.lineCap || "round"}
        />
      ))}
    </svg>
  )

  if (layer.trellis)
    return (
      <Badge
        variant="dot"
        color="primary"
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {rtn}
      </Badge>
    )
  else return rtn
}

function LayerRow({ layer, index }) {
  const { state, dispatch } = useContext(StateContext)
  const [name, setName] = useState(layer.name)
  const { ref, handleRef, isDragging } = useSortable({ id: layer.id, index, group: "layers", type: "layer" })
  const active = state.activeLayerId === layer.id

  useEffect(() => setName(layer.name), [layer.name])

  const commitName = () => {
    const value = name.trim() || "Layer"
    setName(value)
    if (value !== layer.name) dispatch({ action: "rename_layer", layerId: layer.id, name: value })
  }

  const deleteLayer = (event) => {
    event.stopPropagation()
    if (!layer.isEmpty && !window.confirm(`Delete "${layer.name}" and all of its contents?`)) return
    dispatch({ action: "delete_layer", layerId: layer.id })
  }

  return (
    <Paper
      ref={ref}
      component="li"
      elevation={active ? 5 : 1}
      onClick={() => dispatch({ action: "activate_layer", layerId: layer.id })}
      data-layer-id={layer.id}
      sx={(theme) => ({
        listStyle: "none",
        p: 1,
        opacity: isDragging ? 0.45 : layer.visible ? 1 : 0.62,
        border: `2px solid ${active ? theme.palette.primary.main : "transparent"}`,
        cursor: "pointer",
      })}
    >
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Tooltip title="Drag to reorder">
          <IconButton
            ref={handleRef}
            aria-label={`Reorder ${layer.name}`}
            size="small"
            onClick={(event) => event.stopPropagation()}
            sx={{ cursor: "grab", touchAction: "none" }}
          >
            <DragIndicatorIcon />
          </IconButton>
        </Tooltip>
        <LayerPreview layer={layer} />
        <TextField
          variant="standard"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commitName}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              setName(layer.name)
              event.currentTarget.blur()
            }
          }}
          inputProps={{ "aria-label": `Name ${layer.name}` }}
          sx={{ minWidth: 0, flex: 1 }}
        />
        <Tooltip title={layer.visible ? "Hide layer" : "Show layer"}>
          <IconButton
            aria-label={`${layer.visible ? "Hide" : "Show"} ${layer.name}`}
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              dispatch({ action: "set_layer_visibility", layerId: layer.id, visible: !layer.visible })
            }}
          >
            {layer.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete layer">
          <IconButton aria-label={`Delete ${layer.name}`} size="small" onClick={deleteLayer}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Stack>
    </Paper>
  )
}

export default function LayersPanel() {
  const { state, dispatch } = useContext(StateContext)
  const displayLayers = useMemo(() => [...state.layers].reverse(), [state.layers])
  const anchor = state.side === "right" ? "left" : "right"

  const onDragEnd = (event) => {
    if (event.operation.canceled || !event.operation.target) return
    const reorderedDisplay = move(displayLayers, event)
    dispatch({ action: "reorder_layers", orderedIds: [...reorderedDisplay].reverse().map((layer) => layer.id) })
  }

  return (
    <Paper
      id="layers-panel"
      elevation={12}
      sx={{
        position: "fixed",
        zIndex: (theme) => theme.zIndex.drawer,
        top: 0,
        bottom: 0,
        [anchor]: 0,
        width: { xs: "min(86vw, 320px)", sm: 320 },
        p: 1.5,
        pointerEvents: "all",
        overflow: "hidden",
        borderRadius: 0,
        bgcolor: (theme) => theme.alpha(theme.palette.background.paper, state.toolbarOpacity),
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1, bgcolor: (theme) => theme.palette.background.paper, p: 1, borderRadius: 2 }}
      >
        <Typography variant="h6">Layers</Typography>
        <Stack direction="row">
          <Tooltip title="Add layer">
            <IconButton aria-label="Add layer" onClick={() => dispatch("add_layer")}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <IconButton aria-label="Close layers" onClick={() => dispatch({ action: "menu", close: "layers" })}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>
      <DragDropProvider onDragEnd={onDragEnd}>
        <Stack component="ol" spacing={1} sx={{ p: 0, m: 0, overflowY: "auto", maxHeight: "calc(100vh - 64px)" }}>
          {displayLayers.map((layer, index) => (
            <LayerRow key={layer.id} layer={layer} index={index} />
          ))}
        </Stack>
      </DragDropProvider>
    </Paper>
  )
}
