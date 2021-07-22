/// <reference path="./base.ts" />

/**
 * 单例
 */
class BulletManager {
  static instance: Optional<BulletManager> = null

  public bullets!: BulletBase[]
  private __b_ctor_cache!: Map<string, IBulletBase>

  constructor() {
    if (!BulletManager.instance) {
      this.bullets = []
      this.__b_ctor_cache = new Map()

      BulletManager.instance = this
    }

    return BulletManager.instance
  }

  Factory(
    emitter: typeof TowerBase.prototype.recordDamage,
    bulletName: string,
    position: Position,
    atk: number,
    target: MonsterBase | Position,
    image: Optional<ImageBitmap | string>,
    ...extraArgs: any[]
  ): BulletBase {
    let ctor: Optional<IBulletBase> = null

    if (this.__b_ctor_cache.has(bulletName)) {
      ctor = this.__b_ctor_cache.get(bulletName)
    } else {
      ctor = eval(bulletName)
      this.__b_ctor_cache.set(bulletName, ctor!)
    }

    const bb = new ctor!(position, atk, target, image, ...extraArgs)

    bb.setDamageEmitter(emitter)
    this.bullets.push(bb)
    return bb
  }

  run(monsters: MonsterBase[]) {
    this.bullets.forEach(b => b.run(monsters))
  }

  render(ctx: WrappedCanvasRenderingContext2D) {
    this.bullets.forEach(b => b.render(ctx as CanvasRenderingContext2D))
  }

  scanSwipe() {
    this.bullets = this.bullets.filter(b => {
      if (b.fulfilled) b.destroy()
      return !b.fulfilled
    })
  }
}

class CannonBullet extends BulletBase {
  static bulletVelocity = 4

  protected aimPosition: Optional<Position>
  protected explosionDmg: number
  protected explosionRadius: number
  protected burnDotDamage: number
  protected burnDotInterval: number
  protected burnDotDuration: number
  protected ratioCalc: (monster: MonsterBase) => number

  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    _b_img: null,
    explosionDmg: number,
    explosionRadius: number,
    burnDotDamage: number,
    burnDotInterval: number,
    burnDotDuration: number,
    extraBV: number | null,
    ratioCalc: (monster: MonsterBase) => number
  ) {
    super(position, 2, 1, 'rgba(15,244,11,.9)', 'rgba(15,12,11,.6)', atk, CannonBullet.bulletVelocity + (extraBV || 0), target)

    this.aimPosition = null

    this.explosionDmg = explosionDmg
    this.explosionRadius = explosionRadius
    this.burnDotDamage = burnDotDamage
    this.burnDotInterval = burnDotInterval
    this.burnDotDuration = burnDotDuration

    this.ratioCalc = ratioCalc
  }

  override get isReaching() {
    if (this.aimPosition) return Position.distancePow2(this.position, this.aimPosition) < Math.pow(20 + this.radius, 2)
    else return super.isReaching
  }

  get burnDotCount() {
    return this.burnDotDuration / this.burnDotInterval
  }

  /**
   * 加农炮弹在丢失目标后仍会向最后记录的目标位置飞行并爆炸
   */
  override run(monsters: MonsterBase[]) {
    if (!this.target) {
      this.position.moveTo(this.aimPosition!, this.speed)
    } else {
      this.position.moveTo(this.target.position, this.speed)

      if (this.target.isDead) {
        this.aimPosition = this.target.position.copy()
        this.target = null
      }
    }

    if (this.isReaching) {
      this.hit(this.target, 1, monsters)
      this.fulfilled = true
    }
  }

  /**
   * 击中敌人后会引起爆炸
   * 并点燃敌人，造成周期伤害
   */
  override hit(monster: Optional<MonsterBase>, _magnification: number = 1, monsters: MonsterBase[]) {
    if (monster) super.hit(monster, this.ratioCalc(monster))

    const targetPosition = this.target ? this.target.position : this.aimPosition!

    const positionTL = new Position(targetPosition.x - this.explosionRadius, targetPosition.y - this.explosionRadius)
    // render explosion
    Game.callAnimation('explo_3', positionTL, this.explosionRadius * 2, this.explosionRadius * 2, 0.5, 0)
    // make exploding dmg
    monsters.forEach(m => {
      if (Position.distancePow2(m.position, targetPosition) < this.explosionRadius * this.explosionRadius) {
        m.health -= this.explosionDmg * (1 - m.armorResistance) * this.ratioCalc(m)
        this.emitter(m)

        Tools.installDOT(m, 'beBurned', this.burnDotDuration, this.burnDotInterval, this.burnDotDamage * this.ratioCalc(m), false, this.emitter.bind(this))
      }
    })
  }
}

