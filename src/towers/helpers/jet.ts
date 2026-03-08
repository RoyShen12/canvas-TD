/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../bullets/index.ts" />
/// <reference path="../../utils/object-utils.ts" />

/**
 * _Jet - 航母载机类
 * CarrierTower 生成的独立作战单位
 */
class _Jet extends TowerBase {
  /** 载机行动模式 */
  static JetActMode = {
    /** 自主模式 */
    autonomous: 1,
    /** F1模式（玩家控制） */
    f1: 2,
    /** 切换模式 */
    switch(oldMode: number): number {
      return oldMode === this.autonomous ? this.f1 : this.autonomous
    }
  }

  /** 载机武器系统 */
  static JetWeapons = {
    /** 获取武器类名 */
    getCtorName(mode: number): string {
      return mode === 1 ? 'CarrierTower.Jet.JetWeapons.MachineGun' : 'CarrierTower.Jet.JetWeapons.AutoCannons'
    },

    /**
     * 15mm 高速机枪
     */
    MachineGun: class _MachineGun extends BulletBase {
      constructor(position: Position, atk: number, target: MonsterBase) {
        const bulletVelocity = 22
        super(position, 1, 0, null, 'rgb(55,14,11)', atk, bulletVelocity, target)
      }

      override hit(monster: MonsterBase, magnification = 1): void {
        monster.applyDamage(this.Atk * magnification * (1 - monster.armorResistance * 0.65))
        this.emitter(monster)
      }
    },

    /**
     * 30mm 机炮
     */
    AutoCannons: class _AutoCannons extends CannonBullet {
      constructor(position: Position, atk: number, target: MonsterBase) {
        const explodeRange = 20
        const burnDotDamage = atk * 16
        const extraRatioCalc = (m: MonsterBase) => 1 + m.armorResistance
        super(position, atk, target, null, atk * 2, explodeRange, burnDotDamage, 150, 3000, -1, extraRatioCalc)
      }
    }
  }

  /** 当前行动模式 */
  public actMode = _Jet.JetActMode.autonomous

  /**
   * 武器模式
   * 1. 速射机枪
   * 2. 30mm 机炮
   */
  public weaponMode = 1

  /** 前进目的地 (仅在 F1 模式有效) */
  public destinationPosition: Position

  /** 描述文本 */
  private inner_desc_init = '航母的载机\n+ 机动性极强\n+ 拥有 15mm 速射机枪和 30mm 反装甲机炮两种武器'

  /** 所属航母 */
  public carrierTower: CarrierTower

  constructor(
    position: Position,
    image: string | AnimationSprite | ImageBitmap,
    _bulletImage: any,
    radius: number,
    carrierTower: CarrierTower
  ) {
    super(
      position,
      radius,
      0,
      null,
      image,
      [],
      carrierTower.levelAtkFx,
      carrierTower.levelHstFx,
      carrierTower.levelSlcFx,
      carrierTower.levelRngFx
    )

    this.controlable = true
    this.name = '航母载机'
    this.carrierTower = carrierTower
    this.canInsertGem = false
    this.destinationPosition = Position.ORIGIN
    this.description = this.inner_desc_init

    // 动态绑定子弹类名
    ObjectUtils.addFinalGetterProperty(this, 'bulletCtorName', () => _Jet.JetWeapons.getCtorName(this.weaponMode))

    // 动态绑定等级
    ObjectUtils.addFinalGetterProperty(this, 'level', () => this.carrierTower.level)

    // 绑定伤害计算
    this.calculateDamageRatio = (mst: MonsterBase) => this.carrierTower.calculateDamageRatio(mst)

    // 重新绑定 boundCalculateDamageRatio（super() 中绑定的是原始方法，此处已替换）
    this.boundCalculateDamageRatio = this.calculateDamageRatio.bind(this)
  }

  /**
   * 攻击补正
   * 对基础攻击的 Δ 补正
   */
  get attackSupplement(): number {
    return this.weaponMode === 1
      ? this.carrierTower.Atk * CARRIER_CONSTANTS.JET_ATTACK_SUPPLEMENT_RATIO
      : Math.pow(this.level + 2, CARRIER_CONSTANTS.JET_ATTACK_POWER_EXPONENT) * CARRIER_CONSTANTS.JET_ATTACK_POWER_MULTIPLIER
  }

  /**
   * 攻速系数
   * 对基础每秒攻击次数的 γ 系数
   */
  get hasteSupplementRate(): number {
    return this.weaponMode === 1
      ? CARRIER_CONSTANTS.JET_HASTE_SUPPLEMENT_RATE_BASE + this.level * CARRIER_CONSTANTS.JET_HASTE_SUPPLEMENT_GROWTH
      : 1
  }

  override get Atk(): number {
    return this.carrierTower.Atk + this.attackSupplement
  }

