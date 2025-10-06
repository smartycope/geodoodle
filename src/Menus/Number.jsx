import * as React from 'react';
import { Tooltip, useTheme } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { NumberField } from '@base-ui-components/react/number-field';
import styles from '../styling/number-field.module.css';

// Originally based on
// https://base-ui.com/react/components/number-field

// See for allowed props:
// https://base-ui.com/react/components/number-field#api-reference
export default function ({
    label,
    id,
    title,
    textColor,
    numberColor,
    inputId,
    onPlus,
    onMinus,
    scrubDirection='horizontal',
    compact,
    vertical,
    style,
    bgAlpha=0,
    bold,
    // slotProps,
    ...props
}){
    const reactid = React.useId();
    const reactinputid = React.useId();
    const theme = useTheme()

    id ||= reactid
    inputId ||= reactinputid
    textColor ||= theme.palette.text.primary
    numberColor ||= textColor

    if (props.snapOnStep && props.value && props.step)
        props.value = Math.round(props.value * 10**props.step) / 10**props.step

    const inputBorder = '1px solid var(--color-gray-200)'
    let width, height
    const other_dim = compact ? '2rem' : '2.5rem' // height if horizontal, width if vertical
    const dim = compact ? '2rem' : '5rem'
    if (vertical){
        width = other_dim
        height = dim
    } else {
        width = dim
        height = other_dim
    }

    const rtn = <NumberField.Root
            id={id}
            className={styles.Field}
            style={style}
            {...props}
        >
            <label htmlFor={id} className={styles.Label} style={{
                color: textColor,
                fontWeight: bold ? 'bold' : 'normal',
            }}>
            {label}
            </label>

        <NumberField.Group className={styles.Group} style={{
            flexDirection: vertical ? 'column-reverse' : 'row',
        }}>
            <NumberField.Decrement className={styles.Decrement} onClick={onMinus} style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: vertical ? undefined : 0,
                borderTopLeftRadius: vertical ? 0 : undefined,
                width: other_dim,
                height: other_dim,
                color: theme.palette.primary.main,
            }}>
            <Remove fontSize="small" />
            </NumberField.Decrement>
            {/* TODO: scrub direction doens't work */}
            {/* <NumberField.ScrubArea className={styles.ScrubArea} scrubDirection={scrubDirection}> */}
            <NumberField.ScrubArea className={styles.ScrubArea}>
                <NumberField.Input className={styles.Input} id={inputId} style={{color: numberColor, width, height,
                    borderTop: vertical ? 'none' : inputBorder,
                    borderBottom: vertical ? 'none' : inputBorder,
                    borderLeft: vertical ? inputBorder : 'none',
                    borderRight: vertical ? inputBorder : 'none',
                    backgroundColor: theme.alpha(theme.palette.background.default, bgAlpha),
                }}/>
            </NumberField.ScrubArea>
            <NumberField.Increment className={styles.Increment} onClick={onPlus} style={{
                borderTopLeftRadius: vertical ? undefined : 0,
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: vertical ? 0 : undefined,
                width: other_dim,
                height: other_dim,
                color: theme.palette.primary.main,
            }}>
            <Add fontSize="small" />
            </NumberField.Increment>
        </NumberField.Group>
    </NumberField.Root>

    if (title) return <Tooltip title={title}>{rtn}</Tooltip>
    else       return rtn
}

