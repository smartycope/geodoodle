import { describe, expect, test, vi } from "vitest"
import { createStateMachine } from "../stateMachine"

const makeMachine = (effect) =>
  createStateMachine({
    initial: "idle",
    context: { moves: 0, origin: null },
    states: {
      idle: {
        on: {
          START: {
            target: "pressed",
            update: ({ event }) => ({ origin: event.point }),
            effect,
          },
        },
      },
      pressed: {
        on: {
          MOVE: [
            {
              target: "gesture",
              guard: ({ event }) => event.touches === 2,
            },
            {
              target: "dragging",
              update: ({ context }) => ({ moves: context.moves + 1 }),
            },
          ],
        },
      },
      dragging: {},
      gesture: {},
    },
    on: { CANCEL: "idle" },
  })

describe("createStateMachine", () => {
  test("transitions and updates context without mutating the previous snapshot", () => {
    const machine = makeMachine()
    const initial = machine.getSnapshot()

    const next = machine.send("START", { point: { x: 2, y: 3 } })

    expect(next).toEqual({
      value: "pressed",
      context: { moves: 0, origin: { x: 2, y: 3 } },
    })
    expect(initial).toEqual({ value: "idle", context: { moves: 0, origin: null } })
    expect(machine.matches("pressed")).toBe(true)
  })

  test("uses the first guarded transition that matches", () => {
    const twoFingerMachine = makeMachine()
    twoFingerMachine.send("START", { point: null })
    twoFingerMachine.send({ type: "MOVE", touches: 2 })

    const oneFingerMachine = makeMachine()
    oneFingerMachine.send("START", { point: null })
    oneFingerMachine.send("MOVE", { touches: 1 })

    expect(twoFingerMachine.state).toBe("gesture")
    expect(oneFingerMachine.getSnapshot()).toMatchObject({
      value: "dragging",
      context: { moves: 1 },
    })
  })

  test("supports global transitions, effects, and subscriptions", () => {
    const effect = vi.fn()
    const listener = vi.fn()
    const machine = makeMachine(effect)
    const unsubscribe = machine.subscribe(listener)

    machine.send("START", { point: { x: 1, y: 1 } })
    machine.send("CANCEL")
    unsubscribe()
    machine.send("START", { point: null })

    expect(effect).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener.mock.calls[1][0].value).toBe("idle")
  })

  test("ignores unknown events and can reset context", () => {
    const machine = makeMachine()
    const initial = machine.getSnapshot()

    expect(machine.send("UNKNOWN")).toBe(initial)
    machine.send("START", { point: { x: 1, y: 1 } })
    machine.reset({ moves: 4 })

    expect(machine.getSnapshot()).toEqual({
      value: "idle",
      context: { moves: 4, origin: null },
    })
  })
})
