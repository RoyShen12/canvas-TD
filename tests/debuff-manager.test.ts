import { describe, test, expect, beforeEach } from 'vitest'

// ============================================================================
// Inline dependencies (outFile architecture prevents imports)
// ============================================================================

enum DebuffType {
  POISON = 'poison',
  BLEED = 'bleed',
  BURN = 'burn',
  LIGHT_ECHO = 'light_echo',
  SHOCK = 'shock',
  TRANSFORM = 'transform',
  IMPRISON = 'imprison',
  FREEZE = 'freeze',
  CONFUSE = 'confuse',
  IMPRECATE = 'imprecate',
  SLOW = 'slow',
}

enum DebuffCategory {
  DOT = 'dot',
  CONTROL = 'control',
  MODIFIER = 'modifier',
}

interface IDebuff {
  type: DebuffType
  category: DebuffCategory
  remainingTicks: number
  totalTicks: number
  data?: IDebuffData
}

interface IDebuffData {
  chargeAmount?: number
  leakChance?: number
  sourceId?: number
  damageMultiplier?: number
  speedRatio?: number
  dotId?: string
}

interface IDebuffConfig {
  type: DebuffType
  durationTicks: number
  data?: IDebuffData
}

const DEBUFF_CATEGORY_MAP: Record<DebuffType, DebuffCategory> = {
  [DebuffType.POISON]: DebuffCategory.DOT,
  [DebuffType.BLEED]: DebuffCategory.DOT,
  [DebuffType.BURN]: DebuffCategory.DOT,
  [DebuffType.LIGHT_ECHO]: DebuffCategory.DOT,
  [DebuffType.SHOCK]: DebuffCategory.CONTROL,
  [DebuffType.TRANSFORM]: DebuffCategory.CONTROL,
  [DebuffType.IMPRISON]: DebuffCategory.CONTROL,
  [DebuffType.FREEZE]: DebuffCategory.CONTROL,
  [DebuffType.CONFUSE]: DebuffCategory.CONTROL,
  [DebuffType.IMPRECATE]: DebuffCategory.MODIFIER,
  [DebuffType.SLOW]: DebuffCategory.MODIFIER,
}

const CONTROL_DEBUFFS: DebuffType[] = [
  DebuffType.TRANSFORM,
  DebuffType.IMPRISON,
  DebuffType.FREEZE,
  DebuffType.CONFUSE,
]

// ============================================================================
// DebuffManager class (copied from src/systems/debuff-manager.ts)
// ============================================================================

class DebuffManager {
  private debuffs: Map<number, IDebuff[]> = new Map()

  getDebuffs(entityId: number): IDebuff[] {
    return this.debuffs.get(entityId) || []
  }

  hasDebuff(entityId: number, type: DebuffType): boolean {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return false
    return debuffs.some(d => d.type === type)
  }

  getDebuff(entityId: number, type: DebuffType): IDebuff | undefined {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return undefined
    return debuffs.find(d => d.type === type)
  }

  getDebuffsByType(entityId: number, type: DebuffType): IDebuff[] {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return []
    return debuffs.filter(d => d.type === type)
  }

  applyDebuff(entityId: number, config: IDebuffConfig, stackable: boolean = false): void {
    let debuffs = this.debuffs.get(entityId)
    if (!debuffs) {
      debuffs = []
      this.debuffs.set(entityId, debuffs)
    }

    const newDebuff: IDebuff = {
      type: config.type,
      category: DEBUFF_CATEGORY_MAP[config.type],
      remainingTicks: config.durationTicks,
      totalTicks: config.durationTicks,
      data: config.data,
    }

    if (stackable) {
      debuffs.push(newDebuff)
    } else {
      const existing = debuffs.find(d => d.type === config.type)
      if (existing) {
        if (config.durationTicks > existing.remainingTicks) {
          existing.remainingTicks = config.durationTicks
          existing.totalTicks = config.durationTicks
          existing.data = config.data
        }
      } else {
        debuffs.push(newDebuff)
      }
    }
  }

  removeDebuff(entityId: number, type: DebuffType): void {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return

    const filtered = debuffs.filter(d => d.type !== type)
    if (filtered.length === 0) {
      this.debuffs.delete(entityId)
    } else {
      this.debuffs.set(entityId, filtered)
    }
  }

  tick(entityId: number): void {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return

    for (const debuff of debuffs) {
      debuff.remainingTicks--
    }

    const remaining = debuffs.filter(d => d.remainingTicks > 0)
    if (remaining.length === 0) {
      this.debuffs.delete(entityId)
    } else if (remaining.length !== debuffs.length) {
      this.debuffs.set(entityId, remaining)
    }
  }

