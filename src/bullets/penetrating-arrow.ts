/// <reference path="../base.ts" />
/// <reference path="./types.ts" />

/**
 * 穿透箭矢
 * 特性：穿透多目标、高穿甲、穿透衰减
 */
class PenetratingArrow extends BulletBase {
  /** 基础飞行速度 */
  static readonly BASE_VELOCITY = BULLET_VELOCITY.PENETRATING_ARROW

  /** 目的地位置（箭矢会一直飞向此位置直到出界） */
  private readonly destination: Position

  /** 已命中的怪物 ID 集合 */
  private readonly hitMonsterIds: Set<number> = new Set()

  /** 穿甲率（减少护甲生效比例，0-1） */
  private readonly armorPenetration: number

  /** 当前伤害倍率（随穿透衰减） */
  private damageMultiplier: number = 1

  /** 每次穿透后的伤害衰减率 */
  private readonly damageDecay: number

  /**
   * @param position 初始位置
   * @param atk 攻击力
   * @param target 目标怪物（用于确定飞行方向）
   * @param image 箭矢图像
   * @param armorPenetration 穿甲率 (0-1)，默认 0.6
   * @param damageDecay 穿透衰减率 (0-1)，默认 0.8
   */
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    image: string | ImageBitmap,
    armorPenetration: number = PENETRATING_ARROW_DEFAULTS.ARMOR_PENETRATION,
    damageDecay: number = PENETRATING_ARROW_DEFAULTS.DAMAGE_DECAY
  ) {
    super(
      position,
      PENETRATING_ARROW_DEFAULTS.RADIUS,
      0, // borderWidth
      null, // borderStyle
      image,
      atk,
      PenetratingArrow.BASE_VELOCITY,
      target
    )

    this.armorPenetration = armorPenetration
    this.damageDecay = damageDecay

    // 计算飞行目的地：从当前位置向目标方向延伸到屏幕对角线长度
    this.destination = this.position.copy().moveTo(target.position, this.gameContext.getDiagonalLength())
  }

  /**
   * 每帧运行逻辑
   * 穿透箭矢会一直飞行直到超出边界
   */
  override run(monsters: MonsterBase[]): void {
    // 向目的地移动
    this.position.moveTo(this.destination, this.speed)

    // 检测沿途命中的怪物
    for (const monster of monsters) {
      if (monster.isDead) continue
      if (this.hitMonsterIds.has(monster.id)) continue
      if (!this.inRange(monster)) continue

      // 命中新目标
      this.hit(monster)
      this.hitMonsterIds.add(monster.id)

      // 应用穿透衰减
      this.damageMultiplier *= this.damageDecay
    }

    // 检查是否超出边界
    if (this.position.outOfBoundary(Position.ORIGIN, this.gameContext.getBoundaryPosition(), BULLET_CONFIG.BOUNDARY_TOLERANCE)) {
      this.fulfilled = true
      this.target = null
    }
  }

  /**
   * 命中目标
   * 高穿甲：armorPenetration 减少护甲生效比例
   */
  override hit(monster: MonsterBase): void {
    // 护甲生效比例 = 1 - armorPenetration
    const armorEffectiveness = 1 - this.armorPenetration
    const damage = this.Atk * this.damageMultiplier * (1 - monster.armorResistance * armorEffectiveness)

    monster.applyDamage(damage)
    this.emitter(monster)
  }

  /**
   * 穿透箭不使用默认的 isReaching 逻辑
   */
  override get isReaching(): boolean {
    return false
  }
}
