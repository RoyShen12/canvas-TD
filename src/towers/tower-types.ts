/// <reference path="../typedef.ts" />
/// <reference path="./tower-constants.ts" />

/**
 * Tower Types - 塔防游戏类型定义
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 等级函数类型 */
type TowerLevelFunction = (level: number) => number

/** 攻击力等级函数类型 (部分塔需要基于攻击力计算) */
type TowerAtkLevelFunction = (atk: number) => number

// ============================================================================
// 塔配置类型
// ============================================================================

/** 塔配置接口 - 完整版 */
interface TowerConfigFull {
  /** 显示名称 (display name) */
  dn: string
  /** 类名 (class name) */
  c: string
  /** 顺序 (order) */
  od: number
  /** 图片名 */
  n: string
  /** 图片名 - 晋升后 */
  n2?: string
  n3?: string
  n4?: string
  n5?: string
  /** 航母载机图片 */
  cn?: string
  /** 价格数组 */
  p: ArrayLike<number>
  /** 射程函数 (range) */
  r: TowerLevelFunction
  /** 攻击函数 (attack) */
  a: TowerLevelFunction
  /** 攻速函数 (haste) */
  h: TowerLevelFunction
  /** 多重射击函数 (slice/salvo) */
  s: TowerLevelFunction
  /** 子弹类名 */
  bctor?: string
  bctor2?: string
  bctor3?: string
  /** 子弹图片名 */
  bn?: string
  bn2?: string

  // CannonShooter 特有
  /** 爆炸范围函数 */
  expr?: TowerLevelFunction
  /** 爆炸伤害函数 (基于攻击力) */
  expatk?: TowerAtkLevelFunction
  /** 灼烧伤害函数 */
  bdatk?: TowerAtkLevelFunction
  bdatk2?: TowerAtkLevelFunction
  bdatk3?: TowerAtkLevelFunction
  bdatk4?: TowerAtkLevelFunction
  bdatk5?: TowerAtkLevelFunction
  /** 灼烧间隔函数 */
  bditv?: TowerLevelFunction
  /** 灼烧持续函数 */
  bddur?: TowerLevelFunction

  // FrostTower 特有
  /** 减速强度函数 */
  sr?: TowerLevelFunction

  // PoisonTower 特有
  /** 毒素伤害函数 */
  patk?: TowerLevelFunction
  /** 毒素间隔函数 */
  pitv?: TowerLevelFunction
  /** 毒素持续函数 */
  pdur?: TowerLevelFunction

  // BlackMagicTower 特有
  /** 诅咒易伤函数 */
  ide?: TowerLevelFunction
  /** 诅咒持续函数 */
  idr?: TowerLevelFunction
  /** 攻击函数 - 晋升后 */
  a2?: TowerLevelFunction
  a3?: TowerLevelFunction
  a4?: TowerLevelFunction

  // LaserTower 特有
  /** 激光扫射距离函数 */
  lsd?: TowerLevelFunction
  /** 火焰伤害函数 */
  fatk?: TowerLevelFunction
  /** 火焰宽度函数 */
  fw?: TowerLevelFunction
  /** 攻速函数 - 晋升后 */
  h2?: TowerLevelFunction
  /** 多重射击函数 - 晋升后 */
  s2?: TowerLevelFunction
  s3?: TowerLevelFunction

  // CarrierTower 特有
  /** 载机数量函数 */
  child?: TowerLevelFunction
  /** 载机速度函数 */
  spd?: TowerLevelFunction

  // EjectBlade 特有
  /** 弹射次数函数 */
  bt?: TowerLevelFunction
  /** 弹射伤害衰减函数 */
  dfpb?: TowerLevelFunction
}

/** 塔配置类型 (用于 towerCtors 数组) */
type TowerConfig = TowerConfigFull

// ============================================================================
// 升级效果类型
// ============================================================================

/** 升级时的属性变更 */
interface TowerStatChanges {
  // 通用属性
  extraRange?: number
  extraHaste?: number
  extraPower?: number
  extraBulletV?: number

  // CannonShooter 特有
  extraExplosionDamage?: number
  extraExplosionRange?: number
  extraExplosionDamageRatio?: number
  extraExplosionRangeRatio?: number

  // MaskManTower 特有
  extraArrow?: number
  trapChance?: number
  trapDuration?: number
  secKillChance?: number
  critChance?: number
  critDamageRatio?: number

  // FrostTower 特有
  freezeInterval?: number
  freezeDuration?: number
  armorDecreasingStrength?: number

  // TeslaTower 特有
  shockDuration?: number
  shockChargingChance?: number
  shockChargingPowerRatio?: number
  shockLeakingChance?: number

  // BlackMagicTower 特有
  POTCHD?: number

  // LaserTower 特有
  extraFlameDamage?: number
  extraLuminousDamage?: number
  extraLaserTransmitter?: number
  extraFlameWidth?: number
}

/** 单个升级效果配置 */
interface LevelUpEffect<T extends TowerBase = TowerBase> {
  /** 触发等级 */
  level: number
  /** 是否触发 rankUp */
  rankUp?: boolean
  /** 新名称 */
  name?: string
  /** 新图片 (TowerManager.XXX.nX 的键名) */
  imageKey?: string
  /** 追加描述 */
  descriptionAppend?: string
  /** 替换描述 */
  descriptionReplace?: string
  /** 新边框颜色 */
  borderStyle?: string
  /** 属性变更 */
  statChanges?: Partial<TowerStatChanges>
  /** 自定义效果 (用于无法通过配置表达的复杂逻辑) */
  customEffect?: (tower: T) => void
}

/** 升级配置表类型 */
type LevelUpConfig<T extends TowerBase = TowerBase> = LevelUpEffect<T>[]

// ============================================================================
// 辅助类型
// ============================================================================

/** TowerManager 静态属性类型 */
interface TowerManagerStatic {
  towerCtors: TowerConfig[]
  rankPostfixL1: string
  rankPostfixL2: string
  rankPostfixL3: string
  TestTower: TowerConfig
  CannonShooter: TowerConfig
  MaskManTower: TowerConfig
  FrostTower: TowerConfig
  PoisonTower: TowerConfig
  TeslaTower: TowerConfig
  BlackMagicTower: TowerConfig
  LaserTower: TowerConfig
  CarrierTower: TowerConfig
  EjectBlade: TowerConfig
}

/** 怪物带电渲染队列项 */
interface MonsterShockingRenderingItem {
  time: number
  args: [number, number, number, number, number]
}
