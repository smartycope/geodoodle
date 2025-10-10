import * as React from "react";
import { useId } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";

export default function TabManager({ tabs, id }) {
    const [value, setValue] = React.useState(0);
    const reactId = useId();
    id ||= reactId;

    return (
        <>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <Tabs value={value} onChange={(e, newValue) => setValue(newValue)} aria-label={`${id}-tabs`}>
                    {tabs.map((tab, index) => (
                        <Tab
                            label={tab.label}
                            id={`${id}-tab-${index}`}
                            aria-controls={`${id}-tabpanel-${index}`}
                            key={`${id}-tab-${index}`}
                        />
                    ))}
                </Tabs>
            </Box>
            {tabs.map((tab, index) => (
                <div
                    role="tabpanel"
                    hidden={value !== index}
                    id={`${id}-tabpanel-${index}`}
                    aria-labelledby={`${id}-tab-${index}`}
                    key={`${id}-tabpanel-${index}`}
                >
                    {value === index && <Box sx={{ p: 3 }}>{tab.content}</Box>}
                </div>
            ))}
        </>
    );
}
