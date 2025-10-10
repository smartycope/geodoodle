# Coordinate Systems

There are multiple different coordinate systems used in the program:

- Viewport (previously Absolute)
  - Relative to the viewport, origin is top left, not translated
  - The plain window coordinates
  - The coordinates the mouse would be in
- SVG (previously Relative)
  - Translated, origin is (0, 0) of the svg element
  - The coordinates of the svg element
- Deflated (previously Scaled)
  - Each dot is 1 more unit over than the previous, multiply by scalex/y to get the "drawable" value
  - More mathmatically helpful, and certain elements (like lines) need to use it so they can get rescaled to the current scale, and not store the scale they had when they were created
- Inflated
  - The opposite of deflated
  - The coordinates in pixels
