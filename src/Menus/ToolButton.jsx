import React from 'react'
import { useTheme } from '@mui/material/styles';
import { useContext } from 'react';
import { StateContext } from '../Contexts';
import { IconButton } from '@mui/material';

export const toolButtonStyle = (theme) => ({
    border: 'none',
    cursor: 'pointer',
    pointerEvents: 'all',
    textAlign: 'center',
    navIndex: -1,
    scale: 1.5,
    opacity: 90,
    outlineStyle: 'none',
    boxShadow: 'none',
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    color: theme.palette.primary.dark,
})

const ToolButton = React.forwardRef(function ({toggleMenu, onClick, icon, ...props}, ref){
    const theme = useTheme()
    const {state, dispatch} = useContext(StateContext)

    return <IconButton
        sx={toolButtonStyle(theme)}
        className="menu-toggle-button-mobile"
        onClick={onClick || (() => {dispatch({action: "menu", toggle: toggleMenu})})}
        ref={ref}
        {...props}
    >
        {icon}
    </IconButton>
})

export default ToolButton
