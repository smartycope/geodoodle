import { ThemeProvider, createTheme } from "@mui/material/styles"
import generateTheme from "../src/styling/theme"
import CssBaseline from "@mui/material/CssBaseline"
import getInitialState from "../src/states"
import { StateContext } from "../src/Contexts"

const colorNames = {
  paper: "#ffddab",
  dark: "#272727", // from theme.js
  light: "#f7f7f7", // from theme.js
  // Medium: '#f0f0f0',
  white: "#fff",
  black: "#000",
  red: "#f44336",
  blue: "#2196F3",
}

/** @type { import('@storybook/react-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        paper: { name: "Paper", value: colorNames.paper },
        dark: { name: "Dark", value: colorNames.dark },
        light: { name: "Light", value: colorNames.light },
        // Medium: {name: 'Medium', value: colorNames.Medium},
        white: { name: "White", value: colorNames.white },
        black: { name: "Black", value: colorNames.black },
        red: { name: "Red", value: colorNames.red },
        blue: { name: "Blue", value: colorNames.blue },
      },
    },
    initialGlobals: {
      backgrounds: { value: "paper" },
    },
  },
}

export const globalTypes = {
  theme: {
    name: "Theme",
    description: "Global theme for components",
    // defaultValue: 'dark',
    toolbar: {
      dynamicTitle: true,
      icon: "circlehollow",
      items: ["light", "dark"],
    },
  },
  initialGlobals: {
    theme: "dark",
  },
}

const browserStorageResetDecorator = (Story) => {
  window.localStorage.clear()
  window.sessionStorage.clear()
  return <Story />
}

const themeDecorator = (Story, context) => {
  const mode = context.globals.theme
  const theme = generateTheme(colorNames[context.globals.backgrounds.value] || "#ffddab", mode, mode)
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Story />
    </ThemeProvider>
  )
}

export const decorators = [browserStorageResetDecorator, themeDecorator]

export default preview