  clearEntity(entityId: number): void {
    this.debuffs.delete(entityId)
  }

  isTrapped(entityId: number): boolean {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return false
    return debuffs.some(d => CONTROL_DEBUFFS.includes(d.type))
  }

  isImmobilized(entityId: number): boolean {
    return this.hasDebuff(entityId, DebuffType.FREEZE) ||
           this.hasDebuff(entityId, DebuffType.IMPRISON)
  }

  getSpeedModifier(entityId: number): number {
    if (this.isImmobilized(entityId)) {
      return 0
    }

    if (this.hasDebuff(entityId, DebuffType.CONFUSE)) {
      return -0.5
    }

    const slowDebuffs = this.getDebuffsByType(entityId, DebuffType.SLOW)
    if (slowDebuffs.length === 0) {
      return 1
    }

    let minRatio = 1
    for (const debuff of slowDebuffs) {
      const ratio = debuff.data?.speedRatio ?? 1
      if (ratio < minRatio) {
        minRatio = ratio
      }
    }
    return minRatio
  }

  getDamageMultiplier(entityId: number): number {
    const curseDebuffs = this.getDebuffsByType(entityId, DebuffType.IMPRECATE)
    if (curseDebuffs.length === 0) {
      return 1
    }

    let multiplier = 1
    for (const debuff of curseDebuffs) {
      multiplier *= debuff.data?.damageMultiplier ?? 1
    }
    return multiplier
  }

  getActiveDebuffTypes(entityId: number): DebuffType[] {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return []

    const types = new Set<DebuffType>()
    for (const debuff of debuffs) {
      types.add(debuff.type)
    }
    return Array.from(types)
  }

  getShockData(entityId: number): { chargeAmount: number; leakChance: number; sourceId: number } | null {
    const shock = this.getDebuff(entityId, DebuffType.SHOCK)
    if (!shock || !shock.data) return null

    return {
      chargeAmount: shock.data.chargeAmount ?? 0,
      leakChance: shock.data.leakChance ?? 0,
      sourceId: shock.data.sourceId ?? 0,
    }
  }

  getLightEchoIds(entityId: number): string[] {
    const echoDebuffs = this.getDebuffsByType(entityId, DebuffType.LIGHT_ECHO)
    return echoDebuffs
      .map(d => d.data?.dotId)
      .filter((id): id is string => id !== undefined)
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('DebuffManager', () => {
  let manager: DebuffManager
  const ENTITY_ID = 1

  beforeEach(() => {
    manager = new DebuffManager()
  })

  // --------------------------------------------------------------------------
  // Basic CRUD
  // --------------------------------------------------------------------------

  describe('Basic CRUD', () => {
    test('getDebuffs() returns empty array for unknown entity', () => {
      expect(manager.getDebuffs(999)).toEqual([])
    })

    test('applyDebuff() adds a debuff', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })

      const debuffs = manager.getDebuffs(ENTITY_ID)
      expect(debuffs).toHaveLength(1)
      expect(debuffs[0].type).toBe(DebuffType.POISON)
      expect(debuffs[0].category).toBe(DebuffCategory.DOT)
      expect(debuffs[0].remainingTicks).toBe(60)
      expect(debuffs[0].totalTicks).toBe(60)
    })

    test('hasDebuff() returns true after apply, false before', () => {
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.POISON)).toBe(false)

      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })

