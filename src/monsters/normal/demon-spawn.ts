/// <reference path="../../base.ts" />
/// <reference path="../helpers.ts" />

// ============================================================================
// 恶魔崽
// ============================================================================

/**
 * 恶魔崽
 * Devil 召唤的小型恶魔，较弱但数量多
 */
class DemonSpawn extends MonsterBase {
  static readonly imgName = '$spr::m_devil'
  static readonly sprSpd = 4

  static readonly rwd = (lvl: number): number => 5 * lvl + 10
  static readonly spd = (lvl: number): number => Math.min(0.4 + lvl / 50, 1.3)
  static readonly hth = (lvl: number): number => 50 + lvl * 20
  static readonly amr = (lvl: number): number => lvl / 10

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, level: number) {
    super(
      position,
      Game.callGridSideSize() / MONSTER_CONFIG.DEMON_SPAWN_RADIUS_DIVISOR,
      0,
      null,
      image,
      level,
      DemonSpawn.rwd,
      DemonSpawn.spd,
      DemonSpawn.hth,
      DemonSpawn.amr
    )

    this.name = '恶魔崽'
    this.description = '由地狱之王召唤的小型恶魔'
  }
}
