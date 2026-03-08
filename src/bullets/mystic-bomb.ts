/// <reference path="../base.ts" />
/// <reference path="./types.ts" />

/**
 * 神秘炸弹（静止魔法陷阱）
 * 特性：放置后静止，等待怪物进入触发范围后爆炸
 */
class MysticBomb extends BulletBase {
  /** 基础飞行速度（静止） */
  static readonly BASE_VELOCITY = BULLET_VELOCITY.MYSTIC

  /** 触发半径 */
  private readonly triggerRadius: number

  /** 爆炸伤害 */
  private readonly explosionDamage: number

  /** 陷阱存活时间（帧） */
  private readonly lifetime: number

  /** 当前存活帧数 */
  private age: number = 0

  /** 是否已触发 */
  private triggered: boolean = false

  /**
   * @param position 放置位置
   * @param atk 基础攻击力（未使用，保持接口一致）
   * @param _target 未使用（陷阱不需要目标）
   * @param _image 未使用
   * @param triggerRadius 触发半径
   * @param explosionDamage 爆炸伤害
   * @param lifetime 存活时间（帧），默认 300 帧（5秒 @ 60fps）
   */
  constructor(
    position: Position,
    atk: number,
    _target: null,
    _image: null,
    triggerRadius: number,
    explosionDamage: number,
    lifetime: number = MYSTIC_BOMB_DEFAULTS.LIFETIME
  ) {
    super(
      position,
      BULLET_VISUAL_CONFIG.MYSTIC.radius,
      BULLET_VISUAL_CONFIG.MYSTIC.borderWidth,
      BULLET_VISUAL_CONFIG.MYSTIC.borderStyle,
      BULLET_VISUAL_CONFIG.MYSTIC.fill!,
      atk,
      MysticBomb.BASE_VELOCITY,
      null! // 陷阱不需要目标
    )

    this.triggerRadius = triggerRadius
    this.explosionDamage = explosionDamage
    this.lifetime = lifetime
  }

  /**
   * 每帧运行逻辑
   */
  override run(monsters: MonsterBase[]): void {
    this.age++

    // 超过存活时间后自动消失
    if (this.age >= this.lifetime) {
      this.fulfilled = true
      return
    }

    // 检测是否有怪物进入触发范围
    const triggerRadiusSquared = this.triggerRadius * this.triggerRadius

    for (const monster of monsters) {
      if (monster.isDead) continue
      if (Position.distancePow2(monster.position, this.position) >= triggerRadiusSquared) continue

      // 触发爆炸
      if (!this.triggered) {
        this.triggered = true
        this.explode(monsters)
        this.fulfilled = true
        return
      }
    }
  }

  /**
   * 执行爆炸
   * @param monsters 所有怪物列表
   */
  private explode(monsters: MonsterBase[]): void {
    // 播放爆炸动画
    const positionTL = new Position(
      this.position.x - this.triggerRadius,
      this.position.y - this.triggerRadius
    )
    Game.callAnimation('explo_3', positionTL, this.triggerRadius * 2, this.triggerRadius * 2, 0.5, 0)

    // 对范围内所有怪物造成伤害
    const triggerRadiusSquared = this.triggerRadius * this.triggerRadius

    for (const m of monsters) {
      if (m.isDead) continue
      if (Position.distancePow2(m.position, this.position) >= triggerRadiusSquared) continue

      const damage = this.explosionDamage * (1 - m.armorResistance)
      m.applyDamage(damage)
      this.emitter(m)
    }
  }

  /**
   * 陷阱不使用 isReaching 逻辑
   */
  override get isReaching(): boolean {
    return false
  }

  /**
   * 陷阱的默认 hit 方法（爆炸时已处理伤害）
   */
  override hit(_monster: MonsterBase): void {
    // 伤害在 explode 中处理
  }
}
