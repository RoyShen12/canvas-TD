/**
 * Debuff 类型枚举
 * 定义所有负面效果类型
 */
enum DebuffType {
  // DOT 类 - 持续伤害
  POISON = 'poison',
  BLEED = 'bleed',
  BURN = 'burn',
  LIGHT_ECHO = 'light_echo',

  // 控制类 - 限制行动
  SHOCK = 'shock',
  TRANSFORM = 'transform',
  IMPRISON = 'imprison',
  FREEZE = 'freeze',
  CONFUSE = 'confuse',

  // 属性修改类
  IMPRECATE = 'imprecate',
  SLOW = 'slow',
}

/**
 * Debuff 分类
 */
enum DebuffCategory {
  DOT = 'dot',
  CONTROL = 'control',
  MODIFIER = 'modifier',
}

/**
 * Debuff 效果接口
 */
interface IDebuff {
  /** Debuff 类型 */
  type: DebuffType
  /** Debuff 分类 */
  category: DebuffCategory
  /** 剩余持续 tick 数 */
  remainingTicks: number
  /** 初始持续 tick 数 */
  totalTicks: number
  /** 特定 debuff 的额外数据 */
  data?: IDebuffData
}

/**
 * Debuff 额外数据接口
 * 不同类型的 debuff 有不同的额外数据
 */
interface IDebuffData {
  // Shock 电击相关
  chargeAmount?: number
  leakChance?: number
  sourceId?: number

  // Imprecate 诅咒相关
  damageMultiplier?: number

  // Slow 减速相关
  speedRatio?: number

  // Light Echo 光之回响相关
  dotId?: string
}

/**
 * Debuff 配置接口
 */
interface IDebuffConfig {
  /** Debuff 类型 */
  type: DebuffType
  /** 持续时间 (ticks) */
  durationTicks: number
  /** 额外数据 */
  data?: IDebuffData
}

/**
 * Debuff 对 buff 图标的映射
 */
const DEBUFF_ICON_MAP: Record<DebuffType, string> = {
  [DebuffType.POISON]: 'buff_poison',
  [DebuffType.BLEED]: 'buff_bloody',
  [DebuffType.BURN]: 'buff_burn',
  [DebuffType.LIGHT_ECHO]: 'buff_light_echo',
  [DebuffType.SHOCK]: 'buff_shock',
  [DebuffType.TRANSFORM]: 'buff_transform',
  [DebuffType.IMPRISON]: 'buff_imprison',
  [DebuffType.FREEZE]: 'buff_freeze',
  [DebuffType.CONFUSE]: 'buff_confuse',
  [DebuffType.IMPRECATE]: 'buff_imprecate',
  [DebuffType.SLOW]: 'buff_slow',
}

/**
 * Debuff 分类映射
 */
const DEBUFF_CATEGORY_MAP: Record<DebuffType, DebuffCategory> = {
  [DebuffType.POISON]: DebuffCategory.DOT,
  [DebuffType.BLEED]: DebuffCategory.DOT,
  [DebuffType.BURN]: DebuffCategory.DOT,
  [DebuffType.LIGHT_ECHO]: DebuffCategory.DOT,
  [DebuffType.SHOCK]: DebuffCategory.CONTROL,
  [DebuffType.TRANSFORM]: DebuffCategory.CONTROL,
  [DebuffType.IMPRISON]: DebuffCategory.CONTROL,
  [DebuffType.FREEZE]: DebuffCategory.CONTROL,
  [DebuffType.CONFUSE]: DebuffCategory.CONTROL,
  [DebuffType.IMPRECATE]: DebuffCategory.MODIFIER,
  [DebuffType.SLOW]: DebuffCategory.MODIFIER,
}

/**
 * 控制类 debuff 列表（用于判断 isTrapped）
 */
const CONTROL_DEBUFFS: DebuffType[] = [
  DebuffType.TRANSFORM,
  DebuffType.IMPRISON,
  DebuffType.FREEZE,
  DebuffType.CONFUSE,
]
