/// <reference path="../../base.ts" />
/// <reference path="../helpers.ts" />

// ============================================================================
// 狮人
// ============================================================================

/**
 * 狮人
 * 高速移动的精英敌人
 */
class LionMan extends MonsterBase {
  static readonly imgName = '$spr::m_lion'
  static readonly sprSpd = 6

  static readonly rwd = (lvl: number): number => 40 * lvl + 20
  static readonly spd = (lvl: number): number => Math.min(0.38 + lvl / 70, 1.2)
  static readonly hth = (lvl: number): number => 580 + lvl * 122
  static readonly amr = (lvl: number): number => 22 + lvl / 5

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, level: number) {
    super(
      position,
      calcNormalMonsterRadius(),
      0,
      null,
      image,
      level,
      LionMan.rwd,
      LionMan.spd,
      LionMan.hth,
      LionMan.amr
    )

    this.name = '狮人'
    this.description = '敏捷而凶猛的狮人战士'
  }
}
