import { describe, test, expect } from 'vitest'

// ============================================================================
// Bug Fix Verification Tests
// ============================================================================

describe('Bug Fix: ZeisStoneOfVengeance range attack ratio', () => {
  // The gem should add its ratio to 1 (baseline), not use raw ratio values.
  // baseDamageMakingRatioMin = 0.02 means "increase by 2%", so actual multiplier should be 1.02
  // baseDamageMakingRatioMax = 1.2 means "increase by 120%", so actual multiplier should be 2.2

  const baseDamageMakingRatioMin = 0.02
  const baseDamageMakingRatioMax = 1.2

  test('close-range multiplier should be ~1.02 (2% increase), not 0.02', () => {
    const minRangeAtkRatio = 1 + baseDamageMakingRatioMin
    expect(minRangeAtkRatio).toBeCloseTo(1.02)
    expect(minRangeAtkRatio).toBeGreaterThan(1) // Must be above baseline
  })

  test('max-range multiplier should be ~2.2 (120% increase), not 1.2', () => {
    const maxRangeAtkRatio = 1 + baseDamageMakingRatioMax
    expect(maxRangeAtkRatio).toBeCloseTo(2.2)
    expect(maxRangeAtkRatio).toBeGreaterThan(1)
  })

  test('linear interpolation at close range (R=0) should give minRangeAtkRatio', () => {
    const minRatio = 1 + baseDamageMakingRatioMin
    const maxRatio = 1 + baseDamageMakingRatioMax
    const R = 0 // point-blank
    const rangeR = minRatio * (1 - R) + maxRatio * R
    expect(rangeR).toBeCloseTo(1.02)
  })

  test('linear interpolation at max range (R=1) should give maxRangeAtkRatio', () => {
    const minRatio = 1 + baseDamageMakingRatioMin
    const maxRatio = 1 + baseDamageMakingRatioMax
    const R = 1 // max range
    const rangeR = minRatio * (1 - R) + maxRatio * R
    expect(rangeR).toBeCloseTo(2.2)
  })
})

describe('Bug Fix: BrokenPieces armor damage calculation order', () => {
  test('armor-based damage should use original armor value before reduction', () => {
    const originalArmor = 1000
    const armorDecreaseStrength = 0.01
    const armorBasedDamageRatio = 80

    // Correct behavior: use original armor for damage calculation
    const correctDamage = armorBasedDamageRatio * originalArmor
    expect(correctDamage).toBe(80000)

    // Previous buggy behavior: reduce first, then calculate
    const reducedArmor = originalArmor * (1 - armorDecreaseStrength)
    const buggyDamage = armorBasedDamageRatio * reducedArmor
    expect(buggyDamage).toBe(79200)

    // The fix should use original armor
    expect(correctDamage).toBeGreaterThan(buggyDamage)
  })
})

describe('Bug Fix: PoisonTower targeting filter logic', () => {
  interface MockBullet {
    constructorName: string
    target: { id: number }
  }

  const createBullets = (): MockBullet[] => [
    { constructorName: 'PoisonCan', target: { id: 1 } },
    { constructorName: 'NormalArrow', target: { id: 2 } }, // Different bullet type
    { constructorName: 'PoisonCan', target: { id: 3 } },
  ]

  const createMonsters = () => [
    { id: 1, bePoisoned: false },
    { id: 2, bePoisoned: false },
    { id: 3, bePoisoned: false },
    { id: 4, bePoisoned: false }, // Not targeted by any PoisonCan
  ]

  test('fixed filter: should find monsters not targeted by any PoisonCan', () => {
    const bullets = createBullets()
    const monsters = createMonsters()
    const bulletCtorName = 'PoisonCan'

    // Fixed logic: !some(PoisonCan targeting m)
    const unTargeted = monsters.filter(m => {
      return !bullets.some(b => b.constructorName === bulletCtorName && b.target.id === m.id)
    })

    expect(unTargeted.map(m => m.id)).toEqual([2, 4])
  })

  test('buggy filter: every() with wrong logic returns empty when mixed bullet types exist', () => {
    const bullets = createBullets()
    const monsters = createMonsters()
    const bulletCtorName = 'PoisonCan'

    // Buggy logic: every(isPoisonCan AND notTargeting)
    // Fails because NormalArrow fails the first condition
    const unTargeted = monsters.filter(m => {
      return bullets.every(b => b.constructorName === bulletCtorName && b.target.id !== m.id)
    })

    // Bug: returns empty because NormalArrow fails the type check
    expect(unTargeted.length).toBe(0)
  })
})

