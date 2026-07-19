# Layers

GeoDoodle stores editable artwork in an ordered `state.layers` array. Array order is bottom-to-top; the Layers panel reverses it so the topmost layer is listed first. `state.activeLayerId` identifies the only layer ordinary editing actions may change.

## Model

`src/helper/Layer.js` owns the durable layer shape:

- identity: `id`, editable `name`, and `visible`;
- ordinary geometry: `lines` and `filledPolys`;
- selection state: `bounds`, `specificSelectors`, and `genericSelectors`;
- saved `mirrorOrigins`;
- one `Trellis` or `null`.

Layer methods return new instances. Actions replace the affected Layer in the array; they do not mutate a Layer or its collections in place.

`src/layerUtils.js:getLayerState` projects the active layer onto the legacy geometry names (`state.lines`, `state.bounds`, and so on). That projection lets geometry and input code operate on one layer without duplicating every algorithm. `normalizeLayerActionResult` moves any layer-owned fields returned by an action back into the canonical Layer before the reducer commits state.

## Actions and interaction

Layer creation, deletion, activation, rename-on-commit, visibility, reorder, clearing, and Trellis Apply/Replace/Release are reducer actions. `layers` plus `activeLayerId` form the document undo snapshot.

New layers are inserted directly above the active layer and activated. Hiding the active layer activates the nearest visible neighbor. If no layer is visible, content actions are rejected until a layer is shown or added. Clicking a hidden row shows and activates it. Deleting the last layer creates a new empty `Layer 1`.

Switching layers clears global in-progress interaction state, including the current line, drag flags, fill previews, and Trellis draft. Stored selections and mirror origins remain on their owning layers.

## Rendering

`drawing.jsx:ArtworkLayers` emits visible layers in bottom-to-top order. Each layer is one canvas-transformed composite containing:

1. its applied Trellis or active Trellis draft;
2. filled polygons;
3. ordinary lines.

Active selection and gesture overlays render after the entire artwork stack. The dot grid is global and can render before or after the complete stack through `dotsAboveArtwork`.

`Menus/LayersPanel.jsx` is a full-height overlay opposite a right-side toolbar. Previews never render the infinite lattice: Trellis layers show transformed tile zero, and ordinary layers fit their lines and fills. Reordering uses the dnd-kit React sortable API and dispatches once on drop.

## Persistence and export

Document schema 2 serializes every Layer and revives all geometry classes. Hidden layers are retained in preserved state, local/cloud saves, and editable SVG metadata. Visual SVG/PNG/JPEG/image-copy output omits hidden layers and expands each visible Trellis only over the requested export rectangle.
