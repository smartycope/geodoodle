# Terms

There are many terms I throw around because I've been working on this by myself for a long time. 

* Trellis
    * The automatically repeated "background" pattern, not drawn by the user directly (except for the base pattern). Think of a trellis that beans grow on
* Paper
    * The base class of the drawing part of the program. The thing which is drawn on and handles events. Paper has dots, and lines, and metalines, and more
* Metalines
    * Lines that are not drawn by the user, but are shown to the user. For example, the mirror lines.
* Bounds
    * Points specified by the user which define the selection area
* Cursor
    * In this context, the cursor is coordinates of the dot which the mouse is currently shown over, i.e. the little circle. It's *not* the actual mouse position.
* Current line/CurLine
    * If a line is halfway drawn, it's that line. Otherwise, it's null
* 