      expect(manager.hasDebuff(ENTITY_ID, DebuffType.POISON)).toBe(true)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BLEED)).toBe(false)
    })

    test('getDebuff() returns the debuff', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.BURN, durationTicks: 30 })

      const debuff = manager.getDebuff(ENTITY_ID, DebuffType.BURN)
      expect(debuff).toBeDefined()
      expect(debuff!.type).toBe(DebuffType.BURN)
      expect(debuff!.remainingTicks).toBe(30)

      expect(manager.getDebuff(ENTITY_ID, DebuffType.FREEZE)).toBeUndefined()
    })

    test('removeDebuff() removes specific type', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.BURN, durationTicks: 30 })

      manager.removeDebuff(ENTITY_ID, DebuffType.POISON)

      expect(manager.hasDebuff(ENTITY_ID, DebuffType.POISON)).toBe(false)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BURN)).toBe(true)
    })

    test('removeDebuff() cleans up entity when last debuff removed', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })

      manager.removeDebuff(ENTITY_ID, DebuffType.POISON)

      // Internal map should no longer have the entity key
      expect(manager.getDebuffs(ENTITY_ID)).toEqual([])
    })

    test('clearEntity() removes all debuffs', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.BURN, durationTicks: 30 })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.SLOW, durationTicks: 120, data: { speedRatio: 0.5 } })

      manager.clearEntity(ENTITY_ID)

      expect(manager.getDebuffs(ENTITY_ID)).toEqual([])
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.POISON)).toBe(false)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BURN)).toBe(false)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.SLOW)).toBe(false)
    })
  })

  // --------------------------------------------------------------------------
  // Stacking behavior
  // --------------------------------------------------------------------------

  describe('Stacking behavior', () => {
    test('non-stackable (default): applying same type refreshes duration (takes longer)', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 30 })

      // Simulate some ticks passing
      for (let i = 0; i < 10; i++) {
        manager.tick(ENTITY_ID)
      }

      // Remaining should be 20
      expect(manager.getDebuff(ENTITY_ID, DebuffType.POISON)!.remainingTicks).toBe(20)

      // Re-apply with longer duration
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 50 })

      const debuffs = manager.getDebuffsByType(ENTITY_ID, DebuffType.POISON)
      expect(debuffs).toHaveLength(1)
      expect(debuffs[0].remainingTicks).toBe(50)
      expect(debuffs[0].totalTicks).toBe(50)
    })

    test('non-stackable: does NOT refresh if new duration is shorter', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })

      // Re-apply with shorter duration; should not overwrite
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 20 })

      const debuffs = manager.getDebuffsByType(ENTITY_ID, DebuffType.POISON)
      expect(debuffs).toHaveLength(1)
      expect(debuffs[0].remainingTicks).toBe(60)
    })

    test('stackable: applying same type adds another instance', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.SLOW, durationTicks: 60, data: { speedRatio: 0.7 } }, true)
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.SLOW, durationTicks: 30, data: { speedRatio: 0.5 } }, true)

      const debuffs = manager.getDebuffsByType(ENTITY_ID, DebuffType.SLOW)
      expect(debuffs).toHaveLength(2)
      expect(debuffs[0].data!.speedRatio).toBe(0.7)
      expect(debuffs[1].data!.speedRatio).toBe(0.5)
    })

    test('getDebuffsByType() returns all stacked instances', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.IMPRECATE, durationTicks: 100, data: { damageMultiplier: 1.5 },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.IMPRECATE, durationTicks: 80, data: { damageMultiplier: 1.3 },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.IMPRECATE, durationTicks: 50, data: { damageMultiplier: 2.0 },
      }, true)

      const debuffs = manager.getDebuffsByType(ENTITY_ID, DebuffType.IMPRECATE)
      expect(debuffs).toHaveLength(3)
      expect(debuffs.map(d => d.data!.damageMultiplier)).toEqual([1.5, 1.3, 2.0])
    })
  })

  // --------------------------------------------------------------------------
  // Tick and expiry
  // --------------------------------------------------------------------------

  describe('Tick and expiry', () => {
    test('tick() decrements remainingTicks', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 10 })

      manager.tick(ENTITY_ID)

      expect(manager.getDebuff(ENTITY_ID, DebuffType.POISON)!.remainingTicks).toBe(9)
    })

    test('tick() removes expired debuffs (remainingTicks reaches 0)', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 1 })

      manager.tick(ENTITY_ID)

      expect(manager.hasDebuff(ENTITY_ID, DebuffType.POISON)).toBe(false)
      expect(manager.getDebuffs(ENTITY_ID)).toEqual([])
    })

    test('tick() keeps non-expired debuffs', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 5 })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.BURN, durationTicks: 10 })

      // Tick 5 times: POISON expires, BURN survives
      for (let i = 0; i < 5; i++) {
        manager.tick(ENTITY_ID)
      }

      expect(manager.hasDebuff(ENTITY_ID, DebuffType.POISON)).toBe(false)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BURN)).toBe(true)
      expect(manager.getDebuff(ENTITY_ID, DebuffType.BURN)!.remainingTicks).toBe(5)
    })

    test('tick() on entity with no debuffs is a no-op', () => {
      // Should not throw
      manager.tick(999)

      expect(manager.getDebuffs(999)).toEqual([])
    })

    test('multiple debuffs expire at different times', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 2 })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.BURN, durationTicks: 4 })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.BLEED, durationTicks: 6 })

      // After 2 ticks: POISON expires
      manager.tick(ENTITY_ID)
      manager.tick(ENTITY_ID)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.POISON)).toBe(false)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BURN)).toBe(true)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BLEED)).toBe(true)

      // After 4 ticks total: BURN expires
      manager.tick(ENTITY_ID)
      manager.tick(ENTITY_ID)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BURN)).toBe(false)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BLEED)).toBe(true)

      // After 6 ticks total: BLEED expires
      manager.tick(ENTITY_ID)
      manager.tick(ENTITY_ID)
      expect(manager.hasDebuff(ENTITY_ID, DebuffType.BLEED)).toBe(false)
      expect(manager.getDebuffs(ENTITY_ID)).toEqual([])
    })
  })

  // --------------------------------------------------------------------------
  // Speed modifier
  // --------------------------------------------------------------------------

  describe('Speed modifier', () => {
    test('no debuffs returns 1', () => {
      expect(manager.getSpeedModifier(ENTITY_ID)).toBe(1)
    })

    test('FREEZE returns 0', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.FREEZE, durationTicks: 60 })

      expect(manager.getSpeedModifier(ENTITY_ID)).toBe(0)
    })

    test('IMPRISON returns 0', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.IMPRISON, durationTicks: 60 })

      expect(manager.getSpeedModifier(ENTITY_ID)).toBe(0)
    })

    test('CONFUSE returns -0.5', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.CONFUSE, durationTicks: 60 })

      expect(manager.getSpeedModifier(ENTITY_ID)).toBe(-0.5)
    })

    test('SLOW with speedRatio 0.5 returns 0.5', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SLOW, durationTicks: 60, data: { speedRatio: 0.5 },
      })

      expect(manager.getSpeedModifier(ENTITY_ID)).toBe(0.5)
    })

    test('multiple SLOW debuffs returns the lowest speedRatio (strongest)', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SLOW, durationTicks: 60, data: { speedRatio: 0.7 },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SLOW, durationTicks: 30, data: { speedRatio: 0.3 },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SLOW, durationTicks: 45, data: { speedRatio: 0.5 },
      }, true)

      expect(manager.getSpeedModifier(ENTITY_ID)).toBe(0.3)
    })

    test('FREEZE takes priority over SLOW', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SLOW, durationTicks: 60, data: { speedRatio: 0.5 },
      })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.FREEZE, durationTicks: 30 })

      // FREEZE causes immobilization, which returns 0 before SLOW is checked
      expect(manager.getSpeedModifier(ENTITY_ID)).toBe(0)
    })
  })

  // --------------------------------------------------------------------------
  // Damage multiplier
  // --------------------------------------------------------------------------

  describe('Damage multiplier', () => {
    test('no curses returns 1', () => {
      expect(manager.getDamageMultiplier(ENTITY_ID)).toBe(1)
    })

    test('single IMPRECATE with damageMultiplier 1.5 returns 1.5', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.IMPRECATE, durationTicks: 100, data: { damageMultiplier: 1.5 },
      })

      expect(manager.getDamageMultiplier(ENTITY_ID)).toBe(1.5)
    })

    test('multiple IMPRECATE stack multiplicatively (1.5 * 1.3 = 1.95)', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.IMPRECATE, durationTicks: 100, data: { damageMultiplier: 1.5 },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.IMPRECATE, durationTicks: 80, data: { damageMultiplier: 1.3 },
      }, true)

      expect(manager.getDamageMultiplier(ENTITY_ID)).toBeCloseTo(1.95, 10)
    })
  })

  // --------------------------------------------------------------------------
  // Control checks
  // --------------------------------------------------------------------------

  describe('Control checks', () => {
    test('isTrapped() - true for TRANSFORM, IMPRISON, FREEZE, CONFUSE', () => {
      for (const type of CONTROL_DEBUFFS) {
        const mgr = new DebuffManager()
        mgr.applyDebuff(ENTITY_ID, { type, durationTicks: 60 })

        expect(mgr.isTrapped(ENTITY_ID)).toBe(true)
      }
    })

    test('isTrapped() - false for POISON, SLOW, etc.', () => {
      const nonControlTypes: DebuffType[] = [
        DebuffType.POISON,
        DebuffType.BLEED,
        DebuffType.BURN,
        DebuffType.LIGHT_ECHO,
        DebuffType.SHOCK,
        DebuffType.IMPRECATE,
        DebuffType.SLOW,
      ]

      for (const type of nonControlTypes) {
        const mgr = new DebuffManager()
        mgr.applyDebuff(ENTITY_ID, { type, durationTicks: 60 })

        expect(mgr.isTrapped(ENTITY_ID)).toBe(false)
      }
    })

    test('isImmobilized() - true only for FREEZE and IMPRISON', () => {
      const freezeMgr = new DebuffManager()
      freezeMgr.applyDebuff(ENTITY_ID, { type: DebuffType.FREEZE, durationTicks: 60 })
      expect(freezeMgr.isImmobilized(ENTITY_ID)).toBe(true)

      const imprisonMgr = new DebuffManager()
      imprisonMgr.applyDebuff(ENTITY_ID, { type: DebuffType.IMPRISON, durationTicks: 60 })
      expect(imprisonMgr.isImmobilized(ENTITY_ID)).toBe(true)
    })

    test('isImmobilized() - false for TRANSFORM, CONFUSE, and non-control', () => {
      const nonImmobilizing: DebuffType[] = [
        DebuffType.TRANSFORM,
        DebuffType.CONFUSE,
        DebuffType.POISON,
        DebuffType.SLOW,
      ]

      for (const type of nonImmobilizing) {
        const mgr = new DebuffManager()
        mgr.applyDebuff(ENTITY_ID, { type, durationTicks: 60 })

        expect(mgr.isImmobilized(ENTITY_ID)).toBe(false)
      }
    })
  })

  // --------------------------------------------------------------------------
  // Active debuff types
  // --------------------------------------------------------------------------

  describe('Active debuff types', () => {
    test('getActiveDebuffTypes() returns unique types', () => {
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.BURN, durationTicks: 30 })
      // Add a stacked SLOW (same type twice)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SLOW, durationTicks: 60, data: { speedRatio: 0.7 },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SLOW, durationTicks: 30, data: { speedRatio: 0.5 },
      }, true)

      const types = manager.getActiveDebuffTypes(ENTITY_ID)

      // Should have 3 unique types, not 4
      expect(types).toHaveLength(3)
      expect(types).toContain(DebuffType.POISON)
      expect(types).toContain(DebuffType.BURN)
      expect(types).toContain(DebuffType.SLOW)
    })

    test('empty for unknown entity', () => {
      expect(manager.getActiveDebuffTypes(999)).toEqual([])
    })
  })

  // --------------------------------------------------------------------------
  // Shock data
  // --------------------------------------------------------------------------

  describe('Shock data', () => {
    test('getShockData() returns correct data', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.SHOCK,
        durationTicks: 60,
        data: { chargeAmount: 5, leakChance: 0.3, sourceId: 42 },
      })

      const shockData = manager.getShockData(ENTITY_ID)

      expect(shockData).not.toBeNull()
      expect(shockData!.chargeAmount).toBe(5)
      expect(shockData!.leakChance).toBe(0.3)
      expect(shockData!.sourceId).toBe(42)
    })

    test('getShockData() returns null when no shock debuff', () => {
      expect(manager.getShockData(ENTITY_ID)).toBeNull()

      // Also null when entity has other debuffs but not shock
      manager.applyDebuff(ENTITY_ID, { type: DebuffType.POISON, durationTicks: 60 })
      expect(manager.getShockData(ENTITY_ID)).toBeNull()
    })
  })

  // --------------------------------------------------------------------------
  // Light echo IDs
  // --------------------------------------------------------------------------

  describe('Light echo IDs', () => {
    test('getLightEchoIds() returns DOT IDs from all light echo debuffs', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.LIGHT_ECHO,
        durationTicks: 60,
        data: { dotId: 'dot_abc' },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.LIGHT_ECHO,
        durationTicks: 30,
        data: { dotId: 'dot_xyz' },
      }, true)

      const ids = manager.getLightEchoIds(ENTITY_ID)

      expect(ids).toHaveLength(2)
      expect(ids).toContain('dot_abc')
      expect(ids).toContain('dot_xyz')
    })

    test('getLightEchoIds() returns empty array when no light echo debuffs', () => {
      expect(manager.getLightEchoIds(ENTITY_ID)).toEqual([])
    })

    test('getLightEchoIds() skips entries without dotId', () => {
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.LIGHT_ECHO,
        durationTicks: 60,
        data: { dotId: 'dot_abc' },
      }, true)
      manager.applyDebuff(ENTITY_ID, {
        type: DebuffType.LIGHT_ECHO,
        durationTicks: 30,
        // No dotId in data
        data: {},
      }, true)

      const ids = manager.getLightEchoIds(ENTITY_ID)

      expect(ids).toHaveLength(1)
      expect(ids[0]).toBe('dot_abc')
    })
  })
})
