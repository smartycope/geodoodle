# Trellis Rendering

The Trellis repeats the current selection so it appears to continue indefinitely, while only creating SVG groups for copies that contain something visible on screen. It supports row and column offsets, skips, flips, rotations, canvas translation and scaling, canvas rotation, filled polygons, and lines that protrude beyond the selection rectangle.

The main implementation is split across these files:

- `src/Trellis.jsx` gathers the pattern, subscribes to viewport changes, asks for visible tiles, and renders them.
- `src/trellisUtils.js` owns lattice math, affine tile transforms, finite candidate generation, visibility tests, and safety limits.
- `src/trellisSelectionUtils.js` makes the selection overlay follow the transformed source tile without changing stored geometry.
- `src/transformUtils.js` owns the shared canvas-to-viewport matrix and Cohen-Sutherland line/viewport intersection test.
- `src/Menus/RepeatMenu.jsx` owns the repeat controls.

## High-level model

A completed selection rectangle defines the size of one tile:

```text
tile width  = selection width
tile height = selection height
```

The selected lines and filled polygons are copied into coordinates relative to the selection's top-left corner. The selected pattern is then placed on an integer lattice:

```text
                 column -1   column 0   column 1

row -1              (-1,-1)    (-1,0)     (-1,1)
row  0               (0,-1)     (0,0)      (0,1)
row  1               (1,-1)     (1,0)      (1,1)
```

Tile `(0, 0)` is the source tile. It occupies the selection's original lattice position, but it is otherwise a normal Trellis tile. In particular, flip and rotation cadences that apply at index `0` transform the source tile too.

The algorithm has two broad phases:

```text
selection and repeat controls
             |
             v
build a finite row/column candidate range
             |
             v
visit candidates from the viewport center outward
             |
             v
skip cadence -> build tile matrix -> visibility checks
             |
             v
render only visible tile groups
```

This is deliberately not an "expand until an edge is off screen" algorithm. Such an expansion is difficult to make correct when lines extend outside the selection, offsets make the lattice diagonal, or the page is rotated. Instead, the implementation first calculates a conservative finite index range, then tests each candidate's real geometry.

## When the Trellis is active

The Trellis renders when either of these is true:

- The Repeat menu is open, which provides a live preview.
- `state.trellis` is true because the user applied the repeat.

A completed selection is also required (`bounds.length > 1`). Pressing **Apply** sets `state.trellis` and closes the Repeat menu. If another action removes the selection while the menu is open, the menu stops rendering its selection-dependent controls and closes through the normal menu action.

A selection with zero width or zero height cannot define a two-dimensional lattice. It produces no Trellis tiles and shows the warning `Select an area with both width and height to repeat`.

## The source tile owns the selected geometry

While repeating, the selected lines and polygons are rendered by the Trellis layer, including tile `(0, 0)`. The normal permanent-line and filled-polygon layers omit those selected objects. This prevents the transformed source tile from being overdrawn by a second, untransformed copy.

The stored lines, polygons, and bounds are never rewritten. The transformation is presentation-only:

- `trellisOwnsSource` determines whether the normal drawing layers should suppress selected objects.
- `createTrellisSourceTileDescriptor` creates the same `(0, 0)` matrix used by the Trellis.
- `getRenderedBounds` applies that matrix to the visible bound handles.
- `getRenderedBoundRect` transforms all four rectangle corners and returns their axis-aligned presentation bounds for the selection rectangle and option controls.

When repeating stops, the unchanged source geometry is rendered normally again.

## Row and column controls

Each repeat setting has the same state shape:

```js
{
  row: { every: 1, val: value },
  col: { every: 1, val: value },
}
```

Row controls depend only on the tile's row index. Column controls depend only on its column index. Index `0` is the phase anchor for both axes, so the pattern on negative indices is a continuation of the same cadence rather than a separately started sequence.

Invalid or fractional `every` values are normalized to a positive integer of at least `1`. Non-finite values fall back to safe defaults.

### Skip

For a control that keeps `every` tiles and then skips `skip` tiles, an index is retained when:

```text
positiveModulo(index, every + skip) < every
```

`positiveModulo` is Euclidean modulo, so it always returns a non-negative result. That makes the cadence consistent on both sides of zero.

For example, with `every = 2` and `skip = 1`:

```text
index:  -3  -2  -1   0   1   2   3
kept:   yes yes  no  yes yes  no  yes
```

Row and column skip checks are independent. A tile is considered only if both its row and its column are retained.

### Offset

The UI calls this setting **Offset**; its legacy state name is `trellisOverlap`. Each row or column offset can contain both an X and a Y displacement, so it can produce shifted or diagonal lattices.

The number of accumulated offset steps is:

```text
truncate(index / every)
```

