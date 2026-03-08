/// <reference path="./utils/format-utils.ts" />
/// <reference path="./utils/dom-utils.ts" />
/// <reference path="./utils/math-utils.ts" />
/// <reference path="./utils/dot-manager.ts" />
/// <reference path="./image/image-data.ts" />

const GEM_CONSTANTS = {
  /** 游戏每秒 tick 数 */
  TICKS_PER_SECOND: 60,
  /** DOT 默认持续时间 (ms) */
  DOT_DEFAULT_DURATION: 3000,
  /** DOT 默认间隔 (ms) */
  DOT_DEFAULT_INTERVAL: 100,
} as const

/** 毫秒转换为游戏 ticks */
function msToTicks(ms: number): number {
  return Math.round((ms / 1000) * GEM_CONSTANTS.TICKS_PER_SECOND)
}

/** 从数组中随机选取一个元素 (O(1)) */
function randomElement<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error('[randomElement] Cannot select from empty array')
  }
  return arr[Math.floor(Math.random() * arr.length)]!
}

/**
 * 传奇宝石基类
 * 宝石通过 hook 系统增强塔的能力，不需要继承塔类
 */
abstract class GemBase {
  static readonly gemName: string = '传奇宝石'

  static readonly price: number = 0

  static readonly imgSrc: string = ''

  static get priceSpan(): [Node, Node] {
    const key = `_c_span_gem_${this.name}`
    if (DomUtils._cache.has(key)) {
      return DomUtils._cache.get(key) as [Node, Node]
    } else {
      const span1 = document.createElement('span')
      span1.textContent = '价格'
      span1.style.marginRight = '1em'
      const span2 = document.createElement('span')
      span2.textContent = '$ ' + FormatUtils.formatterUs.format(this.price)
      DomUtils._cache.set(key, [span1, span2])
      return [span1, span2]
    }
  }

  static readonly maxLevel: number = 200

  static readonly stasisDescription: string = ''

  public level: number = 0
  public tower: Optional<TowerBase> = null

  /** 获取构造函数类型，减少重复的类型断言 */
  protected get ctor(): typeof GemBase {
    return this.constructor as typeof GemBase
  }

  /** 描述模板替换辅助方法，按顺序替换 $ 占位符 */
  protected formatDescription(template: string, ...values: string[]): string {
    let result = template
    for (const value of values) {
      result = result.replace('$', value)
    }
    return result
  }

  get gemName() {
    return this.ctor.gemName
  }

  get imgSrc() {
    return this.ctor.imgSrc
  }

  get maxLevelHuman() {
    return isFinite(this.ctor.maxLevel) ? this.ctor.maxLevel + '  级' : '∞'
  }

  /**
   * 升到下一次级需要的点数
   */
  get levelUpPoint() {
    return 0
  }

  get isMaxLevel() {
    return this.level >= this.ctor.maxLevel
  }

  get description() {
    return ''
  }

  levelUp(currentPoint: number) {
    if (this.isMaxLevel) return 0

    if (this.levelUpPoint > currentPoint) {
      return 0
    } else {
      const cost = this.levelUpPoint
      this.level += 1
      return cost
    }
  }

  /** 装入宝石时一次性触发 */
  initEffect(_thisTower: TowerBase): void {}

  /** 每次准备攻击时触发 (shoot 前) */
  attackHook(_thisTower: TowerBase, _monsters: MonsterBase[]): void {}

  /** 每次发射时触发 (每个子弹) */
  hitHook(_thisTower: TowerBase, _monster: MonsterBase, _monsters: MonsterBase[]): void {}

  /** 每次击杀时触发 */
  killHook(_thisTower: TowerBase, _monster: MonsterBase): void {}

  /** 每个 Tick 都会触发 (注意性能) */
  tickHook(_thisTower: TowerBase, _monsters: MonsterBase[]): void {}

  /** 暂停后调整计时器 */
  adjustTimersForPause(_pauseDuration: number): void {}

  /** @todo @unimplemented */
  damageHook(_thisTower: TowerBase, _monster: MonsterBase, _damage: number): void {}
}

