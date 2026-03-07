/// <reference path="../base.ts" />
/// <reference path="../utils/dot-manager.ts" />
/// <reference path="./types.ts" />

/**
 * 加农炮弹
 * 特性：追踪目标、目标死亡后继续飞向最后位置、爆炸AOE、燃烧DOT
 */
class CannonBullet extends BulletBase {
  /** 基础飞行速度 */
  static readonly BASE_VELOCITY = BULLET_VELOCITY.CANNON

  /** 目标丢失后的瞄准位置 */
  protected aimPosition: Optional<Position> = null

  /** 爆炸伤害 */
  protected readonly explosionDmg: number

  /** 爆炸半径 */
  protected readonly explosionRadius: number

  /** 燃烧 DOT 单次伤害 */
  protected readonly burnDotDamage: number

  /** 燃烧 DOT 间隔 (毫秒) */
  protected readonly burnDotInterval: number

  /** 燃烧 DOT 持续时间 (毫秒) */
  protected readonly burnDotDuration: number

  /** 伤害比例计算函数 */
  protected readonly ratioCalc: (monster: MonsterBase) => number

  /**
   * @param position 初始位置
   * @param atk 攻击力
   * @param target 目标怪物
   * @param _image 未使用，保持接口兼容
   * @param explosionDmg 爆炸伤害
   * @param explosionRadius 爆炸半径
   * @param burnDotDamage 燃烧单次伤害
   * @param burnDotInterval 燃烧间隔
   * @param burnDotDuration 燃烧持续时间
   * @param extraBV 额外速度加成
   * @param ratioCalc 伤害比例计算函数
   */
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    _image: null,
    explosionDmg: number,
    explosionRadius: number,
    burnDotDamage: number,
    burnDotInterval: number,
    burnDotDuration: number,
    extraBV: number | null,
    ratioCalc: (monster: MonsterBase) => number
  ) {
    super(
      position,
      BULLET_VISUAL_CONFIG.CANNON.radius,
      BULLET_VISUAL_CONFIG.CANNON.borderWidth,
      BULLET_VISUAL_CONFIG.CANNON.borderStyle,
      BULLET_VISUAL_CONFIG.CANNON.fill!,
      atk,
      CannonBullet.BASE_VELOCITY + (extraBV || 0),
      target
    )

    this.explosionDmg = explosionDmg
    this.explosionRadius = explosionRadius
    this.burnDotDamage = burnDotDamage
    this.burnDotInterval = burnDotInterval
    this.burnDotDuration = burnDotDuration
    this.ratioCalc = ratioCalc
  }

  /**
   * 检查是否到达目标位置
   */
  override get isReaching(): boolean {
    if (this.aimPosition) {
      const reachThreshold = 20 + this.radius
      return Position.distancePow2(this.position, this.aimPosition) < reachThreshold * reachThreshold
    }
    return super.isReaching
  }

  /**
   * 获取燃烧 DOT 跳数
   */
  protected get burnDotCount(): number {
    return this.burnDotDuration / this.burnDotInterval
  }

  /**
   * 每帧运行逻辑
   * 加农炮弹在丢失目标后仍会向最后记录的目标位置飞行并爆炸
   */
  override run(monsters: MonsterBase[]): void {
    // 防护检查：如果目标和瞄准位置都不存在，标记为完成
    if (!this.target && !this.aimPosition) {
      this.fulfilled = true
      return
    }

    if (!this.target) {
      // 目标已丢失，向瞄准位置飞行
      this.position.moveTo(this.aimPosition!, this.speed)
    } else {
      // 向目标飞行
      this.position.moveTo(this.target.position, this.speed)

      // 如果目标死亡，记录位置并清除目标
      if (this.target.isDead) {
        this.aimPosition = this.target.position.copy()
        this.target = null
      }
    }

    // 到达后爆炸
    if (this.isReaching) {
      this.hit(this.target, 1, monsters)
      this.fulfilled = true
    }
  }

  /**
   * 击中敌人后引起爆炸并点燃敌人
   */
  override hit(monster: Optional<MonsterBase>, _magnification: number = 1, monsters: MonsterBase[]): void {
    // 如果有直接命中的目标，先对其造成直接伤害
    if (monster) {
      super.hit(monster, this.ratioCalc(monster))
    }

    // 确定爆炸中心位置
    const targetPosition = this.target ? this.target.position : this.aimPosition!

    // 播放爆炸动画
    const positionTL = new Position(
      targetPosition.x - this.explosionRadius,
      targetPosition.y - this.explosionRadius
    )
    Game.callAnimation('explo_3', positionTL, this.explosionRadius * 2, this.explosionRadius * 2, 0.5, 0)

    // 对爆炸范围内所有怪物造成伤害和燃烧
    const explosionRadiusSquared = this.explosionRadius * this.explosionRadius

    for (const m of monsters) {
      if (m.isDead) continue
      if (Position.distancePow2(m.position, targetPosition) >= explosionRadiusSquared) continue

      // 计算伤害
      const ratio = this.ratioCalc(m)
      const damage = this.explosionDmg * (1 - m.armorResistance) * ratio
      m.applyDamage(damage)
      this.emitter(m)

      // 应用燃烧 DOT
      DOTManager.installDOT(
        m,
        'beBurned',
        this.burnDotDuration,
        this.burnDotInterval,
        this.burnDotDamage * ratio,
        false, // 不无视护甲
        this.emitter.bind(this)
      )
    }
  }
}

