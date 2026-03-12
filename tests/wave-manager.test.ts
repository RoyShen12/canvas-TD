/// <reference path="../src/constants.ts" />
import { describe, test, expect, beforeEach, vi } from 'vitest'

// ============================================================================
// Mock 依赖
// ============================================================================

const WAVE_CONFIG = {
  DEFAULT_REST_TICKS: 300,
  DEFAULT_SPAWN_INTERVAL: 60,
  FAST_SPAWN_INTERVAL: 30,
  BOSS_WAVE_REST_TICKS: 600,
  BOSS_WAVE_INTERVAL: 5,
  MONSTER_COUNT_BASE: 10,
  MONSTER_COUNT_INCREMENT: 2,
  LEVEL_INCREMENT_PER_WAVE: 0.3,
  DEFAULT_AUTO_START: false,
  WAVE_CLEAR_GOLD_BONUS: 100,
  EARLY_START_GOLD_BONUS: 50,
} as const

// ============================================================================
// 类型定义（从 stage.ts 复制）
// ============================================================================

interface SummonConfig {
  monsterName: string
  count: number
  level: number
  spawnInterval: number
}

interface SpawnCommand {
  monsterName: string
  level: number
}

enum WaveState {
  IDLE = 'IDLE',
  WAITING_FOR_START = 'WAITING',
  SPAWNING = 'SPAWNING',
  RESTING = 'RESTING',
  COMPLETED = 'COMPLETED',
}

// ============================================================================
// Wave 类（从 stage.ts 复制）
// ============================================================================

class Wave {
  private readonly _summons: SummonConfig[]
  private readonly _waveNumber: number
  private readonly _restTicks: number

  private _currentSummonIndex: number = 0
  private _spawnedInCurrentConfig: number = 0
  private _lastSpawnTick: number = -Infinity
  private _totalSpawned: number = 0

  private readonly _totalMonsters: number

  constructor(waveNumber: number, summons: SummonConfig[], restTicks: number) {
    this._waveNumber = waveNumber
    this._summons = summons
    this._restTicks = restTicks
    this._totalMonsters = summons.reduce((sum, s) => sum + s.count, 0)
  }

  update(currentTick: number): SpawnCommand | null {
    if (this.isSpawningComplete()) return null

    const summon = this._summons[this._currentSummonIndex]
    if (!summon) return null

    const ticksSinceLastSpawn = currentTick - this._lastSpawnTick

    if (ticksSinceLastSpawn >= summon.spawnInterval) {
      this._lastSpawnTick = currentTick
      this._spawnedInCurrentConfig++
      this._totalSpawned++

      const command: SpawnCommand = {
        monsterName: summon.monsterName,
        level: summon.level,
      }

      if (this._spawnedInCurrentConfig >= summon.count) {
        this._currentSummonIndex++
        this._spawnedInCurrentConfig = 0
      }

      return command
    }

    return null
  }

  isSpawningComplete(): boolean {
    return this._currentSummonIndex >= this._summons.length
  }

  getProgress(): number {
    if (this._totalMonsters === 0) return 1
    return this._totalSpawned / this._totalMonsters
  }

  getWaveNumber(): number {
    return this._waveNumber
  }

  getRestTicks(): number {
    return this._restTicks
  }

  getTotalMonsters(): number {
    return this._totalMonsters
  }

  getSpawnedCount(): number {
    return this._totalSpawned
  }

  reset(): void {
    this._currentSummonIndex = 0
    this._spawnedInCurrentConfig = 0
    this._lastSpawnTick = -Infinity
    this._totalSpawned = 0
  }
}

// ============================================================================
// WaveManager 类（从 stage.ts 复制）
// ============================================================================

class WaveManager {
  private static _instance: WaveManager | null = null

  private _waves: Wave[] = []
  private _currentWaveIndex: number = -1
  private _state: WaveState = WaveState.IDLE
  private _restStartTick: number = 0
  private _autoStart: boolean = WAVE_CONFIG.DEFAULT_AUTO_START

  private _spawnCallback: ((monsterName: string, level: number) => void) | null = null
  private _rewardCallback: ((amount: number) => void) | null = null

  private constructor() {}

  static getInstance(): WaveManager {
    if (!WaveManager._instance) {
      WaveManager._instance = new WaveManager()
    }
    return WaveManager._instance
  }

  static resetInstance(): void {
    WaveManager._instance = null
  }

  setSpawnCallback(callback: (monsterName: string, level: number) => void): void {
    this._spawnCallback = callback
  }

  setRewardCallback(callback: (amount: number) => void): void {
    this._rewardCallback = callback
  }

  loadWaves(waves: Wave[]): void {
    if (!waves || waves.length === 0) {
      return
    }

    this._waves = waves
    this._currentWaveIndex = 0
    this._state = WaveState.WAITING_FOR_START
  }

  startNextWave(): boolean {
    if (this._state === WaveState.RESTING) {
      this._currentWaveIndex++
      if (this._currentWaveIndex >= this._waves.length) {
        this._state = WaveState.COMPLETED
        return false
      }
      if (this._rewardCallback) {
        this._rewardCallback(WAVE_CONFIG.EARLY_START_GOLD_BONUS)
      }
      const wave = this._waves[this._currentWaveIndex]
      if (wave) {
        wave.reset()
        this._state = WaveState.SPAWNING
        return true
      }
      return false
    }

    if (this._state === WaveState.WAITING_FOR_START) {
      const wave = this._waves[this._currentWaveIndex]
      if (wave) {
        wave.reset()
        this._state = WaveState.SPAWNING
        return true
      }
    }

    return false
  }

