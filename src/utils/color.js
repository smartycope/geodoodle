import Color from "colorjs.io"

// Source - https://stackoverflow.com/a/36481059
// Posted by Maxwell Collard, modified by community. See post 'Timeline' for change history
// Retrieved 2026-07-18, License - CC BY-SA 4.0
// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random() // Converting [0,1) to (0,1]
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean
}

export function randomizeColor(basedOn) {
  const background = new Color(basedOn)
  const [lightness, chroma] = background.oklch
  const lightnessChange = gaussianRandom(0.33, 0.1)

  return new Color("oklch", [
    lightness + (lightness < 0.5 ? lightnessChange : -lightnessChange),
    chroma + gaussianRandom(0.2, 0.1),
    Math.random() * 360,
  ])
    .to("srgb")
    .toString({ format: "hex" })
}

// Return a color that shows up well on the given color so you can read text
export function getShowableStroke(color) {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)

  // Calculate perceived brightness (YIQ formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? "black" : "white"
}
