# Terms

There are many terms I throw around because I've been working on this by myself for a long time.

- Trellis
  - A captured pattern repeated across the paper. Each Layer can own one Trellis alongside ordinary lines and fills.
- Layer
  - One independently named and visible drawing composite. It owns lines, fills, selections, mirror origins, and an optional Trellis.
- Paper
  - The base class of the drawing part of the program. The thing which is drawn on and handles events. It has dots, and lines, and metalines, and more
- Metalines
  - Lines that are not drawn by the user, but are shown to the user. For example, the mirror lines.
- Bounds
  - Points specified by the user which define the selection area
- Cursor
  - In this context, the cursor is coordinates of the dot which the mouse is currently shown over, i.e. the little circle. It's _not_ the actual mouse position.
- Current line/curLinePos
  - If a line is halfway drawn, it's the point at which the line starts. Otherwise, it's null. The current line is between curLinePos and the cursor.
- Permanent lines
  - Ordinary lines stored on a Layer, not metalines or lines captured inside a Trellis. Active-layer code sees them through `state.lines`.

## Some code terms

- Menu
  - UI elements which are part of the main control bar, which popup when their button is pressed
- Page
  - A full screen UI element, like a modal dialog
