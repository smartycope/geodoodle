# Layers

GeoDoodle stores editable artwork in an ordered `state.layers` array. Array order is bottom-to-top; the Layers panel reverses it so the topmost layer is listed first. `state.activeLayerId` identifies the active layer.

## Model

The durable layer hierarchy lives in `src/classes/`:

- `Layer.js` is the abstract base. It owns only `id`, `name`, and `visible`, plus the polymorphic `copy`, `reset`, `isEmpty`, and `toJSON` contracts.
- `DrawingLayer.js` owns ordinary drawing geometry and interaction state: `lines`, `filledPolys`, `bounds`, `specificSelectors`, `genericSelectors`, and `mirrorOrigins`.
- `TrellisLayer.js` owns one repeated pattern: its source origin and size, relative source lines and polygons, and its overlap, skip, flip, and rotate controls.

These types are mutually exclusive. A `DrawingLayer` must not contain a Trellis, and a `TrellisLayer` must not acquire ordinary drawing selection or mirror fields. Do not add an optional `trellis` property back to the base class or to `DrawingLayer`.

Layer methods return new instances. Actions replace a layer in `state.layers`; they do not mutate a layer or its collections in place. Serialized layers include a `type` discriminator, and `src/utils/layers.js:layerFromJSON` revives the matching subclass.

## Active-layer projection

`src/utils/layers.js` owns layer lookup, replacement, JSON revival, and the temporary projection used by existing drawing algorithms.

`getLayerState` overlays the active layer's applicable fields onto the global state shape. `normalizeLayerActionResult` moves layer-owned fields returned by an action back into the active layer before the reducer commits state. During the refactor, keep these helpers type-aware: drawing actions may project/update drawing fields only for a `DrawingLayer`, while Trellis controls update a `TrellisLayer` itself.

The projection is an adaptation boundary, not a second durable representation. `state.layers` remains the canonical document model.

## Actions and interaction

Layer creation, Trellis-layer creation from a completed selection, deletion, activation, rename-on-commit, visibility, reorder, and clearing are reducer actions. `layers` plus `activeLayerId` form the document undo snapshot.

New layers are inserted directly above the active layer and activated. Hiding the active layer activates the nearest visible neighbor. If no layer is visible, editing is disabled until a layer is shown or added. Clicking a hidden row shows and activates it. Deleting the last layer creates a new empty `DrawingLayer` named `Layer 1`.

Switching layers clears transient in-progress interaction such as the current line, drag flags, fill previews, and deletion mode. Stored selection and mirror origins remain on their owning `DrawingLayer`.

Drawing tools operate only on a visible active `DrawingLayer`. A `TrellisLayer` exposes Trellis controls instead of line, fill, selection, clipboard, or mirror editing controls. Code should branch on the layer subclass, normally with `instanceof DrawingLayer` or `instanceof TrellisLayer`, rather than checking for an optional property.

## Rendering

`src/drawing.jsx:ArtworkLayers` emits visible layers in bottom-to-top order:

- a `DrawingLayer` renders its polygons and permanent lines;
- a `TrellisLayer` renders its finite visible tile groups through the `Trellis` component, which now also lives in `drawing.jsx`.

Each layer is wrapped in the shared canvas transform. Active interaction and selection overlays render after the complete artwork stack. The dot grid is global and can render before or after the stack through `dotsAboveArtwork`.

`src/menus/LayersPanel.jsx` owns the full-height layer list. Previews must dispatch by subclass: drawing previews fit their stored geometry, while Trellis previews show transformed tile zero rather than the infinite lattice. Reordering uses the dnd-kit React sortable API and dispatches once on drop.

## Persistence and export

Document schema 3 serializes every concrete layer and revives all nested geometry classes. Hidden layers are retained in preserved state, local/cloud saves, and editable SVG metadata. Visual SVG/PNG/JPEG/image-copy output omits hidden layers and finitely expands each visible `TrellisLayer` over the requested export rectangle.

Legacy schema-1 flat geometry migrates into a `DrawingLayer`. Legacy hybrid layers with an embedded Trellis are migration input only; current documents should serialize separate `DrawingLayer` and `TrellisLayer` instances.

## Legacy migration boundary

References to `layer.trellis`, `state.trellisDraft`, the old Apply/Edit/Replace/Release lifecycle, or a distinct Repeat menu describe the previous architecture. Runtime code must not use those shapes; `utils/files.jsx` recognizes them only long enough to migrate older documents into concrete layers.