class PainEnhancer extends GemBase {
  static override readonly gemName = '增痛宝石'
  static override readonly price = 25000
  static override readonly maxLevel = 1000
  static override readonly imgSrc = GEM_IMAGES.PainEnhancer

  static readonly chance = 0.5
  static readonly baseBleedDamageRatio = 1250
  static readonly bleedDamageRatioLevelMx = 750

  static override get stasisDescription() {
    return `攻击敌人有 ${this.chance * 100}% 的几率使其流血，在 3 秒内受到 ${MathUtils.roundWithFixed(this.baseBleedDamageRatio * 100, 1)}% （+${MathUtils.roundWithFixed(
      this.bleedDamageRatioLevelMx * 100,
      1
    )}%/等级）攻击力的伤害`
  }

  static get __base_description() {
    return `攻击敌人有 ${this.chance * 100}% 的几率使其流血，在 3 秒内受到 $% 攻击力的伤害`
  }

  public bleedDuration: number = GEM_CONSTANTS.DOT_DEFAULT_DURATION
  public bleedInterval: number = GEM_CONSTANTS.DOT_DEFAULT_INTERVAL

  override get description() {
    return this.formatDescription(PainEnhancer.__base_description, (this.bleedDamageRatio * 100).toFixed(1))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 40
  }

  private get bleedDotCount() {
    return this.bleedDuration / this.bleedInterval
  }

  private get bleedDamageRatio() {
    return PainEnhancer.baseBleedDamageRatio + this.level * PainEnhancer.bleedDamageRatioLevelMx
  }

  override hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (monster.isDead) return
    if (Math.random() < PainEnhancer.chance) {
      DOTManager.installDOT(
        monster,
        'beBloodied',
        this.bleedDuration,
        this.bleedInterval,
        Math.round((thisTower.Atk * this.bleedDamageRatio) / this.bleedDotCount),
        false,
        thisTower.recordDamage.bind(thisTower)
      )
    }
  }
}

class SimplicitysStrength extends GemBase {
  static override readonly gemName = '至简之力'
  static override readonly price = 18000
  static override readonly maxLevel = 10000
  static override readonly imgSrc = GEM_IMAGES.SimplicitysStrength

  static readonly baseAttackAddition = 0.55
  static readonly attackAdditionLevelMx = 0.2

  static override get stasisDescription() {
    return `提高攻击力 ${MathUtils.roundWithFixed(this.baseAttackAddition * 100, 1)}%（+${MathUtils.roundWithFixed(this.attackAdditionLevelMx * 100, 1)}%/等级）`
  }

  static get __base_description() {
    return '提高攻击力 $%'
  }

  override get description() {
    return this.formatDescription(SimplicitysStrength.__base_description, (this.attackAddition * 100).toFixed(1))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 8
  }

  private get attackAddition() {
    return SimplicitysStrength.baseAttackAddition + this.level * SimplicitysStrength.attackAdditionLevelMx
  }

  override initEffect(thisTower: TowerBase) {
    this.tower = thisTower
    this.tower._damageRatio = 1 + this.attackAddition
  }

  override levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)
    if (this.tower) this.tower._damageRatio = 1 + this.attackAddition
    return ret
  }
}

class GogokOfSwiftness extends GemBase {
  static override readonly gemName = '迅捷勾玉'
  static override readonly maxLevel = 800
  static override readonly price = 50000
  static override readonly imgSrc = GEM_IMAGES.GogokOfSwiftness

  static readonly baseHasteAddition = 0.15
  static readonly hasteAdditionLevelMx = 0.05

  static override get stasisDescription() {
    return `提高攻击速度 ${MathUtils.roundWithFixed(this.baseHasteAddition * 100, 1)}%（+${MathUtils.roundWithFixed(this.hasteAdditionLevelMx * 100, 1)}%/等级）`
  }

  static get __base_description() {
    return '提高攻击速度 $%'
  }

