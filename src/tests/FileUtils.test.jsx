import { beforeEach, describe, expect, test, vi } from "vitest"
import {
  generateName,
  getCloudSaves,
  loadCloud,
  loadCloudUsername,
  requestServer,
  preservedStatesEqual,
  serializeState,
  deserializeState,
  saveCloud,
  saveCloudUsername,
} from "../fileUtils"
import Dist from "../helper/Dist"
import Point from "../helper/Point"

describe("preserved state", () => {
  test("preserves translation as a Dist through serialization", () => {
    const translation = new Dist(7, -3)

    const restored = deserializeState(serializeState({ lines: [], translation }))

    expect(restored.translation).toBeInstanceOf(Dist)
    expect(restored.translation.eq(translation)).toBe(true)
  })

  test("compares the current pattern with a serialized cloud copy", () => {
    const state = {
      lines: [],
      bounds: [],
      specificSelectors: [],
      genericSelectors: [],
      mirrorOrigins: [],
      filledPolys: [],
      translation: new Dist(7, -3),
      filename: "star",
    }
    const restored = deserializeState(serializeState(state))

    expect(preservedStatesEqual(state, restored)).toBe(true)
    expect(preservedStatesEqual({ ...state, filename: "changed" }, restored)).toBe(false)
  })
})

describe("cloud storage requests", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
    localStorage.clear()
  })

  test("waits for and returns a successful JSON response", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('[{"name":"star"}]'),
    })

    await expect(requestServer("GET", "saves?user=eq.cope")).resolves.toEqual([{ name: "star" }])
    expect(globalThis.fetch).toHaveBeenCalledWith("https://db.smartycope.org/saves?user=eq.cope", {
      method: "GET",
      headers: { "Accept-Profile": "geodoodle" },
    })
  })

  test("returns null for a successful response with no body", async () => {
    globalThis.fetch.mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue("") })

    await expect(requestServer("DELETE", "saves?name=eq.star")).resolves.toBeNull()
  })

  test("rejects when the server returns an error", async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: vi.fn().mockResolvedValue("permission denied"),
    })

    await expect(requestServer("GET", "saves")).rejects.toThrow("403 Forbidden")
  })

  test("returns an empty cloud-save list when no username is entered", async () => {
    await expect(getCloudSaves("")).resolves.toEqual([])
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  test("deserializes a saved cloud pattern instead of returning its database row", async () => {
    const mirrorOrigin = new Point(4, 7)
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        JSON.stringify([
          {
            name: "star",
            data: serializeState({
              lines: [],
              translation: new Dist(0, 0),
              mirrorOrigins: [{ origin: mirrorOrigin, axis: 1, rot: 0 }],
            }),
          },
        ]),
      ),
    })

    const restored = await loadCloud("cope", "star")

    expect(restored.lines).toEqual([])
    expect(restored.mirrorOrigins[0].origin).toBeInstanceOf(Point)
    expect(restored.mirrorOrigins[0].origin.eq(mirrorOrigin)).toBe(true)
  })

  test("updates an existing save with the same username and name", async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, text: vi.fn().mockResolvedValue('[{"id":1}]') })
      .mockResolvedValueOnce({ ok: true, text: vi.fn().mockResolvedValue("") })

    await saveCloud({ lines: [] }, "cope", "star")

    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      "https://db.smartycope.org/saves?user=eq.cope&name=eq.star",
      expect.objectContaining({ method: "PATCH" }),
    )
  })

  test("inserts a save when its username and name do not exist", async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ ok: true, text: vi.fn().mockResolvedValue("[]") })
      .mockResolvedValueOnce({ ok: true, text: vi.fn().mockResolvedValue("") })

    await saveCloud({ lines: [] }, "cope", "star")

    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      "https://db.smartycope.org/saves",
      expect.objectContaining({ method: "POST" }),
    )
  })

  test("persists the previously used cloud username", () => {
    saveCloudUsername("cope")

    expect(loadCloudUsername()).toBe("cope")
  })

  test("falls back to an unnamed pattern if memorable-name generation fails", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(1)

    expect(generateName(true)).toBe("Unnamed 1")

    random.mockRestore()
  })
})