  setAutoStart(auto: boolean): void {
    this._autoStart = auto
  }

  isAutoStart(): boolean {
    return this._autoStart
  }

  update(currentTick: number): void {
    switch (this._state) {
      case WaveState.SPAWNING:
        this._updateSpawning(currentTick)
        break
      case WaveState.RESTING:
        this._updateResting(currentTick)
        break
      default:
        break
    }
  }

  private _updateSpawning(currentTick: number): void {
    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return

    const spawnCommand = wave.update(currentTick)

    if (spawnCommand && this._spawnCallback) {
      this._spawnCallback(spawnCommand.monsterName, spawnCommand.level)
    }

    if (wave.isSpawningComplete()) {
      this._startResting(currentTick)
    }
  }

  private _startResting(currentTick: number): void {
    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return

    if (this._rewardCallback) {
      this._rewardCallback(WAVE_CONFIG.WAVE_CLEAR_GOLD_BONUS)
    }

    this._restStartTick = currentTick
    this._state = WaveState.RESTING
  }

  private _updateResting(currentTick: number): void {
    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return

    const restElapsed = currentTick - this._restStartTick

    if (restElapsed >= wave.getRestTicks()) {
      if (this._currentWaveIndex + 1 >= this._waves.length) {
        this._state = WaveState.COMPLETED
      } else {
        this._currentWaveIndex++
        if (this._autoStart) {
          this._state = WaveState.SPAWNING
          this._waves[this._currentWaveIndex]?.reset()
        } else {
          this._state = WaveState.WAITING_FOR_START
        }
      }
    }
  }

  getState(): WaveState {
    return this._state
  }

  getCurrentWave(): Wave | null {
    return this._waves[this._currentWaveIndex] ?? null
  }

  getCurrentWaveNumber(): number {
    const wave = this._waves[this._currentWaveIndex]
    return wave ? wave.getWaveNumber() : 0
  }

  getTotalWaves(): number {
    return this._waves.length
  }

  getRestProgress(currentTick: number): number {
    if (this._state !== WaveState.RESTING) return 0

    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return 0

    const restElapsed = currentTick - this._restStartTick
    return Math.min(restElapsed / wave.getRestTicks(), 1)
  }

  getRestRemainingTicks(currentTick: number): number {
    if (this._state !== WaveState.RESTING) return 0

    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return 0

    const restElapsed = currentTick - this._restStartTick
    return Math.max(wave.getRestTicks() - restElapsed, 0)
  }

  hasNextWave(): boolean {
    return this._currentWaveIndex + 1 < this._waves.length
  }

  canStartNextWave(): boolean {
    return this._state === WaveState.WAITING_FOR_START || this._state === WaveState.RESTING
  }

  appendWaves(waves: Wave[]): void {
    if (waves.length === 0) return
    this._waves.push(...waves)
    if (this._state === WaveState.COMPLETED) {
      this._currentWaveIndex = this._waves.length - waves.length
      if (this._autoStart) {
        this._state = WaveState.SPAWNING
        this._waves[this._currentWaveIndex]?.reset()
      } else {
        this._state = WaveState.WAITING_FOR_START
      }
    }
  }

  get waveNumber(): number {
    return this.getCurrentWaveNumber()
  }

  isBossWave(waveNumber?: number): boolean {
    const num = waveNumber ?? this.getCurrentWaveNumber()
    return num > 0 && num % WAVE_CONFIG.BOSS_WAVE_INTERVAL === 0
  }
}

// ============================================================================
// WaveFactory 类（从 stage.ts 复制）
// ============================================================================

interface WaveDefinition {
  waveNumber: number
  summons: SummonConfig[]
  restTicks: number
}

class WaveFactory {
  private static readonly NORMAL_MONSTERS = ['Swordman', 'Axeman', 'LionMan']
  private static readonly BOSS_MONSTERS = ['Devil', 'HighPriest']

  private static validateWaveDefinition(def: WaveDefinition): void {
    if (!def.summons || def.summons.length === 0) {
      throw new Error(`[WaveFactory] 波次 ${def.waveNumber} 没有定义召唤配置`)
    }

    def.summons.forEach((summon, idx) => {
      if (summon.count <= 0) {
        throw new Error(
          `[WaveFactory] 波次 ${def.waveNumber} 召唤配置 ${idx} 的数量无效: ${summon.count}`
        )
      }
      if (summon.spawnInterval <= 0) {
        throw new Error(
          `[WaveFactory] 波次 ${def.waveNumber} 召唤配置 ${idx} 的生成间隔无效: ${summon.spawnInterval}`
        )
      }
    })

    if (def.restTicks < 0) {
      throw new Error(`[WaveFactory] 波次 ${def.waveNumber} 的休息时间无效: ${def.restTicks}`)
    }
  }

  static createWave(def: WaveDefinition): Wave {
    this.validateWaveDefinition(def)
    return new Wave(def.waveNumber, def.summons, def.restTicks)
  }

  static createStandardWaves(): Wave[] {
    const definitions = this.createStandardWaveDefinitions()
    return definitions.map((def) => this.createWave(def))
  }

  static createStandardWaveDefinitions(): WaveDefinition[] {
    const definitions: WaveDefinition[] = []
    for (let i = 1; i <= 10; i++) {
      definitions.push(this.createWaveDefinition(i))
    }
    return definitions
  }

