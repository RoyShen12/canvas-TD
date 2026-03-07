/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-types.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../motion.ts" />

/**
 * TeslaTower - 电能塔
 * 向周围小范围释放电击造成中等伤害
 */
class TeslaTower extends TowerBase {
  /**
   * 闪电绘制函数 (递归分形)
   */
  private static renderLighteningCop(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    displace: number
  ): void {
    if (displace < TESLA_CONSTANTS.CURVE_DETAIL) {
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
    } else {
      const midX = (x2 + x1) / 2 + (Math.random() - 0.5) * displace
      const midY = (y2 + y1) / 2 + (Math.random() - 0.5) * displace

      this.renderLighteningCop(ctx, x1, y1, midX, midY, displace / 2)
      this.renderLighteningCop(ctx, x2, y2, midX, midY, displace / 2)

      // 随机分支
      if (Math.random() > 0.5) {
        const pos = new Position(x2, y2).dithering(displace / 3)
        this.renderLighteningCop(ctx, midX, midY, pos.x, pos.y, displace / 2)
      }
    }
  }

  /** 闪电绘制帧数 */
  static get shockRenderFrames(): number {
    return TESLA_CONSTANTS.SHOCK_RENDER_FRAMES
  }

  /** 闪电绘制的最小分折长度 */
  static get curveDetail(): number {
    return TESLA_CONSTANTS.CURVE_DETAIL
  }

  // 晋升描述文本
  static rankUpDesc1 = '\n+ 攻击频率得到加强'
  static rankUpDesc2 = '\n+ 射程得到加强'

  private renderPermit = 0
  private extraRange = 0
  private extraHaste = 0

  // 带电效果属性 (使用 number 类型避免字面量类型推断)
  private shockDuration: number = TESLA_CONSTANTS.SHOCK_DURATION_BASE
  private shockChargingChance: number = TESLA_CONSTANTS.SHOCK_CHARGING_CHANCE_BASE
  private shockChargingPowerRatio: number = TESLA_CONSTANTS.SHOCK_CHARGING_POWER_RATIO_BASE
  private shockLeakingChance: number = TESLA_CONSTANTS.SHOCK_LEAKING_CHANCE_BASE

  /** 带电的怪物向周围漏电的动画队列 */
  public monsterShockingRenderingQueue: MonsterShockingRenderingItem[] = []

