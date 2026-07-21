// These are shared between the flip and rotate menus
// For reference,
/*
 *  {
 *     row: {
 *         every: 1,
 *         val: value
 *     },
 *     col: {
 *         every: 1,
 *         val: value
 *     },
 * }
 */

export const boxSx = (theme) => ({
  bgcolor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius / 2,
})
export const sharedProps = {
  exclusive: true,
  allowNone: true,
}
export const sharedButtonGroupProps = (theme) => ({
  // this value is coming from the "width" of the Number component, I believe
  height: "2.5rem",
  color: theme.palette.primary.main,
})

export const centeredVerticalLabelStyle = { alignItems: "center" }

export const updateDraft = (dispatch, key, value) => dispatch({ action: "update_trellis_draft", key, value })
export const numberAlpha = 0.8
export const numberProps = (theme) => ({
  textColor: theme.palette.primary.contrast,
  numberColor: theme.palette.text.primary,
  compact: false,
  bold: true,
  bgAlpha: numberAlpha,
})

// The grid should act as part of the background, but we still need to interact with the stuff it holds
export const gridItemSx = {
  display: "flex",
  alignItems: "center",
  "& *": {
    pointerEvents: "all",
  },
}
