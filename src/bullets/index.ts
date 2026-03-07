/// <reference path="../base.ts" />
/// <reference path="./types.ts" />
/// <reference path="./bullet-manager.ts" />
/// <reference path="./normal-arrow.ts" />
/// <reference path="./penetrating-arrow.ts" />
/// <reference path="./cannon-bullet.ts" />
/// <reference path="./poison-can.ts" />
/// <reference path="./blade.ts" />
/// <reference path="./mystic-bomb.ts" />

/**
 * 子弹模块入口
 * 统一导出所有子弹类并注册到 BulletRegistry
 */

// 注册所有子弹类到 BulletRegistry
BulletRegistry.register('NormalArrow', NormalArrow)
BulletRegistry.register('PenetratingArrow', PenetratingArrow)
BulletRegistry.register('CannonBullet', CannonBullet)
BulletRegistry.register('ClusterBomb', ClusterBomb)
BulletRegistry.register('ClusterBombEx', ClusterBombEx)
BulletRegistry.register('PoisonCan', PoisonCan)
BulletRegistry.register('Blade', Blade)
BulletRegistry.register('MysticBomb', MysticBomb)
