import { MIRROR_AXIS, MIRROR_ROT, MIRROR_TYPE } from "../globals"
import VerticalAlignCenterIcon from "@mui/icons-material/VerticalAlignCenter"
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap"
import DoDisturbAltIcon from "@mui/icons-material/DoDisturbAlt"
import TvOutlinedIcon from "@mui/icons-material/TvOutlined"
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined"
import SvgIcon from "@mui/material/SvgIcon"

// TODO: these should probably get updated to custom icons as well
export const MirrorAxisIcon = (axis) => {
  switch (axis) {
    case MIRROR_AXIS.Y:
      return <VerticalAlignCenterIcon transform="rotate(90)" />
    case MIRROR_AXIS.X:
      return <VerticalAlignCenterIcon />
    case MIRROR_AXIS.BOTH:
      return <ZoomOutMapIcon />
    case MIRROR_AXIS.NONE:
      return <DoDisturbAltIcon />
  }
}

const xy = 12
const r = 10
const dash = (r * Math.PI) / 2
const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  fill: "none",
  viewBox: "0 0 24 24",
  strokeWidth: "3",
  stroke: "currentColor",
}
const three_quarters = (dash) => ({
  strokeDasharray: `${dash * 3} ${dash}`,
  strokeDashoffset: dash,
})
const right = (dash) => ({
  strokeDasharray: dash * 3,
  strokeDashoffset: dash * 3,
})
const straight = (dash) => ({
  strokeDasharray: dash,
  strokeDashoffset: dash,
})
const quad = (dash) => ({
  strokeDasharray: `${dash - 2} 2`,
  strokeDashoffset: -1,
})
const half = (dash) => ({
  strokeDasharray: `${dash * 2}`,
  strokeDashoffset: dash,
})
const icon = (unscale, props) => (
  <circle cx={xy} cy={xy} r={r / unscale} strokeWidth={3 / unscale} fill="none" stroke="currentColor" {...props} />
)

// So we can return SVG instead of MUI icon, due to how SvgIcon doesn't render well inside of an existing svg element
// Copied from https://mui.com/material-ui/material-icons/?query=DoDisturbAlt&selected=DoDisturbAlt
const DoNotDisturbAltIconSvg = (
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20m6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9"></path>
)

// TODO: unscale is here so we can keep the scale aligned with the current scale
export const MirrorRotIcon = (rot, alt = false, unscale = 1, svgIcon = true) => {
  const d = dash / unscale
  let rtn
  switch (rot) {
    case MIRROR_ROT.RIGHT:
      rtn = icon(unscale, right(d))
      break
    case MIRROR_ROT.STRAIGHT:
      rtn = icon(unscale, alt ? half(d) : straight(d))
      break
    case MIRROR_ROT.QUAD:
      rtn = icon(unscale, alt ? three_quarters(d) : quad(d))
      break
    case MIRROR_ROT.NONE:
      rtn = alt ? icon(unscale) : DoNotDisturbAltIconSvg
      break
  }
  if (svgIcon)
    return (
      <SvgIcon>
        <svg {...svgProps}>{rtn}</svg>
      </SvgIcon>
    )
  else return rtn
}

export const MirrorTypeIcon = (type) => {
  switch (type) {
    case MIRROR_TYPE.CURSOR:
      return <NearMeOutlinedIcon transform="rotate(270)" />
    case MIRROR_TYPE.PAGE:
      return <TvOutlinedIcon />
  }
}

const CropOutlinedIconSvg = (
  <path
    strokeWidth={0.75}
    fill="currentColor"
    d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2z"
  ></path>
)

const diagonalLine = <line x1={24} y1={0} x2={0} y2={24} stroke={"currentColor"} strokeWidth={2} />

// Type can be any one of "generic", "specific", or "area"
export const SelectorIcon = (type, strike = false, svgIcon = true) => {
  let rtn

  if (type == "area")
    rtn = (
      <>
        {CropOutlinedIconSvg}
        {strike && diagonalLine}
      </>
    )
  else
    rtn = (
      <>
        <rect width={20} height={20} x={2} y={2} rx={type == "generic" ? 6 : 0} fillOpacity={0} strokeWidth={2} />
        {strike && diagonalLine}
      </>
    )

  if (svgIcon)
    return (
      <SvgIcon>
        <svg {...svgProps}>{rtn}</svg>
      </SvgIcon>
    )
  else return rtn
}
