abstract class GemBase {
  static readonly gemName: string = '传奇宝石'

  static readonly price: number = 0

  static readonly imgSrc: string = ''

  static get priceSpan(): [Node, Node] {
    const key = `_c_span_gem_${this.name}`
    if (Tools.Dom._cache.has(key)) {
      return Tools.Dom._cache.get(key) as [Node, Node]
    } else {
      const span1 = document.createElement('span')
      span1.textContent = '价格'
      span1.style.marginRight = '1em'
      const span2 = document.createElement('span')
      span2.textContent = '$ ' + Tools.formatterUs.format(this.price)
      Tools.Dom._cache.set(key, [span1, span2])
      return [span1, span2]
    }
  }

  static readonly maxLevel: number = 200

  static readonly stasisDescription: string = ''

  public level: number = 0
  public tower: TowerBase = null

  get gemName() {
    return (this.constructor as typeof GemBase).gemName
  }

  get imgSrc() {
    return (this.constructor as typeof GemBase).imgSrc
  }

  get maxLevelHuman() {
    return isFinite((this.constructor as typeof GemBase).maxLevel) ? (this.constructor as typeof GemBase).maxLevel + '  级' : '∞'
  }

  /**
   * 升到下一次级需要的点数
   */
  get levelUpPoint() {
    return 0
  }

  get isMaxLevel() {
    return this.level >= (this.constructor as typeof GemBase).maxLevel
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

  /**
   * 装入宝石时一次性触发
   */
  abstract initEffect(thisTower: TowerBase): void
  /**
   * - 每次准备攻击时触发
   */
  abstract attackHook(thisTower: TowerBase, monsters: MonsterBase[]): void
  /**
   * 每次发射时触发
   */
  abstract hitHook(thisTower: TowerBase, monster: MonsterBase, monsters: MonsterBase[]): void
  // abstract afterHitHook(thisTower: TowerBase, monster: MonsterBase, monsters: MonsterBase[]): void
  /**
   * 每次击杀时触发
   */
  abstract killHook(thisTower: TowerBase, monster: MonsterBase): void
  /**
   * 每个 Tick 都会触发
   */
  abstract tickHook(thisTower: TowerBase, monsters: MonsterBase[]): void
  /**
   * @todo
   * @unimplemented
   */
  abstract damageHook(thisTower: TowerBase, monster: MonsterBase, damage: number): void
}

class PainEnhancer extends GemBase {
  initEffect(): void {}
  attackHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '增痛宝石'

  static readonly price = 25000

  static readonly maxLevel = 1000

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly chance = 0.5

  static readonly baseBleedDamageRatio = 1250

  static readonly bleedDamageRatioLevelMx = 750

  static get stasisDescription() {
    return `攻击敌人有 ${this.chance * 100}% 的几率使其流血，在 3 秒内受到 ${Tools.roundWithFixed(
      this.baseBleedDamageRatio * 100,
      1
    )}% （+${Tools.roundWithFixed(this.bleedDamageRatioLevelMx * 100, 1)}%/等级）攻击力的伤害`
  }

  static get __base_description() {
    return `攻击敌人有 ${this.chance * 100}% 的几率使其流血，在 3 秒内受到 $% 攻击力的伤害`
  }

  public bleedDuration: number = 3000
  public bleedInterval: number = 100

  private readonly chance = PainEnhancer.chance

  get description() {
    return PainEnhancer.__base_description.replace('$', (this.bleedDamageRatio * 100).toFixed(1))
  }

  get levelUpPoint() {
    return (this.level + 1) * 40
  }

  private get bleedDotCount() {
    return this.bleedDuration / this.bleedInterval
  }

  private get bleedDamageRatio() {
    return PainEnhancer.baseBleedDamageRatio + this.level * PainEnhancer.bleedDamageRatioLevelMx
  }

  hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (Math.random() < this.chance) {
      Tools.installDOT(
        monster,
        'beBloodied',
        this.bleedDuration,
        this.bleedInterval,
        Math.round((thisTower.Atk * this.bleedDamageRatio) / this.bleedDotCount),
        false,
        thisTower.recordDamage.bind(thisTower)
      )

      // console.log('增痛宝石 installed dot')
    }
  }
}

class SimplicitysStrength extends GemBase {
  attackHook(): void {}
  hitHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '至简之力'

  static readonly price = 18000

  static readonly maxLevel = 10000

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseAttackAddition = 0.55

  static readonly attackAdditionLevelMx = 0.2

  static get stasisDescription() {
    return `提高攻击力 ${Tools.roundWithFixed(this.baseAttackAddition * 100, 1)}%（+${Tools.roundWithFixed(
      this.attackAdditionLevelMx * 100,
      1
    )}%/等级）`
  }

  static get __base_description() {
    return '提高攻击力 $%'
  }

  get description() {
    return SimplicitysStrength.__base_description.replace('$', (this.attackAddition * 100).toFixed(1))
  }

  get levelUpPoint() {
    return (this.level + 1) * 8
  }

  private get attackAddition() {
    return SimplicitysStrength.baseAttackAddition + this.level * SimplicitysStrength.attackAdditionLevelMx
  }

  initEffect(thisTower: TowerBase) {
    this.tower = thisTower

    this.tower.__atk_ratio = 1 + this.attackAddition
  }

  levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)

    this.tower.__atk_ratio = 1 + this.attackAddition

    return ret
  }
}

class GogokOfSwiftness extends GemBase {
  attackHook(): void {}
  hitHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '迅捷勾玉'

  static readonly maxLevel = 800

  static readonly price = 50000

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseHasteAddition = 0.15

  static readonly hasteAdditionLevelMx = 0.05

  static get stasisDescription() {
    return `提高攻击速度 ${Tools.roundWithFixed(this.baseHasteAddition * 100, 1)}%（+${Tools.roundWithFixed(
      this.hasteAdditionLevelMx * 100,
      1
    )}%/等级）`
  }

  static get __base_description() {
    return '提高攻击速度 $%'
  }

  get description() {
    return GogokOfSwiftness.__base_description.replace('$', (this.hasteAddition * 100).toFixed(1))
  }

  get levelUpPoint() {
    return (this.level + 1) * 32 + 15
  }

  private get hasteAddition() {
    return GogokOfSwiftness.baseHasteAddition + this.level * GogokOfSwiftness.hasteAdditionLevelMx
  }

  initEffect(thisTower: TowerBase) {
    this.tower = thisTower

    this.tower.__hst_ps_ratio = 1 + this.hasteAddition
  }

  levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)

    this.tower.__hst_ps_ratio = 1 + this.hasteAddition

    return ret
  }
}

class MirinaeTeardropOfTheStarweaver extends GemBase {
  initEffect(): void {}
  attackHook(): void {}
  killHook(): void {}
  damageHook(): void {}

  static readonly gemName = '银河、织星者之泪'

  static readonly price = 120000

  static readonly maxLevel = 1000

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly chance = 0.1

  static readonly baseChitDamageRatio = 100

  static readonly chitDamageRatioLevelMx = 7.5

  static readonly Hst = 1000

  static get stasisDescription() {
    return `击中时有 ${this.chance * 100}% 的几率 [重击] 附近的一名敌人，每 ${
      this.Hst / 1000
    } 秒 [重击] 一名随机敌人 (需要25级) [重击]: 对目标造成 ${Tools.roundWithFixed(this.baseChitDamageRatio * 100, 1)}%（+${Tools.roundWithFixed(
      this.chitDamageRatioLevelMx * 100,
      1
    )}%/等级）攻击力的伤害`
  }

