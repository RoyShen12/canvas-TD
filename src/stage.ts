/// <reference path="./typedef.ts" />
/// <reference path="./constants.ts" />

// ============================================================================
// 波次系统类型定义
// ============================================================================

/**
 * 召唤配置 - 定义单组怪物的生成参数
 */
interface SummonConfig {
  /** 怪物类型名称（Registry 中的键） */
  monsterName: string
  /** 生成数量 */
  count: number
  /** 怪物等级 */
  level: number
  /** 生成间隔（tick） */
  spawnInterval: number
}

/**
 * 生成命令 - WaveManager 返回给 Game 的生成指令
 */
interface SpawnCommand {
  /** 怪物类型名称 */
  monsterName: string
  /** 怪物等级 */
  level: number
}

/**
 * 波次状态枚举
 */
enum WaveState {
  /** 空闲状态 - 未加载波次 */
  IDLE = 'IDLE',
  /** 等待开始 - 等待玩家手动开始 */
  WAITING_FOR_START = 'WAITING',
  /** 生成中 - 正在生成怪物 */
  SPAWNING = 'SPAWNING',
  /** 休息中 - 波次间休息时间 */
  RESTING = 'RESTING',
  /** 已完成 - 所有波次结束 */
  COMPLETED = 'COMPLETED'
}

// ============================================================================
// Wave 类 - 单个波次的管理
// ============================================================================

/**
 * 波次类 - 管理单个波次内的怪物生成序列
 */
class Wave {
  /** 召唤配置列表 */
  private readonly _summons: SummonConfig[]
  /** 波次编号（从 1 开始） */
  private readonly _waveNumber: number
  /** 休息时间（tick） */
  private readonly _restTicks: number

  /** 当前召唤配置索引 */
  private _currentSummonIndex: number = 0
  /** 当前配置已生成数量 */
  private _spawnedInCurrentConfig: number = 0
  /** 上次生成的 tick */
  private _lastSpawnTick: number = -Infinity
  /** 总共已生成数量 */
  private _totalSpawned: number = 0

  /** 缓存的总怪物数量 */
  private readonly _totalMonsters: number

  constructor(waveNumber: number, summons: SummonConfig[], restTicks: number) {
    this._waveNumber = waveNumber
    this._summons = summons
    this._restTicks = restTicks
    this._totalMonsters = summons.reduce((sum, s) => sum + s.count, 0)
  }

  /**
   * 更新波次状态，返回生成命令或 null
   * @param currentTick 当前游戏 tick
   */
  update(currentTick: number): SpawnCommand | null {
    if (this.isSpawningComplete()) {
      return null
    }

    const summon = this._summons[this._currentSummonIndex]
    if (!summon) {
      return null
    }

    const ticksSinceLastSpawn = currentTick - this._lastSpawnTick

    // 检查是否可以生成
    if (ticksSinceLastSpawn >= summon.spawnInterval) {
      this._lastSpawnTick = currentTick
      this._spawnedInCurrentConfig++
      this._totalSpawned++

      const command: SpawnCommand = {
        monsterName: summon.monsterName,
        level: summon.level
      }

      // 当前配置生成完毕，切换到下一个配置
      if (this._spawnedInCurrentConfig >= summon.count) {
        this._currentSummonIndex++
        this._spawnedInCurrentConfig = 0
      }

      return command
    }

    return null
  }

  /**
   * 检查波次是否生成完毕
   */
  isSpawningComplete(): boolean {
    return this._currentSummonIndex >= this._summons.length
  }

  /**
   * 获取波次进度（0-1）
   */
  getProgress(): number {
    if (this._totalMonsters === 0) return 1
    return this._totalSpawned / this._totalMonsters
  }

  /**
   * 获取波次编号
   */
  getWaveNumber(): number {
    return this._waveNumber
  }

  /**
   * 获取休息时间
   */
  getRestTicks(): number {
    return this._restTicks
  }

  /**
   * 获取总怪物数量
   */
  getTotalMonsters(): number {
    return this._totalMonsters
  }

  /**
   * 获取已生成数量
   */
  getSpawnedCount(): number {
    return this._totalSpawned
  }

  /**
   * 重置波次状态（用于重玩）
   */
  reset(): void {
    this._currentSummonIndex = 0
    this._spawnedInCurrentConfig = 0
    this._lastSpawnTick = -Infinity
    this._totalSpawned = 0
  }
}

