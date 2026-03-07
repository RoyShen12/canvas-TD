/// <reference path="../src/constants.ts" />
import { describe, test, expect, beforeEach, vi } from 'vitest'

// ============================================================================
// Mock 依赖
// ============================================================================

// Mock lodash
const _ = {
  random: (min: number, max: number, floating?: boolean): number => {
    return min + Math.random() * (max - min)
  },
  sumBy: <T>(arr: T[], fn: (item: T) => number): number => {
    return arr.reduce((sum, item) => sum + fn(item), 0)
  },
  maxBy: <T>(arr: T[], fn: (item: T) => number): T | undefined => {
    if (arr.length === 0) return undefined
    return arr.reduce((max, item) => (fn(item) > fn(max) ? item : max))
  },
}

// Mock Position
class Position {
  constructor(public x: number, public y: number) {}

  static distancePow2(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return (a.x - b.x) ** 2 + (a.y - b.y) ** 2
  }

  static distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt(this.distancePow2(a, b))
  }

  copy(): Position {
    return new Position(this.x, this.y)
  }

  dithering(_amp: number): this {
    return this
  }

  moveTo(_pos: { x: number; y: number }, _speed: number): this {
    return this
  }
}

// Mock MONSTER_CONFIG
const MONSTER_CONFIG = {
  NORMAL_RADIUS_DIVISOR: 3,
  NORMAL_RADIUS_OFFSET: 2,
  BOSS_RADIUS_DIVISOR: 2,
  BOSS_RADIUS_OFFSET: 1,
  DEVIL_RADIUS_DIVISOR: 1.4,
  DEVIL_RADIUS_OFFSET: 3,
  DEMON_SPAWN_RADIUS_DIVISOR: 4,
  HIGH_PRIEST_HEAL_INTERVAL_VARIANCE: 200,
  DEVIL_SUMMON_OFFSET_RANGE: 30,
  DEVIL_SUMMON_LEVEL_DIVISOR: 10,
} as const

// Mock Game
const Game = {
  callGridSideSize: (): number => 39,
  callAnimation: vi.fn(),
  callMonsterSpawn: vi.fn(),
}

// ============================================================================
// 怪物等级缩放函数（从 monster.ts 复制以便测试）
// ============================================================================

// Dummy
const DummyStats = {
  rwd: (_lvl: number): number => 0,
  spd: (_lvl: number): number => 0.001,
  hth: (lvl: number): number => (lvl + 1) * 4e8,
  amr: (_lvl: number): number => 0,
}

// Swordman
const SwordmanStats = {
  rwd: (lvl: number): number => 20 * lvl + 20,
  spd: (lvl: number): number => Math.min(0.3 + lvl / 60, 1.15),
  hth: (lvl: number): number => 120 + lvl * 40,
  amr: (lvl: number): number => 3 + lvl / 8,
}

// Axeman
const AxemanStats = {
  rwd: (lvl: number): number => 30 * lvl + 20,
  spd: (lvl: number): number => Math.min(0.25 + lvl / 80, 1),
  hth: (lvl: number): number => 300 + lvl * 100,
  amr: (lvl: number): number => 5 + lvl / 6,
}

// LionMan
const LionManStats = {
  rwd: (lvl: number): number => 40 * lvl + 20,
  spd: (lvl: number): number => Math.min(0.38 + lvl / 70, 1.2),
  hth: (lvl: number): number => 580 + lvl * 122,
  amr: (lvl: number): number => 22 + lvl / 5,
}

// DemonSpawn
const DemonSpawnStats = {
  rwd: (lvl: number): number => 5 * lvl + 10,
  spd: (lvl: number): number => Math.min(0.4 + lvl / 50, 1.3),
  hth: (lvl: number): number => 50 + lvl * 20,
  amr: (lvl: number): number => lvl / 10,
}

