interface PositionLike {
  x: number
  y: number
}

class Position implements PositionLike {
  static O = new Position(0, 0)

  static distancePow2(a: PositionLike, b: PositionLike) {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
  }

  static distance(a: PositionLike, b: PositionLike) {
    return Math.sqrt(this.distancePow2(a, b))
  }

  public x: number
  public y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  copy() {
    return new Position(this.x, this.y)
  }

  /**
   * - 抖动
   * @param amp 最大绝对抖动量
   * @param minimalAmp 最小绝对抖动量
   */
  dithering(amp: number, minimalAmp: number = 0) {
    this.x += Tools.randomSig() * _.random(minimalAmp, amp, true)
    this.y += Tools.randomSig() * _.random(minimalAmp, amp, true)
    return this
  }

  /**
   * - 直接移动
   * 1. 如果参数是极矢量，直接以此向量为移动向量
   * 2. 如果参数是矢量，直接移动到此向量位置处
   * @param speedVec
   */
  move(speedVec: PolarVector | Vector) {
    if (speedVec instanceof PolarVector) {
      const baseUint = new Vector(1, 0).rotate(speedVec.theta).multiply(speedVec.r)
      this.x += baseUint.x
      this.y += baseUint.y
    } else {
      this.x += speedVec.x
      this.y += speedVec.y
    }
    return this
  }

  /**
   * - 以pos为目的地（方向），移动speedValue的距离
   */
  moveTo(pos: PositionLike, speedValue: number) {
    if (!speedValue) {
      this.x = pos.x
      this.y = pos.y
    } else {
      const speedVec = Vector.unit(pos.x - this.x, pos.y - this.y).multiply(speedValue)
      this.x += speedVec.x
      this.y += speedVec.y
    }
    return this
  }

  equal(other: PositionLike, epsilon: number = 0) {
    return Math.abs(this.x - other.x) <= epsilon && Math.abs(this.y - other.y) <= epsilon
  }

  outOfBoundary(boundaryTL: PositionLike, boundaryBR: PositionLike, epsilon = 0) {
    return boundaryTL.x - this.x > epsilon || boundaryTL.y - this.y > epsilon || this.x - boundaryBR.x > epsilon || this.y - boundaryBR.y > epsilon
  }

  toString() {
    return `<${Tools.roundWithFixed(this.x, 1)}, ${Tools.roundWithFixed(this.y, 1)}>`
  }
}

class PolarVector {
  public r: number
  public theta: number

  /**
   * @param direction 角度制
   */
  constructor(length: number, direction: number) {
    this.r = length
    this.theta = (Math.PI / -180) * direction
  }

  /**
   * - 极向量的抖动
   * - 有两个纬度，[theta]抖动和[R]抖动
   */
  dithering(thetaAmp: number, rAmp?: number) {
    this.theta += Tools.randomSig() * Math.random() * thetaAmp
    if (rAmp) this.r += Tools.randomSig() * Math.random() * rAmp
    return this
  }

  multiply(f: number) {
    const p = this.copy()
    p.r *= f
    return p
  }

  normalize() {
    const p = this.copy()
    p.r = 1
    return p
  }

  copy() {
    const t = new PolarVector(0, 0)
    t.r = this.r
    t.theta = this.theta
    return t
  }

  toString() {
    return `(${Tools.roundWithFixed(this.r, 1)}, ${Tools.roundWithFixed(this.theta / Math.PI, 3)}π)`
  }
}

class Vector extends Position {
  static zero = new Vector(0, 0)

  static unit(x: number, y: number) {
    const u = new Vector(x, y)
    const dvd = u.length()
    return u.divide(dvd)
  }

  constructor(x: number, y: number) {
    super(x, y)
  }

  toPolar() {
    return new PolarVector(this.length(), Math.atan(this.y / this.x))
  }

  override copy() {
    return new Vector(this.x, this.y)
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  normalize() {
    const inv = 1 / this.length()
    return new Vector(this.x * inv, this.y * inv)
  }

  negate() {
    return new Vector(-1 * this.x, -1 * this.y)
  }

  add(v: Vector) {
    return new Vector(this.x + v.x, this.y + v.y)
  }

  subtract(v: Vector) {
    return new Vector(this.x - v.x, this.y - v.y)
  }

  multiply(f: number) {
    return new Vector(this.x * f, this.y * f)
  }

  divide(f: number) {
    const invF = 1 / f
    return new Vector(this.x * invF, this.y * invF)
  }

  rotate(angle: number, center: PositionLike = { x: 0, y: 0 }) {
    return new Vector(
      (this.x - center.x) * Math.cos(angle) - (this.y - center.y) * Math.sin(angle) + center.x,
      (this.x - center.x) * Math.sin(angle) + (this.y - center.y) * Math.cos(angle) + center.y
    )
  }
}
