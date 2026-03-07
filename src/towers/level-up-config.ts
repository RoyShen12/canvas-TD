/// <reference path="./tower-constants.ts" />
/// <reference path="./tower-types.ts" />

/**
 * Level Up Configurations - 升级配置表
 * 将 switch-case 升级逻辑转换为数据驱动
 */

// ============================================================================
// 弓箭塔 (MaskManTower) 升级配置
// ============================================================================

const MASKMAN_TOWER_UPGRADES: LevelUpConfig = [
  {
    level: 5,
    rankUp: true,
    name: '弩箭塔',
    imageKey: 'n2',
    descriptionAppend: '\n+ 射程和攻击力得到加强',
    borderStyle: TOWER_COLORS.ARCHER_RANK_1,
    statChanges: {
      extraRange: ARCHER_CONSTANTS.EXTRA_RANGE_RANK_1,
      extraPower: ARCHER_CONSTANTS.EXTRA_POWER_RANK_1,
      extraBulletV: ARCHER_CONSTANTS.EXTRA_BULLET_V_RANK_1
    }
  },
  {
    level: 10,
    rankUp: true,
    name: '火枪塔',
    imageKey: 'n3',
    borderStyle: TOWER_COLORS.ARCHER_RANK_2,
    statChanges: {
      extraPower: ARCHER_CONSTANTS.EXTRA_POWER_RANK_2,
      extraBulletV: ARCHER_CONSTANTS.EXTRA_BULLET_V_RANK_2,
      secKillChance: ARCHER_CONSTANTS.SEC_KILL_CHANCE
    },
    customEffect: (tower: any) => {
      tower.enhanceCrit(0.15, 6)
      tower.description += `\n+ 暴击能力得到大幅加强\n+ 有 ${Math.round(ARCHER_CONSTANTS.SEC_KILL_CHANCE * 1000)}‰ 的几率直接杀死目标`
    }
  },
  {
    level: 15,
    rankUp: true,
    name: '精灵神射手塔',
    imageKey: 'n4',
    descriptionAppend: '\n+ 命中的箭矢将有几率束缚敌人',
    borderStyle: TOWER_COLORS.ARCHER_RANK_3,
    statChanges: {
      extraRange: ARCHER_CONSTANTS.EXTRA_RANGE_RANK_3,
      trapChance: ARCHER_CONSTANTS.TRAP_CHANCE_INITIAL,
      trapDuration: ARCHER_CONSTANTS.TRAP_DURATION_INITIAL,
      extraBulletV: ARCHER_CONSTANTS.EXTRA_BULLET_V_RANK_3,
      extraArrow: ARCHER_CONSTANTS.EXTRA_ARROW_RANK_3
    },
    customEffect: (tower: any) => {
      tower.enhanceCrit(0.1)
      tower._dynamicExtraHaste = true
    }
  },
  {
    level: 20,
    rankUp: true,
    customEffect: (tower: any) => {
      tower.name += ` ${TOWER_RANK_NAMES.VETERAN}I`
      tower.enhanceCrit(0.05, 2)
    }
  },
  {
    level: 30,
    rankUp: true,
    statChanges: { trapChance: 6, trapDuration: 3500 },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
      tower.enhanceCrit()
    }
  },
  {
    level: 40,
    rankUp: true,
    statChanges: { trapChance: 7, trapDuration: 4000 },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
      tower.enhanceCrit()
    }
  },
  {
    level: 50,
    rankUp: true,
    statChanges: { trapChance: 7.5, trapDuration: 4300 },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
      tower.enhanceCrit()
    }
  },
  {
    level: 60,
    rankUp: true,
    statChanges: { trapChance: 8, trapDuration: 4400 },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
      tower.enhanceCrit()
    }
  },
  {
    level: 70,
    rankUp: true,
    statChanges: { trapChance: 9, trapDuration: 4500 },
    customEffect: (tower: any) => {
      tower.name = tower.name!.replace(TOWER_RANK_NAMES.VETERAN, TOWER_RANK_NAMES.ELITE).replace('V', 'I')
      tower.enhanceCrit(0.05, 2)
    }
  },
  {
    level: 80,
    rankUp: true,
    statChanges: { trapChance: 10 },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
      tower.enhanceCrit()
    }
  },
  {
    level: 90,
    rankUp: true,
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
      tower.enhanceCrit()
    }
  }
]

