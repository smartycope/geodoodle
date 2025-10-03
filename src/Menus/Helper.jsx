// A small wrapper component that adds a helper button (think tooltip, but more permanent)
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useRef, useState } from 'react';
import { IconButton, Popover, Stack, Typography } from '@mui/material';

export function Helper({children, helperText}){
    const [open, setOpen] = useState(false);
    const buttonRef = useRef()
    return <Stack direction="row" spacing={1}>
        {children}
        <IconButton ref={buttonRef} onClick={() => setOpen(!open)}><HelpOutlineIcon /></IconButton>
        <Popover
            open={open}
            onClose={() => setOpen(false)}
            anchorEl={buttonRef.current}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
        >
            <Typography variant="body2" sx={{p:1}}>{helperText}</Typography>
        </Popover>
    </Stack>
}