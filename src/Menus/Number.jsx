import * as React from "react"
import Tooltip from "@mui/material/Tooltip"
import { useTheme } from "@mui/material/styles"
import AddIcon from "@mui/icons-material/Add"
import RemoveIcon from "@mui/icons-material/Remove"
import { NumberField } from "@base-ui-components/react/number-field"
import styles from "../styling/number-field.module.css"
import { useContext } from "react"
import { StateContext } from "../Contexts"

// Originally based on
// https://base-ui.com/react/components/number-field

// See for allowed props:
// https://base-ui.com/react/components/number-field#api-reference
// (You want onValueChange, not onChange)
export default function Number({
  label,
  id,
  title,
  textColor,
  numberColor,
  inputId,
  onPlus,
  onMinus,
  // TODO
  scrubDirection = "horizontal",
  compact,
  vertical,
  style,
  bgAlpha = 0,
  bold,
  // slotProps,
  ...props
}) {
  const reactid = React.useId()
  const reactinputid = React.useId()
  const theme = useTheme()
  const { mobile } = useContext(StateContext)

  id ||= reactid
  inputId ||= reactinputid
  textColor ||= theme.palette.text.primary
  numberColor ||= textColor

  if (props.snapOnStep && props.value && props.step)
    props.value = Math.round(props.value * 10 ** props.step) / 10 ** props.step

  const inputBorder = "1px solid var(--color-gray-200)"
  let width, height
  const other_dim = compact ? "2rem" : "2.5rem" // height if horizontal, width if vertical
  const dim = compact ? "2rem" : "5rem"
  if (vertical) {
    width = other_dim
    height = dim
  } else {
    width = dim
    height = other_dim
  }

  const rtn = (
    <NumberField.Root id={id} className={styles.Field} style={style} {...props}>
      <label
        htmlFor={id}
        className={styles.Label}
        style={{
          color: textColor,
          fontWeight: bold ? "bold" : "normal",
        }}
      >
        {label}
      </label>

      <NumberField.Group
        className={styles.Group}
        style={{
          flexDirection: vertical ? "column-reverse" : "row",
          ...(vertical ? { display: "flex", alignItems: "center" } : {}),
        }}
      >
        <NumberField.Decrement
          className={styles.Decrement}
          onClick={onMinus}
          style={{
            borderBottomLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: 0,
            borderBottomRightRadius: vertical ? theme.shape.borderRadius : 0,
            borderTopLeftRadius: vertical ? 0 : theme.shape.borderRadius,
            width: other_dim,
            height: other_dim,
            color: theme.palette.primary.main,
          }}
        >
          <RemoveIcon fontSize="small" />
        </NumberField.Decrement>
        {/* TODO: scrub direction doens't work -- have it auto switch when vertical*/}
        {/* <NumberField.ScrubArea className={styles.ScrubArea} scrubDirection={scrubDirection}> */}
        <NumberField.ScrubArea className={styles.ScrubArea} pixelSensitivity={mobile ? 2 : 10}>
          <NumberField.Input
            className={styles.Input}
            id={inputId}
            style={{
              color: numberColor,
              width,
              height,
              borderTop: vertical ? "none" : inputBorder,
              borderBottom: vertical ? "none" : inputBorder,
              borderLeft: vertical ? inputBorder : "none",
              borderRight: vertical ? inputBorder : "none",
              backgroundColor: theme.alpha(theme.palette.background.default, bgAlpha),
            }}
          />
        </NumberField.ScrubArea>
        <NumberField.Increment
          className={styles.Increment}
          onClick={onPlus}
          style={{
            borderTopRightRadius: theme.shape.borderRadius,
            borderTopLeftRadius: vertical ? theme.shape.borderRadius : 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: vertical ? 0 : theme.shape.borderRadius,
            width: other_dim,
            height: other_dim,
            color: theme.palette.primary.main,
          }}
        >
          <AddIcon fontSize="small" />
        </NumberField.Increment>
      </NumberField.Group>
    </NumberField.Root>
  )

  if (title) return <Tooltip title={title}>{rtn}</Tooltip>
  else return rtn
}
