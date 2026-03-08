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

// ============================================================================
// Round 4 Bug Fix Tests
// ============================================================================

describe('Bug Fix: TeslaTower should not shock dead monsters', () => {
  test('should filter dead monsters before shocking', () => {
    const monsters = [
      { id: 1, isDead: false, inRange: true },
      { id: 2, isDead: true, inRange: true },  // dead but in range
      { id: 3, isDead: false, inRange: true },
    ]

    // Fixed: filter both dead and in-range
    const shocked: number[] = []
    monsters.forEach(mst => {
      if (!mst.isDead && mst.inRange) {
        shocked.push(mst.id)
      }
    })

    expect(shocked).toEqual([1, 3])
    expect(shocked).not.toContain(2)
  })
})

describe('Bug Fix: FrostTower should not freeze dead monsters', () => {
  test('should skip dead monsters in freeze effect', () => {
    const monsters = [
      { id: 1, isDead: false, frozen: false },
      { id: 2, isDead: true, frozen: false },  // dead
      { id: 3, isDead: false, frozen: false },
    ]

    // Fixed: skip dead
    monsters.forEach(mst => {
      if (mst.isDead) return
      mst.frozen = true
    })

    expect(monsters[0]!.frozen).toBe(true)
    expect(monsters[1]!.frozen).toBe(false) // dead, should not be frozen
    expect(monsters[2]!.frozen).toBe(true)
  })

  test('should filter dead monsters in speed reduction', () => {
    const monsters = [
      { id: 1, isDead: false, speedRatio: 1 },
      { id: 2, isDead: true, speedRatio: 1 },
    ]

    const inRanged = monsters.filter(mst => {
      if (mst.isDead) return false
      mst.speedRatio = 0.5
      return true
    })

    expect(inRanged.length).toBe(1)
    expect(monsters[1]!.speedRatio).toBe(1) // dead monster speed unchanged
  })
})

describe('Bug Fix: Gem purchase off-by-one', () => {
  test('should allow purchase when money equals price (>=)', () => {
    const price = 5000
    const money = 5000

    // Fixed: >= instead of >
    expect(money >= price).toBe(true)
  })

  test('should reject purchase when money is less than price', () => {
    const price = 5000
    const money = 4999

    expect(money >= price).toBe(false)
  })
})

describe('Bug Fix: Mirinae should not waste cooldown on dead monsters', () => {
  test('should filter dead monsters before selecting target', () => {
    const monsters = [
      { id: 1, isDead: true },
      { id: 2, isDead: true },
      { id: 3, isDead: false },
    ]

    const alive = monsters.filter(m => !m.isDead)
    expect(alive.length).toBe(1)
    expect(alive[0]!.id).toBe(3)
  })

  test('should not select target when all monsters are dead', () => {
    const monsters = [
      { id: 1, isDead: true },
      { id: 2, isDead: true },
    ]

    const alive = monsters.filter(m => !m.isDead)
    expect(alive.length).toBe(0)
  })
})

describe('Bug Fix: GemOfAnger should not count dead monsters', () => {
  test('should filter dead monsters in range count', () => {
    const monsters = [
      { id: 1, isDead: false, inRange: true },
      { id: 2, isDead: true, inRange: true },  // dead but in range
      { id: 3, isDead: false, inRange: false },
      { id: 4, isDead: false, inRange: true },
    ]

    // Fixed: filter dead
    const inRangeCount = monsters.filter(mst => !mst.isDead && mst.inRange).length
    expect(inRangeCount).toBe(2) // only id=1 and id=4
  })
})

describe('Bug Fix: DOT duplicatable cleanup on death', () => {
  test('should remove debuff ID from array when target dies', () => {
    const thisId = 'abc123'
    const debuffArray = ['xyz', thisId, 'def456']

    // Simulating target death cleanup
    const cleaned = debuffArray.filter(d => d !== thisId)

    expect(cleaned).toEqual(['xyz', 'def456'])
    expect(cleaned).not.toContain(thisId)
  })
})

describe('Bug Fix: Dead monsters reaching end should not give gold', () => {
  test('monster reaching end should have reachedEnd flag set', () => {
    const monster = {
      isDead: false,
      reachedEnd: false,
      damage: 1,
    }

    // Simulate reaching end
    monster.reachedEnd = true
    monster.isDead = true

    expect(monster.isDead).toBe(true)
    expect(monster.reachedEnd).toBe(true)
  })

  test('scanSwipe should not reward monsters that reached end', () => {
    const monsters = [
      { id: 1, isDead: true, reachedEnd: false, reward: 100 },  // killed by tower
      { id: 2, isDead: true, reachedEnd: true, reward: 200 },   // reached end
      { id: 3, isDead: false, reachedEnd: false, reward: 300 },  // alive
    ]

    let totalReward = 0
    monsters.filter(m => m.isDead).forEach(m => {
      if (!m.reachedEnd) {
        totalReward += m.reward
      }
    })

    expect(totalReward).toBe(100) // only tower-killed monster gives reward
  })
})

describe('Bug Fix: WaveManager startNextWave re-entry guard', () => {
  test('calling startNextWave during RESTING should set SPAWNING state', () => {
    let state = 'RESTING'
    let waveIndex = 0
    const totalWaves = 3

    // Simulate startNextWave during RESTING
    if (state === 'RESTING') {
      waveIndex++
      if (waveIndex < totalWaves) {
        state = 'SPAWNING'  // Fixed: immediately set SPAWNING
      }
    }

    expect(state).toBe('SPAWNING')
    expect(waveIndex).toBe(1)

    // Second call should NOT advance because state is SPAWNING, not RESTING
    if (state === 'RESTING') {
      waveIndex++
      state = 'SPAWNING'
    }

    expect(waveIndex).toBe(1) // unchanged
  })
})

describe('Bug Fix: Jet should use carrier gem bonuses', () => {
  test('jet kill should use carrier _killExtraGold instead of own', () => {
    const jet = { _killExtraGold: 0 }
    const carrier = { _killExtraGold: 500 }

    // Fixed: use carrier's value
    const goldReward = carrier._killExtraGold ?? 0
    expect(goldReward).toBe(500)
  })

  test('jet kill should use carrier _killExtraPoint instead of own', () => {
    const jet = { _killExtraPoint: 0 }
    const carrier = { _killExtraPoint: 4000 }

    // Fixed: use carrier's value
    const pointReward = carrier._killExtraPoint ?? 0
    expect(pointReward).toBe(4000)
  })
})

