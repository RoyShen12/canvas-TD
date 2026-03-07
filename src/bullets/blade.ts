/// <reference path="../base.ts" />
/// <reference path="./types.ts" />

/**
 * 飞刃
 * 特性：弹跳攻击多个目标、伤害递减
 */
class Blade extends BulletBase {
  /** 基础飞行速度 */
  static readonly BASE_VELOCITY = BULLET_VELOCITY.BLADE

  /** 剩余弹跳次数 */
  private bounceTime: number

  /** 每次弹跳的伤害衰减系数 */
  private readonly damageFadePerBounce: number

  /**
   * @param position 初始位置
   * @param atk 攻击力
   * @param target 目标怪物
   * @param image 飞刃图像
   * @param bounceTime 弹跳次数
   * @param damageFadePerBounce 每次弹跳的伤害衰减系数 (0-1)
   */
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    image: string | ImageBitmap,
    bounceTime: number,
    damageFadePerBounce: number
  ) {
    super(
      position,
      4, // radius
      0, // borderWidth
      null, // borderStyle
      image,
      atk,
      Blade.BASE_VELOCITY,
      target
    )

    this.bounceTime = bounceTime
    this.damageFadePerBounce = damageFadePerBounce
  }

  /**
   * 每帧运行逻辑
   * 修复：调整检查顺序，避免向死亡目标移动
   */
  override run(monsters: MonsterBase[]): void {
    // 没有目标时直接返回
    if (!this.target) return

    // 先检查目标是否死亡，再移动
    if (this.target.isDead) {
      // 尝试弹跳到下一个目标
      if (this.bounceTime > 0 && monsters.length > 1) {
        this.bounceToNext(monsters)
        if (!this.target) {
          this.fulfilled = true
        }
        return
      } else {
        this.fulfilled = true
        this.target = null
        return
      }
    }

    // 向目标移动
    this.position.moveTo(this.target.position, this.speed)

    // 检查是否到达目标
    if (this.isReaching) {
      this.hit(this.target, 1, monsters)

      // 尝试弹跳
      if (this.bounceTime > 0 && monsters.length > 1) {
        this.bounceToNext(monsters)
      } else {
        this.fulfilled = true
        this.target = null
      }
    } else if (this.position.outOfBoundary(Position.ORIGIN, this.gameContext.getBoundaryPosition(), BULLET_CONFIG.BOUNDARY_TOLERANCE)) {
      // 飞出边界
      if (DEBUG_CONFIG.testMode) {
        console.log('Blade has run out of bounds and will be swept by system.')
      }
      this.fulfilled = true
      this.target = null
    }
  }

  /**
   * 弹跳到下一个目标
   * @param monsters 所有怪物列表
   */
  private bounceToNext(monsters: MonsterBase[]): void {
    // 从存活的怪物中随机选择一个（排除当前目标）
    const availableTargets = monsters.filter(m => m !== this.target && !m.isDead)

    if (availableTargets.length === 0) {
      this.target = null
      return
    }

    // 随机选择新目标
    const randomIndex = Math.floor(Math.random() * availableTargets.length)
    const newTarget = availableTargets[randomIndex]

    // 加速（但不超过最大速度）
    if (this.speed < BULLET_VELOCITY.BLADE_MAX) {
      this.speed += 1
    }

    // 更新目标和伤害
    this.target = newTarget
    this.Atk *= this.damageFadePerBounce
    this.bounceTime--
  }
}
