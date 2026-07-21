import { describe, expect, test } from "vitest"
import { averageImageColor } from "../utils/backgroundImage"

describe("averageImageColor", () => {
  test("averages opaque pixels and ignores transparent pixels", () => {
    expect(averageImageColor(new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 0]))).toBe("#800080")
  })
})