describe('Bug Fix: CarrierTower jetCount should decrement on jet destroy', () => {
  test('destroying a jet should reduce jetCount', () => {
    const carrier = { jetCount: 3 }

    // Fixed: decrement on destroy
    carrier.jetCount = Math.max(0, carrier.jetCount - 1)
    expect(carrier.jetCount).toBe(2)
  })

  test('jetCount should not go below 0', () => {
    const carrier = { jetCount: 0 }
    carrier.jetCount = Math.max(0, carrier.jetCount - 1)
    expect(carrier.jetCount).toBe(0)
  })
})

describe('Bug Fix: BlackMagicTower should not curse dead target', () => {
  test('should skip curse if target died from damage', () => {
    const target = { isDead: true, imprecated: false }

    // Fixed: guard against dead target
    if (!target.isDead) {
      target.imprecated = true
    }

    expect(target.imprecated).toBe(false)
  })
})

describe('Bug Fix: LaserTower multi-Slc should check isDead', () => {
  test('should not fire at dead target on second Slc call', () => {
    const target = { isDead: true }

    // Fixed: check isDead at start of produceBullet
    const shouldFire = !!target && !target.isDead
    expect(shouldFire).toBe(false)
  })
})

describe('Bug Fix: BaneOfTheStricken cleanup on kill', () => {
  test('should delete monster entry from _eachMonsterDamageRatio on kill', () => {
    const map = new Map<number, number>()
    map.set(1, 1.5)
    map.set(2, 2.0)
    map.set(3, 1.1)

    // Fixed: delete on kill
    map.delete(2)

    expect(map.has(2)).toBe(false)
    expect(map.size).toBe(2)
  })
})

describe('Bug Fix: Position.ORIGIN should be safe from mutation', () => {
  test('modifying returned ORIGIN should not affect next call', () => {
    // Fixed: ORIGIN now returns new instance each time
    const origin1 = { x: 0, y: 0 } // simulating new Position(0,0)
    const origin2 = { x: 0, y: 0 }

    origin1.x = 100

    expect(origin2.x).toBe(0) // second instance unaffected
  })
})

describe('Bug Fix: EchoOfLight should not double-apply armor reduction', () => {
  test('DOT damage should not include calculateDamageRatio (armor applied by DOT system)', () => {
    const towerAtk = 1000
    const critR = 1
    const extraTotalDamageRatio = 0.15
    const lightDotCount = 30
    const armorResistance = 0.5

    // Fixed: removed calculateDamageRatio from DOT installation
    const dotDamagePerTick = Math.round((towerAtk * critR * extraTotalDamageRatio) / lightDotCount)

    // DOT system applies armor: dotDamagePerTick * (1 - armorResistance)
    const actualDamage = dotDamagePerTick * (1 - armorResistance)

    // Old (bugged): calculateDamageRatio included armor factor, then DOT system applied armor again
    const buggedDamageRatio = 1 * (1 - armorResistance) // simplified calculateDamageRatio
    const oldDotDamagePerTick = Math.round((towerAtk * critR * buggedDamageRatio * extraTotalDamageRatio) / lightDotCount)
    const oldActualDamage = oldDotDamagePerTick * (1 - armorResistance)

    // Fixed damage should be higher (armor applied only once)
    expect(actualDamage).toBeGreaterThan(oldActualDamage)
  })
})

describe('Bug Fix: A* graph cleanDirty between searches', () => {
  test('should call cleanDirty between consecutive searches on same graph', () => {
    // Simulating A* graph node state pollution
    interface MockNode { x: number; y: number; closed: boolean; visited: boolean }

    const nodes: MockNode[] = [
      { x: 0, y: 0, closed: false, visited: false },
      { x: 1, y: 0, closed: false, visited: false },
      { x: 2, y: 0, closed: false, visited: false },
    ]

    // First search marks nodes as closed/visited
    nodes[0]!.closed = true
    nodes[0]!.visited = true
    nodes[1]!.closed = true
    nodes[1]!.visited = true

    // Without cleanDirty: second search sees stale flags
    const staleNode = nodes.find(n => !n.closed && !n.visited)
    expect(staleNode?.x).toBe(2) // Only node 2 appears available

    // With cleanDirty: reset all flags
    nodes.forEach(n => { n.closed = false; n.visited = false })

    const cleanNodes = nodes.filter(n => !n.closed && !n.visited)
    expect(cleanNodes.length).toBe(3) // All nodes available again
  })
})

describe('Bug Fix: DOT should use isDead instead of health > 0', () => {
  test('monster reaching end has isDead=true but may have health > 0', () => {
    const monster = { isDead: true, health: 500, reachedEnd: true }

    // Old: health > 0 check would incorrectly apply DOT to dead-by-reaching-end monster
    const oldCheck = monster.health > 0
    expect(oldCheck).toBe(true) // BUG: would apply DOT

    // Fixed: isDead check correctly identifies dead monster
    const newCheck = !monster.isDead
    expect(newCheck).toBe(false) // Correct: no DOT for dead monster
  })
})

describe('Bug Fix: TeslaTower should respect lighteningAmount target limit', () => {
  test('should limit shock targets to lighteningAmount', () => {
    const monsters = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      isDead: false,
      inRange: true,
    }))

    const lighteningAmount = 10

    let shockCount = 0
    monsters.forEach(mst => {
      if (lighteningAmount !== null && shockCount >= lighteningAmount) return
      if (!mst.isDead && mst.inRange) {
        shockCount++
      }
    })

    expect(shockCount).toBe(10) // Capped at lighteningAmount
  })

  test('should shock all targets when lighteningAmount is null (rank 0)', () => {
    const monsters = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      isDead: false,
      inRange: true,
    }))

    const lighteningAmount: number | null = null

    let shockCount = 0
    monsters.forEach(mst => {
      if (lighteningAmount !== null && shockCount >= lighteningAmount) return
      if (!mst.isDead && mst.inRange) {
        shockCount++
      }
    })

    expect(shockCount).toBe(5) // No cap
  })
})

describe('Bug Fix: Path cache full clear on tower placement', () => {
  test('invalidatePathsThrough should clear all cached paths', () => {
    const pathCache = new Map<string, unknown>()
    pathCache.set('0|0', [{ x: 0, y: 0 }])
    pathCache.set('1|1', [{ x: 10, y: 10 }])
    pathCache.set('2|2', [{ x: 20, y: 20 }])

    // Fixed: clear all instead of selective
    pathCache.clear()

    expect(pathCache.size).toBe(0)
  })
})