  override get description() {
    return this.formatDescription(GogokOfSwiftness.__base_description, (this.hasteAddition * 100).toFixed(1))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 32 + 15
  }

  private get hasteAddition() {
    return GogokOfSwiftness.baseHasteAddition + this.level * GogokOfSwiftness.hasteAdditionLevelMx
  }

  override initEffect(thisTower: TowerBase) {
    this.tower = thisTower
    this.tower._attackSpeedRatio = 1 + this.hasteAddition
  }

  override levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)
    if (this.tower) this.tower._attackSpeedRatio = 1 + this.hasteAddition
    return ret
  }
}

class MirinaeTeardropOfTheStarweaver extends GemBase {
  static override readonly gemName = '银河、织星者之泪'
  static override readonly price = 120000
  static override readonly maxLevel = 1000
  static override readonly imgSrc = GEM_IMAGES.MirinaeTeardropOfTheStarweaver

  static readonly chance = 0.1
  static readonly baseChitDamageRatio = 100
  static readonly chitDamageRatioLevelMx = 7.5
  static readonly Hst = 1000
  static readonly levelRequirement = 25

  static override get stasisDescription() {
    return `击中时有 ${this.chance * 100}% 的几率 [重击] 附近的一名敌人，每 ${this.Hst / 1000} 秒 [重击] 一名随机敌人 (需要${this.levelRequirement}级) [重击]: 对目标造成 ${MathUtils.roundWithFixed(
      this.baseChitDamageRatio * 100,
      1
    )}%（+${MathUtils.roundWithFixed(this.chitDamageRatioLevelMx * 100, 1)}%/等级）攻击力的伤害`
  }

  static get __base_description() {
    return `击中时有 ${this.chance * 100}% 的几率 [重击] 附近的一名敌人，每 ${this.Hst / 1000} 秒 [重击] 一名随机敌人 (需要${this.levelRequirement}级) [重击]: 对目标造成 $% 攻击力的伤害`
  }

  public lastHitTime: number = performance.now()

  private get chitDamageRatio() {
    return MirinaeTeardropOfTheStarweaver.baseChitDamageRatio + this.level * MirinaeTeardropOfTheStarweaver.chitDamageRatioLevelMx
  }

  override get description() {
    return this.formatDescription(MirinaeTeardropOfTheStarweaver.__base_description, (this.chitDamageRatio * 100).toFixed(1))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 78
  }

  private get canHit() {
    return this.level >= MirinaeTeardropOfTheStarweaver.levelRequirement && performance.now() - this.lastHitTime > MirinaeTeardropOfTheStarweaver.Hst
  }

  private chit(thisTower: TowerBase, target: MonsterBase) {
    if (target.isDead) return

    target.applyDamage(thisTower.Atk * this.chitDamageRatio * (1 - target.armorResistance))
    thisTower.recordDamage(target)

    const w = Game.callGridSideSize() * 2
    const h = Game.callGridSideSize() * 1.25
    const position = new Position(target.position.x - w / 2, target.position.y - h / 2)
    Game.callAnimation('magic_2', position, w, h, 1, 2)
  }

  override hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (Math.random() < MirinaeTeardropOfTheStarweaver.chance) {
      this.chit(thisTower, monster)
    }
  }

  override tickHook(thisTower: TowerBase, monsters: MonsterBase[]) {
    if (!this.canHit) return
    const alive = monsters.filter(m => !m.isDead && thisTower.inRange(m))
    if (alive.length === 0) return
    const t = randomElement(alive)
    this.chit(thisTower, t)
    this.lastHitTime = performance.now()
  }

  override adjustTimersForPause(pauseDuration: number): void {
    this.lastHitTime += pauseDuration
  }
}

class BaneOfTheStricken extends GemBase {
  static override readonly gemName = '受罚者之灾'
  static override readonly price = 65000
  static override readonly imgSrc = GEM_IMAGES.BaneOfTheStricken
  static override readonly maxLevel = 50000

  static readonly damageMakingRatioOnBoss = 0.75
  static readonly baseDamageMakingRatio = 0.0008
  static readonly damageMakingRatioLevelMx = 0.00005