  static get __base_description() {
    return `击中时有 ${this.chance * 100}% 的几率 [重击] 附近的一名敌人，每 ${
      this.Hst / 1000
    } 秒 [重击] 一名随机敌人 (需要25级) [重击]: 对目标造成 $% 攻击力的伤害`
  }

  public lastHitTime: number = performance.now()

  private readonly chance = MirinaeTeardropOfTheStarweaver.chance

  private get chitDamageRatio() {
    return MirinaeTeardropOfTheStarweaver.baseChitDamageRatio + this.level * MirinaeTeardropOfTheStarweaver.chitDamageRatioLevelMx
  }

  private readonly Hst = MirinaeTeardropOfTheStarweaver.Hst

  get description() {
    return MirinaeTeardropOfTheStarweaver.__base_description.replace('$', (this.chitDamageRatio * 100).toFixed(1))
  }

  get levelUpPoint() {
    return (this.level + 1) * 78
  }

  private get canHit() {
    return this.level >= 25 && performance.now() - this.lastHitTime > this.Hst
  }

  private chit(thisTower: TowerBase, target: MonsterBase) {
    target.health -= thisTower.Atk * this.chitDamageRatio * (1 - target.armorResistance)
    // console.log('MirinaeTeardropOfTheStarweaver make damage ' + target.lastAbsDmg)
    thisTower.recordDamage(target)

    const w = Game.callGridSideSize() * 2
    const h = Game.callGridSideSize() * 1.25
    const position = new Position(target.position.x - w / 2, target.position.y - h / 2)
    Game.callAnimation('magic_2', position, w, h, 1, 2)
  }

  hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (Math.random() < this.chance) {
      this.chit(thisTower, monster)
    }
  }

  tickHook(thisTower: TowerBase, monsters: MonsterBase[]) {
    if (this.canHit && monsters.length > 0) {
      // console.log('MirinaeTeardropOfTheStarweaver timer hit')

      const t = _.shuffle(monsters)[0]
      this.chit(thisTower, t)

      this.lastHitTime = performance.now()
    }
  }
}

class BaneOfTheStricken extends GemBase {
  attackHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '受罚者之灾'

  static readonly price = 65000