class ClusterBomb extends CannonBullet {
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    _b_img: null,
    explosionDmg: number,
    explosionRadius: number,
    burnDotDamage: number,
    burnDotInterval: number,
    burnDotDuration: number,
    extraBV: number | null,
    ratioCalc: (monster: MonsterBase) => number
  ) {
    super(position, atk, target, _b_img, explosionDmg, explosionRadius, burnDotDamage, burnDotInterval, burnDotDuration, extraBV, ratioCalc)

    this.radius += 4
    this.borderStyle = 'rgba(14,244,11,.9)'
    this.fill = 'rgba(215,212,11,.6)'
    this.speed += 2
  }

  get childExplodeRadius() {
    return this.explosionRadius * 0.5
  }

  get childBombDistance() {
    return this.explosionRadius * 0.5
  }

  get childExplodeDamage() {
    return this.explosionDmg * 0.8
  }

  clusterExplode(monsters: MonsterBase[], radius: number, dist: number, dmg: number, degree: number, waitFrame: number) {
    const childExplodePositions = _.range(0, 360, degree).map(d => {
      const vec = new PolarVector(dist, d)
      const pos = this.position.copy().move(vec)

      const positionTL = new Position(pos.x - radius, pos.y - radius)
      Game.callAnimation('explo_3', positionTL, radius * 2, radius * 2, 0.5, 0, waitFrame)
      return pos
    })

    monsters.forEach(m => {
      childExplodePositions
        .filter(ep => Position.distancePow2(m.position, ep) < radius * radius)
        .forEach(() => {
          m.health -= dmg * (1 - m.armorResistance) * this.ratioCalc(m)
          this.emitter(m)
          Tools.installDOT(m, 'beBurned', this.burnDotDuration, this.burnDotInterval, this.burnDotDamage * this.ratioCalc(m), false, this.emitter.bind(this))
        })
    })
  }

  /**
   * 集束炸弹命中或到达目的地后会爆炸，分裂出[n]枚小型炸弹
   */
  override hit(monster: MonsterBase, _magnification: number = 1, monsters: MonsterBase[]) {
    if (monster) super.hit(monster, _magnification, monsters)

    this.clusterExplode(monsters, this.childExplodeRadius, this.childBombDistance, this.childExplodeDamage, 45, 10)
  }
}

class ClusterBombEx extends ClusterBomb {
  constructor(
    position: Position,
    atk: number,
    target: MonsterBase,
    _b_img: null,
    explosionDmg: number,
    explosionRadius: number,
    burnDotDamage: number,
    burnDotInterval: number,
    burnDotDuration: number,
    extraBV: number | null,
    ratioCalc: (monster: MonsterBase) => number
  ) {
    super(position, atk, target, _b_img, explosionDmg, explosionRadius, burnDotDamage, burnDotInterval, burnDotDuration, extraBV, ratioCalc)

    this.radius += 2
    this.fill = 'rgba(245,242,11,.8)'
  }

  get grandChildExplodeRadius() {
    return super.childExplodeRadius * 0.5
  }

  get grandChildBombDistance() {
    return super.childBombDistance * 2
  }

  get grandChildExplodeDamage() {
    return super.childExplodeDamage * 0.8
  }

  override hit(monster: MonsterBase, _magnification: number = 1, monsters: MonsterBase[]) {
    super.hit(monster, _magnification, monsters)

    this.clusterExplode(monsters, this.grandChildExplodeRadius, this.grandChildBombDistance, this.grandChildExplodeDamage, 30, 20)
  }
}

class NormalArrow extends BulletBase {
  static bulletVelocity = 18

  private critChance: number
  private critRatio: number
  private willTrap: boolean
  private trapDuration: number
  private isSecKill: boolean

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
    super(position, 8, 0, null, image, atk, NormalArrow.bulletVelocity + (extraBV || 0), target)

    this.critChance = critChance
    this.critRatio = critRatio

    this.willTrap = Math.random() > 1 - trapChance / 100
    this.trapDuration = trapDuration

    this.isSecKill = isSecKill
  }

  override hit(monster: MonsterBase) {
    if (this.isSecKill) {
      monster.health -= monster.health + 1
      this.emitter(monster)
      return
    }

    // 摇骰子，确定本次是否暴击
    const critMagnification = Math.random() < this.critChance ? this.critRatio : 1
    // console.log(critMagnification + ' X')

    // 穿甲
    monster.health -= this.Atk * critMagnification * (1 - monster.armorResistance * 0.7)
    this.emitter(monster)

    /**
     * 束缚
     */
    if (this.willTrap) {
      monster.registerImprison((this.trapDuration / 1000) * 60)
    }
  }
}

