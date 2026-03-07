/// <reference path="../typedef.ts" />
/// <reference path="../debug.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../timer-manager.ts" />
/// <reference path="../utils/math-utils.ts" />
/// <reference path="../utils/format-utils.ts" />
/// <reference path="../utils/object-utils.ts" />
/// <reference path="../ui/status-board.ts" />
/// <reference path="../motion.ts" />
/// <reference path="../legendary-gem.ts" />
/// <reference path="./item-base.ts" />

/**
 * 所有塔的抽象基类
 */
abstract class TowerBase extends ItemBase {
  // ==================== 静态属性 ====================

  /** 信息描述映射 */
  static informationDesc = new Map([
    ['等级', '鼠标单击图标或按 [C] 键来消耗金币升级，等级影响很多属性，到达某个等级可以晋升'],
    ['下一级', '升级到下一级需要的金币数量'],
    ['售价', '出售此塔可以返还的金币数量'],
    ['伤害', '此塔的基础攻击力'],
    ['攻击速度', '此塔的每秒攻击次数'],
    ['射程', '此塔的索敌距离，单位是像素'],
    ['弹药储备', '此塔每次攻击时发射的弹药数量'],
    ['DPS', '估计的每秒伤害'],
  ])

  /** 可用的传奇宝石列表 */
  static Gems = [
    { ctor: PainEnhancer, name: 'PainEnhancer' },
    { ctor: GogokOfSwiftness, name: 'GogokOfSwiftness' },
    { ctor: MirinaeTeardropOfTheStarweaver, name: 'MirinaeTeardropOfTheStarweaver' },
    { ctor: SimplicitysStrength, name: 'SimplicitysStrength' },
    { ctor: BaneOfTheStricken, name: 'BaneOfTheStricken' },
    { ctor: GemOfEase, name: 'GemOfEase' },
    { ctor: GemOfMysterious, name: 'GemOfMysterious' },
    { ctor: BaneOfTheTrapped, name: 'BaneOfTheTrapped' },
    { ctor: ZeisStoneOfVengeance, name: 'ZeisStoneOfVengeance' },
    { ctor: EchoOfLight, name: 'EchoOfLight' },
    { ctor: GemOfAnger, name: 'GemOfAnger' },
    { ctor: BrokenPieces, name: 'BrokenPieces' },
  ]

  /** 禁用的宝石名称列表 */
  protected static deniedGems: string[] = []

  /** 宝石名称转构造函数 */
  static GemNameToGemCtor(gn: string): IGemBase {
    const gem = this.Gems.find(g => g.name === gn)
    if (!gem) {
      throw new Error(`[TowerBase] 未找到名为 "${gn}" 的宝石`)
    }
    return gem.ctor
  }

  /** 生成宝石选项 HTML */
  static get GemsToOptionsInnerHtml(): string {
    return this.Gems.map((gemCtor, idx) => {
      const disabled = this.deniedGems.includes(gemCtor.name)
      return `<option value='${gemCtor.name}'${idx === 0 ? ' selected' : ''}${disabled ? ' disabled' : ''}>${gemCtor.ctor.gemName}${disabled ? ' - 不能装备到此塔' : ''}</option>`
    }).join('')
  }

  static get levelUpPointEarnings(): number {
    return ENTITY_CONFIG.LEVEL_UP_POINT_EARNINGS
  }

  static get killNormalPointEarnings(): number {
    return ENTITY_CONFIG.KILL_NORMAL_POINT_EARNINGS
  }

  static get killBossPointEarnings(): number {
    return ENTITY_CONFIG.KILL_BOSS_POINT_EARNINGS
  }

  static damageToPoint(damage: number): number {
    return Math.round(damage / ENTITY_CONFIG.DAMAGE_TO_POINT_DIVISOR)
  }

  // ==================== 实例属性 ====================

  protected readonly bornStamp: number

