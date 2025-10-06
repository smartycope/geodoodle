import { InTourContext, StateContext } from "../Contexts";
import { useContext, useState } from "react";
import Page from "./Page";
import { Box, Button, Link, Typography, Stack } from "@mui/material";
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Tab from '@mui/material/Tab';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import QuizIcon from '@mui/icons-material/Quiz';

function HelpContent() {
    return <>
    </>
}

function AboutContent() {
    return <Stack>
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
    </Stack>
}

function FaqContent() {
    return <>
    </>
}

function HelpPage() {
    const { dispatch } = useContext(StateContext)
    const setInTour = useContext(InTourContext)

    const [value, setValue] = useState('1');

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return <Page menu='help' title='Welcome to GeoDoodle!'>
        <Box sx={{ width: '100%', typography: 'body1' }}>
            <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList onChange={handleChange} aria-label="Download/Upload or Save/Load">
                        <Tab label="About" value="1" icon={<InfoIcon />} iconPosition='start' />
                        <Tab label="Help" value="2" icon={<HelpIcon />} iconPosition='start' />
                        <Tab label="FAQ" value="3" icon={<QuizIcon />} iconPosition='start' />
                    </TabList>
                </Box>
                <TabPanel value="1">
                    {AboutContent()}
                </TabPanel>
                <TabPanel value="2">
                    {HelpContent()}
                </TabPanel>
                <TabPanel value="3">
                    {FaqContent()}
                </TabPanel>
            </TabContext>
        </Box>

    </Page>
}

export default HelpPage