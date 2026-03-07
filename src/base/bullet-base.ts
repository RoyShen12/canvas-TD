/// <reference path="../typedef.ts" />
/// <reference path="../constants.ts" />
/// <reference path="./item-base.ts" />
/// <reference path="./monster-base.ts" />
/// <reference path="./tower-base.ts" />

/**
 * 所有子弹的抽象基类
 */
abstract class BulletBase extends ItemBase {
  /** 攻击力 */
  protected Atk: number
  /** 飞行速度 */
  protected speed: number
  /** 目标怪物 */
  public target: Optional<MonsterBase>
  /** 是否已完成（命中或超出边界） */
  public fulfilled = false
  /** 伤害记录回调 */
  protected emitter: (monster: MonsterBase) => void = () => {}

  constructor(
    position: Position,
    radius: number,
    borderWidth: number,
    borderStyle: Optional<string>,
    image: string | ImageBitmap,
    atk: number,
    speed: number,
    target: MonsterBase
  ) {
    super(position, radius, borderWidth, borderStyle, image)

    this.Atk = atk
    this.speed = speed
    this.target = target
  }

  /**
   * 设置伤害记录回调
   */
  public setDamageEmitter(emitter: (monster: MonsterBase) => void): void {
    this.emitter = emitter
  }

  /**
   * 检查是否到达目标
   */
  get isReaching(): boolean {
    if (!this.target) return false
    return Position.distancePow2(this.position, this.target.position) < Math.pow(this.target.radius + this.radius, 2)
  }

  /**
   * 检查目标是否在范围内
   */
  protected inRange(target: MonsterBase): boolean {
    const t = this.radius + target.radius
    return Position.distancePow2(target.position, this.position) < t * t
  }

  /**
   * 每帧运行逻辑
   */
  run(monsters: MonsterBase[]): void {
    if (!this.target) return

    this.position.moveTo(this.target.position, this.speed)

    if (this.target.isDead) {
      this.fulfilled = true
      this.target = null
    } else if (this.isReaching) {
      this.hit(this.target, 1, monsters)
      this.fulfilled = true
      this.target = null
    } else if (this.position.outOfBoundary(Position.ORIGIN, this.gameContext.getBoundaryPosition(), BULLET_CONFIG.BOUNDARY_TOLERANCE)) {
      // 子弹飞出边界
      this.fulfilled = true
      this.target = null
    }
  }

  /**
   * 命中目标
   * @param monster 目标怪物
   * @param magnification 伤害倍率
   * @param _monsters 所有怪物列表（用于 AOE）
   */
  hit(monster: MonsterBase, magnification: number = 1, _monsters?: MonsterBase[]): void {
    monster.applyDamage(this.Atk * magnification * (1 - monster.armorResistance))
    this.emitter(monster)
  }

  /**
   * 渲染图像（带旋转）
   */
  override renderImage(context: CanvasRenderingContext2D): void {
    if (!this.image || this.image instanceof AnimationSprite) {
      return
    }

    const transformed = this.target
      ? this.rotateForward(context, this.target.position)
      : { restore: () => {} }

    context.drawImage(
      this.image,
      0,
      0,
      this.image.width,
      this.image.height,
      this.inscribedSquareSideLength * -0.5,
      this.inscribedSquareSideLength * -0.5,
      this.inscribedSquareSideLength,
      this.inscribedSquareSideLength
    )

    transformed.restore()
  }
}
