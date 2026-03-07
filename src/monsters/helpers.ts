/// <reference path="../base.ts" />

// ============================================================================
// 怪物辅助函数
// ============================================================================

/**
 * 计算普通怪物半径
 */
function calcNormalMonsterRadius(): number {
  return Game.callGridSideSize() / MONSTER_CONFIG.NORMAL_RADIUS_DIVISOR - MONSTER_CONFIG.NORMAL_RADIUS_OFFSET
}

/**
 * 计算 Boss 怪物半径
 */
function calcBossMonsterRadius(): number {
  return Game.callGridSideSize() / MONSTER_CONFIG.BOSS_RADIUS_DIVISOR - MONSTER_CONFIG.BOSS_RADIUS_OFFSET
}
