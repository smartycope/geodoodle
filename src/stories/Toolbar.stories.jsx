import React from "react";
// import { MemoryRouter } from 'react-router-dom';
import { StateContext } from "../Contexts";
import Toolbar from "../Menus/Toolbar";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import StateDecorator from "./StateDecorator";

// Create a default theme for the stories
const theme = createTheme({
    palette: {
        mode: "light",
    },
});

// Default state for the context
const defaultState = {
    side: "bottom",
    openMenus: {},
    mobile: false,
    holdTapTimeMS: 500,
};

// // Wrapper component to provide necessary context
// export const WithContext = (Story, context) => {
//   const { state = defaultState, ...rest } = context.args;
//   return (
//     <StateContext.Provider value={state}>
//       <ThemeProvider theme={theme}>
//         <CssBaseline />
//         <Box sx={{ position: 'relative', height: '100vh', width: '100%', overflow: 'hidden' }}>
//           <Story {...rest} />
//         </Box>
//       </ThemeProvider>
//     </StateContext.Provider>
//   );
// };

export default {
    title: "Components/Toolbar",
    component: Toolbar,
    decorators: [StateDecorator],
    argTypes: {
        state: {
            control: { type: "object" },
            description: "Global state for the application",
        },
    },
    parameters: {
        layout: "fullscreen",
        viewport: {
            defaultViewport: "mobile1",
        },
    },
};

// Template for the stories
const Template = (args) => <Toolbar {...args} />;

// Default story
export const Default = Template.bind({});
Default.args = {
    state: defaultState,
};

// With main menu open
export const WithMenuOpen = Template.bind({});
WithMenuOpen.args = {
    state: {
        ...defaultState,
        openMenus: { main: true },
    },
};

// Different positions
export const DifferentPositions = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "16px" }}>
        {["top", "right", "bottom", "left"].map((side) => (
            <div key={side}>
                <h3>{side.charAt(0).toUpperCase() + side.slice(1)}</h3>
                <div style={{ position: "relative", height: "200px", border: "1px solid #ddd", borderRadius: "8px" }}>
                    <Toolbar
                        state={{
                            ...defaultState,
                            side,
                            openMenus: { main: true },
                        }}
                    />
                </div>
            </div>
        ))}
    </div>
);

DifferentPositions.parameters = {
    docs: {
        description: {
            story: "Toolbar in different positions with main menu open",
        },
    },
};

// Mobile view
export const MobileView = Template.bind({});
MobileView.args = {
    state: {
        ...defaultState,
        mobile: true,
        openMenus: { main: true },
    },
};

MobileView.parameters = {
    viewport: {
        defaultViewport: "mobile1",
    },
};

// With extra menu open
export const WithExtraMenu = Template.bind({});
WithExtraMenu.args = {
    state: {
        ...defaultState,
        openMenus: { main: true, extra: true },
    },
};

// With all menus closed (showing only the FAB)
export const WithFabOnly = Template.bind({});
WithFabOnly.args = {
    state: {
        ...defaultState,
        openMenus: {},
    },
};

// With beginner mode off
export const WithoutTooltips = Template.bind({});
WithoutTooltips.args = {
    state: {
        ...defaultState,
        openMenus: { main: true },
    },
};

// Custom state example
export const CustomState = Template.bind({});
CustomState.args = {
    state: {
        ...defaultState,
        openMenus: { main: true, repeat: true },
        mobile: true,
        side: "right",
    },
};

CustomState.parameters = {
    docs: {
        description: {
            story: "Example with custom state showing main and repeat menus open on mobile",
        },
    },
};
