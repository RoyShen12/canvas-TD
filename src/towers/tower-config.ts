/// <reference path="./tower-constants.ts" />
/// <reference path="./tower-types.ts" />
/// <reference path="../utils/math-utils.ts" />

/**
 * Tower Configurations - 塔配置数据
 * 定义所有塔的基础属性、等级函数等
 */

const towerCtors: TowerConfig[] = [
  // ============================================================================
  // 弓箭塔 (MaskManTower)
  // ============================================================================
  {
    dn: '弓箭塔',
    c: 'MaskManTower',
    od: 1,
    n: 'archer0',
    n2: 'archer1',
    n3: 'archer2',
    n4: 'archer3',
    p: createPriceProxy(TOWER_PRICING.ARCHER.basePrice, TOWER_PRICING.ARCHER.maxLevel),
    r: (lvl: number) => lvl * 0.8 + 180,
    a: (lvl: number) => lvl * 2 + 2,
    h: (_lvl?: number) => 1,
    s: (lvl: number) => Math.floor(lvl / 20) + 2,
    bctor: 'NormalArrow',
    bn: 'normal_arrow',
    bn2: 'flame_arrow'
  },

  // ============================================================================
  // 加农炮塔 (CannonShooter)
  // ============================================================================
  {
    dn: '加农炮塔',
    c: 'CannonShooter',
    od: 2,
    n: 'cannon0',
    n2: 'cannon1',
    n3: 'cannon2',
    p: createPriceProxy(TOWER_PRICING.CANNON.basePrice, TOWER_PRICING.CANNON.maxLevel),
    r: (lvl: number) => lvl * 0.75 + 120,
    a: (lvl: number) => lvl * 2 + 2,
    h: (lvl: number) => 0.7 + lvl * 0.004,
    s: (_lvl?: number) => 1,
    // 爆炸相关
    expr: (lvl: number) => Math.min(20 + lvl, 80),
    expatk: (atk: number) => atk * 4.4 + 120,
    // 灼烧相关
    bdatk: (atk: number) => atk * 1.1,
    bdatk2: (atk: number) => atk * 1.6,
    bdatk3: (atk: number) => atk * 2.1,
    bdatk4: (atk: number) => atk * 2.6,
    bdatk5: (atk: number) => atk * 3.1,
    bditv: (_lvl?: number) => 80,
    bddur: (_lvl?: number) => 15000,
    // 子弹
    bctor: 'CannonBullet',
    bctor2: 'ClusterBomb',
    bctor3: 'ClusterBombEx'
  },

  // ============================================================================
  // 冰霜塔 (FrostTower)
  // ============================================================================
  {
    dn: '冰霜塔',
    c: 'FrostTower',
    od: 3,
    n: 'ice',
    p: createPriceProxy(TOWER_PRICING.FROST.basePrice, TOWER_PRICING.FROST.maxLevel),
    r: (lvl: number) => lvl * 2.5 + 100,
    a: (_lvl?: number) => 0,
    h: (_lvl?: number) => Infinity,
    s: (_lvl?: number) => 0,
    // 减速强度
    sr: (lvl: number) => MathFx.naturalLogFx(0.1, 0.12)(lvl)
  },

  // ============================================================================
  // 毒气塔 (PoisonTower)
  // ============================================================================
  {
    dn: '毒气塔',
    c: 'PoisonTower',
    od: 4,
    n: 'poison_t',
    p: createPriceProxy(TOWER_PRICING.POISON.basePrice, TOWER_PRICING.POISON.maxLevel),
    r: (lvl: number) => lvl * 0.8 + 100,
    a: (lvl: number) => Math.round(lvl / 20 + 2),
    h: (lvl: number) => 2.1 + lvl * 0.1,
    s: (_lvl?: number) => 1,
    // 毒素相关
    patk: (lvl: number) => lvl * 4 * Math.max(lvl / 25, 1) + 90,
    pitv: (lvl: number) => Math.max(600 - lvl * 20, 50),
    pdur: (_lvl?: number) => 5000,
    bctor: 'PoisonCan'
  },

  // ============================================================================
  // 电能塔 (TeslaTower)
  // ============================================================================
  {
    dn: '电能塔',
    c: 'TeslaTower',
    od: 5,
    n: 'tesla0',
    n2: 'tesla1',
    n3: 'tesla2',
    p: createPriceProxy(TOWER_PRICING.TESLA.basePrice, TOWER_PRICING.TESLA.maxLevel),
    r: (_lvl?: number) => 70,
    a: (lvl: number) => 18 + Math.round((lvl / 2 + 3) * (lvl / 2 + 3)),
    h: (lvl: number) => 0.75 + lvl * 0.01,
    s: (_lvl?: number) => 0
  },

  // ============================================================================
  // 魔法塔 (BlackMagicTower)
  // ============================================================================
  {
    dn: '魔法塔',
    c: 'BlackMagicTower',
    od: 6,
    n: 'magic0',
    n2: 'magic1',
    n3: 'magic2',
    n4: 'magic3',
    p: createPriceProxy(TOWER_PRICING.MAGIC.basePrice, TOWER_PRICING.MAGIC.maxLevel),
    r: (lvl: number) => lvl * 1 + 140,
    a: (lvl: number) => 5000 + Math.round((lvl + 4) * (lvl + 4)),
    a2: (lvl: number) => 9000 + Math.round((lvl + 8) * (lvl + 8)),
    a3: (lvl: number) => 15000 + Math.round((lvl + 16) * (lvl + 16)),
    a4: (lvl: number) => 42000 + Math.round((lvl + 32) * (lvl + 32)),
    h: (_lvl?: number) => 0.125,
    s: (_lvl?: number) => 1,
    // 诅咒相关
    ide: (lvl: number) => lvl * 0.004 + 0.01,
    idr: (lvl: number) => 10000 + 100 * lvl
  },

  // ============================================================================
  // 激光塔 (LaserTower)
  // ============================================================================
  {
    dn: '激光塔',
    c: 'LaserTower',
    od: 7,
    n: 'laser0',
    n2: 'laser1',
    n3: 'laser2',
    n4: 'laser3',
    n5: 'laser4',
    p: createPriceProxy(TOWER_PRICING.LASER.basePrice, TOWER_PRICING.LASER.maxLevel),
    r: (lvl: number) => lvl * 0.55 + 90,
    a: (lvl: number) => Math.round(lvl * 3 + 10),
    h: (_lvl?: number) => 0.8,
    h2: (_lvl?: number) => 1,
    s: (_lvl?: number) => 1,
    s2: (lvl: number) => Math.floor(lvl / 30) + 1,
    s3: (lvl: number) => Math.floor(lvl / 28) + 3,
    // 激光相关
    lsd: (_lvl?: number) => 90, // laser swipe distance
    fatk: (lvl: number) => Math.pow(lvl, 1.05) * 10 + 160,
    fw: (lvl: number) => 40 + Math.floor(lvl / 8)
  },

  // ============================================================================
  // 航母 (CarrierTower)
  // ============================================================================
  {
    dn: '航母',
    c: 'CarrierTower',
    od: 8,
    n: 'carrier0',
    n2: 'carrier2',
    cn: 'plane_1',
    p: createPriceProxy(TOWER_PRICING.CARRIER.basePrice, TOWER_PRICING.CARRIER.maxLevel),
    r: (_lvl?: number) => 150,
    a: (lvl: number) => 125 + lvl * 8 + lvl * lvl * 0.1,
    h: (lvl: number) => 0.8 + lvl * 0.01,
    s: (_lvl?: number) => 1,
    // 载机相关
    child: (lvl: number) => 1 + Math.floor(lvl / 20),
    spd: (_lvl?: number) => 5
  },

  // ============================================================================
  // 飞刃塔 (EjectBlade)
  // ============================================================================
  {
    dn: '飞刃塔',
    c: 'EjectBlade',
    od: 9,
    n: 'knife0',
    p: createPriceProxy(TOWER_PRICING.BLADE.basePrice, TOWER_PRICING.BLADE.maxLevel),
    r: (lvl: number) => lvl * 0.8 + 160,
    a: (lvl: number) => lvl * 5.5 + 20,
    h: (lvl: number) => 0.5 + lvl * 0.0225,
    s: (_lvl?: number) => 1,
    // 弹射相关
    bt: (lvl: number) => Math.round(lvl / 18) + 1,
    dfpb: (lvl: number) => 0.5 + lvl * 0.0075,
    bctor: 'Blade',
    bn: 'blade_gear'
  }
]
