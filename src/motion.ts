/// <reference path='./utils/math-utils.ts' />

/**
 * 位置接口
 */
interface PositionLike {
  x: number
  y: number
}

/**
 * 2D 位置类
 * 提供位置计算、移动等基础功能
 * 所有修改方法都就地修改并返回 this 以支持链式调用
 */
class Position implements PositionLike {
  /** 原点 (0, 0) - 只读，不可修改 */
  static get ORIGIN(): Position {
    return new Position(0, 0)
  }

  /**
   * 计算两点间的平方距离（比 distance 更快，用于比较）
   * @param a 第一个位置
   * @param b 第二个位置
   * @returns 平方距离
   */
  static distancePow2(a: PositionLike, b: PositionLike): number {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
  }

  /**
   * 计算两点间的欧几里得距离
   * @param a 第一个位置
   * @param b 第二个位置
   * @returns 距离
   */
  static distance(a: PositionLike, b: PositionLike): number {
    return Math.sqrt(this.distancePow2(a, b))
  }

  public x: number
  public y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  /**
   * 创建当前位置的副本
   * @returns 新的 Position 实例
   */
  copy(): Position {
    return new Position(this.x, this.y)
  }

  /**
   * 抖动 - 在当前位置添加随机偏移
   * @param amp 最大绝对抖动量
   * @param minimalAmp 最小绝对抖动量
   * @returns this（支持链式调用）
   */
  dithering(amp: number, minimalAmp: number = 0): this {
    this.x += MathUtils.randomSig() * _.random(minimalAmp, amp, true)
    this.y += MathUtils.randomSig() * _.random(minimalAmp, amp, true)
    return this
  }

  /**
   * 直接移动
   * - 如果参数是极矢量，直接以此向量为移动向量
   * - 如果参数是矢量，直接沿向量方向移动
   * @param speedVec 移动向量（极坐标或笛卡尔坐标）
   * @returns this（支持链式调用）
   */
  move(speedVec: PolarVector | Vector): this {
    if (speedVec instanceof PolarVector) {
      const baseUnit = new Vector(1, 0).rotate(speedVec.theta).multiply(speedVec.r)
      this.x += baseUnit.x
      this.y += baseUnit.y
    } else {
      this.x += speedVec.x
      this.y += speedVec.y
    }
    return this
  }

  /**
   * 向目标位置移动指定距离
   * @param pos 目标位置
   * @param speedValue 移动速度/距离，为 0 则瞬移到目标
   * @returns this（支持链式调用）
   */
  moveTo(pos: PositionLike, speedValue: number): this {
    if (!speedValue) {
      this.x = pos.x
      this.y = pos.y
    } else {
      const dx = pos.x - this.x
      const dy = pos.y - this.y
      // 已到达目标位置，无需移动
      if (dx === 0 && dy === 0) {
        return this
      }
      const speedVec = Vector.unit(dx, dy).multiply(speedValue)
      this.x += speedVec.x
      this.y += speedVec.y
    }
    return this
  }

  /**
   * 检查两个位置是否相等（在误差范围内）
   * @param other 另一个位置
   * @param epsilon 允许的误差
   * @returns 是否相等
   */
  equal(other: PositionLike, epsilon: number = 0): boolean {
    return Math.abs(this.x - other.x) <= epsilon && Math.abs(this.y - other.y) <= epsilon
  }

  /**
   * 检查位置是否超出边界
   * @param boundaryTL 边界左上角
   * @param boundaryBR 边界右下角
   * @param epsilon 允许的误差
   * @returns 是否超出边界
   */
  outOfBoundary(boundaryTL: PositionLike, boundaryBR: PositionLike, epsilon = 0): boolean {
    return boundaryTL.x - this.x > epsilon || boundaryTL.y - this.y > epsilon || this.x - boundaryBR.x > epsilon || this.y - boundaryBR.y > epsilon
  }

  toString(): string {
    return `<${MathUtils.roundWithFixed(this.x, 1)}, ${MathUtils.roundWithFixed(this.y, 1)}>`
  }
}

/**
 * 极坐标向量类
 * 使用长度和角度表示向量
 * 所有修改方法都就地修改并返回 this 以支持链式调用
 */
class PolarVector {
  public r: number
  public theta: number

  /**
   * 创建极坐标向量
   * @param length 向量长度
   * @param direction 角度（度数），使用屏幕坐标系（Y轴向下）
   */
  constructor(length: number, direction: number) {
    this.r = length
    this.theta = (Math.PI / -180) * direction
  }

