/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../level-up-config.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../utils/math-utils.ts" />

/**
 * MaskManTower - 弓箭塔
 * 每次向多个敌人射出箭矢，有几率暴击
 */
class MaskManTower extends TowerBase {
  // 晋升描述文本
  private static rankUpDesc1 = '\n+ 射程和攻击力得到加强'
  private static rankUpDesc2 = '\n+ 暴击能力得到大幅加强\n+ 有 $‰ 的几率直接杀死目标'
  private static rankUpDesc3 = '\n+ 命中的箭矢将有几率束缚敌人'

  // 多目标列表
  private multipleTarget: Array<Optional<MonsterBase>> = []

  // 额外属性
  private extraRange = 0
  private _extraHaste = 0
  private extraPower = 0
  private extraArrow = 0
  private trapChance = 0
  private trapDuration = 0
  private extraBulletV = 0

  // 动态攻速标记 (用于替代 Object.defineProperty)
  private _dynamicExtraHaste = false

  private inner_desc_init = '每次向多个敌人射出箭矢\n+ 有几率暴击\n+ 拥有固定 30%的护甲穿透'

  // 暴击属性
  private critChance = ARCHER_CONSTANTS.CRIT_CHANCE_BASE
  private critDamageRatio = ARCHER_CONSTANTS.CRIT_DAMAGE_BASE
  private secKillChance = 0

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
      TOWER_COLORS.ARCHER_RANK_0,
      image,
      TowerManager.MaskManTower.p,
      TowerManager.MaskManTower.a,
      TowerManager.MaskManTower.h,
      TowerManager.MaskManTower.s,
      TowerManager.MaskManTower.r
    )

    this.bulletCtorName = TowerManager.MaskManTower.bctor!
    this.bulletImage = bulletImage
    this.name = TowerManager.MaskManTower.dn
    this.description = this.inner_desc_init
  }

  /**
   * 获取额外攻速
   * 修复: 使用计算属性替代 Object.defineProperty
   */
  private get extraHaste(): number {
    if (this._dynamicExtraHaste) {
      return 0.5 + (this.level - 15) * 0.004
    }
    return this._extraHaste
  }

  private set extraHaste(value: number) {
    this._extraHaste = value
  }

  /**
   * 增强暴击
   */
  enhanceCrit(chanceDelta = 0.05, ratioDelta = 1): void {
    if (this.critChance < 0.75) {
      this.critChance += chanceDelta
    }
    this.critDamageRatio += ratioDelta
  }

  override levelUp(currentMoney: number): number {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '弩箭塔'
          this.image = Game.callImageBitMap(TowerManager.MaskManTower.n2!)
          this.description += MaskManTower.rankUpDesc1
          this.borderStyle = TOWER_COLORS.ARCHER_RANK_1
          this.extraRange = ARCHER_CONSTANTS.EXTRA_RANGE_RANK_1
          this.extraPower = ARCHER_CONSTANTS.EXTRA_POWER_RANK_1
          this.extraBulletV = ARCHER_CONSTANTS.EXTRA_BULLET_V_RANK_1
          break

        case 10:
          this.rankUp()
          this.name = '火枪塔'
          this.image = Game.callImageBitMap(TowerManager.MaskManTower.n3!)
          this.secKillChance = ARCHER_CONSTANTS.SEC_KILL_CHANCE
          this.description += MaskManTower.rankUpDesc2.replace('$', Math.round(this.secKillChance * 1000) + '')
          this.borderStyle = TOWER_COLORS.ARCHER_RANK_2
          this.enhanceCrit(0.15, 6)
          this.extraPower = ARCHER_CONSTANTS.EXTRA_POWER_RANK_2
          this.extraBulletV = ARCHER_CONSTANTS.EXTRA_BULLET_V_RANK_2
          break

        case 15:
          this.rankUp()
          this.name = '精灵神射手塔'
          this.description += MaskManTower.rankUpDesc3
          this.image = Game.callImageBitMap(TowerManager.MaskManTower.n4!)
          this.borderStyle = TOWER_COLORS.ARCHER_RANK_3
          this.enhanceCrit(0.1)
          this.extraRange = ARCHER_CONSTANTS.EXTRA_RANGE_RANK_3
          this.trapChance = ARCHER_CONSTANTS.TRAP_CHANCE_INITIAL
          this.trapDuration = ARCHER_CONSTANTS.TRAP_DURATION_INITIAL
          this.extraBulletV = ARCHER_CONSTANTS.EXTRA_BULLET_V_RANK_3
          this._dynamicExtraHaste = true
          this.extraArrow = ARCHER_CONSTANTS.EXTRA_ARROW_RANK_3
          break

        case 20:
          this.rankUp()
          this.name += ` ${TowerManager.rankPostfixL1}I`
          this.enhanceCrit(0.05, 2)
          break

        case 30:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.enhanceCrit()
          this.trapChance = 6
          this.trapDuration = 3500
          break

        case 40:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.enhanceCrit()
          this.trapChance = 7
          this.trapDuration = 4000
          break

        case 50:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.enhanceCrit()
          this.trapChance = 7.5
          this.trapDuration = 4300
          break

        case 60:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.enhanceCrit()
          this.trapChance = 8
          this.trapDuration = 4400
          break

        case 70:
          this.rankUp()
          this.name = this.name!.replace(TowerManager.rankPostfixL1, TowerManager.rankPostfixL2).replace('V', 'I')
          this.enhanceCrit(0.05, 2)
          this.trapChance = 9
          this.trapDuration = 4500
          break

        case 80:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.enhanceCrit()
          this.trapChance = 10
          break

        case 90:
          this.rankUp()
          this.name = RomanNumerals.increment(this.name!)
          this.enhanceCrit()
          break
      }
    }

    return ret
  }

  override get DPS(): number {
    return super.DPS * (this.critChance * this.critDamageRatio + 1 - this.critChance)
  }

  override get informationSeq(): string[][] {
    return super.informationSeq.concat([
      ['暴击率', MathUtils.roundWithFixed(this.critChance * 100, 1) + '%'],
      ['暴击伤害', MathUtils.roundWithFixed(this.critDamageRatio * 100, 0) + '%']
    ])
  }

  override get Rng(): number {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get HstPS(): number {
    return super.HstPS + this.extraHaste
  }

  override get Atk(): number {
    return super.Atk + this.extraPower
  }

  override get Slc(): number {
    return super.Slc + this.extraArrow
  }

  isThisTargetAvailable(target: Optional<MonsterBase>): boolean {
    if (!target || target.isDead) return false
    return this.inRange(target)
  }

  override reChooseTarget(targetList: MonsterBase[], index: number): void {
    for (const t of _.shuffle(targetList)) {
      if (!t.isDead && this.inRange(t)) {
        this.multipleTarget[index] = t
        return
      }
    }
    this.multipleTarget[index] = null
  }

  override produceBullet(idx: number): void {
    if (this.multipleTarget[idx] && !this.multipleTarget[idx]!.isDead) {
      const ratio = this.calculateDamageRatio(this.multipleTarget[idx]!)
      this.bulletCtl.Factory(
        this.boundRecordDamage,
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk * ratio,
        this.multipleTarget[idx]!,
        this.bulletImage,
        this.critChance,
        this.critDamageRatio,
        this.trapChance,
        this.trapDuration,
        this.extraBulletV,
        Math.random() < this.secKillChance
      )
    }
  }

  /**
   * 箭塔特有的运行方式
   * 箭塔每次向复数目标分别射出箭矢
   */
  override run(monsters: MonsterBase[]): void {
    if (this.canShoot) {
      for (let idx = 0; idx < this.Slc; idx++) {
        if (!this.isThisTargetAvailable(this.multipleTarget[idx])) {
          this.reChooseTarget(monsters, idx)
        }
      }
      // 只有至少一个目标有效时才射击
      if (this.multipleTarget.some(t => t != null)) {
        this.shoot(monsters)
      }
    }
  }

  override gemHitHook(idx: number, monsters: MonsterBase[]): void {
    if (this.gem && this.multipleTarget[idx] && !this.multipleTarget[idx]!.isDead) {
      this.gem.hitHook(this, this.multipleTarget[idx]!, monsters)
    }
  }

  rapidRender(): void {}
}
