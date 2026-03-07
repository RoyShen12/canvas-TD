/// <reference path="../typedef.ts" />

/**
 * Tower Constants - 塔防游戏常量定义
 * 提取所有魔法数字，便于维护和调整游戏平衡
 */

// ============================================================================
// 价格系统常量
// ============================================================================

/** 价格增长率 (每级价格 = basePrice * 1.1^level) */
const TOWER_PRICE_GROWTH_RATE = 1.1

/** 各塔的基础价格和最大等级 */
const TOWER_PRICING = {
  ARCHER: { basePrice: 10, maxLevel: 180 },
  CANNON: { basePrice: 15, maxLevel: 170 },
  FROST: { basePrice: 320, maxLevel: 70 },
  POISON: { basePrice: 50, maxLevel: 190 },
  TESLA: { basePrice: 105, maxLevel: 180 },
  MAGIC: { basePrice: 200, maxLevel: 150 },
  LASER: { basePrice: 500, maxLevel: 150 },
  CARRIER: { basePrice: 1000, maxLevel: 200 },
  BLADE: { basePrice: 2000, maxLevel: 280 }
} as const

/**
 * 创建价格 Proxy 的工厂函数
 * 消除重复的 Proxy 代码
 */
function createPriceProxy(basePrice: number, maxLevel: number): ArrayLike<number> {
  return new Proxy(
    {},
    {
      get(_t, p: string | symbol) {
        if (p === 'length') return maxLevel
        // 忽略 Symbol 属性（如 Symbol.iterator）
        if (typeof p === 'symbol') return undefined
        return Math.ceil(Math.pow(TOWER_PRICE_GROWTH_RATE, +p) * basePrice)
      }
    }
  ) as ArrayLike<number>
}

// ============================================================================
// 晋升等级阈值
// ============================================================================

/** 通用晋升等级 */
const RANK_LEVELS = {
  RANK_1: 5,
  RANK_2: 10,
  RANK_3: 15,
  RANK_4: 30,
  VETERAN_1: 40,
  VETERAN_2: 50,
  VETERAN_3: 60,
  VETERAN_4: 70,
  VETERAN_5: 80,
  MASTER_1: 90,
  MASTER_2: 100
} as const

// ============================================================================
// 晋升名称后缀
// ============================================================================

const TOWER_RANK_NAMES = {
  VETERAN: '老兵',
  ELITE: '身经百战',
  MASTER: '大师'
} as const

// ============================================================================
// 罗马数字工具
// ============================================================================

const RomanNumerals = {
  I: 'I',
  II: 'II',
  III: 'III',
  IV: 'IV',
  V: 'V',
  VI: 'VI',
  VII: 'VII',

  /** 获取下一个罗马数字 */
  next(current: string): string {
    const sequence = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
    const idx = sequence.indexOf(current)
    return idx >= 0 && idx < sequence.length - 1 ? sequence[idx + 1]! : current
  },

  /** 替换字符串中的罗马数字为下一个 */
  increment(name: string): string {
    return name
      .replace(/VII$/, 'VIII')
      .replace(/VI$/, 'VII')
      .replace(/IV$/, 'V')
      .replace(/III$/, 'IV')
      .replace(/II$/, 'III')
      .replace(/(?<!I)I$/, 'II')
  }
} as const

// ============================================================================
// 塔颜色常量
// ============================================================================

