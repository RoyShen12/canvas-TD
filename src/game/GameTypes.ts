/// <reference path="../typedef.ts" />

/**
 * Game 模块类型定义
 * 提供 Game 类及其子模块使用的类型接口
 */

// ============================================================================
// 网格相关类型
// ============================================================================

/**
 * 网格坐标（以方格为单位）
 * 用于表示游戏地图上的格子位置
 */
interface GridCoordinate {
  readonly gridX: number
  readonly gridY: number
}

/**
 * 网格完整信息
 * 包含网格索引和对应的中心点像素坐标
 */
interface GridInfo extends GridCoordinate {
  /** 格子中心点的 X 像素坐标 */
  readonly centerX: number
  /** 格子中心点的 Y 像素坐标 */
  readonly centerY: number
}

/**
 * 塔放置验证结果
 */
interface PlacementValidation {
  /** 是否可以放置 */
  readonly canPlace: boolean
  /** 不能放置的原因 */
  readonly reason?: PlacementFailReason
}

/**
 * 塔放置失败原因
 */
type PlacementFailReason =
  | 'out_of_bounds'
  | 'has_monster'
  | 'has_tower'
  | 'would_block_path'
  | 'insufficient_funds'

// ============================================================================
// 渲染相关类型
// ============================================================================

/**
 * Canvas 图层配置
 */
interface CanvasLayerConfig {
  readonly id: string
  readonly zIndex: string
  readonly isOffscreen?: boolean
  readonly bindTo?: string
}

/**
 * 游戏渲染状态
 * 传递给渲染器的当前帧状态
 */
interface GameRenderState {
  readonly renderTick: number
  readonly updateTick: number
  readonly isPausing: boolean
  readonly isTestMode: boolean
  readonly money: number
  readonly life: number
  readonly gemPoints: number
  readonly objectCount: number
  readonly bornStamp: number | undefined
}

/**
 * 背景渲染配置
 */
interface BackgroundRenderConfig {
  readonly gridColumns: number
  readonly gridRows: number
  readonly gridSize: number
  readonly leftAreaWidth: number
  readonly leftAreaHeight: number
  readonly rightAreaWidth: number
  readonly midSplitLineX: number
  readonly originPosition: Position
  readonly destinationPosition: Position
  readonly isTestMode: boolean
}

/**
 * 游戏统计信息
 */
interface GameStats {
  readonly totalDamage: number
  readonly totalKill: number
  readonly dps: number
  readonly money: number
  readonly life: number
  readonly gemPoints: number
}

/**
 * 调试指标信息
 */
interface DebugMetrics {
  readonly renderTick: number
  readonly updateTick: number
  readonly objectCount: number
  readonly domCount: number
  readonly fps: number
}

// ============================================================================
// UI 相关类型
// ============================================================================

/**
 * 按钮配置
 */
interface ButtonConfig {
  readonly gridSize: number
  readonly leftAreaWidth: number
  readonly isTestMode: boolean
  readonly loopSpeeds: number[]
  readonly onPauseToggle: () => void
  readonly onSpeedChange: (speed: number) => void
}

/**
 * 测试模式 UI 配置
 */
interface TestModeUIConfig {
  readonly gridSize: number
  readonly leftAreaWidth: number
  readonly stepDivide: number
  readonly count: number
  readonly onStepDivideChange: (value: number) => void
  readonly onCountChange: (delta: number) => void
  readonly onDebugRectToggle: (enabled: boolean) => void
}

// ============================================================================
// 事件相关类型
// ============================================================================

/**
 * 事件处理器配置
 */
interface EventHandlerConfig {
  readonly midSplitLineX: number
  readonly gridSize: number
  readonly isTestMode: boolean
}

/**
 * 鼠标点击处理结果
 */
interface ClickHandleResult {
  readonly handled: boolean
  readonly action?: 'build' | 'select' | 'upgrade' | 'sell' | 'cancel'
}

// ============================================================================
// 寻路相关类型
// ============================================================================

/**
 * 寻路配置
 */
interface PathfinderConfig {
  readonly gridColumns: number
  readonly gridRows: number
  readonly gridSize: number
  readonly destinationGrid: GridCoordinate
}

/**
 * 路径缓存键
 */
type PathCacheKey = `${number}|${number}`

// 注意：IocItem 类型已在 typedef.ts 中定义，此处不再重复