// ============================================================================
// WaveManager 类 - 波次系统核心管理器（单例）
// ============================================================================

/**
 * 波次管理器 - 管理所有波次的生命周期和状态转换
 */
class WaveManager {
  private static _instance: WaveManager | null = null

  /** 所有波次列表 */
  private _waves: Wave[] = []
  /** 当前波次索引 */
  private _currentWaveIndex: number = -1
  /** 当前状态 */
  private _state: WaveState = WaveState.IDLE
  /** 休息开始的 tick */
  private _restStartTick: number = 0
  /** 是否自动开始下一波 */
  private _autoStart: boolean = WAVE_CONFIG.DEFAULT_AUTO_START

  /** 生成回调函数（由 Game 设置） */
  private _spawnCallback: ((monsterName: string, level: number) => void) | null = null
  /** 奖励回调函数（由 Game 设置） */
  private _rewardCallback: ((amount: number) => void) | null = null

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): WaveManager {
    if (!WaveManager._instance) {
      WaveManager._instance = new WaveManager()
    }
    return WaveManager._instance
  }

  /**
   * 重置单例（主要用于测试）
   */
  static resetInstance(): void {
    WaveManager._instance = null
  }

  /**
   * 设置生成回调
   */
  setSpawnCallback(callback: (monsterName: string, level: number) => void): void {
    this._spawnCallback = callback
  }

  /**
   * 设置奖励回调
   */
  setRewardCallback(callback: (amount: number) => void): void {
    this._rewardCallback = callback
  }

  /**
   * 加载波次列表
   */
  loadWaves(waves: Wave[]): void {
    if (!waves || waves.length === 0) {
      console.warn('[WaveManager] 尝试加载空波次列表')
      return
    }

    this._waves = waves
    this._currentWaveIndex = 0
    this._state = WaveState.WAITING_FOR_START
    console.log(`[WaveManager] 已加载 ${waves.length} 个波次`)
  }

  /**
   * 开始下一波
   * @returns 是否成功开始
   */
  startNextWave(): boolean {
    if (this._state === WaveState.RESTING) {
      // 提前开始，给予金币奖励
      if (this._rewardCallback) {
        this._rewardCallback(WAVE_CONFIG.EARLY_START_GOLD_BONUS)
      }
      // 推进到下一波（与自然休息结束逻辑一致）
      this._currentWaveIndex++
      if (this._currentWaveIndex >= this._waves.length) {
        this._state = WaveState.COMPLETED
        console.log('[WaveManager] 所有波次已完成！')
        return false
      }
      // 直接进入生成状态，防止二次调用重复推进
      const wave = this._waves[this._currentWaveIndex]
      if (wave) {
        wave.reset()
        this._state = WaveState.SPAWNING
        console.log(`[WaveManager] 提前开始第 ${wave.getWaveNumber()} 波`)
        return true
      }
      return false
    }

    if (this._state === WaveState.WAITING_FOR_START) {
      const wave = this._waves[this._currentWaveIndex]
      if (wave) {
        wave.reset()
        this._state = WaveState.SPAWNING
        console.log(`[WaveManager] 开始第 ${wave.getWaveNumber()} 波`)
        return true
      }
    }

    return false
  }

  /**
   * 设置是否自动开始
   */
  setAutoStart(auto: boolean): void {
    this._autoStart = auto
  }

  /**
   * 获取是否自动开始
   */
  isAutoStart(): boolean {
    return this._autoStart
  }

  /**
   * 主更新循环 - 每帧调用
   * @param currentTick 当前游戏 tick
   */
  update(currentTick: number): void {
    switch (this._state) {
      case WaveState.SPAWNING:
        this._updateSpawning(currentTick)
        break
      case WaveState.RESTING:
        this._updateResting(currentTick)
        break
      default:
        // IDLE, WAITING_FOR_START, COMPLETED 状态不需要更新
        break
    }
  }

  /**
   * 更新生成状态
   */
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

  /**
   * 开始休息阶段
   */
  private _startResting(currentTick: number): void {
    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return

    // 发放波次通关奖励
    if (this._rewardCallback) {
      this._rewardCallback(WAVE_CONFIG.WAVE_CLEAR_GOLD_BONUS)
    }

    console.log(`[WaveManager] 第 ${wave.getWaveNumber()} 波完成，进入休息阶段`)

    this._restStartTick = currentTick
    this._state = WaveState.RESTING
  }

  /**
   * 更新休息状态
   */
  private _updateResting(currentTick: number): void {
    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return

    const restElapsed = currentTick - this._restStartTick

    if (restElapsed >= wave.getRestTicks()) {
      // 休息结束
      if (this._currentWaveIndex + 1 >= this._waves.length) {
        // 所有波次完成
        this._state = WaveState.COMPLETED
        console.log('[WaveManager] 所有波次已完成！')
      } else {
        // 进入下一波
        this._currentWaveIndex++
        if (this._autoStart) {
          this._state = WaveState.SPAWNING
          this._waves[this._currentWaveIndex]?.reset()
          console.log(`[WaveManager] 自动开始第 ${this._waves[this._currentWaveIndex]?.getWaveNumber()} 波`)
        } else {
          this._state = WaveState.WAITING_FOR_START
        }
      }
    }
  }

  // ============= 状态查询方法 =============

  /**
   * 获取当前状态
   */
  getState(): WaveState {
    return this._state
  }

  /**
   * 获取当前波次
   */
  getCurrentWave(): Wave | null {
    return this._waves[this._currentWaveIndex] ?? null
  }

  /**
   * 获取当前波次编号（从 1 开始）
   */
  getCurrentWaveNumber(): number {
    const wave = this._waves[this._currentWaveIndex]
    return wave ? wave.getWaveNumber() : 0
  }

  /**
   * 获取总波次数
   */
  getTotalWaves(): number {
    return this._waves.length
  }

  /**
   * 获取休息进度（0-1）
   */
  getRestProgress(currentTick: number): number {
    if (this._state !== WaveState.RESTING) return 0

    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return 0

    const restElapsed = currentTick - this._restStartTick
    return Math.min(restElapsed / wave.getRestTicks(), 1)
  }

  /**
   * 获取剩余休息时间（tick）
   */
  getRestRemainingTicks(currentTick: number): number {
    if (this._state !== WaveState.RESTING) return 0

    const wave = this._waves[this._currentWaveIndex]
    if (!wave) return 0

    const restElapsed = currentTick - this._restStartTick
    return Math.max(wave.getRestTicks() - restElapsed, 0)
  }

  /**
   * 是否可以开始下一波
   */
  canStartNextWave(): boolean {
    return this._state === WaveState.WAITING_FOR_START || this._state === WaveState.RESTING
  }

  /**
   * 追加波次（用于无尽模式）
   */
  appendWaves(waves: Wave[]): void {
    this._waves.push(...waves)
    if (this._state === WaveState.COMPLETED) {
      this._currentWaveIndex = this._waves.length - waves.length
      this._state = WaveState.WAITING_FOR_START
    }
  }

  /**
   * 获取当前波次编号（供外部快速访问）
   */
  get waveNumber(): number {
    return this.getCurrentWaveNumber()
  }

  /**
   * 检查是否为 Boss 波次
   */
  isBossWave(waveNumber?: number): boolean {
    const num = waveNumber ?? this.getCurrentWaveNumber()
    return num > 0 && num % WAVE_CONFIG.BOSS_WAVE_INTERVAL === 0
  }
}

