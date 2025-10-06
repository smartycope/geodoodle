import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FormControl } from "@mui/material";
import { InputLabel } from "@mui/material";
import { Typography } from "@mui/material";


export default function ToggleIconButtonGroup({ buttons, label, value, onChange, labelInline, exclusive, allowNone, sx }) {
    return (
        <FormControl
            variant="outlined"
            fullWidth
            sx={{ position: "relative", ...sx }}
        >
            <InputLabel shrink sx={{ ml: -.75, fontWeight: 'bold' }}> {label} </InputLabel>

            <ToggleButtonGroup
                value={value}
                exclusive={exclusive}
                onChange={(event, newValue) => (newValue !== null || allowNone) && onChange(newValue)}
            >
                {buttons.map((btn, i) => (
                    <ToggleButton
                        key={btn.value}
                        value={btn.value}
                        sx={{
                            flexDirection: labelInline ? "row" : "column",
                            // So the first one ensures enough space for the label
                            minWidth: i === 0 ? "3rem" : undefined,
                            textTransform: "none",
                        }}
                    >
                        {/* All the div does is add a space between the icon and the label */}
                        <div style={{ marginRight: labelInline ? '.5rem' : undefined, display: "flex", alignItems: "center" }}>{btn.icon}</div>
                        {btn.value === value && <Typography variant="caption">{btn.label}</Typography>}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </FormControl>
    );
}
