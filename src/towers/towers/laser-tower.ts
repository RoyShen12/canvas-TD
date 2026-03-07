/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../helpers/colossus-laser.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../motion.ts" />
/// <reference path="../../utils/math-utils.ts" />
/// <reference path="../../utils/ease-utils.ts" />

/**
 * LaserTower - 激光塔
 * 发射激光，横扫大面积的目标，造成范围的火焰伤害
 */
class LaserTower extends TowerBase {
  /** 激光辅助类引用 */
  private static Laser = _ColossusLaser

  // 晋升描述文本
  static rankUpDesc1 = '\n+ 伤害得到加强'
  static rankUpDesc2 = '\n+ 造成额外电浆伤害(无视防御)'
  static rankUpDesc3 = '\n+ 发射多束射线'
  static rankUpDesc4 = '\n+ 所有属性得到增强'

  private lasers: _ColossusLaser[] = []

  // 等级函数
  private levelFlameAtkFx = TowerManager.LaserTower.fatk!
  private levelFlameWidthFx = TowerManager.LaserTower.fw!
  private levelLaserSwipeDistanceFx = TowerManager.LaserTower.lsd!

  // 额外属性
  private extraFlameDamage = 0
  private extraLuminousDamage = 0
  private extraLaserTransmitter = 0
  private extraFlameWidth = 0
  private extraRange = 0

  /** 激光线条样式 */
  private lineStyles = LASER_CONSTANTS.LINE_STYLES

