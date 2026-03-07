/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../motion.ts" />
/// <reference path="../../utils/math-utils.ts" />
/// <reference path="../../utils/render-utils.ts" />

/**
 * FrostTower - 冰霜塔
 * 在自身周围形成一个圆形的减速场
 */
class FrostTower extends TowerBase {
  // 晋升描述文本
  private static rankUpDesc1 = '\n+ 周期性造成范围冻结'
  private static rankUpDesc2 = '\n+ 每次冻结都能削减敌方 $% 护甲'
  private static rankUpDesc3 = '\n+ 冻结能力加强'

  override canInsertGem = false

  // 等级函数
  private levelSprFx = TowerManager.FrostTower.sr!

  private inner_desc_init = '在自身周围形成一个圆形的减速场\n- 无法攻击\n- 无法镶嵌传奇宝石'

  // 冻结相关
  private armorDecreasingStrength = FROST_CONSTANTS.ARMOR_DECREASING_STRENGTH
  private lastFreezeTime = performance.now()
  private freezeInterval: number = Infinity
  private freezeDuration: number = 0

  // 冻结效果等级 (用于确定效果类型)
  private freezeEffectLevel = 0

  constructor(
    position: Position,
    image: string | AnimationSprite | ImageBitmap,
    _bulletImage: any,
    radius: number
  ) {
    super(
      position,
      radius,
      1,
      TOWER_COLORS.FROST,
      image,
      TowerManager.FrostTower.p,
      TowerManager.FrostTower.a,
      TowerManager.FrostTower.h,
      TowerManager.FrostTower.s,
      TowerManager.FrostTower.r
    )

    this.canInsertGem = false
    this.name = TowerManager.FrostTower.dn
    this.description = this.inner_desc_init
  }

  /**
   * FrostTower 不显示战绩统计（因为它不造成伤害）
   */
  override get exploitsSeq(): string[][] {
    return []
  }

  get canFreeze(): boolean {
    return performance.now() - this.lastFreezeTime > this.freezeInterval
  }

  get freezeDurationTick(): number {
    return (this.freezeDuration / 1000) * 60
  }

  /** 减速强度 */
  get SPR(): number {
    return this.levelSprFx(this.level)
  }

  override get informationSeq(): string[][] {
    const removing = ['攻击速度', '伤害', 'DPS', '弹药储备']
    return super.informationSeq
      .filter(line => !removing.some(rm => rm === line[0]))
      .concat([['减速强度', MathUtils.roundWithFixed(this.SPR * 100, 2) + '%']])
  }

  /**
   * 设置冻结效果等级
   */
  setFreezeEffectLevel(level: number): void {
    this.freezeEffectLevel = level
  }

  /**
   * 执行冻结效果
   */
  private applyFreezeEffect(monsters: MonsterBase[]): void {
    if (!this.canFreeze) return

    monsters.forEach(mst => {
      if (mst.isDead) return

      Game.callAnimation(
        'icicle',
        new Position(mst.position.x - mst.radius, mst.position.y),
        mst.radius * 2,
        mst.radius * 2
      )

      mst.registerFreeze(this.freezeDurationTick)

      // 等级2及以上: 削减护甲
      if (this.freezeEffectLevel >= 2) {
        if (mst._armor > 1) {
          mst._armor *= this.armorDecreasingStrength
        } else {
          mst._armor = 0
        }
      }
    })

    this.lastFreezeTime = performance.now()
  }

  override levelUp(currentMoney: number): number {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '暴风雪I'
          this.description += FrostTower.rankUpDesc1
          this.freezeInterval = FROST_CONSTANTS.FREEZE_INTERVAL.RANK_1
          this.freezeDuration = FROST_CONSTANTS.FREEZE_DURATION.RANK_1
          this.setFreezeEffectLevel(1)
          break

        case 10:
          this.rankUp()
          this.name = '暴风雪II'
          this.description += FrostTower.rankUpDesc2.replace(
            '$',
            Math.round((1 - this.armorDecreasingStrength) * 100) + ''
          )
          this.freezeInterval = FROST_CONSTANTS.FREEZE_INTERVAL.RANK_2
          this.freezeDuration = FROST_CONSTANTS.FREEZE_DURATION.RANK_2
          this.setFreezeEffectLevel(2)
          break

        case 15:
          this.rankUp()
          this.name = '暴风雪III'
          this.description += FrostTower.rankUpDesc3
          this.freezeInterval = FROST_CONSTANTS.FREEZE_INTERVAL.RANK_3
          this.freezeDuration = FROST_CONSTANTS.FREEZE_DURATION.RANK_3
          break

        case 20:
          this.rankUp()
          this.name = '暴风雪IV'
          this.freezeInterval = FROST_CONSTANTS.FREEZE_INTERVAL.RANK_4
          this.freezeDuration = FROST_CONSTANTS.FREEZE_DURATION.RANK_4
          break

        case 25:
          this.rankUp()
          this.name = '暴风雪V'
          this.freezeInterval = FROST_CONSTANTS.FREEZE_INTERVAL.RANK_5
          this.freezeDuration = FROST_CONSTANTS.FREEZE_DURATION.RANK_5
          break

        case 30:
          this.rankUp()
          this.name = '暴风雪VI'
          this.freezeInterval = FROST_CONSTANTS.FREEZE_INTERVAL.RANK_6
          this.freezeDuration = FROST_CONSTANTS.FREEZE_DURATION.RANK_6
          break

        case 35:
          this.rankUp()
          this.name = '暴风雪VII'
          this.freezeInterval = FROST_CONSTANTS.FREEZE_INTERVAL.RANK_7
          this.freezeDuration = FROST_CONSTANTS.FREEZE_DURATION.RANK_7
          break
      }
    }

    return ret
  }

  override adjustTimersForPause(pauseDuration: number): void {
    super.adjustTimersForPause(pauseDuration)
    this.lastFreezeTime += pauseDuration
  }

  override run(monsters: MonsterBase[]): void {
    const inRanged = monsters.filter((mst: MonsterBase) => {
      if (mst.isDead) return false
      const inRange = this.inRange(mst)

      if (inRange) {
        // 只在当前减速比更强时才应用（支持多个冰霜塔叠加，取最强效果）
        const newSpeedRatio = 1 - this.SPR
        if (newSpeedRatio < mst.speedRatio) {
          mst.speedRatio = newSpeedRatio
        }
      }
      // 不再在离开范围时重置速度
      // 速度重置应由外部统一管理（每帧开始时重置为1）

      return inRange
    })

    // 执行冻结效果
    this.applyFreezeEffect(inRanged)
  }

  override render(ctx: CanvasRenderingContext2D): void {
    super.render(ctx)
  }

  rapidRender(context: CanvasRenderingContext2D): void {
    if (this.canFreeze) return

    // 绘制冻结冷却进度
    context.fillStyle = 'rgba(25,25,25,.3)'
    RenderUtils.renderSector(
      context,
      this.position.x,
      this.position.y,
      this.radius,
      0,
      Math.PI * 2 * (1 - (performance.now() - this.lastFreezeTime) / this.freezeInterval),
      false
    ).fill()
  }
}
