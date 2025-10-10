import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { FormControl } from "@mui/material";
import { InputLabel } from "@mui/material";
import { Typography } from "@mui/material";


// TODO: sx should be more specific
export default function ToggleIconButtonGroup({
    buttons,
    label,
    value,
    onChange,
    labelInline,
    alwaysShowLabel,
    exclusive,
    allowNone,
    disabled=false,
    vertical,
    id,
    sx,
    buttonGroupSx,
    labelSx,
}) {
    return (
        <FormControl
            variant="outlined"
            fullWidth
            id={id}
            sx={{ position: "relative", ...sx }}
        >
            <InputLabel shrink sx={{ ml: -.75, fontWeight: 'bold', ...labelSx }}> {label} </InputLabel>

            <ToggleButtonGroup
                sx={{
                    // borderRadius: theme.shape.borderRadius/2,
                    display: 'flex',
                    flexDirection: vertical ? 'column' : 'row',
                }}
                orientation={vertical ? 'vertical' : 'horizontal'}
                value={value}
                exclusive={exclusive}
                onChange={(event, newValue) => (newValue !== null || allowNone) && onChange(newValue)}
                disabled={typeof disabled === 'boolean' ? disabled : false}
            >
                {buttons.map((btn, i) => (
                    <ToggleButton
                        key={btn.value}
                        value={btn.value}
                        disabled={typeof disabled === 'object' ? disabled[btn.value] : false}
                        sx={{
                            flexDirection: labelInline ? "row" : "column",
                            // When oriented vertically, expand vertically to ensure the icon and label both fit
                            flex: vertical ? 1 : undefined,
                            // So the first one ensures enough space for the label
                            minWidth: i === 0 && !vertical ? "3rem" : undefined,
                            textTransform: "none",
                            ...buttonGroupSx,
                        }}
                    >
                        {/* All the div does is add a space between the icon and the label */}
                        <div style={{ marginRight: labelInline ? '.5rem' : undefined, display: "flex", alignItems: "center" }}>{btn.icon}</div>
                        {(alwaysShowLabel || btn.value === value) && <Typography variant="caption">{btn.label}</Typography>}
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>
        </FormControl>
    );
}
