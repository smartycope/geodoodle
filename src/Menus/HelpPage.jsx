import { InTourContext, StateContext } from "../Contexts";
import { useContext } from "react";
import Page from "./Page";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Accordion from "@mui/material/Accordion";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import TabManager from "./TabManager";

function AboutContent() {
    return (
        <>
            <Typography>
                This is a drawing program that emulates doodling on graph paper. All the lines are intended to line up
                with the dots.
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
                <li>❌ Alternate Dot Patterns</li>
                <li>❌ Custom Keyboard Shortcuts</li>
                <li>❌ Allow lines to be drawn from line intersections</li>
                <li>❌ Connect to Google Drive</li>
                <li>❌ Curved Lines</li>
                <li>❌ App</li>
            </ul>
            <Typography>
                This is a passion project of Copeland Carter. To see one of the other things he&apos;s really proud of,
                check out <Link href="http://ezregex.org/">EZRegex.org</Link>! <br />
                This project is entirely open source, and the code is available on{" "}
                <Link href="https://github.com/smartycope/geodoodle">GitHub</Link>
                <br />
                If you have any suggestions, ideas, or want to help out, check out the{" "}
                <Link href="https://github.com/smartycope/geodoodle/issues">issues</Link> page.
            </Typography>
        </>
    );
}

function Concept({ title, children, autoTypography = false }) {
    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ mt: 2 }}>
                <Typography>{title}</Typography>
            </AccordionSummary>
            <AccordionDetails>{autoTypography ? <Typography>{children}</Typography> : children}</AccordionDetails>
        </Accordion>
    );
}

function ConceptsContent() {
    return (
        <>
            <Concept title="Controls">
                keyboard shortcuts touchscreen controls
                <Concept title="Toolbar">you can collapse it extra menu auto-expands</Concept>
                <Concept title="Undo/redo">controls for redo</Concept>
                <Concept title="Extra button">Can be set in settings</Concept>
            </Concept>

            <Concept title="Lines">
                They have color (include transparency), stroke width, and dash pattern
                <Concept title="Removing Lines">
                    erase all lines at a point (or bounds or origins or whatever else) erase a single line by selecing
                    both points
                </Concept>
            </Concept>

            <Concept title="Navigation">
                scale -- spacing between the dots translation -- where you are rotate -- orientation of the paper -- not
                implemented yet
            </Concept>

            <Concept title="Colors">
                dash code stroke color fill color
                <Concept title="Fill mode">its a thing you can only fill closed shapes</Concept>
            </Concept>

            <Concept title="Selection">
                create bounds to specify a selection This selects Lines partials YOu can then copy, cut, paste, delete,
                delete all others, or repeat
                <Concept title="Clipboard">works just like copy/paste</Concept>
            </Concept>

            <Concept title="Mirroring">
                Flip & Rotate around either the cursor, the center of the page, or a specific point.
                <Concept title="Origins">
                    Mirror & rotate around a specific point, instead of the cursor or center of the paper. Be careful!
                    They can get messy quick. Theres a limit of 12, and you will probably only ever need 1 or 2.
                </Concept>
            </Concept>

            <Concept title="Repeating">Tesselations!</Concept>

            <Concept title="Saving">as an svg, can import from svg, not from png</Concept>
        </>
    );
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
    );
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
    );
}

function HelpMenuTabbed() {
    const { dispatch } = useContext(StateContext);
    const setInTour = useContext(InTourContext);

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
                    dispatch("start_tour");
                    setInTour(true);
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
    );
}

export default HelpMenuTabbed;
