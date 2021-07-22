/// <reference path="./base.ts" />

const towerCtors = [
  // {
  //   dn: 'Test_Tower',
  //   c: 'TestTower',
  //   od: 0,
  //   n: 't_test',
  //   p: [1],
  //   r: (_lvl?: number) => 1000,
  //   a: (_lvl?: number) => 1e16,
  //   h: (_lvl?: number) => 15,
  //   s: (_lvl?: number) => 1,
  //   bctor: 'TestTower.TestBullet'
  // },
  {
    dn: '弓箭塔',
    c: 'MaskManTower',
    od: 1,
    n: 'archer0',
    n2: 'archer1',
    n3: 'archer2',
    n4: 'archer3',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 180
          else return Math.ceil(Math.pow(1.1, +p) * 10)
        }
      }
    ) as ArrayLike<number>,
    r: (lvl: number) => lvl * 0.8 + 180,
    a: (lvl: number) => lvl * 2 + 2,
    h: (_lvl?: number) => 1,
    s: (lvl: number) => Math.floor(lvl / 20) + 2,
    bctor: 'NormalArrow',
    bn: 'normal_arrow',
    bn2: 'flame_arrow'
  },
  {
    dn: '加农炮塔',
    c: 'CannonShooter',
    od: 2,
    n: 'cannon0',
    n2: 'cannon1',
    n3: 'cannon2',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 170
          else return Math.ceil(Math.pow(1.1, +p) * 15)
        }
      }
    ) as ArrayLike<number>,
    r: (lvl: number) => lvl * 0.75 + 120,
    a: (lvl: number) => lvl * 2 + 2,
    h: (lvl: number) => 0.7 + lvl * 0.004,
    s: (_lvl?: number) => 1,
    expr: (lvl: number) => Math.min(20 + lvl, 80),
    expatk: (atk: number) => atk * 4.4 + 120,
    bdatk: (atk: number) => atk * 1.1,
    bdatk2: (atk: number) => atk * 1.6,
    bdatk3: (atk: number) => atk * 2.1,
    bdatk4: (atk: number) => atk * 2.6,
    bdatk5: (atk: number) => atk * 3.1,
    bditv: (_lvl?: number) => 80,
    bddur: (_lvl?: number) => 15000,
    bctor: 'CannonBullet',
    bctor2: 'ClusterBomb',
    bctor3: 'ClusterBombEx'
  },
  {
    dn: '冰霜塔',
    c: 'FrostTower',
    od: 3,
    n: 'ice',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 70
          else return Math.ceil(Math.pow(1.1, +p) * 320)
        }
      }
    ) as ArrayLike<number>,
    r: (lvl: number) => lvl * 2.5 + 100,
    a: (_lvl?: number) => 0,
    h: (_lvl?: number) => Infinity,
    s: (_lvl?: number) => 0,
    // speed reduction
    sr: (lvl: number) => Tools.MathFx.naturalLogFx(0.1, 0.12)(lvl)
  },
  {
    dn: '毒气塔',
    c: 'PoisonTower',
    od: 4,
    n: 'poison_t',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 190
          else return Math.ceil(Math.pow(1.1, +p) * 50)
        }
      }
    ) as ArrayLike<number>,
    r: (lvl: number) => lvl * 0.8 + 100,
    a: (lvl: number) => Math.round(lvl / 20 + 2),
    h: (lvl: number) => 2.1 + lvl * 0.1,
    s: (_lvl?: number) => 1,
    patk: (lvl: number) => lvl * 4 * Math.max(lvl / 25, 1) + 90,
    pitv: (lvl: number) => Math.max(600 - lvl * 20, 50),
    pdur: (_lvl?: number) => 5000,
    bctor: 'PoisonCan'
  },
  {
    dn: '电能塔',
    c: 'TeslaTower',
    od: 5,
    n: 'tesla0',
    n2: 'tesla1',
    n3: 'tesla2',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 180
          else return Math.ceil(Math.pow(1.1, +p) * 105)
        }
      }
    ) as ArrayLike<number>,
    r: (_lvl?: number) => 70,
    a: (lvl: number) => 18 + Math.round((lvl / 2 + 3) * (lvl / 2 + 3)),
    h: (lvl: number) => 0.75 + lvl * 0.01,
    s: (_lvl?: number) => 0
  },
  {
    dn: '魔法塔',
    c: 'BlackMagicTower',
    od: 6,
    n: 'magic0',
    n2: 'magic1',
    n3: 'magic2',
    n4: 'magic3',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 150
          else return Math.ceil(Math.pow(1.1, +p) * 200)
        }
      }
    ) as ArrayLike<number>,
    r: (lvl: number) => lvl * 1 + 140,
    a: (lvl: number) => 5000 + Math.round((lvl + 4) * (lvl + 4)),
    a2: (lvl: number) => 9000 + Math.round((lvl + 8) * (lvl + 8)),
    a3: (lvl: number) => 15000 + Math.round((lvl + 16) * (lvl + 16)),
    a4: (lvl: number) => 42000 + Math.round((lvl + 32) * (lvl + 32)),
    h: (_lvl?: number) => 0.125,
    s: (_lvl?: number) => 1,
    ide: (lvl: number) => lvl * 0.004 + 0.01,
    idr: (lvl: number) => 10000 + 100 * lvl
  },
  {
    dn: '激光塔',
    c: 'LaserTower',
    od: 7,
    n: 'laser0',
    n2: 'laser1',
    n3: 'laser2',
    n4: 'laser3',
    n5: 'laser4',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 150
          else return Math.ceil(Math.pow(1.1, +p) * 500)
        }
      }
    ) as ArrayLike<number>,
    r: (lvl: number) => lvl * 0.55 + 90,
    a: (lvl: number) => Math.round(lvl * 3 + 10),
    h: (_lvl?: number) => 0.8,
    h2: (_lvl?: number) => 1,
    s: (_lvl?: number) => 1,
    s2: (lvl: number) => Math.floor(lvl / 30) + 1,
    s3: (lvl: number) => Math.floor(lvl / 28) + 3,
    lsd: (_lvl?: number) => 90, // laser swipe distance
    fatk: (lvl: number) => Math.pow(lvl, 1.05) * 10 + 160,
    fw: (lvl: number) => 40 + Math.floor(lvl / 8)
  },
  {
    dn: '航母',
    c: 'CarrierTower',
    od: 8,
    n: 'carrier0',
    n1: 'carrier1',
    n2: 'carrier2',
    cn: 'plane_1',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 200
          else return Math.ceil(Math.pow(1.1, +p) * 1000)
        }
      }
    ) as ArrayLike<number>,
    r: (_lvl?: number) => 150,
    a: (lvl: number) => 125 + lvl * 8 + lvl * lvl * 0.1,
    h: (lvl: number) => 0.8 + lvl * 0.01,
    s: (_lvl?: number) => 1,
    child: (lvl: number) => 1 + Math.floor(lvl / 20),
    spd: (_lvl?: number) => 5
  },
  {
    dn: '飞刃塔',
    c: 'EjectBlade',
    od: 9,
    n: 'knife0',
    p: new Proxy(
      {},
      {
        get(_t, p: string, _r) {
          if (p === 'length') return 280
          else return Math.ceil(Math.pow(1.1, +p) * 2000)
        }
      }
    ) as ArrayLike<number>,
    r: (lvl: number) => lvl * 0.8 + 160,
    a: (lvl: number) => lvl * 5.5 + 20,
    h: (lvl: number) => 0.5 + lvl * 0.0225,
    s: (_lvl?: number) => 1,
    bt: (lvl: number) => Math.round(lvl / 18) + 1,
    dfpb: (lvl: number) => 0.5 + lvl * 0.0075,
    bctor: 'Blade',
    bn: 'blade_gear'
  }
]

class _TowerManager {
  private static independentCtors = ['_Jet']

  static towerCtors = towerCtors

  static rankPostfixL1 = '老兵'
  static rankPostfixL2 = '身经百战'
  static rankPostfixL3 = '大师'
  static TestTower: typeof towerCtors[0]
  static CannonShooter: typeof towerCtors[0]
  static MaskManTower: typeof towerCtors[0]
  static FrostTower: typeof towerCtors[0]
  static PoisonTower: typeof towerCtors[0]
  static TeslaTower: typeof towerCtors[0]
  static BlackMagicTower: typeof towerCtors[0]
  static LaserTower: typeof towerCtors[0]
  static CarrierTower: typeof towerCtors[0]
  static EjectBlade: typeof towerCtors[0]

  public towers: TowerBase[] = []
  public independentTowers: TowerBase[] = []
  public towerChangeHash = -1

