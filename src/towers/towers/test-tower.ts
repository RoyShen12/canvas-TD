/// <reference path="../tower-manager.ts" />
/// <reference path="../../base.ts" />

/**
 * TestTower - 测试用塔
 * 用于开发调试的高攻击力塔
 */
class TestTower extends TowerBase {
  /** 测试子弹类 */
  static TestBullet = class _TestBullet extends BulletBase {
    constructor(position: Position, atk: number, target: MonsterBase) {
      super(position, 3, 0, null, 'rgba(15,44,11,1)', atk, 50, target)
    }
  }

  constructor(
    position: Position,
    image: string | AnimationSprite | ImageBitmap,
    _bulletImage: any,
    radius: number
  ) {
    super(
      position,
      radius,
      0,
      null,
      image,
      TowerManager.TestTower.p,
      TowerManager.TestTower.a,
      TowerManager.TestTower.h,
      TowerManager.TestTower.s,
      TowerManager.TestTower.r
    )

    this.canInsertGem = false
    this.bulletCtorName = TowerManager.TestTower.bctor!
    this.name = TowerManager.TestTower.dn
    this.description = 'TOWER FOR TEST DAMAGE'
  }

  rapidRender(): void {}
}
