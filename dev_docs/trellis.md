# Trellis architecture

A Trellis is durable layer-owned geometry, not a rendering flag. `src/helper/Trellis.js` stores a finite source tile and the controls needed to repeat it; `src/Trellis.jsx` is a thin React renderer.

## Durable model

`Trellis` stores:

- `sourceOrigin` and `sourceSize` in deflated canvas coordinates;
- source `lines` and `filledPolys` relative to the source rectangle's top-left;
- row/column `overlap`, `skip`, `flip`, and `rotate` controls.

The class captures a completed selection, copies controls immutably, describes any lattice tile, finds finite visible tiles, materializes transformed tile `(0, 0)`, and serializes/revives itself. A valid Trellis needs non-zero width and height and at least one captured object.

Each layer owns at most one applied Trellis. `state.trellisDraft` is transient and records its target layer, mode (`create`, `edit`, or `replace`), captured source indexes, and a draft Trellis. Drafts are excluded from undo snapshots and persistence.

## Apply, edit, replace, and release

Opening Repeat does one of two things:

- without an applied Trellis, it captures the active completed selection into a create draft;
- with an applied Trellis, it copies that Trellis into an edit draft without requiring bounds.

Closing Repeat discards the draft. Apply commits the draft and closes Repeat. A create Apply removes the captured source objects from ordinary layer geometry and clears selection state. An edit Apply changes the controls while retaining the captured pattern.

Replace captures a new completed selection. Applying it first materializes the old Trellis's transformed tile zero into ordinary geometry, then installs the replacement. Release is the only Trellis-removal action: it materializes transformed tile zero, removes the Trellis, and selects the restored objects.

## Tile transforms and cadence

`src/trellisUtils.js` contains the geometry engine used by `Trellis`:

- affine composition and SVG matrix formatting;
- row/column cadence and negative-index modulo behavior;
- cumulative offsets anchored on row and column zero;
- center-based flip and rotation transforms;
- conservative candidate ranges and line/polygon viewport tests;
- global candidate/group safety limits.

Tile `(0, 0)` is an ordinary cadence member. Any flip or rotation active at index zero applies to it. Release and layer thumbnails therefore use `sourceTileDescriptor()` rather than treating the captured source as an untransformed special case.

The candidate range inverse-transforms all four viewport corners. It also accounts for geometry protruding beyond the source rectangle and for transformed pattern radius. This preserves coverage under canvas rotation, non-uniform scale, offsets, flips, and long crossing lines.

`ArtworkLayers` divides `MAX_TRELLIS_GROUPS` and `MAX_TRELLIS_CANDIDATES` across all visible Trellises. Export applies the same division and substitutes the export rectangle for the viewport, preventing multiple layers from multiplying the worst-case budget.

## Rendering and selection

The Trellis renderer receives a model and layer state, requests its finite tile descriptors, dispatches a warning once when safety limits are reached, and emits the source fills and lines inside each tile group. Hooks and warning dispatch stay out of the durable class.

During create/replace preview, `ArtworkLayers` suppresses the captured ordinary source indexes. `trellisSelectionUtils.js` applies the draft's tile-zero matrix to bounds and selection controls without mutating stored selection points. Once applied, the source exists only inside the Trellis and no bounds are required for rendering.

## Persistence and migration

Schema 2 revives Trellis, Layer, Line, Poly, Point, and Dist instances. Legacy flat documents migrate their geometry and controls into `Layer 1`. If the old Boolean Trellis flag is active with valid bounds, migration captures the selected source and removes it from ordinary geometry. Comment-free legacy SVGs containing only `#lines` remain importable.