// ============================================================================
// WaveFactory 类 - 波次配置工厂
// ============================================================================

/**
 * 波次配置定义
 */
interface WaveDefinition {
  /** 波次编号 */
  waveNumber: number
  /** 召唤配置列表 */
  summons: SummonConfig[]
  /** 休息时间（tick） */
  restTicks: number
}

/**
 * 波次工厂 - 创建预定义的波次配置
 */
class WaveFactory {
  /** 普通怪物类型列表 */
  private static readonly NORMAL_MONSTERS = ['Swordman', 'Axeman', 'LionMan']
  /** Boss 怪物类型列表 */
  private static readonly BOSS_MONSTERS = ['Devil', 'HighPriest']

  /**
   * 验证波次定义的有效性
   * @param def 波次定义
   * @throws Error 如果定义无效
   */
  private static validateWaveDefinition(def: WaveDefinition): void {
    if (!def.summons || def.summons.length === 0) {
      throw new Error(`[WaveFactory] 波次 ${def.waveNumber} 没有定义召唤配置`)
    }

    def.summons.forEach((summon, idx) => {
      if (summon.count <= 0) {
        throw new Error(`[WaveFactory] 波次 ${def.waveNumber} 召唤配置 ${idx} 的数量无效: ${summon.count}`)
      }
      if (summon.spawnInterval < 0) {
        throw new Error(`[WaveFactory] 波次 ${def.waveNumber} 召唤配置 ${idx} 的生成间隔无效: ${summon.spawnInterval}`)
      }
    })

    if (def.restTicks < 0) {
      throw new Error(`[WaveFactory] 波次 ${def.waveNumber} 的休息时间无效: ${def.restTicks}`)
    }
  }

