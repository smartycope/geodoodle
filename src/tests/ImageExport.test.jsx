import { afterEach, describe, expect, test, vi } from "vitest"
import { image } from "../utils/files"
import Line from "../helper/Line"
import Point from "../helper/Point"
import Rect from "../helper/Rect"
import { getState } from "./testUtils"

describe("image export", () => {
  afterEach(() => {
    document.querySelector("#canvas")?.remove()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  test("uses the complete scaled line bounds with a small margin on every side", () => {
    const state = getState()
    const line = new Line(state, new Point(5, 7), new Point(15, 20))
    const rect = Rect.fromPoints(...line.points())
    const context = {
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      fillStyle: "",
    }
    const canvas = document.createElement("canvas")
    canvas.id = "canvas"
    canvas.getContext = vi.fn(() => context)
    canvas.toBlob = vi.fn((callback) => callback(new Blob(["image"])))
    document.body.appendChild(canvas)

    let exportedImage
    vi.stubGlobal(
      "Image",
      class {
        constructor() {
          exportedImage = this
        }
      },
    )
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:image"),
      revokeObjectURL: vi.fn(),
    })
    const callback = vi.fn()

    image({ ...state, lines: [line] }, "png", rect, false, false, callback, true)
    exportedImage.onload()

    expect(exportedImage.width).toBe(10 * state.scalex + 20)
    expect(exportedImage.height).toBe(13 * state.scaley + 20)
    expect(canvas.width).toBe(exportedImage.width)
    expect(canvas.height).toBe(exportedImage.height)
    expect(context.drawImage).toHaveBeenCalledWith(exportedImage, 10, 10)
    expect(callback).toHaveBeenCalledOnce()
  })
})