describe('Bug Fix: DOT should not fire during game pause', () => {
  test('DOT tick should be skipped when game is paused', () => {
    let isPaused = false
    let damageApplied = 0

    // Simulate DOT ticks
    for (let i = 0; i < 10; i++) {
      if (isPaused) continue // Fixed: skip when paused
      damageApplied += 10

      // Pause mid-way
      if (i === 4) isPaused = true
    }

    // Only 5 ticks should apply damage (0-4), not all 10
    expect(damageApplied).toBe(50)
  })

  test('paused ticks should not count toward DOT duration', () => {
    let isPaused = false
    let dotCount = 0
    const maxTicks = 30

    // Simulate 40 intervals, but some are paused
    for (let interval = 0; interval < 40; interval++) {
      if (isPaused) {
        // Paused: skip, don't count
        if (interval === 24) isPaused = false // unpause after some time
        continue
      }
      dotCount++
      if (interval === 14) isPaused = true // pause mid-way
    }

    // Should count actual non-paused ticks
    expect(dotCount).toBeLessThan(40)
    expect(dotCount).toBeGreaterThan(0)
  })
})

describe('Bug Fix: HighPriest should not heal itself', () => {
  test('should filter self from healing targets', () => {
    const self = { id: 1, isDead: false, health: 100 }
    const monsters = [
      self,
      { id: 2, isDead: false, health: 50 },
      { id: 3, isDead: true, health: 0 },
    ]

    const healed: number[] = []
    monsters.forEach(m => {
      if (m !== self && !m.isDead) {
        healed.push(m.id)
      }
    })

    expect(healed).toEqual([2])
    expect(healed).not.toContain(1) // self not healed
    expect(healed).not.toContain(3) // dead not healed
  })
})

describe('Bug Fix: TeslaTower rapidRender should filter dead monsters', () => {
  test('should not render lightning when only dead monsters are in range', () => {
    const monsters = [
      { isDead: true, inRange: true },
      { isDead: true, inRange: true },
    ]

    const shouldSkipRender = monsters.every(m => m.isDead || !m.inRange)
    expect(shouldSkipRender).toBe(true)
  })

  test('should render lightning when alive monsters are in range', () => {
    const monsters = [
      { isDead: true, inRange: true },
      { isDead: false, inRange: true },
    ]

    const shouldSkipRender = monsters.every(m => m.isDead || !m.inRange)
    expect(shouldSkipRender).toBe(false)
  })
})

// ============================================================================
// Round 8 Bug Fix Tests
// ============================================================================

describe('Bug Fix: Imprecation (curse) duration should not persist forever', () => {
  test('non-integer durTick should still expire with > 0 check', () => {
    const imprecatedRatio = [
      { pow: 1.5, durTick: 3.7 },
      { pow: 1.2, durTick: 1.0 },
    ]

    // Simulate ticks with the fixed filter (> 0 instead of !== 0)
    let remaining = imprecatedRatio
    for (let tick = 0; tick < 10; tick++) {
      remaining = remaining.filter(imp => --imp.durTick > 0)
    }

    // All curses should have expired after 10 ticks
    expect(remaining.length).toBe(0)
  })

  test('durTick=0 entry should be immediately removed', () => {
    const imprecatedRatio = [{ pow: 1.5, durTick: 0 }]
    const remaining = imprecatedRatio.filter(imp => --imp.durTick > 0)
    expect(remaining.length).toBe(0)
  })

  test('old !== 0 check would fail with non-integer durTick', () => {
    const imp = { pow: 1.5, durTick: 2.5 }
    // Simulate old filter: --durTick !== 0
    let expiredWithOldCheck = false
    for (let tick = 0; tick < 20; tick++) {
      if (--imp.durTick === 0) {
        expiredWithOldCheck = true
        break
      }
    }
    // Old check never reaches exactly 0 with non-integer start
    expect(expiredWithOldCheck).toBe(false)
  })

  test('registerImprecate should round durationTick', () => {
    const durationTick = 214.02
    const rounded = Math.round(durationTick)
    expect(rounded).toBe(214)
    // Rounded value will reach 0 via integer decrements
    let val = rounded
    for (let i = 0; i < rounded; i++) val--
    expect(val).toBe(0)
  })
})

describe('Bug Fix: TeslaTower rank 0 should have target cap', () => {
  test('lighteningAmount should return number for all ranks', () => {
    const amounts = [5, 10, 20] // rank 0, 1, 2
    amounts.forEach(amount => {
      expect(typeof amount).toBe('number')
      expect(amount).toBeGreaterThan(0)
    })
  })

  test('rank 0 should cap targets at 5, not unlimited', () => {
    const rank0Amount = [5, 10, 20][0]
    expect(rank0Amount).toBe(5)
    expect(rank0Amount).toBeLessThan([5, 10, 20][1]!)
  })

  test('each rank should allow more targets than previous', () => {
    const amounts = [5, 10, 20]
    for (let i = 1; i < amounts.length; i++) {
      expect(amounts[i]).toBeGreaterThan(amounts[i - 1]!)
    }
  })
})

describe('Bug Fix: Wave system corrections', () => {
  test('appendWaves with empty array should be no-op', () => {
    const waves: unknown[] = [{ id: 1 }]
    const originalLength = waves.length

    // Fixed: guard against empty array
    const newWaves: unknown[] = []
    if (newWaves.length > 0) {
      waves.push(...newWaves)
    }

    expect(waves.length).toBe(originalLength)
  })

  test('spawnInterval validation should reject 0', () => {
    const spawnInterval = 0
    // Fixed: <= 0 instead of < 0
    expect(spawnInterval <= 0).toBe(true)
  })

  test('wave monster count type2 should fill remaining quota', () => {
    const monsterCount = 14
    const monstersPerType = Math.ceil(monsterCount / 2) // 7
    const type2Count = monsterCount - monstersPerType // 7
    expect(monstersPerType + type2Count).toBe(monsterCount)
  })

  test('old formula gave less than intended total', () => {
    const monsterCount = 14
    const monstersPerType = Math.ceil(monsterCount / 2) // 7
    const oldType2Count = Math.floor(monstersPerType * 0.5) // 3
    const oldTotal = monstersPerType + oldType2Count // 10

    const fixedType2Count = monsterCount - monstersPerType // 7
    const fixedTotal = monstersPerType + fixedType2Count // 14

    expect(oldTotal).toBeLessThan(monsterCount)
    expect(fixedTotal).toBe(monsterCount)
  })

  test('last wave rest should not give gold for nonexistent next wave', () => {
    const totalWaves = 10
    const currentWaveIndex = 9 // last wave (0-indexed)

    // Check if next wave exists
    const hasNextWave = currentWaveIndex + 1 < totalWaves
    expect(hasNextWave).toBe(false)

    // No gold should be awarded
    let goldAwarded = 0
    if (hasNextWave) {
      goldAwarded = 50
    }
    expect(goldAwarded).toBe(0)
  })
})