  override get Slc(): number {
    return this.carrierTower.Slc + (this.weaponMode === 1 ? 1 : 0)
  }

  override get Rng(): number {
    return this.carrierTower.Rng
  }

  override get HstPS(): number {
    return this.carrierTower.HstPS * this.hasteSupplementRate
  }

  get Spd(): number {
    return this.carrierTower.Spd
  }

  override get exploitsSeq(): string[][] {
    return []
  }

  override get informationSeq(): string[][] {
    const removing = ['等级', '下一级', '售价']
    return super.informationSeq.filter(line => !removing.some(rm => rm === line[0]))
  }

  get hasCurrentTarget(): boolean {
    return !!this.target && !this.target.isDead
  }

  override get sellingPrice(): number {
    return 0
  }

  override gemHitHook(_idx: number, monsters: MonsterBase[]): void {
    if (this.carrierTower.gem && this.target && !this.target.isDead) {
      this.carrierTower.gem.hitHook(this.carrierTower, this.target, monsters)
    }
  }

  override gemAttackHook(monsters: MonsterBase[]): void {
    if (this.carrierTower.gem) {
      this.carrierTower.gem.attackHook(this.carrierTower, monsters)
    }
  }

  override get totalDamage(): number {
    return 0
  }

  override set totalDamage(v: number) {
    if (this.carrierTower) {
      this.carrierTower.totalDamage += v
    }
  }

  override get killCount(): number {
    return 0
  }

  override set killCount(v: number) {
    if (this.carrierTower) {
      this.carrierTower.killCount += v
    }
  }

  /** 记录伤害并转发给航母 */
  override recordDamage(monster: MonsterBase): void {
    const { lastAbsDmg, isDead, isBoss } = monster
    // 将伤害统计转发给航母
    if (this.carrierTower) {
      this.carrierTower.addDamage(lastAbsDmg)
    }
    Game.updateGemPoint += TowerBase.damageToPoint(lastAbsDmg)

    if (isDead) {
      this.recordKill()
      Game.updateGemPoint += (isBoss ? TowerBase.killBossPointEarnings : TowerBase.killNormalPointEarnings) + (this.carrierTower?._killExtraPoint ?? 0)

      if (this.carrierTower?.gem) {
        this.carrierTower.gem.killHook(this.carrierTower, monster)
      }
    }
  }

  /** 记录击杀并转发给航母 */
  protected override recordKill(): void {
    if (this.carrierTower) {
      this.carrierTower.addKill()
    }
    // 击杀额外金币来自航母（宝石效果设置在航母上）
    this.gameContext.getMoney()[1](this.carrierTower?._killExtraGold ?? 0)
  }

  /**
   * 在怪物中重选目标
   * 找到威胁最大的(距离终点最近的)
   */
  reChooseMostThreateningTarget(targetList: MonsterBase[]): void {
    this.target = _.minBy(targetList.filter(m => !m.isDead), mst => {
      return Position.distancePow2(Game.callDestinationPosition(), mst.position)
    }) ?? null
  }

  /**
   * 自主模式运行逻辑
   */
  autonomouslyRun(monsters: MonsterBase[]): void {
    // 当前目标失效
    if (!this.hasCurrentTarget) {
      this.reChooseMostThreateningTarget(monsters)
    }

    if (this.hasCurrentTarget && this.target) {
      // 当前目标在范围内
      if (this.inRange(this.target)) {
        if (this.canShoot) {
          this.shoot(monsters)
        }
      }
      // 当前目标超出范围，移动接近
      else {
        this.position.moveTo(this.target.position, this.Spd)
      }
    }
  }

  override run(monsters: MonsterBase[]): void {
    switch (this.actMode) {
      case _Jet.JetActMode.autonomous:
        this.autonomouslyRun(monsters)
        break

      case _Jet.JetActMode.f1:
        super.run(monsters)

        // 移动到目标位置
        if (Position.distance(this.position, this.destinationPosition) > this.radius * 2) {
          this.position.moveTo(this.destinationPosition, this.Spd)
        }
        break
    }
  }

  override render(): void {}

  override destroy(): void {
    super.destroy()
    // 减少航母载机计数，允许航母生成新载机
    if (this.carrierTower) {
      this.carrierTower.jetCount = Math.max(0, this.carrierTower.jetCount - 1)
      this.carrierTower.clearJetCache()
    }
  }

  override renderLevel(): void {}

  override renderImage(ctx: CanvasRenderingContext2D): void {
    if (this.target) {
      BulletBase.prototype.renderImage.call(this, ctx)
    } else {
      super.renderImage(ctx)
    }
  }

  rapidRender(ctxRapid: CanvasRenderingContext2D): void {
    super.render(ctxRapid)
  }
}