  /**
   * 根据定义创建波次
   */
  static createWave(def: WaveDefinition): Wave {
    this.validateWaveDefinition(def)
    return new Wave(def.waveNumber, def.summons, def.restTicks)
  }

  /**
   * 创建标准波次列表（10 波）
   */
  static createStandardWaves(): Wave[] {
    const definitions = this.createStandardWaveDefinitions()
    return definitions.map(def => this.createWave(def))
  }

  /**
   * 创建标准波次定义列表
   */
  static createStandardWaveDefinitions(): WaveDefinition[] {
    const definitions: WaveDefinition[] = []

    for (let i = 1; i <= 10; i++) {
      definitions.push(this.createWaveDefinition(i))
    }

    return definitions
  }

  /**
   * 创建单个波次定义
   * @param waveNumber 波次编号（从 1 开始）
   */
  static createWaveDefinition(waveNumber: number): WaveDefinition {
    const isBossWave = waveNumber % WAVE_CONFIG.BOSS_WAVE_INTERVAL === 0
    const level = Math.floor(1 + (waveNumber - 1) * WAVE_CONFIG.LEVEL_INCREMENT_PER_WAVE)
    const monsterCount = WAVE_CONFIG.MONSTER_COUNT_BASE + (waveNumber - 1) * WAVE_CONFIG.MONSTER_COUNT_INCREMENT

    const summons: SummonConfig[] = []

    if (isBossWave) {
      // Boss 波次：先生成普通怪物，再生成 Boss
      const normalCount = Math.floor(monsterCount * 0.6)
      const monsterType = this.NORMAL_MONSTERS[waveNumber % this.NORMAL_MONSTERS.length]!
      const bossType = this.BOSS_MONSTERS[(waveNumber / WAVE_CONFIG.BOSS_WAVE_INTERVAL - 1) % this.BOSS_MONSTERS.length]!

      summons.push({
        monsterName: monsterType,
        count: normalCount,
        level: level,
        spawnInterval: WAVE_CONFIG.FAST_SPAWN_INTERVAL
      })

      summons.push({
        monsterName: bossType,
        count: 1,
        level: level,
        spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL * 2
      })

      return {
        waveNumber,
        summons,
        restTicks: WAVE_CONFIG.BOSS_WAVE_REST_TICKS
      }
    } else {
      // 普通波次：混合怪物类型
      const monstersPerType = Math.ceil(monsterCount / 2)
      const type1 = this.NORMAL_MONSTERS[(waveNumber - 1) % this.NORMAL_MONSTERS.length]!
      const type2 = this.NORMAL_MONSTERS[waveNumber % this.NORMAL_MONSTERS.length]!

      summons.push({
        monsterName: type1,
        count: monstersPerType,
        level: level,
        spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL
      })

      if (waveNumber > 1) {
        summons.push({
          monsterName: type2,
          count: Math.floor(monstersPerType * 0.5),
          level: level,
          spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL
        })
      }

      return {
        waveNumber,
        summons,
        restTicks: WAVE_CONFIG.DEFAULT_REST_TICKS
      }
    }
  }