  /**
   * 创建当前向量的副本
   * @returns 新的 PolarVector 实例
   */
  copy(): PolarVector {
    const t = new PolarVector(0, 0)
    t.r = this.r
    t.theta = this.theta
    return t
  }

  /**
   * 极向量的抖动
   * 有两个维度：theta 抖动和 r 抖动
   * @param thetaAmp 角度抖动幅度（弧度）
   * @param rAmp 长度抖动幅度
   * @returns this（支持链式调用）
   */
  dithering(thetaAmp: number, rAmp?: number): this {
    this.theta += MathUtils.randomSig() * Math.random() * thetaAmp
    if (rAmp) this.r += MathUtils.randomSig() * Math.random() * rAmp
    return this
  }

  /**
   * 乘以标量（就地修改）
   * @param f 缩放因子
   * @returns this（支持链式调用）
   */
  multiply(f: number): this {
    this.r *= f
    return this
  }

  /**
   * 归一化为单位长度（就地修改）
   * @returns this（支持链式调用）
   */
  normalize(): this {
    this.r = 1
    return this
  }

  toString(): string {
    return `(${MathUtils.roundWithFixed(this.r, 1)}, ${MathUtils.roundWithFixed(this.theta / Math.PI, 3)}π)`
  }
}

/**
 * 笛卡尔向量类
 * 继承自 Position，提供向量运算
 * 所有修改方法都就地修改并返回 this 以支持链式调用
 */
class Vector extends Position {
  /** 零向量 */
  static get zero(): Vector {
    return new Vector(0, 0)
  }

  /**
   * 创建指向 (x, y) 方向的单位向量
   * @param x X 分量
   * @param y Y 分量
   * @returns 新的单位向量
   * @throws 当 x 和 y 都为 0 时抛出错误
   */
  static unit(x: number, y: number): Vector {
    const len = Math.sqrt(x * x + y * y)
    if (len === 0) {
      throw new Error('Cannot create unit vector from zero vector (0, 0)')
    }
    const invLen = 1 / len
    return new Vector(x * invLen, y * invLen)
  }

  constructor(x: number, y: number) {
    super(x, y)
  }

  /**
   * 创建当前向量的副本
   * @returns 新的 Vector 实例
   */
  override copy(): Vector {
    return new Vector(this.x, this.y)
  }

  /**
   * 转换为极坐标向量
   * @returns 新的 PolarVector 实例
   */
  toPolar(): PolarVector {
    const angleRadians = Math.atan2(this.y, this.x)
    // 转换为度数并取反以匹配 PolarVector 的屏幕坐标系约定
    const angleDegrees = (angleRadians * -180) / Math.PI
    return new PolarVector(this.length(), angleDegrees)
  }

  /**
   * 计算向量长度
   * @returns 向量的欧几里得长度
   */
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  /**
   * 归一化为单位向量（就地修改）
   * @returns this（支持链式调用）
   * @throws 当向量为零向量时抛出错误
   */
  normalize(): this {
    const len = this.length()
    if (len === 0) {
      throw new Error('Cannot normalize zero vector')
    }
    const invLen = 1 / len
    this.x *= invLen
    this.y *= invLen
    return this
  }

  /**
   * 取反向量（就地修改）
   * @returns this（支持链式调用）
   */
  negate(): this {
    this.x *= -1
    this.y *= -1
    return this
  }

  /**
   * 向量加法（就地修改）
   * @param v 要加的向量
   * @returns this（支持链式调用）
   */
  add(v: Vector): this {
    this.x += v.x
    this.y += v.y
    return this
  }

  /**
   * 向量减法（就地修改）
   * @param v 要减的向量
   * @returns this（支持链式调用）
   */
  subtract(v: Vector): this {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  /**
   * 标量乘法（就地修改）
   * @param f 缩放因子
   * @returns this（支持链式调用）
   */
  multiply(f: number): this {
    this.x *= f
    this.y *= f
    return this
  }

  /**
   * 标量除法（就地修改）
   * @param f 除数
   * @returns this（支持链式调用）
   */
  divide(f: number): this {
    const invF = 1 / f
    this.x *= invF
    this.y *= invF
    return this
  }

  /**
   * 绕中心点旋转（就地修改）
   * @param angle 旋转角度（弧度）
   * @param center 旋转中心，默认为原点
   * @returns this（支持链式调用）
   */
  rotate(angle: number, center: PositionLike = { x: 0, y: 0 }): this {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const dx = this.x - center.x
    const dy = this.y - center.y
    this.x = dx * cos - dy * sin + center.x
    this.y = dx * sin + dy * cos + center.y
    return this
  }
}