  static readonly imgSrc =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACW9GRnMAAATAAAAAAAA/jYxpAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAACXZwQWcAAAgAAAAAQADWRLxrAAAVWklEQVR42u2ba3Ab13XHf4sFIYAgISxBggJBQQJEkYJJkZZoS2NZdhOGTmJ5HE/cyn1r0slMms70ezJ9ZNJpZ5J8zbfkSz+k+eC6dZM49YwnipLGshTJkmlJpCBSEiFBAPFcLp7kksSjH+7iRVIPx06dTH1m7tzdxb137/nfc84959wFfEKf0Cf0CX1Cn9D/W5I+ZP8AMClLTAJKpYYGXDbK4sfN3G8LAMWoTwZH933Nv3swAHDoqVEAsoUS712cW5y5OHsa+I6u621AWM3WtsH0sv57BUCd+a+8/Mrnvh0c3Uc8mgLAM+gGwB/0Nxr/7al/PK3r+iuA9rsKgPwbMB8Iju773rOfftIGUMyXSNxLM/PrOW5ev8O1awtIgMfr5sQXpwKLC3enU0lVAY4DA2aTOQ40uC5Xyx8rAI8qAUpL/bWXX/ncV4Kj+wjN3SZ8PQI0JUBbKTU6HT4ySia1DMDYxDAAb/7ofxZnzs+eBl4DTt9HAqbt1o6TgFbSN04jbIrGb4E+CAAKEAiO7f334QNDykhwH2/811vsciqNRoeG7azoQsQjEVUAout4vU4GvQper5PgM1MAzM6EePVf//N06EaiDsYigLPLGgB+9tzU0QDAD15/SwO+b5RFPmKBeRQVqHM4AJzqczuPH3vmSQAWbtymy2rD4+qgu1Omq1PG4+knl1/l4NhukMBslYnFssRiWfIFnfn5MCAxdijI1PPPBg4+7p9OJ7VTqeTyJIDVYv7mc1NHJ6enjrAYjqEuZ22Ors7jhdKqDixS/Wgl4VEAsBkgDDidjlOTRw4OHHvmCOfefhc1s0yX1cb+3Ta6OsVQB4J+fD4XudwqO3d2Iu8wAVAo6BQKOktLcebeD5FOpAEJkwnGJoZs7l09oxLSybyWD/z1l1/muamjnD5zEbezCwmIpVQbcJoq8Y8SAPMjrr4CTPr3eidHgvuM1b/VaORxdQAQVzcaz3w+FwAdWQHMoFchGtO4fXcVECowOxNC3tHF6IQYc/bKLU5+4Q94burodnMJAJMIVfnIpOBhAIC5AcK0P+inu6uLC7+6CLowXkqXjsMm9D0tVbFadTxewXw8pjLi8zHi8zF/9SreYQVLpX0BZ29EmTkTFTdl+LNXXsLa5QFgaNDDes1FaDEGZRRg2mq1vtbaX9c/3DZqeoQ2ChDwDnom6w/O/vztbRvu84rhdnl72eXt5cQXjzE8PgHAyPg4AN5+pa0e8Vu3HevCuQscOXak7Vlw2HcSuAR8DSENH5oeJAF1yw8wPbh7lwIQWYxs23jIK0S9Lpt1KagzvnD1CiPj41hCq40+3n4Fi0n0mA+Llbx47iJHjx1tXIcWIoQWIgSHfbz8wnHocgYW5sPfnp+/oy3Mhy9jbKf8hq73/YygYiA8iYnjwCmQbIO7Pbx39kJbw74eG0NemeVCjR6HCd3kMRyhXgA6bLvp7e8HJNRkEru8ggTkS4JhWdJxOc1IxoZcUHO8/urrXDx3kdi9GDdjGTJqjj7XTgFwfoXhET8jI37bsacPBfr6+17M54svFvLFUYSDpdHiaD2MtvgBTqcT4HvASQCPE6X1dy2bBWBsxAeAry/P1BE7AH5vB4cOgmXfIeQeocdUvwSmIXFdeYs3/u0NseJzYQCy+QJ+Q3XOXNzg3KVw23yy2XZenE4Ye8zLWHCQsce8xAkKCZtbYH5unouXFxYNiXiNbRwovdg+3hYJsFqt04fGh775wvSTypf/4vO2z77wPP/yrW/gD+xFAkKheQDcvWJFdtrX8HstQmwcMp5+kHs8mGzdBgDdTQAAKknUdBY1LYDU19bJFmooDgm/V2aPW0eSIKlWBagDZfoUGqW4Cql0gdlQjDO/CpFM5pCQGB4dZmR0hMNPHlZ6+3omQTqlZpZPAnXJWAQor5cfCsDJRHL5xcPjQ3j6e/jsiefFRAJ7mZr+A9S715mdj5BSc7h7d/L4cBXFITcAGAx6MNm6mgDU9kDtdmP83p71huj1uhVi0SQAMzfK+L0ye/t1JoYt9LtkJoYt7OhYbQPArnhx9zlw9zlIpQskkzkW5hY4/8vzqGmVtY0awweGGAkOceyZI4pvz65JSeJUKqkeB94pr5e1hwFwHJhGkpi5dpvZmRmQBAAA6t3rnDl3rSEFe3eVURwyfq/wBfodReQeD7XVogChsgG1ZZAkkHqgkqTXLbTK5VboNS/i98pkCzVmbpRZXys0Vh9g0N0OQHfvY4L5TB53n4OlZNOoqmmVq7O3UTMakgSu3h58e/oZGx/B3d8bmLu28GJ5vfwONJ2pLQDouj6gdFmnd7t22jpqNfKFIs8fe4xMJMyP/uMN/vtnP+ZuwkR/3w6cXWu4e9YZ31ehXNYpl3U6d7twujcwyUVYT4BNArkbTBmQdOiAfDpFrZhFj8fIFXMMuC0cHN5BZhlS6gqra3KjmFllfd2EtlyjWIRCPkY0FsMsFTBLBRy2MjZzGVNV1LJcZjWf4v335lm4cp6lRBFMZkYfH8Pj6VPU1PJkLld4zVCLLQAogFJc0QPFFT0AEo7uTiQgEkvx9sU5zs8kAHB0mXDYJdY2yijdEkq3MGT6qsTgsKM54o56dJgDJPJLawCsFUusFUoUSssUSjUcXSaC+8z09Ujs32ujyy4jIVEtF8TEesyARGmtxspac3iLEDwcXUKtOizQuUPomJqDrJoldC1EX38fwfEgiUhiIHI3dhm4Dtv7ARrwWjyTDcQz2UA4GufsxdktjQbd2/tQ0YU83v3d7SAQAXyAD8cA5JdSW/rFkpW2e0+fMKxrax2UihVKRaEWrp2izEcEgyvFZp98EfJNbxzXTigZYIWuhQiOB/Ht8QJMI3YK7X6OkObpdSq7ehXC0a2xh7dfbtR//txWVyJ2U6yaAOEZ46lve8CSVQb7m2DG0+sN5lvJ3mVqgAAw4hMAGOkGALqLsGtTvxkjZAldDRE6GKo/bmztrQAIz088CfQFBpWxQ6M4569y/qzo6Op14OvNAzDshSeCMOy1cmEOjHwI/oPgPjhEKZUifPo2/k9tcnW7bDj6YCO3Tqm2gSTJxFoEYk1f5/z7TWkYcsvYHTK3IhVAxjsAs4vid5MM9pbhx/fDRrkuURBNAkbCZWJyHPsOmWx77KBsJwEKMD1xaJTxw2NE5682mN9MTxyAWLpFMvpAGR3D3u/G3u8mxSzhdxYAcO52oRgRIoBryELmZlNeZ28IYK1WGY+rwv2ozvxYQEhearm9bZ3xWLK93/jkBBOT48Tu/QKET6DQogKtYa8yfnhscvzwGAALN2LbMv7VL26d3KAbSkDq2ix2txu7202HfZ3sPREtht9ZwLEviGtIiPjI83bylQ7mQoXGGIf2b+BxVYirgsFCzpAEn7jft7uj0XYsIPPmeQHArSi8dR4MR3ULTUyOc+XyVS6cn1lEeIjAVhUAmJw4NKpcfU8YPjWT37L6TwSb10ZSGG+fqEupVKO2u408YUTFuduF/+lh1ASot9YbIIwdcDAXKjB2QLzD49KIqzKJZROH9m/gdpgazANYzdtLx+17xjz625/Hs4J5gKuXrxCLxr9PS+C0WQUUp9U63VGViUViRO9FsVqhVBTi6euHl58Fu0WkA8JLYLXoePqtyDusxHNg39mcrL1Wwd6zwQxWYuEUSs8GrkEDPR3UO3Ew6Tx1eBU1InQz6NcJ+sHS6wIsyNV28K2m5vihW3l0PUYkCdEMDO8B2YhuUpowkFarE+8+D+FoiPm5iMamqNFMu/gHvD5vI86ORdrF3+duXoeXIByHqSNWPP1bY3pHr7NxPTapMHtZI+XRkbNxXHtFoOTa60GNiOBn5GkFl8/KerF9CS2bUxaZLKFbea7fLBC6lcfTKxbmmfGmRNaZTxlOr3/Ey5mfXAARIGmtZbMNmB7cPdhY/Tbm+0UBwXh4CaYmaTDfAKGryXg+k0U3gXvA2tC6TDjRYB7A5bOSuSfcWTWi091jMVa/zrDgQk+prKZVEgUr141tNjjkIJvNE0nCXcPohTZlBfwjXjHn+Vj92K4tFmhVgYDX55n2+rzEIrH7rn54qf0F261+naKhMAndyZiB7+xlDWtZR70Tx7U3IVTAuqux+gDrxSqlG/N09PY2JEBPqQ0QrkeFSoRuCbW8tQSRFovv7hF13T/wjwy2TknbVDdUQAECR58+pOhlnVvhW40jK6tZeFTVGtxJwGoZBnuF0Ussw5m3E21Mx7PN+1gK7sZ05u8KZyqlwtj+bsKxDZRkHr/XibYhoWhWXD4hEZZesPR6Wb95gYoaY9UsXJvZhQ3mbnaTWc4TSclE0mI3CCfFVup2gHsnqJKf6D3Bn90J/n0uKOsouxxaaDaibQahVQUmYave12nesLLGPAG4EII3z4vrYcPR8/Rt7ZtSwW1IdTZfRek20meFCqHbTU8zOOGhoor3yz1i5a6823RcZhc2OHPNis/d3AnqjDekzmA+Fs1y9ClxThmajRCajZxmm2xy2zYYi8SxWre6oWpOSEGvQ6x+NCMKgM0YYcFIFUZS4HXDoAGEu0Wd3S7BtNIt43SYyOaFaxu60gRhX0+77Rkb7mB2YWPLnHx91cbcAFI5SOUhFss22ngHnWL8axEN4fvXV74BhIzItw8AytHjhyd7XD1ISMTuiZUwm5rMg1CBVurYZKTNZiiUDA9Rgs4dAiF7pwBAqu1AK1SQkNAKFcplMWAmWQQkhhwRTJ3Nra+2VsPtkkmpVeZublCh0mAeYHWtxuw9CKdE4FNeb84ldD1BNJojNBv5KVDPA+i05AxbJUCL34vj7nOiJpvOud1mR1+H1WonAJ3lFt8XWK2J2mPsI62eduguuHcayU8TqFrzjXEN4pkKcoeFwT4T0XQVy80MP1518Sd/2LL3d2hcOF8CCZ56HDpuAJiIpQUI80tuUsZ8vQNuvvQ3LzW6zrx7idd/GcLZZa2vPNltcoIDCBtgW13RA1OfOaYggYRET49CLJpiVd9A1VYAiUp1g5IOJd0IRAwJKOrQbaPt7HLHDjAbjkkmJ0q5KlFcqVFcEciZZJmg39zIzt6L6qQyG4w9JhKt0UiBQr5CNCrUYClTazAfzVRY27BTKIicw3OfOsLX//7vOPzkExx+8glOvPQFLKYNzv766qgBwGV9vdwmAa0AKKsrulbIZwNHjh6yDe33gwRypQRIdNosqFqJ+DKksyL5kM5CFZGoLK5CQoP1VSgUmiWZbTKfyUFmuUoiI4qnT8Yky0iA1y1TKNVYW6uSSm+QygiGrR0bFPIV8oa9MGEilhHX+ZVaGwCObjv79uwmsbSExzsAgEXeYM9gfx2Ey/p6uREH1AGwtZZ8Pqu9e3HG1uNyKkNDfnKpGK4eO64eO7sHnNjNWSQglRVSUDZWv14swNp6s5g32VSzDJ5eme5OEzcjZWqSTCxdJb9SI79SY4dZSEYqvQES+AZoA6C4wn0BGBxwY+uQ8QwM8OZPfsLMpUvcrjsJkmSLRJOnNwMgIYygYtT1awUIuPqck8GgX/HtEXtf5G6cDrk9ATLz7qV2Dsvi65A6abl82897dum4nM37sGH07VZRvP0deHqa73j5U822VxYqWEwbhCJw3diWY8t2Fu4IAFzODk58epqJA36u3BAutprOEk+rJFKqFk+rr+jlxm7QkABousK2lt/01RU9HrmbiF+7elPL5Yq2nc4um2wSSn/4iVFOvDSF09FNLpcnlzNC2ioUCyWKhRLdDjv62lrr+yiXy0hAp+FAWgwbUrcriVyVm0tlbi6VKeo1YvEqE8Nimkm1hixV6dsJIQMAyw47q3qFVb3Kql7l6o0oyUy2UUqlEjNzCxRXVr8LvFautp8ayZuZNkr9Wf2YSc/liouRu4l4NrNMYikFkmSTgPL6OvUDpoMTj+Hqc5IwsiTFQgmzpT3gLBTLDdHrtDYBALCYYaO5w1FcrZHTaiSXa80JS9VG/3QekprcAECQuQ2ARDK5iAiCvgvEy9W26SCz/Tlaq6VsPWvTrBazBiwmllL6zKU5Wy63bMvl8vj2CM+tt8/J/qCfLoedRCzNX/3pC5z6o8+TzGgk08uUy2VWjdEkoNMiGAeRztrYNEGrSay8JEn0uyRkqdpQgVBE2AQ1KwzmU487cTl3k8xkNcS+f5pq+TXgpxhZ4M0AtPkBLbWyqTSeZYt6/foysJidjylAQJY6AgDVAQHE+Yu3mXr2OP/0rW8AEF5SkasVzr1v6GYWHD1etLV8A40OG+yS0w3vDsBleJLv3awQVStYOoSTVU/EqIWml+g/NEVoJoTdbjmtqvl66PvADyrqAGzXoBUIHnCtAdrMjTuLgBK6lagbUv75H74qwHjnAseOi7P+OgAA4cUYipFA2eXubDK9s30ibgVmb4tI78IcDyRVzWuqmq/7/XXmHwrAZinYDoh63QqAss1vi8Dk1LNPBB40UX/AS3gxRjwpLHg8WcLTb2evZ/v2dRDuR769XiJ3YtD8TPeRPqO577nAQ0B4kJpoiO0UEKt/7uzFxnUDAP8gU585Sjh0DoCZa2niyRJx1Tj8cLRLgrunmeHZjo5/WnxUEbkVrb+7NfPzgQG4HxCtYIjrcrtq6GVdARbz2exkPBxmLnSLC+8KuT33frjxTU9er6Dp4AocZWJyjKmT8IPvv8r8/C1Ka1BKQyQNit2CuiJOmiW5gJrN43SKWCGbzaOXYWx8GP+QCH0vnJ9XYPuQ/jcBYDsw6qv8INUIAJy9OMtsaIvcLgLa2Z+fhZ8TmJgca5zS/OVX/hitqDc+dliYWyCezBNPCkPp6W8y3kqjB0ca13Pvz23O+z2QPsi3wnVq9RVat8vWz1MWI7GUDUkauPT+DVskliISS2nA9XK5fN0AQQcWk/GUfvXynE1CsgHs7O3B5XYhIbEwt0Cf0kl31w6KpTWKpbUtn3UdGBvG3d+Lu9/Fqz98Q0vF1e+2jP/QT2U+7P8F6qRsc68Ak8anr3XSWj5r225XUaxd1sDw6LACaAtzC5pitwR2uYUKePodhO7k0bLC6/Tv9XLi5Almr4rTp1d/+MZrlKnn/R9JAj4qAB4FjDZG7/Pb1v5mJn2D7gDA8adGcTjaf84bCZCzv7igRe7Evk4z8/uxAXA/MB7kTyj3bW9utvENuifdrTk2wGp3EAlHtcid2HdamK8nxz92AB4GxHaAtNfmtvvApvYaZepnfYu0i/4j+QH/VwB8EDA2A7AdUHXSKG/x+B559T8uAB4ExHbAPBiA+5dHoo8TgPuB8TAQNgOwHRCPTL8rADwIkPsxvx0IrfXvNQAPA2Mz8x+Y8Tr9LyG8N0O199yAAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA4LTE4VDAyOjA5OjUzKzA4OjAwwkGKkQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wOC0xOFQwMjowOTo1MyswODowMLMcMi0AAAAtdEVYdFNvZnR3YXJlAENyZWF0ZWQgYnkgZkNvZGVyIEdyYXBoaWNzIFByb2Nlc3Nvcn/D7V8AAAAASUVORK5CYII='

