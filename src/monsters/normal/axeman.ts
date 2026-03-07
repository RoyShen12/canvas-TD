/// <reference path="../../base.ts" />
/// <reference path="../helpers.ts" />

// ============================================================================
// 斧手
// ============================================================================

/**
 * 斧手
 * 高血量、高护甲的坦克型敌人
 */
class Axeman extends MonsterBase {
  static readonly imgName = '$spr::m_act_green_axe'
  static readonly sprSpd = 4

  static readonly rwd = (lvl: number): number => 30 * lvl + 20
  static readonly spd = (lvl: number): number => Math.min(0.25 + lvl / 80, 1)
  static readonly hth = (lvl: number): number => 300 + lvl * 100
  static readonly amr = (lvl: number): number => 5 + lvl / 6

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, level: number) {
    super(
      position,
      calcNormalMonsterRadius(),
      0,
      null,
      image,
      level,
      Axeman.rwd,
      Axeman.spd,
      Axeman.hth,
      Axeman.amr
    )

    this.name = '蛮族斧手'
    this.description = '身披重甲的蛮族战士'
  }
}
