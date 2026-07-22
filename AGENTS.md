# GeoDoodle agent guide

## What this project is

GeoDoodle is a React 18/Vite single-page drawing app that recreates drawing on graph paper. Users create SVG lines between grid intersections, then select, mirror, copy, fill, save, export, and repeat a selected pattern through a Trellis layer. The deployed base path is `/geodoodle/`.

Most behavior follows this path:

```text
browser input → src/events.jsx → dispatch → src/reducer.jsx → src/actions.jsx
                                      ↓
                           React state in src/Paper.jsx
                                      ↓
                         SVG in src/drawing.jsx
```

## Start here

- `README.md` — product intent and npm commands.
- `dev_docs/terms.md` — project vocabulary.
- `dev_docs/layers.md` and `dev_docs/trellis.md` — the polymorphic document model and the in-progress Trellis-layer conversion.
- `dev_docs/coodinate_systems.md` — coordinate glossary (the filename is intentionally misspelled).
- `dev_docs/selection.md`, `filling_in.md`, and `files.md` — selection, polygon filling, and storage.
- `dev_docs/relevant_files.md` — current directory/ownership map.
- `src/Paper.jsx` — interactive composition root; read its SVG child order before moving a rendering layer.

## Architecture and ownership

### App and state flow

- `src/index.jsx` mounts `<App />` in `StrictMode`.
- `src/App.jsx` disables the browser context menu, initializes local storage, and hosts the guided tour outside `Paper` to avoid a tour/state render loop.
- `src/Paper.jsx` creates state with `getInitialState()`, owns `useReducer`, installs non-passive wheel/touch listeners, loads preserved/shared state, provides `StateContext`, and defines SVG layer order.
- `src/Contexts.jsx` exports `StateContext` (`{ state, dispatch }`), the transient measured toolbar-priority context, and the tour context.
- `src/states.jsx` is the canonical global state shape. Durable artwork belongs in `state.layers`; temporary pointer/menu state remains global.
- `src/classes/Layer.js` is an abstract base that owns only `id`, `name`, and `visible` plus polymorphic contracts.
- `src/classes/DrawingLayer.js` owns ordinary lines, polygons, bounds, selectors, and mirror origins.
- `src/classes/TrellisLayer.js` owns repeated source geometry and overlap/skip/flip/rotate controls. It is the Trellis; it is not stored on another layer.
- `state.layers` is ordered bottom-to-top and `activeLayerId` identifies the active item.
- `src/utils/layers.js` owns active-layer lookup/projection, immutable replacement, subclass detection, and JSON revival. Keep its projection and result normalization type-aware.
- `src/reducer.jsx` accepts a string action, `{ action, ...args }`, or a plain partial state object. It handles undo snapshots, invokes `actions[action]`, normalizes layer results, merges state, and triggers persistence.
- `src/actions.jsx` contains reducer-only action functions. An action receives `(state, data)` and normally returns a partial state object.
- `src/options.jsx` contains defaults, toolbar button priority/configuration, editable keybindings, and undo/persistence registration lists.
- `src/globals.js` contains enums, storage keys, viewport helpers, undo/redo stacks, and debug flags.

### Layer invariants

- Every durable layer must be either `DrawingLayer` or `TrellisLayer`; do not instantiate the abstract base directly.
- A `DrawingLayer` cannot contain a Trellis or Trellis controls.
- A `TrellisLayer` cannot contain drawing selection, mirror origins, or unrelated permanent geometry.
- Branch on the concrete subclass, not the presence of `layer.trellis`.
- Layer methods return new instances. Replace the affected layer in `state.layers`; never mutate it in place.
- `Layer.toJSON()` writes a `type` discriminator. `src/utils/layers.js:layerFromJSON` must revive the correct subclass and each nested geometry class.
- `getLayerState` is a compatibility boundary for algorithms that consume familiar fields such as `state.lines`; it is not a second durable document shape.

### Trellis layer workflow

The concrete layer architecture has no optional Trellis on a drawing layer, no separate durable Trellis object, no `trellisDraft`, and no umbrella Repeat menu or Apply/Edit/Replace/Release lifecycle. Those names may occur only in schema migration code for older saved documents.

The intended flow is:

1. A completed non-zero selection on a `DrawingLayer` dispatches `add_trellis_layer`.
2. `TrellisLayer.fromSelection` captures relative source geometry and inserts a new Trellis layer above the source layer.
3. Activating a Trellis layer makes the toolbar show direct Offset, Skip, Flip, and Rotate controls.
4. Those controls immutably update the active `TrellisLayer`; Reset calls its `reset()` method.
5. Activating a Drawing layer restores the ordinary drawing tools.

Tests and serializers must construct the concrete subclass they exercise; import `DrawingLayer` from `classes/DrawingLayer`.

### Input and drawing

- `src/events.jsx` translates mouse, wheel, keyboard, and touch gestures into actions. Touch handling uses module-level gesture/timer variables because `Paper` attaches non-passive native listeners.
- Desktop gestures also keep module-level state for button-down and drag arbitration. Right-drag creates a bounded deletion area; middle-drag identifies one exact line. Both become drags only after snapped `cursorPos` changes. Reset transient state in `onBlur` and test cleanup paths.
- The desktop `add_bound` shortcut has a press/release lifecycle: keydown places the first bound and keyup places the second only if the snapped cursor moved. `activeBoundShortcutPresses` suppresses repeat and modifier-change cancellation.
- `src/drawing.jsx` owns all Paper SVG pieces: grid dots, visible artwork layers, the memoized `Trellis` renderer, in-progress geometry, fills, cursor, selection, clipboard, mirror guides, menus, toast, and debug overlays.
- `src/drawing.jsx:ArtworkLayers` renders visible layers bottom-to-top. It renders polygons/lines for `DrawingLayer` and finite repeated tiles for `TrellisLayer`, sharing Trellis safety budgets across visible Trellis layers.
- `src/menus/LayersPanel.jsx` owns creation, activation, rename, visibility, deletion, subclass-aware previews, and dnd-kit reordering. The panel lists topmost first.
- `src/menus/Toolbar.jsx` owns responsive layout and switches available tools by active layer subclass.
- Toolbar capacity is measured from its rendered buttons before paint; `src/utils/menus.js` chooses the fullest configured priority level that fits and supplies the complementary Extra-menu buttons.
- Feature-specific controls live in `src/menus/`; reusable UI primitives live in `src/components/`.
- `src/components/ToolButton.jsx` maps tool names to icons and menu actions. `MiniMenu.jsx`, `Page.jsx`, `Number.jsx`, `ShortcutHint.jsx`, and `TrellisSubMenu.jsx` are shared primitives.
- Trellis control menus are `src/menus/OffsetMenu.jsx`, `SkipMenu.jsx`, `FlipMenu.jsx`, and `RotateMenu.jsx`.

`Paper`'s SVG order is intentional: definitions/background, dots below (optional), complete artwork stack, dots above (optional), then active debug/cursor/preview/selection/clipboard overlays.

## Geometry model: do not bypass it

All durable classes live in `src/classes/`.

| File | Use it for |
| --- | --- |
| `Pair.js` | Immutable two-value operations, tolerance, arithmetic, rounding, clipping, JSON, and collection helpers. |
| `Point.js` | Locations, coordinate conversions, snapping, rotation, flipping, and mirroring. |
| `Dist.js` | Scaled vectors/translations rather than locations. |
| `Line.jsx` | Line aesthetics/rendering, selection, transforms, hashing/deduplication, and Turf intersection/splitting. |
| `Rect.jsx` | Bounds/extents, corners/center, growth, conversion, and containment. |
| `Poly.jsx` | Filled polygon rendering, serialization, containment, and selection. |
| `Layer.js` | Abstract layer identity/visibility contract. |
| `DrawingLayer.js` | Ordinary editable drawing content. |
| `TrellisLayer.js` | Durable repeated-pattern content and controls. |

Coordinate terminology:

- **Viewport**: browser-window coordinates, origin at top-left.
- **SVG**: coordinates relative to the SVG origin.
- **Deflated**: one unit per grid step; durable geometry representation.
- **Inflated**: pixel-scaled values using `scalex`/`scaley`.

Use `Point`/`Dist` conversions and shared helpers; do not hand-roll transforms or mix coordinate systems. These geometry operations return new values. Prefer `Point.xy()` over `_x`/`_y` unless coordinate-system identity is intentionally irrelevant inside low-level geometry code.

### Canvas transforms and screen space