Truncation is toward zero. This guarantees zero displacement at index `0`. For `every = 2`, the step values are:

```text
index:  -4  -3  -2  -1   0   1   2   3   4
steps:  -2  -1  -1   0   0   0   1   1   2
```

The translation of a tile is therefore:

```text
x = seed.x
  + column * tileWidth
  + rowOffsetSteps * rowOffset.x
  + columnOffsetSteps * columnOffset.x

y = seed.y
  + row * tileHeight
  + rowOffsetSteps * rowOffset.y
  + columnOffsetSteps * columnOffset.y
```

Here, `seed` is the top-left corner of the original selection.

### Flip and rotation cadence

A flip or rotation is active when:

```text
positiveModulo(index, every) === 0
```

Thus `every = 3` applies at `..., -6, -3, 0, 3, 6, ...`. Index `0` is intentionally active, allowing the base pattern to blend into the cadence instead of being a special untransformed exception.

The row and column transformations are composed into one affine matrix. If both axes schedule a transformation for a tile, both are applied.

Flips and rotations are around the center of the tile:

```text
local center = (tileWidth / 2, tileHeight / 2)
```

The translation terms required to transform around that point are included directly in the flip and rotation matrices. This keeps the tile's center fixed, including for non-square selections, and matches the center-origin behavior used by clipboard flip and rotation.

Because matrix multiplication order matters, the effective point operation order is column flip, row flip, column rotation, row rotation, and finally tile translation. Every flip and rotation uses the same tile center.

The final tile descriptor contains:

```js
{
  row,
  column,
  matrix,     // numeric affine matrix used by geometry calculations
  transform,  // the same matrix serialized for SVG
}
```

Using one matrix for rendering, culling, and the source selection overlay is an important invariant. If those paths reconstruct transforms separately, tiles can disappear too early or selection controls can drift away from the source pattern.

## Building a finite candidate range

The visible screen is simple in viewport coordinates: a rectangle from `(0, 0)` to `(viewportWidth, viewportHeight)`. It is not necessarily a rectangle in logical canvas coordinates because the page can be translated, scaled non-uniformly, and rotated.

### 1. Map the viewport into canvas space

`getCanvasToViewportMatrix` builds the same canvas transform used for SVG rendering. The Trellis inverts that matrix and maps all four viewport corners back into canvas space.

All four corners are required. Inverting only the top-left and bottom-right corners is incorrect after page rotation because those two points no longer describe the visible logical extent. The four transformed corners are enclosed in a conservative canvas-space bounding box.

### 2. Build effective lattice vectors

Ignoring the small staircase error introduced by integer offset steps, the average movement for one column and one row is:

```text
columnVector = (
  tileWidth + columnOffset.x / columnEvery,
  columnOffset.y / columnEvery
)

rowVector = (
  rowOffset.x / rowEvery,
  tileHeight + rowOffset.y / rowEvery
)
```

The real offset uses `truncate(index / every)`, whereas these vectors use the continuous value `index / every`. Their difference is always less than one offset. The candidate viewport is padded by the full configured row and column offsets so this approximation cannot exclude a real tile.

### 3. Include all possible source geometry

The candidate padding also includes a conservative envelope of the selected pattern:

- Every selected line endpoint and polygon vertex contributes to the local bounds.
- Line stroke radius is included.
- Geometry outside the selection rectangle is included, so a long selected line can keep a distant tile alive.
- When any flip or rotation is enabled, the radius accounts for every transformation around the shared tile center.

This envelope is used to find candidates only. Individual tiles still receive exact visibility checks later.

### 4. Invert the lattice basis

The determinant of `columnVector` and `rowVector` tells whether they form a usable two-dimensional basis. For an ordinary lattice, each padded viewport corner is expressed as row and column coefficients in that basis. The minimum and maximum coefficients are rounded outward and expanded by one additional index.

The viewport center is mapped through the same basis. Its nearest row and column become the starting point for candidate enumeration.

### Degenerate lattices

Offsets can collapse the lattice or make its vectors nearly parallel. In that case, the determinant is zero or too small to invert safely. There may be many, or effectively infinitely many, index pairs at the same location.

For this case, the algorithm:

1. Estimates the minimum-norm row and column near the viewport center using a small regularizer.
2. Builds a finite square around that index, sized from the candidate-check limit.
3. Searches it center-first using the normal visibility and group limits.
4. Reports that the Trellis was limited.

The fallback favors responsiveness and useful nearby output over pretending an unbounded degenerate lattice can be exhaustively rendered.

## Center-first candidate enumeration

Candidate indices are yielded in square rings around the lattice index nearest the viewport center. Radius `0` yields the center tile, radius `1` yields the surrounding square, and so on until the finite range is exhausted.