const TOWER_COLORS = {
  // 弓箭塔
  ARCHER_RANK_0: 'rgba(26,143,12,.3)',
  ARCHER_RANK_1: 'rgba(26,143,12,.5)',
  ARCHER_RANK_2: 'rgba(26,203,12,.7)',
  ARCHER_RANK_3: 'rgba(26,255,12,.9)',

  // 加农炮塔
  CANNON_RANK_0: 'rgba(156,43,12,.5)',
  CANNON_RANK_1: 'rgba(206,43,12,.7)',
  CANNON_RANK_2: 'rgba(246,43,12,.9)',

  // 冰霜塔
  FROST: 'rgba(161,198,225,.6)',

  // 毒气塔 (注意：原代码有 typo 'rbga'，这里修复为 'rgba')
  POISON: 'rgba(45,244,12,.4)',

  // 电能塔
  TESLA_RANK_0: 'rgba(252,251,34,.4)',
  TESLA_RANK_1: 'rgba(222,201,34,.6)',
  TESLA_RANK_2: 'rgba(162,161,34,.8)',

  // 魔法塔
  MAGIC_RANK_0: 'rgba(223,14,245,.2)',
  MAGIC_RANK_1: 'rgba(223,14,245,.4)',
  MAGIC_RANK_2: 'rgba(223,14,245,.6)',
  MAGIC_RANK_3: 'rgba(223,14,245,.8)',

  // 激光塔
  LASER_RANK_0: 'rgba(17,54,245,.2)',
  LASER_RANK_1: 'rgba(17,54,245,.3)',
  LASER_RANK_2: 'rgba(17,54,245,.4)',
  LASER_RANK_3: 'rgba(17,54,245,.5)',
  LASER_RANK_4: 'rgba(17,54,245,.8)',

  // 航母
  CARRIER: 'rgba(56,243,12,.5)',

  // 飞刃塔
  BLADE: 'rgba(26,13,112,.3)'
} as const

// ============================================================================
// 弓箭塔 (MaskManTower) 常量
// ============================================================================

const ARCHER_CONSTANTS = {
  // 基础属性
  CRIT_CHANCE_BASE: 0.1,
  CRIT_DAMAGE_BASE: 2,
  ARMOR_PENETRATION: 0.3,

  // 晋升相关
  EXTRA_RANGE_RANK_1: 160,
  EXTRA_RANGE_RANK_3: 180,
  EXTRA_POWER_RANK_1: 10,
  EXTRA_POWER_RANK_2: 20,
  EXTRA_BULLET_V_RANK_1: 2,
  EXTRA_BULLET_V_RANK_2: 4,
  EXTRA_BULLET_V_RANK_3: 8,

  // 秒杀几率
  SEC_KILL_CHANCE: 0.003,

  // 陷阱
  TRAP_CHANCE_INITIAL: 5,
  TRAP_DURATION_INITIAL: 3000,

  // 额外箭矢
  EXTRA_ARROW_RANK_3: 16
} as const

// ============================================================================
// 加农炮塔 (CannonShooter) 常量
// ============================================================================

const CANNON_CONSTANTS = {
  // 爆炸伤害
  EXPLOSION_DAMAGE_RANK_1: 100,
  EXPLOSION_DAMAGE_RANK_2: 150,
  EXPLOSION_DAMAGE_RANK_3: 200,
  EXPLOSION_DAMAGE_RANK_4: 250,
  EXPLOSION_DAMAGE_VETERAN_BASE: 250,
  EXPLOSION_DAMAGE_GROWTH_PER_LEVEL: 30,

  // 爆炸范围
  EXPLOSION_RANGE_RANK_1: 10,
  EXPLOSION_RANGE_RANK_3: 20,
  EXPLOSION_RANGE_RANK_4: 30,

  // 额外射程
  EXTRA_RANGE_RANK_2: 100,
  EXTRA_RANGE_RANK_3: 150,
  EXTRA_RANGE_RANK_4: 200,

  // 子弹速度
  EXTRA_BULLET_V_RANK_1: 2,
  EXTRA_BULLET_V_RANK_2: 14,

  // 爆炸倍率
  EXPLOSION_DAMAGE_RATIO: {
    RANK_4: 1.5,
    RANK_5: 1.5 * 1.5,
    RANK_6: 1.5 * 1.5 * 1.5,
    RANK_7: 1.5 * 1.5 * 1.5 * 1.5
  },
  EXPLOSION_RANGE_RATIO: {
    RANK_6: 1.1,
    RANK_7: 1.2
  }
} as const

// ============================================================================
// 冰霜塔 (FrostTower) 常量
// ============================================================================

const FROST_CONSTANTS = {
  ARMOR_DECREASING_STRENGTH: 0.9,

  // 冻结间隔和持续时间 (ms)
  FREEZE_INTERVAL: {
    RANK_1: 10000,
    RANK_2: 5000,
    RANK_3: 4400,
    RANK_4: 4200,
    RANK_5: 4000,
    RANK_6: 3800,
    RANK_7: 3600
  },
  FREEZE_DURATION: {
    RANK_1: 400,
    RANK_2: 600,
    RANK_3: 800,
    RANK_4: 860,
    RANK_5: 880,
    RANK_6: 900,
    RANK_7: 920
  }
} as const

