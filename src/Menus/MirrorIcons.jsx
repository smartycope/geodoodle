import { MIRROR_AXIS, MIRROR_ROT, MIRROR_TYPE } from "../globals"
import VerticalAlignCenterIcon from "@mui/icons-material/VerticalAlignCenter"
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap"
import DoDisturbAltIcon from "@mui/icons-material/DoDisturbAlt"
import TvOutlinedIcon from "@mui/icons-material/TvOutlined"
import NearMeOutlinedIcon from "@mui/icons-material/NearMeOutlined"
import SvgIcon from "@mui/material/SvgIcon"

// TODO: these should probably get updated to custom icons as well
export const MirrorAxisIcon = (axis, unscale = 1) => {
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
  <SvgIcon>
    <svg {...svgProps}>
      <circle cx={xy} cy={xy} r={r / unscale} strokeWidth={3 / unscale} {...props} />
    </svg>
  </SvgIcon>
)

// TODO: unscale is here so we can keep the scale aligned with the current scale
// It doesn't currently work or used anywhere at the moment
export const MirrorRotIcon = (rot, alt = false, unscale = 1) => {
  const d = dash / unscale
  switch (rot) {
    case MIRROR_ROT.RIGHT:
      return icon(unscale, right(d))
    case MIRROR_ROT.STRAIGHT:
      return icon(unscale, alt ? half(d) : straight(d))
    case MIRROR_ROT.QUAD:
      return icon(unscale, alt ? three_quarters(d) : quad(d))
    case MIRROR_ROT.NONE:
      return alt ? icon(unscale) : <DoDisturbAltIcon />
  }
}

export const MirrorTypeIcon = (type) => {
  switch (type) {
    case MIRROR_TYPE.CURSOR:
      return <NearMeOutlinedIcon transform="rotate(270)" />
    case MIRROR_TYPE.PAGE:
      return <TvOutlinedIcon />
  }
}