  private inner_desc_init = '向周围小范围释放电击造成中等伤害\n+ 有几率使目标带电'

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
      TOWER_COLORS.TESLA_RANK_0,
      image,
      TowerManager.TeslaTower.p,
      TowerManager.TeslaTower.a,
      TowerManager.TeslaTower.h,
      TowerManager.TeslaTower.s,
      TowerManager.TeslaTower.r
    )

    this.name = TowerManager.TeslaTower.dn
    this.description = this.inner_desc_init
  }

  get canCharge(): boolean {
    return Math.random() > 1 - this.shockChargingChance
  }

  get shockDurationTick(): number {
    return (this.shockDuration / 1000) * 60
  }

  override get Rng(): number {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get HstPS(): number {
    return super.HstPS + this.extraHaste
  }

  override get informationSeq(): string[][] {
    const removing = ['弹药储备']
    return super.informationSeq.filter(line => !removing.some(rm => rm === line[0]))
  }

  get lighteningAmount(): number | null {
    return [null, 10, 20][this.rank] ?? null
  }

  override levelUp(currentMoney: number): number {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 12:
          this.rankUp()
          this.name = '特斯拉塔'
          this.image = Game.callImageBitMap(TowerManager.TeslaTower.n2!)
          this.description += TeslaTower.rankUpDesc1
          this.borderStyle = TOWER_COLORS.TESLA_RANK_1
          this.extraHaste = TESLA_CONSTANTS.EXTRA_HASTE_RANK_1
          this.shockChargingChance = TESLA_CONSTANTS.SHOCK_CHARGING_CHANCE_RANK_1
          this.shockDuration = TESLA_CONSTANTS.SHOCK_DURATION_RANK_1
          this.shockChargingPowerRatio = TESLA_CONSTANTS.SHOCK_CHARGING_POWER_RATIO_RANK_1
          this.shockLeakingChance = TESLA_CONSTANTS.SHOCK_LEAKING_CHANCE_RANK_1
          break

        case 24:
          this.rankUp()
          this.name = '闪电风暴塔'
          this.image = Game.callImageBitMap(TowerManager.TeslaTower.n3!)
          this.description += TeslaTower.rankUpDesc2
          this.borderStyle = TOWER_COLORS.TESLA_RANK_2
          this.extraRange = TESLA_CONSTANTS.EXTRA_RANGE_RANK_2
          this.shockChargingChance = TESLA_CONSTANTS.SHOCK_CHARGING_CHANCE_RANK_2
          this.shockDuration = TESLA_CONSTANTS.SHOCK_DURATION_RANK_2
          this.shockChargingPowerRatio = TESLA_CONSTANTS.SHOCK_CHARGING_POWER_RATIO_RANK_2
          this.shockLeakingChance = TESLA_CONSTANTS.SHOCK_LEAKING_CHANCE_RANK_2
          break
      }
    }

    return ret
  }

  /**
   * 电击
   */
  shock(monster: MonsterBase): void {
    const ratio = this.calculateDamageRatio(monster)

    monster.applyDamage(this.Atk * (1 - monster.armorResistance) * ratio)
    this.recordDamage(monster)

    if (this.canCharge) {
      monster.registerShock(this.shockDurationTick, this.Atk * ratio * this.shockChargingPowerRatio, this, this.shockLeakingChance)
    }
  }

  override run(monsters: MonsterBase[]): void {
    if (this.canShoot) {
      // 电击塔不调用父类 shoot，故主动挂载 gem 钩子
      this.gemAttackHook(monsters)

      this.renderPermit = TeslaTower.shockRenderFrames

      monsters.forEach(mst => {
        if (this.inRange(mst)) {
          this.shock(mst)

          // 电击塔不调用父类 shoot，故主动挂载 gem 钩子
          if (this.gem) {
            this.gem.hitHook(this as TowerBase, mst, monsters)
          }
        }
      })

      this.recordShootTime()
    }
  }

  /**
   * 计算范围内随机点
   * circle-formula: (x - a)^2 + (y - b)^2 = r^2
   */
  calculateRandomCirclePoint(): { x: number; y: number } {
    const x = _.random(this.position.x - this.Rng, this.position.x + this.Rng, true)
    const yOffset = Math.pow(this.Rng * this.Rng - Math.pow(x - this.position.x, 2), 0.5)

    return {
      x,
      y: Math.random() > 0.5 ? this.position.y - yOffset : yOffset + this.position.y
    }
  }

  renderLightening(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this.calculateRandomCirclePoint()
    TeslaTower.renderLighteningCop(ctx, this.position.x, this.position.y, x, y, this.Rng / 2)
  }

  rapidRender(ctx: CanvasRenderingContext2D, monsters: MonsterBase[]): void {
    // 如果没有范围内的怪物，不渲染
    if (monsters.every(m => !this.inRange(m))) {
      return
    }

    // 渲染电击闪电
    if (this.renderPermit > 0) {
      this.renderPermit--

      ctx.strokeStyle = 'rgba(232,33,214,.5)'
      const originalLineWidth = ctx.lineWidth
      ctx.lineWidth = 1
      ctx.beginPath()

      for (let i = 0; i < 10; i++) {
        this.renderLightening(ctx)
      }

      ctx.closePath()
      ctx.stroke()
      ctx.lineWidth = originalLineWidth
    }

    // 渲染怪物之间的漏电效果
    ctx.strokeStyle = 'rgba(153,204,255,.5)'
    ctx.beginPath()

    this.monsterShockingRenderingQueue = this.monsterShockingRenderingQueue.filter(item => {
      TeslaTower.renderLighteningCop(ctx, ...item.args)
      return --item.time > 0
    })

    ctx.closePath()
    ctx.stroke()
  }
}