  Factory(towerName: string, position: Position, image: string | ImageBitmap | AnimationSprite, bulletImage: Optional<ImageBitmap>, radius: number, ...extraArgs: any[]) {
    const nt = new (eval(towerName))(position, image, bulletImage, radius, ...extraArgs) as TowerBase
    ;(this.constructor as typeof _TowerManager).independentCtors.includes(nt.constructor.name) ? this.independentTowers.push(nt) : this.towers.push(nt)
    return nt
  }

  run(monsters: MonsterBase[]) {
    this.towers.forEach(t => {
      if (t.gem) t.gem.tickHook(t, monsters)
      t.run(monsters)
    })
    this.independentTowers.forEach(t => {
      t.run(monsters)
    })
  }

  render(ctx: WrappedCanvasRenderingContext2D) {
    this.towers.forEach(t => t.render(ctx as CanvasRenderingContext2D))
  }

  rapidRender(ctxRapid: WrappedCanvasRenderingContext2D, monsters: MonsterBase[]) {
    this.towers.forEach(t => t.rapidRender(ctxRapid as CanvasRenderingContext2D, monsters))
    this.independentTowers.forEach(t => t.rapidRender(ctxRapid as CanvasRenderingContext2D, monsters))
  }

  makeHash() {
    const c = _.sumBy(this.towers, 'level')
    const l = this.towers.length
    return c + l + c * l
  }

  /**
   * - 塔自身很少需要重绘，所以仅在必要时重绘塔图层
   * - 此函数检测塔是否存在数量或登记的变化，并通知上层框架重绘
   */
  scanSwipe(emitCallback: typeof Game.prototype.emitMoney) {
    this.towers = this.towers.filter(t => {
      if (t.isSold) {
        emitCallback(t.sellingPrice)
        t.destroy()
      }
      return !t.isSold
    })

    this.independentTowers = this.independentTowers.filter(t => {
      if (t.isSold) {
        emitCallback(t.sellingPrice)
        t.destroy()
      }
      return !t.isSold
    })

    const currentTowerChangeHash = this.makeHash()

    const needRender = currentTowerChangeHash !== this.towerChangeHash
    // console.log('currentTowerChangeHash', currentTowerChangeHash, 'needRender', needRender)

    this.towerChangeHash = currentTowerChangeHash

    return needRender
  }

  get totalDamage() {
    return this.towers.concat(this.independentTowers).reduce((cv, pv) => cv + pv.__total_damage, 0)
  }

  get totalKill() {
    return this.towers.concat(this.independentTowers).reduce((cv, pv) => cv + pv.__kill_count, 0)
  }
}

const TowerManager = new Proxy(_TowerManager, {
  get: function (target, property, receiver) {
    if (typeof property === 'string' && /[A-Z]/.test(property[0]!)) {
      const tryFind = target.towerCtors.find(tc => tc.c === property)
      if (tryFind) {
        return tryFind
      }
    }
    return Reflect.get(target, property, receiver)
  }
})

class TestTower extends TowerBase {
  rapidRender(): void {}

  static TestBullet = class _TestBullet extends BulletBase {
    constructor(position: Position, atk: number, target: MonsterBase) {
      super(position, 3, 0, null, 'rgba(15,44,11,1)', atk, 50, target)
    }
  }

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _b_image: any, radius: number) {
    super(position, radius, 0, null, image, TowerManager.TestTower.p, TowerManager.TestTower.a, TowerManager.TestTower.h, TowerManager.TestTower.s, TowerManager.TestTower.r)
    this.canInsertGem = false
    this.bulletCtorName = TowerManager.TestTower.bctor!
    this.name = TowerManager.TestTower.dn
    this.description = 'TOWER FOR TEST DAMAGE'
  }
}

class CannonShooter extends TowerBase {
  rapidRender(): void {}

  // static informationDesc = new Map(Array.from(TowerBase.informationDesc).concat([
  //   ['爆炸半径', '炮弹发生爆炸的伤害范围，单位是像素'],
  // ]))

  private static rankUpDesc1 = '\n+ 爆炸范围和伤害得到加强'
  private static rankUpDesc2 = '\n+ 射程得到大幅加强'
  private static rankUpDesc3 = '\n+ 命中后向四周抛出小型炸弹'
  private static rankUpDesc4 = '\n+ 小型炸弹将分裂两次'

  private levelEpdRngFx = TowerManager.CannonShooter.expr!
  private levelEpdAtkFx = TowerManager.CannonShooter.expatk!
  private levelBrnAtkFx = TowerManager.CannonShooter.bdatk!
  private levelBrnItvFx = TowerManager.CannonShooter.bditv!
  private levelBrnDurFx = TowerManager.CannonShooter.bddur!
  private extraExplosionDamage = 0
  private extraExplosionRange = 0
  /**
   * 爆炸伤害倍率
   */
  private extraExplosionDamageRatio = 1
  /**
   * 爆炸范围倍率
   */
  private extraExplosionRangeRatio = 1
  private extraRange = 0
  private extraBulletV = 0
  private inner_desc_init = '发射火炮，在命中后会爆炸\n+ 附加灼烧效果'

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _b_img: any, radius: number) {
    super(
      position,
      radius,
      1,
      'rgba(156,43,12,.5)',
      image,
      TowerManager.CannonShooter.p,
      TowerManager.CannonShooter.a,
      TowerManager.CannonShooter.h,
      TowerManager.CannonShooter.s,
      TowerManager.CannonShooter.r
    )

    this.bulletCtorName = TowerManager.CannonShooter.bctor!

    this.name = TowerManager.CannonShooter.dn

    this.description = this.inner_desc_init
  }

  override levelUp(currentMoney: number) {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '榴弹塔'
          this.image = Game.callImageBitMap(TowerManager.CannonShooter.n2!)
          this.description += CannonShooter.rankUpDesc1
          this.borderStyle = 'rgba(206,43,12,.7)'
          this.extraExplosionDamage = 100
          this.extraExplosionRange = 10
          this.extraBulletV = 2
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk2!
          break
        case 10:
          this.rankUp()
          this.name = '导弹塔'
          this.image = Game.callImageBitMap(TowerManager.CannonShooter.n3!)
          this.description += CannonShooter.rankUpDesc2
          this.borderStyle = 'rgba(246,43,12,.9)'
          this.extraExplosionDamage = 150
          this.extraRange = 100
          this.extraBulletV = 14
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk3!
          break
        case 15:
          this.rankUp()
          this.name = '集束炸弹塔'
          this.description += CannonShooter.rankUpDesc3
          this.extraExplosionDamage = 200
          this.extraRange = 150
          this.extraExplosionRange = 20
          this.bulletCtorName = TowerManager.CannonShooter.bctor2!
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk4!
          break
        case 30:
          this.rankUp()
          this.name = '云爆塔'
          this.description += CannonShooter.rankUpDesc4
          this.extraExplosionDamage = 250
          this.extraRange = 200
          this.extraExplosionRange = 30
          this.bulletCtorName = TowerManager.CannonShooter.bctor3!
          this.levelBrnAtkFx = TowerManager.CannonShooter.bdatk5!
          break
        case 40:
          this.rankUp()
          Object.defineProperty(this, 'extraExplosionDamage', {
            enumerable: true,
            get() {
              return 250 + Math.floor((this.level - 40) * 30)
            }
          })
          this.name += ` ${TowerManager.rankPostfixL1}I`
          break
        case 50:
          this.rankUp()
          this.name = this.name!.replace('I', 'II')
          break
        case 60:
          this.rankUp()
          this.name = this.name!.replace('II', 'III')
          break
        case 70:
          this.rankUp()
          this.name = this.name!.replace('III', 'IV')
          this.extraExplosionDamageRatio = 1.5
          break
        case 80:
          this.rankUp()
          this.name = this.name!.replace('IV', 'V')
          this.extraExplosionDamageRatio = 1.5 * 1.5
          break
        case 90:
          this.rankUp()
          this.name = this.name!.replace(TowerManager.rankPostfixL1, TowerManager.rankPostfixL2).replace('V', 'I')
          this.extraExplosionDamageRatio = 1.5 * 1.5 * 1.5
          this.extraExplosionRangeRatio = 1.1
          break
        case 100:
          this.rankUp()
          this.name = this.name!.replace('I', 'II')
          this.extraExplosionDamageRatio = 1.5 * 1.5 * 1.5 * 1.5
          this.extraExplosionRangeRatio = 1.2
          break
      }
    }
    return ret
  }

  /**
   * 爆炸范围
   */
  get EpdRng() {
    return this.getRelativeRange((this.levelEpdRngFx(this.level) + this.extraExplosionRange) * this.extraExplosionRangeRatio)
  }

  /**
   * 爆炸伤害
   */
  get EpdAtk() {
    return (this.levelEpdAtkFx(this.Atk) + this.extraExplosionDamage) * this.extraExplosionDamageRatio
  }

  /**
   * 灼烧伤害
   */
  get BrnAtk() {
    return this.levelBrnAtkFx(this.Atk)
  }

  /**
   * 灼烧间隔 ms
   */
  get BrnItv() {
    return this.levelBrnItvFx(this.level)
  }

  /**
   * 灼烧持续 ms
   */
  get BrnDur() {
    return this.levelBrnDurFx(this.level)
  }

  override get Rng() {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get informationSeq() {
    return super.informationSeq.concat([
      ['爆炸半径', Tools.roundWithFixed(this.EpdRng, 1) + ''],
      ['爆炸伤害', Tools.chineseFormatter(this.EpdAtk, 3)],
      ['每跳灼烧伤害', Math.round(this.BrnAtk) + ''],
      ['灼烧伤害频率', Tools.roundWithFixed(this.BrnItv / 1000, 1) + ' 秒'],
      ['灼烧持续', Tools.roundWithFixed(this.BrnDur / 1000, 1) + ' 秒']
    ])
  }

  override produceBullet() {
    if (this.target) {
      this.bulletCtl.Factory(
        this.recordDamage.bind(this),
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk,
        this.target,
        this.bulletImage,
        this.EpdAtk,
        this.EpdRng,
        this.BrnAtk,
        this.BrnItv,
        this.BrnDur,
        this.extraBulletV,
        this.calculateDamageRatio.bind(this)
      )
    }
  }
}