/**
 * 集束炸弹
 * 特性：继承加农炮弹，命中后分裂出多个小型爆炸
 */
class ClusterBomb extends CannonBullet {
  /**
   * @param position 初始位置
   * @param atk 攻击力
   * @param target 目标怪物
   * @param _image 未使用
   * @param explosionDmg 爆炸伤害
   * @param explosionRadius 爆炸半径
   * @param burnDotDamage 燃烧单次伤害
   * @param burnDotInterval 燃烧间隔
   * @param burnDotDuration 燃烧持续时间
   * @param extraBV 额外速度加成
   * @param ratioCalc 伤害比例计算函数
   */
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    _image: null,
    explosionDmg: number,
    explosionRadius: number,
    burnDotDamage: number,
    burnDotInterval: number,
    burnDotDuration: number,
    extraBV: number | null,
    ratioCalc: (monster: MonsterBase) => number
  ) {
    super(
      position,
      atk,
      target,
      _image,
      explosionDmg,
      explosionRadius,
      burnDotDamage,
      burnDotInterval,
      burnDotDuration,
      extraBV,
      ratioCalc
    )

    // 集束炸弹比普通加农炮弹更大、更快
    this.radius = BULLET_VISUAL_CONFIG.CLUSTER.radius
    this.borderStyle = BULLET_VISUAL_CONFIG.CLUSTER.borderStyle
    this.fill = BULLET_VISUAL_CONFIG.CLUSTER.fill
    this.speed += BULLET_VELOCITY.CLUSTER_BONUS
  }

  /** 子弹药爆炸半径 */
  protected get childExplodeRadius(): number {
    return this.explosionRadius * 0.5
  }

  /** 子弹药分散距离 */
  protected get childBombDistance(): number {
    return this.explosionRadius * 0.5
  }

  /** 子弹药伤害 */
  protected get childExplodeDamage(): number {
    return this.explosionDmg * 0.8
  }

  /**
   * 执行分裂爆炸
   * @param monsters 所有怪物
   * @param radius 子爆炸半径
   * @param dist 子爆炸距离
   * @param dmg 子爆炸伤害
   * @param degree 每个子爆炸的角度间隔
   * @param waitFrame 延迟帧数
   */
  protected clusterExplode(
    monsters: MonsterBase[],
    radius: number,
    dist: number,
    dmg: number,
    degree: number,
    waitFrame: number
  ): void {
    // 生成子爆炸位置
    const childExplodePositions: Position[] = []
    for (let d = 0; d < 360; d += degree) {
      const vec = new PolarVector(dist, d)
      const pos = this.position.copy().move(vec)
      childExplodePositions.push(pos)

      // 播放子爆炸动画
      const positionTL = new Position(pos.x - radius, pos.y - radius)
      Game.callAnimation('explo_3', positionTL, radius * 2, radius * 2, 0.5, 0, waitFrame)
    }

    const radiusSquared = radius * radius

    // 使用 Set 追踪已处理的怪物，避免重复 DOT
    const processedMonsters = new Set<number>()

    for (const m of monsters) {
      if (m.isDead) continue

      // 检查是否在任一子爆炸范围内
      let hitCount = 0
      for (const ep of childExplodePositions) {
        if (Position.distancePow2(m.position, ep) < radiusSquared) {
          hitCount++
        }
      }

      if (hitCount > 0) {
        // 计算伤害（被多个子爆炸命中会叠加）
        const ratio = this.ratioCalc(m)
        const damage = dmg * (1 - m.armorResistance) * ratio * hitCount
        m.applyDamage(damage)
        this.emitter(m)

        // DOT 只应用一次
        if (!processedMonsters.has(m.id)) {
          processedMonsters.add(m.id)
          DOTManager.installDOT(
            m,
            'beBurned',
            this.burnDotDuration,
            this.burnDotInterval,
            this.burnDotDamage * ratio,
            false,
            this.emitter.bind(this)
          )
        }
      }
    }
  }

  /**
   * 集束炸弹命中后会爆炸，分裂出 8 枚小型炸弹
   */
  override hit(monster: MonsterBase, _magnification: number = 1, monsters: MonsterBase[]): void {
    if (monster) {
      super.hit(monster, _magnification, monsters)
    }

    this.clusterExplode(
      monsters,
      this.childExplodeRadius,
      this.childBombDistance,
      this.childExplodeDamage,
      45, // 每 45 度一个，共 8 个
      10 // 延迟 10 帧
    )
  }
}