  static readonly maxLevel = 50000

  static readonly damageMakingRatioOnBoss = 0.75

  static readonly baseDamageMakingRatio = 0.0008

  static readonly damageMakingRatioLevelMx = 0.00005

  static get stasisDescription() {
    return `你对敌人造成的每次攻击都会使敌人从你攻击中受到的伤害提高 ${Tools.roundWithFixed(
      BaneOfTheStricken.baseDamageMakingRatio * 100,
      2
    )}%（+${Tools.roundWithFixed(BaneOfTheStricken.damageMakingRatioLevelMx * 100, 3)}%/等级），对首领造成的伤害提高 ${Tools.roundWithFixed(
      BaneOfTheStricken.damageMakingRatioOnBoss * 100,
      0
    )}%`
  }

  static get __base_description() {
    return `你对敌人造成的每次攻击都会使敌人从你攻击中受到的伤害提高 $%，对首领造成的伤害提高 ${Tools.roundWithFixed(
      BaneOfTheStricken.damageMakingRatioOnBoss * 100,
      0
    )}%`
  }

  get damageMakingRatioPerHit() {
    return BaneOfTheStricken.baseDamageMakingRatio + this.level * BaneOfTheStricken.damageMakingRatioLevelMx
  }

  private readonly damageMakingRatioOnBoss = BaneOfTheStricken.damageMakingRatioOnBoss

  get description() {
    return BaneOfTheStricken.__base_description.replace('$', (this.damageMakingRatioPerHit * 100).toFixed(3))
  }

  get levelUpPoint() {
    return (this.level + 1) * 16 + 40
  }

  hitHook(thisTower: TowerBase, monster: MonsterBase) {
    const oldV = thisTower.__each_monster_damage_ratio.get(monster.id) || 1
    thisTower.__each_monster_damage_ratio.set(monster.id, oldV + this.damageMakingRatioPerHit)
  }

  initEffect(thisTower: TowerBase) {
    this.tower = thisTower

    this.tower.__on_boss_atk_ratio = 1 + this.damageMakingRatioOnBoss
  }

  levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)

    this.tower.__on_boss_atk_ratio = 1 + this.damageMakingRatioOnBoss

    return ret
  }
}

class GemOfEase extends GemBase {
  attackHook(): void {}
  hitHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '屯宝者的恩惠'

  static readonly price = 10000

  static readonly maxLevel = 50

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseGoldAddition = 500

  static readonly goldAdditionLevelMx = 150

  static get stasisDescription() {
    return `消灭敌人获得的金币 +${this.baseGoldAddition}（+${this.goldAdditionLevelMx}/等级）`
  }