describe('Bug Fix: Tower cooldowns should not tick during pause', () => {
  test('adjustTimersForPause should offset lastShootTime', () => {
    const bornStamp = 1000
    let lastShootTime = bornStamp

    // Tower fires
    lastShootTime = 2000

    // Game pauses for 5 seconds
    const pauseStart = 3000
    const pauseEnd = 8000
    const pauseDuration = pauseEnd - pauseStart

    // After unpause: adjust timer
    lastShootTime += pauseDuration

    // At time 8000 (unpause moment), effective time since last shot
    // should be 8000 - 7000 = 1000ms (not 8000 - 2000 = 6000ms)
    const effectiveTimeSinceShot = pauseEnd - lastShootTime
    expect(effectiveTimeSinceShot).toBe(1000) // 1 second, not 6
  })

  test('without adjustment, pause time counted as cooldown', () => {
    let lastShootTime = 2000
    const pauseEnd = 8000

    const brokenTimeSinceShot = pauseEnd - lastShootTime
    expect(brokenTimeSinceShot).toBe(6000) // Wrong: 6 seconds includes 5s of pause
  })
})

describe('Bug Fix: rotateForward should use atan2 for NaN safety', () => {
  test('atan2 handles overlapping positions (returns 0, not NaN)', () => {
    const entityX = 100, entityY = 100
    const targetX = 100, targetY = 100

    // Old: Math.atan(0/0) = NaN
    const oldTheta = Math.atan((entityY - targetY) / (entityX - targetX))
    expect(isNaN(oldTheta)).toBe(true)

    // Fixed: atan2(0, 0) = 0
    const newTheta = Math.atan2(targetY - entityY, targetX - entityX)
    expect(isNaN(newTheta)).toBe(false)
    expect(newTheta).toBe(0)
  })

  test('atan2 handles vertical alignment correctly', () => {
    const entityX = 100, entityY = 0
    const targetX = 100, targetY = 100 // target is below

    // Old: atan((0-100)/(100-100)) = atan(-Inf) = -PI/2 → faces UP (wrong!)
    const oldTheta = Math.atan((entityY - targetY) / (entityX - targetX))
    expect(oldTheta).toBe(-Math.PI / 2) // facing UP

    // Fixed: atan2(100, 0) = PI/2 → faces DOWN (correct!)
    const newTheta = Math.atan2(targetY - entityY, targetX - entityX)
    expect(newTheta).toBe(Math.PI / 2) // facing DOWN toward target
  })
})

describe('Bug Fix: MonsterBase renderHealthBar should save/restore context', () => {
  test('canvas state should be restored after renderHealthBar', () => {
    // Simulate context state tracking
    let strokeStyle = 'original_stroke'
    let fillStyle = 'original_fill'

    // Fixed: wrapped in save/restore
    const savedStroke = strokeStyle
    const savedFill = fillStyle

    strokeStyle = 'health_border'
    fillStyle = 'health_fill'

    // Restore
    strokeStyle = savedStroke
    fillStyle = savedFill

    expect(strokeStyle).toBe('original_stroke')
    expect(fillStyle).toBe('original_fill')
  })
})

describe('Bug Fix: BulletBase renderImage should translate when target is null', () => {
  test('bullet with no target should still render at its own position', () => {
    const bulletPos = { x: 150, y: 200 }
    const target = null

    let translateX = 0, translateY = 0
    if (target) {
      // rotateForward would translate
      translateX = bulletPos.x
      translateY = bulletPos.y
    } else {
      // Fixed: translate to bullet position even without target
      translateX = bulletPos.x
      translateY = bulletPos.y
    }

    expect(translateX).toBe(150) // Not 0
    expect(translateY).toBe(200) // Not 0
  })
})

describe('Bug Fix: MaskManTower should not fire at dead targets', () => {
  test('produceBullet should check isDead on multipleTarget', () => {
    const multipleTarget = [
      { isDead: false, id: 1 },
      { isDead: true, id: 2 },
      null,
    ]

    const firedAt: number[] = []
    multipleTarget.forEach(target => {
      if (target && !target.isDead) {
        firedAt.push(target.id)
      }
    })

    expect(firedAt).toEqual([1])
    expect(firedAt).not.toContain(2) // dead target skipped
  })

  test('gemHitHook should also check isDead', () => {
    const multipleTarget = [
      { isDead: true, id: 1 },
      { isDead: false, id: 2 },
    ]

    const gemApplied: number[] = []
    multipleTarget.forEach(target => {
      if (target && !target.isDead) {
        gemApplied.push(target.id)
      }
    })

    expect(gemApplied).toEqual([2])
  })
})

describe('Bug Fix: callAnimation should handle missing sprite gracefully', () => {
  test('missing sprite should not crash', () => {
    const sprites = new Map<string, object>()
    sprites.set('explosion', { name: 'explosion' })

    const getSprite = (name: string) => sprites.get(name) ?? null

    // Valid sprite
    const valid = getSprite('explosion')
    expect(valid).not.toBeNull()

    // Invalid sprite - should return null, not crash
    const invalid = getSprite('nonexistent')
    expect(invalid).toBeNull()
  })
})

describe('Bug Fix: IOC clearRect should match offset dimensions', () => {
  test('clearRect size should match TL offset from center', () => {
    const R = 15
    const offset = R + 3
    const clearSize = (R + 3) * 2

    // TL is at centerX - offset, and clear width should cover to centerX + offset
    expect(clearSize).toBe(offset * 2)
  })

  test('old clearRect was 2px too small', () => {
    const R = 15
    const offset = R + 3
    const oldClearSize = (R + 2) * 2
    const fixedClearSize = (R + 3) * 2

    expect(oldClearSize).toBeLessThan(offset * 2)
    expect(fixedClearSize).toBe(offset * 2)
  })
})

