/// <reference path="./typedef.ts" />

/**
 * 调试配置模块
 * 集中管理所有调试相关的全局变量和配置
 */

// ============= 调试配置对象 =============

/** 调试配置（只读） */
const DEBUG_CONFIG = {
  /** 测试模式（根据 localStorage 判断） */
  testMode: localStorage.getItem('debug_mode') === '1',
  /** 是否显示刷新矩形（调试用） */
  showRefreshRect: false,
  /** 黑魔法塔是否总是增强（仅在 debug_mode 下生效） */
  blackMagicTowerAlwaysEnhance: localStorage.getItem('debug_mode') === '1'
} as const

// ============= 向后兼容的全局变量别名 =============

/** @deprecated 使用 DEBUG_CONFIG.testMode 代替 */
const __global_test_mode: boolean = DEBUG_CONFIG.testMode

/** @deprecated 使用 DEBUG_CONFIG.showRefreshRect 代替 */
let __debug_show_refresh_rect: boolean = DEBUG_CONFIG.showRefreshRect

/** @deprecated 使用 DEBUG_CONFIG.blackMagicTowerAlwaysEnhance 代替 */
let __debug_black_magic_tower_always_enhance: boolean = DEBUG_CONFIG.blackMagicTowerAlwaysEnhance

// ============= 游戏实例引用（用于调试和控制台访问） =============

/** 全局游戏实例引用（用于调试） */
let gameInstance: Optional<Game> = null

/** @deprecated 使用 gameInstance 代替 */
let g: Optional<Game> = null
