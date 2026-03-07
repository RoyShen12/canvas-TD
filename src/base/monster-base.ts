/// <reference path="../typedef.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../utils/math-utils.ts" />
/// <reference path="../utils/format-utils.ts" />
/// <reference path="../systems/debuff-manager.ts" />
/// <reference path="../ui/status-board.ts" />
/// <reference path="./item-base.ts" />
/// <reference path="./tower-base.ts" />

/**
 * 所有怪物的基类
 */
class MonsterBase extends ItemBase {
  static informationDesc = new Map<string, string>()

  // ==================== 实例属性 ====================

  protected readonly _level: number

  public readonly maxHealth: number
  protected _health: number

  public readonly maxShield: number
  protected _shield: number

  public _armor: number

  public readonly _baseSpeed: number
  public speedRatio: number = 1

  protected healthChangeHintQueue: number[] = []

  public readonly reward: number
  public readonly damage = 1

  // DOT 效果 - 使用布尔标记保持向后兼容
  public bePoisoned = false
  public beBloodied = false
  public beBurned = false
  public beOnLightEcho: string[] = []

  // 电击效果数据（保持向后兼容）
  public shockDurationTick = 0
  public shockChargeAmount = 0
  public shockLeakChance = 0
  public shockSource: Optional<TeslaTower> = null

  // 控制效果持续时间
  public transformDurationTick = 0
  public imprisonDurationTick = 0
  public freezeDurationTick = 0

  // 诅咒效果
  public imprecatedRatio: { pow: number; durTick: number }[] = []

  public lastAbsDmg = 0

  public isBoss = false
  public isDead = false
  protected isAbstractItem = false
  protected isInvincible = false

  public name: Optional<string> = null
  public description: Optional<string> = null

  public exploitsSeq: string[][]

  public textScrollBox: Optional<HealthChangeHintScrollBox>

  public type = '普通怪物'

  constructor(
    position: Position,
    radius: number,
    borderWidth: number,
    borderStyle: Optional<string>,
    image: string | ImageBitmap | AnimationSprite,
    level: number,
    levelRwdFx: (lvl: number) => number,
    levelSpdFx: (lvl: number) => number,
    levelHthFx: (lvl: number) => number,
    levelAmrFx: (lvl: number) => number,
    levelShdFx?: (lvl: number) => number
  ) {
    super(position, radius, borderWidth, borderStyle, image)

    this._level = level

    this.maxHealth = Math.round(levelHthFx(level))
    this._health = this.maxHealth

    this.maxShield = levelShdFx ? levelShdFx(level) : 0
    this._shield = this.maxShield

    this._armor = Math.min(1000, levelAmrFx(level))

    this._baseSpeed = levelSpdFx(level)

    this.reward = Math.round(levelRwdFx(level))

    this.exploitsSeq = [['赏金', FormatUtils.chineseFormatter(this.reward, 0)]]
  }

  // ==================== Getters ====================

  /** 当前是否受诅咒 */
  get beImprecated(): boolean {
    return this.imprecatedRatio.length > 0
  }

  /** 护甲实际的伤害抵抗程度 */
  get armorResistance(): number {
    return MathUtils.roundWithFixed(this._armor / (100 + this._armor), ENTITY_CONFIG.ARMOR_PRECISION)
  }

  /** 移动速度 */
  get speedValue(): number {
    if (this.beFrozen || this.beImprisoned) return 0
    if (this.beConfused) return this._baseSpeed * -0.5
    return this._baseSpeed * this.speedRatio
  }

  get health(): number {
    return this._health
  }

  get shield(): number {
    return this._shield
  }

  /** 是否被电击 */
  get beShocked(): boolean {
    return this.shockDurationTick > 0
  }

  /** 是否被变形 */
  get beTransformed(): boolean {
    return this.transformDurationTick > 0
  }

  /** 是否被禁锢 */
  get beImprisoned(): boolean {
    return this.imprisonDurationTick > 0
  }

  /** 是否被冻结 */
  get beFrozen(): boolean {
    return this.freezeDurationTick > 0
  }

