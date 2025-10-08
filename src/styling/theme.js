import { createTheme } from '@mui/material/styles';
import { darken, lighten } from '@mui/material/styles';
import Color from 'colorjs.io'

function colorIsVisible(color, background) {
    // https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html
    return color.contrast(background, 'WCAG21') > 4.5
}

export default (paperColor, themeMode, systemPreferedTheme) => {
    const darkMode = themeMode === 'dark' || (themeMode === 'system' && systemPreferedTheme === 'dark')
    // This white was not randomly chosen
    const paperMain = darkMode ? '#272727' : '#f7f7f7'

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

    return createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
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
            // borderRadius: 8
        },
        components: {
            MuiPaper: {
                defaultProps: {elevation: 5},
                styleOverrides: {root: {borderRadius: 10}},
            },
            FormControlLabel: {
                styleOverrides: {
                    root: {
                        // color: 'primary.contrastText',
                    },
                },
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
}