  public readonly bulletCtl = new BulletManager()
  public bulletImage: Optional<ImageBitmap> = null
  public bulletCtorName = ''

  public level = 0
  protected rank = 0

  public readonly price: ArrayLike<number>

  public levelAtkFx: (lvl: number) => number
  public levelHstFx: (lvl: number) => number
  public levelSlcFx: (lvl: number) => number
  public levelRngFx: (lvl: number) => number

  public target: Optional<MonsterBase> = null

  private _lastShootTime: number
  protected _totalDamage = 0
  protected _killCount = 0

  public gem: Optional<GemBase> = null
  public canInsertGem = true

  // 属性修正值
  public _attackSpeedRatio = 1
  public _damageRatio = 1
  public _killExtraGold = 0
  public _killExtraPoint = 0
  public _onBossAtkRatio = 1
  public _onTrappedAtkRatio = 1
  public _angerGemAtkRatio = 1
  public _maxRangeAtkRatio = 1
  public _minRangeAtkRatio = 1
  public _eachMonsterDamageRatio: Map<number, number> = new Map()

  public description: Optional<string> = null
  public name: Optional<string> = null

  public isSold = false

  public _gridIx!: number
  public _gridIy!: number

  constructor(
    position: Position,
    radius: number,
    borderWidth: number,
    borderStyle: Optional<string>,
    image: string | ImageBitmap | AnimationSprite,
    price: ArrayLike<number>,
    levelAtkFx: (lvl: number) => number,
    levelHstFx: (lvl: number) => number,
    levelSlcFx: (lvl: number) => number,
    levelRngFx: (lvl: number) => number
  ) {
    super(position, radius, borderWidth, borderStyle, image)

    this.bornStamp = performance.now()
    this.price = price
    this.levelAtkFx = levelAtkFx
    this.levelHstFx = levelHstFx
    this.levelSlcFx = levelSlcFx
    this.levelRngFx = levelRngFx
    this._lastShootTime = this.bornStamp

    // 定期清理已死亡怪物的伤害比例记录
    this.intervalTimers.push(
      setInterval(() => {
        const monsters = this.gameContext.getMonsterList()
        Array.from(this._eachMonsterDamageRatio)
          .filter(([k]) => monsters.every(mst => mst.id !== k))
          .forEach(([k]) => this._eachMonsterDamageRatio.delete(k))
      }, GAME_CONFIG.DOT_CLEANUP_INTERVAL)
    )
  }

  // ==================== Getters ====================

  get descriptionChunked(): string[] {
    if (!this.description) return []
    return this.description.split('\n')
  }

  get sellingPrice(): number {
    let s = 0
    for (let i = 0; i < this.level + 1; i++) {
      s += this.price[i] || 0
    }
    if (this.gem) s += (this.gem.constructor as typeof GemBase).price
    return Math.ceil(s * ENTITY_CONFIG.TOWER_SELL_RATIO)
  }

  /** 攻击力 */
  get Atk(): number {
    return this.levelAtkFx(this.level) * this._damageRatio * this._angerGemAtkRatio
  }

  /** 攻击间隔 (ms) */
  get Hst(): number {
    return 1000 / this.HstPS
  }

  /** 每秒攻击次数 */
  get HstPS(): number {
    return this.levelHstFx(this.level) * this._attackSpeedRatio
  }

  /** 每次攻击的发射量 */
  get Slc(): number {
    return this.levelSlcFx(this.level)
  }

  /** 射程 */
  get Rng(): number {
    return this.getRelativeRange(this.levelRngFx(this.level)) + this.radius
  }

  /** 计算的理论每秒输出 */
  get DPS(): number {
    return this.Atk * this.Slc * this.HstPS
  }