// ============================================================================
// 加农炮塔 (CannonShooter) 升级配置
// ============================================================================

const CANNON_SHOOTER_UPGRADES: LevelUpConfig = [
  {
    level: 5,
    rankUp: true,
    name: '榴弹塔',
    imageKey: 'n2',
    descriptionAppend: '\n+ 爆炸范围和伤害得到加强',
    borderStyle: TOWER_COLORS.CANNON_RANK_1,
    statChanges: {
      extraExplosionDamage: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_1,
      extraExplosionRange: CANNON_CONSTANTS.EXPLOSION_RANGE_RANK_1,
      extraBulletV: CANNON_CONSTANTS.EXTRA_BULLET_V_RANK_1
    },
    customEffect: (tower: any) => {
      tower.levelBrnAtkFx = TowerManager.CannonShooter.bdatk2!
    }
  },
  {
    level: 10,
    rankUp: true,
    name: '导弹塔',
    imageKey: 'n3',
    descriptionAppend: '\n+ 射程得到大幅加强',
    borderStyle: TOWER_COLORS.CANNON_RANK_2,
    statChanges: {
      extraExplosionDamage: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_2,
      extraRange: CANNON_CONSTANTS.EXTRA_RANGE_RANK_2,
      extraBulletV: CANNON_CONSTANTS.EXTRA_BULLET_V_RANK_2
    },
    customEffect: (tower: any) => {
      tower.levelBrnAtkFx = TowerManager.CannonShooter.bdatk3!
    }
  },
  {
    level: 15,
    rankUp: true,
    name: '集束炸弹塔',
    descriptionAppend: '\n+ 命中后向四周抛出小型炸弹',
    statChanges: {
      extraExplosionDamage: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_3,
      extraRange: CANNON_CONSTANTS.EXTRA_RANGE_RANK_3,
      extraExplosionRange: CANNON_CONSTANTS.EXPLOSION_RANGE_RANK_3
    },
    customEffect: (tower: any) => {
      tower.bulletCtorName = TowerManager.CannonShooter.bctor2!
      tower.levelBrnAtkFx = TowerManager.CannonShooter.bdatk4!
    }
  },
  {
    level: 30,
    rankUp: true,
    name: '云爆塔',
    descriptionAppend: '\n+ 小型炸弹将分裂两次',
    statChanges: {
      extraExplosionDamage: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RANK_4,
      extraRange: CANNON_CONSTANTS.EXTRA_RANGE_RANK_4,
      extraExplosionRange: CANNON_CONSTANTS.EXPLOSION_RANGE_RANK_4
    },
    customEffect: (tower: any) => {
      tower.bulletCtorName = TowerManager.CannonShooter.bctor3!
      tower.levelBrnAtkFx = TowerManager.CannonShooter.bdatk5!
    }
  },
  {
    level: 40,
    rankUp: true,
    customEffect: (tower: any) => {
      tower._dynamicExplosionDamage = true
      tower.name += ` ${TOWER_RANK_NAMES.VETERAN}I`
    }
  },
  {
    level: 50,
    rankUp: true,
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
    }
  },
  {
    level: 60,
    rankUp: true,
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
    }
  },
  {
    level: 70,
    rankUp: true,
    statChanges: { extraExplosionDamageRatio: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_4 },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
    }
  },
  {
    level: 80,
    rankUp: true,
    statChanges: { extraExplosionDamageRatio: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_5 },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
    }
  },
  {
    level: 90,
    rankUp: true,
    statChanges: {
      extraExplosionDamageRatio: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_6,
      extraExplosionRangeRatio: CANNON_CONSTANTS.EXPLOSION_RANGE_RATIO.RANK_6
    },
    customEffect: (tower: any) => {
      tower.name = tower.name!.replace(TOWER_RANK_NAMES.VETERAN, TOWER_RANK_NAMES.ELITE).replace('V', 'I')
    }
  },
  {
    level: 100,
    rankUp: true,
    statChanges: {
      extraExplosionDamageRatio: CANNON_CONSTANTS.EXPLOSION_DAMAGE_RATIO.RANK_7,
      extraExplosionRangeRatio: CANNON_CONSTANTS.EXPLOSION_RANGE_RATIO.RANK_7
    },
    customEffect: (tower: any) => {
      tower.name = RomanNumerals.increment(tower.name)
    }
  }
]

