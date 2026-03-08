/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../utils/math-utils.ts" />

/**
 * PoisonTower - 毒气塔
 * 发射毒气弹持续杀伤，总是积极切换目标
 */
class PoisonTower extends TowerBase {
  // 等级函数
  private levelPatkFx = TowerManager.PoisonTower.patk!
  private levelPitvFx = TowerManager.PoisonTower.pitv!
  private levelPdurFx = TowerManager.PoisonTower.pdur!

  private extraBulletV = 0
  private inner_desc_init = '发射毒气弹持续杀伤，总是积极切换目标\n+ 攻击速度很快\n+ 附加中毒效果\n+ 无视防御的伤害'

  constructor(
    position: Position,
    image: string | AnimationSprite | ImageBitmap,
    _bulletImage: any,
    radius: number
  ) {
    super(
      position,
      radius,
      1,
      // BUG FIX: 'rbga' -> 'rgba'
      TOWER_COLORS.POISON,
      image,
      TowerManager.PoisonTower.p,
      TowerManager.PoisonTower.a,
      TowerManager.PoisonTower.h,
      TowerManager.PoisonTower.s,
      TowerManager.PoisonTower.r
    )

    this.bulletCtorName = TowerManager.PoisonTower.bctor!
    this.name = TowerManager.PoisonTower.dn
    this.description = this.inner_desc_init
  }

  /**
   * 毒罐塔会积极地切换目标，以尽可能让所有范围内敌人中毒
   */
  override get isCurrentTargetAvailable(): boolean {
    return false
  }

  /** 中毒DOT间隔时间 */
  get Pitv(): number {
    return this.levelPitvFx(this.level)
  }

  /** 中毒DOT持续时间 */
  get Pdur(): number {
    return this.levelPdurFx(this.level)
  }

  /** 中毒DOT伤害 */
  get Patk(): number {
    return this.levelPatkFx(this.level) * this._damageRatio * this._angerGemAtkRatio
  }

  get DOTPS(): number {
    return (1000 / this.Pitv) * this.Patk
  }

  override get informationSeq(): string[][] {
    return super.informationSeq.concat([
      ['每跳毒素伤害', Math.round(this.Patk) + ''],
      ['毒素伤害频率', MathUtils.roundWithFixed(this.Pitv / 1000, 1) + ' 秒'],
      ['毒素持续', Math.round(this.Pdur / 1000) + ' 秒']
    ])
  }

  /**
   * 毒罐塔特有的索敌方式
   */
  override reChooseTarget(targetList: MonsterBase[]): void {
    const aliveTargets = targetList.filter(m => !m.isDead)
    const unPoisoned = aliveTargets.filter(m => !m.bePoisoned)

    // 先在未中毒，且未被任何本类型塔弹药锁定的敌人中快速搜索
    const unTargeted = unPoisoned.filter(m => {
      return !this.bulletCtl.bullets.some(b => b.registryName === this.bulletCtorName && b.target === m)
    })

    for (const t of unTargeted) {
      if (this.inRange(t)) {
        this.target = t
        return
      }
    }

    // 在未中毒的敌人中搜索
    for (const t of unPoisoned) {
      if (this.inRange(t)) {
        this.target = t
        return
      }
    }

    // 如果未找到在射程内的未中毒的敌人
    // 则回退到全部敌人中随机寻找一个在射程内的敌人
    for (const t of _.shuffle(aliveTargets)) {
      if (this.inRange(t)) {
        this.target = t
        return
      }
    }

    this.target = null
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
        this.Patk * ratio,
        this.Pitv,
        this.Pdur,
        this.extraBulletV
      )
    }
  }

  rapidRender(): void {}
}