  static createWaveDefinition(waveNumber: number): WaveDefinition {
    const isBossWave = waveNumber % WAVE_CONFIG.BOSS_WAVE_INTERVAL === 0
    const level = Math.floor(1 + (waveNumber - 1) * WAVE_CONFIG.LEVEL_INCREMENT_PER_WAVE)
    const monsterCount =
      WAVE_CONFIG.MONSTER_COUNT_BASE + (waveNumber - 1) * WAVE_CONFIG.MONSTER_COUNT_INCREMENT

    const summons: SummonConfig[] = []

    if (isBossWave) {
      const normalCount = Math.floor(monsterCount * 0.6)
      const monsterType = this.NORMAL_MONSTERS[waveNumber % this.NORMAL_MONSTERS.length]!
      const bossType =
        this.BOSS_MONSTERS[
          (waveNumber / WAVE_CONFIG.BOSS_WAVE_INTERVAL - 1) % this.BOSS_MONSTERS.length
        ]!

      summons.push({
        monsterName: monsterType,
        count: normalCount,
        level: level,
        spawnInterval: WAVE_CONFIG.FAST_SPAWN_INTERVAL,
      })

      summons.push({
        monsterName: bossType,
        count: 1,
        level: level,
        spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL * 2,
      })

      return { waveNumber, summons, restTicks: WAVE_CONFIG.BOSS_WAVE_REST_TICKS }
    } else {
      const type1 = this.NORMAL_MONSTERS[(waveNumber - 1) % this.NORMAL_MONSTERS.length]!
      const type2 = this.NORMAL_MONSTERS[waveNumber % this.NORMAL_MONSTERS.length]!

      if (waveNumber <= 1) {
        summons.push({
          monsterName: type1,
          count: monsterCount,
          level: level,
          spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL,
        })
      } else {
        const monstersPerType = Math.ceil(monsterCount / 2)
        summons.push({
          monsterName: type1,
          count: monstersPerType,
          level: level,
          spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL,
        })
        summons.push({
          monsterName: type2,
          count: monsterCount - monstersPerType,
          level: level,
          spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL,
        })
      }

      return { waveNumber, summons, restTicks: WAVE_CONFIG.DEFAULT_REST_TICKS }
    }
  }