/**
 * 增强集束炸弹
 * 特性：继承集束炸弹，二次分裂出更多子弹药
 */
class ClusterBombEx extends ClusterBomb {
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    _image: null,
    explosionDmg: number,
    explosionRadius: number,
    burnDotDamage: number,
    burnDotInterval: number,
    burnDotDuration: number,
    extraBV: number | null,
    ratioCalc: (monster: MonsterBase) => number
  ) {
    super(
      position,
      atk,
      target,
      _image,
      explosionDmg,
      explosionRadius,
      burnDotDamage,
      burnDotInterval,
      burnDotDuration,
      extraBV,
      ratioCalc
    )

    // 增强版更大、颜色更亮
    this.radius = BULLET_VISUAL_CONFIG.CLUSTER_EX.radius
    this.fill = BULLET_VISUAL_CONFIG.CLUSTER_EX.fill
  }

  /** 孙弹药爆炸半径 */
  private get grandChildExplodeRadius(): number {
    return super.childExplodeRadius * 0.5
  }

  /** 孙弹药分散距离 */
  private get grandChildBombDistance(): number {
    return super.childBombDistance * 2
  }

  /** 孙弹药伤害 */
  private get grandChildExplodeDamage(): number {
    return super.childExplodeDamage * 0.8
  }

  /**
   * 增强集束炸弹命中后会进行两次分裂
   */
  override hit(monster: MonsterBase, _magnification: number = 1, monsters: MonsterBase[]): void {
    super.hit(monster, _magnification, monsters)

    // 二次分裂：更多、更小的子弹药
    this.clusterExplode(
      monsters,
      this.grandChildExplodeRadius,
      this.grandChildBombDistance,
      this.grandChildExplodeDamage,
      30, // 每 30 度一个，共 12 个
      20 // 延迟 20 帧
    )
  }
}
