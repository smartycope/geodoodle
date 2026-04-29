// A basic abstraction for methods shared between Point and Dist

// Used to account for floating point inaccuracy
function finagleValue(val, epsilon){
  const dec = val % 1
  if (dec < .5 ? dec < epsilon : 1-dec < epsilon)
    val = Math.round(val)
  return val
}

export default class Pair {
  constructor(x, y) {
    this._x = x
    this._y = y
  }
  copy() {
    return new this.constructor(this._x, this._y)
  }

  // Threshold should be a Dist, but can accept a deflated number instead
  closeTo(other, ...threshold) {
    // slight optimization
    if (!threshold.length) return this.eq(other)
    const [tx, ty] = this.#interpretArgs(...threshold)
    return Math.abs(this._x - other._x) < tx && Math.abs(this._y - other._y) < ty
  }

  #interpretArgs(...args) {
    if (args.length === 1)
      if (args[0] instanceof Pair) return args[0].xy()
      else if (typeof args[0] === "number") return [args[0], args[0]]
      else {
        try {
          if ("x" in args[0] && "y" in args[0]) return [args[0].x, args[0].y]
          else if ("_x" in args[0] && "_y" in args[0]) return [args[0]._x, args[0]._y]
        } catch (e) {
          /**/
        }

        throw new Error(`Invalid argument ${args}`)
      }
    else if (args.length === 2) return args
    else throw new Error(`Invalid arguments ${args}`)
  }

  xy() {
    return [this._x, this._y]
  }
  hash() {
    return `${this._x}-${this._y}`
  }

  toJSON() {
    return { x: this._x, y: this._y }
  }
  static fromJSON(json) {
    return new this(json.x, json.y)
  }

  // Threshold should be a Dist, but can accept a deflated number instead
  in(points, ...threshold) {
    return points.some((i) => this.closeTo(i, ...threshold))
  }
  remove(points, ...threshold) {
    return points.filter((i) => !this.closeTo(i, ...threshold))
  }

  neg() {
    return new this.constructor(-this._x, -this._y)
  }
  // Accounts for floating point inaccuracy
  eq(...args) {
    const [x, y] = this.#interpretArgs(...args)
    const epsilon = 10 ** -6
    return finagleValue(this._x, epsilon) === finagleValue(x, epsilon) && finagleValue(this._y, epsilon) === finagleValue(y, epsilon)
  }
  // Does *not* account for floating point inaccuracy
  eqExact(...args) {
    const [x, y] = this.#interpretArgs(...args)
    return this._x === x && this._y === y
  }
  add(...args) {
    const [x, y] = this.#interpretArgs(...args)
    return new this.constructor(this._x + x, this._y + y)
  }
  sub(...args) {
    const [x, y] = this.#interpretArgs(...args)
    return new this.constructor(this._x - x, this._y - y)
  }
  div(...args) {
    const [x, y] = this.#interpretArgs(...args)
    return new this.constructor(this._x / x, this._y / y)
  }
  mul(...args) {
    const [x, y] = this.#interpretArgs(...args)
    return new this.constructor(this._x * x, this._y * y)
  }

  round(digits = 0) {
    if (!digits) return new this.constructor(Math.round(this._x), Math.round(this._y))
    return new this.constructor(Number(this._x.toFixed(digits)), Number(this._y.toFixed(digits)))
  }
  floor() {
    return new this.constructor(Math.floor(this._x), Math.floor(this._y))
  }
  ceil() {
    return new this.constructor(Math.ceil(this._x), Math.ceil(this._y))
  }
  clip({ xhigh, xlow, yhigh, ylow }) {
    return new this.constructor(Math.min(Math.max(this._x, xlow), xhigh), Math.min(Math.max(this._y, ylow), yhigh))
  }
  // Round to the nearest integer, if the internal floats are off by a small amount
  // Used to account for floating point inaccuracy
  finagle(digits=6){
    const epsilon = 10 ** -digits
    return new this.constructor(finagleValue(this._x, epsilon), finagleValue(this._y, epsilon))
  }
}