class MaskManTower extends TowerBase {
  rapidRender(): void {}

  private static rankUpDesc1 = '\n+ 射程和攻击力得到加强'
  private static rankUpDesc2 = '\n+ 暴击能力得到大幅加强\n+ 有 $‰ 的几率直接杀死目标'
  private static rankUpDesc3 = '\n+ 命中的箭矢将有几率束缚敌人'

  private multipleTarget: Array<Optional<MonsterBase>> = []
  private extraRange = 0
  private extraHaste = 0
  private extraPower = 0
  private extraArrow = 0
  private trapChance = 0
  private trapDuration = 0
  private extraBulletV = 0
  private inner_desc_init = '每次向多个敌人射出箭矢\n+ 有几率暴击\n+ 拥有固定 30%的护甲穿透'
  private critChance = 0.1
  private critDamageRatio = 2
  private secKillChance = 0

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, b_image: ImageBitmap, radius: number) {
    super(
      position,
      radius,
      1,
      'rgba(26,143,12,.3)',
      image,
      TowerManager.MaskManTower.p,
      TowerManager.MaskManTower.a,
      TowerManager.MaskManTower.h,
      TowerManager.MaskManTower.s,
      TowerManager.MaskManTower.r
    )

    this.bulletCtorName = TowerManager.MaskManTower.bctor!
    this.bulletImage = b_image

    this.name = TowerManager.MaskManTower.dn

    this.description = this.inner_desc_init
  }

  enhanceCrit(chanceDelta = 0.05, ratioDelta = 1) {
    if (this.critChance < 0.75) this.critChance += chanceDelta
    this.critDamageRatio += ratioDelta
  }

  override levelUp(currentMoney: number) {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '弩箭塔'
          this.image = Game.callImageBitMap(TowerManager.MaskManTower.n2!)
          this.description += MaskManTower.rankUpDesc1
          this.borderStyle = 'rgba(26,143,12,.5)'
          this.extraRange = 160
          this.extraPower = 10
          this.extraBulletV = 2
          break
        case 10:
          this.rankUp()
          this.name = '火枪塔'
          this.image = Game.callImageBitMap(TowerManager.MaskManTower.n3!)
          this.secKillChance = 0.003
          this.description += MaskManTower.rankUpDesc2.replace('$', Math.round(this.secKillChance * 1000) + '')
          this.borderStyle = 'rgba(26,203,12,.7)'
          this.enhanceCrit(0.15, 6)
          this.extraPower = 20
          this.extraBulletV = 4
          break
        case 15:
          this.rankUp()
          this.name = '精灵神射手塔'
          this.description += MaskManTower.rankUpDesc3
          this.image = Game.callImageBitMap(TowerManager.MaskManTower.n4!)
          this.borderStyle = 'rgba(26,255,12,.9)'
          this.enhanceCrit(0.1)
          this.extraRange = 180
          this.trapChance = 5 // 5%
          this.trapDuration = 3000 // 3 second
          this.extraBulletV = 8
          Object.defineProperty(this, 'extraHaste', {
            enumerable: true,
            get() {
              return 0.5 + (this.level - 15) * 0.004
            }
          })
          // Object.defineProperty(this, 'extraArrow', {
          //   enumerable: true,
          //   get() {
          //     return Math.round(10 + this.level / 4)
          //   }
          // })
          this.extraArrow = 16
          break
        case 20:
          this.rankUp()
          this.name += ` ${TowerManager.rankPostfixL1}I`
          this.enhanceCrit(0.05, 2)
          break
        case 30:
          this.rankUp()
          this.name = this.name!.replace('I', 'II')
          this.enhanceCrit()
          this.trapChance = 6
          this.trapDuration = 3500
          break
        case 40:
          this.rankUp()
          this.name = this.name!.replace('II', 'III')
          this.enhanceCrit()
          this.trapChance = 7
          this.trapDuration = 4000
          break
        case 50:
          this.rankUp()
          this.name = this.name!.replace('III', 'IV')
          this.enhanceCrit()
          this.trapChance = 7.5
          this.trapDuration = 4300
          break
        case 60:
          this.rankUp()
          this.name = this.name!.replace('IV', 'V')
          this.enhanceCrit()
          this.trapChance = 8
          this.trapDuration = 4400
          break
        case 70:
          this.rankUp()
          this.name = this.name!.replace(TowerManager.rankPostfixL1, TowerManager.rankPostfixL2).replace('V', 'I')
          this.enhanceCrit(0.05, 2)
          this.trapChance = 9
          this.trapDuration = 4500
          break
        case 80:
          this.rankUp()
          this.name = this.name!.replace('I', 'II')
          this.enhanceCrit()
          this.trapChance = 10
          break
        case 90:
          this.rankUp()
          this.name = this.name!.replace('II', 'III')
          this.enhanceCrit()
          break
      }
    }

    return ret
  }

  override get DPS() {
    return super.DPS * (this.critChance * this.critDamageRatio + 1 - this.critChance)
  }

  override get informationSeq() {
    return super.informationSeq.concat([
      ['暴击率', Tools.roundWithFixed(this.critChance * 100, 1) + '%'],
      ['暴击伤害', Tools.roundWithFixed(this.critDamageRatio * 100, 0) + '%']
    ])
  }

  override get Rng() {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get HstPS() {
    return super.HstPS + this.extraHaste
  }

  override get Atk() {
    return super.Atk + this.extraPower
  }

  override get Slc() {
    return super.Slc + this.extraArrow
  }

  isThisTargetAvailable(target: Optional<MonsterBase>) {
    if (!target || target.isDead) return false
    else return this.inRange(target)
  }

  override reChooseTarget(targetList: MonsterBase[], index: number) {
    for (const t of _.shuffle(targetList)) {
      if (this.inRange(t)) {
        this.multipleTarget[index] = t
        return
      }
    }
    this.multipleTarget[index] = null
  }

  override produceBullet(idx: number) {
    if (this.multipleTarget[idx]) {
      const ratio = this.calculateDamageRatio(this.multipleTarget[idx]!)
      this.bulletCtl.Factory(
        this.recordDamage.bind(this),
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk * ratio,
        this.multipleTarget[idx]!,
        this.bulletImage,
        this.critChance,
        this.critDamageRatio,
        this.trapChance,
        this.trapDuration,
        this.extraBulletV,
        Math.random() < this.secKillChance
      )
    }
  }

  /**
   * 箭塔特有的运行方式
   * 箭塔每次向复数目标分别射出箭矢
   */
  override run(monsters: MonsterBase[]) {
    if (this.canShoot) {
      for (let x_i = 0; x_i < this.Slc; x_i++) {
        if (!this.isThisTargetAvailable(this.multipleTarget[x_i]!)) {
          this.reChooseTarget(monsters, x_i)
        }
      }
      this.shoot(monsters)
    }
  }

  override gemHitHook(idx: number, monsters: MonsterBase[]) {
    if (this.gem && this.multipleTarget[idx]) {
      this.gem.hitHook(this, this.multipleTarget[idx]!, monsters)
    }
  }
}

class FrostTower extends TowerBase {
  private static rankUpDesc1 = '\n+ 周期性造成范围冻结'
  private static rankUpDesc2 = '\n+ 每次冻结都能削减敌方 $% 护甲'
  private static rankUpDesc3 = '\n+ 冻结能力加强'

