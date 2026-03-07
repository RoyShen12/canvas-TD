/// <reference path="../base.ts" />
/// <reference path="../utils/dot-manager.ts" />
/// <reference path="./types.ts" />

/**
 * 毒罐
 * 特性：命中后附加持续毒伤 DOT
 */
class PoisonCan extends BulletBase {
  /** 基础飞行速度 */
  static readonly BASE_VELOCITY = BULLET_VELOCITY.POISON

  /** 毒伤 DOT 单次伤害 */
  private readonly poisonAtk: number

  /** 毒伤 DOT 间隔 (毫秒) */
  private readonly poisonInterval: number

  /** 毒伤 DOT 持续时间 (毫秒) */
  private readonly poisonDuration: number

  /**
   * @param position 初始位置
   * @param atk 攻击力（直接伤害）
   * @param target 目标怪物
   * @param _image 未使用
   * @param poisonAtk 毒伤单次伤害
   * @param poisonInterval 毒伤间隔
   * @param poisonDuration 毒伤持续时间
   * @param extraBV 额外速度加成
   */
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    _image: null,
    poisonAtk: number,
    poisonInterval: number,
    poisonDuration: number,
    extraBV: number | null
  ) {
    super(
      position,
      BULLET_VISUAL_CONFIG.POISON.radius,
      BULLET_VISUAL_CONFIG.POISON.borderWidth,
      BULLET_VISUAL_CONFIG.POISON.borderStyle,
      BULLET_VISUAL_CONFIG.POISON.fill!,
      atk,
      PoisonCan.BASE_VELOCITY + (extraBV || 0),
      target
    )

    this.poisonAtk = poisonAtk
    this.poisonInterval = poisonInterval
    this.poisonDuration = poisonDuration
  }

  /**
   * 命中目标：造成直接伤害并附加毒伤 DOT
   */
  override hit(monster: MonsterBase): void {
    // 直接伤害
    super.hit(monster)

    // 附加毒伤 DOT（可叠加）
    DOTManager.installDOT(
      monster,
      'bePoisoned',
      this.poisonDuration,
      this.poisonInterval,
      this.poisonAtk,
      true, // 无视护甲
      this.emitter.bind(this)
    )
  }
}
