import { describe, expect, test, vi } from "vitest"
import { buildPatternShareUrl, getSharedPatternParams, syncPatternQueryParams } from "../shareUtils"

describe("pattern share links", () => {
  test("reads complete cloud pattern parameters", () => {
    expect(getSharedPatternParams({ search: "?user=cope&pattern=star%20burst" })).toEqual({
      user: "cope",
      pattern: "star burst",
    })
    expect(getSharedPatternParams({ search: "?user=cope" })).toBeNull()
  })

  test("builds a clean link to the current site", () => {
    const link = buildPatternShareUrl("cope", "star burst", {
      href: "https://example.com/geodoodle/?old=value#drawing",
    })

    expect(link).toBe("https://example.com/geodoodle/?user=cope&pattern=star+burst")
  })

  test("keeps live pattern parameters current while preserving other parameters", () => {
    const history = { state: {}, replaceState: vi.fn() }
    const location = {
      href: "https://example.com/geodoodle/?tour=true&user=old&pattern=old-name#drawing",
      pathname: "/geodoodle/",
      search: "?tour=true&user=old&pattern=old-name",
      hash: "#drawing",
    }

    syncPatternQueryParams("cope", "star burst", history, location)

    expect(history.replaceState).toHaveBeenCalledWith(
      history.state,
      "",
      "/geodoodle/?tour=true&user=cope&pattern=star+burst#drawing",
    )
  })
})