- Durable geometry remains deflated and unrotated. Translation, scale, and rotation are view transforms and must not rewrite either layer subclass.
- Canvas rotation is around the visual viewport center. `Point.fromViewport` and `Point.asViewport` apply inverse/forward view transforms and should round-trip with translation, non-uniform scale, and rotation.
- `Dist` is a vector. Use `Dist.fromInflated` for screen-space deltas and `Dist.asViewport` to inspect a canvas-space movement on screen; rotate vectors around `(0, 0)`.
- `src/utils/transform.js` owns canvas rotation math, canonical SVG transform strings, viewport matrices, and permanent-line culling. Canvas-space geometry belongs under `getCanvasTransform(state)`.
- Viewport-space overlays such as cursor shapes, selector markers, mirror icons, and canvas-option buttons remain upright and position with `Point.asViewport(state)`.
- `drawing.jsx:Lines` culls off-screen permanent lines before selection/glow work. Complete-artwork operations must derive geometry from layers, not measure `#lines` in the DOM.
- `Rect.asViewport` returns the axis-aligned viewport box of all four transformed corners. Render genuinely rotated rectangles in canvas space.
- Trellis coverage must inverse-transform all four viewport corners before taking conservative bounds.
- Scale/rotation actions compensate translation around their focal point. Simultaneous two-finger move/scale/rotation uses atomic `gesture_transform`.

## Important domain behavior

- A line starts/finishes through `add_line`; `curLinePos` is its start and `cursorPos` is the snapped grid cursor.
- Selection exists only on `DrawingLayer` and combines bounds, generic selectors, and specific selectors. `src/utils/lines.js:getSelected` and `src/classes/Line.jsx:isSelected` are authoritative.
- `select_all` sets bounds to `getLinesRect(state.lines)` corners, yields empty bounds for no lines, and exits deletion mode. Default shortcut is `ctrl+a`.
- `deletingSelection` marks an incomplete bounded deletion. Completing it deletes only bounded matches and clears bounds; selector-only matches outside remain selected. Shift temporarily inverts ordinary selection/deletion gestures.
- Middle click runs `delete_at_cursor`; middle drag runs `delete_specific_line`. Right click retains `continue_line`; right drag completes bounded deletion. Preserve clicks when pixel movement stays within the same snapped point.
- Mirroring uses `Point.mirror(state)` as the shared expansion path for active page/cursor transforms and saved origins. Keep `Point`, `Line`, `drawing.jsx:MirrorMetaLines`, and `src/menus/MirrorMenu.jsx` aligned.
- Fill mode operates only on `DrawingLayer`: normalize/split lines, Turf-polygonize, and preview `Poly` instances under physical `mousePos`.
- `paint_selected` uses active line aesthetics in ordinary mode and the active fill color on bounded selected polygons in fill mode.
- Clipboard paste and preview share `src/utils/lines.js:getAllClipboardLines`: position at `cursorPos`, apply clipboard flip/rotation, then expand with `Point.mirror(state)`.
- `rotateClipboardOnScroll` defaults true. With a clipboard, unmodified wheel rotates in 90-degree steps when enabled; modifiers retain canvas transform meanings.
- Ordinary content actions must reject a hidden active layer and must not write drawing fields onto `TrellisLayer`.
- Canvas transformation/selection controls are SVG `foreignObject` buttons rendered in `drawing.jsx` and manually hit-tested through `src/utils/canvasButton.jsx`; rendering and hit geometry must stay synchronized.
- Keyboard shortcuts are editable. `keybindable` is the catalog/default source; runtime matching reads `state.keybindings`. `ctrl` accepts Control or macOS Command. `src/components/ShortcutHint.jsx` resolves live hints.
- Fixed presentation constants live in `themeDefaults` in `src/styling/theme.js`; user behavior/drawing choices live in `options.jsx` and state.

## Where to make a change

