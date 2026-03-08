/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../level-up-config.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../utils/math-utils.ts" />
/// <reference path="../../utils/format-utils.ts" />

/**
 * CannonShooter - 加农炮塔
 * 发射火炮，在命中后会爆炸，附加灼烧效果
 */
class CannonShooter extends TowerBase {
  // 晋升描述文本
  private static rankUpDesc1 = '\n+ 爆炸范围和伤害得到加强'
  private static rankUpDesc2 = '\n+ 射程得到大幅加强'
  private static rankUpDesc3 = '\n+ 命中后向四周抛出小型炸弹'
  private static rankUpDesc4 = '\n+ 小型炸弹将分裂两次'

  // 等级函数
  private levelEpdRngFx = TowerManager.CannonShooter.expr!
  private levelEpdAtkFx = TowerManager.CannonShooter.expatk!
  private levelBrnAtkFx = TowerManager.CannonShooter.bdatk!
  private levelBrnItvFx = TowerManager.CannonShooter.bditv!
  private levelBrnDurFx = TowerManager.CannonShooter.bddur!

  // 额外属性
  private _extraExplosionDamage = 0
  private extraExplosionRange = 0
  private extraExplosionDamageRatio = 1
  private extraExplosionRangeRatio = 1
  private extraRange = 0
  private extraBulletV = 0

  // 动态爆炸伤害标记 (用于替代 Object.defineProperty)
  private _dynamicExplosionDamage = false

  private inner_desc_init = '发射火炮，在命中后会爆炸\n+ 附加灼烧效果'

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
      TOWER_COLORS.CANNON_RANK_0,
      image,
      TowerManager.CannonShooter.p,
      TowerManager.CannonShooter.a,
      TowerManager.CannonShooter.h,
      TowerManager.CannonShooter.s,
      TowerManager.CannonShooter.r
    )

    this.bulletCtorName = TowerManager.CannonShooter.bctor!
    this.name = TowerManager.CannonShooter.dn
    this.description = this.inner_desc_init
  }

  /**
   * 获取额外爆炸伤害
   * 修复: 使用计算属性替代 Object.defineProperty
   */
  private get extraExplosionDamage(): number {
    if (this._dynamicExplosionDamage) {
      return CANNON_CONSTANTS.EXPLOSION_DAMAGE_VETERAN_BASE +
        Math.floor((this.level - RANK_LEVELS.VETERAN_1) * CANNON_CONSTANTS.EXPLOSION_DAMAGE_GROWTH_PER_LEVEL)
    }
    return this._extraExplosionDamage
  }

  private set extraExplosionDamage(value: number) {
    this._extraExplosionDamage = value
  }

  override levelUp(currentMoney: number): number {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '榴弹塔'
          this.image = Game.callImageBitMap(TowerManager.CannonShooter.n2!)
          this.description += CannonShooter.rankUpDesc1
          this.borderStyle = TOWER_COLORS.CANNON_RANK_1
          this.extraExplosionDamage = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_1
          this.extraExplosionRange = CANNON_CONSTANTS.EXPLOSION_RANGE_RANK_1
          this.extraBulletV = CANNON_CONSTANTS.EXTRA_BULLET_V_RANK_1
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk2!
          break

        case 10:
          this.rankUp()
          this.name = '导弹塔'
          this.image = Game.callImageBitMap(TowerManager.CannonShooter.n3!)
          this.description += CannonShooter.rankUpDesc2
          this.borderStyle = TOWER_COLORS.CANNON_RANK_2
          this.extraExplosionDamage = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_2
          this.extraRange = CANNON_CONSTANTS.EXTRA_RANGE_RANK_2
          this.extraBulletV = CANNON_CONSTANTS.EXTRA_BULLET_V_RANK_2
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk3!
          break

        case 15:
          this.rankUp()
          this.name = '集束炸弹塔'
          this.description += CannonShooter.rankUpDesc3
          this.extraExplosionDamage = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_3
          this.extraRange = CANNON_CONSTANTS.EXTRA_RANGE_RANK_3
          this.extraExplosionRange = CANNON_CONSTANTS.EXPLOSION_RANGE_RANK_3
          this.bulletCtorName = TowerManager.CannonShooter.bctor2!
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk4!
          break

        case 30:
          this.rankUp()
          this.name = '云爆塔'
          this.description += CannonShooter.rankUpDesc4
          this.extraExplosionDamage = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_4
          this.extraRange = CANNON_CONSTANTS.EXTRA_RANGE_RANK_4
          this.extraExplosionRange = CANNON_CONSTANTS.EXPLOSION_RANGE_RANK_4
          this.bulletCtorName = TowerManager.CannonShooter.bctor3!
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk5!
          break

        case 40:
          this.rankUp()
          this._dynamicExplosionDamage = true
          this.name += ` ${TowerManager.rankPostfixL1}I`
          break

        case 50:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          break

        case 60:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          break

        case 70:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.extraExplosionDamageRatio = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_4
          break

        case 80:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.extraExplosionDamageRatio = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_5
          break

        case 90:
          this.rankUp()
          this.name = this.name!.replace(TowerManager.rankPostfixL1, TowerManager.rankPostfixL2).replace('V', 'I')
          this.extraExplosionDamageRatio = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_6
          this.extraExplosionRangeRatio = CANNON_CONSTANTS.EXPLOSION_RANGE_RATIO.RANK_6
          break

        case 100:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.extraExplosionDamageRatio = CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_7
          this.extraExplosionRangeRatio = CANNON_CONSTANTS.EXPLOSION_RANGE_RATIO.RANK_7
          break
      }
    }

    return ret
  }

  /** 爆炸范围 */
  get EpdRng(): number {
    return this.getRelativeRange((this.levelEpdRngFx(this.level) + this.extraExplosionRange) * this.extraExplosionRangeRatio)
  }

  /** 爆炸伤害 */
  get EpdAtk(): number {
    return (this.levelEpdAtkFx(this.Atk) + this.extraExplosionDamage) * this.extraExplosionDamageRatio
  }

  /** 灼烧伤害 */
  get BrnAtk(): number {
    return this.levelBrnAtkFx(this.Atk)
  }

  /** 灼烧间隔 (ms) */
  get BrnItv(): number {
    return this.levelBrnItvFx(this.level)
  }

  /** 灼烧持续 (ms) */
  get BrnDur(): number {
    return this.levelBrnDurFx(this.level)
  }

  override get Rng(): number {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get informationSeq(): string[][] {
    return super.informationSeq.concat([
      ['爆炸半径', MathUtils.roundWithFixed(this.EpdRng, 1) + ''],
      ['爆炸伤害', FormatUtils.chineseFormatter(this.EpdAtk, 3)],
      ['每跳灼烧伤害', Math.round(this.BrnAtk) + ''],
      ['灼烧伤害频率', MathUtils.roundWithFixed(this.BrnItv / 1000, 1) + ' 秒'],
      ['灼烧持续', MathUtils.roundWithFixed(this.BrnDur / 1000, 1) + ' 秒']
    ])
  }

  override produceBullet(): void {
    if (this.target) {
      this.bulletCtl.Factory(
        this.boundRecordDamage,
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk,
        this.target,
        this.bulletImage,
        this.EpdAtk,
        this.EpdRng,
        this.BrnAtk,
        this.BrnItv,
        this.BrnDur,
        this.extraBulletV,
        this.boundCalculateDamageRatio
      )
    }
  }

  rapidRender(): void {}
}