  static createEndlessWaveDefinition(waveNumber: number): WaveDefinition {
    const level = Math.floor(1 + waveNumber * 0.5 + Math.pow(waveNumber, 1.2) * 0.1)
    const monsterCount = Math.floor(WAVE_CONFIG.MONSTER_COUNT_BASE + waveNumber * 3)
    const isBossWave = waveNumber % WAVE_CONFIG.BOSS_WAVE_INTERVAL === 0

    const summons: SummonConfig[] = []
    const monsterType = this.NORMAL_MONSTERS[waveNumber % this.NORMAL_MONSTERS.length]!

    summons.push({
      monsterName: monsterType,
      count: monsterCount,
      level: level,
      spawnInterval: Math.max(WAVE_CONFIG.FAST_SPAWN_INTERVAL - Math.floor(waveNumber / 5), 10),
    })

    if (isBossWave) {
      const bossType =
        this.BOSS_MONSTERS[
          (waveNumber / WAVE_CONFIG.BOSS_WAVE_INTERVAL - 1) % this.BOSS_MONSTERS.length
        ]!
      summons.push({
        monsterName: bossType,
        count: 1 + Math.floor(waveNumber / 20),
        level: level + 5,
        spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL,
      })
    }

    return {
      waveNumber,
      summons,
      restTicks: isBossWave ? WAVE_CONFIG.BOSS_WAVE_REST_TICKS : WAVE_CONFIG.DEFAULT_REST_TICKS,
    }
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

/** 创建一个简单的 Wave，用于 WaveManager 测试 */
function createSimpleWave(
  waveNumber: number,
  count: number = 3,
  spawnInterval: number = 10,
  restTicks: number = 100
): Wave {
  return new Wave(
    waveNumber,
    [{ monsterName: 'Swordman', count, level: 1, spawnInterval }],
    restTicks
  )
}

/** 快速运行 wave 到 spawning 完成，返回最后的 tick */
function drainWave(wave: Wave, startTick: number = 0, interval: number = 10): number {
  let tick = startTick
  while (!wave.isSpawningComplete()) {
    wave.update(tick)
    tick += interval
  }
  return tick
}

// ============================================================================
// 测试用例
// ============================================================================

describe('Wave', () => {
  describe('constructor', () => {
    test('sets totalMonsters correctly from summons', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 5, level: 1, spawnInterval: 60 },
        { monsterName: 'Axeman', count: 3, level: 2, spawnInterval: 30 },
      ], 300)

      expect(wave.getTotalMonsters()).toBe(8)
    })

    test('empty summons results in totalMonsters = 0', () => {
      const wave = new Wave(1, [], 300)

      expect(wave.getTotalMonsters()).toBe(0)
    })

    test('stores waveNumber and restTicks', () => {
      const wave = new Wave(7, [], 500)

      expect(wave.getWaveNumber()).toBe(7)
      expect(wave.getRestTicks()).toBe(500)
    })
  })

  describe('update()', () => {
    test('returns spawn command at correct intervals', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 2, level: 3, spawnInterval: 60 },
      ], 300)

      // First call: _lastSpawnTick is -Infinity, so any tick works
      const cmd1 = wave.update(0)
      expect(cmd1).not.toBeNull()
      expect(cmd1!.monsterName).toBe('Swordman')
      expect(cmd1!.level).toBe(3)
    })

    test('returns null between intervals', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 3, level: 1, spawnInterval: 60 },
      ], 300)

      // First spawn at tick 0
      wave.update(0)

      // Too early - only 30 ticks have passed, need 60
      const cmd = wave.update(30)
      expect(cmd).toBeNull()
    })

    test('spawns again after interval elapses', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 3, level: 1, spawnInterval: 60 },
      ], 300)

      wave.update(0) // spawn 1
      const cmd = wave.update(60) // spawn 2

      expect(cmd).not.toBeNull()
      expect(cmd!.monsterName).toBe('Swordman')
      expect(wave.getSpawnedCount()).toBe(2)
    })

    test('transitions between summon configs', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 1, level: 1, spawnInterval: 10 },
        { monsterName: 'Axeman', count: 1, level: 2, spawnInterval: 10 },
      ], 300)

      const cmd1 = wave.update(0)
      expect(cmd1!.monsterName).toBe('Swordman')

      const cmd2 = wave.update(10)
      expect(cmd2!.monsterName).toBe('Axeman')
      expect(cmd2!.level).toBe(2)
    })

    test('returns null after all configs exhausted', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 1, level: 1, spawnInterval: 10 },
      ], 300)

      wave.update(0) // exhaust the only config

      const cmd = wave.update(100)
      expect(cmd).toBeNull()
    })

    test('handles multiple monsters per config', () => {
      const wave = new Wave(1, [
        { monsterName: 'LionMan', count: 3, level: 5, spawnInterval: 20 },
      ], 300)

      const results: SpawnCommand[] = []
      for (let tick = 0; tick < 200; tick += 20) {
        const cmd = wave.update(tick)
        if (cmd) results.push(cmd)
      }

      expect(results).toHaveLength(3)
      results.forEach(cmd => {
        expect(cmd.monsterName).toBe('LionMan')
        expect(cmd.level).toBe(5)
      })
    })
  })

  describe('isSpawningComplete()', () => {
    test('returns false initially', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 2, level: 1, spawnInterval: 10 },
      ], 300)

      expect(wave.isSpawningComplete()).toBe(false)
    })

    test('returns true after all monsters spawned', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 2, level: 1, spawnInterval: 10 },
      ], 300)

      wave.update(0)
      expect(wave.isSpawningComplete()).toBe(false)

      wave.update(10)
      expect(wave.isSpawningComplete()).toBe(true)
    })

    test('returns true for empty summons', () => {
      const wave = new Wave(1, [], 300)

      expect(wave.isSpawningComplete()).toBe(true)
    })
  })

  describe('getProgress()', () => {
    test('returns 0 initially (non-empty wave)', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 4, level: 1, spawnInterval: 10 },
      ], 300)

      expect(wave.getProgress()).toBe(0)
    })

    test('returns 1 when complete', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 2, level: 1, spawnInterval: 10 },
      ], 300)

      wave.update(0)
      wave.update(10)

      expect(wave.getProgress()).toBe(1)
    })

    test('returns intermediate progress', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 4, level: 1, spawnInterval: 10 },
      ], 300)

      wave.update(0) // 1/4
      expect(wave.getProgress()).toBe(0.25)

      wave.update(10) // 2/4
      expect(wave.getProgress()).toBe(0.5)
    })

    test('returns 1 for empty summons', () => {
      const wave = new Wave(1, [], 300)

      expect(wave.getProgress()).toBe(1)
    })
  })

  describe('reset()', () => {
    test('resets all state back to initial', () => {
      const wave = new Wave(1, [
        { monsterName: 'Swordman', count: 3, level: 1, spawnInterval: 10 },
      ], 300)

      // Partially advance
      wave.update(0)
      wave.update(10)
      expect(wave.getSpawnedCount()).toBe(2)
      expect(wave.getProgress()).toBeCloseTo(2 / 3)

      // Reset
      wave.reset()

      expect(wave.getSpawnedCount()).toBe(0)
      expect(wave.getProgress()).toBe(0)
      expect(wave.isSpawningComplete()).toBe(false)

      // Should be able to spawn again from scratch
      const cmd = wave.update(100)
      expect(cmd).not.toBeNull()
      expect(cmd!.monsterName).toBe('Swordman')
      expect(wave.getSpawnedCount()).toBe(1)
    })
  })
})