  static override get stasisDescription() {
    return `你对敌人造成的每次攻击都会使敌人从你攻击中受到的伤害提高 ${MathUtils.roundWithFixed(this.baseDamageMakingRatio * 100, 2)}%（+${MathUtils.roundWithFixed(
      this.damageMakingRatioLevelMx * 100,
      3
    )}%/等级），对首领造成的伤害提高 ${MathUtils.roundWithFixed(this.damageMakingRatioOnBoss * 100, 0)}%`
  }

  static get __base_description() {
    return `你对敌人造成的每次攻击都会使敌人从你攻击中受到的伤害提高 $%，对首领造成的伤害提高 ${MathUtils.roundWithFixed(BaneOfTheStricken.damageMakingRatioOnBoss * 100, 0)}%`
  }

  get damageMakingRatioPerHit() {
    return BaneOfTheStricken.baseDamageMakingRatio + this.level * BaneOfTheStricken.damageMakingRatioLevelMx
  }

  override get description() {
    return this.formatDescription(BaneOfTheStricken.__base_description, (this.damageMakingRatioPerHit * 100).toFixed(3))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 16 + 40
  }

  override hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (monster.isDead) return
    const oldV = thisTower._eachMonsterDamageRatio.get(monster.id) || 1
    thisTower._eachMonsterDamageRatio.set(monster.id, oldV + this.damageMakingRatioPerHit)
  }

  override initEffect(thisTower: TowerBase) {
    this.tower = thisTower
    this.tower._onBossAtkRatio = 1 + BaneOfTheStricken.damageMakingRatioOnBoss
  }
}

class GemOfEase extends GemBase {
  static override readonly gemName = '屯宝者的恩惠'
  static override readonly price = 10000
  static override readonly maxLevel = 50
  static override readonly imgSrc = GEM_IMAGES.GemOfEase

  static readonly baseGoldAddition = 500
  static readonly goldAdditionLevelMx = 150

  static override get stasisDescription() {
    return `消灭敌人获得的金币 +${this.baseGoldAddition}（+${this.goldAdditionLevelMx}/等级）`
  }

  static get __base_description() {
    return '消灭敌人获得的金币 +$'
  }

  override get description() {
    return this.formatDescription(GemOfEase.__base_description, this.goldAddition.toFixed(0))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 100
  }

  get goldAddition() {
    return GemOfEase.baseGoldAddition + this.level * GemOfEase.goldAdditionLevelMx
  }

  override initEffect(thisTower: TowerBase) {
    this.tower = thisTower
    this.tower._killExtraGold = this.goldAddition
  }

  override levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)
    if (this.tower) this.tower._killExtraGold = this.goldAddition
    return ret
  }
}

class GemOfMysterious extends GemBase {
  static override readonly gemName = '窃法者'
  static override readonly price = 950000
  static override readonly maxLevel = 50
  static override readonly imgSrc = GEM_IMAGES.GemOfMysterious

  static readonly basePointAddition = 4000
  static readonly pointAdditionLevelMx = 800

  static override get stasisDescription() {
    return `消灭敌人获得的传奇点数 +${this.basePointAddition}（+${this.pointAdditionLevelMx}/等级）`
  }

  static get __base_description() {
    return '消灭敌人获得的传奇点数 +$'
  }

  override get description() {
    return this.formatDescription(GemOfMysterious.__base_description, this.pointAddition.toFixed(0))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 100
  }

  get pointAddition() {
    return GemOfMysterious.basePointAddition + this.level * GemOfMysterious.pointAdditionLevelMx
  }

  override initEffect(thisTower: TowerBase) {
    this.tower = thisTower
    this.tower._killExtraPoint = this.pointAddition
  }

  override levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)
    if (this.tower) this.tower._killExtraPoint = this.pointAddition
    return ret
  }
}

class BaneOfTheTrapped extends GemBase {
  static override readonly gemName = '囚笼宝石'
  static override readonly price = 20500
  static override readonly imgSrc = GEM_IMAGES.BaneOfTheTrapped

