/// <reference path="../../base.ts" />
/// <reference path="../helpers.ts" />

// ============================================================================
// 剑士
// ============================================================================

/**
 * 剑士
 * 基础敌人单位，平衡的属性
 */
class Swordman extends MonsterBase {
  static readonly imgName = '$spr::m_act_white_sword'
  static readonly sprSpd = 4

  static readonly rwd = (lvl: number): number => 20 * lvl + 20
  static readonly spd = (lvl: number): number => Math.min(0.3 + lvl / 60, 1.15)
  static readonly hth = (lvl: number): number => 120 + lvl * 40
  static readonly amr = (lvl: number): number => 3 + lvl / 8

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, level: number) {
    super(
      position,
      calcNormalMonsterRadius(),
      0,
      null,
      image,
      level,
      Swordman.rwd,
      Swordman.spd,
      Swordman.hth,
      Swordman.amr
    )

    this.name = '邪恶的剑士'
    this.description = '曾今是流浪的剑士，如今被大魔神控制'
  }
}