  /**
   * 创建无尽模式波次定义
   * @param waveNumber 波次编号
   */
  static createEndlessWaveDefinition(waveNumber: number): WaveDefinition {
    // 无尽模式：难度随波次指数增长
    const level = Math.floor(1 + waveNumber * 0.5 + Math.pow(waveNumber, 1.2) * 0.1)
    const monsterCount = Math.floor(WAVE_CONFIG.MONSTER_COUNT_BASE + waveNumber * 3)
    const isBossWave = waveNumber % WAVE_CONFIG.BOSS_WAVE_INTERVAL === 0

    const summons: SummonConfig[] = []
    const monsterType = this.NORMAL_MONSTERS[waveNumber % this.NORMAL_MONSTERS.length]!

    summons.push({
      monsterName: monsterType,
      count: monsterCount,
      level: level,
      spawnInterval: Math.max(WAVE_CONFIG.FAST_SPAWN_INTERVAL - Math.floor(waveNumber / 5), 10)
    })

    if (isBossWave) {
      const bossType = this.BOSS_MONSTERS[(waveNumber / WAVE_CONFIG.BOSS_WAVE_INTERVAL - 1) % this.BOSS_MONSTERS.length]!
      summons.push({
        monsterName: bossType,
        count: 1 + Math.floor(waveNumber / 20),
        level: level + 5,
        spawnInterval: WAVE_CONFIG.DEFAULT_SPAWN_INTERVAL
      })
    }

    return {
      waveNumber,
      summons,
      restTicks: isBossWave ? WAVE_CONFIG.BOSS_WAVE_REST_TICKS : WAVE_CONFIG.DEFAULT_REST_TICKS
    }
  }
}

// ============================================================================
// WaveUIManager 类 - 波次 UI 管理器
// ============================================================================

/**
 * 波次 UI 管理器 - 管理波次系统的用户界面
 */
class WaveUIManager {
  private _panelEl: HTMLDivElement | null = null
  private _waveNumberEl: HTMLSpanElement | null = null
  private _waveTotalEl: HTMLSpanElement | null = null
  private _progressBarEl: HTMLDivElement | null = null
  private _restTimerEl: HTMLDivElement | null = null
  private _startBtnEl: HTMLButtonElement | null = null
  private _autoStartEl: HTMLInputElement | null = null

  private _initialized: boolean = false

  /**
   * 初始化 UI 元素绑定
   */
  init(): void {
    this._panelEl = document.getElementById('wave_panel') as HTMLDivElement
    this._waveNumberEl = document.getElementById('wave_number') as HTMLSpanElement
    this._waveTotalEl = document.getElementById('wave_total') as HTMLSpanElement
    this._progressBarEl = document.getElementById('wave_progress_bar') as HTMLDivElement
    this._restTimerEl = document.getElementById('wave_rest_timer') as HTMLDivElement
    this._startBtnEl = document.getElementById('wave_start_btn') as HTMLButtonElement
    this._autoStartEl = document.getElementById('wave_auto_start') as HTMLInputElement

    if (!this._panelEl || !this._startBtnEl || !this._autoStartEl) {
      console.warn('[WaveUIManager] 部分 UI 元素未找到')
      return
    }

    this._bindEventListeners()
    this._initialized = true

    // 显示面板
    this._panelEl.style.display = 'block'

    // 初始化 UI 状态
    this.updateTotalWaves()
    this.update(0)
  }

  /**
   * 绑定事件监听器
   */
  private _bindEventListeners(): void {
    if (this._startBtnEl) {
      this._startBtnEl.onclick = () => {
        WaveManager.getInstance().startNextWave()
      }
    }

    if (this._autoStartEl) {
      this._autoStartEl.onchange = () => {
        WaveManager.getInstance().setAutoStart(this._autoStartEl!.checked)
      }
    }
  }

  /**
   * 更新总波次数显示
   * @param total 可选，直接指定总数
   */
  updateTotalWaves(total?: number): void {
    const manager = WaveManager.getInstance()
    if (this._waveTotalEl) {
      this._waveTotalEl.textContent = `/ ${total ?? manager.getTotalWaves()}`
    }
  }

  /**
   * 主更新方法 - 每帧调用
   * @param currentTick 当前游戏 tick
   */
  update(currentTick: number): void {
    if (!this._initialized) return

    const manager = WaveManager.getInstance()
    const state = manager.getState()

    switch (state) {
      case WaveState.IDLE:
        this._updateIdleUI()
        break
      case WaveState.WAITING_FOR_START:
        this._updateWaitingUI(manager)
        break
      case WaveState.SPAWNING:
        this._updateSpawningUI(manager)
        break
      case WaveState.RESTING:
        this._updateRestingUI(manager, currentTick)
        break
      case WaveState.COMPLETED:
        this._updateCompletedUI()
        break
    }
  }