  static readonly baseDamageMakingRatioOnTrapped = 5.85
  static readonly damageMakingRatioOnTrappedLevelMx = 1.25

  static override get stasisDescription() {
    return `对受到控制类限制效果影响的敌人造成的伤害提高 ${MathUtils.roundWithFixed(this.baseDamageMakingRatioOnTrapped * 100, 1)}%（+${MathUtils.roundWithFixed(
      this.damageMakingRatioOnTrappedLevelMx * 100,
      1
    )}%/等级）`
  }

  static get __base_description() {
    return '对受到控制类限制效果影响的敌人造成的伤害提高 $%'
  }

  override get description() {
    return this.formatDescription(BaneOfTheTrapped.__base_description, (this.damageMakingRatioOnTrapped * 100).toFixed(1))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 24 + 90
  }

  private get damageMakingRatioOnTrapped() {
    return BaneOfTheTrapped.baseDamageMakingRatioOnTrapped + this.level * BaneOfTheTrapped.damageMakingRatioOnTrappedLevelMx
  }

  override initEffect(thisTower: TowerBase) {
    this.tower = thisTower
    this.tower._onTrappedAtkRatio = 1 + this.damageMakingRatioOnTrapped
  }

  override levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)
    if (this.tower) this.tower._onTrappedAtkRatio = 1 + this.damageMakingRatioOnTrapped
    return ret
  }
}

class ZeisStoneOfVengeance extends GemBase {
  static override readonly gemName = '贼神的复仇之石'
  static override readonly price = 17500
  static override readonly maxLevel = 500
  static override readonly imgSrc = GEM_IMAGES.ZeisStoneOfVengeance

  static readonly baseDamageMakingRatioMin = 0.02
  static readonly damageMakingRatioLevelMxMin = 0.001
  static readonly baseDamageMakingRatioMax = 1.2
  static readonly damageMakingRatioLevelMxMax = 0.125
  static readonly chance = 0.2
  static readonly stuporDuration = 1000

  static override get stasisDescription() {
    return `你和命中的敌人间隔越远，造成的伤害就越高，最少提高 ${MathUtils.roundWithFixed(this.baseDamageMakingRatioMin * 100, 2)}%（+${MathUtils.roundWithFixed(
      this.damageMakingRatioLevelMxMin * 100,
      2
    )}%/等级），在最远射程时提高 ${MathUtils.roundWithFixed(this.baseDamageMakingRatioMax * 100, 2)}%（+${MathUtils.roundWithFixed(this.damageMakingRatioLevelMxMax * 100, 2)}%/等级），击中时有 ${
      this.chance * 100
    }% 的几率使敌人昏迷 ${this.stuporDuration / 1000} 秒`
  }

  static get __base_description() {
    return `你和命中的敌人间隔越远，造成的伤害就越高，最少提高 $%，在最远射程时提高 $%，击中时有 ${this.chance * 100}% 的几率使敌人昏迷 ${this.stuporDuration / 1000} 秒`
  }

  private get damageMakingRatioMin() {
    return ZeisStoneOfVengeance.baseDamageMakingRatioMin + this.level * ZeisStoneOfVengeance.damageMakingRatioLevelMxMin
  }

  private get damageMakingRatioMax() {
    return ZeisStoneOfVengeance.baseDamageMakingRatioMax + this.level * ZeisStoneOfVengeance.damageMakingRatioLevelMxMax
  }

  override get description() {
    return this.formatDescription(
      ZeisStoneOfVengeance.__base_description,
      (this.damageMakingRatioMin * 100).toFixed(2),
      (this.damageMakingRatioMax * 100).toFixed(2)
    )
  }

  override get levelUpPoint() {
    return (this.level + 1) * 45
  }

  override hitHook(_thisTower: TowerBase, monster: MonsterBase) {
    if (monster.isDead) return
    if (Math.random() < ZeisStoneOfVengeance.chance) {
      monster.registerImprison(msToTicks(ZeisStoneOfVengeance.stuporDuration))
    }
  }