  /** 展示信息 */
  get informationSeq(): string[][] {
    return [
      [this.name || '', ''],
      ['等级', this.levelHuman],
      ['下一级', this.isMaxLevel ? '最高等级' : '$ ' + FormatUtils.formatterUs.format(Math.round(this.price[this.level + 1] || 0))],
      ['售价', '$ ' + FormatUtils.formatterUs.format(Math.round(this.sellingPrice))],
      ['伤害', FormatUtils.chineseFormatter(Math.round(this.Atk), 3)],
      ['攻击速度', '' + MathUtils.roundWithFixed(this.HstPS, 2)],
      ['射程', FormatUtils.formatterUs.format(Math.round(this.Rng))],
      ['弹药储备', '' + Math.round(this.Slc)],
      ['DPS', FormatUtils.chineseFormatter(this.DPS, 3)],
    ]
  }

  /** 实际每秒输出 */
  get ADPS(): number {
    return (this._totalDamage / (performance.now() - this.bornStamp)) * 1000
  }

  get ADPSH(): string {
    return FormatUtils.chineseFormatter(MathUtils.roundWithFixed(this.ADPS, 3), 3)
  }

  get exploitsSeq(): string[][] {
    return [
      ['击杀', '' + this._killCount],
      ['输出', FormatUtils.chineseFormatter(this._totalDamage, 3)],
      ['每秒输出', this.ADPSH],
    ]
  }

  protected get isCurrentTargetAvailable(): boolean {
    if (!this.target || this.target.isDead) return false
    return this.inRange(this.target)
  }

  get canShoot(): boolean {
    return performance.now() - this._lastShootTime > this.Hst
  }

  get isMaxLevel(): boolean {
    return this.price.length - 1 === this.level
  }

  get levelHuman(): string {
    return '' + (this.level + 1)
  }

  // ==================== 核心方法 ====================

  /** 记录击杀 */
  protected recordKill(): void {
    this._killCount++
    this.gameContext.getMoney()[1](this._killExtraGold)
  }

  /** 增加伤害统计（供子类转发使用） */
  public addDamage(amount: number): void {
    this._totalDamage += amount
  }

  /** 增加击杀统计（供子类转发使用） */
  public addKill(): void {
    this._killCount++
  }

  /** 记录伤害 */
  public recordDamage(monster: MonsterBase): void {
    const { lastAbsDmg, isDead, isBoss } = monster
    this._totalDamage += lastAbsDmg
    Game.updateGemPoint += TowerBase.damageToPoint(lastAbsDmg)

    if (isDead) {
      this.recordKill()
      Game.updateGemPoint += (isBoss ? TowerBase.killBossPointEarnings : TowerBase.killNormalPointEarnings) + this._killExtraPoint

      // 清理 BaneOfTheStricken 的伤害比例记录
      this._eachMonsterDamageRatio.delete(monster.id)

      if (this.gem) {
        this.gem.killHook(this, monster)
      }
    }
  }

  /** 检查目标是否在射程内 */
  public inRange(target: MonsterBase): boolean {
    const t = this.Rng + target.radius
    return Position.distancePow2(target.position, this.position) < t * t
  }

  /** 计算伤害倍率 */
  public calculateDamageRatio(mst: MonsterBase): number {
    const bossR = mst.isBoss ? this._onBossAtkRatio : 1
    const particularR = this._eachMonsterDamageRatio.get(mst.id) || 1
    const trapR = mst.isTrapped ? this._onTrappedAtkRatio : 1
    const R = Position.distance(this.position, mst.position) / this.Rng
    const rangeR = this._minRangeAtkRatio * (1 - R) + this._maxRangeAtkRatio * R
    return bossR * particularR * trapR * rangeR
  }

  /** 插入传奇宝石 */
  inlayGem(gemCtorName: string): GemBase {
    this.gem = new (TowerBase.GemNameToGemCtor(gemCtorName))()
    this.gem.initEffect(this)

    if (__global_test_mode) {
      while (!this.gem.isMaxLevel && this.gem.level < 1e6) {
        Game.updateGemPoint -= this.gem.levelUp(Game.updateGemPoint)
      }
    }

    return this.gem
  }

