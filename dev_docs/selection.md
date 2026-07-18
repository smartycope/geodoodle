# Selection

As of 1.8.0, there's multiple methods of selecting lines:

## Bounds

Select an area, specified by the bounding box of the existing bounds. Lines with 1 end in and one end out of the selected area are selected dependant on if `partials` is true or not. This has been a feature for a long time.

## Generic Selectors

Points which select lines based on line a start, end, or intersection points. If there's multiple lines on the point, all are selected.

# Specific Selectors

Points which select lines only if specific selectors are on both the start _and_ end of the line.
