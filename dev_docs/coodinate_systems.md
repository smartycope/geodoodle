# Coordinate systems

The filename is intentionally retained with its historical misspelling. Coordinate implementations live in `src/classes/Point.js`, `Dist.js`, `Pair.js`, and `Rect.jsx`; shared view-transform math lives in `src/utils/transform.js`.

- **Viewport** (previously Absolute) — browser-window coordinates with the origin at the top-left. Physical mouse/touch coordinates use this system.
- **SVG** (previously Relative) — coordinates relative to the SVG canvas origin.
- **Deflated** (previously Scaled) — durable logical coordinates with one unit per grid step. Lines, polygons, selections, and Trellis source geometry are stored in this system so changing zoom does not rewrite artwork.
- **Inflated** — pixel-scaled SVG distances after applying `scalex` and `scaley`.

`Point` represents a location. Use `Point.fromViewport`/`asViewport` and `Point.fromSvg`/`asSvg` at coordinate-system boundaries. Canvas rotation is around the visual viewport center.

`Dist` represents a vector, not a location. Use `Dist.fromInflated` for screen-space drag/scroll deltas and `Dist.asViewport` for canvas vectors. Vector rotation is around `(0, 0)`, not the viewport center.

The durable drawing remains deflated and unrotated. Translation, scale, and rotation are view transforms; do not rewrite `DrawingLayer` or `TrellisLayer` geometry when the view changes.
