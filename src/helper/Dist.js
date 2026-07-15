import Pair from "./Pair"
import { rotateCoordinates } from "../transformUtils"

export default class Dist extends Pair {
  static zero() {
    return new Dist(0, 0)
  }

  static fromDeflated(state_or_x, x_or_y, y = undefined) {
    if (typeof state_or_x === "number") return new Dist(state_or_x, x_or_y)
    return new Dist(x_or_y, y)
  }

  static fromInflated({ scalex, scaley, rotate = 0 }, x, y) {
    const unrotated = rotateCoordinates(x, y, -rotate)
    return new Dist(unrotated.x / scalex, unrotated.y / scaley)
  }

  // eslint-disable-next-line no-unused-vars
  asDeflated(state = undefined) {
    return { x: this._x, y: this._y }
  }

  asInflated({ scalex, scaley }) {
    return { x: this._x * scalex, y: this._y * scaley }
  }

  asViewport({ scalex, scaley, rotate = 0 }) {
    return rotateCoordinates(this._x * scalex, this._y * scaley, rotate)
  }
}