// ============================================================================
// 冰霜塔 (FrostTower) 升级配置
// ============================================================================

const FROST_TOWER_UPGRADES: LevelUpConfig = [
  {
    level: 5,
    rankUp: true,
    name: '暴风雪I',
    descriptionAppend: '\n+ 周期性造成范围冻结',
    statChanges: {
      freezeInterval: FROST_CONSTANTS.FREEZE_INTERVAL.RANK_1,
      freezeDuration: FROST_CONSTANTS.FREEZE_DURATION.RANK_1
    },
    customEffect: (tower: any) => {
      tower.setFreezeEffectLevel(1)
    }
  },
  {
    level: 10,
    rankUp: true,
    name: '暴风雪II',
    statChanges: {
      freezeInterval: FROST_CONSTANTS.FREEZE_INTERVAL.RANK_2,
      freezeDuration: FROST_CONSTANTS.FREEZE_DURATION.RANK_2
    },
    customEffect: (tower: any) => {
      tower.description += `\n+ 每次冻结都能削减敌方 ${Math.round((1 - FROST_CONSTANTS.ARMOR_DECREASING_STRENGTH) * 100)}% 护甲`
      tower.setFreezeEffectLevel(2)
    }
  },
  {
    level: 15,
    rankUp: true,
    name: '暴风雪III',
    descriptionAppend: '\n+ 冻结能力加强',
    statChanges: {
      freezeInterval: FROST_CONSTANTS.FREEZE_INTERVAL.RANK_3,
      freezeDuration: FROST_CONSTANTS.FREEZE_DURATION.RANK_3
    }
  },
  {
    level: 20,
    rankUp: true,
    name: '暴风雪IV',
    statChanges: {
      freezeInterval: FROST_CONSTANTS.FREEZE_INTERVAL.RANK_4,
      freezeDuration: FROST_CONSTANTS.FREEZE_DURATION.RANK_4
    }
  },
  {
    level: 25,
    rankUp: true,
    name: '暴风雪V',
    statChanges: {
      freezeInterval: FROST_CONSTANTS.FREEZE_INTERVAL.RANK_5,
      freezeDuration: FROST_CONSTANTS.FREEZE_DURATION.RANK_5
    }
  },
  {
    level: 30,
    rankUp: true,
    name: '暴风雪VI',
    statChanges: {
      freezeInterval: FROST_CONSTANTS.FREEZE_INTERVAL.RANK_6,
      freezeDuration: FROST_CONSTANTS.FREEZE_DURATION.RANK_6
    }
  },
  {
    level: 35,
    rankUp: true,
    name: '暴风雪VII',
    statChanges: {
      freezeInterval: FROST_CONSTANTS.FREEZE_INTERVAL.RANK_7,
      freezeDuration: FROST_CONSTANTS.FREEZE_DURATION.RANK_7
    }
  }
]

// ============================================================================
// 电能塔 (TeslaTower) 升级配置
// ============================================================================

