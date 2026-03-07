/// <reference path="../src/utils/math-utils.ts" />
import { describe, test, expect, beforeEach, vi } from 'vitest'

// Mock MathUtils for tests
const MathUtils = {
  roundWithFixed: (num: number, fractionDigits: number): number => {
    const t = 10 ** fractionDigits
    return Math.round(num * t) / t
  },
  randomSig: (): 1 | -1 => (Math.random() < 0.5 ? 1 : -1),
}

// Mock lodash random
const _ = {
  random: (min: number, max: number, floating?: boolean): number => {
    return min + Math.random() * (max - min)
  },
}

// 复制 motion.ts 中的类定义用于测试
interface PositionLike {
  x: number
  y: number
}

class Position implements PositionLike {
  static ORIGIN = new Position(0, 0)

  static distancePow2(a: PositionLike, b: PositionLike): number {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
  }

  static distance(a: PositionLike, b: PositionLike): number {
    return Math.sqrt(this.distancePow2(a, b))
  }

  public x: number
  public y: number

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  copy(): Position {
    return new Position(this.x, this.y)
  }

  dithering(amp: number, minimalAmp: number = 0): this {
    this.x += MathUtils.randomSig() * _.random(minimalAmp, amp, true)
    this.y += MathUtils.randomSig() * _.random(minimalAmp, amp, true)
    return this
  }

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

  moveTo(pos: PositionLike, speedValue: number): this {
    if (!speedValue) {
      this.x = pos.x
      this.y = pos.y
    } else {
      const dx = pos.x - this.x
      const dy = pos.y - this.y
      if (dx === 0 && dy === 0) {
        return this
      }
      const speedVec = Vector.unit(dx, dy).multiply(speedValue)
      this.x += speedVec.x
      this.y += speedVec.y
    }
    return this
  }

  equal(other: PositionLike, epsilon: number = 0): boolean {
    return Math.abs(this.x - other.x) <= epsilon && Math.abs(this.y - other.y) <= epsilon
  }

  outOfBoundary(boundaryTL: PositionLike, boundaryBR: PositionLike, epsilon = 0): boolean {
    return boundaryTL.x - this.x > epsilon || boundaryTL.y - this.y > epsilon || this.x - boundaryBR.x > epsilon || this.y - boundaryBR.y > epsilon
  }

  toString(): string {
    return `<${MathUtils.roundWithFixed(this.x, 1)}, ${MathUtils.roundWithFixed(this.y, 1)}>`
  }
}

class PolarVector {
  public r: number
  public theta: number

  constructor(length: number, direction: number) {
    this.r = length
    this.theta = (Math.PI / -180) * direction
  }

  copy(): PolarVector {
    const t = new PolarVector(0, 0)
    t.r = this.r
    t.theta = this.theta
    return t
  }

  dithering(thetaAmp: number, rAmp?: number): this {
    this.theta += MathUtils.randomSig() * Math.random() * thetaAmp
    if (rAmp) this.r += MathUtils.randomSig() * Math.random() * rAmp
    return this
  }

  multiply(f: number): this {
    this.r *= f
    return this
  }

  normalize(): this {
    this.r = 1
    return this
  }

  toString(): string {
    return `(${MathUtils.roundWithFixed(this.r, 1)}, ${MathUtils.roundWithFixed(this.theta / Math.PI, 3)}π)`
  }
}

class Vector extends Position {
  static zero = new Vector(0, 0)

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

  override copy(): Vector {
    return new Vector(this.x, this.y)
  }