  /** 在怪物中重选目标 */
  reChooseTarget(targetList: MonsterBase[], _index?: number): void {
    for (const t of _.shuffle(targetList)) {
      if (!t.isDead && this.inRange(t)) {
        this.target = t
        return
      }
    }
    this.target = null
  }

  produceBullet(_i: number, _monsters: MonsterBase[]): void {
    if (this.target) {
      const ratio = this.calculateDamageRatio(this.target)
      this.bulletCtl.Factory(
        this.recordDamage.bind(this),
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk * ratio,
        this.target,
        this.bulletImage
      )
    }
  }

  recordShootTime(): void {
    this._lastShootTime = performance.now()
  }

  run(monsters: MonsterBase[]): void {
    if (this.canShoot) {
      if (!this.isCurrentTargetAvailable) {
        this.reChooseTarget(monsters)
      }
      if (this.target) {
        this.shoot(monsters)
      }
    }
  }

  shoot(monsters: MonsterBase[]): void {
    this.gemAttackHook(monsters)

    for (let i = 0; i < this.Slc; i++) {
      this.produceBullet(i, monsters)
      this.gemHitHook(i, monsters)
    }
    this.recordShootTime()
  }

  gemHitHook(_idx: number, monsters: MonsterBase[]): void {
    if (this.gem && this.target) {
      this.gem.hitHook(this, this.target, monsters)
    }
  }

  gemAttackHook(monsters: MonsterBase[]): void {
    if (this.gem) {
      this.gem.attackHook(this, monsters)
    }
  }

  levelUp(currentMoney: number): number {
    if (this.isMaxLevel) return 0

    if (this.price[this.level + 1]! > currentMoney) {
      return 0
    } else {
      this.level += 1

      const dim = ANIMATION_DIMENSIONS.LEVEL_UP
      const w = this.inscribedSquareSideLength * dim.SCALE
      this.gameContext.playAnimation(
        'level_up',
        new Position(this.position.x - this.radius, this.position.y - this.radius * 2),
        w,
        (w / dim.WIDTH) * dim.HEIGHT,
        GAME_CONFIG.LEVEL_UP_ANIMATION_SPEED
      )

      Game.updateGemPoint += TowerBase.levelUpPointEarnings

      return this.price[this.level]!
    }
  }

  rankUp(): void {
    this.rank += 1

    const dim = ANIMATION_DIMENSIONS.RANK_UP
    const w = this.inscribedSquareSideLength * dim.SCALE
    this.gameContext.playAnimation(
      'rank_up',
      new Position(this.position.x - this.radius, this.position.y - this.radius * 2),
      w,
      (w / dim.WIDTH) * dim.HEIGHT,
      GAME_CONFIG.LEVEL_UP_ANIMATION_SPEED,
      0,
      dim.OFFSET_Y
    )
  }

  // ==================== 渲染方法 ====================

  renderRange(context: CanvasRenderingContext2D, style = 'rgba(177,188,45,.05)'): void {
    context.fillStyle = style
    context.beginPath()
    context.arc(this.position.x, this.position.y, this.Rng, 0, Math.PI * 2, true)
    context.closePath()
    context.fill()
  }

  renderLevel(context: WrappedCanvasRenderingContext2D): void {
    const fontTmp = context.font
    context.font = '6px TimesNewRoman'
    context.fillStyle = context.manager.towerLevelTextStyle
    context.fillText(
      'lv ' + this.levelHuman,
      this.position.x + this.radius * TOWER_RENDER_OFFSETS.LEVEL_TEXT_X,
      this.position.y + this.radius * TOWER_RENDER_OFFSETS.LEVEL_TEXT_Y
    )
    context.font = fontTmp
  }

