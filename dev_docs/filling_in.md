# Filling in colors

Fill is a `DrawingLayer` operation. A `TrellisLayer` displays captured polygons but cannot enter fill mode or accept new fills.

Entering fill mode normalizes and deduplicates the active drawing layer's lines with helpers in `src/utils/lines.js`, splits intersections into non-overlapping segments, and passes the resulting multiline geometry to Turf's `polygonize`. The resulting `Poly` instances are stored transiently in `tempPolys`.

As the physical mouse moves, `src/utils/misc.jsx:getPreviewPolys` checks `Poly.contains` for the mouse point and its mirrored copies. This intentionally uses `mousePos`, not the snapped `cursorPos`, so the user can choose a polygon interior between graph intersections. Committing a fill adds colored `Poly` instances to the active `DrawingLayer`; fill previews remain transient global interaction state.
