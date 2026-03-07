/// <reference path="../base.ts" />
/// <reference path="../bullets/index.ts" />
/// <reference path="../utils/math-utils.ts" />
/// <reference path="../utils/format-utils.ts" />
/// <reference path="../utils/object-utils.ts" />
/// <reference path="../utils/render-utils.ts" />
/// <reference path="../utils/ease-utils.ts" />

// ============================================================================
// 基础模块
// ============================================================================
/// <reference path="./tower-constants.ts" />
/// <reference path="./tower-types.ts" />
/// <reference path="./tower-config.ts" />
/// <reference path="./tower-manager.ts" />
/// <reference path="./level-up-config.ts" />

// ============================================================================
// 辅助类
// ============================================================================
/// <reference path="./helpers/colossus-laser.ts" />
/// <reference path="./helpers/jet.ts" />

// ============================================================================
// 塔类
// ============================================================================
/// <reference path="./towers/test-tower.ts" />
/// <reference path="./towers/cannon-shooter.ts" />
/// <reference path="./towers/maskman-tower.ts" />
/// <reference path="./towers/frost-tower.ts" />
/// <reference path="./towers/poison-tower.ts" />
/// <reference path="./towers/tesla-tower.ts" />
/// <reference path="./towers/black-magic-tower.ts" />
/// <reference path="./towers/laser-tower.ts" />
/// <reference path="./towers/carrier-tower.ts" />
/// <reference path="./towers/eject-blade.ts" />

// ============================================================================
// 注册所有塔类到 TowerRegistry
// ============================================================================
TowerRegistry.register('MaskManTower', MaskManTower)
TowerRegistry.register('CannonShooter', CannonShooter)
TowerRegistry.register('FrostTower', FrostTower)
TowerRegistry.register('PoisonTower', PoisonTower)
TowerRegistry.register('TeslaTower', TeslaTower)
TowerRegistry.register('BlackMagicTower', BlackMagicTower)
TowerRegistry.register('LaserTower', LaserTower)
TowerRegistry.register('CarrierTower', CarrierTower)
TowerRegistry.register('EjectBlade', EjectBlade)
TowerRegistry.register('CarrierTower.Jet', _Jet)

// ============================================================================
// 注册载机子弹类到 BulletRegistry
// ============================================================================
BulletRegistry.register('CarrierTower.Jet.JetWeapons.MachineGun', _Jet.JetWeapons.MachineGun)
BulletRegistry.register('CarrierTower.Jet.JetWeapons.AutoCannons', _Jet.JetWeapons.AutoCannons)