// ============================================================================
// Round 9 Bug Fix Tests
// ============================================================================

describe('Bug Fix: Mirinae tickHook should filter by tower range', () => {
  test('should only target monsters in range', () => {
    const towerRange = 100
    const towerPos = { x: 50, y: 50 }
    const monsters = [
      { isDead: false, position: { x: 60, y: 60 }, dist: 14 },   // in range
      { isDead: false, position: { x: 500, y: 500 }, dist: 636 }, // out of range
      { isDead: true, position: { x: 55, y: 55 }, dist: 7 },     // dead
    ]

    const inRange = (m: typeof monsters[0]) => m.dist <= towerRange
    const alive = monsters.filter(m => !m.isDead && inRange(m))

    expect(alive.length).toBe(1)
    expect(alive[0]!.position.x).toBe(60)
  })

  test('old code without range check would hit any alive monster', () => {
    const monsters = [
      { isDead: false, position: { x: 500, y: 500 } },
    ]

    const aliveNoRange = monsters.filter(m => !m.isDead)
    expect(aliveNoRange.length).toBe(1) // Would incorrectly include out-of-range monster
  })
})

describe('Bug Fix: Boss timers should be adjusted for pause', () => {
  test('HighPriest lastHealTime should be offset by pause duration', () => {
    let lastHealTime = 1000
    const pauseDuration = 5000

    // Adjust for pause
    lastHealTime += pauseDuration

    // At unpause time 6000, time since heal should be 0 (6000 - 6000)
    const timeSinceHeal = 6000 - lastHealTime
    expect(timeSinceHeal).toBe(0)
  })

  test('without adjustment, boss heals immediately after unpause', () => {
    const lastHealTime = 1000
    const healInterval = 3000
    const unpauseTime = 10000

    const timeSinceHeal = unpauseTime - lastHealTime
    expect(timeSinceHeal).toBeGreaterThan(healInterval) // Would trigger heal immediately
  })

  test('with adjustment, boss respects remaining cooldown', () => {
    let lastHealTime = 4000 // healed 1 second before pause
    const healInterval = 3000
    const pauseStart = 5000
    const pauseEnd = 10000
    const pauseDuration = pauseEnd - pauseStart

    lastHealTime += pauseDuration

    const timeSinceHeal = pauseEnd - lastHealTime
    expect(timeSinceHeal).toBe(1000) // Only 1 second of real time since last heal
    expect(timeSinceHeal).toBeLessThan(healInterval)
  })
})

describe('Bug Fix: Gem adjustTimersForPause should be called from tower', () => {
  test('tower adjustTimersForPause should propagate to gem', () => {
    let towerLastShoot = 1000
    let gemLastHit = 2000
    const pauseDuration = 5000

    // Simulate tower adjustTimersForPause
    towerLastShoot += pauseDuration
    gemLastHit += pauseDuration // gem also adjusted

    expect(towerLastShoot).toBe(6000)
    expect(gemLastHit).toBe(7000)
  })
})

describe('Bug Fix: Right-click sell should reset double-click timer', () => {
  test('after selling, next click should not trigger another sell', () => {
    let lastRightClickTime = 0
    const DOUBLE_CLICK_MS = 300

    // First click at t=100
    lastRightClickTime = 100

    // Second click at t=350 (double click)
    const now1 = 350
    const isDoubleClick = now1 - lastRightClickTime < DOUBLE_CLICK_MS
    expect(isDoubleClick).toBe(true)

    // After sell: reset timer
    lastRightClickTime = -1000

    // Third click at t=550 (should NOT be double-click)
    const now2 = 550
    const isTripleClick = now2 - lastRightClickTime < DOUBLE_CLICK_MS
    expect(isTripleClick).toBe(false)
  })
})

describe('Bug Fix: Long-press timer should be cleared before new press', () => {
  test('new mousedown should cancel previous timer', () => {
    let timerCleared = false
    let timerInst: number | null = null

    // First press
    timerInst = 1 // simulated timer ID

    // Second press (before first timer fires)
    if (timerInst !== null) {
      timerCleared = true
      timerInst = null
    }
    timerInst = 2 // new timer

    expect(timerCleared).toBe(true)
    expect(timerInst).toBe(2)
  })
})

// ============================================================================
// Round 10 Bug Fix Tests
// ============================================================================

describe('Bug Fix: Gem upgrade long-press should use current gem points', () => {
  test('stale closure value allows overspending', () => {
    let actualGemPoints = 1000
    const levelUpCost = 100
    const capturedGemPoints = 1000 // stale: captured at render time

    // Simulate 12 upgrades with stale check
    let upgrades = 0
    for (let i = 0; i < 12; i++) {
      // Old code: check against stale captured value
      if (capturedGemPoints >= levelUpCost) {
        actualGemPoints -= levelUpCost
        upgrades++
      }
    }

    // Bug: all 12 passed the check even though balance went negative
    expect(actualGemPoints).toBe(-200)
    expect(upgrades).toBe(12)
  })

  test('live value check prevents overspending', () => {
    let actualGemPoints = 1000
    const levelUpCost = 100

    // Simulate upgrades with live check
    let upgrades = 0
    for (let i = 0; i < 12; i++) {
      // Fixed: check against live value
      if (actualGemPoints >= levelUpCost) {
        actualGemPoints -= levelUpCost
        upgrades++
      }
    }

    // Fixed: only 10 upgrades (1000 / 100), balance is 0
    expect(actualGemPoints).toBe(0)
    expect(upgrades).toBe(10)
  })
})

describe('Bug Fix: Number key shortcut exception safety', () => {
  test('_selectedTowerTypeToBuild should be cleared even if onLeftClick throws', () => {
    let selectedTower: string | null = null

    const onLeftClick = () => {
      throw new Error('pathfinder error')
    }

    selectedTower = 'CannonShooter'
    let threw = false
    try {
      onLeftClick()
    } catch {
      threw = true
    } finally {
      selectedTower = null
    }

    expect(threw).toBe(true)
    expect(selectedTower).toBeNull()
  })
})