  renderRankStars(context: CanvasRenderingContext2D): void {
    if (this.rank > 0) {
      const l2 = Math.floor(this.rank / 4)
      const l1 = this.rank % 4

      const py = this.position.y + this.radius * TOWER_RENDER_OFFSETS.RANK_STAR_Y
      const px = this.position.x + this.radius * TOWER_RENDER_OFFSETS.RANK_STAR_X

      for (let i = 0; i < l2; i++) {
        context.drawImage(
          this.gameContext.getImageBitmap('p_ruby')!,
          px + TOWER_RENDER_OFFSETS.STAR_LARGE_SPACING * i,
          py,
          TOWER_RENDER_OFFSETS.STAR_SIZE,
          TOWER_RENDER_OFFSETS.STAR_SIZE
        )
      }
      for (let i = 0; i < l1; i++) {
        context.drawImage(
          this.gameContext.getImageBitmap('star_m')!,
          px + TOWER_RENDER_OFFSETS.STAR_SMALL_SPACING * i + TOWER_RENDER_OFFSETS.STAR_LARGE_SPACING * l2,
          py,
          TOWER_RENDER_OFFSETS.STAR_SIZE,
          TOWER_RENDER_OFFSETS.STAR_SIZE
        )
      }
    }
  }

  renderPreparationBar(context: CanvasRenderingContext2D): void {
    if (this.canShoot) return
    context.fillStyle = 'rgba(25,25,25,.3)'
    RenderUtils.renderSector(
      context,
      this.position.x,
      this.position.y,
      this.radius,
      0,
      Math.PI * 2 * (1 - (performance.now() - this._lastShootTime) / this.Hst),
      false
    ).fill()
  }

  override render(context: CanvasRenderingContext2D): void {
    super.render(context)
    this.renderLevel(context as WrappedCanvasRenderingContext2D)
    this.renderRankStars(context)
  }

  abstract rapidRender(ctxRapid: CanvasRenderingContext2D, monsters: MonsterBase[]): void

  /**
   * 渲染状态面板
   * 使用 StatusBoardRenderer 进行渲染
   * 支持简化调用（通过 .call() 传递部分属性的对象）
   */
  renderStatusBoard(
    bx1: number,
    _bx2: number,
    by1: number,
    _by2: number,
    showGemPanel: boolean,
    showMoreDetail: boolean,
    specifiedWidth?: number
  ): void {
    // 支持简化调用：检查 this 是否为完整的 TowerBase 实例
    const isFullInstance = typeof this.inlayGem === 'function'

    const data: IStatusBoardData = {
      position: this.position,
      radius: this.radius,
      informationSeq: this.informationSeq,
      descriptionChunked: this.descriptionChunked,
      exploitsSeq: this.exploitsSeq,
      canInsertGem: isFullInstance ? this.canInsertGem : false,
      gem: isFullInstance ? (this.gem ?? null) : null,
      id: isFullInstance ? this.id : 0,
      isMaxLevel: isFullInstance ? this.isMaxLevel : true,
      level: isFullInstance ? this.level : 0,
      price: isFullInstance ? this.price : { length: 0 },
      constructorRef: isFullInstance ? (this.constructor as typeof TowerBase) : TowerBase,
      inlayGem: isFullInstance ? this.inlayGem.bind(this) : () => null as unknown as GemBase,
    }

    StatusBoardRenderer.render(
      data,
      bx1,
      by1,
      showGemPanel,
      showMoreDetail,
      specifiedWidth || 150,
      Game.callElement.bind(Game),
      Game.callMoney.bind(Game),
      Game.updateGemPoint,
      (delta: number) => {
        Game.updateGemPoint += delta
      }
    )
  }

  // ==================== 公开访问器 ====================
  // 提供对内部统计数据的只读访问

  /** 获取总伤害 */
  get totalDamage(): number {
    return this._totalDamage
  }

  /** 设置总伤害（供子类 override） */
  set totalDamage(v: number) {
    this._totalDamage = v
  }

  /** 获取击杀数 */
  get killCount(): number {
    return this._killCount
  }

  /** 设置击杀数（供子类 override） */
  set killCount(v: number) {
    this._killCount = v
  }
}
