import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { StateContext } from "../Contexts"
import FilePage from "../menus/FilePage"
import { getState } from "./testUtils"
import { sharePatternLink } from "../utils/share.js"
import { deserializeState, loadCloud, serializeState } from "../utils/files"

vi.mock("../utils/share.js", () => ({ sharePatternLink: vi.fn(() => Promise.resolve("shared")) }))

vi.mock("../utils/files", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    deleteCloud: vi.fn(() => Promise.resolve()),
    generateName: vi.fn(() => "Fresh Pattern"),
    getCloudSaves: vi.fn(() => Promise.resolve([{ name: "Cloud star" }])),
    getSaves: vi.fn(() => ({ "Local star": "<svg />" })),
    loadCloud: vi.fn(() => Promise.resolve({ lines: [] })),
    loadUsername: vi.fn(() => "cope"),
    saveCloud: vi.fn(() => Promise.resolve()),
    saveUsername: vi.fn(),
  }
})

function renderFilePage() {
  const state = getState()
  const renderedState = { ...state, username: "cope", openMenus: { ...state.openMenus, file: true } }
  const dispatch = vi.fn()
  const setUsername = vi.fn()
  render(
    <StateContext.Provider
      value={{
        state: renderedState,
        dispatch,
        username: "cope",
        setUsername,
      }}
    >
      <FilePage />
    </StateContext.Provider>,
  )
  return { dispatch, state: renderedState, setUsername }
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe("File Page", () => {
  test("keeps export and quick-sharing actions available", async () => {
    const { dispatch, state } = renderFilePage()
    await act(async () => {})
    loadCloud.mockResolvedValueOnce(deserializeState(serializeState(state)))

    fireEvent.click(screen.getByRole("tab", { name: "Import & Export" }))

    expect(screen.getByText("Download pattern")).not.toBeNull()
    expect(screen.getByText("Open pattern")).not.toBeNull()

    fireEvent.click(screen.getByRole("button", { name: "Copy image" }))
    fireEvent.click(screen.getByRole("button", { name: "Share link" }))
    fireEvent.click(screen.getByRole("button", { name: "Download" }))

    expect(dispatch).toHaveBeenCalledWith("copy_image")
    await waitFor(() => expect(sharePatternLink).toHaveBeenCalledWith("cope", state.filename))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ action: "download_file", format: "svg" }))
  })

  test("requires a current cloud save before sharing", async () => {
    const { dispatch } = renderFilePage()
    await act(async () => {})
    loadCloud.mockResolvedValueOnce(null)

    fireEvent.click(screen.getByRole("button", { name: "Share link" }))

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith({ toast: "Save this pattern to the cloud before sharing it" }),
    )
    expect(sharePatternLink).not.toHaveBeenCalled()
  })

  test("lists and operates on patterns saved in this browser", async () => {
    const { dispatch } = renderFilePage()
    await act(async () => {})

    expect(screen.getByText("Saved on this device")).not.toBeNull()
    fireEvent.click(screen.getByText("Local star"))
    fireEvent.click(screen.getByRole("button", { name: "Delete local pattern Local star" }))

    expect(dispatch).toHaveBeenCalledWith({ action: "load_local", name: "Local star" })
    expect(dispatch).toHaveBeenCalledWith({ action: "delete_local", name: "Local star" })
  })

  test("shows cloud patterns for the saved username", async () => {
    renderFilePage()

    fireEvent.click(screen.getByRole("tab", { name: "Cloud" }))

    await waitFor(() => expect(screen.getByText("Cloud star")).not.toBeNull())
    expect(screen.getByDisplayValue("cope")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Save to cloud" }).disabled).toBe(false)
  })
})
