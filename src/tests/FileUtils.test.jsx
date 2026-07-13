import { beforeEach, describe, expect, test, vi } from "vitest"
import {
  getCloudSaves,
  loadCloud,
  loadCloudUsername,
  requestServer,
  saveCloud,
  saveCloudUsername,
} from "../fileUtils"
import { version } from "../globals"

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
    globalThis.fetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue(
        JSON.stringify([
          {
            name: "star",
            data: JSON.stringify({ version, lines: [], translation: { x: 0, y: 0 } }),
          },
        ]),
      ),
    })

    await expect(loadCloud("cope", "star")).resolves.toMatchObject({ lines: [] })
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
})
