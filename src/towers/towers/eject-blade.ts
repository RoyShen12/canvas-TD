/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../utils/math-utils.ts" />

/**
 * EjectBlade - 飞刃塔
 * 发射可以在敌人之间弹射的飞刃
 */
class EjectBlade extends TowerBase {
  private inner_desc_init = '发射可以在敌人之间弹射的飞刃\n+ 每次弹射将使伤害衰减，升级可以减少衰减的程度'

  // 等级函数
  private levelBtFxFx = TowerManager.EjectBlade.bt!
  private levelDfpbFx = TowerManager.EjectBlade.dfpb!

  constructor(
    position: Position,
    image: string | AnimationSprite | ImageBitmap,
    bulletImage: ImageBitmap,
    radius: number
  ) {
    super(
      position,
      radius,
      1,
      TOWER_COLORS.BLADE,
      image,
      TowerManager.EjectBlade.p,
      TowerManager.EjectBlade.a,
      TowerManager.EjectBlade.h,
      TowerManager.EjectBlade.s,
      TowerManager.EjectBlade.r
    )

    this.bulletCtorName = TowerManager.EjectBlade.bctor!
    this.bulletImage = bulletImage
    this.name = TowerManager.EjectBlade.dn
    this.description = this.inner_desc_init
  }

  override get informationSeq(): string[][] {
    return super.informationSeq.concat([
      ['弹射次数', this.bounceTime + ''],
      ['弹射伤害系数', MathUtils.roundWithFixed(this.damageFadePerBounce * 100, 2) + ' %']
    ])
  }

  /** 弹射次数 */
  private get bounceTime(): number {
    return this.levelBtFxFx(this.level)
  }

  /** 每次弹射后伤害衰减的乘数 */
  private get damageFadePerBounce(): number {
    return this.levelDfpbFx(this.level)
  }

  override produceBullet(): void {
    if (this.target) {
      const ratio = this.calculateDamageRatio(this.target)
      this.bulletCtl.Factory(
        this.boundRecordDamage,
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk * ratio,
        this.target,
        this.bulletImage,
        this.bounceTime,
        this.damageFadePerBounce
      )
    }
  }

  rapidRender(): void {}
}