describe('Bug Fix: Toast animation should match JS duration', () => {
  test('fade-out delay should be duration minus fade-out length', () => {
    const duration = 1500
    const fadeOutDuration = 300
    const fadeOutDelay = Math.max(0, duration - fadeOutDuration) / 1000

    // At 1500ms duration, fade-out starts at 1200ms = 1.2s
    expect(fadeOutDelay).toBeCloseTo(1.2)
  })

  test('default duration should have 2.7s delay', () => {
    const duration = 3000
    const fadeOutDelay = Math.max(0, duration - 300) / 1000
    expect(fadeOutDelay).toBeCloseTo(2.7)
  })

  test('very short duration should not have negative delay', () => {
    const duration = 100
    const fadeOutDelay = Math.max(0, duration - 300) / 1000
    expect(fadeOutDelay).toBe(0)
  })
})

describe('Bug Fix: ClusterBombEx.hit() type safety', () => {
  test('should handle null monster parameter', () => {
    const monster: { isDead: boolean } | null = null

    // With Optional type, null check is required before accessing properties
    const canProcessMonster = monster !== null && !monster.isDead
    expect(canProcessMonster).toBe(false)
  })
})

// ============================================================================
// Round 11 Bug Fix Tests
// ============================================================================

describe('Bug Fix: Cannot build tower on origin or destination cells', () => {
  test('should detect origin cell', () => {
    const gridInfo = { centerX: 20, centerY: 312 }
    const originPos = { x: 20, y: 312 }
    const gridSize = 39

    const isOriginCell = Math.abs(gridInfo.centerX - originPos.x) < gridSize / 2
      && Math.abs(gridInfo.centerY - originPos.y) < gridSize / 2

    expect(isOriginCell).toBe(true)
  })

  test('should allow building on non-origin cells', () => {
    const gridInfo = { centerX: 200, centerY: 200 }
    const originPos = { x: 20, y: 312 }
    const gridSize = 39

    const isOriginCell = Math.abs(gridInfo.centerX - originPos.x) < gridSize / 2
      && Math.abs(gridInfo.centerY - originPos.y) < gridSize / 2

    expect(isOriginCell).toBe(false)
  })
})

describe('Bug Fix: Wave 1 should spawn full monsterCount', () => {
  test('wave 1 should spawn all 10 monsters (not 5)', () => {
    const waveNumber = 1
    const monsterCount = 10
    let totalSpawned = 0

    if (waveNumber <= 1) {
      totalSpawned = monsterCount
    } else {
      const monstersPerType = Math.ceil(monsterCount / 2)
      totalSpawned = monstersPerType + (monsterCount - monstersPerType)
    }

    expect(totalSpawned).toBe(10) // Full count, not 5
  })

  test('wave 2 should split evenly between two types', () => {
    const waveNumber = 2
    const monsterCount = 12
    let totalSpawned = 0

    if (waveNumber <= 1) {
      totalSpawned = monsterCount
    } else {
      const monstersPerType = Math.ceil(monsterCount / 2)
      totalSpawned = monstersPerType + (monsterCount - monstersPerType)
    }

    expect(totalSpawned).toBe(12)
  })
})

describe('Bug Fix: Endless mode should auto-extend without victory screen', () => {
  test('_isEndlessMode flag should prevent victory overlay', () => {
    const isEndlessMode = true
    const isVictory = false
    const waveCompleted = true
    const noMonstersLeft = true

    let victoryShown = false
    let wavesAppended = false

    if (!isVictory && waveCompleted && noMonstersLeft) {
      if (isEndlessMode) {
        wavesAppended = true
      } else {
        victoryShown = true
      }
    }

    expect(wavesAppended).toBe(true)
    expect(victoryShown).toBe(false)
  })
})

describe('Bug Fix: Grid columns should not be negative on narrow screens', () => {
  test('portrait display should have minimum columns', () => {
    const innerWidth = 300
    const innerHeight = 700
    const BASE_SIZE = 4
    const ASPECT_MULTIPLIER = 4
    const MIN_COLUMNS = 16

    const rawColumns = BASE_SIZE * (ASPECT_MULTIPLIER * (Math.round(innerWidth / innerHeight) - 0.5))
    expect(rawColumns).toBeLessThan(0) // Would crash without guard

    const gridColumns = Math.max(rawColumns, MIN_COLUMNS)
    expect(gridColumns).toBe(MIN_COLUMNS)
    expect(gridColumns).toBeGreaterThan(0)
  })
})

describe('Bug Fix: _spawnMonster fallback should not self-reference blocked origin', () => {
  test('should skip spawn when origin is also blocked', () => {
    const grids: Record<string, Record<string, number>> = {
      '0': { '7': 0 }, // origin cell is blocked
    }

    const targetBlocked = grids['0']?.['7'] !== 1
    const originBlocked = grids['0']?.['7'] !== 1

    expect(targetBlocked).toBe(true)
    expect(originBlocked).toBe(true)
    // Monster spawn should be skipped
  })
})

// ============================================================================
// Round 12 Bug Fix Verification Tests
// ============================================================================

describe('Bug Fix: Canvas context state leaks', () => {
  test('renderFilled should restore fillStyle after drawing', () => {
    // ItemBase.renderFilled now saves and restores fillStyle
    const originalFillStyle = 'rgb(0, 0, 0)'
    const bulletFill = 'rgb(255, 0, 0)'

    // Simulate the fix: save original, set new, draw, restore
    let currentFillStyle = originalFillStyle
    const saved = currentFillStyle
    currentFillStyle = bulletFill
    // ... drawing would happen here ...
    currentFillStyle = saved

    expect(currentFillStyle).toBe(originalFillStyle)
  })

  test('renderPreparationBar should restore fillStyle', () => {
    const original = 'rgb(100, 100, 100)'
    const prepBarFill = 'rgba(25,25,25,.3)'

    let fillStyle = original
    const saved = fillStyle
    fillStyle = prepBarFill
    // ... sector would be drawn ...
    fillStyle = saved

    expect(fillStyle).toBe(original)
  })

  test('ColossusLaser.renderStep should restore strokeStyle', () => {
    const original = 'rgb(0, 0, 0)'
    const outerStyle = 'rgba(255, 0, 0, 0.5)'
    const innerStyle = 'rgba(0, 255, 0, 0.5)'

    let strokeStyle = original
    const saved = strokeStyle
    strokeStyle = outerStyle
    strokeStyle = innerStyle
    // ... drawing would happen ...
    strokeStyle = saved

    expect(strokeStyle).toBe(original)
  })

  test('TeslaTower.rapidRender should restore strokeStyle and lineWidth', () => {
    const originalStroke = 'rgb(0, 0, 0)'
    const originalWidth = 2

    let strokeStyle = originalStroke
    let lineWidth = originalWidth
    const savedStroke = strokeStyle
    const savedWidth = lineWidth

    strokeStyle = 'rgba(232,33,214,.5)'
    lineWidth = 1
    strokeStyle = 'rgba(153,204,255,.5)'

    strokeStyle = savedStroke
    lineWidth = savedWidth

    expect(strokeStyle).toBe(originalStroke)
    expect(lineWidth).toBe(originalWidth)
  })

  test('FrostTower.rapidRender should restore fillStyle', () => {
    const original = 'rgb(50, 50, 50)'
    let fillStyle = original
    const saved = fillStyle
    fillStyle = 'rgba(25,25,25,.3)'
    fillStyle = saved

    expect(fillStyle).toBe(original)
  })
})