  public override canInsertGem = false
  private levelSprFx = TowerManager.FrostTower.sr!
  private inner_desc_init = '在自身周围形成一个圆形的减速场\n- 无法攻击\n- 无法镶嵌传奇宝石'
  // private trackingList: MonsterBase[] = []
  private extraEffect = (_ms: MonsterBase[]) => {}
  private lastFreezeTime = performance.now()
  private armorDecreasingStrength = 0.9
  private freezeInterval: number = Infinity
  private freezeDuration: number = 0

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _b_img: any, radius: number) {
    super(position, radius, 1, 'rgba(161,198,225,.6)', image, TowerManager.FrostTower.p, TowerManager.FrostTower.a, TowerManager.FrostTower.h, TowerManager.FrostTower.s, TowerManager.FrostTower.r)

    this.canInsertGem = false

    this.name = TowerManager.FrostTower.dn

    this.description = this.inner_desc_init

    this.armorDecreasingStrength = 0.9

    Tools.ObjectFx.addFinalReadonlyProperty(this, 'exploitsSeq', [])
  }

  get canFreeze() {
    return performance.now() - this.lastFreezeTime > this.freezeInterval
  }

  get freezeDurationTick() {
    return (this.freezeDuration / 1000) * 60
  }

  /**
   * 减速强度
   */
  get SPR() {
    return this.levelSprFx(this.level)
  }

  override get informationSeq() {
    const removing = ['攻击速度', '伤害', 'DPS', '弹药储备']
    return super.informationSeq.filter(line => !removing.some(rm => rm === line[0])).concat([['减速强度', Tools.roundWithFixed(this.SPR * 100, 2) + '%']])
  }

  override levelUp(currentMoney: number) {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '暴风雪I'
          this.description += FrostTower.rankUpDesc1
          this.freezeInterval = 10000
          this.freezeDuration = 400
          this.extraEffect = monsters => {
            if (this.canFreeze) {
              monsters.forEach(mst => {
                Game.callAnimation('icicle', new Position(mst.position.x - mst.radius, mst.position.y), mst.radius * 2, mst.radius * 2)

                mst.registerFreeze(this.freezeDurationTick)
              })
              this.lastFreezeTime = performance.now()
            }
          }
          break
        case 10:
          this.rankUp()
          this.name = '暴风雪II'
          this.description += FrostTower.rankUpDesc2.replace('$', Math.round((1 - this.armorDecreasingStrength) * 100) + '')
          this.freezeInterval = 5000
          this.freezeDuration = 600

          this.extraEffect = monsters => {
            if (this.canFreeze) {
              monsters.forEach(mst => {
                Game.callAnimation('icicle', new Position(mst.position.x - mst.radius, mst.position.y), mst.radius * 2, mst.radius * 2)

                mst.registerFreeze(this.freezeDurationTick)

                if (mst.inner_armor > 1) {
                  mst.inner_armor *= this.armorDecreasingStrength
                } else {
                  mst.inner_armor = 0
                }
              })
              this.lastFreezeTime = performance.now()
            }
          }
          break
        case 15:
          this.rankUp()
          this.name = '暴风雪III'
          this.description += FrostTower.rankUpDesc3
          this.freezeInterval = 4400
          this.freezeDuration = 800
          break
        case 20:
          this.rankUp()
          this.name = '暴风雪IV'
          this.freezeInterval = 4200
          this.freezeDuration = 860
          break
        case 25:
          this.rankUp()
          this.name = '暴风雪V'
          this.freezeInterval = 4000
          this.freezeDuration = 880
          break
        case 30:
          this.rankUp()
          this.name = '暴风雪VI'
          this.freezeInterval = 3800
          this.freezeDuration = 900
          break
        case 35:
          this.rankUp()
          this.name = '暴风雪VII'
          this.freezeInterval = 3600
          this.freezeDuration = 920
          break
      }
    }

    return ret
  }

  override run(monsters: MonsterBase[]) {
    const inRanged = monsters.filter((mst: MonsterBase) => {
      const i = this.inRange(mst)

      if (i) {
        if (mst.speedRatio === 1 || 1 - this.SPR < mst.speedRatio) mst.speedRatio = 1 - this.SPR
      } else {
        // console.log('out of forst range')
        mst.speedRatio !== 1 ? (mst.speedRatio = 1) : void 0
      }

      return i
    })

    this.extraEffect(inRanged)
  }

  override render(ctx: CanvasRenderingContext2D) {
    super.render(ctx)
    // super.renderRange(ctx, 'rgba(185,205,246,.03)')
  }

  rapidRender(context: CanvasRenderingContext2D) {
    if (this.canFreeze) return
    context.fillStyle = 'rgba(25,25,25,.3)'
    Tools.renderSector(context, this.position.x, this.position.y, this.radius, 0, Math.PI * 2 * (1 - (performance.now() - this.lastFreezeTime) / this.freezeInterval), false).fill()
  }
}

class PoisonTower extends TowerBase {
  rapidRender(): void {}

  private levelPatkFx = TowerManager.PoisonTower.patk!
  private levelPitvFx = TowerManager.PoisonTower.pitv!
  private levelPdurFx = TowerManager.PoisonTower.pdur!
  private extraBulletV = 0
  private inner_desc_init = '发射毒气弹持续杀伤，总是积极切换目标\n+ 攻击速度很快\n+ 附加中毒效果\n+ 无视防御的伤害'

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _bimg: any, radius: number) {
    super(position, radius, 1, 'rbga(45,244,12,.4)', image, TowerManager.PoisonTower.p, TowerManager.PoisonTower.a, TowerManager.PoisonTower.h, TowerManager.PoisonTower.s, TowerManager.PoisonTower.r)

    this.bulletCtorName = TowerManager.PoisonTower.bctor!

    this.name = TowerManager.PoisonTower.dn

    this.description = this.inner_desc_init
  }

  /**
   * 毒罐塔会积极地切换目标，以尽可能让所有范围内敌人中毒
   */
  override get isCurrentTargetAvailable() {
    return false
  }

  /**
   * 中毒DOT间隔时间
   */
  get Pitv() {
    return this.levelPitvFx(this.level)
  }

  /**
   * 中毒DOT持续时间
   */
  get Pdur() {
    return this.levelPdurFx(this.level)
  }

  /**
   * 中毒DOT伤害
   */
  get Patk() {
    return this.levelPatkFx(this.level) * this.__atk_ratio * this.__anger_gem_atk_ratio
  }

  get DOTPS() {
    return (1000 / this.Pitv) * this.Patk
  }

  override get informationSeq() {
    return super.informationSeq.concat([
      ['每跳毒素伤害', Math.round(this.Patk) + ''],
      ['毒素伤害频率', Tools.roundWithFixed(this.Pitv / 1000, 1) + ' 秒'],
      ['毒素持续', Math.round(this.Pdur / 1000) + ' 秒']
      // ['DOTPS', Tools.roundWithFixed(this.DOTPS, 2)]
    ])
  }

  /**
   * 毒罐塔特有的索敌方式
   */
  override reChooseTarget(targetList: MonsterBase[]) {
    const unPoisoned = targetList.filter(m => !m.bePoisoned)

    // 先在未中毒，且为被任何本类型塔弹药锁定的敌人中快速搜索
    const unTargeted = unPoisoned.filter(m => {
      return this.bulletCtl.bullets.every(b => b.constructor.name === this.bulletCtorName && b.target !== m)
    })
    for (const t of unTargeted) {
      if (this.inRange(t)) {
        this.target = t
        return
      }
    }
    // 在未中毒的敌人中搜索
    for (const t of unPoisoned) {
      if (this.inRange(t)) {
        this.target = t
        return
      }
    }
    // 如果未找到在射程内的未中毒的敌人
    // 则回退到全部敌人中随机寻找一个在射程内的敌人
    for (const t of _.shuffle(targetList)) {
      if (this.inRange(t)) {
        this.target = t
        return
      }
    }

    this.target = null
  }

  override produceBullet() {
    if (this.target) {
      const ratio = this.calculateDamageRatio(this.target)
      this.bulletCtl.Factory(
        this.recordDamage.bind(this),
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk * ratio,
        this.target,
        this.bulletImage,
        this.Patk * ratio,
        this.Pitv,
        this.Pdur,
        this.extraBulletV
      )
    }
  }
}

