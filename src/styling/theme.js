import { createTheme } from '@mui/material/styles';
import { darken, alpha } from '@mui/material/styles';

const main = '#ffddab'
export const theme = createTheme({
    palette: {
        // primary: { main: '#1976d2', light: '#63a4ff', dark: '#004ba0' },
        primary: { main: main, light: '#607C8D', dark: '#56514B' },
        //rgb(96, 124, 141)
        // #26413C
        secondary: { main: '#dc004e' },
        background: { default: '#3C3C3C' },
    },
    components: {
        MuiPaper: {
            defaultProps: {
                elevation: 5,
            },
            styleOverrides: {
                root: {
                    backgroundColor: darken(alpha(main, .95), .2),
                },
            },
        },
        FormControlLabel: {
            styleOverrides: {
                root: {
                    color: 'primary.contrastText',
                },
            },
        },
        ListSubheader: {
            styleOverrides: {
                root: {
                    bgcolor: 'primary.main',
                    width: '100%',
                },
            },
        },
    },
    // typography: {
    //   h1: { fontSize: '2rem', fontWeight: 700 },
    // },
    // spacing: 8, // base unit
});