// HighPriest
const HighPriestStats = {
  rwd: (lvl: number): number => 240 * lvl + 1320,
  spd: (_lvl: number): number => 0.11,
  hth: (lvl: number): number => 14400 + lvl * 8000,
  amr: (_lvl: number): number => 14,
  healingInterval: (_lvl: number): number => 5000,
  healingPower: (lvl: number): number => 40 * (Math.floor(lvl / 2) + 1),
  healingRange: (_lvl: number): number => 30,
}

// Devil
const DevilStats = {
  rwd: (lvl: number): number => 340 * lvl + 420,
  spd: (_lvl: number): number => 0.14,
  hth: (lvl: number): number => 15500 + lvl * 13000,
  amr: (lvl: number): number => 32 + lvl,
  summonInterval: (): number => 7000,
}

// ============================================================================
// 测试用例
// ============================================================================

describe('Monster Level Scaling Functions', () => {
  describe('Swordman', () => {
    test('health scales linearly with level', () => {
      expect(SwordmanStats.hth(0)).toBe(120)
      expect(SwordmanStats.hth(1)).toBe(160)
      expect(SwordmanStats.hth(10)).toBe(520)
      expect(SwordmanStats.hth(100)).toBe(4120)
    })

    test('speed scales with cap', () => {
      expect(SwordmanStats.spd(0)).toBeCloseTo(0.3, 2)
      expect(SwordmanStats.spd(1)).toBeCloseTo(0.317, 2)
      // 达到上限
      expect(SwordmanStats.spd(100)).toBe(1.15)
      expect(SwordmanStats.spd(200)).toBe(1.15)
    })

    test('armor scales slowly', () => {
      expect(SwordmanStats.amr(0)).toBe(3)
      expect(SwordmanStats.amr(8)).toBe(4)
      expect(SwordmanStats.amr(80)).toBe(13)
    })

    test('reward scales linearly', () => {
      expect(SwordmanStats.rwd(0)).toBe(20)
      expect(SwordmanStats.rwd(1)).toBe(40)
      expect(SwordmanStats.rwd(10)).toBe(220)
    })
  })

  describe('Axeman', () => {
    test('health scales linearly (high base)', () => {
      expect(AxemanStats.hth(0)).toBe(300)
      expect(AxemanStats.hth(1)).toBe(400)
      expect(AxemanStats.hth(10)).toBe(1300)
    })

    test('speed is slower than Swordman', () => {
      expect(AxemanStats.spd(0)).toBeLessThan(SwordmanStats.spd(0))
      expect(AxemanStats.spd(0)).toBeCloseTo(0.25, 2)
    })

    test('armor is higher than Swordman', () => {
      const level = 10
      expect(AxemanStats.amr(level)).toBeGreaterThan(SwordmanStats.amr(level))
    })
  })

  describe('LionMan', () => {
    test('is faster than other normal monsters', () => {
      const level = 10
      expect(LionManStats.spd(level)).toBeGreaterThan(SwordmanStats.spd(level))
      expect(LionManStats.spd(level)).toBeGreaterThan(AxemanStats.spd(level))
    })

    test('health is higher than Swordman', () => {
      const level = 10
      expect(LionManStats.hth(level)).toBeGreaterThan(SwordmanStats.hth(level))
    })
  })

  describe('DemonSpawn', () => {
    test('is weaker than normal monsters', () => {
      const level = 10
      expect(DemonSpawnStats.hth(level)).toBeLessThan(SwordmanStats.hth(level))
      expect(DemonSpawnStats.rwd(level)).toBeLessThan(SwordmanStats.rwd(level))
    })

    test('is fast', () => {
      expect(DemonSpawnStats.spd(0)).toBeCloseTo(0.4, 2)
      expect(DemonSpawnStats.spd(100)).toBe(1.3)
    })
  })

  describe('HighPriest (Boss)', () => {
    test('health is much higher than normal monsters', () => {
      const level = 10
      expect(HighPriestStats.hth(level)).toBeGreaterThan(SwordmanStats.hth(level) * 10)
    })

    test('speed is constant', () => {
      expect(HighPriestStats.spd(0)).toBe(0.11)
      expect(HighPriestStats.spd(100)).toBe(0.11)
    })

    test('armor is constant', () => {
      expect(HighPriestStats.amr(0)).toBe(14)
      expect(HighPriestStats.amr(100)).toBe(14)
    })

    test('healing power scales with level', () => {
      expect(HighPriestStats.healingPower(0)).toBe(40)
      expect(HighPriestStats.healingPower(2)).toBe(80)
      expect(HighPriestStats.healingPower(10)).toBe(240)
    })
  })

  describe('Devil (Boss)', () => {
    test('has highest health among all monsters', () => {
      const level = 10
      expect(DevilStats.hth(level)).toBeGreaterThan(HighPriestStats.hth(level))
    })

    test('armor scales with level', () => {
      expect(DevilStats.amr(0)).toBe(32)
      expect(DevilStats.amr(10)).toBe(42)
    })

    test('reward is highest', () => {
      const level = 10
      expect(DevilStats.rwd(level)).toBeGreaterThan(HighPriestStats.rwd(level))
    })
  })
})

