/// <reference path="../typedef.ts" />

/**
 * 子弹配置接口
 * 用于定义子弹的视觉属性
 */
interface BulletConfig {
  /** 子弹半径 */
  radius: number
  /** 边框宽度 */
  borderWidth: number
  /** 边框样式（颜色） */
  borderStyle: Optional<string>
  /** 填充样式（颜色） - undefined 表示无填充 */
  fill: string | undefined
}

/**
 * 子弹视觉配置常量
 */
const BULLET_VISUAL_CONFIG = {
  /** 加农炮弹配置 */
  CANNON: {
    radius: 2,
    borderWidth: 1,
    borderStyle: 'rgba(15,244,11,.9)',
    fill: 'rgba(15,12,11,.6)',
  } as BulletConfig,

  /** 集束炸弹配置 */
  CLUSTER: {
    radius: 6,
    borderWidth: 1,
    borderStyle: 'rgba(14,244,11,.9)',
    fill: 'rgba(215,212,11,.6)',
  } as BulletConfig,

  /** 集束炸弹 Ex 配置 */
  CLUSTER_EX: {
    radius: 8,
    borderWidth: 1,
    borderStyle: 'rgba(14,244,11,.9)',
    fill: 'rgba(245,242,11,.8)',
  } as BulletConfig,

  /** 毒罐配置 */
  POISON: {
    radius: 2,
    borderWidth: 1,
    borderStyle: 'rgba(244,22,33,1)',
    fill: 'rgba(227,14,233,.9)',
  } as BulletConfig,

  /** 神秘炸弹配置 */
  MYSTIC: {
    radius: 3,
    borderWidth: 1,
    borderStyle: 'rgba(141,123,51,1)',
    fill: 'rgba(204,204,204,1)',
  } as BulletConfig,
} as const

/**
 * 子弹速度常量
 */
const BULLET_VELOCITY = {
  /** 加农炮弹基础速度 */
  CANNON: 4,
  /** 集束炸弹额外速度加成 */
  CLUSTER_BONUS: 2,
  /** 普通箭矢速度 */
  NORMAL_ARROW: 18,
  /** 穿透箭矢速度 */
  PENETRATING_ARROW: 12,
  /** 毒罐速度 */
  POISON: 6,
  /** 飞刃速度 */
  BLADE: 12,
  /** 飞刃最大速度 */
  BLADE_MAX: 22,
  /** 神秘炸弹（静止） */
  MYSTIC: 0,
} as const

/**
 * 穿透箭默认配置
 */
const PENETRATING_ARROW_DEFAULTS = {
  /** 默认穿甲率（减少护甲生效比例） */
  ARMOR_PENETRATION: 0.6,
  /** 默认穿透伤害衰减率 */
  DAMAGE_DECAY: 0.8,
  /** 箭矢半径 */
  RADIUS: 8,
} as const

/**
 * 神秘炸弹默认配置
 */
const MYSTIC_BOMB_DEFAULTS = {
  /** 默认存活时间（帧，5秒 @ 60fps） */
  LIFETIME: 300,
} as const