const TESLA_TOWER_UPGRADES: LevelUpConfig = [
  {
    level: 12,
    rankUp: true,
    name: '特斯拉塔',
    imageKey: 'n2',
    descriptionAppend: '\n+ 攻击频率得到加强',
    borderStyle: TOWER_COLORS.TESLA_RANK_1,
    statChanges: {
      extraHaste: TESLA_CONSTANTS.EXTRA_HASTE_RANK_1,
      shockChargingChance: TESLA_CONSTANTS.SHOCK_CHARGING_CHANCE_RANK_1,
      shockDuration: TESLA_CONSTANTS.SHOCK_DURATION_RANK_1,
      shockChargingPowerRatio: TESLA_CONSTANTS.SHOCK_CHARGING_POWER_RATIO_RANK_1,
      shockLeakingChance: TESLA_CONSTANTS.SHOCK_LEAKING_CHANCE_RANK_1
    }
  },
  {
    level: 24,
    rankUp: true,
    name: '闪电风暴塔',
    imageKey: 'n3',
    descriptionAppend: '\n+ 射程得到加强',
    borderStyle: TOWER_COLORS.TESLA_RANK_2,
    statChanges: {
      extraRange: TESLA_CONSTANTS.EXTRA_RANGE_RANK_2,
      shockChargingChance: TESLA_CONSTANTS.SHOCK_CHARGING_CHANCE_RANK_2,
      shockDuration: TESLA_CONSTANTS.SHOCK_DURATION_RANK_2,
      shockChargingPowerRatio: TESLA_CONSTANTS.SHOCK_CHARGING_POWER_RATIO_RANK_2,
      shockLeakingChance: TESLA_CONSTANTS.SHOCK_LEAKING_CHANCE_RANK_2
    }
  }
]

// ============================================================================
// 魔法塔 (BlackMagicTower) 升级配置
// ============================================================================

const BLACK_MAGIC_TOWER_UPGRADES: LevelUpConfig = [
  {
    level: 5,
    rankUp: true,
    name: '奥术魔法塔',
    imageKey: 'n2',
    borderStyle: TOWER_COLORS.MAGIC_RANK_1,
    statChanges: { extraPower: MAGIC_CONSTANTS.EXTRA_POWER_RANK_1 },
    customEffect: (tower: any) => {
      tower.description = tower.inner_desc_init + '\n+ 伤害得到加强'
      tower.levelAtkFx = TowerManager.BlackMagicTower.a2!
    }
  },
  {
    level: 10,
    rankUp: true,
    name: '黑魔法塔',
    imageKey: 'n3',
    borderStyle: TOWER_COLORS.MAGIC_RANK_2,
    statChanges: { extraPower: MAGIC_CONSTANTS.EXTRA_POWER_RANK_2 },
    customEffect: (tower: any) => {
      tower.description = tower.inner_desc_init + '\n+ 伤害得到大幅加强'
      tower.levelAtkFx = TowerManager.BlackMagicTower.a3!
    }
  },
  {
    level: 15,
    rankUp: true,
    name: '虚空塔',
    imageKey: 'n4',
    borderStyle: TOWER_COLORS.MAGIC_RANK_3,
    statChanges: {
      extraPower: MAGIC_CONSTANTS.EXTRA_POWER_RANK_3,
      POTCHD: MAGIC_CONSTANTS.PERCENT_CURRENT_HP_DAMAGE
    },
    customEffect: (tower: any) => {
      tower.description = tower.inner_desc_init + '\n+ 伤害得到大幅加强，每次攻击附加目标当前生命值 4% 的额外伤害'
      tower.levelAtkFx = TowerManager.BlackMagicTower.a4!
    }
  }
]

// ============================================================================
// 激光塔 (LaserTower) 升级配置
// ============================================================================

