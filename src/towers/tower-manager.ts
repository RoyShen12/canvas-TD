/// <reference path="./tower-config.ts" />
/// <reference path="./tower-types.ts" />
/// <reference path="./tower-constants.ts" />

/**
 * Tower Manager - 塔管理器
 * 负责塔的创建、更新、渲染和生命周期管理
 */

class _TowerManager {
  /** 独立塔类名列表 (如载机) */
  private static independentCtors = ['CarrierTower.Jet']

  /** 塔配置数组 */
  static towerCtors = towerCtors

  /** 晋升名称后缀 */
  static rankPostfixL1 = TOWER_RANK_NAMES.VETERAN
  static rankPostfixL2 = TOWER_RANK_NAMES.ELITE
  static rankPostfixL3 = TOWER_RANK_NAMES.MASTER

  /** 塔配置快捷访问 (由 Proxy 实现) */
  static TestTower: TowerConfig
  static CannonShooter: TowerConfig
  static MaskManTower: TowerConfig
  static FrostTower: TowerConfig
  static PoisonTower: TowerConfig
  static TeslaTower: TowerConfig
  static BlackMagicTower: TowerConfig
  static LaserTower: TowerConfig
  static CarrierTower: TowerConfig
  static EjectBlade: TowerConfig

  /** 普通塔列表 */
  public towers: TowerBase[] = []

  /** 独立塔列表 (如载机) */
  public independentTowers: TowerBase[] = []

  /** 塔变更哈希值 (用于脏检查) */
  public towerChangeHash = -1

  /**
   * 塔工厂方法
   * 根据名称创建塔实例
   */
  Factory(
    towerName: string,
    position: Position,
    image: string | ImageBitmap | AnimationSprite,
    bulletImage: Optional<ImageBitmap>,
    radius: number,
    ...extraArgs: any[]
  ): TowerBase {
    const ctor = TowerRegistry.getOrThrow(towerName)
    const newTower = new ctor(position, image, bulletImage, radius, ...extraArgs) as TowerBase

    // 根据注册名称判断是否为独立塔（如载机），避免依赖 constructor.name（minification 不安全）
    const isIndependent = (_TowerManager.independentCtors as readonly string[]).includes(towerName)
    if (isIndependent) {
      this.independentTowers.push(newTower)
    } else {
      this.towers.push(newTower)
    }

    return newTower
  }

  /**
   * 运行所有塔的逻辑
   */
  run(monsters: MonsterBase[]): void {
    // 每帧开始时重置所有怪物的减速状态，然后由冰霜塔重新应用
    monsters.forEach(m => {
      m.speedRatio = 1
    })

    // 更新普通塔
    this.towers.forEach(tower => {
      if (tower.gem) {
        tower.gem.tickHook(tower, monsters)
      }
      tower.run(monsters)
    })

    // 更新独立塔
    this.independentTowers.forEach(tower => {
      tower.run(monsters)
    })
  }

  /**
   * 渲染所有普通塔
   */
  render(ctx: WrappedCanvasRenderingContext2D): void {
    this.towers.forEach(tower => tower.render(ctx as CanvasRenderingContext2D))
  }

  /**
   * 暂停后调整所有塔的计时器
   */
  adjustTimersForPause(pauseDuration: number): void {
    for (const tower of this.towers) {
      tower.adjustTimersForPause(pauseDuration)
    }
    for (const tower of this.independentTowers) {
      tower.adjustTimersForPause(pauseDuration)
    }
  }

  /**
   * 快速渲染 (动画层)
   */
  rapidRender(ctxRapid: WrappedCanvasRenderingContext2D, monsters: MonsterBase[]): void {
    this.towers.forEach(tower => tower.rapidRender(ctxRapid as CanvasRenderingContext2D, monsters))
    this.independentTowers.forEach(tower => tower.rapidRender(ctxRapid as CanvasRenderingContext2D, monsters))
  }

  /**
   * 计算当前塔状态哈希值
   */
  makeHash(): number {
    // 使用更精确的哈希：将每个塔的 id 和 level 编码到结果中
    let hash = 17
    for (const tower of this.towers) {
      hash = (hash * 31 + tower.id) | 0
      hash = (hash * 31 + tower.level) | 0
    }
    for (const tower of this.independentTowers) {
      hash = (hash * 31 + tower.id) | 0
      hash = (hash * 31 + tower.level) | 0
    }
    return hash
  }

  /**
   * 扫描并清理已售出的塔
   * 检测塔是否存在数量或等级的变化，并通知上层框架重绘
   *
   * @param emitCallback 金币回调函数
   * @returns 是否需要重绘
   */
  scanSwipe(emitCallback: typeof Game.prototype.emitMoney): boolean {
    // 清理已售出的普通塔
    this.towers = this.towers.filter(tower => {
      if (tower.isSold) {
        emitCallback(tower.sellingPrice)
        tower.destroy()
      }
      return !tower.isSold
    })

    // 清理已售出的独立塔
    this.independentTowers = this.independentTowers.filter(tower => {
      if (tower.isSold) {
        emitCallback(tower.sellingPrice)
        tower.destroy()
      }
      return !tower.isSold
    })

    // 检查是否需要重绘
    const currentHash = this.makeHash()
    const needRender = currentHash !== this.towerChangeHash
    this.towerChangeHash = currentHash

    return needRender
  }

  /**
   * 获取所有塔的总伤害
   */
  get totalDamage(): number {
    let sum = 0
    for (const t of this.towers) sum += t.totalDamage
    for (const t of this.independentTowers) sum += t.totalDamage
    return sum
  }

  /**
   * 获取所有塔的总击杀数
   */
  get totalKill(): number {
    let sum = 0
    for (const t of this.towers) sum += t.killCount
    for (const t of this.independentTowers) sum += t.killCount
    return sum
  }
}

/**
 * TowerManager 代理
 * 提供通过类名直接访问塔配置的能力
 * 例如: TowerManager.CannonShooter 返回 CannonShooter 的配置对象
 */
const TowerManager = new Proxy(_TowerManager, {
  get: function (target, property, receiver) {
    // 如果属性名以大写字母开头，尝试从 towerCtors 中查找
    if (typeof property === 'string' && /[A-Z]/.test(property[0]!)) {
      const config = target.towerCtors.find(tc => tc.c === property)
      if (config) {
        return config
      }
    }
    return Reflect.get(target, property, receiver)
  }
})
