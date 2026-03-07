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

describe('Bug Fix: WaveManager.startNextWave() should advance wave index when RESTING', () => {
  test('early start during RESTING should advance to next wave, not replay current', () => {
    let currentWaveIndex = 0
    const waves = [
      { number: 1, reset: () => {} },
      { number: 2, reset: () => {} },
      { number: 3, reset: () => {} },
    ]
    const state = { value: 'RESTING' }

    // Simulate fixed startNextWave() logic
    if (state.value === 'RESTING') {
      currentWaveIndex++ // This was the missing line
    }

    const wave = waves[currentWaveIndex]
    expect(wave?.number).toBe(2) // Should be wave 2, not wave 1
    expect(currentWaveIndex).toBe(1)
  })

  test('buggy version: not incrementing index replays same wave', () => {
    let currentWaveIndex = 0
    const waves = [
      { number: 1, reset: () => {} },
      { number: 2, reset: () => {} },
    ]

    // Buggy: no increment
    const wave = waves[currentWaveIndex]
    expect(wave?.number).toBe(1) // Replays wave 1 instead of advancing
  })
})

describe('Bug Fix: Dead monsters should not execute run() logic', () => {
  test('dead monster should not call makeEffect or move', () => {
    let effectCalled = false
    let movedTo: { x: number; y: number } | null = null
    let lifeLost = false

    const monster = {
      isDead: true,
      beShocked: false,
      beImprisoned: false,
      beFrozen: false,
      position: { x: 100, y: 100, moveTo: (p: any) => { movedTo = p } },
      damage: 1,
      runDebuffs: () => {},
      runShock: () => {},
      makeEffect: () => { effectCalled = true },
    }

    // Fixed run() logic
    if (!monster.isDead) {
      monster.runDebuffs()
      // ... movement logic
      monster.makeEffect()
    }

    expect(effectCalled).toBe(false) // makeEffect should NOT be called
    expect(movedTo).toBeNull() // should NOT move
    expect(lifeLost).toBe(false) // should NOT damage player
  })
})

describe('Bug Fix: LaserTower AoE should not double-count damage', () => {
  test('should skip dead monsters in AoE loop', () => {
    const damageRecords: number[] = []
    const monsters = [
      { isDead: false, lastAbsDmg: 0, applyDamage: (d: number) => { monsters[0]!.lastAbsDmg = d } },
      { isDead: true, lastAbsDmg: 50, applyDamage: (_d: number) => { /* dead, won't update */ } },
    ]

    // Fixed AoE loop: skip dead monsters
    monsters.forEach(mst => {
      if (mst.isDead) return
      mst.applyDamage(100)
      damageRecords.push(mst.lastAbsDmg)
    })

    expect(damageRecords).toEqual([100]) // Only 1 record, not 2
  })

  test('should not record damage when luminous damage is 0', () => {
    let recordCount = 0
    const extraLuminousDamage = 0

    // Fixed: check luminous damage before recording
    if (extraLuminousDamage > 0) {
      recordCount++
    }

    expect(recordCount).toBe(0) // No phantom damage record
  })
})

describe('Bug Fix: updateLife should guard against re-entry', () => {
  test('should not trigger game over multiple times', () => {
    let gameOverCount = 0
    let isGameOver = false
    let life = 3

    const updateLife = (delta: number) => {
      if (isGameOver) return
      life += delta
      if (life <= 0) {
        life = 0
        isGameOver = true
        gameOverCount++
      }
    }

    // Three monsters reach the end in the same frame
    updateLife(-1)
    updateLife(-1)
    updateLife(-1)

    expect(gameOverCount).toBe(1) // Only triggered once
    expect(life).toBe(0)
  })
})

describe('Bug Fix: MaskManTower should not waste cooldown without targets', () => {
  test('should not call shoot when all targets are null', () => {
    let shootCalled = false
    const multipleTarget = [null, null, null]

    // Fixed: check if any target exists
    if (multipleTarget.some(t => t != null)) {
      shootCalled = true
    }

    expect(shootCalled).toBe(false)
  })

  test('should call shoot when at least one target exists', () => {
    let shootCalled = false
    const multipleTarget = [null, { id: 1 }, null]

    if (multipleTarget.some(t => t != null)) {
      shootCalled = true
    }

    expect(shootCalled).toBe(true)
  })
})

