/// <reference path="../base.ts" />

// ============================================================================
// 怪物管理器
// ============================================================================

/**
 * 怪物管理器
 * 负责怪物实例的创建、更新、渲染和生命周期管理
 */
class MonsterManager {
  /** 可用怪物类型枚举 */
  static readonly monsterCtors = {
    Swordman: 'Swordman',
    Axeman: 'Axeman',
    LionMan: 'LionMan',
    HighPriest: 'HighPriest',
    Devil: 'Devil',
    DemonSpawn: 'DemonSpawn',
  } as const

  /** 当前场上所有怪物 */
  public monsters: MonsterBase[] = []

  /** 构造函数缓存 */
  private __m_ctor_cache: Map<string, IMonsterBase> = new Map()

  /**
   * 工厂方法：创建怪物实例
   * @param monsterName 怪物类型名称
   * @param position 生成位置
   * @param image 怪物图像
   * @param level 怪物等级
   * @param extraArgs 额外参数
   */
  Factory(
    monsterName: string,
    position: Position,
    image: string | ImageBitmap | AnimationSprite,
    level: number,
    ...extraArgs: unknown[]
  ): MonsterBase {
    let ctor: Optional<IMonsterBase> = null

    if (this.__m_ctor_cache.has(monsterName)) {
      ctor = this.__m_ctor_cache.get(monsterName)!
    } else {
      ctor = MonsterRegistry.getOrThrow(monsterName)
      this.__m_ctor_cache.set(monsterName, ctor)
    }

    const nm = new ctor(position, image, level, ...extraArgs)
    this.monsters.push(nm)
    return nm
  }

  /**
   * 更新所有怪物状态
   * @param pathGetter 路径获取函数
   * @param lifeToken 生命值回调
   * @param towers 塔列表
   * @param monsters 怪物列表
   */
  run(
    pathGetter: typeof Game.prototype.getPathToEnd,
    lifeToken: typeof Game.prototype.emitLife,
    towers: TowerBase[],
    monsters: MonsterBase[]
  ): void {
    this.monsters.forEach(m => {
      m.run(pathGetter(m.position), lifeToken, towers, monsters)
    })
  }

  /**
   * 渲染所有怪物
   * @param ctx Canvas 上下文
   * @param imgCtl 图像管理器
   */
  render(ctx: WrappedCanvasRenderingContext2D, imgCtl: ImageManager): void {
    this.monsters.forEach(m => m.render(ctx as CanvasRenderingContext2D, imgCtl))
  }

  /**
   * 清理死亡怪物并发放奖励
   * @param emitCallback 金币回调
   */
  scanSwipe(emitCallback: typeof Game.prototype.emitMoney): void {
    this.monsters = this.monsters.filter(m => {
      if (m.isDead) {
        emitCallback(m.reward)
        m.destroy()
      }
      return !m.isDead
    })
  }

  /** 当前所有怪物总血量 */
  get totalCurrentHealth(): number {
    return _.sumBy(this.monsters, m => m.health)
  }

  /** 当前最高怪物等级 */
  get maxLevel(): number {
    return this.monsters.length > 0 ? _.maxBy(this.monsters, m => m.level)!.level : 0
  }
}
