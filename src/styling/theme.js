import { createTheme } from '@mui/material/styles';
import { darken, lighten } from '@mui/material/styles';
import Color from 'colorjs.io'

/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR
 * h, s, v
*
function HSV2RGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

function HSV2HSL(h, s, v) {
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    var _h = h,
        _s = s * v,
        _l = (2 - s) * v;
    _s /= (_l <= 1) ? _l : 2 - _l;
    _l /= 2;

    return [
        _h,
        _s,
        _l
    ];
}

function HSL2HSV(h, s, l) {
    if (arguments.length === 1) {
        s = h.s, l = h.l, h = h.h;
    }
    var _h = h,
        _s,
        _v;

    l *= 2;
    s *= (l <= 1) ? l : 2 - l;
    _v = (l + s) / 2;
    _s = (2 * s) / (l + s);

    return [
        _h,
        _s,
        _v
    ];
}

function RGB2HSL(r, g, b) {
    return HSL2HSV(...HSV2HSL(...RGB2HSV(r, g, b)))
}

function HSL2RGB(h, s, l) {
    return HSV2RGB(...HSL2HSV(h, s, l))
}

function HEX2RGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function RGB2HEX(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
*/
function colorIsVisible(color, background) {
    return Math.abs(color.hsl.l - background.hsl.l) > 25
}

export default (paperColor, darkMode) => {
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
            // primary: { main: '#1976d2', light: '#63a4ff', dark: '#004ba0' },
            primary: {
                main: main,
                // light: '#607C8D',
                // dark: '#56514B'
            },
            action: {
                hover: {
                    backgroundColor: main,
                },
                focus: {
                    backgroundColor: main,
                },
                // active: {
                //     backgroundColor: 'primary.main',
                // },
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
                defaultProps: {
                    elevation: 5,
                },
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                        // backgroundColor: darken(alpha(main, .9), .2),
                    },
                },
            },
            FormControlLabel: {
                styleOverrides: {
                    root: {
                        // color: 'primary.contrastText',
                    },
                },
            },
            // ListSubheader: {
            //     styleOverrides: {
            //         root: {
            //             bgcolor: 'red',
            //             width: '100%',
            //         },
            //     },
            // },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        color: main,
                    },
                },
            },
            // Icon: {
            //     styleOverrides: {
            //         root: {
            //             color: 'primary.main',
            //         },
            //     },
            // },
        },
        // typography: {
        //   h1: { fontSize: '2rem', fontWeight: 700 },
        // },
        // spacing: 8, // base unit
    })
}