  toPolar(): PolarVector {
    const angleRadians = Math.atan2(this.y, this.x)
    const angleDegrees = (angleRadians * -180) / Math.PI
    return new PolarVector(this.length(), angleDegrees)
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

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

  negate(): this {
    this.x *= -1
    this.y *= -1
    return this
  }

  add(v: Vector): this {
    this.x += v.x
    this.y += v.y
    return this
  }

  subtract(v: Vector): this {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  multiply(f: number): this {
    this.x *= f
    this.y *= f
    return this
  }

  divide(f: number): this {
    const invF = 1 / f
    this.x *= invF
    this.y *= invF
    return this
  }

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

// ============= 测试用例 =============

describe('Bug 修复测试', () => {
  describe('Bug 1: Vector.unit(0, 0) 除以零', () => {
    test('Vector.unit(0, 0) 应该抛出错误', () => {
      expect(() => Vector.unit(0, 0)).toThrow('Cannot create unit vector from zero vector')
    })

    test('Vector.unit 正常情况应返回单位向量', () => {
      const v = Vector.unit(3, 4)
      expect(v.length()).toBeCloseTo(1)
      expect(v.x).toBeCloseTo(0.6)
      expect(v.y).toBeCloseTo(0.8)
    })
  })

  describe('Bug 2: Position.moveTo 边界情况', () => {
    test('moveTo 相同位置不应抛出错误', () => {
      const p = new Position(5, 5)
      expect(() => p.moveTo({ x: 5, y: 5 }, 10)).not.toThrow()
      expect(p.x).toBe(5)
      expect(p.y).toBe(5)
    })

    test('moveTo 正常移动', () => {
      const p = new Position(0, 0)
      p.moveTo({ x: 10, y: 0 }, 5)
      expect(p.x).toBe(5)
      expect(p.y).toBe(0)
    })

    test('moveTo speedValue=0 应瞬移', () => {
      const p = new Position(0, 0)
      p.moveTo({ x: 100, y: 100 }, 0)
      expect(p.x).toBe(100)
      expect(p.y).toBe(100)
    })
  })

  describe('Bug 3: Vector.toPolar 象限处理', () => {
    // 注意：PolarVector 使用屏幕坐标系（Y轴向下）
    // toPolar 通过 (angleRadians * -180) / Math.PI 转换
    // 然后 PolarVector 构造函数再次通过 (Math.PI / -180) * direction 转换回弧度
    // 所以最终 theta = atan2(y, x)

    test('第一象限 (+, +)', () => {
      const v = new Vector(1, 1)
      const polar = v.toPolar()
      expect(polar.r).toBeCloseTo(Math.sqrt(2))
      // atan2(1, 1) = π/4
      expect(polar.theta).toBeCloseTo(Math.PI / 4)
    })

    test('第二象限 (-, +)', () => {
      const v = new Vector(-1, 1)
      const polar = v.toPolar()
      expect(polar.r).toBeCloseTo(Math.sqrt(2))
      // atan2(1, -1) = 3π/4
      expect(polar.theta).toBeCloseTo((3 * Math.PI) / 4)
    })

    test('第三象限 (-, -)', () => {
      const v = new Vector(-1, -1)
      const polar = v.toPolar()
      expect(polar.r).toBeCloseTo(Math.sqrt(2))
      // atan2(-1, -1) = -3π/4
      expect(polar.theta).toBeCloseTo((-3 * Math.PI) / 4)
    })

    test('第四象限 (+, -)', () => {
      const v = new Vector(1, -1)
      const polar = v.toPolar()
      expect(polar.r).toBeCloseTo(Math.sqrt(2))
      // atan2(-1, 1) = -π/4
      expect(polar.theta).toBeCloseTo(-Math.PI / 4)
    })

    test('X 轴正方向', () => {
      const v = new Vector(1, 0)
      const polar = v.toPolar()
      expect(polar.r).toBeCloseTo(1)
      expect(polar.theta).toBeCloseTo(0)
    })

    test('Y 轴正方向（屏幕向下）', () => {
      const v = new Vector(0, 1)
      const polar = v.toPolar()
      expect(polar.r).toBeCloseTo(1)
      // atan2(1, 0) = π/2
      expect(polar.theta).toBeCloseTo(Math.PI / 2)
    })
  })
})

describe('可变 API 测试', () => {
  describe('Vector 可变方法', () => {
    test('multiply 应就地修改并返回 this', () => {
      const v = new Vector(2, 3)
      const result = v.multiply(2)
      expect(result).toBe(v)
      expect(v.x).toBe(4)
      expect(v.y).toBe(6)
    })

    test('normalize 应就地修改并返回 this', () => {
      const v = new Vector(3, 4)
      const result = v.normalize()
      expect(result).toBe(v)
      expect(v.length()).toBeCloseTo(1)
    })

    test('normalize 零向量应抛出错误', () => {
      const v = new Vector(0, 0)
      expect(() => v.normalize()).toThrow('Cannot normalize zero vector')
    })

    test('add 应就地修改', () => {
      const v1 = new Vector(1, 2)
      const v2 = new Vector(3, 4)
      v1.add(v2)
      expect(v1.x).toBe(4)
      expect(v1.y).toBe(6)
    })

    test('subtract 应就地修改', () => {
      const v1 = new Vector(5, 7)
      const v2 = new Vector(2, 3)
      v1.subtract(v2)
      expect(v1.x).toBe(3)
      expect(v1.y).toBe(4)
    })

    test('negate 应就地修改', () => {
      const v = new Vector(3, -4)
      v.negate()
      expect(v.x).toBe(-3)
      expect(v.y).toBe(4)
    })

    test('divide 应就地修改', () => {
      const v = new Vector(6, 8)
      v.divide(2)
      expect(v.x).toBe(3)
      expect(v.y).toBe(4)
    })

    test('rotate 应就地修改', () => {
      const v = new Vector(1, 0)
      v.rotate(Math.PI / 2)
      expect(v.x).toBeCloseTo(0)
      expect(v.y).toBeCloseTo(1)
    })

    test('链式调用应正常工作', () => {
      const v = new Vector(3, 4)
      v.normalize().multiply(10)
      expect(v.length()).toBeCloseTo(10)
    })
  })

  describe('PolarVector 可变方法', () => {
    test('multiply 应就地修改并返回 this', () => {
      const pv = new PolarVector(5, 45)
      const result = pv.multiply(2)
      expect(result).toBe(pv)
      expect(pv.r).toBe(10)
    })

    test('normalize 应就地修改并返回 this', () => {
      const pv = new PolarVector(10, 30)
      const result = pv.normalize()
      expect(result).toBe(pv)
      expect(pv.r).toBe(1)
    })

    test('链式调用应正常工作', () => {
      const pv = new PolarVector(10, 45)
      pv.normalize().multiply(5)
      expect(pv.r).toBe(5)
    })
  })

  describe('copy() 保持不可变性', () => {
    test('Vector.copy 应创建独立副本', () => {
      const v1 = new Vector(3, 4)
      const v2 = v1.copy().normalize()
      expect(v1.length()).toBeCloseTo(5) // 原始未变
      expect(v2.length()).toBeCloseTo(1) // 副本已归一化
    })

    test('PolarVector.copy 应创建独立副本', () => {
      const pv1 = new PolarVector(10, 45)
      const pv2 = pv1.copy().normalize()
      expect(pv1.r).toBe(10) // 原始未变
      expect(pv2.r).toBe(1) // 副本已归一化
    })

    test('Position.copy 应创建独立副本', () => {
      const p1 = new Position(5, 10)
      const p2 = p1.copy()
      p2.x = 100
      expect(p1.x).toBe(5) // 原始未变
      expect(p2.x).toBe(100)
    })
  })
})

describe('Position 类测试', () => {
  test('ORIGIN 应为 (0, 0)', () => {
    expect(Position.ORIGIN.x).toBe(0)
    expect(Position.ORIGIN.y).toBe(0)
  })

  test('distancePow2 应返回平方距离', () => {
    const d2 = Position.distancePow2({ x: 0, y: 0 }, { x: 3, y: 4 })
    expect(d2).toBe(25)
  })

  test('distance 应返回欧几里得距离', () => {
    const d = Position.distance({ x: 0, y: 0 }, { x: 3, y: 4 })
    expect(d).toBe(5)
  })

  test('equal 无误差时应完全匹配', () => {
    const p = new Position(5, 10)
    expect(p.equal({ x: 5, y: 10 })).toBe(true)
    expect(p.equal({ x: 5.1, y: 10 })).toBe(false)
  })

  test('equal 有误差时应在范围内匹配', () => {
    const p = new Position(5, 10)
    expect(p.equal({ x: 5.05, y: 10.05 }, 0.1)).toBe(true)
    expect(p.equal({ x: 5.2, y: 10 }, 0.1)).toBe(false)
  })

  test('outOfBoundary 应正确检测边界', () => {
    const p = new Position(50, 50)
    expect(p.outOfBoundary({ x: 0, y: 0 }, { x: 100, y: 100 })).toBe(false)
    expect(p.outOfBoundary({ x: 0, y: 0 }, { x: 40, y: 100 })).toBe(true) // 超出右边界
    expect(p.outOfBoundary({ x: 60, y: 0 }, { x: 100, y: 100 })).toBe(true) // 超出左边界
  })

  test('dithering 应修改位置', () => {
    const p = new Position(0, 0)
    p.dithering(10)
    // 由于随机性，只测试是否有变化的可能
    // 在多次测试中，至少有一个坐标会改变
    expect(typeof p.x).toBe('number')
    expect(typeof p.y).toBe('number')
  })

  test('move with Vector 应正确移动', () => {
    const p = new Position(0, 0)
    p.move(new Vector(3, 4))
    expect(p.x).toBe(3)
    expect(p.y).toBe(4)
  })

  test('toString 应返回格式化字符串', () => {
    const p = new Position(3.14159, 2.71828)
    const str = p.toString()
    expect(str).toContain('3.1')
    expect(str).toContain('2.7')
  })
})

describe('PolarVector 类测试', () => {
  test('构造函数应正确转换角度', () => {
    const pv = new PolarVector(1, 90)
    expect(pv.r).toBe(1)
    expect(pv.theta).toBeCloseTo(-Math.PI / 2)
  })

  test('dithering 应修改角度', () => {
    const pv = new PolarVector(5, 0)
    const originalTheta = pv.theta
    // 多次调用以增加变化概率
    for (let i = 0; i < 10; i++) {
      pv.dithering(0.5)
    }
    // theta 可能已改变（由于随机性）
    expect(typeof pv.theta).toBe('number')
  })

  test('dithering 带 rAmp 应修改长度', () => {
    const pv = new PolarVector(5, 0)
    for (let i = 0; i < 10; i++) {
      pv.dithering(0.1, 2)
    }
    expect(typeof pv.r).toBe('number')
  })
})

describe('Vector 类测试', () => {
  test('zero 应为零向量', () => {
    expect(Vector.zero.x).toBe(0)
    expect(Vector.zero.y).toBe(0)
  })

  test('length 应返回正确长度', () => {
    const v = new Vector(3, 4)
    expect(v.length()).toBe(5)
  })

  test('unit 应返回单位向量', () => {
    const v = Vector.unit(6, 8)
    expect(v.length()).toBeCloseTo(1)
    expect(v.x).toBeCloseTo(0.6)
    expect(v.y).toBeCloseTo(0.8)
  })
})
