import { memo, useContext, useEffect, useMemo, useRef } from "react"
import { StateContext } from "./Contexts"
import TrellisModel from "./helper/Trellis"
import { getCanvasTransform } from "./utils/transform"
import useViewportSize from "./useViewportSize"
import { TRELLIS_SIZE_WARNING } from "./utils/trellis"

/** Thin React renderer for the serializable Trellis model. */
export default memo(function Trellis({
  trellis: suppliedTrellis,
  layerState,
  id = "trellis",
  transformed = true,
  maxGroups,
  maxCandidates,
}) {
  const context = useContext(StateContext)
  const state = layerState ?? context.state
  const dispatch = context.dispatch
  const viewportSize = useViewportSize()
  const lastWarning = useRef(null)
  const legacyRequested = Boolean((state.trellis || state.openMenus?.repeat) && state.bounds?.length > 1)

  const trellis = useMemo(() => {
    if (suppliedTrellis instanceof TrellisModel) return suppliedTrellis
    if (state.trellis instanceof TrellisModel) return state.trellis
    // Legacy tests/files may still supply the old boolean/control shape.
    if ((state.trellis || state.openMenus?.repeat) && state.bounds?.length > 1)
      return TrellisModel.fromSelection(state, state)
    return null
  }, [suppliedTrellis, state])

  const result = useMemo(() => {
    if (!trellis?.valid) return { tiles: [], warning: legacyRequested ? TRELLIS_SIZE_WARNING : null }
    return trellis.visibleTiles(state, viewportSize.width, viewportSize.height, { maxGroups, maxCandidates })
  }, [trellis, legacyRequested, state, viewportSize.width, viewportSize.height, maxGroups, maxCandidates])

  useEffect(() => {
    if (!result.warning) {
      lastWarning.current = null
      return
    }
    if (lastWarning.current === result.warning) return
    lastWarning.current = result.warning
    dispatch?.({ toast: result.warning })
  }, [dispatch, result.warning])

  const renderedPattern = useMemo(
    () =>
      trellis
        ? [
            ...trellis.filledPolys.map((poly, index) => poly.render(state, `${id}-poly-${index}`)),
            ...trellis.lines.map((line, index) =>
              line.render(state, `${id}-line-${index}`, {}, false, trellis.boundRect),
            ),
          ]
        : [],
    [trellis, state, id],
  )

  if (!trellis?.valid || result.tiles.length === 0) return null

  return (
    <g id={id} transform={transformed ? getCanvasTransform(state) : undefined}>
      {result.tiles.map((tile) => (
        <g key={`${tile.row}:${tile.column}`} data-row={tile.row} data-column={tile.column} transform={tile.transform}>
          {renderedPattern}
        </g>
      ))}
    </g>
  )
})