  /** 是否被混乱 */
  get beConfused(): boolean {
    return false // 暂未实现
  }

  get healthBarHeight(): number {
    return MONSTER_HEALTH_BAR.HEIGHT
  }

  get healthBarWidth(): number {
    return this.radius * 2
  }

  get healthBarBorderStyle(): string {
    return MONSTER_HEALTH_BAR.BORDER_COLOR
  }

  get healthBarFillStyle(): string {
    return MONSTER_HEALTH_BAR.FILL_COLOR
  }

  get healthBarTextFontStyle(): string {
    return MONSTER_HEALTH_BAR.TEXT_FONT
  }

  get healthBarTextFillStyle(): string {
    return MONSTER_HEALTH_BAR.TEXT_COLOR
  }

  /** 是否承受控制类限制效果影响 */
  get isTrapped(): boolean {
    return this.beTransformed || this.beImprisoned || this.beFrozen || this.beConfused || this.speedRatio < 1
  }

  get descriptionChunked(): string[] {
    if (!this.description) return []
    return this.description.split('\n')
  }

  get informationSeq(): string[][] {
    return [
      [this.name || '', ''],
      ['类型', this.type],
      ['生命值', FormatUtils.chineseFormatter(Math.round(this._health), 3) + '/' + FormatUtils.chineseFormatter(Math.round(this.maxHealth), 3)],
      ['移动速度', '' + MathUtils.roundWithFixed(this.speedValue * 60, 1)],
      ['护甲', FormatUtils.formatterUs.format(Math.round(this._armor)) + '（减伤 ' + MathUtils.roundWithFixed(this.armorResistance * 100, 1) + '%）'],
    ]
  }

  get level(): number {
    return this._level
  }

  // ==================== 伤害与治疗 ====================

  /**
   * 应用伤害到目标
   * @param rawDamage 原始伤害值（正数）
   * @returns 实际造成的伤害
   */
  applyDamage(rawDamage: number): number {
    if (rawDamage <= 0 || this.isDead) {
      this.lastAbsDmg = 0
      return 0
    }

    // 计算诅咒倍率
    const curseMultiplier = this.imprecatedRatio.reduce((p, v) => p * v.pow, 1)
    const actualDmg = Math.round(rawDamage * curseMultiplier)

    // 去溢出，记录伤害
    this.lastAbsDmg = Math.min(actualDmg, this._health)

    // 推入伤害提示队列
    this.healthChangeHintQueue.push(this.lastAbsDmg)

    // 应用变更
    this._health -= this.lastAbsDmg

    // 死亡判定
    if (this._health <= 0) {
      if (this.isInvincible) {
        this._health = 1
      } else {
        this.isDead = true
      }
    }

    return this.lastAbsDmg
  }

  /**
   * 应用治疗到目标
   * @param amount 治疗量（正数）
   * @returns 实际治疗量
   */
  applyHealing(amount: number): number {
    if (amount <= 0 || this.isDead) return 0

    const oldHealth = this._health
    this._health = Math.min(this._health + amount, this.maxHealth)

    return this._health - oldHealth
  }

  /**
   * 兼容性 setter
   * @deprecated 请使用 applyDamage(damage) 或 applyHealing(amount) 代替
   */
  set health(newHth: number) {
    const delta = newHth - this._health

    if (delta === 0) return
    if (delta < 0) {
      this.applyDamage(-delta)
    } else {
      this.applyHealing(delta)
    }
  }

  // ==================== Debuff 方法 ====================

  /**
   * 制造特殊效果，每 Tick 调用一次
   * 子类可以覆盖此方法实现特殊能力（如治疗、召唤等）
   */
  makeEffect(_towers: TowerBase[], _monsters: MonsterBase[]): void {
    // 默认空实现，子类按需覆盖
  }

