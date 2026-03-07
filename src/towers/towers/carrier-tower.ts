/// <reference path="../tower-constants.ts" />
/// <reference path="../tower-manager.ts" />
/// <reference path="../helpers/jet.ts" />
/// <reference path="../../base.ts" />
/// <reference path="../../motion.ts" />

/**
 * CarrierTower - 航母
 * 自身无法攻击，释放搭载的载机进行战斗
 */
class CarrierTower extends TowerBase {
  /** 全局 F1 模式标记 */
  private static __inner_f1_mode = false
  /** 全局武器模式 */
  private static __inner_wp_mode = 1

  static set F1Mode(v: boolean) {
    Game.callChangeF1Mode(v)
    this.__inner_f1_mode = v
  }

  static get F1Mode(): boolean {
    return this.__inner_f1_mode
  }

  static set WeaponMode(v: number) {
    Game.callChangeCarrierWeaponMode(v)
    this.__inner_wp_mode = v
  }

  static get WeaponMode(): number {
    return this.__inner_wp_mode
  }

  /** 禁用的宝石列表 */
  static override deniedGems = ['ZeisStoneOfVengeance', 'GemOfAnger']

  /** 载机类引用 */
  public static Jet = _Jet

  /** 载机计数映射 */
  private jetCountMap: Map<number, (TowerBase & { carrierTower: CarrierTower })[]> = new Map()

  /** 当前载机数量 */
  public jetCount = 0

  // 等级函数
  private levelSpdFx = TowerManager.CarrierTower.spd!
  private levelKcFx = TowerManager.CarrierTower.child!

  private inner_desc_init =
    '自身无法攻击，释放搭载的载机进行战斗\n使用 [F1] 切换载机的自主/受控模式\n使用 [Q] 切换载机的武器\n+ 载机继承自身属性\n+ 可以对任意位置进行机动打击'

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
      TOWER_COLORS.CARRIER,
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

  override get informationSeq(): string[][] {
    return super.informationSeq.concat([['载机量', this.KidCount + '']])
  }

  /** 载机数量上限 */
  private get KidCount(): number {
    return this.levelKcFx(this.level)
  }

  /** 载机速度 */
  get Spd(): number {
    return this.levelSpdFx(this.level)
  }

  /** 获取当前航母的载机列表 */
  private get shipBoardAircraft(): (TowerBase & { carrierTower: CarrierTower })[] {
    if (this.jetCountMap.has(this.jetCount)) {
      return this.jetCountMap.get(this.jetCount)!
    }

    // 清理旧缓存并重新获取
    this.jetCountMap.clear()
    const newJets = Game.callIndependentTowerList().filter(
      tow => tow.carrierTower && tow.carrierTower === this
    ) as (TowerBase & { carrierTower: CarrierTower })[]
    this.jetCountMap.set(this.jetCount, newJets)

    return newJets
  }

  override run(): void {
    // 检查是否可以释放新载机
    if (this.canShoot && this.jetCount < this.KidCount) {
      Game.callTowerFactory()(
        'CarrierTower.Jet',
        this.position.copy().dithering(this.radius * 2, this.radius),
        Game.callImageBitMap(TowerManager.CarrierTower.cn!)!,
        null,
        Game.callGridSideSize() / 4,
        this
      )

      this.jetCount++
    }
  }

  override renderRange(): void {
    // 航母不显示射程范围
  }

  override destroy(): void {
    super.destroy()

    // 销毁所有载机
    this.shipBoardAircraft.forEach(jet => {
      jet.isSold = true
    })
  }

  rapidRender(): void {}
}
