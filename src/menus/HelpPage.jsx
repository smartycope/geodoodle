import { InTourContext, StateContext } from "../Contexts"
import { useContext } from "react"
import Page from "../components/Page"
import Button from "@mui/material/Button"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import AccordionSummary from "@mui/material/AccordionSummary"
import AccordionDetails from "@mui/material/AccordionDetails"
import Accordion from "@mui/material/Accordion"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import TabManager from "../components/TabManager"

function AboutContent() {
  return (
    <>
      <Typography>
        This is a drawing program that emulates doodling on graph paper. All the lines are intended to line up with the
        dots.
        <br />
        This is a rough roadmap of major features:
      </Typography>
      <ul>
        <li>✅ Selection</li>
        <li>✅ Controls Menu</li>
        <li>✅ Mirroring</li>
        <li>✅ Colors &amp; Stroke Patterns</li>
        <li>✅ File Handling</li>
        <li>✅ Settings</li>
        <li>✅ Repeating</li>
        <li>✅ Mobile Compatibility</li>
        <li>✅ Allow lines to be drawn from line intersections</li>
        <li>✅ Added backend for saving patterns</li>
        {/* <s>
          <li>❌ Connect to Google Drive</li>
          </s> */}
        <li>✅ Custom Keyboard Shortcuts</li>
        <li>✅ Layers</li>
        <li>❌ Alternate Dot Patterns</li>
        <li>❌ Curved Lines</li>
        <li>❌ App</li>
      </ul>
      <Typography>
        This is a passion project of Copeland Carter. To see one of the other things he&apos;s really proud of, check
        out <Link href="http://ezregex.org/">EZRegex.org</Link>! <br />
        This project is entirely open source, and the code is available on{" "}
        <Link href="https://github.com/smartycope/geodoodle">GitHub</Link>
        <br />
        If you have any suggestions, ideas, or want to help out, check out the{" "}
        <Link href="https://github.com/smartycope/geodoodle/issues">issues</Link> page.
      </Typography>
    </>
  )
}

function Concept({ title, children, autoTypography = false }) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ mt: 2 }}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>{autoTypography ? <Typography>{children}</Typography> : children}</AccordionDetails>
    </Accordion>
  )
}

