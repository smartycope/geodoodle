import { needsImplementedError } from "../utils/misc"

// "Abstract"
export default class Layer {
  constructor({ id, name = "Layer", visible = true } = {}) {
    this.id = id
    this.name = name
    this.visible = visible
  }

  copy(updates = {}) {
    return new this.constructor({ ...this, ...updates })
  }

  get isEmpty() {
    return needsImplementedError("isEmpty")
  }

  toJSON() {
    return { ...this, type: this.constructor.name }
  }

  static createFromIndex(index = 1, updates = {}) {
    return new this({ id: `layer-${index}`, name: `Layer ${index}`, ...updates })
  }

  reset() {
    return needsImplementedError("reset")
  }
}