// ============================================================================
// 电能塔 (TeslaTower) 常量
// ============================================================================

const TESLA_CONSTANTS = {
  // 闪电绘制
  SHOCK_RENDER_FRAMES: 2,
  CURVE_DETAIL: 10,

  // 带电效果
  SHOCK_DURATION_BASE: 5000,
  SHOCK_CHARGING_CHANCE_BASE: 0.2,
  SHOCK_CHARGING_POWER_RATIO_BASE: 0.25,
  SHOCK_LEAKING_CHANCE_BASE: 0.02,

  // 晋升后的值
  SHOCK_DURATION_RANK_1: 8000,
  SHOCK_DURATION_RANK_2: 12000,
  SHOCK_CHARGING_CHANCE_RANK_1: 0.3,
  SHOCK_CHARGING_CHANCE_RANK_2: 0.4,
  SHOCK_CHARGING_POWER_RATIO_RANK_1: 0.75,
  SHOCK_CHARGING_POWER_RATIO_RANK_2: 1.5,
  SHOCK_LEAKING_CHANCE_RANK_1: 0.05,
  SHOCK_LEAKING_CHANCE_RANK_2: 0.12,

  // 额外属性
  EXTRA_HASTE_RANK_1: 0.75,
  EXTRA_RANGE_RANK_2: 80
} as const

// ============================================================================
// 魔法塔 (BlackMagicTower) 常量
// ============================================================================

const MAGIC_CONSTANTS = {
  // 额外攻击力
  EXTRA_POWER_RANK_1: 666,
  EXTRA_POWER_RANK_2: 2664,
  EXTRA_POWER_RANK_3: 10654,

  // 百分比当前生命伤害
  PERCENT_CURRENT_HP_DAMAGE: 0.04,

  // 击杀奖励
  KILL_POWER_BONUS: 10,
  KILL_HASTE_BONUS: 0.05,
  MAX_HASTE_BONUS_PERCENT: 1600
} as const

// ============================================================================
// 激光塔 (LaserTower) 常量
// ============================================================================

const LASER_CONSTANTS = {
  // 额外火焰伤害
  EXTRA_FLAME_DAMAGE: {
    RANK_1: 220,
    RANK_3: 420,
    RANK_4: 640
  },
  // 额外电浆伤害
  EXTRA_LUMINOUS_DAMAGE: {
    RANK_2: 140,
    RANK_3: 220,
    RANK_4: 380
  },
  // 额外属性
  EXTRA_RANGE_RANK_4: 50,
  EXTRA_FLAME_WIDTH_RANK_4: 40,

  // 激光样式
  LINE_STYLES: [
    ['rgba(244,188,174,.4)', 'rgba(204,21,12,.7)'], // laser
    ['rgba(244,188,174,.4)', 'rgba(254,21,12,.7)'], // he laser
    ['rgba(204,204,255,.4)', 'rgba(0,51,253,.7)'], // heat inf
    ['rgba(204,204,255,.4)', 'rgba(0,51,253,.7)'], // multi heat inf
    ['rgba(255,153,0,.4)', 'rgba(153,0,51,.7)'] // colossus
  ] as readonly (readonly [string, string])[]
} as const

// ============================================================================
// 航母 (CarrierTower) 常量
// ============================================================================

const CARRIER_CONSTANTS = {
  // 载机武器攻击补正
  JET_ATTACK_SUPPLEMENT_RATIO: -0.55,
  JET_ATTACK_POWER_EXPONENT: 2.225,
  JET_ATTACK_POWER_MULTIPLIER: 6,

  // 载机攻速系数
  JET_HASTE_SUPPLEMENT_RATE_BASE: 1,
  JET_HASTE_SUPPLEMENT_GROWTH: 0.028
} as const

// ============================================================================
// 激光辅助类 (ColossusLaser) 常量
// ============================================================================

const COLOSSUS_LASER_CONSTANTS = {
  ANIMATION_WIDTH: 36,
  ANIMATION_HEIGHT: 36,
  ANIMATION_NAME: 'explo_3',
  ANIMATION_SPEED: 0.5
} as const
