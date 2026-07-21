import { render } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { ArtworkLayers } from "../drawing"
import { StateContext } from "../Contexts"
import getInitialState from "../states"
import TrellisLayer from "../classes/TrellisLayer"
import Line from "../classes/Line"
import Point from "../classes/Point"
import Dist from "../classes/Dist"
import { getLayerState } from "../utils/layers"
import { MAX_TRELLIS_CANDIDATES, MAX_TRELLIS_GROUPS } from "../utils/trellis"

describe("layer artwork compositing", () => {
  test("stacks visible layers bottom-to-top and shares Trellis safety budgets", () => {
    const state = getInitialState()
    const source = new Line(state, new Point(0, 0), new Point(2, 1))
    const makeTrellis = (id, name, origin) =>
      new TrellisLayer({ id, name, sourceOrigin: origin, sourceSize: new Dist(4, 4), lines: [source] })
    const bottom = makeTrellis("layer-1", "Bottom", new Point(0, 0))
    const top = makeTrellis("layer-2", "Top", new Point(8, 8))
    const hidden = state.layers[0].copy({ id: "layer-3", name: "Hidden", visible: false, lines: [source] })
    const document = { ...state, layers: [bottom, top, hidden], activeLayerId: top.id }
    const view = getLayerState(document, top)
    const visibleTiles = vi.spyOn(TrellisLayer.prototype, "visibleTiles")

    const { container } = render(
      <StateContext.Provider value={{ state: view, dispatch: vi.fn() }}>
        <svg>
          <ArtworkLayers />
        </svg>
      </StateContext.Provider>,
    )

    const composites = [...container.querySelectorAll('g[id^="artwork-"]')]
    expect(composites.map((group) => group.dataset.layerId)).toEqual(["layer-1", "layer-2"])
    expect(container.querySelector("#artwork-layer-3")).toBeNull()
    expect(container.querySelector("#trellis-layer-1")).not.toBeNull()
    expect(container.querySelector("#trellis")).not.toBeNull()
    expect(visibleTiles).toHaveBeenCalledTimes(2)
    visibleTiles.mock.calls.forEach((call) => {
      expect(call[3].maxGroups).toBe(Math.floor(MAX_TRELLIS_GROUPS / 2))
      expect(call[3].maxCandidates).toBe(Math.floor(MAX_TRELLIS_CANDIDATES / 2))
    })

    visibleTiles.mockRestore()
  })
})