  override initEffect(thisTower: TowerBase) {
    this.tower = thisTower
    this.tower._minRangeAtkRatio = 1 + this.damageMakingRatioMin
    this.tower._maxRangeAtkRatio = 1 + this.damageMakingRatioMax
  }

  override levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)
    if (this.tower) {
      this.tower._minRangeAtkRatio = 1 + this.damageMakingRatioMin
      this.tower._maxRangeAtkRatio = 1 + this.damageMakingRatioMax
    }
    return ret
  }
}

class EchoOfLight extends GemBase {
  static override readonly gemName = '圣光回响'
  static override readonly price = 500000
  static override readonly maxLevel = 1000
  static override readonly imgSrc = GEM_IMAGES.EchoOfLight

  static readonly baseExtraTotalDamageRatio = 0.15
  static readonly extraTotalDamageRatioLevelMx = 0.015
  static readonly duration = GEM_CONSTANTS.DOT_DEFAULT_DURATION
  static readonly dotInterval = GEM_CONSTANTS.DOT_DEFAULT_INTERVAL

  static override get stasisDescription() {
    return `对敌人造成非神圣伤害时会在 ${this.duration / 1000} 秒内造成相当于这次伤害 ${MathUtils.roundWithFixed(this.baseExtraTotalDamageRatio * 100, 1)}%（+${MathUtils.roundWithFixed(
      this.extraTotalDamageRatioLevelMx * 100,
      1
    )}%/等级）的神圣伤害，这个效果可以叠加`
  }

  static get __base_description() {
    return `对敌人造成非神圣伤害时会在 ${this.duration / 1000} 秒内造成相当于这次伤害 $% 的神圣伤害，这个效果可以叠加`
  }

  get extraTotalDamageRatio() {
    return EchoOfLight.baseExtraTotalDamageRatio + this.level * EchoOfLight.extraTotalDamageRatioLevelMx
  }

  private get lightDotCount() {
    return EchoOfLight.duration / EchoOfLight.dotInterval
  }

  override get description() {
    return this.formatDescription(EchoOfLight.__base_description, (this.extraTotalDamageRatio * 100).toFixed(1))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 140
  }

  /** 计算暴击倍率，某些塔有 critChance/critDamageRatio 属性 */
  private getCritMultiplier(tower: TowerBase): number {
    const t = tower as unknown as Record<string, unknown>
    if (typeof t.critChance === 'number' && typeof t.critDamageRatio === 'number') {
      if (Math.random() < t.critChance) {
        return t.critDamageRatio
      }
    }
    return 1
  }

  override hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (monster.isDead) return
    const critR = this.getCritMultiplier(thisTower)

    DOTManager.installDotDuplicatable(
      monster,
      'beOnLightEcho',
      EchoOfLight.duration,
      EchoOfLight.dotInterval,
      Math.round((thisTower.Atk * critR * this.extraTotalDamageRatio) / this.lightDotCount),
      false,
      thisTower.recordDamage.bind(thisTower)
    )
  }
}

class GemOfAnger extends GemBase {
  override initEffect(_thisTower: TowerBase): void {}
  override attackHook(_thisTower: TowerBase, _monsters: MonsterBase[]): void {}
  override hitHook(_thisTower: TowerBase, _monster: MonsterBase, _monsters: MonsterBase[]): void {}
  override killHook(_thisTower: TowerBase, _monster: MonsterBase): void {}
  override damageHook(_thisTower: TowerBase, _monster: MonsterBase, _damage: number): void {}

  static override readonly gemName = '愤怒宝石'

  static override readonly price = 30000

  static override readonly maxLevel = 2000

  static override readonly imgSrc = GEM_IMAGES.GemOfAnger

  static readonly baseDamageAdditionPerEnemy = 0.02

  static readonly damageAdditionPerEnemyLevelMx = 0.012