class TeslaTower extends TowerBase {
  /**
   * 闪电绘制函数
   */
  private static renderLighteningCop(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, displace: number) {
    if (displace < TeslaTower.curveDetail) {
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
    } else {
      const mid_x = (x2 + x1) / 2 + (Math.random() - 0.5) * displace
      const mid_y = (y2 + y1) / 2 + (Math.random() - 0.5) * displace
      this.renderLighteningCop(ctx, x1, y1, mid_x, mid_y, displace / 2)
      this.renderLighteningCop(ctx, x2, y2, mid_x, mid_y, displace / 2)

      if (Math.random() > 0.5) {
        const pos = new Position(x2, y2).dithering(displace / 3)
        this.renderLighteningCop(ctx, mid_x, mid_y, pos.x, pos.y, displace / 2)
      }
    }
  }

  /**
   * 闪电绘制帧数
   */
  static get shockRenderFrames() {
    return 2
  }

  /**
   * 闪电绘制的最小分折长度
   */
  static get curveDetail() {
    return 10
  }

  static rankUpDesc1 = '\n+ 攻击频率得到加强'
  static rankUpDesc2 = '\n+ 射程得到加强'

  private renderPermit = 0
  private extraRange = 0
  private extraHaste = 0
  // private extraEffect = (_mst: MonsterBase) => {}
  /** 带电效果的持续时间 */
  private shockDuration = 5000
  /** 塔每次攻击使目标带电的几率 */
  private shockChargingChance = 0.2
  /** 漏电伤害对塔攻击的比值 */
  private shockChargingPowerRatio = 0.25
  /** 每个tick带电的怪物向周围漏电得几率 */
  private shockLeakingChance = 0.02
  /**
   * - 带电的怪物向周围漏电的动画队列
   * - 由放电的怪物主动注册
   */
  public monsterShockingRenderingQueue: { time: number; args: [number, number, number, number, number] }[] = []
  private inner_desc_init = '向周围小范围释放电击造成中等伤害\n+ 有几率使目标带电'

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _b_img: any, radius: number) {
    super(position, radius, 1, 'rgba(252,251,34,.4)', image, TowerManager.TeslaTower.p, TowerManager.TeslaTower.a, TowerManager.TeslaTower.h, TowerManager.TeslaTower.s, TowerManager.TeslaTower.r)

    this.name = TowerManager.TeslaTower.dn

    this.description = this.inner_desc_init
  }

  get canCharge() {
    return Math.random() > 1 - this.shockChargingChance
  }

  get shockDurationTick() {
    return (this.shockDuration / 1000) * 60
  }

  override get Rng() {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get HstPS() {
    return super.HstPS + this.extraHaste
  }

  override get informationSeq() {
    const removing = ['弹药储备']
    return super.informationSeq.filter(line => !removing.some(rm => rm === line[0]))
  }

  get lighteningAmount() {
    return [null, 10, 20][this.rank]
  }

  override levelUp(currentMoney: number) {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 12:
          this.rankUp()
          this.name = '特斯拉塔'
          this.image = Game.callImageBitMap(TowerManager.TeslaTower.n2!)
          this.description += TeslaTower.rankUpDesc1
          this.borderStyle = 'rgba(222,201,34,.6)'
          this.extraHaste = 0.75
          this.shockChargingChance = 0.3
          this.shockDuration = 8000
          this.shockChargingPowerRatio = 0.75
          this.shockLeakingChance = 0.05
          break
        case 24:
          this.rankUp()
          this.name = '闪电风暴塔'
          this.image = Game.callImageBitMap(TowerManager.TeslaTower.n3!)
          this.description += TeslaTower.rankUpDesc2
          this.borderStyle = 'rgba(162,161,34,.8)'
          this.extraRange = 80
          // this.extraEffect = mst => mst.position.moveTo(this.position, mst.speedValue * .25 * 60 / this.HstPS)
          this.shockChargingChance = 0.4
          this.shockDuration = 12000
          this.shockChargingPowerRatio = 1.5
          this.shockLeakingChance = 0.12
          break
      }
    }
    return ret
  }

  /**
   * 电击
   */
  shock(monster: MonsterBase) {
    const ratio = this.calculateDamageRatio(monster)

    monster.health -= this.Atk * (1 - monster.armorResistance) * ratio

    this.recordDamage(monster)

    if (this.canCharge) {
      monster.registerShock(this.shockDurationTick, this.Atk * ratio * this.shockChargingPowerRatio, this, this.shockLeakingChance)
    }
    // this.extraEffect(monster)
  }

  override run(monsters: MonsterBase[]) {
    if (this.canShoot) {
      // 电击塔不调用父类shoot，故主动挂载gem钩子
      this.gemAttackHook(monsters)

      this.renderPermit = TeslaTower.shockRenderFrames

      monsters.forEach(mst => {
        if (this.inRange(mst)) {
          this.shock(mst)

          // 电击塔不调用父类shoot，故主动挂载gem钩子
          if (this.gem) {
            this.gem.hitHook(this as TowerBase, mst, monsters)
          }
        }
      })

      this.recordShootTime()
    }
  }

  /**
   * - circle-formula: (x - a)^2 + (y - b)^2 = r^2
   * - y = (r^2 - (x - a)^2)^0.5 + b || b - (r^2 - (x - a)^2)^0.5
   */
  calculateRandomCirclePoint() {
    const x = _.random(this.position.x - this.Rng, this.position.x + this.Rng, true)
    return {
      x,
      y:
        Math.random() > 0.5
          ? this.position.y - Math.pow(this.Rng * this.Rng - Math.pow(x - this.position.x, 2), 0.5)
          : Math.pow(this.Rng * this.Rng - Math.pow(x - this.position.x, 2), 0.5) + this.position.y
    }
  }

  renderLightening(ctx: CanvasRenderingContext2D) {
    const { x, y } = this.calculateRandomCirclePoint()
    TeslaTower.renderLighteningCop(ctx, this.position.x, this.position.y, x, y, this.Rng / 2)
  }

  rapidRender(ctx: CanvasRenderingContext2D, monsters: MonsterBase[]) {
    if (monsters.every(m => !this.inRange(m))) {
      return
    }
    if (this.renderPermit > 0) {
      this.renderPermit--

      ctx.strokeStyle = 'rgba(232,33,214,.5)'
      const t = ctx.lineWidth
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        this.renderLightening(ctx)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.lineWidth = t
    }

    ctx.strokeStyle = 'rgba(153,204,255,.5)'
    ctx.beginPath()
    this.monsterShockingRenderingQueue = this.monsterShockingRenderingQueue.filter(monsterShockingRendering => {
      TeslaTower.renderLighteningCop(ctx, ...monsterShockingRendering.args)
      return --monsterShockingRendering.time > 0
    })
    ctx.closePath()
    ctx.stroke()
  }
}

class BlackMagicTower extends TowerBase {
  private static rankUpDesc1 = '\n+ 伤害得到加强'
  private static rankUpDesc2 = '\n+ 伤害得到大幅加强'
  private static rankUpDesc3 = '\n+ 伤害得到大幅加强，每次攻击附加目标当前生命值 4% 的额外伤害'

  static override deniedGems = ['GogokOfSwiftness']

  private levelIdeFx = TowerManager.BlackMagicTower.ide!
  private levelIdrFx = TowerManager.BlackMagicTower.idr!
  private imprecationPower = 0
  private imprecationHaste = 1
  private extraPower = 0
  // private voidSummonChance = 3
  /**
   * 相当于目标当前生命值的额外伤害比例
   */
  private POTCHD = 0
  private inner_desc_init = '释放强力魔法\n- 准备时间非常长\n+ 附加诅咒，使目标受到的伤害提高\n+ 每次击杀增加 10 攻击力并提高 5% 攻击速度（最多提高 1600%）'