// class PenetratingArrow extends BulletBase {
//   static bulletVelocity = 12

//   private destination: Position
//   private hitMap: number[] = []

//   constructor(position: Position, atk: number, target: MonsterBase, image: string | ImageBitmap) {
//     super(position, 8, 0, null, image, atk, NormalArrow.bulletVelocity, target)

//     this.destination = this.position.copy().moveTo(this.target.position, Game.callDiagonalLength())
//   }

//   override run(monsters: MonsterBase[]) {
//     this.position.moveTo(this.destination, this.speed)

//     monsters.forEach(mst => {
//       if (this.inRange(mst) && !this.hitMap.includes(mst.id)) {
//         this.hit(mst)
//         this.hitMap.push(mst.id)
//       }
//     })

//     if (this.position.outOfBoundary(Position.O, Game.callBoundaryPosition(), 50)) {
//       this.fulfilled = true
//       this.target = null
//     }
//   }

//   override hit(monster: MonsterBase) {
//     // 穿甲
//     monster.health -= this.Atk * (1 - monster.armorResistance * 0.4)
//     this.emitter(monster)
//   }
// }

// class MysticBomb extends BulletBase {
//   static bulletVelocity = 12

//   private destination: Position
//   /**
//    * Distance To Destination
//    */
//   private DTD = Infinity

//   constructor(position: Position, atk: number, des: Position) {
//     super(position, 3, 1, 'rgba(141,123,51,1)', 'rgba(204,204,204,1)', atk, MysticBomb.bulletVelocity, null)

//     this.destination = des
//   }

//   override get isReaching() {
//     const disP2 = Position.distancePow2(this.position, this.destination)
//     if (disP2 > this.DTD) {
//       return true
//     } else {
//       this.DTD = disP2
//       return false
//     }
//   }

//   override run(monsters: MonsterBase[]) {
//     this.position.moveTo(this.destination, this.speed)

//     // 没有击中任何目标 -> 消散
//     if (this.isReaching) {
//       this.fulfilled = true
//     } else {
//       const anyHit = monsters.find(mst => this.inRange(mst))
//       if (anyHit) {
//         this.hit(anyHit)
//         this.fulfilled = true
//       }
//     }
//   }
// }

class PoisonCan extends BulletBase {
  static bulletVelocity = 6

  private poisonAtk: number
  private poisonItv: number
  private poisonDur: number

  constructor(position: Position, atk: number, target: MonsterBase, _image: null, poisonAtk: number, poisonItv: number, poisonDur: number, extraBV: number | null) {
    super(position, 2, 1, 'rgba(244,22,33,1)', 'rgba(227,14,233,.9)', atk, PoisonCan.bulletVelocity + (extraBV || 0), target)

    this.poisonAtk = poisonAtk
    this.poisonItv = poisonItv
    this.poisonDur = poisonDur
  }

  override hit(monster: MonsterBase) {
    super.hit(monster)

    Tools.installDOT(monster, 'bePoisoned', this.poisonDur, this.poisonItv, this.poisonAtk, true, this.emitter.bind(this))
  }
}

class Blade extends BulletBase {
  static bulletVelocity = 12

  private bounceTime: number
  private damageFadePerBounce: number

  constructor(position: Position, atk: number, target: MonsterBase, image: string | ImageBitmap, bounceTime: number, damageFadePerBounce: number) {
    super(position, 4, 0, null, image, atk, Blade.bulletVelocity, target)

    this.bounceTime = bounceTime
    this.damageFadePerBounce = damageFadePerBounce
  }

  override run(monsters: MonsterBase[]) {
    if (!this.target) return

    this.position.moveTo(this.target.position, this.speed)

    if (this.target.isDead) {
      this.fulfilled = true
      this.target = null
    } else if (this.isReaching) {
      this.hit(this.target, 1, monsters)

      if (this.bounceTime > 0 && monsters.length > 1) {
        this.bounceToNext(monsters)
      } else {
        this.fulfilled = true
        this.target = null
      }
    } else if (this.position.outOfBoundary(Position.O, Game.callBoundaryPosition(), 50)) {
      console.log('a bullet has run out of the bound, and will be swipe by system.')
      console.log(this)
      this.fulfilled = true
      this.target = null
    }
  }

  bounceToNext(monsters: MonsterBase[]) {
    // const newTarget = _.minBy(monsters, mst => {
    //   if (mst === this.target) return Infinity
    //   const dist = Position.distancePow2(mst.position, this.position)
    //   return dist
    // })
    const newTarget = _.shuffle(monsters.filter(m => m !== this.target))[0]
    if (this.speed < 22) this.speed += 1

    this.target = newTarget
    this.Atk *= this.damageFadePerBounce
    this.bounceTime--
  }
}