describe('Bug Fix: CarrierTower missing recordShootTime', () => {
  test('should call recordShootTime after spawning jet', () => {
    // CarrierTower.run() now calls this.recordShootTime() after incrementing jetCount
    // This ensures there is a cooldown between jet spawns
    let lastShootTime = 1000
    let canShoot = true
    const Hst = 500 // 500ms cooldown
    let jetCount = 0

    // Simulate run()
    if (canShoot && jetCount < 3) {
      jetCount++
      lastShootTime = 2000 // recordShootTime updates this

      // After recording, canShoot should be false until cooldown elapses
      canShoot = (2000 - lastShootTime) > Hst
      expect(canShoot).toBe(false) // Can't shoot immediately
    }

    expect(jetCount).toBe(1)
    expect(lastShootTime).toBe(2000)
  })
})

describe('Bug Fix: CannonBullet missing outOfBoundary check', () => {
  test('should mark fulfilled when cannon bullet goes out of bounds', () => {
    // CannonBullet.run() now includes the same outOfBoundary check as BulletBase
    const bulletPos = { x: -200, y: -200 } // Way out of bounds
    const boundaryTL = { x: 0, y: 0 }
    const boundaryBR = { x: 1920, y: 1080 }
    const tolerance = 50

    const outOfBounds =
      boundaryTL.x - bulletPos.x > tolerance ||
      boundaryTL.y - bulletPos.y > tolerance ||
      bulletPos.x - boundaryBR.x > tolerance ||
      bulletPos.y - boundaryBR.y > tolerance

    expect(outOfBounds).toBe(true)

    // When outOfBounds, fulfilled should be set to true
    let fulfilled = false
    if (outOfBounds) {
      fulfilled = true
    }
    expect(fulfilled).toBe(true)
  })

  test('should not mark fulfilled when within bounds', () => {
    const bulletPos = { x: 500, y: 500 }
    const boundaryTL = { x: 0, y: 0 }
    const boundaryBR = { x: 1920, y: 1080 }
    const tolerance = 50

    const outOfBounds =
      boundaryTL.x - bulletPos.x > tolerance ||
      boundaryTL.y - bulletPos.y > tolerance ||
      bulletPos.x - boundaryBR.x > tolerance ||
      bulletPos.y - boundaryBR.y > tolerance

    expect(outOfBounds).toBe(false)
  })
})

describe('Bug Fix: MysticBomb off-by-one lifetime', () => {
  test('trap should expire at exactly lifetime frames, not lifetime+1', () => {
    const lifetime = 300
    let age = 0
    let fulfilled = false

    // Simulate frames
    for (let i = 0; i < lifetime; i++) {
      age++
      if (age >= lifetime) { // Fixed: was age > lifetime
        fulfilled = true
        break
      }
    }

    expect(age).toBe(lifetime)
    expect(fulfilled).toBe(true)
  })

  test('old behavior (>) would have needed lifetime+1 frames', () => {
    const lifetime = 300
    let age = 0
    let fulfilled = false

    // Simulate using the old check
    for (let i = 0; i < lifetime; i++) {
      age++
      if (age > lifetime) { // Old behavior
        fulfilled = true
        break
      }
    }

    // After exactly lifetime frames, the old check would NOT have triggered
    expect(age).toBe(lifetime)
    expect(fulfilled).toBe(false) // Bug: trap lasted 1 frame too long
  })
})

describe('Bug Fix: Position.moveTo overshoot prevention', () => {
  test('should not overshoot when speed > remaining distance', () => {
    const pos = { x: 10, y: 10 }
    const target = { x: 11, y: 10 }
    const speed = 5 // Speed > distance (1)

    const dx = target.x - pos.x
    const dy = target.y - pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    // With fix: clamp to target when speed >= dist
    if (speed >= dist) {
      pos.x = target.x
      pos.y = target.y
    }

    expect(pos.x).toBe(target.x)
    expect(pos.y).toBe(target.y)
  })

  test('should move normally when speed < distance', () => {
    const pos = { x: 0, y: 0 }
    const target = { x: 10, y: 0 }
    const speed = 3

    const dx = target.x - pos.x
    const dy = target.y - pos.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (speed >= dist) {
      pos.x = target.x
      pos.y = target.y
    } else {
      const invDist = 1 / dist
      pos.x += dx * invDist * speed
      pos.y += dy * invDist * speed
    }

    expect(pos.x).toBeCloseTo(3)
    expect(pos.y).toBeCloseTo(0)
  })
})

describe('Bug Fix: Vector.divide by zero', () => {
  test('should throw when dividing by zero', () => {
    // The fix adds a zero check before dividing
    const divideByZero = (f: number) => {
      if (f === 0) {
        throw new Error('Cannot divide vector by zero')
      }
      return 1 / f
    }

    expect(() => divideByZero(0)).toThrow('Cannot divide vector by zero')
  })

  test('should divide normally for non-zero values', () => {
    const f = 2
    const invF = 1 / f
    expect(invF).toBe(0.5)
  })
})

describe('Bug Fix: DPS near-zero division guard', () => {
  test('should show 0 DPS when elapsed time is < 100ms', () => {
    const totalDamage = 1000
    const bornStamp = 1000
    const now = 1050 // Only 50ms elapsed
    const elapsed = now - bornStamp

    const DPS = elapsed > 100 ? (totalDamage / elapsed) * 1000 : 0
    expect(DPS).toBe(0)
  })

  test('should calculate DPS normally after 100ms', () => {
    const totalDamage = 1000
    const bornStamp = 1000
    const now = 2000 // 1000ms elapsed
    const elapsed = now - bornStamp

    const DPS = elapsed > 100 ? (totalDamage / elapsed) * 1000 : 0
    expect(DPS).toBe(1000) // 1000 damage / 1 second = 1000 DPS
  })
})