describe('WaveManager', () => {
  beforeEach(() => {
    WaveManager.resetInstance()
  })

  describe('singleton', () => {
    test('getInstance returns same instance', () => {
      const a = WaveManager.getInstance()
      const b = WaveManager.getInstance()

      expect(a).toBe(b)
    })

    test('resetInstance creates fresh instance', () => {
      const a = WaveManager.getInstance()
      WaveManager.resetInstance()
      const b = WaveManager.getInstance()

      expect(a).not.toBe(b)
    })
  })

  describe('initial state', () => {
    test('starts in IDLE state', () => {
      const manager = WaveManager.getInstance()

      expect(manager.getState()).toBe(WaveState.IDLE)
    })

    test('has no current wave', () => {
      const manager = WaveManager.getInstance()

      expect(manager.getCurrentWave()).toBeNull()
      expect(manager.getCurrentWaveNumber()).toBe(0)
    })

    test('autoStart defaults to false', () => {
      const manager = WaveManager.getInstance()

      expect(manager.isAutoStart()).toBe(false)
    })
  })

  describe('loadWaves()', () => {
    test('transitions to WAITING_FOR_START', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1)])

      expect(manager.getState()).toBe(WaveState.WAITING_FOR_START)
    })

    test('sets current wave to first wave', () => {
      const manager = WaveManager.getInstance()
      const wave = createSimpleWave(1)
      manager.loadWaves([wave])

      expect(manager.getCurrentWave()).toBe(wave)
      expect(manager.getCurrentWaveNumber()).toBe(1)
    })

    test('empty array stays IDLE', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([])

      expect(manager.getState()).toBe(WaveState.IDLE)
    })

    test('records total wave count', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1), createSimpleWave(2), createSimpleWave(3)])

      expect(manager.getTotalWaves()).toBe(3)
    })
  })

  describe('startNextWave()', () => {
    test('from WAITING_FOR_START transitions to SPAWNING', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1)])

      const result = manager.startNextWave()

      expect(result).toBe(true)
      expect(manager.getState()).toBe(WaveState.SPAWNING)
    })

    test('from IDLE returns false', () => {
      const manager = WaveManager.getInstance()

      const result = manager.startNextWave()

      expect(result).toBe(false)
      expect(manager.getState()).toBe(WaveState.IDLE)
    })

    test('from SPAWNING returns false', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1)])
      manager.startNextWave() // go to SPAWNING

      const result = manager.startNextWave()

      expect(result).toBe(false)
    })

    test('from RESTING increments wave index and transitions to SPAWNING', () => {
      const manager = WaveManager.getInstance()
      const wave1 = createSimpleWave(1, 1, 10, 100)
      const wave2 = createSimpleWave(2, 1, 10, 100)
      manager.loadWaves([wave1, wave2])

      // Start wave 1 and complete it
      manager.startNextWave()
      manager.update(0) // spawn the 1 monster
      // wave.isSpawningComplete() triggers resting
      expect(manager.getState()).toBe(WaveState.RESTING)

      // Start next wave from RESTING
      const result = manager.startNextWave()

      expect(result).toBe(true)
      expect(manager.getState()).toBe(WaveState.SPAWNING)
      expect(manager.getCurrentWaveNumber()).toBe(2)
    })

    test('from RESTING at last wave transitions to COMPLETED', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])

      // Start and complete wave 1
      manager.startNextWave()
      manager.update(0) // spawn + complete
      expect(manager.getState()).toBe(WaveState.RESTING)

      // Try to start next - none available
      const result = manager.startNextWave()

      expect(result).toBe(false)
      expect(manager.getState()).toBe(WaveState.COMPLETED)
    })

    test('from RESTING gives EARLY_START_GOLD_BONUS via reward callback', () => {
      const manager = WaveManager.getInstance()
      const rewardFn = vi.fn()
      manager.setRewardCallback(rewardFn)
      manager.loadWaves([createSimpleWave(1, 1, 10, 100), createSimpleWave(2, 1, 10, 100)])

      // Complete wave 1 to enter RESTING
      manager.startNextWave()
      manager.update(0) // spawn + complete triggers WAVE_CLEAR_GOLD_BONUS
      rewardFn.mockClear()

      // Early start wave 2
      manager.startNextWave()

      expect(rewardFn).toHaveBeenCalledWith(WAVE_CONFIG.EARLY_START_GOLD_BONUS)
    })
  })

  describe('update()', () => {
    test('in SPAWNING calls spawnCallback with correct args', () => {
      const manager = WaveManager.getInstance()
      const spawnFn = vi.fn()
      manager.setSpawnCallback(spawnFn)

      const wave = new Wave(1, [
        { monsterName: 'LionMan', count: 1, level: 5, spawnInterval: 10 },
      ], 300)
      manager.loadWaves([wave])
      manager.startNextWave()

      manager.update(0)

      expect(spawnFn).toHaveBeenCalledWith('LionMan', 5)
    })

    test('after spawning complete transitions to RESTING and gives WAVE_CLEAR_GOLD_BONUS', () => {
      const manager = WaveManager.getInstance()
      const rewardFn = vi.fn()
      manager.setRewardCallback(rewardFn)
      manager.loadWaves([createSimpleWave(1, 1, 10, 200), createSimpleWave(2)])

      manager.startNextWave()
      manager.update(0) // spawn the single monster, wave completes

      expect(manager.getState()).toBe(WaveState.RESTING)
      expect(rewardFn).toHaveBeenCalledWith(WAVE_CONFIG.WAVE_CLEAR_GOLD_BONUS)
    })

    test('in RESTING transitions to WAITING_FOR_START after restTicks elapsed (autoStart=false)', () => {
      const manager = WaveManager.getInstance()
      manager.setAutoStart(false)
      manager.loadWaves([createSimpleWave(1, 1, 10, 100), createSimpleWave(2, 1, 10, 100)])

      // Complete wave 1
      manager.startNextWave()
      manager.update(0)
      expect(manager.getState()).toBe(WaveState.RESTING)

      // Rest hasn't elapsed yet
      manager.update(50)
      expect(manager.getState()).toBe(WaveState.RESTING)

      // Rest elapsed (restTicks = 100, restStartTick = 0, currentTick = 100)
      manager.update(100)
      expect(manager.getState()).toBe(WaveState.WAITING_FOR_START)
      expect(manager.getCurrentWaveNumber()).toBe(2)
    })

    test('in RESTING with autoStart=true transitions directly to SPAWNING', () => {
      const manager = WaveManager.getInstance()
      manager.setAutoStart(true)
      manager.loadWaves([createSimpleWave(1, 1, 10, 100), createSimpleWave(2, 1, 10, 100)])

      // Complete wave 1
      manager.startNextWave()
      manager.update(0)
      expect(manager.getState()).toBe(WaveState.RESTING)

      // Rest elapsed
      manager.update(100)

      expect(manager.getState()).toBe(WaveState.SPAWNING)
      expect(manager.getCurrentWaveNumber()).toBe(2)
    })

    test('in RESTING at last wave transitions to COMPLETED', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])

      // Complete wave 1 (only wave)
      manager.startNextWave()
      manager.update(0)
      expect(manager.getState()).toBe(WaveState.RESTING)

      // Rest elapsed
      manager.update(100)

      expect(manager.getState()).toBe(WaveState.COMPLETED)
    })

    test('in IDLE does nothing', () => {
      const manager = WaveManager.getInstance()
      const spawnFn = vi.fn()
      manager.setSpawnCallback(spawnFn)

      manager.update(1000)

      expect(spawnFn).not.toHaveBeenCalled()
      expect(manager.getState()).toBe(WaveState.IDLE)
    })

    test('in COMPLETED does nothing', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])
      manager.startNextWave()
      manager.update(0) // complete
      manager.update(100) // rest done -> COMPLETED

      const spawnFn = vi.fn()
      manager.setSpawnCallback(spawnFn)
      manager.update(9999)

      expect(spawnFn).not.toHaveBeenCalled()
      expect(manager.getState()).toBe(WaveState.COMPLETED)
    })
  })

  describe('hasNextWave()', () => {
    test('returns true when more waves exist', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1), createSimpleWave(2)])

      expect(manager.hasNextWave()).toBe(true)
    })

    test('returns false on last wave', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1)])

      expect(manager.hasNextWave()).toBe(false)
    })

    test('returns false after advancing to last wave', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 50), createSimpleWave(2, 1, 10, 50)])

      // Complete wave 1 and advance to wave 2
      manager.startNextWave()
      manager.update(0)
      manager.startNextWave() // RESTING -> advance to wave 2

      expect(manager.hasNextWave()).toBe(false)
    })
  })

  describe('canStartNextWave()', () => {
    test('returns true for WAITING_FOR_START', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1)])

      expect(manager.canStartNextWave()).toBe(true)
    })

    test('returns true for RESTING', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100), createSimpleWave(2)])
      manager.startNextWave()
      manager.update(0)
      expect(manager.getState()).toBe(WaveState.RESTING)

      expect(manager.canStartNextWave()).toBe(true)
    })

    test('returns false for IDLE', () => {
      const manager = WaveManager.getInstance()

      expect(manager.canStartNextWave()).toBe(false)
    })

    test('returns false for SPAWNING', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 5, 60, 300)])
      manager.startNextWave()

      expect(manager.canStartNextWave()).toBe(false)
    })

    test('returns false for COMPLETED', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])
      manager.startNextWave()
      manager.update(0)
      manager.update(100) // COMPLETED

      expect(manager.canStartNextWave()).toBe(false)
    })
  })

  describe('appendWaves()', () => {
    test('from COMPLETED resumes to WAITING_FOR_START', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])
      manager.startNextWave()
      manager.update(0)
      manager.update(100)
      expect(manager.getState()).toBe(WaveState.COMPLETED)

      manager.appendWaves([createSimpleWave(2)])

      expect(manager.getState()).toBe(WaveState.WAITING_FOR_START)
      expect(manager.getCurrentWaveNumber()).toBe(2)
      expect(manager.getTotalWaves()).toBe(2)
    })

    test('from COMPLETED with autoStart resumes to SPAWNING', () => {
      const manager = WaveManager.getInstance()
      manager.setAutoStart(true)
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])
      manager.startNextWave()
      manager.update(0)
      manager.update(100)
      expect(manager.getState()).toBe(WaveState.COMPLETED)

      manager.appendWaves([createSimpleWave(2)])

      expect(manager.getState()).toBe(WaveState.SPAWNING)
    })

    test('with empty array is no-op', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])
      manager.startNextWave()
      manager.update(0)
      manager.update(100)
      expect(manager.getState()).toBe(WaveState.COMPLETED)

      manager.appendWaves([])

      expect(manager.getState()).toBe(WaveState.COMPLETED)
      expect(manager.getTotalWaves()).toBe(1)
    })

    test('during SPAWNING just adds waves without state change', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 5, 60, 300)])
      manager.startNextWave()
      expect(manager.getState()).toBe(WaveState.SPAWNING)

      manager.appendWaves([createSimpleWave(2)])

      expect(manager.getState()).toBe(WaveState.SPAWNING)
      expect(manager.getTotalWaves()).toBe(2)
      expect(manager.hasNextWave()).toBe(true)
    })

    test('sets currentWaveIndex to first appended wave', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 100)])
      manager.startNextWave()
      manager.update(0)
      manager.update(100)
      expect(manager.getState()).toBe(WaveState.COMPLETED)

      const newWave = createSimpleWave(11)
      manager.appendWaves([newWave, createSimpleWave(12)])

      expect(manager.getCurrentWave()).toBe(newWave)
      expect(manager.getCurrentWaveNumber()).toBe(11)
    })
  })

  describe('isBossWave()', () => {
    test('returns true every 5th wave', () => {
      const manager = WaveManager.getInstance()

      expect(manager.isBossWave(5)).toBe(true)
      expect(manager.isBossWave(10)).toBe(true)
      expect(manager.isBossWave(15)).toBe(true)
      expect(manager.isBossWave(20)).toBe(true)
    })

    test('returns false for non-5th waves', () => {
      const manager = WaveManager.getInstance()

      expect(manager.isBossWave(1)).toBe(false)
      expect(manager.isBossWave(2)).toBe(false)
      expect(manager.isBossWave(3)).toBe(false)
      expect(manager.isBossWave(4)).toBe(false)
      expect(manager.isBossWave(6)).toBe(false)
    })

    test('returns false for wave 0', () => {
      const manager = WaveManager.getInstance()

      expect(manager.isBossWave(0)).toBe(false)
    })

    test('uses current wave number when no argument provided', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(5)])

      expect(manager.isBossWave()).toBe(true)
    })
  })

  describe('getRestProgress()', () => {
    test('returns 0 when not RESTING', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1)])

      expect(manager.getRestProgress(0)).toBe(0)
    })

    test('returns correct progress during RESTING', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 200), createSimpleWave(2)])
      manager.startNextWave()
      manager.update(0) // spawn complete, restStartTick = 0, restTicks = 200

      expect(manager.getRestProgress(0)).toBe(0)
      expect(manager.getRestProgress(100)).toBe(0.5)
      expect(manager.getRestProgress(200)).toBe(1)
    })

    test('clamps to 1 when exceeded', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 200), createSimpleWave(2)])
      manager.startNextWave()
      manager.update(0)

      expect(manager.getRestProgress(300)).toBe(1)
    })
  })

  describe('getRestRemainingTicks()', () => {
    test('returns 0 when not RESTING', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1)])

      expect(manager.getRestRemainingTicks(0)).toBe(0)
    })

    test('returns correct remaining ticks during RESTING', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 200), createSimpleWave(2)])
      manager.startNextWave()
      manager.update(0) // restStartTick = 0, restTicks = 200

      expect(manager.getRestRemainingTicks(0)).toBe(200)
      expect(manager.getRestRemainingTicks(50)).toBe(150)
      expect(manager.getRestRemainingTicks(200)).toBe(0)
    })

    test('clamps to 0 when exceeded', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(1, 1, 10, 200), createSimpleWave(2)])
      manager.startNextWave()
      manager.update(0)

      expect(manager.getRestRemainingTicks(500)).toBe(0)
    })
  })

  describe('waveNumber getter', () => {
    test('returns same value as getCurrentWaveNumber()', () => {
      const manager = WaveManager.getInstance()
      manager.loadWaves([createSimpleWave(7)])

      expect(manager.waveNumber).toBe(manager.getCurrentWaveNumber())
      expect(manager.waveNumber).toBe(7)
    })
  })
})