  runDebuffs(): void {
    if (this.shockDurationTick > 0) {
      this.shockDurationTick--
    }

    if (this.transformDurationTick > 0) {
      this.transformDurationTick--
    }

    if (this.imprisonDurationTick > 0) {
      this.imprisonDurationTick--
    }

    if (this.freezeDurationTick > 0) {
      this.freezeDurationTick--
    }

    this.imprecatedRatio = this.imprecatedRatio.filter(imp => --imp.durTick !== 0)
  }

  registerShock(durationTick: number, chargeAmount: number, source: TeslaTower, leakChance: number): void {
    if (durationTick > this.shockDurationTick) {
      this.shockDurationTick = Math.round(durationTick)
      this.shockChargeAmount = chargeAmount
      this.shockSource = source
      this.shockLeakChance = leakChance
    }
  }

  registerTransform(durationTick: number): void {
    if (durationTick > this.transformDurationTick) {
      this.transformDurationTick = Math.round(durationTick)
    }
  }

  registerImprison(durationTick: number): void {
    if (durationTick > this.imprisonDurationTick) {
      this.imprisonDurationTick = Math.round(durationTick)
    }
  }

  registerFreeze(durationTick: number): void {
    if (durationTick > this.freezeDurationTick) {
      this.freezeDurationTick = Math.round(durationTick)
    }
  }

  registerImprecate(durationTick: number, imprecationRatio: number): void {
    this.imprecatedRatio.push({ pow: imprecationRatio, durTick: durationTick })
  }

  runShock(monsters: MonsterBase[]): void {
    if (Math.random() < 1 - this.shockLeakChance) return

    const aliveMonsters = monsters.filter(m => !m.isDead && m !== this)
    if (aliveMonsters.length < 1) return

    const aim = _.minBy(aliveMonsters, mst => {
      return Position.distancePow2(mst.position, this.position)
    })

    if (aim && this.shockSource) {
      aim.applyDamage(this.shockChargeAmount * (1 - aim.armorResistance))
      this.applyDamage(this.shockChargeAmount * (1 - this.armorResistance))
      this.shockSource.recordDamage(aim)
      this.shockSource.recordDamage(this)

      this.shockSource.monsterShockingRenderingQueue.push({
        time: TeslaTower.shockRenderFrames * 2,
        args: [this.position.x, this.position.y, aim.position.x, aim.position.y, Position.distance(aim.position, this.position) / 2],
      })
    }
  }

  run(path: PositionLike[], lifeTokenEmitter: typeof Game.prototype.emitLife, towers: TowerBase[], monsters: MonsterBase[]): void {
    if (this.isDead) return

    this.runDebuffs()

    if (this.beShocked) this.runShock(monsters)
    if (this.isDead) return // 电击自伤可能导致自身死亡

    if (this.beImprisoned || this.beFrozen) {
      // 被禁锢、冻结，无法行动
      void 0
    } else if (path.length === 0) {
      // 完成任务，造成伤害，杀死自己
      lifeTokenEmitter(-this.damage)
      this.isDead = true
    } else {
      // 移动
      this.position.moveTo(path[0]!, this.speedValue)
    }

    if (!this.isDead) {
      this.makeEffect(towers, monsters)
    }
  }

  // ==================== 渲染方法 ====================

  renderHealthChange(context: CanvasRenderingContext2D): void {
    if (!this.textScrollBox) {
      this.textScrollBox = new HealthChangeHintScrollBox(this.position, 200, 14, 8, '#f5222d', 2, 100)
    }

    if (this.healthChangeHintQueue.length > 0) {
      this.healthChangeHintQueue.forEach(str => {
        this.textScrollBox!.push(str)
      })
      this.healthChangeHintQueue.length = 0
    }

    this.textScrollBox.run(context)
  }