const LASER_TOWER_UPGRADES: LevelUpConfig = [
  {
    level: 8,
    rankUp: true,
    name: '高能激光塔',
    imageKey: 'n2',
    descriptionAppend: '\n+ 伤害得到加强',
    borderStyle: TOWER_COLORS.LASER_RANK_1,
    statChanges: { extraFlameDamage: LASER_CONSTANTS.EXTRA_FLAME_DAMAGE.RANK_1 }
  },
  {
    level: 16,
    rankUp: true,
    name: '热能射线塔',
    imageKey: 'n3',
    descriptionAppend: '\n+ 造成额外电浆伤害(无视防御)',
    borderStyle: TOWER_COLORS.LASER_RANK_2,
    statChanges: { extraLuminousDamage: LASER_CONSTANTS.EXTRA_LUMINOUS_DAMAGE.RANK_2 }
  },
  {
    level: 32,
    rankUp: true,
    name: '多重热能射线塔',
    imageKey: 'n4',
    descriptionAppend: '\n+ 发射多束射线',
    borderStyle: TOWER_COLORS.LASER_RANK_3,
    statChanges: {
      extraFlameDamage: LASER_CONSTANTS.EXTRA_FLAME_DAMAGE.RANK_3,
      extraLuminousDamage: LASER_CONSTANTS.EXTRA_LUMINOUS_DAMAGE.RANK_3
    },
    customEffect: (tower: any) => {
      tower.levelSlcFx = TowerManager.LaserTower.s2!
    }
  },
  {
    level: 64,
    rankUp: true,
    name: '巨像',
    imageKey: 'n5',
    descriptionAppend: '\n+ 所有属性得到增强',
    borderStyle: TOWER_COLORS.LASER_RANK_4,
    statChanges: {
      extraFlameDamage: LASER_CONSTANTS.EXTRA_FLAME_DAMAGE.RANK_4,
      extraLuminousDamage: LASER_CONSTANTS.EXTRA_LUMINOUS_DAMAGE.RANK_4,
      extraRange: LASER_CONSTANTS.EXTRA_RANGE_RANK_4,
      extraFlameWidth: LASER_CONSTANTS.EXTRA_FLAME_WIDTH_RANK_4
    },
    customEffect: (tower: any) => {
      tower.levelSlcFx = TowerManager.LaserTower.s3!
      tower.levelHstFx = TowerManager.LaserTower.h2!
    }
  }
]

// ============================================================================
// 升级效果应用工具函数
// ============================================================================

/**
 * 应用升级效果的通用方法
 * 可在各塔类的 levelUp 方法中调用
 */
function applyLevelUpEffects<T extends TowerBase>(tower: T, upgrades: LevelUpConfig<T>, towerConfig: TowerConfig): boolean {
  const upgrade = upgrades.find(u => u.level === tower.level)
  if (!upgrade) return false

  // 触发 rankUp
  if (upgrade.rankUp) {
    tower.rankUp()
  }

  // 更新名称
  if (upgrade.name) {
    tower.name = upgrade.name
  }

  // 更新图片
  if (upgrade.imageKey && towerConfig[upgrade.imageKey as keyof TowerConfig]) {
    tower.image = Game.callImageBitMap(towerConfig[upgrade.imageKey as keyof TowerConfig] as string)
  }

  // 更新描述
  if (upgrade.descriptionAppend) {
    tower.description += upgrade.descriptionAppend
  }
  if (upgrade.descriptionReplace) {
    tower.description = upgrade.descriptionReplace
  }

  // 更新边框颜色
  if (upgrade.borderStyle) {
    tower.borderStyle = upgrade.borderStyle
  }

  // 应用属性变更
  if (upgrade.statChanges) {
    const changes = upgrade.statChanges
    for (const key in changes) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        const value = changes[key as keyof typeof changes]
        if (value !== undefined) {
          ;(tower as any)[key] = value
        }
      }
    }
  }

  // 执行自定义效果
  if (upgrade.customEffect) {
    upgrade.customEffect(tower)
  }

  return true
}
