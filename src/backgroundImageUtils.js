const sampleSize = 64

export function averageImageColor(data) {
  let red = 0
  let green = 0
  let blue = 0
  let weight = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255
    red += data[index] * alpha
    green += data[index + 1] * alpha
    blue += data[index + 2] * alpha
    weight += alpha
  }

  if (!weight) return "#ffffff"
  const asHex = (value) =>
    Math.round(value / weight)
      .toString(16)
      .padStart(2, "0")
  return `#${asHex(red)}${asHex(green)}${asHex(blue)}`
}

export function readBackgroundImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Unable to read image file"))
    reader.onload = () => {
      const src = reader.result
      if (typeof src !== "string") {
        reject(new Error("Image file did not produce a data URL"))
        return
      }

      const image = new Image()
      image.onerror = () => reject(new Error("Unable to load image"))
      image.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = sampleSize
        canvas.height = sampleSize
        const context = canvas.getContext("2d", { willReadFrequently: true })
        if (!context) {
          reject(new Error("Unable to analyze image"))
          return
        }

        context.drawImage(image, 0, 0, sampleSize, sampleSize)
        resolve({ image: src, color: averageImageColor(context.getImageData(0, 0, sampleSize, sampleSize).data) })
      }
      image.src = src
    }
    reader.readAsDataURL(file)
  })
}