describe('WaveFactory', () => {
  describe('createWaveDefinition()', () => {
    test('wave 1 gets single monster type with full count', () => {
      const def = WaveFactory.createWaveDefinition(1)

      expect(def.waveNumber).toBe(1)
      expect(def.summons).toHaveLength(1)
      expect(def.summons[0]!.count).toBe(WAVE_CONFIG.MONSTER_COUNT_BASE)
      expect(def.summons[0]!.spawnInterval).toBe(WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL)
      expect(def.restTicks).toBe(WAVE_CONFIG.DEFAULT_REST_TICKS)
    })

    test('wave 2 gets two monster types', () => {
      const def = WaveFactory.createWaveDefinition(2)

      expect(def.summons).toHaveLength(2)

      const totalCount = def.summons.reduce((s, c) => s + c.count, 0)
      const expectedCount = WAVE_CONFIG.MONSTER_COUNT_BASE + WAVE_CONFIG.MONSTER_COUNT_INCREMENT
      expect(totalCount).toBe(expectedCount)
    })

    test('wave 5 is boss wave with normal monsters + boss', () => {
      const def = WaveFactory.createWaveDefinition(5)

      expect(def.summons).toHaveLength(2)

      // First group: normal monsters at FAST_SPAWN_INTERVAL
      expect(def.summons[0]!.spawnInterval).toBe(WAVE_CONFIG.FAST_SPAWN_INTERVAL)

      // Second group: boss (count=1) at double DEFAULT_SPAWN_INTERVAL
      expect(def.summons[1]!.count).toBe(1)
      expect(def.summons[1]!.spawnInterval).toBe(WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL * 2)

      // Boss rest ticks
      expect(def.restTicks).toBe(WAVE_CONFIG.BOSS_WAVE_REST_TICKS)
    })

    test('wave 10 is also a boss wave', () => {
      const def = WaveFactory.createWaveDefinition(10)

      expect(def.restTicks).toBe(WAVE_CONFIG.BOSS_WAVE_REST_TICKS)
      expect(def.summons).toHaveLength(2)
      expect(def.summons[1]!.count).toBe(1) // boss count
    })

    test('level scales with wave number', () => {
      const def1 = WaveFactory.createWaveDefinition(1)
      const def5 = WaveFactory.createWaveDefinition(5)
      const def10 = WaveFactory.createWaveDefinition(10)

      // level = floor(1 + (waveNumber - 1) * 0.3)
      expect(def1.summons[0]!.level).toBe(1) // floor(1 + 0*0.3) = 1
      expect(def5.summons[0]!.level).toBe(2) // floor(1 + 4*0.3) = floor(2.2) = 2
      expect(def10.summons[0]!.level).toBe(3) // floor(1 + 9*0.3) = floor(3.7) = 3
    })

    test('monster count increases per wave', () => {
      const def1 = WaveFactory.createWaveDefinition(1)
      const def4 = WaveFactory.createWaveDefinition(4)

      const count1 = def1.summons.reduce((s, c) => s + c.count, 0)
      const count4 = def4.summons.reduce((s, c) => s + c.count, 0)

      // wave 1: 10, wave 4: 10 + 3*2 = 16
      expect(count1).toBe(10)
      expect(count4).toBe(16)
    })

    test('boss wave normal count is 60% of total', () => {
      const def = WaveFactory.createWaveDefinition(5)
      const monsterCount = WAVE_CONFIG.MONSTER_COUNT_BASE + 4 * WAVE_CONFIG.MONSTER_COUNT_INCREMENT
      const expectedNormalCount = Math.floor(monsterCount * 0.6)

      expect(def.summons[0]!.count).toBe(expectedNormalCount)
    })

    test('non-boss waves use normal monster types', () => {
      const normalMonsters = ['Swordman', 'Axeman', 'LionMan']

      for (let i = 1; i <= 4; i++) {
        const def = WaveFactory.createWaveDefinition(i)
        def.summons.forEach(s => {
          expect(normalMonsters).toContain(s.monsterName)
        })
      }
    })

    test('boss wave includes boss monster type', () => {
      const bossMonsters = ['Devil', 'HighPriest']
      const def = WaveFactory.createWaveDefinition(5)

      expect(bossMonsters).toContain(def.summons[1]!.monsterName)
    })
  })

  describe('createStandardWaves()', () => {
    test('creates exactly 10 waves', () => {
      const waves = WaveFactory.createStandardWaves()

      expect(waves).toHaveLength(10)
    })

    test('waves are numbered 1 through 10', () => {
      const waves = WaveFactory.createStandardWaves()

      waves.forEach((wave, idx) => {
        expect(wave.getWaveNumber()).toBe(idx + 1)
      })
    })
  })

  describe('createEndlessWaveDefinition()', () => {
    test('produces valid wave definition', () => {
      const def = WaveFactory.createEndlessWaveDefinition(11)

      expect(def.waveNumber).toBe(11)
      expect(def.summons.length).toBeGreaterThanOrEqual(1)
      expect(def.summons[0]!.count).toBeGreaterThan(0)
      expect(def.summons[0]!.spawnInterval).toBeGreaterThanOrEqual(10)
      expect(def.summons[0]!.level).toBeGreaterThanOrEqual(1)
    })

    test('boss waves at interval include boss in summons', () => {
      const def = WaveFactory.createEndlessWaveDefinition(10)

      expect(def.summons).toHaveLength(2)
      expect(def.restTicks).toBe(WAVE_CONFIG.BOSS_WAVE_REST_TICKS)
    })

    test('non-boss endless waves use default rest ticks', () => {
      const def = WaveFactory.createEndlessWaveDefinition(11)

      expect(def.restTicks).toBe(WAVE_CONFIG.DEFAULT_REST_TICKS)
    })

    test('difficulty scales with wave number (count increases)', () => {
      const def10 = WaveFactory.createEndlessWaveDefinition(11)
      const def50 = WaveFactory.createEndlessWaveDefinition(51)

      expect(def50.summons[0]!.count).toBeGreaterThan(def10.summons[0]!.count)
    })

    test('difficulty scales with wave number (level increases)', () => {
      const def10 = WaveFactory.createEndlessWaveDefinition(11)
      const def50 = WaveFactory.createEndlessWaveDefinition(51)

      expect(def50.summons[0]!.level).toBeGreaterThan(def10.summons[0]!.level)
    })

    test('spawn interval decreases but never below 10', () => {
      const defLate = WaveFactory.createEndlessWaveDefinition(200)

      expect(defLate.summons[0]!.spawnInterval).toBe(10)
    })

    test('boss count increases at higher waves', () => {
      const def20 = WaveFactory.createEndlessWaveDefinition(20)
      const def100 = WaveFactory.createEndlessWaveDefinition(100)

      // wave 20: 1 + floor(20/20) = 2, wave 100: 1 + floor(100/20) = 6
      expect(def20.summons[1]!.count).toBe(2)
      expect(def100.summons[1]!.count).toBe(6)
    })
  })

  describe('validation', () => {
    test('throws on zero count', () => {
      expect(() => {
        WaveFactory.createWave({
          waveNumber: 1,
          summons: [{ monsterName: 'Swordman', count: 0, level: 1, spawnInterval: 60 }],
          restTicks: 300,
        })
      }).toThrow(/数量无效/)
    })

    test('throws on negative count', () => {
      expect(() => {
        WaveFactory.createWave({
          waveNumber: 1,
          summons: [{ monsterName: 'Swordman', count: -5, level: 1, spawnInterval: 60 }],
          restTicks: 300,
        })
      }).toThrow(/数量无效/)
    })

    test('throws on zero interval', () => {
      expect(() => {
        WaveFactory.createWave({
          waveNumber: 1,
          summons: [{ monsterName: 'Swordman', count: 5, level: 1, spawnInterval: 0 }],
          restTicks: 300,
        })
      }).toThrow(/生成间隔无效/)
    })

    test('throws on negative interval', () => {
      expect(() => {
        WaveFactory.createWave({
          waveNumber: 1,
          summons: [{ monsterName: 'Swordman', count: 5, level: 1, spawnInterval: -10 }],
          restTicks: 300,
        })
      }).toThrow(/生成间隔无效/)
    })

    test('throws on negative restTicks', () => {
      expect(() => {
        WaveFactory.createWave({
          waveNumber: 1,
          summons: [{ monsterName: 'Swordman', count: 5, level: 1, spawnInterval: 60 }],
          restTicks: -1,
        })
      }).toThrow(/休息时间无效/)
    })

    test('allows zero restTicks', () => {
      expect(() => {
        WaveFactory.createWave({
          waveNumber: 1,
          summons: [{ monsterName: 'Swordman', count: 5, level: 1, spawnInterval: 60 }],
          restTicks: 0,
        })
      }).not.toThrow()
    })

    test('throws on empty summons', () => {
      expect(() => {
        WaveFactory.createWave({
          waveNumber: 1,
          summons: [],
          restTicks: 300,
        })
      }).toThrow(/没有定义召唤配置/)
    })
  })
})
