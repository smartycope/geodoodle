# GeoDoodle agent guide

## What this project is

GeoDoodle is a React 18/Vite single-page drawing app that recreates drawing on graph paper. Users create SVG lines between grid intersections, then can select, mirror, copy, fill, save, export, and repeat a selected pattern as a trellis. The deployed base path is `/geodoodle/`.

The UI is deliberately stateful and geometry-heavy. Most behavior follows this path:

```text
browser input → src/events.jsx → dispatch → src/reducer.jsx → src/actions.jsx
                                      ↓
                           React state in src/Paper.jsx
                                      ↓
                  SVG layers in src/drawing.jsx and src/Trellis.jsx
```

## Start here

- `README.md` — product intent and npm commands.
- `dev_docs/terms.md` — project vocabulary: Paper, trellis, metalines, bounds, cursor, current line, and permanent lines.
- `dev_docs/coodinate_systems.md` — the coordinate-system glossary (the filename is intentionally misspelled).
- `dev_docs/selection.md`, `filling_in.md`, and `files.md` — focused descriptions of selection, polygon filling, and storage.
- `src/Paper.jsx` — the composition root for the interactive app; read its SVG child order before moving a rendering layer.

## Architecture and ownership

### App and state flow

- `src/index.jsx` mounts `<App />` in `StrictMode`.
- `src/App.jsx` disables the browser context menu, initializes local storage, and hosts the guided tour outside `Paper` to avoid a tour/state render loop.
- `src/Paper.jsx` creates state with `getInitialState()`, keeps the `useReducer` dispatch, installs non-passive wheel/touch listeners, loads preserved state, provides `StateContext`, and defines the SVG layer order.
- `src/Contexts.jsx` exports `StateContext` (`{ state, dispatch }`) and the tour context.
- `src/states.jsx` is the canonical state shape and default values. New state fields belong here first.
- `src/reducer.jsx` accepts a string action, `{ action, ...args }`, or a plain partial state object. It handles undo snapshots, invokes `actions[action]`, merges the returned partial state, and persists designated changes.
- `src/actions.jsx` contains reducer-only action functions. An action receives `(state, data)` and normally returns a partial state object. The actual file is `actions.jsx` (not `actions.jsc`).
- `src/options.jsx` contains defaults, keybindings, and the registration lists that control undo and persistence.
- `src/globals.js` contains constants, mirror enums, storage keys, viewport helpers, undo/redo stacks, and debug flags.

### Input and drawing

- `src/events.jsx` translates mouse, wheel, keyboard, and touch gestures into actions. Touch handling uses module-level gesture/timer variables because `Paper` must attach non-passive native listeners.
- Desktop mouse gestures also keep transient module-level state for button-down and drag arbitration. Right-drag creates a bounded deletion area, while middle-drag identifies one exact line by its two endpoints; both become drags only after the aligned/snapped `cursorPos` changes, not after arbitrary pixel movement. Reset this transient state in `onBlur` and test cleanup paths.
- The desktop `add_bound` shortcut has a press/release lifecycle: keydown places the first bound and keyup places the second only if the snapped cursor moved. `activeBoundShortcutPresses` suppresses key-repeat and prevents a modifier change such as `b` becoming `shift+b` from clearing the in-progress area. Other shortcuts retain normal repeat behavior.
- `src/transformUtils.js` owns shared canvas rotation math and the canonical SVG transform strings used by drawing layers. Canvas-space rendering should reuse these helpers rather than assembling transforms independently.
- `src/transformUtils.js:createViewportLineCuller` owns permanent-line visibility math. It precomputes the canvas-to-viewport affine transform once, then clips line segments against the viewport without allocating transformed `Point`s per line. Keep crossing-line, rotation, translation, and stroke/glow padding coverage when changing it.
- `src/drawing.jsx` renders all Paper-owned visual pieces: grid dots, lines, in-progress lines, fills, selection/bounds/selectors, cursor, clipboard preview, mirror guides, menus, toast, and debugging overlays.
- `src/Trellis.jsx` separately renders the repeated background pattern. It derives the seed from the current selection and emits transformed groups until the viewport is covered. Repeat controls use row/column `{ every, val }` structures.
- `src/Menus/Toolbar.jsx` lays out the responsive toolbar; `ToolButton.jsx` maps button names to icons and toggles menus. `MiniMenu.jsx` is the anchored popover primitive and `Page.jsx` is the full dialog primitive. `Number.jsx` is the shared Base UI number control, including optional joined reset buttons, and `ShortcutHint.jsx` derives menu hints from the active editable keybindings.

`Paper`'s SVG child order is intentional: definitions/grid/trellis/fills/debug/cursor/permanent and preview lines/selection overlays/clipboard. Preserve that order unless the requested visual stacking change is explicit.

