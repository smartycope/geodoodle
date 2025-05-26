# Filling In Colors

Polygons are created upon entering fillMode. First we remove any duplicates, null lines, or lines without length. Then we split the lines up into segments, so they don't overlap. Then we use turf to polygonize the lines. We can then use `inside` from `point-in-polygon` to determine which polygon a point is in (if any) whenever the mouse (not cursor!) moves. I added a Poly class to handle a lot of this logic.
