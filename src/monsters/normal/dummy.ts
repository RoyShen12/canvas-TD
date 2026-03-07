/// <reference path="../../base.ts" />
/// <reference path="../helpers.ts" />

// ============================================================================
// 训练假人
// ============================================================================

/**
 * 训练假人
 * 用于测试的无敌目标，会自动回复生命值
 */
class Dummy extends MonsterBase {
  static readonly imgName = '$spr::m_spider'
  static readonly sprSpd = 20

  static readonly rwd = (_lvl: number): number => 0
  static readonly spd = (_lvl: number): number => 0.001
  static readonly hth = (lvl: number): number => (lvl + 1) * 4e8
  static readonly amr = (_lvl: number): number => 0

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, level: number) {
    super(
      position,
      calcNormalMonsterRadius(),
      0,
      null,
      image,
      level,
      Dummy.rwd,
      Dummy.spd,
      Dummy.hth,
      Dummy.amr
    )

    this.isInvincible = true
    this.isBoss = true
    this.isAbstractItem = true

    this.name = '训练假人'
    this.type = '抽象装置'
    this.description = 'Dummy For Test Only'
  }

  override makeEffect(): void {
    // 自动回复 1% 最大生命值
    if (this.health < this.maxHealth) {
      this.applyHealing(this.maxHealth / 100)
    }
  }
}
