# Selection

Selection belongs only to a `DrawingLayer`. Its durable fields are `bounds`, `genericSelectors`, and `specificSelectors`; `src/utils/lines.js:getSelected` and `src/classes/Line.jsx:isSelected` are the authoritative selection logic. A `TrellisLayer` has no selection state.

## Bounds

Two bound points define a rectangular area. With `partials` enabled, a line is selected when at least one endpoint is inside; otherwise both endpoints must be inside. While the second bound is being dragged, `cursorPos` supplies the temporary corner.

## Generic selectors

A generic selector is a point that selects every line having an endpoint or intersection at that location. Multiple coincident lines may therefore be selected together.

## Specific selectors

Specific selectors select a line only when both of that line's endpoints are present in the selector collection.

Area, generic, and specific selection can contribute simultaneously. Selection can be copied relative to its center or top-left, and a completed non-zero selection is the source used by `TrellisLayer.fromSelection` when creating a Trellis layer.
