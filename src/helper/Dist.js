import Pair from "./Pair"

export default class Dist extends Pair {
  static zero() {
    return new Dist(0, 0)
  }

  static fromDeflated(state_or_x, x_or_y, y = undefined) {
    if (typeof state_or_x === "number") return new Dist(state_or_x, x_or_y)
    return new Dist(x_or_y, y)
  }

  static fromInflated({ scalex, scaley }, x, y) {
    return new Dist(x / scalex, y / scaley)
  }

  asDeflated(state = undefined) {
    return { x: this._x, y: this._y }
  }

  asInflated({ scalex, scaley }) {
    return { x: this._x * scalex, y: this._y * scaley }
  }
}