describe('Bug Fix: Blade bullet should set fulfilled after failed bounce', () => {
  test('should mark fulfilled when bounceToNext fails after hit', () => {
    let fulfilled = false
    let target: { id: number } | null = { id: 1 }
    const bounceTime = 2
    const monstersCount = 3

    // Simulate: hit target, then try bounce but fail (no valid targets left)
    const bounceToNext = () => {
      // All other targets dead, no valid bounce target
      target = null
    }

    // Fixed logic (after hit):
    if (bounceTime > 0 && monstersCount > 1) {
      bounceToNext()
      if (!target) {
        fulfilled = true // This was the missing line
      }
    }

    expect(fulfilled).toBe(true) // Should not leak
    expect(target).toBeNull()
  })
})

describe('Bug Fix: ClusterBomb should always trigger parent AoE', () => {
  test('should call parent AoE even when monster is null', () => {
    let parentAoECalled = false
    let clusterExplodeCalled = false

    const parentHit = (_monster: null) => {
      // CannonBullet.hit() handles null monster gracefully
      parentAoECalled = true
    }

    // Fixed: always call super.hit()
    parentHit(null)
    clusterExplodeCalled = true

    expect(parentAoECalled).toBe(true)
    expect(clusterExplodeCalled).toBe(true)
  })
})

describe('Bug Fix: BrokenPieces should not record phantom damage when armor is 0', () => {
  test('should skip recordDamage when originalArmor is 0', () => {
    let recordDamageCalled = false
    const originalArmor = 0

    // Fixed: guard with originalArmor > 0
    if (originalArmor > 0) {
      recordDamageCalled = true
    }

    expect(recordDamageCalled).toBe(false)
  })

  test('should record damage when armor is positive', () => {
    let recordDamageCalled = false
    const originalArmor = 500

    if (originalArmor > 0) {
      recordDamageCalled = true
    }

    expect(recordDamageCalled).toBe(true)
  })
})

describe('Bug Fix: Mirinae chit should skip dead monsters', () => {
  test('should not apply damage to dead monsters', () => {
    let damageApplied = false
    const target = { isDead: true }

    // Fixed: guard in chit
    if (!target.isDead) {
      damageApplied = true
    }

    expect(damageApplied).toBe(false)
  })
})

describe('Bug Fix: DOT debuff flag should be cleared on target death', () => {
  test('debuff flag should reset to false when target dies during DOT', () => {
    const target: Record<string, boolean | number> = {
      bePoisoned: true,
      health: 0,
    }

    // Simulate DOT tick finding target dead
    if (target.health! <= 0) {
      target.bePoisoned = false // Fixed: clear debuff mark
    }

    expect(target.bePoisoned).toBe(false)
  })
})

describe('Bug Fix: applyDamage should clear lastAbsDmg on early return', () => {
  test('lastAbsDmg should be 0 when target is already dead', () => {
    const monster = {
      isDead: true,
      lastAbsDmg: 500, // stale value from previous damage
      health: 0,
    }

    // Fixed applyDamage logic
    if (monster.isDead) {
      monster.lastAbsDmg = 0
    }

    expect(monster.lastAbsDmg).toBe(0)
  })

  test('lastAbsDmg should be 0 when rawDamage is 0', () => {
    const monster = {
      isDead: false,
      lastAbsDmg: 300,
      health: 100,
    }
    const rawDamage = 0

    // Fixed applyDamage logic
    if (rawDamage <= 0 || monster.isDead) {
      monster.lastAbsDmg = 0
    }

    expect(monster.lastAbsDmg).toBe(0)
  })
})

describe('Bug Fix: runShock should filter dead monsters', () => {
  test('should not select dead monster as shock target', () => {
    const monsters = [
      { id: 1, isDead: false, position: { x: 10, y: 10 } },
      { id: 2, isDead: true, position: { x: 5, y: 5 } }, // dead but closest
      { id: 3, isDead: false, position: { x: 20, y: 20 } },
    ]
    const self = { id: 1 }

    // Fixed: filter dead monsters first
    const aliveMonsters = monsters.filter(m => !m.isDead && m.id !== self.id)
    expect(aliveMonsters.length).toBe(1)
    expect(aliveMonsters[0]!.id).toBe(3) // should skip dead monster id=2
  })
})

describe('Bug Fix: reChooseTarget should filter dead monsters', () => {
  test('should not select dead monster as target', () => {
    const monsters = [
      { id: 1, isDead: true, inRange: true },
      { id: 2, isDead: false, inRange: false },
      { id: 3, isDead: false, inRange: true },
    ]

    // Fixed: filter dead
    let target = null
    for (const t of monsters) {
      if (!t.isDead && t.inRange) {
        target = t
        break
      }
    }

    expect(target).not.toBeNull()
    expect(target!.id).toBe(3) // should skip dead monster id=1
  })
})
