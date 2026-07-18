import { describe, expect, test } from "vitest"
import { buildPatternShareUrl, getSharedPatternParams } from "../shareUtils"

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
})