| Change | Primary locations |
| --- | --- |
| Mouse, keyboard, wheel, touch, pinch, double-tap, long-press | `src/events.jsx`; state behavior in `src/actions.jsx` |
| Reducer action | `src/actions.jsx`; registration in `src/options.jsx` |
| Global state | `src/states.jsx`; `reversible`/`preservable`/`saveable` decisions in `src/options.jsx` |
| Layer hierarchy or projection | `src/classes/Layer.js`, `DrawingLayer.js`, `TrellisLayer.js`, `src/utils/layers.js`, reducer/actions |
| Repeated-pattern math/model | `src/classes/TrellisLayer.js`, `src/utils/trellis.js`, renderer in `src/drawing.jsx` |
| Trellis controls | `src/menus/OffsetMenu.jsx`, `SkipMenu.jsx`, `FlipMenu.jsx`, `RotateMenu.jsx`, `src/components/TrellisSubMenu.jsx` |
| SVG rendering/stacking | `src/drawing.jsx`; placement in `src/Paper.jsx` |
| Coordinate math, transforms, selection | `src/classes/`, `src/utils/transform.js`, `src/utils/lines.js`, `src/utils/math.js` |
| Save/load/export/upload/image copy | `src/utils/files.jsx`; actions in `src/actions.jsx`; UI in `src/menus/FilePage.jsx` |
| Toolbar/icon placement | `src/menus/Toolbar.jsx`, `src/components/ToolButton.jsx`, `src/menus/ExtraMenu.jsx`, `ExtraButton.jsx` |
| Popover/dialog/number primitives | `src/components/MiniMenu.jsx`, `Page.jsx`, `Number.jsx`, and relevant feature menu |
| Keyboard catalog/editor/hints | `src/options.jsx`, `src/utils/shortcuts.js`, `src/menus/KeybindingsPage.jsx`, `src/components/ShortcutHint.jsx` |
| Theme/global styles | `src/styling/theme.js`, `App.css`, `index.css`, `number-field.module.css` |
| Guided tour | `src/components/tour.jsx`, `src/App.jsx`, `tourState` in `src/states.jsx` |

## Storage and serialization

Keep all storage and file I/O inside `src/utils/files.jsx`.

- Preserved state uses JSON in `GeoDoodleState`; named local patterns use SVG strings in `GeoDoodleSaves`.
- SVG exports embed editable metadata and render visible layers. Hidden layers remain in metadata.
- Document schema 3 stores polymorphic `layers` and `activeLayerId`; `type` selects `DrawingLayer` or `TrellisLayer` during revival. Schema-2 hybrid layers migrate into separate concrete layers.
- Legacy flat/hybrid documents are migration input. Normalize them to concrete subclasses; never serialize a new hybrid layer.
- Visual exports render visible `DrawingLayer` geometry and finitely expand visible `TrellisLayer` instances over the export rectangle.
- `backgroundImage` is transient and must not be persisted.

## Validation and tests

Use the smallest relevant command first:

```bash
npx vitest run src/tests/DocumentModels.test.jsx
npx vitest run src/tests/LayerRendering.test.jsx src/tests/LayersPanel.test.jsx
npx vitest run src/tests/Trellis.test.jsx
npm run lint
npm run build
```

- `HelperClasses.test.jsx` covers coordinate/drawing classes.
- `Actions.test.jsx` covers transformations, selection/deletion, creation, clipboard, persistence, menus, tour, and fills.
- `Events.test.jsx` is best for direct gesture handlers and module-level touch cleanup.
- `Drawing.test.jsx` covers isolated SVG/UI layers.
- `Paper.test.jsx` covers rendered mouse/keyboard/wheel interaction.
- `DocumentModels.test.jsx`, `LayerRendering.test.jsx`, `LayersPanel.test.jsx`, `Trellis.test.jsx`, and `TrellisMenus.test.jsx` are the primary concrete-layer suites.
- `FileUtils.test.jsx`, `LayerExport.test.jsx`, and `ImageExport.test.jsx` cover persistence and visual export.
- `misc.test.jsx` guards action/state registration lists.

Vitest uses `jsdom` through `vite.config.js`. Storybook stories live in `src/stories/`.

## Practical change checklist

1. Read the relevant developer doc and owning class/component/action.
2. Preserve the `DrawingLayer`/`TrellisLayer` exclusivity invariant.
3. Keep geometry deflated and convert only at DOM/input boundaries.
4. Dispatch actions and replace immutable class instances; do not mutate state.
5. Update undo/persistence/export registration and subclass revival when document fields change.
6. Audit drawing, preview, selection, cursor, hit testing, viewport coverage, and export together for view-transform changes.
7. Keep storage in `src/utils/files.jsx` and preserve `Paper`'s SVG order.
8. Update the nearest current-tree tests; do not restore deleted architecture to satisfy stale fixtures.
