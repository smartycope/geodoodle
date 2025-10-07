import { InTourContext, StateContext } from "../Contexts";
import { useContext, useState } from "react";
import Page from "./Page";
import { Box, Button, Link, Typography, Tabs } from "@mui/material";
// import TabContext from '@mui/lab/TabContext';
// import TabList from '@mui/lab/TabList';
// import TabPanel from '@mui/lab/TabPanel';
import Tab from '@mui/material/Tab';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import QuizIcon from '@mui/icons-material/Quiz';
// import TabPanel from './TabPanel';
import TabManager from './TabManager';

function AboutContent() {
    return <>
        <Typography>
            This is a drawing program that emulates doodling on graph paper.
            All the lines are intended to line up with the dots.
            <br />
            This is a rough roadmap of major features:</Typography>
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
            This is a passion project of Copeland Carter.
            To see one of the other things he&apos;s really proud of,
            check out <Link href='http://ezregex.org/'>EZRegex.org</Link>! <br />

            This project is entirely open source, and the code is available
            on <Link href='https://github.com/smartycope/geodoodle'>GitHub</Link>
        </Typography>
        <Box>
            <Button
                variant='outlined'
                onClick={() => { dispatch('start_tour'); setInTour(true) }}
                sx={{
                    bottom: 10,
                    alignSelf: 'center',
                    position: 'absolute',
                }}
            >
                Start full tour
            </Button>
        </Box>
    </>
}

function HelpContent() {
    return <>
    </>
}

function FaqContent() {
    return <>
    </>
}

function HelpMenuTabbed() {
    return <Page menu='help' title='Welcome to GeoDoodle!'>
        <TabManager tabs={[
            { label: 'About', content: AboutContent() },
            { label: 'Help', content: HelpContent() },
            { label: 'FAQ', content: FaqContent() },
        ]} />
    </Page>
}

export default HelpMenuTabbed