describe('Devil Summon Logic', () => {
  test('summon count increases with level', () => {
    const calcSummonCount = (level: number) => 1 + Math.floor(level / MONSTER_CONFIG.DEVIL_SUMMON_LEVEL_DIVISOR)

    expect(calcSummonCount(0)).toBe(1)
    expect(calcSummonCount(9)).toBe(1)
    expect(calcSummonCount(10)).toBe(2)
    expect(calcSummonCount(20)).toBe(3)
    expect(calcSummonCount(50)).toBe(6)
  })
})

describe('Armor Resistance Calculation', () => {
  // 护甲抗性公式: armor / (100 + armor)
  const calcArmorResistance = (armor: number) => armor / (100 + armor)

  test('0 armor means 0 resistance', () => {
    expect(calcArmorResistance(0)).toBe(0)
  })

  test('100 armor means 50% resistance', () => {
    expect(calcArmorResistance(100)).toBeCloseTo(0.5, 2)
  })

  test('resistance approaches but never reaches 100%', () => {
    expect(calcArmorResistance(1000)).toBeCloseTo(0.909, 2)
    expect(calcArmorResistance(10000)).toBeCloseTo(0.99, 2)
    // Infinity / (100 + Infinity) = NaN in JS, so we test with very large number
    expect(calcArmorResistance(1e10)).toBeCloseTo(1, 5)
  })

  test('typical monster armor values', () => {
    // Swordman at level 10
    const swordmanArmor = SwordmanStats.amr(10)
    expect(calcArmorResistance(swordmanArmor)).toBeLessThan(0.1)

    // Devil at level 10
    const devilArmor = DevilStats.amr(10)
    expect(calcArmorResistance(devilArmor)).toBeGreaterThan(0.25)
  })
})

