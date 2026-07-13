import { afterEach, describe, expect, test, vi } from "vitest"
import { shareCurrentPage } from "../shareUtils"

describe("File Page sharing", () => {
  afterEach(() => {
    delete navigator.share
    vi.restoreAllMocks()
  })

  test("shares the current page through the Web Share API", async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "share", { configurable: true, value: share })

    await expect(shareCurrentPage()).resolves.toBe(true)
    expect(share).toHaveBeenCalledWith({
      title: "Check this out!",
      text: "Here's something cool.",
      url: window.location.href,
    })
  })

  test("reports when sharing is unavailable", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {})

    await expect(shareCurrentPage()).resolves.toBe(false)
    expect(alert).toHaveBeenCalledWith("Share not supported")
  })
})
