import React from "react"
// import { MemoryRouter } from 'react-router-dom';
// import { StateProvider } from '../Contexts';
import ToolButton from "../Menus/ToolButton"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import StateDecorator from "./StateDecorator"

// Create a default theme for the stories
const theme = createTheme({
  palette: {
    mode: "light",
  },
})

// Default state for the context
const defaultState = {
  side: "bottom",
  openMenus: {},
  mobile: false,
}

const icons = [
  "extra",
  "help",
  "settings",
  "file",
  "navigation",
  "repeat",
  "color",
  "mirror",
  "select",
  "clipboard",
  "delete",
  "home",
  "redo",
  "copy_image",
  "undo",
  "main",
  "add_bound",
]

// Wrapper component to provide necessary context
// export const WithContext = (Story, context) => {
//   const { state = defaultState, ...rest } = context.args;
//   return (
//     <StateProvider initialState={state}>
//       <ThemeProvider theme={theme}>
//         <CssBaseline />
//         <div style={{ display: 'flex', gap: '16px', padding: '24px', flexWrap: 'wrap' }}>
//           <Story {...rest} />
//         </div>
//       </ThemeProvider>
//     </StateProvider>
//   );
// };

export default {
  title: "Components/ToolButton",
  component: ToolButton,
  //   decorators: [WithContext],
  decorators: [StateDecorator],
  argTypes: {
    menu: {
      control: {
        type: "select",
        options: icons,
      },
      description: "The type of button to display",
    },
    inExtraMenu: {
      control: "boolean",
      description: "Whether the button is in the extra menu",
    },
    disableTooltip: {
      control: "boolean",
      description: "Whether to disable the tooltip",
    },
    state: {
      control: { type: "object" },
      description: "Global state for the application",
    },
  },
  parameters: {
    layout: "centered",
  },
}

// Template for the stories
const Template = (args) => <ToolButton {...args} />

// Default story
export const Default = Template.bind({})
Default.args = {
  menu: "main",
  state: defaultState,
}

// Example with tooltip
export const WithTooltip = Template.bind({})
WithTooltip.args = {
  menu: "help",
  state: {
    ...defaultState,
  },
}

// Example in extra menu
export const InExtraMenu = Template.bind({})
InExtraMenu.args = {
  menu: "settings",
  inExtraMenu: true,
  state: {
    ...defaultState,
  },
}

// Example with disabled tooltip
export const NoTooltip = Template.bind({})
NoTooltip.args = {
  menu: "color",
  disableTooltip: true,
  state: {
    ...defaultState,
  },
}

// Show all available buttons
export const AllButtons = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
    {icons.map((menu) => (
      <div key={menu} style={{ textAlign: "center" }}>
        <ToolButton menu={menu} state={defaultState} />
        <div style={{ fontSize: "0.8rem", marginTop: "8px" }}>{menu}</div>
      </div>
    ))}
  </div>
)

AllButtons.parameters = {
  docs: {
    description: {
      story: "All available button types with their default icons",
    },
  },
}

// Different positions
export const DifferentPositions = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    {["top", "right", "bottom", "left"].map((side) => (
      <div key={side}>
        <h3>{side.charAt(0).toUpperCase() + side.slice(1)}</h3>
        <div
          style={{
            display: "flex",
            gap: "16px",
            padding: "16px",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <ToolButton
            menu="help"
            state={{
              ...defaultState,
              side,
            }}
          />
          <ToolButton
            menu="settings"
            state={{
              ...defaultState,
              side,
            }}
          />
        </div>
      </div>
    ))}
  </div>
)

DifferentPositions.parameters = {
  docs: {
    description: {
      story: "Tooltip positions based on the side prop in the state",
    },
  },
}