  // static GemsToOptionsInnerHtml = TowerBase.Gems
  //   .map((gemCtor, idx) => {
  //     return `<option value="${gemCtor.name}"${idx === 0 ? ' selected' : ''}${this.deniedGems.includes(gemCtor.name) ? ' disabled' : ''}>${gemCtor.ctor.gemName}${this.deniedGems.includes(gemCtor.name) ? ' - 不能装备到此塔' : ''}</option>`
  //   })
  //   .join('')

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _b_img: any, radius: number) {
    super(
      position,
      radius,
      1,
      'rgba(223,14,245,.2)',
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

  override get HstPS() {
    return super.HstPS * this.imprecationHaste
  }

  override get Atk() {
    return super.Atk + this.imprecationPower + this.extraPower
  }

  /**
   * 诅咒的易伤效果
   */
  get Ide() {
    return this.levelIdeFx(this.level) + 1
  }

  /**
   * 诅咒持续时间
   */
  get Idr() {
    return this.levelIdrFx(this.level)
  }

  override get informationSeq() {
    return super.informationSeq.concat([
      ['诅咒易伤', Tools.roundWithFixed(this.Ide * 100 - 100, 2) + '%'],
      ['诅咒时间', Tools.roundWithFixed(this.Idr / 1000, 2) + ' 秒'],
      ['额外攻击力', Tools.chineseFormatter(this.imprecationPower, 0)],
      ['额外攻击速度', Tools.roundWithFixed(this.imprecationHaste * 100 - 100, 1) + '%']
    ])
  }

  override levelUp(currentMoney: number) {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 5:
          this.rankUp()
          this.name = '奥术魔法塔'
          this.image = Game.callImageBitMap(TowerManager.BlackMagicTower.n2!)
          this.description = this.inner_desc_init + BlackMagicTower.rankUpDesc1
          this.borderStyle = 'rgba(223,14,245,.4)'
          this.extraPower = 666
          this.levelAtkFx = TowerManager.BlackMagicTower.a2!
          break
        case 10:
          this.rankUp()
          this.name = '黑魔法塔'
          this.image = Game.callImageBitMap(TowerManager.BlackMagicTower.n3!)
          this.description = this.inner_desc_init + BlackMagicTower.rankUpDesc2
          this.borderStyle = 'rgba(223,14,245,.6)'
          this.extraPower = 2664
          this.levelAtkFx = TowerManager.BlackMagicTower.a3!
          break
        case 15:
          this.rankUp()
          this.name = '虚空塔'
          this.image = Game.callImageBitMap(TowerManager.BlackMagicTower.n4!)
          this.description = this.inner_desc_init + BlackMagicTower.rankUpDesc3
          this.borderStyle = 'rgba(223,14,245,.8)'
          this.extraPower = 10654
          this.levelAtkFx = TowerManager.BlackMagicTower.a4!
          this.POTCHD = 0.04
          break
      }
    }
    return ret
  }

  override reChooseTarget(targetList: MonsterBase[]) {
    this.target = _.maxBy(
      targetList.filter(t => this.inRange(t)),
      '__inner_current_health'
    )
  }

  override produceBullet() {
    if (this.target) {
      const w = Game.callGridSideSize() * 2
      const h = Game.callGridSideSize() * 1.25
      const position = new Position(this.target.position.x - w / 2, this.target.position.y - h / 2)

      Game.callAnimation('magic_2', position, w, h, 1, 2)

      console.log(`基础伤害 ${this.Atk} 倍率${this.calculateDamageRatio(this.target)} 额外伤害${this.target.health * this.POTCHD}`)
      this.target.health -= this.Atk * this.calculateDamageRatio(this.target) + this.target.health * this.POTCHD
      console.log(`实际伤害 ${this.target.lastAbsDmg}`)
      this.recordDamage(this.target)

      // 杀死了目标
      if (this.target.isDead) {
        this.imprecationPower += 10
        if (this.imprecationHaste * 100 - 100 < 1600) this.imprecationHaste += 0.05
      }

      if (__debug_black_magic_tower_always_enhance) {
        this.imprecationPower += 10
        this.imprecationHaste += 0.05
      }

      // 诅咒目标
      this.target.registerImprecate((this.Idr / 1000) * 60, this.Ide)
    }
  }

  rapidRender(ctx: CanvasRenderingContext2D) {
    if (this.HstPS < 45) this.renderPreparationBar(ctx)
  }
}

/**
 * 内部类 激光射线枪
 * 剥离出具体激光的渲染逻辑，外层无需关心
 */
class _ColossusLaser {
  private static animationW = 36
  private static animationH = 36
  private static animationName = 'explo_3'
  private static animationSpeed = 0.5

  private sx: number
  private sy: number
  private ep: Position
  private swipeVector: PolarVector
  private lineWidth: number
  private lineStylesOuter: string
  private lineStylesInner: string
  private perUpdateDistance: number
  private currentStep = 0
  private animationStepInterval: number
  private stepPosition = 0
  private easingFx: (x: number) => number
  public fulfilled = false

  constructor(startPos: Position, endPos: Position, lineWidth: number, duration: number, swipeVector: PolarVector, easingFunc: (x: number) => number, ls1: string, ls2: string) {
    this.sx = startPos.x
    this.sy = startPos.y

    this.ep = endPos.copy()

    this.swipeVector = swipeVector

    this.lineWidth = lineWidth

    this.lineStylesOuter = ls1
    this.lineStylesInner = ls2

    const updateTime = 1000 / 60
    const updateCount = duration / updateTime

    /**
     * 步长
     */
    this.perUpdateDistance = 1 / updateCount

    const maxAnimationCount = Math.floor(this.swipeVector.r / (Math.max(_ColossusLaser.animationW, _ColossusLaser.animationH) + 1))
    this.animationStepInterval = maxAnimationCount >= updateCount ? 1 : Math.ceil(updateTime / maxAnimationCount)

    this.easingFx = easingFunc || Tools.EaseFx.linear
  }

  get step() {
    if (this.stepPosition > 1) {
      this.fulfilled = true
    }
    this.stepPosition += this.perUpdateDistance
    this.currentStep++
    const step = this.swipeVector.r * this.easingFx(this.stepPosition)
    return this.ep.copy().move(this.swipeVector.normalize().multiply(step))
  }

  get canAnimate() {
    return this.currentStep % this.animationStepInterval === 0
  }

  renderStep(ctx: CanvasRenderingContext2D) {
    if (this.fulfilled) return

    const stepEndPos = this.step

    if (this.canAnimate) {
      Game.callAnimation(_ColossusLaser.animationName, stepEndPos, _ColossusLaser.animationW, _ColossusLaser.animationH, _ColossusLaser.animationSpeed, 400)
    }

    const pt = new Path2D()
    pt.moveTo(this.sx, this.sy)
    pt.lineTo(stepEndPos.x, stepEndPos.y)
    pt.closePath()
    const t = ctx.lineWidth

    // ctx.strokeStyle = 'rgba(44,88,234,.2)'
    // ctx.lineWidth = this.lineWidth + 2
    // ctx.stroke(pt)

    ctx.strokeStyle = this.lineStylesOuter
    ctx.lineWidth = this.lineWidth + 2
    ctx.stroke(pt)

    ctx.strokeStyle = this.lineStylesInner
    ctx.lineWidth = this.lineWidth - 2
    ctx.stroke(pt)

    ctx.lineWidth = t
  }
}

class LaserTower extends TowerBase {
  private static Laser = _ColossusLaser

  static rankUpDesc1 = '\n+ 伤害得到加强'
  static rankUpDesc2 = '\n+ 造成额外电浆伤害(无视防御)'
  static rankUpDesc3 = '\n+ 发射多束射线'
  static rankUpDesc4 = '\n+ 所有属性得到增强'