  static get __base_description() {
    return '消灭敌人获得的金币 +$'
  }

  get description() {
    return GemOfEase.__base_description.replace('$', this.goldAddition.toFixed(0))
  }

  get levelUpPoint() {
    return (this.level + 1) * 100
  }

  get goldAddition() {
    return GemOfEase.baseGoldAddition + this.level * GemOfEase.goldAdditionLevelMx
  }

  initEffect(thisTower: TowerBase) {
    this.tower = thisTower

    this.tower.__kill_extra_gold = this.goldAddition
  }

  levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)

    this.tower.__kill_extra_gold = this.goldAddition

    return ret
  }
}

class GemOfMysterious extends GemBase {
  attackHook(): void {}
  hitHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '窃法者'

  static readonly price = 950000

  static readonly maxLevel = 50

  static readonly imgSrc =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAACW9GRnMAAASAAAAAAAAw1YYFAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAACXZwQWcAAAgAAAAAQADWRLxrAAAWUElEQVR42u2be3RT153vP7JkI1m20bGwsPADyzYmAgXjVxxcExcKOEnL7bSUdNre3Ls6dKXDmmk7uXRdJmv1MV1pm2ZuezPtSm8SprQzi9tpAg2ZhpTi4EAcDI7BIDACx/JDtrEtW7YsYSR8sGX7/rGlowc2j06zbu+6+Xntdc7Zr6Pvd//2b//272zDR/KRfCQfyUfykXwk/7+K6kN/g0a5k4CdWigEGoEf1VaUVLRdGWgEttRUFHPmfPc+rVYrhcv3AchyfHf+gP//GQIkYAsaXgHOA73/85uff6p0VS7P7TvCM09tF7W00QZnzneToTcC8NxLh3trq6yFjac6vhoh48+dAGmBvJ4rbz4rATSccVBfY2NkLAGANgoe4FKHh42VVgBqq6wc+vcm2q4M0HZloBd4wh/wn/+/QYAE7I0B+TzgA7YAO8P5PuAQULhlg20vIG19eC2f2mSL6+i3x84q96fOd5KiTYkrT01Nj3suNhupXJsPwMsHmzl59krj7PzsvvC7PnQCpGyDAeBgzfriLRvKivjBP/8OxBztBZ5aqNHrP9+j3Pti5vDRxjN0dHUoz5s31ZIs32J1cREAR/7QQGVZiVLu6HDiD0TnSHVVGUnAa78/icPp6gV8cohG4O//1ARERlrKNhgO1qwvrtjz5XoAvvXK77C3d1O2rpjyB4vodo0ojZrOXLqNhF+/dYajx1uU/F1f/pQA//GNABhUaqXM2dWN0ZCCzVqCo8OJzVrCgTfO0HrOrtRJX2rAVmLhtd+fBGB8wkffiD8ToYH3LeoF8qSY68FtD9sq9ny5nh3f+DkHj50jKyuDkdEJzMszeXzrQ2QZDfRfGwWgIC9buR8c8fKT/W/h6htUOn7x+T387deeAlScePcUloKVaFVJCviSVcVM3byOZ9yLzSo0oW7TNoaG3Xz2059EpYIxr5+T719k7aoCxib89Lu9jTOhuUOAzB8hiQTEgX/xW09WZBuX8nfP/YYww7oIASOjEzy+9SEq1z8QBr+cgrzlzMgy19xerrm91JSXULauhFVFeTT89p9YVZRHcmo6Fku+QoI6FMJozMRozMTZ1U2qVo3jg05s1tUAaNOyFEXNWWEmdEvgvNLVh8Pp6p2annsiDF73x5CgSczQasTyVW2zVGSnJ/Off3QgAv48sAVykUOirkEL1vUbsK7fQOPbJwBobnEqfT22tZ6atRmUP/o3Sl7wehvBCS+2YhO24h24XJO4egbILcrHstrK0//wLwAcOrkfgNrqapobGsR9fT3VmRYa+px0906h1WRLcmgkMmg+AK1WG4dHlu/MSSwBsaOvLGm7dtQCSPtfb95StiafPbvq+QnQcqGblgvdbN5+Z4al7GLl3nWxAULeuPKcoiJyivIZ6hkA4PvffyauPDiTohDQ3NCAXW+krbObytXFAJJnRtfWftVVGa6+M3zdxz1KrBGUACmiAcCPvvaFTdycngFg/+vNvPjtL+LyBPnJ/gal0cFfPMuWbZsB2PvNb3Pg8Aml7PSb/xvZ36EQ4RvpRlomoTcalTrTSQZyi/JjfoY57gf6kGhuaOC5p58GQK+Ptm3r7MYvR43wujUW5mahu9+9D7Ey+O6mAQsRUBi+34lwWyNlhWVr8rE7PQBCE/Y3YDGgEND49gncAdHg2b1fY/PHqjEX5IuRD0vu6mL0mcYYErQJP0kQcOJEs6IBtfX1fHLNGoWAytVFtHX20NbZTX6hjlJrAevWWAAYGfHz8wNHAb4K7LtvAsKglatWo43k7yx9IJ90LTyzezvNbU5OnevE8YEzrkPJYGDP7r9kQ1XYAQq448pd18Rq1XzRRe16C0M39TS+K5yj402tlBWXKXXrtlVjK/3vAPzyu58AIGet0PYjTccBeOPwDyldXwrAgV8d4K3GFo6cbAXhqzxB6M7Lo2aBPB9Rzy5iCyp+/MwXAbAWSDS3OXnupSM8s3s7X//bJzly9KTS+O++8llazjn43F99C4COQX9C97EjfhKDlnuSTU98h74rTUwTVMDv++7zlK63KeAvXRR+SElBDs6+ochA3hcBvsWuB95o5snP1CrgayujHtu+F58Vo3L0BC3nHADs2f2XAEz6PHEv8HinqF1vofmiCwBLiQCwta5aPG8oj6v/471NWNbWKSnFc5wjTcfZXreV7XVbmcKtAF9AItq7KAlJC4CP3EfSztIH8iue/EwtgAJ+Y5VYp7c/vllptP3xzWyoskXVPyz1NVbqa8IbnPWWuOvWumoFPEDT263K/ff2/Iy+K024rjQt+OOPNB3nwK8OxOV1ugZx9g2BWLbv6h0uNgUi7BX+9Rc2FFbaxI99+TcnsSwDm9VMdW14rmqjVlv2DyBlZwNQVpWE3e5AL5lo7hBLnzcIM+oMPGNePB4vlvxcfv+bXwNQXilG3jhTCnYtr/7iZWYuOHksbQ9mrQnzcjXuMx7GcpYjaSSaT7fRfLqNOmsZMy1DOEY9ODx+nP1DEQyNdwO/EAGx894H+Nou91Fps9DmcNHmcGExJDToO4XOsJIpf384Rw+AOduE+bHN+MZHGBiMTgOTyYjJZMSBE4/Hi0ED9rCvv2v3LnRyOa/+4mUcF9qwlVdiXmYS/dWYMNeYYNxGfWM9DcfFyvLq5cNw+TZc5xGbtfsmIFYiKwEAbZf7AKh/rA6AY8eaePTRurgGsn8At2yMy9NqID9XgMjPNeG8OohnzIspS9Sbnhhn1+5dlFWVYT9n5+hL/+u2H2KuMcU9v/D8CzzN0woJsVK/qhZgS0NX8z05Q4kExHqDFdZi81OVDxYoox+ZCgAv/PQ7QgMGB5XR1xryYSR415d6PGJK2NaWUGb7NPZzdva/tB/7OTtm1mArF0udrbyS6YGF+4iQIIe1y7Zc2Jir4+Htdhc7EZpwR0ncDkc8QQk4+OzTny8kNEPDSTvdfW6KC8zUV2WzfdceVpfXRMadybFBBq8I4zWTpBMgx3yYsiSS56KdN7xnR6/NYusjwkgef8/Byy9HR7FU2srXVv4DUo4aQ47Yp0lL1fAYsGqBX/8HcBy7hGcgSnqzz8Ep91sAvubhI5VyQDHmC0riblCnSUIHrAC2q1QqybLCSMO7dooLhLErzknjP33lmzFNQizRZ7BEnwGomJqawjPmw+Px4xnz097RR/HKcNuVZgaGJtl34AR7v/8qje85kFJ1Cvh1mVsoWJKPfGMeFSDfmEfKUgvwxoUBmFLmCV6fIXhduOz5mdWogIGAUzdww3k6NE0vd9glJm6GYlMhQHdf1JOr31TG6hILnRfOxGgATI6JPX+GKQe1ehaTyYAny4/jiov6R8qU0W947wKtZ+MHIwI8ck9oStEAKUcNAaA7QQO6EkjI18dpQe2K7REt2MtdVoOFjKAE7Ny8wcamh9fScDwaw+vuc7O6xLJoZ5OeIbxeP54xAdK21gJz8N++v5+G94SlN2gLlPpbH7HxZOrzC/blH5oVP2apWgAujinsDpPw2OLANpo/BVBxsufI3tlZJYZ5dwLCe/2Kgux0XH0DDA260WlAp55Gpwqin7yA3OVjKkNolW6ZmYxk0TYjx4R6fhZ3v9AId3+Qn//ydzSd7lAcYKu8A4DqdaV8/RNPYnlS5A+0Qv/7wCUdvvCK6usH3V/A1FXQnQDtGpicmGXy8iyT7bNkTKrJ/YQW36SbYKGbzqsu2l3/DkBOahWzcwHyM9fudY1dgUXihhEbELH+K8KJicmpiuI8I319YruZaUjlodI8HghrgNftwut28e6xd3GcbcVxVhjBru5rSuftFx0MuH0U5mfRe20cADM1VK8rVepkLM1maS4szYWVD4P2AWGZ5XA3aXMgXwXdGtBkwZJVYedVBZPts/zr8VdwXnXhDYfbNXNruDEzTIf/TaFJt4JIelOt/+bYaRbwDRYKiJCoLsUroxbIaLZgXGHBOywIsD1UrRDgONuKKyaKW1pmY2utWJ621lrZ+/xhAFrbLykknPqpqJtfDRu/AdLHRLIAvtMg/0CMvHaNIGJ6QkyNyXZxXR3eBndeFXuLXH0lufpKclLbaB17CYPehD/owaA3HfcHPbcFTyMaoItJEvCNL9SvlwA08zMUrTTiuz4lXpibinGFhdR0KTxlkjDl5AJgysml+uObaL8oNkSjIx46Bvx89QuP8MpvTtF7bRwzwnjmLs9mx9ZtFHwyOgUuvw7pw2J0dfkipReJ0ZeviqkQCIRYsjyJycuCgNpdeQA4wwRcGG0iV19FRsoKMpJz6Am0Ic8E0SXr8d8ck4DTxKwKtxGg1SBpkthiXpYlBW6G8IxNIklGvvJfPsnqkiJ8QRV9fYPIsxqCMxpm59V0d/Yw0D/IZECmuLiAd1q6uTWXzENV69jxxDbePnWN1w52ocFAulZHVdouZq9ncqb5Gg+U55GSDllWkXouw4AdnG+C7ITstUAK9AzL2AduMDSbQnJhMs6JeZzeecx1IZYsl0jVm7nydoDeoV66hs+gSpEJhW4xmhYgzZBLmiGXwIRLkkPyvjsSoEkSU6FrYKRiVb6ZwGQAz/h1POPXsVlX8mDVxtvcJ7/Xi2Rcht/rpX/0JgNDYr5/accjvHf2Gj95IRomK15Sh3fOCaiYmvdyrOm3mEwmTCbh7pZWQ741rBUfgPOiD1DhbJui85xMpiUVo0WNt2+WVCmJ3AfF+p+Zk05mThqe3lm8freSeoKnyViay+T1IW5MDj0vh+TzxESQFyKgMGwIFQIAhYRNmz7GqYY3GBnsQ4WKtKUGJKMRyWgEVLz59gU2Vlv50o5HaG7t4B9/eiaOrCXqFKbmvRjVq/HOdaJWJ3HligOTyYRnzMP5gyauj8ODGwURWoNg2zscwjscItOSCkCqIYlUQxKZebeUvjNz0skM1OD1j+D1C/+lO3iGcU8HNyaHAJ6XQ7IcBi9DfDwg1gD6zMsMLCaP7/wrANyDLlxOp5JOvHWEjdVWaqutPPezwzz3s8MLti9J3o53rjMu77WDrwIC9EAH/NsPxRVQRh/A65rF2zeL0aLGaIl3ZLvPurmDHGIBXyCizIkeYCGw11qQLWlDYJTEFteYqaduWw27n/6O0sHUuDA+J95p4mRjE9ahH/LylW/TNibUvkCzIe6FtiVfwpRchiMo4v5q/YxSJlFC2boHsVqLsK4Rnk9Ls5vOnihZ07ntALzw4tcBcL0v8ltbWjn7fiuXLrfinx2KjuZ8PyNy33nEB91eokuhDxZfBSRAHvcH1poz0kjVpWDM1OOdCBK8MUhObgEr8goACN30K+A3banjx//2rwp4AENSXhwBnlvnCM66sel34ZmxM50yhgah1n6chLxLQaWio6OHw6834B73MTU1xdTUFKm6VGYzxKe3Rx8XUST/oAAPcPjQYTQpoE3KQJ6/gW9uEH/IQ2h+5nuAO5zkWE1IjArHRoQrMvTapx4qzMHrC1JSZMIo6ZFDfgAqN9RR9XAdowMuTjY2KVpgD4fpK7M2U2naRNZKK+09LVzqCduCkFBlU3IZppRybiZ348OJFiMyXiyazXGEadOy457T1w3FPavGovetLa1o08A/OyTAzw4hh+S/jxn52FAfcJeI0GRQPu/1BSsAnD0eSopM1G0TQZCqh+s4934TPVejUyBWKk2bqMzajKHIQmlRDbxNlATAM2PHM2NnjeGzSJQwhZd7kYajrXHPUii+3DUTNwUaEwAvagMiGpBoBwqBp4xpWiLJ7RcjmGvSk5OlZ6vuO+y//DL20TalI6tqO59VvwLAUX5AWWUp5VXrADh26te0XWxW6sohsJijQdSUmfh9b2p21NDZHWfQLmuhflsdj4YHwntd5uixJo7+QQxAzL63kajhW3D0IT4eEFkbpZhnHeBOTdGszctMA8CQsYTJ4AyTwRketpl483z7beCtSZ8iSyWixl2cYmR4lPKqUsoqS3nQWkmOeaVCQmgO/AEPUrrwA9RzqXEEOPreZ8RzDbMpjxHPNTSpgxQXFfA3u/8rxUUF5K3M5fHH6ujq7qeru5+wQpwH3kLM+UXBJxIQ+cQc0QaFhKnpkDQ1HZK8AZmspalk6FPI0KeQa9LzZlu70kHZ8kpCwXTG551Yk8RX07TKSUaGR7G3tWPOWY6UuZQV2fl8+rEvMTwywMCwiHn5Ax78AQ9zN5MI3ryuJKttHd/6xj+hUoHd0aIQoAKKiwqQp2PmgAo8Xh9T8q0DwNUwYHcM8NsCI7dFhBKIULRgajpUMTUdImleTYZenOsZGgsy7J1SwO968K855+qkY/4I4/NOUEGHO0qQva2dzuHTqFQqVmTnU1W2ESlpDf4bArx4YXRPtqn2i+z4zOfFVHrnYJwGFBcV0NPTT7ujh65usX9eVVzAwLVrDA6Pn04gABaJByQSEAs+lgAANyr1Cl3KvG7J/DzLktW80+UmFP5LnjVzeXgI1/Q7aNDgp5eu+WNkrXHBsg4lnXWeoNlxiKSlfpKW+sn7uEy2MROzppDU0RVoNTrSNOls3PkAedUzqDLcyCkubmmGaLn8FuOBADPTc+RlLmVibILGU604u3pxdvXyh8YzuAdHCQgNiKi+zH3EBGO1IJEAHcy7A6GQTgWSOU1L10QAgyZHrLtzk6hQISd8///czi388lcvUVCwkqamZsYnAoq62taUo5U0LM1ZQv5DGVwfmsY7FKTsMzmYH8gQLw0feDBnr8A9Osygu5dRr59Rr5/2zj4kg7BNPf0jdPe78QeCjUTn/x0DoosRENECXcKzuCbhC0yHVgSmQ7rAdAh57oaS/KEhtDEfP//ic7X84//4HgD9/WKuy7eW4BkbwTM2wua6x9FKGgbOTnL5jXEGzk4SIsTIBzcIjE9jtmYoBIQ545xdGM8ICf1D4/T0jzBxPQBwPhQK/Yyow6P4/IvJYh9GElnrRSyJvQgDecgdkGMDKLFLpyKf3rExrpO6j2+kuaVHeXZctTPwXcOCP8D9wSS8AVJ5N2Wl4jvBhUttidVi1/deosveolb/XglYiAhBQiiuLO4zGnAerVwBFNZU28hQJzHyQQvHm6LH3Dx2Lf4ZGaPawqXXppBlNx460bMMAD05AGRTjvZiGa/37Ob1Q4ex5NhwDQ2gRs8swcinr8gJkAgBvdwD6HslIPacQCwJsWeIEq8g1mClzvEmO43vXlAKvXPCVzYmFSh5EfAAbuzKdQQRUvff8GD/QOwvwuBjv/z67pDuKuq7lCceP4tYVZl4C6vMNa1GA7A2L9ekQwUt7zuUzo432fHNiGAJKuGEzszdjHthJiUEECQFGME/PRpbfD6E3Eh0Y+OLuU80evd0ZO5+DktL93AtNIjj7oVET2yxta5MmQZ+WVY+vxvVFmZnp+Jeok04c+1XlnEagUYZf+IIL+Tr3/M0uN/T4tIiz4n7CGVHCUhqFdLsfNw8hUUMpxrxkWEWESfQqvTI88F9ROd37DxfCPB92YD/6HH5hQiIJSG23HeH9oWoqGA+vlBNMrPMNBLd1d3Jr/+jzgr/qf5fIArkdjLuhTwWqB8BudBe/r5V/cMmIBbAQqvEneonknAv1v0/DPzDICARiHQPde80+nci4U8mH8b/DEmL3N+NsNjrQgTE5v9ZE3Cv4BcjISJ/9NL250LA/YC/m3wo4AH+D4rZT0GHbTNnAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDE3LTA4LTE4VDAyOjA5OjUzKzA4OjAwwkGKkQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0wOC0xOFQwMjowOTo1MyswODowMLMcMi0AAAAtdEVYdFNvZnR3YXJlAENyZWF0ZWQgYnkgZkNvZGVyIEdyYXBoaWNzIFByb2Nlc3Nvcn/D7V8AAAAASUVORK5CYII='

