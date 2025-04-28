# Coordinate Systems

There are multiple different coordinate systems used in the program:

* Absolute
    * Relative to the viewport, origin is top left, not translated
    * The plain window coordinates
    * The coordinates the mouse would be in
* Relative
    * Translated, origin is (0, 0) of the svg element
    * The coordinates of the svg element
    * The coordinates the lines use
* Scaled
    * Each dot is 1 more unit over than the previous, multiply by scale to get the "drawable" value
    * More mathmatically helpful
    * The coordinates of the dots (although not really, the dots are actually implemented using the <pattern> element)