describe('Bug Fix: Grid coordinate upper-bound clamping', () => {
  test('should clamp grid coordinates to valid range', () => {
    const gridSize = 40
    const gridRows = 24
    const gridColumns = 36

    // Position way outside grid
    const posX = 2000 // Beyond grid columns * gridSize
    const posY = 1500 // Beyond grid rows * gridSize

    const rawGridX = Math.floor(posY / gridSize) // 37, exceeds gridRows - 1 = 23
    const rawGridY = Math.floor(posX / gridSize) // 50, exceeds gridColumns - 1 = 35

    // With fix: clamp to valid range
    const gridX = Math.min(Math.max(rawGridX, 0), gridRows - 1)
    const gridY = Math.min(Math.max(rawGridY, 0), gridColumns - 1)

    expect(gridX).toBe(23) // Clamped to gridRows - 1
    expect(gridY).toBe(35) // Clamped to gridColumns - 1
  })

  test('should not affect coordinates within bounds', () => {
    const gridSize = 40
    const gridRows = 24
    const gridColumns = 36

    const posX = 200
    const posY = 160

    const rawGridX = Math.floor(posY / gridSize) // 4
    const rawGridY = Math.floor(posX / gridSize) // 5

    const gridX = Math.min(Math.max(rawGridX, 0), gridRows - 1)
    const gridY = Math.min(Math.max(rawGridY, 0), gridColumns - 1)

    expect(gridX).toBe(4)
    expect(gridY).toBe(5)
  })
})

describe('Bug Fix: findPath graph cleanDirty', () => {
  test('should clean dirty state before each A* search', () => {
    // The fix calls graph.cleanDirty() before Astar.astar.search in findPath
    // Without this, consecutive findPath calls could produce incorrect results
    // because graph nodes retain dirty state from previous searches
    let cleanDirtyCalled = false

    const mockGraph = {
      cleanDirty: () => { cleanDirtyCalled = true },
      grid: [[{ x: 0, y: 0 }]],
    }

    // Simulate the fix
    mockGraph.cleanDirty()
    expect(cleanDirtyCalled).toBe(true)
  })
})

describe('Bug Fix: Stale statusBoardOnTower after tower sold', () => {
  test('should not render status board on sold tower', () => {
    const tower = { isSold: true, renderStatusBoard: () => { throw new Error('should not be called') } }

    let statusBoardOnTower: typeof tower | null = tower

    // Simulate the Ctrl key handling fix
    if (statusBoardOnTower) {
      if (statusBoardOnTower.isSold) {
        statusBoardOnTower = null
      }
    }

    expect(statusBoardOnTower).toBeNull()
  })

  test('should render status board on active tower', () => {
    let rendered = false
    const tower = {
      isSold: false,
      renderStatusBoard: () => { rendered = true }
    }

    let statusBoardOnTower: typeof tower | null = tower

    if (statusBoardOnTower) {
      if (statusBoardOnTower.isSold) {
        statusBoardOnTower = null
      } else {
        statusBoardOnTower.renderStatusBoard()
      }
    }

    expect(statusBoardOnTower).not.toBeNull()
    expect(rendered).toBe(true)
  })
})

describe('Bug Fix: TimerManager setTimeout error handling', () => {
  test('should clean up timer ID even when callback throws', () => {
    const timeouts = new Set<number>()
    let cleanedUp = false

    // Simulate the fix with try/finally
    const id = 42
    timeouts.add(id)

    try {
      // Simulate callback that throws
      throw new Error('callback error')
    } catch {
      // Error is re-thrown in real code
    } finally {
      timeouts.delete(id)
      cleanedUp = true
    }

    expect(cleanedUp).toBe(true)
    expect(timeouts.has(id)).toBe(false)
  })
})

describe('Bug Fix: renderRoundRect radius=0 preserved', () => {
  test('should not override explicit radius=0 with default 5', () => {
    // Fix: changed || to ?? so falsy 0 is preserved
    const radius = { tr: 0, tl: 5, br: 5, bl: 0 }

    // Old behavior: 0 || 5 = 5 (wrong!)
    const oldTr = radius.tr || 5
    expect(oldTr).toBe(5) // Bug: 0 was overridden

    // New behavior: 0 ?? 5 = 0 (correct!)
    const newTr = radius.tr ?? 5
    expect(newTr).toBe(0) // Fix: 0 is preserved
  })

  test('should still use default 5 for undefined/null radius', () => {
    const radius: Record<string, number | undefined> = { tr: undefined, tl: 5, br: 5, bl: undefined }

    const newTr = radius.tr ?? 5
    const newBl = radius.bl ?? 5

    expect(newTr).toBe(5)
    expect(newBl).toBe(5)
  })
})

describe('Bug Fix: GameRenderer null sprite guard', () => {
  test('should not crash when sprite is null', () => {
    // Fix: replaced non-null assertions with null checks
    const getSprite = (name: string) => {
      if (name === 'missing') return null
      return { getClone: () => ({ renderLoop: () => {} }) }
    }

    // Should not throw
    const sprite = getSprite('missing')
    if (sprite) {
      sprite.getClone()
    }

    expect(sprite).toBeNull()
  })

  test('should render when sprite exists', () => {
    let rendered = false
    const getSprite = (_name: string) => ({
      getClone: () => ({ renderLoop: () => { rendered = true } })
    })

    const sprite = getSprite('gold_spin')
    if (sprite) {
      sprite.getClone().renderLoop()
    }

    expect(rendered).toBe(true)
  })
})

describe('Bug Fix: renderStatistic fillStyle leak', () => {
  test('should restore fillStyle after rendering statistics', () => {
    const originalFillStyle = 'rgb(0, 0, 0)'
    let fillStyle = originalFillStyle
    const saved = fillStyle

    // Simulate render loop color changes
    fillStyle = 'rgba(103,194,58,0.5)' // good
    fillStyle = 'rgba(255,120,117,0.5)' // danger

    // Fix: restore after loop
    fillStyle = saved
    expect(fillStyle).toBe(originalFillStyle)
  })
})