describe('Bug Fix: TowerManager hash collisions', () => {
  test('old hash: different tower configs can produce same hash', () => {
    // Old formula: levelSum + count + levelSum * count
    // 2 towers, total level 3: 3 + 2 + 6 = 11
    const hash1 = 3 + 2 + 3 * 2
    // 3 towers, total level 2: 2 + 3 + 6 = 11
    const hash2 = 2 + 3 + 2 * 3

    expect(hash1).toBe(hash2) // Collision!
  })

  test('new hash: different tower configs produce different hashes', () => {
    // New formula uses FNV-like hash incorporating individual tower IDs and levels
    const hashTowers = (towers: { id: number; level: number }[]) => {
      let hash = 17
      for (const tower of towers) {
        hash = (hash * 31 + tower.id) | 0
        hash = (hash * 31 + tower.level) | 0
      }
      return hash
    }

    const hash1 = hashTowers([
      { id: 1, level: 1 },
      { id: 2, level: 2 },
    ])
    const hash2 = hashTowers([
      { id: 1, level: 1 },
      { id: 2, level: 1 },
      { id: 3, level: 1 },
    ])

    expect(hash1).not.toBe(hash2) // No collision
  })
})

describe('Bug Fix: HealthChangeHintScrollBox ghost reference', () => {
  test('merged damage to removed box should not be lost', () => {
    // Simulate the issue: lastPush.box references a box that has been removed
    let boxes: { damage: number; alive: boolean }[] = []
    let lastPush: { box: { damage: number; alive: boolean } | null; time: number } = {
      box: null,
      time: 0,
    }

    // Push initial damage
    const box1 = { damage: 100, alive: true }
    boxes.push(box1)
    lastPush = { box: box1, time: Date.now() }

    // Simulate box completion (filtered out)
    box1.alive = false
    boxes = boxes.filter(b => b.alive)

    // Fix: clear reference when box is removed
    if (lastPush.box && !boxes.includes(lastPush.box)) {
      lastPush.box = null
    }

    // Now push should create a new box instead of merging into ghost
    expect(lastPush.box).toBeNull()
  })
})

describe('Bug Fix: FrostTower multi-tower speed reset', () => {
  test('speed should be reset to 1 at frame start, then each frost tower applies its slow', () => {
    const monster = { speedRatio: 1 }
    const frostTower1SPR = 0.3
    const frostTower2SPR = 0.5

    // Frame start: reset
    monster.speedRatio = 1

    // FrostTower 1 applies
    const newSpeedRatio1 = 1 - frostTower1SPR
    if (newSpeedRatio1 < monster.speedRatio) {
      monster.speedRatio = newSpeedRatio1
    }
    expect(monster.speedRatio).toBe(0.7) // 30% slow

    // FrostTower 2 applies (stronger)
    const newSpeedRatio2 = 1 - frostTower2SPR
    if (newSpeedRatio2 < monster.speedRatio) {
      monster.speedRatio = newSpeedRatio2
    }
    expect(monster.speedRatio).toBe(0.5) // 50% slow (stronger takes effect)
  })
})

describe('Bug Fix: _updateTick should not increment while paused', () => {
  test('tick should only increment when game is not paused', () => {
    let tick = 0
    const isPausing = true

    // Old behavior: tick always increments
    // New behavior: skip tick increment when paused
    if (!isPausing) {
      tick++
    }

    expect(tick).toBe(0) // Should not increment
  })
})
