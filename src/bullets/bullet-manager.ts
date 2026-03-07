/// <reference path="../base.ts" />
/// <reference path="./types.ts" />

/**
 * 子弹管理器（单例）
 * 管理所有子弹的生命周期
 *
 * 注意：这是真正的单例模式，所有 Tower 共享同一个 BulletManager 实例
 * 每次 new BulletManager() 都会返回同一个实例
 */
class BulletManager {
  static instance: Optional<BulletManager> = null

  /** 所有活跃的子弹 */
  public bullets!: BulletBase[]

  /** 子弹构造函数缓存 */
  private bulletCtorCache!: Map<string, IBulletBase>

  constructor() {
    if (!BulletManager.instance) {
      this.bullets = []
      this.bulletCtorCache = new Map()

      BulletManager.instance = this
    }

    return BulletManager.instance
  }

  /**
   * 工厂方法：创建子弹实例
   * @param emitter 伤害记录回调
   * @param bulletName 子弹类名
   * @param position 初始位置
   * @param atk 攻击力
   * @param target 目标（怪物或位置）
   * @param image 子弹图像
   * @param extraArgs 额外参数
   */
  Factory(
    emitter: typeof TowerBase.prototype.recordDamage,
    bulletName: string,
    position: Position,
    atk: number,
    target: MonsterBase | Position,
    image: Optional<ImageBitmap | string>,
    ...extraArgs: unknown[]
  ): BulletBase {
    let ctor = this.bulletCtorCache.get(bulletName)

    if (!ctor) {
      ctor = BulletRegistry.getOrThrow(bulletName)
      this.bulletCtorCache.set(bulletName, ctor)
    }

    const bullet = new ctor(position, atk, target, image, ...extraArgs)
    bullet.setDamageEmitter(emitter)
    this.bullets.push(bullet)

    return bullet
  }

  /**
   * 运行所有子弹的帧逻辑
   * @param monsters 所有怪物列表
   */
  run(monsters: MonsterBase[]): void {
    this.bullets.forEach(b => b.run(monsters))
  }

  /**
   * 渲染所有子弹
   * @param ctx 渲染上下文
   */
  render(ctx: WrappedCanvasRenderingContext2D): void {
    this.bullets.forEach(b => b.render(ctx as CanvasRenderingContext2D))
  }

  /**
   * 清理已完成的子弹
   */
  scanSwipe(): void {
    this.bullets = this.bullets.filter(b => {
      if (b.fulfilled) b.destroy()
      return !b.fulfilled
    })
  }

  /**
   * 获取所有活跃子弹（只读）
   */
  getBullets(): readonly BulletBase[] {
    return this.bullets
  }

  /**
   * 清空所有子弹
   */
  clear(): void {
    this.bullets.forEach(bullet => bullet.destroy())
    this.bullets = []
  }
}
