/// <reference path="../base.ts" />
/// <reference path="./types.ts" />

/**
 * 普通箭矢
 * 特性：高速、可暴击、可束缚
 */
class NormalArrow extends BulletBase {
  /** 基础飞行速度 */
  static readonly BASE_VELOCITY = BULLET_VELOCITY.NORMAL_ARROW

  /** 暴击概率 (0-1) */
  private readonly critChance: number

  /** 暴击伤害倍率 */
  private readonly critRatio: number

  /** 本次射击是否触发束缚 */
  private readonly willTrap: boolean

  /** 束缚持续时间 (毫秒) */
  private readonly trapDuration: number

  /** 是否为秒杀箭 */
  private readonly isSecKill: boolean

  /**
   * @param position 初始位置
   * @param atk 攻击力
   * @param target 目标怪物
   * @param image 箭矢图像
   * @param critChance 暴击概率 (0-100)
   * @param critRatio 暴击伤害倍率
   * @param trapChance 束缚概率 (0-100)
   * @param trapDuration 束缚持续时间 (毫秒)
   * @param extraBV 额外速度加成
   * @param isSecKill 是否为秒杀箭
   */
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    image: string | ImageBitmap,
    critChance: number,
    critRatio: number,
    trapChance: number,
    trapDuration: number,
    extraBV: number | null,
    isSecKill: boolean
  ) {
    super(
      position,
      8, // radius
      0, // borderWidth
      null, // borderStyle
      image,
      atk,
      NormalArrow.BASE_VELOCITY + (extraBV || 0),
      target
    )

    this.critChance = critChance
    this.critRatio = critRatio
    this.trapDuration = trapDuration
    this.isSecKill = isSecKill

    // 在构造时预先判断是否触发束缚（更清晰的概率计算）
    this.willTrap = Math.random() * 100 < trapChance
  }

  /**
   * 命中目标
   */
  override hit(monster: MonsterBase): void {
    if (this.isSecKill) {
      // 秒杀：造成超过当前血量的伤害
      monster.applyDamage(monster.health + 1)
      this.emitter(monster)
      return
    }

    // 计算是否暴击
    const isCrit = Math.random() < this.critChance
    const critMagnification = isCrit ? this.critRatio : 1

    // 穿甲效果：减少 30% 护甲生效
    const armorEffectiveness = 0.7
    const damage = this.Atk * critMagnification * (1 - monster.armorResistance * armorEffectiveness)
    monster.applyDamage(damage)
    this.emitter(monster)

    // 触发束缚
    if (this.willTrap) {
      // 将毫秒转换为帧数 (假设 60fps)
      const frameDuration = (this.trapDuration / 1000) * 60
      monster.registerImprison(frameDuration)
    }
  }
}