function ConceptsContent() {
  return (
    <>
      <Concept title="Controls">
        <Typography>
          The circle or crosshair on the paper is GeoDoodle&apos;s cursor. It snaps to dots and, when enabled in
          Settings, intersections between lines. On desktop you can click two points or click and drag to draw. On a
          touchscreen, drag from one point to another. A two-finger gesture moves the paper and pinching changes its
          scale.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Keyboard controls include the arrow keys, WASD, or J/K/L/; to move; Space to start or finish a line; C to
          continue from the previous line; E to move an existing endpoint; B and N for selection; and Delete or
          Backspace to remove the item under the cursor. Control shortcuts also work with Command on macOS.
        </Typography>
        <Concept title="Toolbar">
          <Typography>
            The toolbar opens GeoDoodle&apos;s tools and menus. Its final menu button collapses the toolbar into one
            floating button, and the side it uses can be changed in Settings. When the screen is too small for every
            tool, less frequently used tools move into the Extra menu automatically.
          </Typography>
        </Concept>
        <Concept title="Undo/redo">
          <Typography>
            Undo reverses recent drawing and editing actions. On desktop, left-click the Undo button to undo and
            right-click it to redo. On mobile, tap to undo and tap and hold to redo. You can also use Control/Command+Z
            to undo and Control/Command+Y or Control/Command+Shift+Z to redo.
          </Typography>
        </Concept>
        <Concept title="Extra button">
          <Typography>
            The Extra button is a customizable toolbar shortcut. Choose its action in General Settings—for example, it
            can quickly return Home or toggle dot visibility. If the toolbar has limited room, the shortcut appears
            inside the Extra menu instead.
          </Typography>
        </Concept>
      </Concept>

      <Concept title="Lines">
        <Typography>
          Lines connect dots or allowed line intersections. A line that has been started but not finished follows the
          cursor as a preview; finishing it makes it part of the pattern. Each line keeps the color (including
          transparency), width, dash pattern, cap, and join that were active when it was created. The five numbered
          color profiles let you switch between prepared styles with the 1–5 keys.
        </Typography>
        <Concept title="Removing Lines">
          <Typography>
            Delete or Backspace removes what is under the cursor. Depending on the current mode, that may be a selector,
            bound, unfinished line, clipboard, mirror origin, fill, or every line attached to the point. Mobile users
            can double-tap a point for the same action. To remove one particular line where several meet, place a
            specific selector at each of its endpoints and use Delete Selected. The Delete menu can also remove the
            selected lines, remove everything except the selection, or clear the entire pattern.
          </Typography>
        </Concept>
      </Concept>

      <Concept title="Navigation">
        <Typography>
          Translation is the paper&apos;s position on screen, while scale is the pixel spacing between neighboring dots.
          Scroll to move vertically, Shift+scroll to move horizontally, Control+scroll to scale, and
          Control+Shift+scroll to rotate. On touchscreens, use two fingers to move, pinch to scale, and twist to rotate.
          The Navigation menu also accepts exact position, scale, and rotation values.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Home restores the starting position, scale, and rotation, and Go to Selection centers the current area
          selection. In Settings, the cursor can either wrap to the opposite side at an edge or keep moving while the
          paper follows it so the cursor remains visible. Canvas rotation can also be disabled there; disabling it
          resets the rotation to zero.
        </Typography>
      </Concept>

      <Concept title="Colors">
        <Typography>
          The Color menu has five profiles for line styles and five corresponding fill colors. Choose a profile with a
          swatch or the 1–5 keys, then edit its color, transparency, line width, or dash code. Dash codes are
          comma-separated lengths such as “20, 10”; use “0” for a solid line. The picker can show RGB or HSV controls,
          depending on Settings.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Randomize gives every profile a random hue while keeping the paper&apos;s value and using a slightly stronger
          saturation, so the result is varied without ignoring the background.
        </Typography>
        <Concept title="Fill mode">
          <Typography>
            Fill mode finds closed shapes formed by the existing lines. Moving over a shape previews its fill; click or
            tap without dragging to make that fill permanent. On mobile, dragging across shapes is only a preview and
            releasing does not fill them. Open or incomplete shapes cannot be filled. Use Delete over a filled shape to
            clear its fill.
          </Typography>
        </Concept>
      </Concept>

      <Concept title="Selection">
        <Typography>
          Selection can combine an area and individual point selectors. Bounds define the corners of a rectangular area.
          With Partials enabled, a line is selected when either endpoint is inside; with Partials disabled, both
          endpoints must be inside. On desktop, press B to add a bound. On mobile, use Add Bound or tap, hold, and drag.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          A generic selector chooses every line that starts, ends, or intersects at that point. A specific selector
          chooses a line only when specific selectors are present at both of its endpoints. Press N for a generic
          selector and Shift+N for a specific selector, or use the mobile Selection menu. All three selection methods
          contribute to the same selection.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Once lines are selected, you can copy, cut, delete them, delete everything else, or move the bounded area into
          a Trellis layer. A completed area also shows optional canvas buttons beside it unless those buttons are
          disabled in Settings.
        </Typography>
        <Concept title="Clipboard">
          <Typography>
            Copy stores the selected lines relative to the selection, Cut stores them and removes the originals, and
            Paste adds the clipboard preview at the cursor. Before pasting, you can move, rotate, or mirror the preview.
            On mobile, transformation buttons appear beside the active clipboard. Control/Command+C, X, and V provide
            the familiar keyboard shortcuts. Cancel the clipboard when you no longer need its preview.
          </Typography>
        </Concept>
      </Concept>

      <Concept title="Mirroring">
        <Typography>
          Mirroring creates transformed copies as you draw. Flip horizontally, vertically, or across both axes; rotate
          by 90°, 180°, or into four quarter-turn copies; or combine flipping and rotation. Cursor mode transforms
          around the current cursor, while Page mode uses the center of the screen. The guide lines show the active axes
          before a line is placed.
        </Typography>
        <Concept title="Origins">
          <Typography>
            A mirror origin saves the current flip and rotation around one chosen point, allowing future lines to be
            transformed around that location in addition to the normal cursor or page transformation. Set a mirror
            operation, move the cursor to the desired point, then add an origin with O or the Mirror menu. Delete an
            origin at the cursor or clear them from the menu. Origins multiply copies quickly, so there is a limit of 12
            and most patterns only need one or two.
          </Typography>
        </Concept>
      </Concept>

      <Concept title="Trellis Layers">
        <Typography>
          A Trellis layer repeats one bounded selection across the paper. Complete a non-zero area on a Drawing layer,
          then choose Create Trellis Layer from the Selection menu, its canvas button, or the R shortcut. The selected
          lines and fills move into a new Trellis layer above the source Drawing layer.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          Offset changes how rows or columns overlap, Flip reflects tiles, Rotate turns them, and Skip leaves spaces.
          Each transformation has separate row and column controls: “every” controls how often it is applied, and the
          other value controls what is applied. These four controls appear directly in the toolbar whenever a Trellis
          layer is active and update that layer immediately.
        </Typography>
      </Concept>

      <Concept title="Layers">
        <Typography>
          Drawing layers keep lines, fills, selections, and mirror origins. Trellis layers contain only a repeated
          pattern and its Offset, Skip, Flip, and Rotate settings. The canvas composites visible layers from bottom to
          top, while editing actions affect only the active layer. Open the Layers panel to add Drawing layers, name,
          show or hide, delete, select, and reorder every layer. Hidden layers remain saved but do not appear in the
          canvas or exported images.
        </Typography>
      </Concept>

      <Concept title="Saving">
        <Typography>
          GeoDoodle preserves the current drawing and many settings in this browser as you work. Named local saves let
          you keep and reload multiple patterns. Cloud saves are tied to the entered username, but they are not private;
          download important work as a backup.
        </Typography>
        <Typography sx={{ mt: 1 }}>
          SVG downloads preserve GeoDoodle&apos;s editable pattern data and can be uploaded again. PNG and JPEG are
          image exports only and cannot be imported as editable patterns. Every visual format uses the chosen export
          area and includes visible layers only; editable SVG metadata still preserves hidden layers. The Files page can
          also copy the current selection or visible artwork as an image.
        </Typography>
      </Concept>
    </>
  )
}

function FAQ({ q, a }) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{q}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>{a}</Typography>
      </AccordionDetails>
    </Accordion>
  )
}

function FaqContent() {
  return (
    <>
      <FAQ
        q="What are partials?"
        a="Partials are lines that only have one end inside the selected area. You can toggle if they're included in the selection in the selection menu."
      />
      <FAQ
        q="Why is it called GeoDoodle?"
        a="It's supposed to stand for 'Geometry Doodle'. Honestly, if you have a better idea, let me know"
      />
    </>
  )
}

function HelpMenuTabbed() {
  const { dispatch } = useContext(StateContext)
  const setInTour = useContext(InTourContext)

  return (
    <Page menu="help" title="Welcome to GeoDoodle!">
      <TabManager
        tabs={[
          { label: "About", content: AboutContent() },
          { label: "Concepts", content: ConceptsContent() },
          { label: "FAQ", content: FaqContent() },
        ]}
      />
      <Button
        variant="outlined"
        onClick={() => {
          dispatch("start_tour")
          setInTour(true)
        }}
        sx={{
          bottom: 10,
          alignSelf: "center",
          position: "absolute",
        }}
      >
        Start tour
      </Button>
    </Page>
  )
}

export default HelpMenuTabbed
