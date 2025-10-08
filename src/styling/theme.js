import { createTheme } from '@mui/material/styles';
import { darken, lighten } from '@mui/material/styles';
import Color from 'colorjs.io'

function colorIsVisible(color, background) {
    // https://www.w3.org/TR/UNDERSTANDING-WCAG20/visual-audio-contrast-contrast.html
    return color.contrast(background, 'WCAG21') > 4.5
}

export default function generateTheme(paperColor, themeMode, systemPreferedTheme){
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

    let theme = createTheme({
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

    const contrast = theme.palette.getContrastText(paperColor)
    // We re-create the theme just so we can have access to auto-generated theme properties like getContrastText()
    theme.palette.primary.dots = contrast
    theme.palette.primary.bounds = contrast
    theme.palette.primary.cursor = contrast
    theme.palette.primary.contrast = contrast
    theme.palette.paperIsDark = contrast === '#fff'
    theme.palette.primary.glow = theme.palette.paperIsDark ? 'red' : 'blue'
    // theme.palette.primary.mirror = theme.palette.paperIsDark ? 'lime' : 'green'
    theme.palette.primary.mirror = 'green'
    theme.palette.primary.eraser = 'red' //theme.palette.paperIsDark ? 'red' : 'blue'
    console.log(theme.palette.primary.glow)
    console.log(contrast)
    // theme.breakpoints.mobile = isMobile() ? '@media (max-width:768px), (max-height:768px)' : '@media (max-width:768px), (max-height:768px)'
    // theme.breakpoints.desktop = isMobile() ? '@media (min-width:769px), (min-height:769px)' : '@media (min-width:769px), (min-height:769px)'
    // theme = createTheme({...theme,
    //     palette: {
    //         ...theme.palette,
    //         primary: {
    //             ...theme.palette.primary,
    //             dots: contrast,
    //             bounds: contrast,
    //             cursor: contrast,
    //         },
    //     },
    // })
    return theme
}
