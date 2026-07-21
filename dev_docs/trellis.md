# Trellis architecture

A Trellis is a concrete layer type. `src/classes/TrellisLayer.js` contains both the durable repeated-pattern model and the common `Layer` identity/visibility behavior inherited from `src/classes/Layer.js`. It is not an object attached to a drawing layer.

## Durable model

`TrellisLayer` stores:

- `sourceOrigin` and `sourceSize` in deflated canvas coordinates;
- source `lines` and `filledPolys`, stored relative to the source rectangle's top-left;
- row/column `overlap`, `skip`, `flip`, and `rotate` controls;
- the inherited `id`, `name`, and `visible` fields.

`TrellisLayer.fromSelection(state)` captures a completed, non-zero selection from the active `DrawingLayer` and creates the new concrete layer. A valid Trellis layer needs positive width and height and at least one captured line or polygon.

The class copies controls immutably, describes lattice tiles, finds finite visible tiles, materializes transformed tile `(0, 0)`, resets controls, and serializes/revives itself. It must not own drawing-only state such as bounds, selectors, mirror origins, or unrelated permanent geometry.

## Creation and editing

The completed design uses layer operations rather than the former Repeat workflow:

- creating a Trellis dispatches `add_trellis_layer` from a valid selection and inserts the new `TrellisLayer` above the active drawing layer;
- activating a Trellis layer switches the toolbar to Trellis-only controls;
- Offset, Skip, Flip, and Rotate menus update the active `TrellisLayer` directly and immutably;
- Reset calls the layer's `reset()` implementation;
- ordinary drawing tools remain unavailable while a Trellis layer is active.

There is no separate durable Trellis object, `trellisDraft`, umbrella Repeat menu, or Apply/Edit/Replace/Release lifecycle. Those legacy fields are accepted only at the persistence migration boundary.

## Tile transforms and cadence

`src/utils/trellis.js` contains the geometry engine used by `TrellisLayer`:

- affine composition and SVG matrix formatting;
- row/column cadence and negative-index modulo behavior;
- cumulative offsets anchored on row and column zero;
- center-based flip and rotation transforms;
- conservative candidate ranges and line/polygon viewport tests;
- global candidate/group safety limits.

Tile `(0, 0)` is an ordinary cadence member. Any flip or rotation active at index zero applies to it. Materialization and thumbnails therefore use `sourceTileDescriptor()` rather than treating the captured source as an untransformed special case.

Candidate-range calculation inverse-transforms all four viewport corners and accounts for geometry protruding beyond the source rectangle and for transformed pattern radius. This preserves coverage under canvas rotation, non-uniform scale, offsets, flips, and long crossing lines.

## Rendering

The memoized `Trellis` React component lives in `src/drawing.jsx`. It receives a `TrellisLayer`, asks it for finite tile descriptors, dispatches a warning once when safety limits are reached, and renders the source polygons and lines inside each tile transform group. Hooks and warning dispatch remain outside the durable class.

`ArtworkLayers` counts visible `TrellisLayer` instances and divides `MAX_TRELLIS_GROUPS` and `MAX_TRELLIS_CANDIDATES` among them. Export must use the same policy with the export rectangle substituted for the viewport so multiple Trellis layers cannot multiply the worst-case work.

## Persistence and migration

Schema 3 stores `TrellisLayer` with a `type` discriminator and revives its `Point`, `Dist`, `Line`, and `Poly` members. Visual exports finitely expand visible Trellis layers, while editable metadata retains their source geometry and controls.

Legacy documents may contain a Boolean Trellis flag, Trellis controls in global state, or a Trellis embedded in a generic layer. Deserialization may accept those shapes, but it should normalize them into separate concrete layer subclasses. New serialization must never emit the legacy hybrid shape.