  private lasers: _ColossusLaser[] = []
  private levelFlameAtkFx = TowerManager.LaserTower.fatk!
  private levelFlameWidthFx = TowerManager.LaserTower.fw!
  private levelLaserSwipeDistanceFx = TowerManager.LaserTower.lsd!
  private extraFlameDamage = 0
  private extraLuminousDamage = 0
  private extraLaserTransmitter = 0
  private extraFlameWidth = 0
  private extraRange = 0
  private lineStyles = [
    ['rgba(244,188,174,.4)', 'rgba(204,21,12,.7)'], // laser
    ['rgba(244,188,174,.4)', 'rgba(254,21,12,.7)'], // he laser
    ['rgba(204,204,255,.4)', 'rgba(0,51,253,.7)'], // heat inf
    ['rgba(204,204,255,.4)', 'rgba(0,51,253,.7)'], // multi heat inf
    ['rgba(255,153,0,.4)', 'rgba(153,0,51,.7)'] // colossus
  ]
  private inner_desc_init = '发射激光，横扫大面积的目标，造成范围的火焰伤害'

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _bimg: any, radius: number) {
    super(position, radius, 1, 'rgba(17,54,245,.2)', image, TowerManager.LaserTower.p, TowerManager.LaserTower.a, TowerManager.LaserTower.h, TowerManager.LaserTower.s, TowerManager.LaserTower.r)

    this.name = TowerManager.LaserTower.dn

    this.description = this.inner_desc_init
  }

  override get Rng() {
    return super.Rng + this.getRelativeRange(this.extraRange)
  }

  override get Slc() {
    return super.Slc + this.extraLaserTransmitter
  }

  /**
   * Laser Swipe Distance
   */
  get LSD() {
    return this.getRelativeRange(this.levelLaserSwipeDistanceFx(this.level))
  }

  /**
   * Flame Attack Power
   */
  get FAtk() {
    return this.levelFlameAtkFx(this.level) + this.extraFlameDamage
  }

  /**
   * Flame Width
   */
  get FWd() {
    return this.getRelativeRange(this.levelFlameWidthFx(this.level) + this.extraFlameWidth)
  }

  /**
   * 激光渲染宽度
   */
  get LRW() {
    return Math.ceil(this.getRelativeRange(3 + Math.floor(this.rank / 2)))
  }

  override get informationSeq() {
    return super.informationSeq.concat([
      ['火焰伤害', Math.round(this.FAtk) + ''],
      ['扫射距离', Tools.roundWithFixed(this.LSD, 1) + ''],
      ['扫射宽度', Tools.roundWithFixed(this.FWd, 1) + ''],
      ['额外火焰伤害', Math.round(this.extraFlameDamage) + ''],
      ['额外电浆伤害', Math.round(this.extraLuminousDamage) + '']
    ])
  }

  get laserLineStyle() {
    return this.lineStyles[this.rank]!
  }

  override levelUp(currentMoney: number) {
    const ret = super.levelUp(currentMoney)

    if (ret !== 0) {
      switch (this.level) {
        case 8:
          this.rankUp()
          this.name = '高能激光塔'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n2!)
          this.description += LaserTower.rankUpDesc1
          this.borderStyle = 'rgba(17,54,245,.3)'
          this.extraFlameDamage = 220
          break
        case 16:
          this.rankUp()
          this.name = '热能射线塔'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n3!)
          this.description += LaserTower.rankUpDesc2
          this.borderStyle = 'rgba(17,54,245,.4)'
          this.extraLuminousDamage = 140
          break
        case 32:
          this.rankUp()
          this.name = '多重热能射线塔'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n4!)
          this.description += LaserTower.rankUpDesc3
          this.borderStyle = 'rgba(17,54,245,.5)'
          this.levelSlcFx = TowerManager.LaserTower.s2!
          this.extraFlameDamage = 420
          this.extraLuminousDamage = 220
          break
        case 64:
          this.rankUp()
          this.name = '巨像'
          this.image = Game.callImageBitMap(TowerManager.LaserTower.n5!)
          this.description += LaserTower.rankUpDesc4
          this.borderStyle = 'rgba(17,54,245,.8)'
          this.extraFlameDamage = 640
          this.extraLuminousDamage = 380
          this.levelSlcFx = TowerManager.LaserTower.s3!
          this.levelHstFx = TowerManager.LaserTower.h2!
          this.extraRange = 50
          this.extraFlameWidth = 40
          break
      }
    }

    return ret
  }

  /**
   * 发射激光，击中第一个敌人，扫动一定距离，造成燃烧伤害
   */
  override produceBullet(_i: number, monsters: MonsterBase[]) {
    //console.time('LaserTower make damage')

    if (this.target) {
      const v = new Position(this.target.position.x, this.target.position.y)
      const r = this.FWd / 2 + Game.callGridSideSize() / 3 - 2
      const mvrc = 0.7
      const arcTime = Math.ceil((this.LSD / r - 2) / mvrc + 1) + 1

      // 采样击中点的各个方向，并取每个方向延伸的模糊点，比较何处敌人最密集
      const swipeVector = _.maxBy(
        _.range(0, 360, 30).map(d => new PolarVector(this.LSD, d)),
        sv =>
          monsters.filter(mst =>
            v
              .copy()
              .move(sv.normalize().multiply(mvrc * (arcTime - 1) * r))
              .equal(mst.position, 1.2 * r)
          ).length
      )!.dithering((1 / 30) * Math.PI)

      this.lasers.push(new LaserTower.Laser(this.position, this.target.position, this.LRW, 500, swipeVector, Tools.EaseFx.linear, this.laserLineStyle[0]!, this.laserLineStyle[1]!))

      const flameArea = new Path2D()

      for (let i = 0; i < arcTime; i++) {
        const t = v.copy().move(swipeVector.normalize().multiply(mvrc * i * r))
        // console.log(v + ', ' + t)
        flameArea.arc(t.x, t.y, r, 0, Math.PI * 2)
      }

      // Game.callCanvasContext('bg').strokeStyle = 'rgba(33,33,33,.3)'
      // Game.callCanvasContext('bg').stroke(flameArea)

      this.target.health -= this.Atk * (1 - this.target.armorResistance) * this.calculateDamageRatio(this.target)
      this.recordDamage(this.target)

      monsters.forEach(mst => {
        if ((Game.callCanvasContext('bg') as WrappedCanvasRenderingContext2D).isPointInPath(flameArea, mst.position.x, mst.position.y) && this.target) {
          mst.health -= this.extraLuminousDamage * this.calculateDamageRatio(mst)
          this.recordDamage(this.target)
          mst.health -= this.FAtk * (1 - mst.armorResistance) * this.calculateDamageRatio(mst)
          this.recordDamage(this.target)
        }
      })
    }

    //console.timeEnd('LaserTower make damage')
  }

  rapidRender(ctx: CanvasRenderingContext2D) {
    this.lasers = this.lasers.filter(ls => {
      ls.renderStep(ctx)
      return !ls.fulfilled
    })
  }
}

class _Jet extends TowerBase {
  // static JetActMode2 = enum _JetActMode2 {

  // }

  static JetActMode = {
    /**
     * 自主模式
     */
    autonomous: 1,
    /**
     * F1模式（玩家控制）
     */
    f1: 2,
    switch(oldMode: number) {
      return oldMode === this.autonomous ? this.f1 : this.autonomous
    }
  }

  static JetWeapons = {
    getCtorName(mode: number) {
      return mode === 1 ? 'CarrierTower.Jet.JetWeapons.MachineGun' : 'CarrierTower.Jet.JetWeapons.AutoCannons'
    },
    /**
     * 15mm 高速机抢
     */
    MachineGun: class _MachineGun extends BulletBase {
      constructor(position: Position, atk: number, target: MonsterBase) {
        const bVelocity = 22
        super(position, 1, 0, null, 'rgb(55,14,11)', atk, bVelocity, target)
      }
      override hit(monster: MonsterBase, magnification = 1) {
        monster.health -= this.Atk * magnification * (1 - monster.armorResistance * 0.65)
        this.emitter(monster)
      }
    },
    /**
     * 30mm 机炮
     */
    AutoCannons: class _AutoCannons extends CannonBullet {
      constructor(position: Position, atk: number, target: MonsterBase) {
        const explodeRange = 20
        const burnDotDamage = atk * 16 /*.16*/
        const extraRatioCalc = (m: MonsterBase) => 1 + m.armorResistance
        super(position, atk, target, null, atk * 2, explodeRange, burnDotDamage, 150, 3000, -1, extraRatioCalc)
        // super(position, 2, 1, '#CC3333', '#99CC99', atk * 2, bVelocity, target)
      }
      // hit(monster: MonsterBase, magnification = 1) {
      //   monster.health -= this.Atk * magnification * (1 - monster.armorResistance * .455) + monster.inner_armor * 5.5
      //   this.emitter(monster)
      // }
    }
  }

