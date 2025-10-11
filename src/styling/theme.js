import { createTheme } from "@mui/material/styles"
import Color from "colorjs.io"

function colorIsVisible(color, background) {
  // 4.5 came from here:
  // https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html
  return color.contrast(background, "WCAG21") > 4.5
}

export default function generateTheme(paperColor, themeMode, systemPreferedTheme) {
  const darkMode = themeMode === "dark" || (themeMode === "system" && systemPreferedTheme === "dark")
  // This white was not randomly chosen
  const paperMain = darkMode ? "#272727" : "#f7f7f7"

  // Evenly darken or lighten paperColor until it can be seen against the background, based on darkMode
  let main = new Color(paperColor)
  let i = 0
  const base = new Color(paperMain)
  while (!colorIsVisible(main, base)) {
    main.hsv.v += darkMode ? 1 : -1
    // An infinite loop *shouldn't* be a problem, but just in case
    i++
    if (i > 100) break
  }
  main = main.toString({ format: "hex" })

  let theme = createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      primary: { main: main },
      action: {
        hover: { backgroundColor: main },
        focus: { backgroundColor: main },
      },
      background: {
        default: paperMain,
        paper: paperMain,
      },
    },
    shape: {
      borderRadius: 4,
    },
    components: {
      MuiPaper: {
        defaultProps: { elevation: 5 },
        styleOverrides: { root: { borderRadius: 10 } },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: main,
          },
        },
      },
    },
  })

  const contrast = theme.palette.getContrastText(paperColor)
  // We re-create the theme just so we can have access to auto-generated theme properties like getContrastText()
  // TODO: a function we can use here that, given a color, if it is too close to another color (the paperColor),
  // it changes it until it's visible against the other color
  theme.palette.primary.contrast = contrast
  theme.palette.primary.dots = contrast
  theme.palette.primary.bounds = contrast
  theme.palette.primary.cursor = contrast
  theme.palette.paperIsDark = contrast === "#fff"
  theme.palette.primary.glow = theme.palette.paperIsDark ? "red" : "blue"
  theme.palette.primary.mirror = "green"
  theme.palette.primary.eraser = "red"

  return theme
}