  static readonly basePointAddition = 4000

  static readonly pointAdditionLevelMx = 800

  static get stasisDescription() {
    return `消灭敌人获得的传奇点数 +${this.basePointAddition}（+${this.pointAdditionLevelMx}/等级）`
  }

  static get __base_description() {
    return '消灭敌人获得的传奇点数 +$'
  }

  get description() {
    return GemOfMysterious.__base_description.replace('$', this.pointAddition.toFixed(0))
  }

  get levelUpPoint() {
    return (this.level + 1) * 100
  }

  get pointAddition() {
    return GemOfMysterious.basePointAddition + this.level * GemOfMysterious.pointAdditionLevelMx
  }

  initEffect(thisTower: TowerBase) {
    this.tower = thisTower

    this.tower.__kill_extra_point = this.pointAddition
  }

  levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)

    this.tower.__kill_extra_point = this.pointAddition

    return ret
  }
}

class BaneOfTheTrapped extends GemBase {
  attackHook(): void {}
  hitHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '囚笼宝石'

  static readonly price = 20500

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseDamageMakingRatioOnTrapped = 5.85

  static readonly damageMakingRatioOnTrappedLevelMx = 1.25

  static get stasisDescription() {
    return `对受到控制类限制效果影响的敌人造成的伤害提高 ${Tools.roundWithFixed(
      this.baseDamageMakingRatioOnTrapped * 100,
      1
    )}%（+${Tools.roundWithFixed(this.damageMakingRatioOnTrappedLevelMx * 100, 1)}%/等级）`
  }