  /**
   * 更新空闲状态 UI
   */
  private _updateIdleUI(): void {
    if (this._startBtnEl) {
      this._startBtnEl.disabled = true
      this._startBtnEl.textContent = '等待加载...'
    }
    if (this._restTimerEl) {
      this._restTimerEl.textContent = ''
    }
    if (this._progressBarEl) {
      this._progressBarEl.style.width = '0%'
    }
  }

  /**
   * 更新等待开始状态 UI
   */
  private _updateWaitingUI(manager: WaveManager): void {
    const waveNumber = manager.getCurrentWaveNumber()
    const isBoss = manager.isBossWave()

    if (this._waveNumberEl) {
      this._waveNumberEl.textContent = `第 ${waveNumber} 波`
      if (isBoss) {
        this._waveNumberEl.style.color = '#f56c6c'
      } else {
        this._waveNumberEl.style.color = ''
      }
    }

    if (this._startBtnEl) {
      this._startBtnEl.disabled = false
      this._startBtnEl.textContent = isBoss ? `开始 BOSS 波！` : `开始第 ${waveNumber} 波`
    }

    if (this._restTimerEl) {
      this._restTimerEl.textContent = '准备就绪'
    }

    if (this._progressBarEl) {
      this._progressBarEl.style.width = '0%'
    }
  }

  /**
   * 更新生成中状态 UI
   */
  private _updateSpawningUI(manager: WaveManager): void {
    const wave = manager.getCurrentWave()
    if (!wave) return

    const waveNumber = wave.getWaveNumber()
    const progress = wave.getProgress()
    const isBoss = manager.isBossWave()

    if (this._waveNumberEl) {
      this._waveNumberEl.textContent = `第 ${waveNumber} 波`
      if (isBoss) {
        this._waveNumberEl.style.color = '#f56c6c'
      } else {
        this._waveNumberEl.style.color = ''
      }
    }

    if (this._progressBarEl) {
      this._progressBarEl.style.width = `${Math.floor(progress * 100)}%`
    }

    if (this._startBtnEl) {
      this._startBtnEl.disabled = true
      this._startBtnEl.textContent = `进行中 ${wave.getSpawnedCount()}/${wave.getTotalMonsters()}`
    }

    if (this._restTimerEl) {
      this._restTimerEl.textContent = ''
    }
  }

  /**
   * 更新休息状态 UI
   */
  private _updateRestingUI(manager: WaveManager, currentTick: number): void {
    const wave = manager.getCurrentWave()
    if (!wave) return

    const remainingTicks = manager.getRestRemainingTicks(currentTick)
    // 确保至少显示 1 秒，避免显示 0 秒的闪烁
    const remainingSeconds = Math.max(1, Math.ceil(remainingTicks / GAME_TIMING.TICK_RATE))
    const nextWaveNumber = manager.getCurrentWaveNumber() + 1
    const isNextBoss = manager.isBossWave(nextWaveNumber)

    if (this._waveNumberEl) {
      this._waveNumberEl.textContent = `第 ${wave.getWaveNumber()} 波 完成`
      this._waveNumberEl.style.color = '#67c23a'
    }

    if (this._progressBarEl) {
      this._progressBarEl.style.width = '100%'
    }

    if (this._restTimerEl) {
      this._restTimerEl.textContent = `休息时间: ${remainingSeconds}秒`
    }

    if (this._startBtnEl) {
      this._startBtnEl.disabled = false
      const bonusText = ` (+${WAVE_CONFIG.EARLY_START_GOLD_BONUS}金币)`
      if (isNextBoss) {
        this._startBtnEl.textContent = `提前开始 BOSS 波${bonusText}`
      } else {
        this._startBtnEl.textContent = `提前开始第 ${nextWaveNumber} 波${bonusText}`
      }
    }
  }

  /**
   * 更新完成状态 UI
   */
  private _updateCompletedUI(): void {
    if (this._waveNumberEl) {
      this._waveNumberEl.textContent = '全部完成！'
      this._waveNumberEl.style.color = '#67c23a'
    }

    if (this._progressBarEl) {
      this._progressBarEl.style.width = '100%'
    }

    if (this._startBtnEl) {
      this._startBtnEl.disabled = true
      this._startBtnEl.textContent = '恭喜通关！'
    }

    if (this._restTimerEl) {
      this._restTimerEl.textContent = ''
    }
  }
}
