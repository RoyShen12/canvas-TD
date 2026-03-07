/// <reference path="../../base.ts" />
/// <reference path="../helpers.ts" />

// ============================================================================
// 地狱之王（Boss）
// ============================================================================

/**
 * 地狱之王（Boss）
 * 强大的首领，能够周期性召唤小型恶魔
 */
class Devil extends MonsterBase {
  static readonly imgName = '$spr::m_devil'
  static readonly sprSpd = 6

  static readonly rwd = (lvl: number): number => 340 * lvl + 420
  static readonly spd = (_lvl: number): number => 0.14
  static readonly hth = (lvl: number): number => 15500 + lvl * 13000
  static readonly amr = (lvl: number): number => 32 + lvl

  /** 召唤间隔（毫秒） */
  static readonly summonInterval = (): number => 7000

  private lastSummonTime: number = performance.now()

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, level: number) {
    super(
      position,
      Game.callGridSideSize() / MONSTER_CONFIG.DEVIL_RADIUS_DIVISOR + MONSTER_CONFIG.DEVIL_RADIUS_OFFSET,
      0,
      null,
      image,
      level,
      Devil.rwd,
      Devil.spd,
      Devil.hth,
      Devil.amr
    )

    this.isBoss = true
    this.name = '地狱之王'
    this.type = '首领'
    this.description = '来自深渊的恐怖存在，能够召唤恶魔仆从'
  }

  override get healthBarWidth(): number {
    return this.radius * 2.5
  }

  override get healthBarHeight(): number {
    return 4
  }

  /** 是否可以召唤 */
  get canSummon(): boolean {
    return performance.now() - this.lastSummonTime > Devil.summonInterval()
  }

  /** 召唤数量（随等级增加） */
  get summonCount(): number {
    return 1 + Math.floor(this._level / MONSTER_CONFIG.DEVIL_SUMMON_LEVEL_DIVISOR)
  }

  /**
   * 周期性召唤恶魔崽
   */
  override makeEffect(_towers: TowerBase[], _monsters: MonsterBase[]): void {
    if (this.canSummon) {
      this.summonMinions()
      this.lastSummonTime = performance.now()
    }
  }

  /**
   * 召唤小型恶魔
   */
  private summonMinions(): void {
    const count = this.summonCount
    const offsetRange = MONSTER_CONFIG.DEVIL_SUMMON_OFFSET_RANGE

    for (let i = 0; i < count; i++) {
      // 在 Devil 周围随机位置生成
      const spawnPos = new Position(
        this.position.x + _.random(-offsetRange, offsetRange),
        this.position.y + _.random(-offsetRange, offsetRange)
      )
      Game.callMonsterSpawn('DemonSpawn', spawnPos, this._level)
    }
  }
}