  static override get stasisDescription() {
    return `攻击范围内的每个敌人都将使你的攻击力提高 ${MathUtils.roundWithFixed(this.baseDamageAdditionPerEnemy * 100, 2)}%（+${MathUtils.roundWithFixed(
      this.damageAdditionPerEnemyLevelMx * 100,
      2
    )}%/等级）`
  }

  static get __base_description() {
    return '攻击范围内的每个敌人都将使你的攻击力提高 $%'
  }

  override get description() {
    return GemOfAnger.__base_description.replace('$', (this.damageAdditionPerEnemy * 100).toFixed(2))
  }

  override get levelUpPoint() {
    return (this.level + 1) * 205
  }

  get damageAdditionPerEnemy() {
    return GemOfAnger.baseDamageAdditionPerEnemy + this.level * GemOfAnger.damageAdditionPerEnemyLevelMx
  }

  /**
   * @todo 如果这个钩子函数负担过重可以减少调用频率
   */
  override tickHook(thisTower: TowerBase, monsters: MonsterBase[]) {
    const inRangeCount = monsters.filter(mst => !mst.isDead && thisTower.inRange(mst)).length
    // console.log('inRangeCount', inRangeCount)
    thisTower._angerGemAtkRatio = this.damageAdditionPerEnemy * inRangeCount + 1
  }
}

class BrokenPieces extends GemBase {
  override initEffect(_thisTower: TowerBase): void {}
  override attackHook(_thisTower: TowerBase, _monsters: MonsterBase[]): void {}
  override killHook(_thisTower: TowerBase, _monster: MonsterBase): void {}
  override tickHook(_thisTower: TowerBase, _monsters: MonsterBase[]): void {}
  override damageHook(_thisTower: TowerBase, _monster: MonsterBase, _damage: number): void {}

  static override readonly gemName = '破碎'

  static override readonly price = 620000

  static override readonly maxLevel = 1000

  static override readonly imgSrc = GEM_IMAGES.BrokenPieces

  static readonly baseArmorDecreaseStrength = 0.001

  static readonly armorDecreaseStrengthLevelMx = 0.0001

  static readonly baseExtraArmorBasedDamageRatio = 80

  static readonly extraArmorBasedDamageRatioLevelMx = 8

  static override get stasisDescription() {
    return (
      `每次击中都能摧毁敌人 ${MathUtils.roundWithFixed(this.baseArmorDecreaseStrength * 100, 1)}%（+${MathUtils.roundWithFixed(this.armorDecreaseStrengthLevelMx * 100, 2)}%/等级）的护甲，` +
      `并造成相当于敌人护甲总量的 ${MathUtils.roundWithFixed(this.baseExtraArmorBasedDamageRatio * 100, 0)}%（+${MathUtils.roundWithFixed(
        this.extraArmorBasedDamageRatioLevelMx * 100,
        1
      )}%/等级）的额外伤害`
    )
  }

  static get __base_description() {
    return `每次击中都能摧毁敌人 $%的护甲，并造成相当于敌人护甲总量的 $%的额外伤害`
  }

  private get armorDecreaseStrength() {
    return BrokenPieces.baseArmorDecreaseStrength + this.level * BrokenPieces.armorDecreaseStrengthLevelMx
  }

  private get armorBasedDamageRatio() {
    return BrokenPieces.baseExtraArmorBasedDamageRatio + this.level * BrokenPieces.extraArmorBasedDamageRatioLevelMx
  }

  override get description() {
    return BrokenPieces.__base_description.replace('$', (this.armorDecreaseStrength * 100).toFixed(2)).replace('$', (this.armorBasedDamageRatio * 100).toFixed(1))
  }

  override get levelUpPoint() {
    return (this.level + 2) * 1250
  }

  override hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (monster.isDead) return

    // 先基于原始护甲值计算伤害，再削减护甲
    const originalArmor = monster._armor

    if (monster._armor > 1) {
      monster._armor *= 1 - this.armorDecreaseStrength
    } else {
      monster._armor = 0
    }

    if (originalArmor > 0) {
      monster.applyDamage(this.armorBasedDamageRatio * originalArmor)
      thisTower.recordDamage(monster)
    }
  }
}