Center-first order has two benefits:

- The most relevant tiles are considered first.
- If a safety limit is reached, the retained output is concentrated around what the user is looking at rather than biased toward one edge of the candidate rectangle.

For each candidate:

1. Increment the candidate-check count.
2. Apply independent row and column skip cadences.
3. Build the tile's affine descriptor.
4. Test the tile against the viewport.
5. Retain it only if at least one primitive is visible.

## Visibility testing

Visibility is tested in viewport coordinates. The tile matrix is multiplied by the canvas-to-viewport matrix:

```text
screenMatrix = canvasMatrix * tileMatrix
```

This handles tile transformations and page translation, scale, non-uniform scale, and rotation in one operation.

### Fast tile rejection

First, the local pattern bounds are transformed by `screenMatrix`. If their viewport-space axis-aligned bounding box is entirely outside the screen, including stroke padding, the whole tile is rejected without inspecting individual primitives.

This cheap test removes most candidates.

### Lines

For each valid line, both endpoints are transformed into viewport space. The shared Cohen-Sutherland segment test checks the line against the viewport rectangle, expanded by the line's scaled stroke radius and a small safety pixel.

Checking only whether an endpoint is on screen would be wrong: a long line can cross the entire viewport while both endpoints are outside it. Cohen-Sutherland correctly retains that case and cheaply rejects segments whose endpoints are outside the same viewport side.

### Filled polygons

A polygon is visible if any of these are true:

- At least one transformed polygon vertex is inside the viewport.
- A polygon edge crosses the viewport, using the same segment intersection primitive.
- The polygon contains any viewport corner.

The third case is necessary for a large polygon that surrounds the viewport while all of its vertices and edges remain off screen.

A tile is retained as soon as any one of its lines or polygons is visible.

## Rendering

`Trellis.jsx` renders the pattern's React elements once, then places that pattern inside each retained tile group. Tile groups use stable `row:column` keys and the SVG transform serialized from their descriptor.

The outer `#trellis` group receives the normal canvas transform. Because culling used the numerical equivalent of that transform, visibility decisions match final SVG placement.

`useViewportSize` subscribes to viewport resize changes. Resizing therefore recalculates the candidate range and visible groups without changing the underlying pattern.

## Safety limits and warnings

Two hard limits prevent pathological settings from locking the page:

- At most `100,000` candidate indices are checked (`MAX_TRELLIS_CANDIDATES`). Skipped and invisible candidates still count because they consume computation.
- At most `5,000` visible tile groups are rendered (`MAX_TRELLIS_GROUPS`). Tile `(0, 0)` is included in this count when visible.

If either limit truncates the result, or the degenerate fallback is required, the user sees `Trellis was limited to keep rendering responsive`.

`Trellis.jsx` remembers the last warning so the same warning is not dispatched on every render. The warning can be shown again after the condition clears and later recurs.

## Why this is faster than rendering everything

The browser and GPU can clip SVG output, but React would still need to create and reconcile every off-screen group, and the browser would still need to process its SVG geometry. An unbounded Trellis cannot be handed to the GPU in the first place.

The finite algorithm avoids that work in layers:

1. Lattice inversion restricts work to indices that could plausibly reach the viewport.
2. Skip cadence removes candidates before matrix and geometry work.
3. A transformed envelope rejects whole tiles cheaply.
4. Exact primitive checks prevent false positives from becoming React elements.
5. Hard limits bound worst-case CPU and DOM cost.

The result is an apparently infinite pattern whose work is proportional to the finite neighborhood around the current screen.

## Maintenance invariants

When changing the Trellis, preserve these rules:

- Tile `(0, 0)` is the transformed source tile and the phase origin for every cadence.
- The source geometry remains unchanged in state; only its rendered presentation is transformed.
- The normal line and polygon layers must not duplicate source objects while the Trellis owns them.
- Row controls use only row indices, and column controls use only column indices.
- Negative indices must use Euclidean modulo for skip and transform cadence.
- Tile flips and rotations are around `(tileWidth / 2, tileHeight / 2)`.
- Rendering, visibility checks, and selection overlays must use the same tile matrix.
- Page rotation requires inverse-transforming all four viewport corners.
- Candidate bounds must include protruding geometry, stroke width, configured transforms, and offset staircase error.
- Lines crossing the screen with both endpoints outside must remain visible.
- Polygons surrounding the screen must remain visible.
- Center-first ordering and both hard limits must remain intact.

Focused regression coverage lives in `src/tests/Trellis.test.jsx`. It covers cadence behavior across negative indices, source-tile transforms, row/column independence, brute-force visibility comparisons, long geometry, page transforms, polygon containment, safety limits, source ownership, selection overlays, resize updates, and zero-sized selections.
