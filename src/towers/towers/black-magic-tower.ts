/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../motion.ts" />
/// <reference path="../../utils/math-utils.ts" />
/// <reference path="../../utils/format-utils.ts" />

/**
 * BlackMagicTower - 魔法塔
 * 释放强力魔法，附加诅咒效果
 */
class BlackMagicTower extends TowerBase {
  // 晋升描述文本
  private static rankUpDesc1 = '\n+ 伤害得到加强'
  private static rankUpDesc2 = '\n+ 伤害得到大幅加强'
  private static rankUpDesc3 = '\n+ 伤害得到大幅加强，每次攻击附加目标当前生命值 4% 的额外伤害'

  /** 禁用的宝石列表 */
  static override deniedGems = ['GogokOfSwiftness']

  // 等级函数
  private levelIdeFx = TowerManager.BlackMagicTower.ide!
  private levelIdrFx = TowerManager.BlackMagicTower.idr!

  // 累积属性
  private imprecationPower = 0
  private imprecationHaste = 1
  private extraPower = 0

  /** 相当于目标当前生命值的额外伤害比例 */
  private POTCHD = 0

  private inner_desc_init = '释放强力魔法\n- 准备时间非常长\n+ 附加诅咒，使目标受到的伤害提高\n+ 每次击杀增加 10 攻击力并提高 5% 攻击速度（最多提高 1600%）'

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
      TOWER_COLORS.MAGIC_RANK_0,
      image,
      TowerManager.BlackMagicTower.p,
      TowerManager.BlackMagicTower.a,
      TowerManager.BlackMagicTower.h,
      TowerManager.BlackMagicTower.s,
      TowerManager.BlackMagicTower.r
    )

    this.name = TowerManager.BlackMagicTower.dn
    this.description = this.inner_desc_init
  }

  override get HstPS(): number {
    return super.HstPS * this.imprecationHaste
  }

  override get Atk(): number {
    return super.Atk + this.imprecationPower + this.extraPower
  }

  /** 诅咒的易伤效果 */
  get Ide(): number {
    return this.levelIdeFx(this.level) + 1
  }

  /** 诅咒持续时间 */
  get Idr(): number {
    return this.levelIdrFx(this.level)
  }

  override get informationSeq(): string[][] {
    return super.informationSeq.concat([
      ['诅咒易伤', MathUtils.roundWithFixed(this.Ide * 100 - 100, 2) + '%'],
      ['诅咒时间', MathUtils.roundWithFixed(this.Idr / 1000, 2) + ' 秒'],
      ['额外攻击力', FormatUtils.chineseFormatter(this.imprecationPower, 0)],
      ['额外攻击速度', MathUtils.roundWithFixed(this.imprecationHaste * 100 - 100, 1) + '%']
    ])
  }

  override levelUp(currentMoney: number): number {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '奥术魔法塔'
          this.image = Game.callImageBitMap(TowerManager.BlackMagicTower.n2!)
          this.description = this.inner_desc_init + BlackMagicTower.rankUpDesc1
          this.borderStyle = TOWER_COLORS.MAGIC_RANK_1
          this.extraPower = MAGIC_CONSTANTS.EXTRA_POWER_RANK_1
          this.levelAtkFx = TowerManager.BlackMagicTower.a2!
          break

        case 10:
          this.rankUp()
          this.name = '黑魔法塔'
          this.image = Game.callImageBitMap(TowerManager.BlackMagicTower.n3!)
          this.description = this.inner_desc_init + BlackMagicTower.rankUpDesc2
          this.borderStyle = TOWER_COLORS.MAGIC_RANK_2
          this.extraPower = MAGIC_CONSTANTS.EXTRA_POWER_RANK_2
          this.levelAtkFx = TowerManager.BlackMagicTower.a3!
          break

        case 15:
          this.rankUp()
          this.name = '虚空塔'
          this.image = Game.callImageBitMap(TowerManager.BlackMagicTower.n4!)
          this.description = this.inner_desc_init + BlackMagicTower.rankUpDesc3
          this.borderStyle = TOWER_COLORS.MAGIC_RANK_3
          this.extraPower = MAGIC_CONSTANTS.EXTRA_POWER_RANK_3
          this.levelAtkFx = TowerManager.BlackMagicTower.a4!
          this.POTCHD = MAGIC_CONSTANTS.PERCENT_CURRENT_HP_DAMAGE
          break
      }
    }

    return ret
  }

  override reChooseTarget(targetList: MonsterBase[]): void {
    this.target = _.maxBy(
      targetList.filter(t => !t.isDead && this.inRange(t)),
      m => m.health
    ) ?? null
  }

  override produceBullet(): void {
    if (this.target) {
      const gridSize = Game.callGridSideSize()
      const w = gridSize * 2
      const h = gridSize * 1.25
      const position = new Position(this.target.position.x - w / 2, this.target.position.y - h / 2)

      Game.callAnimation('magic_2', position, w, h, 1, 2)

      // 百分比伤害基于当前血量计算，需要在 applyDamage 之前获取
      const percentDamage = this.target.health * this.POTCHD
      const baseDamage = this.Atk * this.calculateDamageRatio(this.target)

      // 移除: console.log 调试代码

      this.target.applyDamage(baseDamage + percentDamage)
      this.recordDamage(this.target)

      // 杀死了目标
      if (this.target.isDead) {
        this.imprecationPower += MAGIC_CONSTANTS.KILL_POWER_BONUS
        if (this.imprecationHaste * 100 - 100 < MAGIC_CONSTANTS.MAX_HASTE_BONUS_PERCENT) {
          this.imprecationHaste += MAGIC_CONSTANTS.KILL_HASTE_BONUS
        }
      }

      // 调试模式强化
      if (__debug_black_magic_tower_always_enhance) {
        this.imprecationPower += MAGIC_CONSTANTS.KILL_POWER_BONUS
        this.imprecationHaste += MAGIC_CONSTANTS.KILL_HASTE_BONUS
      }

      // 诅咒目标（仅对存活目标）
      if (!this.target.isDead) {
        this.target.registerImprecate((this.Idr / 1000) * 60, this.Ide)
      }
    }
  }

  rapidRender(ctx: CanvasRenderingContext2D): void {
    if (this.HstPS < 45) {
      this.renderPreparationBar(ctx)
    }
  }
}
