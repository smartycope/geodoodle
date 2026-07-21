# Terms

- **Layer** — one independently named, visible document item. `Layer` is the abstract base class; every stored layer is concretely a `DrawingLayer` or `TrellisLayer`.
- **Drawing layer** — a layer containing ordinary lines, filled polygons, selections, and mirror origins. It cannot contain a Trellis.
- **Trellis layer** — a layer containing one captured source pattern and the controls that repeat it across the paper. It cannot contain ordinary drawing/selection state.
- **Trellis** — the repeated pattern represented by a `TrellisLayer`; it is no longer a separate object attached to another layer.
- **Paper** — the main interactive drawing surface and its React composition root. It contains the dot grid, artwork stack, and interaction overlays.
- **Metalines** — lines shown as UI guidance rather than user artwork, such as mirror guides.
- **Bounds** — user-specified points defining a rectangular selection area on a `DrawingLayer`.
- **Cursor** — the snapped graph intersection shown by the app, not the physical mouse location.
- **Current line / `curLinePos`** — the start point of a half-drawn line; `null` when no line is in progress.
- **Permanent lines** — ordinary lines stored on a `DrawingLayer`, excluding metalines and source lines inside a `TrellisLayer`. Active drawing code sees them through the projected `state.lines` field.

## UI terms

- **Menu** — a feature control associated with the main toolbar, usually displayed as an anchored popover.
- **Page** — a full-screen modal UI, such as Files or Settings.
- **Trellis control menu** — one of the Offset, Skip, Flip, or Rotate menus shown when a `TrellisLayer` is active. The former umbrella Repeat menu is being removed.
