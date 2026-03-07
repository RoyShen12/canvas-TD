/// <reference path="../base.ts" />

// ============================================================================
// 怪物模块入口
// ============================================================================

// ============================================================================
// 基础模块
// ============================================================================
/// <reference path="./helpers.ts" />
/// <reference path="./monster-manager.ts" />

// ============================================================================
// 普通怪物
// ============================================================================
/// <reference path="./normal/dummy.ts" />
/// <reference path="./normal/swordman.ts" />
/// <reference path="./normal/axeman.ts" />
/// <reference path="./normal/lionman.ts" />
/// <reference path="./normal/demon-spawn.ts" />

// ============================================================================
// Boss 怪物
// ============================================================================
/// <reference path="./bosses/high-priest.ts" />
/// <reference path="./bosses/devil.ts" />

// ============================================================================
// 注册所有怪物类到 MonsterRegistry
// ============================================================================
MonsterRegistry.register('Dummy', Dummy)
MonsterRegistry.register('Swordman', Swordman)
MonsterRegistry.register('Axeman', Axeman)
MonsterRegistry.register('LionMan', LionMan)
MonsterRegistry.register('DemonSpawn', DemonSpawn)
MonsterRegistry.register('HighPriest', HighPriest)
MonsterRegistry.register('Devil', Devil)