## Geometry model: do not bypass it

All geometry classes live in `src/helper/` and are used throughout state, actions, rendering, persistence, and tests.

| File | Use it for |
| --- | --- |
| `Pair.js` | Base immutable two-value operations: comparison with floating-point tolerance, arithmetic, rounding, clipping, JSON, and collection membership. |
| `Point.js` | Coordinates. Internally stores deflated SVG values; create/display values through `fromViewport`, `fromSvg`, `asViewport`, and `asSvg`. Also handles grid/intersection snapping, rotation, flipping, and mirroring. |
| `Dist.js` | A scaled distance/translation rather than a location; use `fromInflated`/`fromDeflated` and conversion methods. |
| `Line.jsx` | Line aesthetics, SVG rendering, selection logic, transforms, hashing/deduplication, and Turf intersection/splitting helpers. |
| `Rect.jsx` | Selection/extents from Points; conversion, corners/center, growth, and containment. |
| `Poly.jsx` | Filled polygon rendering, serialization, GeoJSON conversion, containment, and selection. |

Coordinate terminology:

- **Viewport**: browser-window coordinates, origin at top-left.
- **SVG**: coordinates relative to the SVG origin.
- **Deflated**: one unit per grid step; this is the durable geometry representation.
- **Inflated**: pixel-scaled values using `scalex`/`scaley`.

Do not hand-roll transformations or silently mix coordinate systems. Prefer `Point`/`Dist` conversions and helper methods. `Point`, `Dist`, `Line`, `Pair`, and `Rect` operations return new values; do not depend on mutation. Use `Point.xy()` rather than `_x`/`_y` except when the coordinate system is already intentionally irrelevant (as in some geometry internals).

### Canvas transforms and screen space

- The durable drawing remains in deflated, unrotated canvas coordinates. Translation, scale, and rotation are view transforms; rotating the canvas must not rewrite line, polygon, bound, selector, clipboard, or trellis geometry.
- Canvas rotation is around the center of the visual viewport. `Point.fromViewport` and `Point.asViewport` apply the inverse and forward view transforms, respectively, and should round-trip even with translation, non-uniform scale, and rotation.
- A `Dist` is a vector, not a position. Use `Dist.fromInflated` when converting a screen-space drag/scroll delta into canvas space and `Dist.asViewport` when checking where a canvas-space movement points on screen. Rotation of a vector is around `(0, 0)`, not the viewport center.
- Canvas-space SVG geometry belongs in a `<g transform={getCanvasTransform(state)}>`. Viewport-space overlays such as cursor shapes, bounds, selector markers, mirror icons, and canvas-option buttons remain upright and position themselves with `Point.asViewport(state)`. The dot grid uses `getCanvasRotationTransform` on its pattern.
- `drawing.jsx:Lines` intentionally omits off-screen permanent lines from the SVG DOM before doing selection/glow work. Code that needs the complete artwork, such as FilePage's **Fit artwork**, must derive it from `state.lines` rather than measuring `#lines` in the DOM.
- `Rect.asViewport` returns the axis-aligned viewport bounding box of all four transformed corners. This is appropriate for hit regions, button placement, and viewport containment; render a genuinely rotated rectangle as canvas-space geometry inside the shared transform group.
- Rotation changes the visible logical viewport from a two-corner rectangle to a four-corner polygon. Algorithms that need a conservative canvas-space coverage area, notably `Trellis.jsx`, must inverse-transform all four viewport corners before taking their bounds.
- Scale and rotation actions compensate translation to keep their chosen logical focal point at the same screen position. For simultaneous two-finger movement, scale, and rotation, use the atomic `gesture_transform` action; separate queued dispatches use different intermediate states and cause the drawing to drift away from the fingers.

## Important domain behavior

