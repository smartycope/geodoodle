import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import Paper from "../Paper"
import Line from "../helper/Line"
import Point from "../helper/Point"
import {
  getSaves,
  loadCloud,
  loadPreservedState,
  preserveState,
  saveCloudUsername,
  validateStorage,
} from "../fileUtils"
import { getState } from "./testUtils"

vi.mock("../fileUtils", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, loadCloud: vi.fn() }
})

const pattern = (name, offset) => {
  const state = getState()
  return {
    ...state,
    filename: name,
    lines: [new Line(state, new Point(offset, offset), new Point(offset + 2, offset + 2))],
  }
}

const renderSharedLink = (local, shared) => {
  preserveState(local)
  loadCloud.mockResolvedValueOnce(shared)
  window.history.replaceState({}, "", "/geodoodle/?user=cope&pattern=shared-star")
  return render(<Paper setDispatch={vi.fn()} />)
}

beforeEach(() => {
  localStorage.clear()
  validateStorage()
  vi.clearAllMocks()
})

afterEach(() => window.history.replaceState({}, "", "/geodoodle/"))

describe("shared pattern startup", () => {
  test("keeps the URL current as the pattern name changes", async () => {
    const local = pattern("Work in progress", 1)
    preserveState(local)
    saveCloudUsername("cope")
    window.history.replaceState({}, "", "/geodoodle/")
    let paperDispatch

    render(<Paper setDispatch={(dispatch) => (paperDispatch = dispatch)} />)

    await waitFor(() => expect(window.location.search).toBe("?user=cope&pattern=Work+in+progress"))
    act(() => paperDispatch({ filename: "Renamed pattern" }))
    await waitFor(() => expect(window.location.search).toBe("?user=cope&pattern=Renamed+pattern"))
  })

  test("does not reopen the share dialog when the URL already identifies the local workspace", async () => {
    const local = pattern("Work in progress", 1)
    preserveState(local)
    saveCloudUsername("cope")
    window.history.replaceState({}, "", "/geodoodle/?user=cope&pattern=Work+in+progress")

    render(<Paper setDispatch={vi.fn()} />)

    await waitFor(() => expect(loadPreservedState().filename).toBe("Work in progress"))
    expect(loadCloud).not.toHaveBeenCalled()
    expect(screen.queryByRole("dialog", { name: "Save your current pattern?" })).toBeNull()
  })

  test("loads the shared pattern immediately when there is no preserved drawing", async () => {
    const local = { ...getState(), filename: "Empty", lines: [] }
    const shared = pattern("shared-star", 10)
    renderSharedLink(local, shared)

    await waitFor(() => expect(loadPreservedState().filename).toBe("shared-star"))
    expect(screen.queryByRole("dialog", { name: "Save your current pattern?" })).toBeNull()
  })

  test("can save the current drawing locally before loading the shared pattern", async () => {
    const local = pattern("Work in progress", 1)
    const shared = pattern("shared-star", 10)
    renderSharedLink(local, shared)

    await screen.findByRole("dialog", { name: "Save your current pattern?" })
    fireEvent.change(screen.getByLabelText("Current pattern name"), { target: { value: "Backup" } })
    fireEvent.click(screen.getByRole("button", { name: "Save & load" }))

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Save your current pattern?" })).toBeNull())
    expect(getSaves().Backup).toBeTruthy()
    expect(loadPreservedState().filename).toBe("shared-star")
    expect(loadPreservedState().lines[0].a.eq(shared.lines[0].a)).toBe(true)
  })

  test("can ignore the current drawing and load the shared pattern", async () => {
    const local = pattern("Work in progress", 1)
    const shared = pattern("shared-star", 10)
    renderSharedLink(local, shared)

    await screen.findByRole("dialog", { name: "Save your current pattern?" })
    fireEvent.click(screen.getByRole("button", { name: "Ignore & load" }))

    await waitFor(() => expect(loadPreservedState().filename).toBe("shared-star"))
    expect(Object.keys(getSaves())).toHaveLength(0)
  })

  test("can cancel without replacing the current drawing", async () => {
    const local = pattern("Work in progress", 1)
    const shared = pattern("shared-star", 10)
    renderSharedLink(local, shared)

    await screen.findByRole("dialog", { name: "Save your current pattern?" })
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(loadPreservedState().filename).toBe("Work in progress")
    await waitFor(() => expect(window.location.search).toBe("?user=&pattern=Work+in+progress"))
  })
})