  static get __base_description() {
    return '对受到控制类限制效果影响的敌人造成的伤害提高 $%'
  }

  get description() {
    return BaneOfTheTrapped.__base_description.replace('$', (this.damageMakingRatioOnTrapped * 100).toFixed(1))
  }

  get levelUpPoint() {
    return (this.level + 1) * 24 + 90
  }

  private get damageMakingRatioOnTrapped() {
    return BaneOfTheTrapped.baseDamageMakingRatioOnTrapped + this.level * BaneOfTheTrapped.damageMakingRatioOnTrappedLevelMx
  }

  initEffect(thisTower: TowerBase) {
    this.tower = thisTower

    this.tower.__on_trapped_atk_ratio = 1 + this.damageMakingRatioOnTrapped
  }

  levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)

    this.tower.__on_trapped_atk_ratio = 1 + this.damageMakingRatioOnTrapped

    return ret
  }
}

class ZeisStoneOfVengeance extends GemBase {
  attackHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '贼神的复仇之石'

  static readonly price = 17500

  static readonly maxLevel = 500

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseDamageMakingRatioMin = 0.02

  static readonly damageMakingRatioLevelMxMin = 0.001

  static readonly baseDamageMakingRatioMax = 1.2

  static readonly damageMakingRatioLevelMxMax = 0.125

  static readonly chance = 0.2

  static readonly stuporDuration = 1000

  static get stasisDescription() {
    return `你和命中的敌人间隔越远，造成的伤害就越高，最少提高 ${Tools.roundWithFixed(
      this.baseDamageMakingRatioMin * 100,
      2
    )}%（+${Tools.roundWithFixed(this.damageMakingRatioLevelMxMin * 100, 2)}%/等级），在最远射程时提高 ${Tools.roundWithFixed(
      this.baseDamageMakingRatioMax * 100,
      2
    )}%（+${Tools.roundWithFixed(this.damageMakingRatioLevelMxMax * 100, 2)}%/等级），击中时有 ${this.chance * 100}% 的几率使敌人昏迷 ${
      this.stuporDuration / 1000
    } 秒`
  }