  renderHealthBar(context: CanvasRenderingContext2D): void {
    if (this.health <= 0 || this.health / this.maxHealth > 1) return

    const xAxisOffset = this.healthBarWidth < this.radius * 2 ? 0 : this.healthBarWidth / 2 - this.radius
    const yOffset = this.inscribedSquareSideLength / MONSTER_HEALTH_BAR.Y_OFFSET_DIVISOR

    context.strokeStyle = this.healthBarBorderStyle
    context.strokeRect(this.position.x - this.radius - xAxisOffset, this.position.y + yOffset, this.healthBarWidth, this.healthBarHeight)

    context.fillStyle = this.healthBarFillStyle
    context.fillRect(this.position.x - this.radius - xAxisOffset, this.position.y + yOffset, (this.healthBarWidth * this.health) / this.maxHealth, this.healthBarHeight)

    if (this.isBoss) {
      context.save()
      context.fillStyle = this.healthBarTextFillStyle
      context.font = this.healthBarTextFontStyle
      context.fillText(
        `${FormatUtils.chineseFormatter(this.health, 1)}/${FormatUtils.chineseFormatter(this.maxHealth, 1)}`,
        this.position.x + this.radius + xAxisOffset + 2,
        this.position.y + yOffset + 5
      )
      context.restore()
    }
  }

  renderLevel(context: WrappedCanvasRenderingContext2D): void {
    context.font = '6px TimesNewRoman'
    context.fillStyle = context.manager.towerLevelTextStyle
    context.fillText(
      'lv ' + this._level,
      this.position.x + this.radius * TOWER_RENDER_OFFSETS.LEVEL_TEXT_X,
      this.position.y + this.radius * TOWER_RENDER_OFFSETS.LEVEL_TEXT_Y
    )
  }

  renderDebuffs(context: CanvasRenderingContext2D, imgCtl: ImageManager): void {
    const dSize = 10

    const debuffs: Optional<ImageBitmap>[] = []
    if (this.bePoisoned) debuffs.push(imgCtl.getImage('buff_poison'))
    if (this.beBloodied) debuffs.push(imgCtl.getImage('buff_bloody'))
    if (this.beImprecated) debuffs.push(imgCtl.getImage('buff_imprecate'))
    if (this.beBurned) debuffs.push(imgCtl.getImage('buff_burn'))
    if (this.beOnLightEcho.length > 0) debuffs.push(imgCtl.getImage('buff_light_echo'))
    if (this.beImprisoned) debuffs.push(imgCtl.getImage('buff_imprison'))
    if (this.beFrozen) debuffs.push(imgCtl.getImage('buff_freeze'))
    if (this.beShocked) debuffs.push(imgCtl.getImage('buff_shock'))
    if (this.beTransformed) debuffs.push(imgCtl.getImage('buff_transform'))

    debuffs.forEach((dbf, idx) => {
      if (!dbf) return
      const x = this.position.x - this.radius + dSize * idx
      const y = this.position.y - this.radius - dSize
      context.drawImage(dbf, x, y, dSize - 1, dSize - 1)
    })
  }

  renderStatusBoard(bx1: number, _bx2: number, by1: number, _by2: number, showGemPanel: boolean, showMoreDetail: boolean): void {
    const data: IStatusBoardData = {
      position: this.position,
      radius: this.radius,
      informationSeq: this.informationSeq,
      descriptionChunked: this.descriptionChunked,
      exploitsSeq: this.exploitsSeq,
      canInsertGem: false,
      gem: null,
      id: this.id,
      isMaxLevel: true,
      level: this._level,
      price: [],
      constructorRef: TowerBase,
      inlayGem: () => null as unknown as GemBase,
    }

    StatusBoardRenderer.render(
      data,
      bx1,
      by1,
      showGemPanel,
      showMoreDetail,
      180,
      Game.callElement.bind(Game),
      Game.callMoney.bind(Game),
      Game.updateGemPoint,
      (delta: number) => {
        Game.updateGemPoint += delta
      }
    )
  }

  override render(context: CanvasRenderingContext2D, imgCtl: ImageManager): void {
    const fontTmp = context.font

    super.render(context)
    this.renderHealthBar(context)
    this.renderHealthChange(context)
    this.renderDebuffs(context, imgCtl)

    context.font = fontTmp
  }

  override destroy(): void {
    super.destroy()
    // 清理 debuff 管理器中的数据
    debuffManager.clearEntity(this.id)
  }
}
