const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)

function toEvent(event, data) {
  const normalized = typeof event === "string" ? { ...data, type: event } : event

  if (!normalized || typeof normalized.type !== "string" || !normalized.type)
    throw new TypeError("State machine events need a non-empty string type")

  return normalized
}

function toTransition(candidate) {
  if (typeof candidate === "string") return { target: candidate }
  if (candidate && typeof candidate === "object") return candidate
  return null
}

/**
 * Creates a small synchronous state machine for browser event handlers.
 *
 * A transition may be a target state string, a transition object, or an array
 * of guarded transition objects. `update` returns a shallow context patch and
 * `effect` runs after the new snapshot has been published.
 *
 * @example
 * const gesture = createStateMachine({
 *   initial: "idle",
 *   context: { start: null },
 *   states: {
 *     idle: {
 *       on: {
 *         TOUCH_START: {
 *           target: "touching",
 *           update: ({ event }) => ({ start: event.point }),
 *         },
 *       },
 *     },
 *     touching: {
 *       on: {
 *         TOUCH_MOVE: [
 *           { guard: ({ event }) => event.touches.length === 2, target: "gesturing" },
 *           { target: "dragging" },
 *         ],
 *       },
 *     },
 *     dragging: {},
 *     gesturing: {},
 *   },
 *   on: { CANCEL: "idle" },
 * })
 *
 * gesture.send("TOUCH_START", { point })
 */
export function createStateMachine({ initial, context = {}, states, on: globalTransitions = {} }) {
  if (!states || typeof states !== "object") throw new TypeError("State machine states are required")
  if (!hasOwn(states, initial)) throw new Error(`Unknown initial state "${initial}"`)

  const initialContext = { ...context }
  let snapshot = { value: initial, context: { ...initialContext } }
  const listeners = new Set()

  function getSnapshot() {
    return snapshot
  }

  function matches(state) {
    return snapshot.value === state
  }

  function send(event, data = {}) {
    const normalizedEvent = toEvent(event, data)
    const stateTransitions = states[snapshot.value].on ?? {}
    const configuredTransition = hasOwn(stateTransitions, normalizedEvent.type)
      ? stateTransitions[normalizedEvent.type]
      : hasOwn(globalTransitions, normalizedEvent.type)
        ? globalTransitions[normalizedEvent.type]
        : undefined
    const candidates = Array.isArray(configuredTransition) ? configuredTransition : [configuredTransition]
    const transition = candidates.map(toTransition).find(
      (candidate) =>
        candidate &&
        (!candidate.guard ||
          candidate.guard({
            state: snapshot.value,
            context: snapshot.context,
            event: normalizedEvent,
          })),
    )

    if (!transition) return snapshot

    const previous = snapshot
    const target = transition.target ?? previous.value
    if (!hasOwn(states, target)) throw new Error(`Unknown target state "${target}"`)

    const patch = transition.update?.({
      state: previous.value,
      context: previous.context,
      event: normalizedEvent,
    })
    if (patch != null && (typeof patch !== "object" || Array.isArray(patch)))
      throw new TypeError("A state machine update must return an object, null, or undefined")

    snapshot = {
      value: target,
      context: patch == null ? previous.context : { ...previous.context, ...patch },
    }

    for (const listener of listeners) listener(snapshot, normalizedEvent, previous)

    transition.effect?.({
      state: snapshot.value,
      context: snapshot.context,
      event: normalizedEvent,
      previous,
      send,
    })

    return snapshot
  }

  function subscribe(listener) {
    if (typeof listener !== "function") throw new TypeError("A state machine listener must be a function")
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function reset(contextOverride = {}) {
    const previous = snapshot
    snapshot = {
      value: initial,
      context: { ...initialContext, ...contextOverride },
    }
    const resetEvent = { type: "@@RESET" }
    for (const listener of listeners) listener(snapshot, resetEvent, previous)
    return snapshot
  }

  return {
    get state() {
      return snapshot.value
    },
    get context() {
      return snapshot.context
    },
    getSnapshot,
    matches,
    reset,
    send,
    subscribe,
  }
}

export default createStateMachine
