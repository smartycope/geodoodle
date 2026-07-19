import { memo, useContext, useEffect, useMemo, useRef } from "react"
import { StateContext } from "./Contexts"
import { getBoundRect, getSelected } from "./utils"
import { getCanvasTransform } from "./transformUtils"
import { buildVisibleTrellisTiles } from "./trellisUtils"
import useViewportSize from "./useViewportSize"

/*
 * Trellis is a finite, source-anchored lattice. This layer owns the selected
 * lines/polygons while repeating, including the generated tile at row 0,
 * column 0. Every skip/offset/flip/rotation cadence is phased from that source,
 * so the base tile transforms and blends into the surrounding pattern.
 *
 * Candidate indices come from the inverse lattice bounds of all four viewport
 * corners. Each candidate is then checked in screen space: lines use
 * Cohen-Sutherland clipping and polygons use vertex, edge, and containment
 * tests. This accounts for page rotation and long geometry outside the selected
 * rectangle without creating off-screen React/SVG groups.
 */
export default memo(function Trellis() {
  const { state, dispatch } = useContext(StateContext)
  const viewportSize = useViewportSize()
  const lastWarning = useRef(null)
  const active = Boolean((state.trellis || state.openMenus.repeat) && state.bounds.length > 1)

  const boundRect = useMemo(
    () => (active ? getBoundRect(state) : null),
    // A completed Trellis selection does not depend on cursorPos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, state.bounds, state.boundDragging],
  )
  const pattern = useMemo(
    () => (active && boundRect ? getSelected(state, "topLeft", true) : []),
    // Selection membership is fully described by these immutable state fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      active,
      boundRect,
      state.lines,
      state.filledPolys,
      state.partials,
      state.genericSelectors,
      state.specificSelectors,
    ],
  )

  const result = useMemo(() => {
    if (!active || !boundRect) return { tiles: [], warning: null }
    return buildVisibleTrellisTiles({
      pattern,
      state,
      boundRect,
      viewportWidth: viewportSize.width,
      viewportHeight: viewportSize.height,
    })
    // Only geometry, repeat controls, and canvas transforms affect culling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    pattern,
    boundRect,
    viewportSize.width,
    viewportSize.height,
    state.scalex,
    state.scaley,
    state.translation,
    state.rotate,
    state.trellisOverlap,
    state.trellisSkip,
    state.trellisFlip,
    state.trellisRotate,
  ])

  useEffect(() => {
    if (!result.warning) {
      lastWarning.current = null
      return
    }
    if (lastWarning.current === result.warning) return
    lastWarning.current = result.warning
    dispatch({ toast: result.warning })
  }, [dispatch, result.warning])

  const renderedPattern = useMemo(
    () =>
      pattern.map((object, index) =>
        object.render(
          state,
          `trellis-pattern-${index}`,
          {}, // state.debug ? { stroke: "red", strokeWidth: 2 / state.scalex } : {},
          false,
          boundRect,
        ),
      ),
    // Rendering aesthetics do not need to invalidate lattice visibility.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pattern, boundRect, state.debug, state.scalex, state.colorProfile, state.fill],
  )

  if (!active || !boundRect || result.tiles.length === 0) return null

  return (
    <g id="trellis" transform={getCanvasTransform(state)}>
      {result.tiles.map((tile) => (
        <g key={`${tile.row}:${tile.column}`} data-row={tile.row} data-column={tile.column} transform={tile.transform}>
          {renderedPattern}
        </g>
      ))}
    </g>
  )
})