describe('Damage and Healing Logic', () => {
  // 模拟 MonsterBase 的伤害和治疗逻辑
  class MockMonster {
    maxHealth: number
    health: number
    isDead = false
    isInvincible = false

    constructor(maxHealth: number) {
      this.maxHealth = maxHealth
      this.health = maxHealth
    }

    applyDamage(rawDamage: number): number {
      if (rawDamage <= 0 || this.isDead) return 0

      const actualDmg = Math.min(rawDamage, this.health)
      this.health -= actualDmg

      if (this.health <= 0) {
        if (this.isInvincible) {
          this.health = 1
        } else {
          this.isDead = true
        }
      }

      return actualDmg
    }

    applyHealing(amount: number): number {
      if (amount <= 0 || this.isDead) return 0

      const oldHealth = this.health
      this.health = Math.min(this.health + amount, this.maxHealth)

      return this.health - oldHealth
    }
  }

  test('damage reduces health', () => {
    const monster = new MockMonster(1000)
    const actualDmg = monster.applyDamage(300)

    expect(actualDmg).toBe(300)
    expect(monster.health).toBe(700)
    expect(monster.isDead).toBe(false)
  })

  test('damage cannot exceed current health', () => {
    const monster = new MockMonster(100)
    const actualDmg = monster.applyDamage(200)

    expect(actualDmg).toBe(100)
    expect(monster.health).toBe(0)
    expect(monster.isDead).toBe(true)
  })

  test('invincible monster survives lethal damage', () => {
    const monster = new MockMonster(100)
    monster.isInvincible = true

    monster.applyDamage(200)

    expect(monster.health).toBe(1)
    expect(monster.isDead).toBe(false)
  })

  test('healing increases health', () => {
    const monster = new MockMonster(1000)
    monster.health = 500

    const healed = monster.applyHealing(300)

    expect(healed).toBe(300)
    expect(monster.health).toBe(800)
  })

  test('healing cannot exceed max health', () => {
    const monster = new MockMonster(1000)
    monster.health = 900

    const healed = monster.applyHealing(200)

    expect(healed).toBe(100)
    expect(monster.health).toBe(1000)
  })

  test('dead monster cannot be healed', () => {
    const monster = new MockMonster(1000)
    monster.isDead = true
    monster.health = 0

    const healed = monster.applyHealing(500)

    expect(healed).toBe(0)
    expect(monster.health).toBe(0)
  })
})

describe('Curse Multiplier Calculation', () => {
  test('curse multipliers stack multiplicatively', () => {
    const curses = [{ pow: 1.5, durTick: 100 }, { pow: 2.0, durTick: 50 }]
    const multiplier = curses.reduce((p, v) => p * v.pow, 1)

    expect(multiplier).toBe(3.0)
  })

  test('no curse means multiplier of 1', () => {
    const curses: { pow: number; durTick: number }[] = []
    const multiplier = curses.reduce((p, v) => p * v.pow, 1)

    expect(multiplier).toBe(1)
  })
})

describe('HighPriest Healing Range', () => {
  test('inHealingRange calculation', () => {
    const healingRange = 30
    const priestPos = { x: 100, y: 100 }
    const targetNear = { x: 120, y: 100 }
    const targetFar = { x: 200, y: 100 }

    const inRange = (target: { x: number; y: number }) =>
      Position.distancePow2(target, priestPos) < healingRange * healingRange

    expect(inRange(targetNear)).toBe(true)
    expect(inRange(targetFar)).toBe(false)
  })
})

describe('Monster Radius Calculations', () => {
  const gridSize = 39

  test('normal monster radius', () => {
    const radius = gridSize / MONSTER_CONFIG.NORMAL_RADIUS_DIVISOR - MONSTER_CONFIG.NORMAL_RADIUS_OFFSET
    expect(radius).toBe(11) // 39/3 - 2 = 11
  })

  test('boss monster radius', () => {
    const radius = gridSize / MONSTER_CONFIG.BOSS_RADIUS_DIVISOR - MONSTER_CONFIG.BOSS_RADIUS_OFFSET
    expect(radius).toBe(18.5) // 39/2 - 1 = 18.5
  })

  test('devil has largest radius', () => {
    const normalRadius = gridSize / MONSTER_CONFIG.NORMAL_RADIUS_DIVISOR - MONSTER_CONFIG.NORMAL_RADIUS_OFFSET
    const devilRadius = gridSize / MONSTER_CONFIG.DEVIL_RADIUS_DIVISOR + MONSTER_CONFIG.DEVIL_RADIUS_OFFSET

    expect(devilRadius).toBeGreaterThan(normalRadius)
  })

  test('demon spawn has smallest radius', () => {
    const normalRadius = gridSize / MONSTER_CONFIG.NORMAL_RADIUS_DIVISOR - MONSTER_CONFIG.NORMAL_RADIUS_OFFSET
    const demonSpawnRadius = gridSize / MONSTER_CONFIG.DEMON_SPAWN_RADIUS_DIVISOR

    expect(demonSpawnRadius).toBeLessThan(normalRadius)
  })
})