  public actMode = _Jet.JetActMode.autonomous
  /**
   * 武器模式
   * 1. 速射机枪
   * 2. 30mm 机炮
   */
  public weaponMode = 1
  /**
   * - 前进目的地
   * - 仅在F1模式有效
   */
  public destinationPosition: Position
  private inner_desc_init = '航母的载机\n+ 机动性极强\n+ 拥有 15mm 速射机枪和 30mm 反装甲机炮两种武器'
  public carrierTower: CarrierTower

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _b_img: any, radius: number, carrierTower: CarrierTower) {
    super(position, radius, 0, null, image, [], carrierTower.levelAtkFx, carrierTower.levelHstFx, carrierTower.levelSlcFx, carrierTower.levelRngFx)

    this.controlable = true

    this.name = '航母载机'

    this.carrierTower = carrierTower

    // this.recordKill = carrierTower.exposedRecordKillFx

    // this.recordDamage = carrierTower.exposedRecordDamageFx

    this.canInsertGem = false

    this.destinationPosition = Position.O

    this.description = this.inner_desc_init

    Tools.ObjectFx.addFinalGetterProperty(this, 'bulletCtorName', () => CarrierTower.Jet.JetWeapons.getCtorName(this.weaponMode))

    Tools.ObjectFx.addFinalGetterProperty(this, 'level', () => this.carrierTower.level)

    this.calculateDamageRatio = mst => this.carrierTower.calculateDamageRatio(mst)
  }

  /**
   * - 攻击补正
   * - 对基础攻击的 Δ 补正
   */
  get attackSupplement() {
    return this.weaponMode === 1 ? this.carrierTower.Atk * -0.55 : Math.pow(this.level + 2, 2.225 /*1.762*/) * 6
  }

  /**
   * - 攻速系数
   * - 对基础每秒攻击次数的 γ 系数
   */
  get hasteSupplementRate() {
    return this.weaponMode === 1 ? 1 + this.level * 0.028 : 1
  }

  override get Atk() {
    return this.carrierTower.Atk + this.attackSupplement
  }

  override get Slc() {
    return this.carrierTower.Slc + (this.weaponMode === 1 ? 1 : 0)
  }

  override get Rng() {
    return this.carrierTower.Rng
  }

  override get HstPS() {
    return this.carrierTower.HstPS * this.hasteSupplementRate
  }

  get Spd() {
    return this.carrierTower.Spd
  }

  override get exploitsSeq(): string[][] {
    return []
  }

  override get informationSeq() {
    const removing = ['等级', '下一级', '售价']
    return super.informationSeq.filter(line => !removing.some(rm => rm === line[0]))
  }

  get hasCurrentTarget() {
    return this.target && !this.target.isDead
  }

  override get sellingPrice() {
    return 0
  }

  override gemHitHook(_idx: number, monsters: MonsterBase[]) {
    if (this.carrierTower.gem && this.target) {
      this.carrierTower.gem.hitHook(this.carrierTower, this.target, monsters)
    }
  }

  override gemAttackHook(monsters: MonsterBase[]) {
    if (this.carrierTower.gem) {
      this.carrierTower.gem.attackHook(this.carrierTower, monsters)
    }
  }

  override get __total_damage() {
    return 0
  }

  override set __total_damage(v) {
    this.carrierTower ? (this.carrierTower.__total_damage += v) : void 0
  }

  override get __kill_count() {
    return 0
  }

  override set __kill_count(v) {
    this.carrierTower ? (this.carrierTower.__kill_count += v) : void 0
  }

  /**
   * - 在怪物中重选目标
   * - 在怪物中找到威胁最大的(距离终点最近的)
   */
  reChooseMostThreateningTarget(targetList: MonsterBase[]) {
    this.target = _.minBy(targetList, mst => {
      return Position.distancePow2(Game.callDestinationPosition(), mst.position)
    })
  }

  autonomouslyRun(monsters: MonsterBase[]) {
    // 当前目标失效
    if (!this.hasCurrentTarget) {
      this.reChooseMostThreateningTarget(monsters)
    }

    if (this.hasCurrentTarget && this.target) {
      // 当前目标在范围内
      if (this.inRange(this.target)) {
        if (this.canShoot) {
          this.shoot(monsters)
        }
      }
      // 当前目标超出范围
      else {
        this.position.moveTo(this.target.position, this.Spd)
      }
    }
  }

  override run(monsters: MonsterBase[]) {
    switch (this.actMode) {
      case _Jet.JetActMode.autonomous:
        this.autonomouslyRun(monsters)
        break

      case _Jet.JetActMode.f1:
        super.run(monsters)

        if (Position.distance(this.position, this.destinationPosition) > this.radius * 2) {
          this.position.moveTo(this.destinationPosition, this.Spd)
          // const independentTowerList = Game.callIndependentTowerList()
          // if (independentTowerList.indexOf(this) === 0) {
          //   this.position.moveTo(this.destinationPosition, this.Spd)
          // }
          // else {
          //   const futurePos = this.position.copy().moveTo(this.destinationPosition, this.Spd)
          //   const others = independentTowerList.filter(jet => jet !== this)
          //   const leaders = independentTowerList.slice(0, independentTowerList.indexOf(this) - 1)
          //   if (leaders.every(jet => Position.distancePow2(jet.position, futurePos) < 4 * this.radius * this.radius)) {
          //     this.position.x = futurePos.x
          //     this.position.y = futurePos.y
          //   }
          // }
        }
        break
    }
  }

  override render() {}

  override renderLevel() {}

  override renderImage(ctx: CanvasRenderingContext2D) {
    if (this.target) {
      BulletBase.prototype.renderImage.call(this, ctx)
    } else {
      super.renderImage(ctx)
    }
  }

  rapidRender(ctxRapid: CanvasRenderingContext2D) {
    super.render(ctxRapid)
  }
}

class CarrierTower extends TowerBase {
  rapidRender(): void {}

  static __inner_f1_mode = false
  static __inner_wp_mode = 1

  static set F1Mode(v) {
    Game.callChangeF1Mode(v)
    this.__inner_f1_mode = v
  }

  static get F1Mode() {
    return this.__inner_f1_mode
  }

  static set WeaponMode(v) {
    Game.callChangeCarrierWeaponMode(v)
    this.__inner_wp_mode = v
  }

  static get WeaponMode() {
    return this.__inner_wp_mode
  }

  static override deniedGems = ['ZeisStoneOfVengeance', 'GemOfAnger']

  public static Jet = _Jet
  private jetCountMap: Map<number, (TowerBase & { carrierTower: CarrierTower })[]> = new Map()
  public jetCount = 0
  private levelSpdFx = TowerManager.CarrierTower.spd!
  private levelKcFx = TowerManager.CarrierTower.child!
  private inner_desc_init = '自身无法攻击，释放搭载的载机进行战斗\n使用 [F1] 切换载机的自主/受控模式\n使用 [Q] 切换载机的武器\n+ 载机继承自身属性\n+ 可以对任意位置进行机动打击'

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, _b_img: any, radius: number) {
    super(
      position,
      radius,
      1,
      'rgba(56,243,12,.5)',
      image,
      TowerManager.CarrierTower.p,
      TowerManager.CarrierTower.a,
      TowerManager.CarrierTower.h,
      TowerManager.CarrierTower.s,
      TowerManager.CarrierTower.r
    )

    this.name = TowerManager.CarrierTower.dn

    this.description = this.inner_desc_init
  }

  override get informationSeq() {
    return super.informationSeq.concat([['载机量', this.KidCount + '']])
  }

  private get KidCount() {
    return this.levelKcFx(this.level)
  }

  get Spd() {
    return this.levelSpdFx(this.level)
  }

  private get shipBoardAircraft() {
    if (this.jetCountMap.has(this.jetCount)) {
      return this.jetCountMap.get(this.jetCount)!
    } else {
      this.jetCountMap.clear()

      const newJets = Game.callIndependentTowerList().filter(tow => tow.carrierTower && tow.carrierTower === this)
      this.jetCountMap.set(this.jetCount, newJets)

      return newJets
    }
  }

  // inlayGem(gem: string) {
  //   super.inlayGem(gem)

  //   this.shipBoardAircraft.forEach(airC => airC.gem = this.gem)
  // }

  override run() {
    if (this.canShoot && this.jetCount < this.KidCount) {
      /*const jet = */ Game.callTowerFactory()(
        'CarrierTower.Jet',
        this.position.copy().dithering(this.radius * 2, this.radius),
        Game.callImageBitMap(TowerManager.CarrierTower.cn!)!,
        null,
        Game.callGridSideSize() / 4,
        this
      )

      // jet.gem = this.gem

      this.jetCount++
    }
  }

  override renderRange() {}

  override destroy() {
    super.destroy()

    this.shipBoardAircraft.forEach(tow => (tow.isSold = true))
  }
}

class EjectBlade extends TowerBase {
  rapidRender(): void {}

  private inner_desc_init = `发射可以在敌人之间弹射的飞刃\n+ 每次弹射将使伤害衰减，升级可以衰减的程度`
  private levelBtFxFx = TowerManager.EjectBlade.bt!
  private levelDfpbFx = TowerManager.EjectBlade.dfpb!

  constructor(position: Position, image: string | AnimationSprite | ImageBitmap, b_img: ImageBitmap, radius: number) {
    super(position, radius, 1, 'rgba(26,13,112,.3)', image, TowerManager.EjectBlade.p, TowerManager.EjectBlade.a, TowerManager.EjectBlade.h, TowerManager.EjectBlade.s, TowerManager.EjectBlade.r)

    this.bulletCtorName = TowerManager.EjectBlade.bctor!
    this.bulletImage = b_img

    this.name = TowerManager.EjectBlade.dn
    this.description = this.inner_desc_init
  }

  override get informationSeq() {
    return super.informationSeq.concat([
      ['弹射次数', this.bounceTime + ''],
      ['弹射伤害系数', Tools.roundWithFixed(this.damageFadePerBounce * 100, 2) + ' %']
    ])
  }

  /**
   * 弹射次数
   */
  private get bounceTime() {
    return this.levelBtFxFx(this.level)
  }

  /**
   * 每次弹射后伤害衰减的乘数
   */
  private get damageFadePerBounce() {
    return this.levelDfpbFx(this.level)
  }

  override produceBullet() {
    if (this.target) {
      const ratio = this.calculateDamageRatio(this.target)
      this.bulletCtl.Factory(
        this.recordDamage.bind(this),
        this.bulletCtorName,
        this.position.copy().dithering(this.radius),
        this.Atk * ratio,
        this.target,
        this.bulletImage,
        this.bounceTime,
        this.damageFadePerBounce
      )
    }
  }
}