  private inner_desc_init = '发射激光，横扫大面积的目标，造成范围的火焰伤害'

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
      TOWER_COLORS.LASER_RANK_0,
      image,
      TowerManager.LaserTower.p,
      TowerManager.LaserTower.a,
      TowerManager.LaserTower.h,
      TowerManager.LaserTower.s,
      TowerManager.LaserTower.r
    )

    this.name = TowerManager.LaserTower.dn
    this.description = this.inner_desc_init
  }

  override get Rng(): number {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get Slc(): number {
    return super.Slc + this.extraLaserTransmitter
  }

  /** Laser Swipe Distance - 激光扫射距离 */
  get LSD(): number {
    return this.getRelativeRange(this.levelLaserSwipeDistanceFx(this.level))
  }

  /** Flame Attack Power - 火焰攻击力 */
  get FAtk(): number {
    return this.levelFlameAtkFx(this.level) + this.extraFlameDamage
  }

  /** Flame Width - 火焰宽度 */
  get FWd(): number {
    return this.getRelativeRange(this.levelFlameWidthFx(this.level) + this.extraFlameWidth)
  }

  /** 激光渲染宽度 */
  get LRW(): number {
    return Math.ceil(this.getRelativeRange(3 + Math.floor(this.rank / 2)))
  }

  override get informationSeq(): string[][] {
    return super.informationSeq.concat([
      ['火焰伤害', Math.round(this.FAtk) + ''],
      ['扫射距离', MathUtils.roundWithFixed(this.LSD, 1) + ''],
      ['扫射宽度', MathUtils.roundWithFixed(this.FWd, 1) + ''],
      ['额外火焰伤害', Math.round(this.extraFlameDamage) + ''],
      ['额外电浆伤害', Math.round(this.extraLuminousDamage) + '']
    ])
  }

  get laserLineStyle(): readonly [string, string] {
    return this.lineStyles[this.rank]!
  }

  override levelUp(currentMoney: number): number {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 8:
          this.rankUp()
          this.name = '高能激光塔'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n2!)
          this.description += LaserTower.rankUpDesc1
          this.borderStyle = TOWER_COLORS.LASER_RANK_1
          this.extraFlameDamage = LASER_CONSTANTS.EXTRA_FLAME_DAMAGE.RANK_1
          break

        case 16:
          this.rankUp()
          this.name = '热能射线塔'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n3!)
          this.description += LaserTower.rankUpDesc2
          this.borderStyle = TOWER_COLORS.LASER_RANK_2
          this.extraLuminousDamage = LASER_CONSTANTS.EXTRA_LUMINOUS_DAMAGE.RANK_2
          break

        case 32:
          this.rankUp()
          this.name = '多重热能射线塔'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n4!)
          this.description += LaserTower.rankUpDesc3
          this.borderStyle = TOWER_COLORS.LASER_RANK_3
          this.levelSlcFx = TowerManager.LaserTower.s2!
          this.extraFlameDamage = LASER_CONSTANTS.EXTRA_FLAME_DAMAGE.RANK_3
          this.extraLuminousDamage = LASER_CONSTANTS.EXTRA_LUMINOUS_DAMAGE.RANK_3
          break

        case 64:
          this.rankUp()
          this.name = '巨像'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n5!)
          this.description += LaserTower.rankUpDesc4
          this.borderStyle = TOWER_COLORS.LASER_RANK_4
          this.extraFlameDamage = LASER_CONSTANTS.EXTRA_FLAME_DAMAGE.RANK_4
          this.extraLuminousDamage = LASER_CONSTANTS.EXTRA_LUMINOUS_DAMAGE.RANK_4
          this.levelSlcFx = TowerManager.LaserTower.s3!
          this.levelHstFx = TowerManager.LaserTower.h2!
          this.extraRange = LASER_CONSTANTS.EXTRA_RANGE_RANK_4
          this.extraFlameWidth = LASER_CONSTANTS.EXTRA_FLAME_WIDTH_RANK_4
          break
      }
    }

    return ret
  }

  /**
   * 发射激光，击中第一个敌人，扫动一定距离，造成燃烧伤害
   */
  override produceBullet(_i: number, monsters: MonsterBase[]): void {
    if (!this.target) return

    const targetPos = new Position(this.target.position.x, this.target.position.y)
    const hitRadius = this.FWd / 2 + Game.callGridSideSize() / 3 - 2
    const moveRatio = 0.7
    const arcTime = Math.ceil((this.LSD / hitRadius - 2) / moveRatio + 1) + 1

    // 采样击中点的各个方向，并取每个方向延伸的模糊点，比较何处敌人最密集
    const swipeVector = _.maxBy(
      _.range(0, 360, 30).map(d => new PolarVector(this.LSD, d)),
      sv =>
        monsters.filter(mst =>
          targetPos
            .copy()
            .move(sv.copy().normalize().multiply(moveRatio * (arcTime - 1) * hitRadius))
            .equal(mst.position, 1.2 * hitRadius)
        ).length
    )!.dithering((1 / 30) * Math.PI)

    // 创建激光对象
    this.lasers.push(
      new LaserTower.Laser(
        this.position,
        this.target.position,
        this.LRW,
        500,
        swipeVector,
        EaseFx.linear,
        this.laserLineStyle[0],
        this.laserLineStyle[1]
      )
    )

    // 构建火焰伤害区域
    const flameArea = new Path2D()
    for (let i = 0; i < arcTime; i++) {
      const point = targetPos.copy().move(swipeVector.copy().normalize().multiply(moveRatio * i * hitRadius))
      flameArea.arc(point.x, point.y, hitRadius, 0, Math.PI * 2)
    }

    // 对目标造成直接伤害
    this.target.applyDamage(this.Atk * (1 - this.target.armorResistance) * this.calculateDamageRatio(this.target))
    this.recordDamage(this.target)

    // 对区域内怪物造成火焰伤害
    const bgContext = Game.callCanvasContext('bg') as WrappedCanvasRenderingContext2D
    monsters.forEach(mst => {
      if (mst.isDead) return
      if (bgContext.isPointInPath(flameArea, mst.position.x, mst.position.y) && this.target) {
        // 电浆伤害 (无视防御)
        if (this.extraLuminousDamage > 0) {
          mst.applyDamage(this.extraLuminousDamage * this.calculateDamageRatio(mst))
          if (mst.lastAbsDmg > 0) this.recordDamage(mst)
        }

        // 火焰伤害
        if (!mst.isDead) {
          mst.applyDamage(this.FAtk * (1 - mst.armorResistance) * this.calculateDamageRatio(mst))
          this.recordDamage(mst)
        }
      }
    })
  }

  rapidRender(ctx: CanvasRenderingContext2D): void {
    // 渲染并清理已完成的激光
    this.lasers = this.lasers.filter(laser => {
      laser.renderStep(ctx)
      return !laser.fulfilled
    })
  }
}