  static get __base_description() {
    return `你和命中的敌人间隔越远，造成的伤害就越高，最少提高 $%，在最远射程时提高 $%，击中时有 ${this.chance * 100}% 的几率使敌人昏迷 ${
      this.stuporDuration / 1000
    } 秒`
  }

  private readonly chance = ZeisStoneOfVengeance.chance

  private get damageMakingRatioMin() {
    return ZeisStoneOfVengeance.baseDamageMakingRatioMin + this.level * ZeisStoneOfVengeance.damageMakingRatioLevelMxMin
  }

  private get damageMakingRatioMax() {
    return ZeisStoneOfVengeance.baseDamageMakingRatioMax + this.level * ZeisStoneOfVengeance.damageMakingRatioLevelMxMax
  }

  get description() {
    return ZeisStoneOfVengeance.__base_description
      .replace('$', (this.damageMakingRatioMin * 100).toFixed(2))
      .replace('$', (this.damageMakingRatioMax * 100).toFixed(2))
  }

  get levelUpPoint() {
    return (this.level + 1) * 45
  }

  hitHook(_thisTower: TowerBase, monster: MonsterBase) {
    if (Math.random() < this.chance) {
      monster.registerImprison((ZeisStoneOfVengeance.stuporDuration / 1000) * 60)
    }
  }

  initEffect(thisTower: TowerBase) {
    this.tower = thisTower

    this.tower.__min_rng_atk_ratio = this.damageMakingRatioMin
    this.tower.__max_rng_atk_ratio = this.damageMakingRatioMax
  }

  levelUp(currentPoint: number) {
    const ret = super.levelUp(currentPoint)

    this.tower.__min_rng_atk_ratio = this.damageMakingRatioMin
    this.tower.__max_rng_atk_ratio = this.damageMakingRatioMax

    return ret
  }
}

class EchoOfLight extends GemBase {
  initEffect(): void {}
  attackHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '圣光回响'

  static readonly price = 500000

  static readonly maxLevel = 1000

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseExtraTotalDamageRatio = 0.15

  static readonly extraTotalDamageRatioLevelMx = 0.015

  static readonly duration = 3000

  static get stasisDescription() {
    return `对敌人造成非神圣伤害时会在 ${this.duration / 1000} 秒内造成相当于这次伤害 ${Tools.roundWithFixed(
      this.baseExtraTotalDamageRatio * 100,
      1
    )}%（+${Tools.roundWithFixed(this.extraTotalDamageRatioLevelMx * 100, 1)}%/等级）的神圣伤害，这个效果可以叠加`
  }

  static get __base_description() {
    return `对敌人造成非神圣伤害时会在 ${this.duration / 1000} 秒内造成相当于这次伤害 $% 的神圣伤害，这个效果可以叠加`
  }

  get extraTotalDamageRatio() {
    return EchoOfLight.baseExtraTotalDamageRatio + this.level * EchoOfLight.extraTotalDamageRatioLevelMx
  }

  private readonly Hst = 100

  private get lightDotCount() {
    return EchoOfLight.duration / this.Hst
  }

  get description() {
    return EchoOfLight.__base_description.replace('$', (this.extraTotalDamageRatio * 100).toFixed(1))
  }

  get levelUpPoint() {
    return (this.level + 1) * 140
  }

  hitHook(thisTower: TowerBase & { critChance?: number; critDamageRatio?: number }, monster: MonsterBase) {
    let critR = 1

    if (thisTower.critChance && Math.random() < thisTower.critChance) {
      critR = thisTower.critDamageRatio
    }

    Tools.installDotDuplicatable(
      monster,
      'beOnLightEcho',
      EchoOfLight.duration,
      this.Hst,
      Math.round((thisTower.Atk * critR * thisTower.calculateDamageRatio(monster) * this.extraTotalDamageRatio) / this.lightDotCount),
      false,
      thisTower.recordDamage.bind(thisTower)
    )
  }
}

class GemOfAnger extends GemBase {
  initEffect(): void {}
  attackHook(): void {}
  hitHook(): void {}
  killHook(): void {}
  damageHook(): void {}

  static readonly gemName = '愤怒宝石'

  static readonly price = 30000

  static readonly maxLevel = 2000

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseDamageAdditionPerEnemy = 0.02

  static readonly damageAdditionPerEnemyLevelMx = 0.012

  static get stasisDescription() {
    return `攻击范围内的每个敌人都将使你的攻击力提高 ${Tools.roundWithFixed(this.baseDamageAdditionPerEnemy * 100, 2)}%（+${Tools.roundWithFixed(
      this.damageAdditionPerEnemyLevelMx * 100,
      2
    )}%/等级）`
  }

  static get __base_description() {
    return '攻击范围内的每个敌人都将使你的攻击力提高 $%'
  }

  get description() {
    return GemOfAnger.__base_description.replace('$', (this.damageAdditionPerEnemy * 100).toFixed(2))
  }

  get levelUpPoint() {
    return (this.level + 1) * 205
  }

  get damageAdditionPerEnemy() {
    return GemOfAnger.baseDamageAdditionPerEnemy + this.level * GemOfAnger.damageAdditionPerEnemyLevelMx
  }

  /**
   * @todo 如果这个钩子函数负担过重可以减少调用频率
   */
  tickHook(thisTower: TowerBase, monsters: MonsterBase[]) {
    const inRangeCount = monsters.filter(mst => thisTower.inRange(mst)).length
    // console.log('inRangeCount', inRangeCount)
    thisTower.__anger_gem_atk_ratio = this.damageAdditionPerEnemy * inRangeCount + 1
  }
}

class BrokenPieces extends GemBase {
  initEffect(): void {}
  attackHook(): void {}
  killHook(): void {}
  tickHook(): void {}
  damageHook(): void {}

  static readonly gemName = '破碎'

  static readonly price = 620000

  static readonly maxLevel = 1000

  static readonly imgSrc =
    'data:image/png;base64,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'

  static readonly baseArmorDecreaseStrength = 0.001

  static readonly armorDecreaseStrengthLevelMx = 0.0001

  static readonly baseExtraArmorBasedDamageRatio = 80

  static readonly extraArmorBasedDamageRatioLevelMx = 8

  static get stasisDescription() {
    return (
      `每次击中都能摧毁敌人 ${Tools.roundWithFixed(this.baseArmorDecreaseStrength * 100, 1)}%（+${Tools.roundWithFixed(
        this.armorDecreaseStrengthLevelMx * 100,
        2
      )}%/等级）的护甲，` +
      `并造成相当于敌人护甲总量的 ${Tools.roundWithFixed(this.baseExtraArmorBasedDamageRatio * 100, 0)}%（+${Tools.roundWithFixed(
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

  get description() {
    return BrokenPieces.__base_description
      .replace('$', (this.armorDecreaseStrength * 100).toFixed(2))
      .replace('$', (this.armorBasedDamageRatio * 100).toFixed(1))
  }

  get levelUpPoint() {
    return (this.level + 2) * 1250
  }

  hitHook(thisTower: TowerBase, monster: MonsterBase) {
    if (monster.inner_armor > 1) {
      monster.inner_armor *= 1 - this.armorDecreaseStrength
    } else {
      monster.inner_armor = 0
    }

    monster.health -= this.armorBasedDamageRatio * monster.inner_armor
    thisTower.recordDamage(monster)
  }
}
