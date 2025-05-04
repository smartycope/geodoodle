# Filling In Colors

Polygons are created upon entering fillMode. We use turf to polygonize the lines, and then we use inside from 'point-in-polygon' to determine which polygon a point is in (if any) whenever the mouse (not cursor!) moves.
