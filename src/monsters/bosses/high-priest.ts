/// <reference path="../../base.ts" />
/// <reference path="../helpers.ts" />

// ============================================================================
// 龙人萨满（Boss）
// ============================================================================

/**
 * 龙人萨满（Boss）
 * 能够周期性治疗周围怪物的首领
 */
class HighPriest extends MonsterBase {
  static readonly imgName = '$spr::m_b_worm_dragon'
  static readonly sprSpd = 6

  static readonly rwd = (lvl: number): number => 240 * lvl + 1320
  static readonly spd = (_lvl: number): number => 0.11
  static readonly hth = (lvl: number): number => 14400 + lvl * 8000
  static readonly amr = (_lvl: number): number => 14

  /** 治疗间隔（毫秒） */
  static readonly healingInterval = (_lvl: number): number => 5000
  /** 治疗量 */
  static readonly healingPower = (lvl: number): number => 40 * (Math.floor(lvl / 2) + 1)
  /** 治疗范围（像素） */
  static readonly healingRange = (_lvl: number): number => 30

  private lastHealTime: number = performance.now()
  /** 当前的治疗冷却间隔（在每次治疗后重新随机） */
  private _currentHealInterval: number

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, level: number) {
    super(
      position,
      calcBossMonsterRadius(),
      0,
      null,
      image,
      level,
      HighPriest.rwd,
      HighPriest.spd,
      HighPriest.hth,
      HighPriest.amr
    )

    this.isBoss = true
    this.name = '龙人萨满'
    this.type = '首领'
    this.description = '能够治愈周围同伴的远古萨满'

    this._currentHealInterval = this._rollHealInterval()
  }

  override get healthBarWidth(): number {
    return this.radius * 2.5
  }

  override get healthBarHeight(): number {
    return 4
  }

  /** 是否可以进行治疗 */
  get canHeal(): boolean {
    return performance.now() - this.lastHealTime > this._currentHealInterval
  }

  /** 生成一个带随机波动的治疗间隔 */
  private _rollHealInterval(): number {
    const base = HighPriest.healingInterval(this.level)
    const variance = MONSTER_CONFIG.HIGH_PRIEST_HEAL_INTERVAL_VARIANCE
    return _.random(base - variance, base + variance, false)
  }

  /** 当前等级的治疗量 */
  get healingPower(): number {
    return HighPriest.healingPower(this.level)
  }

  /** 当前等级的治疗范围 */
  get healingRange(): number {
    return HighPriest.healingRange(this.level)
  }

  /**
   * 检查目标是否在治疗范围内
   * @param target 目标怪物
   */
  inHealingRange(target: MonsterBase): boolean {
    return Position.distancePow2(target.position, this.position) < this.healingRange * this.healingRange
  }

  /**
   * 治疗目标
   * @param target 目标怪物
   */
  heal(target: MonsterBase): void {
    target.applyHealing(this.healingPower)
  }

  /**
   * 周期性治愈周围怪物单位
   */
  override makeEffect(_towers: TowerBase[], monsters: MonsterBase[]): void {
    if (this.canHeal) {
      // 播放治疗动画
      const animPos = new Position(
        this.position.x - this.healingRange / 2,
        this.position.y - this.healingRange / 2
      )
      Game.callAnimation('healing_1', animPos, this.healingRange, this.healingRange, 1, 0)

      // 治疗范围内的所有同伴（不包括自己和已死亡单位）
      monsters.forEach(m => {
        if (m !== this && !m.isDead && this.inHealingRange(m)) {
          this.heal(m)
        }
      })

      this.lastHealTime = performance.now()
      this._currentHealInterval = this._rollHealInterval()
    }
  }
}
