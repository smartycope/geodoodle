# Relevant files

The paths below are relative to `src/`.

## Application and state flow

- [Paper.jsx](../src/Paper.jsx) — interactive composition root, reducer owner, native wheel/touch listener setup, state restoration, and SVG layer order.
- [events.jsx](../src/events.jsx) — mouse, keyboard, wheel, and touch gesture translation.
- [reducer.jsx](../src/reducer.jsx) — dispatch normalization, undo snapshots, active-layer projection, action execution, and persistence triggers.
- [actions.jsx](../src/actions.jsx) — reducer action implementations, including layer creation and document editing.
- [states.jsx](../src/states.jsx) — canonical global state shape and initial `DrawingLayer`.
- [options.jsx](../src/options.jsx) — defaults, keybindings, and undo/persistence allowlists.
- [Contexts.jsx](../src/Contexts.jsx) — shared application and tour contexts.

## Durable classes

- [classes/Layer.js](../src/classes/Layer.js) — abstract layer identity and polymorphic contracts.
- [classes/DrawingLayer.js](../src/classes/DrawingLayer.js) — lines, polygons, selection, and mirror origins.
- [classes/TrellisLayer.js](../src/classes/TrellisLayer.js) — repeated source geometry, controls, tile generation, materialization, and JSON revival.
- [classes/Pair.js](../src/classes/Pair.js), [Point.js](../src/classes/Point.js), and [Dist.js](../src/classes/Dist.js) — immutable coordinate and vector math.
- [classes/Line.jsx](../src/classes/Line.jsx), [Rect.jsx](../src/classes/Rect.jsx), and [Poly.jsx](../src/classes/Poly.jsx) — drawable and selection geometry.

## Rendering and UI

- [drawing.jsx](../src/drawing.jsx) — grid, artwork layers, the Trellis renderer, cursor, previews, selection overlays, menus, toast, and debug SVG.
- [menus/](../src/menus/) — feature-specific menus and full pages. Trellis controls are `OffsetMenu`, `SkipMenu`, `FlipMenu`, and `RotateMenu`.
- [menus/LayersPanel.jsx](../src/menus/LayersPanel.jsx) — layer creation, activation, visibility, naming, previews, deletion, and reordering.
- [menus/Toolbar.jsx](../src/menus/Toolbar.jsx) — responsive tool availability based on the active layer subclass.
- [components/](../src/components/) — reusable UI primitives shared across menus.
- [components/ToolButton.jsx](../src/components/ToolButton.jsx) — toolbar icon/tooltip mapping and menu dispatch.
- [components/MiniMenu.jsx](../src/components/MiniMenu.jsx) and [Page.jsx](../src/components/Page.jsx) — anchored popover and full-dialog primitives.
- [components/Number.jsx](../src/components/Number.jsx) — shared number control.
- [components/TrellisSubMenu.jsx](../src/components/TrellisSubMenu.jsx) — shared layout for direct Trellis control menus and immutable active-layer updates.
- [components/tour.jsx](../src/components/tour.jsx) — guided-tour content.

## Utilities

- [utils/layers.js](../src/utils/layers.js) — active-layer lookup/projection, immutable replacement, subclass checks, and JSON revival.
- [utils/trellis.js](../src/utils/trellis.js) — finite lattice generation and affine/cadence math.
- [utils/lines.js](../src/utils/lines.js) — selection, clipboard expansion, normalization, splitting, and line bounds.
- [utils/transform.js](../src/utils/transform.js) — shared canvas transforms, viewport matrices, and line culling.
- [utils/files.jsx](../src/utils/files.jsx) — all local/cloud storage, serialization, import, and export.
- [utils/canvasButton.jsx](../src/utils/canvasButton.jsx) — geometry and hit testing for canvas `foreignObject` controls.
- [utils/backgroundImage.js](../src/utils/backgroundImage.js), [color.js](../src/utils/color.js), [math.js](../src/utils/math.js), [menus.js](../src/utils/menus.js), [misc.jsx](../src/utils/misc.jsx), [share.js](../src/utils/share.js), and [shortcuts.js](../src/utils/shortcuts.js) — focused helpers.

## Styling and tests

- [styling/theme.js](../src/styling/theme.js) — generated MUI theme and fixed canvas presentation constants.
- [styling/](../src/styling/) — global and component CSS.
- [tests/DocumentModels.test.jsx](../src/tests/DocumentModels.test.jsx), [LayerRendering.test.jsx](../src/tests/LayerRendering.test.jsx), [LayersPanel.test.jsx](../src/tests/LayersPanel.test.jsx), and [Trellis.test.jsx](../src/tests/Trellis.test.jsx) — closest coverage for the layer/Trellis refactor. Some fixtures still encode the old hybrid model and must be migrated with the implementation.