- A line is started/finished through `add_line`; `curLinePos` is the start of an in-progress line and `cursorPos` is the snapped grid cursor, not the physical mouse coordinate.
- Selection combines an area defined by `bounds`, generic selectors (endpoints or intersections), and specific selectors (both endpoints). `src/utils.jsx:getSelected` and `src/helper/Line.jsx:isSelected` are the authoritative logic.
- `select_all` selects existing line geometry by setting two bounds to the top-left and bottom-right of `getLinesRect(state.lines)`; it returns no bounds for an empty drawing and exits deletion mode. Its default shortcut is `ctrl+a` through the editable keybinding framework.
- `deletingSelection` is a transient mode for an incomplete bounded selection. Completing its second bound runs `delete_selected` against a temporary state with selectors cleared, then removes the bounds; selector-only matches outside the rectangle must remain selected normally and must not turn red or be deleted. Holding Shift temporarily inverts an ordinary in-progress bound into deletion mode, while Shift temporarily inverts a right-button deletion drag into a regular selection. Rendering uses the red `themeDefaults.deletingSelection` palette for the bounded area and its basic/fancy glow.
- A desktop middle click runs `delete_at_cursor`; a middle drag runs `delete_specific_line` and matches both endpoints in either order. A right click retains `continue_line`, while a right drag completes the bounded deletion flow. Preserve click behavior when physical movement stays within the same aligned cursor position.
- Mirroring is controlled by axis/rotation and can be centered on the page or cursor; saved mirror origins apply additional transformed copies. `Point.mirror(state)` is the shared expansion path: it applies the active page/cursor transform and then each saved origin. Drawing, `delete_at_cursor`, cursor helpers, and clipboard generation should reuse it so all mirrored copies stay consistent. `Point.mirror*`, `Line.mirror*`, `drawing.jsx:MirrorMetaLines`, and `Menus/MirrorMenu.jsx` move together.
- On desktop, the Mirror menu shows a real **Add origin** control for Page mirroring (and on mobile), but shows the keyboard instruction for Cursor mirroring. The Type and Origins groups share a responsive row, so visibility/label changes must be checked for overlap.
- Entering fill mode normalizes and splits line segments, runs Turf polygonization, and previews polygons under the *physical* mouse position. The action is `toggle_fill_mode`; `getPreviewPolys` and `Poly.contains` determine previews.
- Clipboard lines are copied relative to a selection origin and transformed/mirrored at the cursor. `getAllClipboardLines(state)` is shared by paste and preview: position at `cursorPos`, apply the clipboard flip/rotation, then expand through `Point.mirror(state)`, including saved origins. See `actions.jsx` (`copy`, `cut`, `paste`) and `utils.jsx:getAllClipboardLines`.
- `rotateClipboardOnScroll` is a persisted desktop behavior setting and defaults to `true`. With an active clipboard, unmodified scrolling rotates it in 90-degree steps when enabled and otherwise follows normal canvas translation; Ctrl/Command and Shift wheel modifiers keep their canvas scale/rotate/translate meanings.
- Trellis/repeat requires a completed selection (`bounds.length > 1`). `Trellis.jsx` is the rendering algorithm; `Menus/RepeatMenu.jsx` owns its controls.
- Clipboard transformation and selection-option controls drawn over the canvas are visual `foreignObject` buttons whose presses are manually hit-tested in `canvasButtonUtils.jsx` and consumed in `events.jsx`. Keep their rendering geometry and mouse/touch hit geometry in sync, and do not let a consumed press also move the cursor or clipboard.
- Keyboard shortcuts are editable state. `keybindable` is the action catalog and source of each default binding; `defaultKeybindings` is derived from it, while runtime matching reads `state.keybindings`. The shortcut token `ctrl` intentionally accepts either Control or macOS Command. Buttons in Select, Clipboard, and Delete menus use `ShortcutHint` so displayed hints reflect customized bindings; parameterized action objects must be matched structurally, not only by action name.
- Fixed canvas presentation constants live in `themeDefaults` in `src/styling/theme.js`; user-controlled behavior and drawing choices live in `options.jsx`/state. Components should read generated-theme values so light/dark and paper-color contrast logic remain centralized.

## Where to make a change

| Change | Primary locations |
| --- | --- |
| Mouse, keyboard, wheel, touch, pinch, double-tap, or long-press behavior | `src/events.jsx`; resulting state behavior in `src/actions.jsx` |
| Add or change a reducer action | `src/actions.jsx`, then check `reversibleActions` and `saveSettingActions` in `src/options.jsx` |
| Add state | `src/states.jsx`; then decide whether it belongs in `reversible`, `preservable`, or `saveable` in `src/options.jsx` |
| SVG layer, cursor, selection, fill, clipboard, or debug rendering | `src/drawing.jsx`; layer placement in `src/Paper.jsx` |
| Repeated-pattern algorithm | `src/Trellis.jsx`; controls in `src/Menus/RepeatMenu.jsx`; defaults in `src/utils.jsx:defaultTrellisControl` |
| Coordinate math, view transforms, line intersections, or selection semantics | `src/helper/`, `src/transformUtils.js`, and shared helpers in `src/utils.jsx` |
| Save/load/export/upload/image copy | `src/fileUtils.jsx`, actions in `src/actions.jsx`, UI in `src/Menus/FilePage.jsx` |
| Local persistence schema | `src/fileUtils.jsx` and `preservable`/`saveable` in `src/options.jsx`; do not access `localStorage` elsewhere |
| Toolbar sizing/placement or tool icons | `src/Menus/Toolbar.jsx`, `ToolButton.jsx`, `ExtraMenu.jsx`, `ExtraButton.jsx`, `src/utils.jsx:extraSlots` |
| Menu layout | `MiniMenu.jsx` for popovers, `Page.jsx` for dialogs, and the corresponding feature menu |
| Number-control behavior or reset affordances | `src/Menus/Number.jsx` and `src/styling/number-field.module.css`; feature-specific reset targets stay in the owning menu |
| Keyboard shortcut catalog, editor, matching, or visible hints | `src/options.jsx`, `src/utils.jsx`, `src/Menus/KeybindingsPage.jsx`, and `src/Menus/ShortcutHint.jsx` |
| Theme, colors, or global styles | `src/styling/theme.js`, `src/styling/App.css`, `src/styling/index.css`, `src/styling/number-field.module.css` |
| Guided tour | `src/Menus/tour.jsx`, `src/App.jsx`, and `tourState` in `src/states.jsx` |

Feature menus are intentionally small, focused components:

- `ColorMenu.jsx` — palette, stroke width/dash, fill-mode toggle.
- `SelectMenu.jsx` and `DeleteMenu.jsx` — bounds/selectors and destructive selection commands.
- `ClipboardMenu.jsx` — copy/cut/paste actions.
- `MirrorMenu.jsx` — mirror type, axis, rotation, and stored origins.
- `NavMenu.jsx` — translation, scale, rotation, home, and go-to-selection.
- `FilePage.jsx` — SVG/image import/export, local saves, cloud-save UI, and image copy.
- `SettingsPage.jsx` — user-configurable state and reset-preserved-state UI.
- `HelpPage.jsx` and `tour.jsx` — user education; `KeyMenu.jsx` is currently unused.

## Storage and serialization

Keep all storage and file I/O inside `src/fileUtils.jsx`.

- Preserved application settings/state use JSON in `localStorageSettingsName` (`GeoDoodleState`).
- Named local patterns use SVG strings in `localStorageName` (`GeoDoodleSaves`).
- SVG exports embed saveable metadata as a comment and serialize lines as SVG elements; `deserializePattern` reconstructs custom classes.
- `serializeState`/`deserializeState` handle long-lived state and version checks. Update serializers or the appropriate allowlists whenever a persisted custom class or field changes.

## Validation and tests

Use the smallest relevant command first:

```bash
npm test                         # Vitest watch mode
npx vitest run src/tests/Paper.test.jsx
npx vitest run src/tests/Actions.test.jsx
npm run lint
npm run build
```

- `src/tests/HelperClasses.test.jsx` covers Pair, Point, Dist, Line, and Rect behavior.
- `src/tests/Actions.test.jsx` covers transformations, selection/deletion, line creation, clipboard, persistence/files, menus, tour, and fills.
- `src/tests/Events.test.jsx` calls the input handlers directly and is the best place for touch lifecycle, combined gesture, wheel-modifier, and manually consumed canvas-button regressions. Its cleanup is important because touch state is module-level.
- `src/tests/Drawing.test.jsx` covers isolated SVG/UI layers whose geometry or visibility depends on state.
- `src/tests/Paper.test.jsx` exercises rendered mouse/keyboard/wheel interactions.
- `src/tests/Fill.test.jsx` covers polygon previews/fills, intersections, mirroring, and repeating.
- `src/tests/KeybindingsPage.test.jsx` and `MenuShortcuts.test.jsx` cover editable shortcuts and live menu hints; `SettingsPage.test.jsx` covers persisted setting controls.
- Focused menu layout/dispatch regressions live beside the feature as `MirrorMenu.test.jsx`, `NavMenu.test.jsx`, `RepeatMenu.test.jsx`, and similar menu test files.
- `src/tests/misc.test.jsx` guards that the `options.jsx` action/state registration lists stay valid.
- `src/tests/testUtils.jsx` is the shared Paper renderer and input/SVG-query helper set; prefer extending it instead of duplicating event boilerplate.

Vitest is configured for `jsdom` in `vite.config.js`. Storybook stories live in `src/stories/` and are useful for isolated toolbar, tool-button, number-control, and repeat-menu visual work.

## Practical change checklist

1. Read the relevant developer doc and the owning component/action before editing.
2. Keep geometry in deflated SVG coordinates and convert at the DOM boundary.
3. Dispatch actions for behavior changes; do not mutate state or geometry instances in place.
4. If an action/state field affects undo, persistence, or exported patterns, update the matching lists in `src/options.jsx` and tests.
5. When changing a view transform, audit permanent/preview lines, fills, dots, trellis, clipboard, selection overlays, mirror guides, cursor mapping, hit testing, viewport containment, and image/save semantics together.
6. Keep storage access in `fileUtils.jsx` and preserve the intentional SVG layer order in `Paper.jsx`.
7. Add or update the closest test, then run that test file. Run lint/build when the scope warrants it.
