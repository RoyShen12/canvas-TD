/// <reference path="../types/debuff-types.ts" />

/**
 * Debuff 管理器
 * 集中管理所有实体的负面效果
 */
class DebuffManager {
  /** 实体 ID 到 debuff 列表的映射 */
  private debuffs: Map<number, IDebuff[]> = new Map()

  /**
   * 获取实体的所有 debuff
   */
  getDebuffs(entityId: number): IDebuff[] {
    return this.debuffs.get(entityId) || []
  }

  /**
   * 检查实体是否拥有指定类型的 debuff
   */
  hasDebuff(entityId: number, type: DebuffType): boolean {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return false
    return debuffs.some(d => d.type === type)
  }

  /**
   * 获取指定类型的 debuff
   */
  getDebuff(entityId: number, type: DebuffType): IDebuff | undefined {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return undefined
    return debuffs.find(d => d.type === type)
  }

  /**
   * 获取指定类型的所有 debuff（用于可堆叠的 debuff）
   */
  getDebuffsByType(entityId: number, type: DebuffType): IDebuff[] {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return []
    return debuffs.filter(d => d.type === type)
  }

  /**
   * 应用 debuff
   * @param entityId 实体 ID
   * @param config debuff 配置
   * @param stackable 是否可堆叠（如果不可堆叠，则刷新持续时间）
   */
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
      // 可堆叠：直接添加
      debuffs.push(newDebuff)
    } else {
      // 不可堆叠：刷新持续时间（取较长者）
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

  /**
   * 移除指定类型的 debuff
   */
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

  /**
   * 每帧调用，递减 debuff 持续时间并移除过期的
   */
  tick(entityId: number): void {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return

    // 递减持续时间
    for (const debuff of debuffs) {
      debuff.remainingTicks--
    }

    // 移除过期的 debuff
    const remaining = debuffs.filter(d => d.remainingTicks > 0)
    if (remaining.length === 0) {
      this.debuffs.delete(entityId)
    } else if (remaining.length !== debuffs.length) {
      this.debuffs.set(entityId, remaining)
    }
  }

  /**
   * 清理实体的所有 debuff（实体死亡时调用）
   */
  clearEntity(entityId: number): void {
    this.debuffs.delete(entityId)
  }

  /**
   * 检查实体是否被控制（无法移动）
   */
  isTrapped(entityId: number): boolean {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return false

    return debuffs.some(d => CONTROL_DEBUFFS.includes(d.type))
  }

  /**
   * 检查实体是否被完全定身（freeze 或 imprison）
   */
  isImmobilized(entityId: number): boolean {
    return this.hasDebuff(entityId, DebuffType.FREEZE) ||
           this.hasDebuff(entityId, DebuffType.IMPRISON)
  }

  /**
   * 获取速度修正值
   * @returns 速度倍率，0 表示无法移动
   */
  getSpeedModifier(entityId: number): number {
    if (this.isImmobilized(entityId)) {
      return 0
    }

    if (this.hasDebuff(entityId, DebuffType.CONFUSE)) {
      return -0.5 // 混乱时倒退
    }

    // 计算减速效果（多个减速可叠加）
    const slowDebuffs = this.getDebuffsByType(entityId, DebuffType.SLOW)
    if (slowDebuffs.length === 0) {
      return 1
    }

    // 取最强的减速效果
    let minRatio = 1
    for (const debuff of slowDebuffs) {
      const ratio = debuff.data?.speedRatio ?? 1
      if (ratio < minRatio) {
        minRatio = ratio
      }
    }
    return minRatio
  }

  /**
   * 获取伤害修正值（诅咒效果）
   * @returns 伤害倍率
   */
  getDamageMultiplier(entityId: number): number {
    const curseDebuffs = this.getDebuffsByType(entityId, DebuffType.IMPRECATE)
    if (curseDebuffs.length === 0) {
      return 1
    }

    // 诅咒效果相乘
    let multiplier = 1
    for (const debuff of curseDebuffs) {
      multiplier *= debuff.data?.damageMultiplier ?? 1
    }
    return multiplier
  }

  /**
   * 获取所有激活的 debuff 类型（用于渲染图标）
   */
  getActiveDebuffTypes(entityId: number): DebuffType[] {
    const debuffs = this.debuffs.get(entityId)
    if (!debuffs) return []

    // 去重
    const types = new Set<DebuffType>()
    for (const debuff of debuffs) {
      types.add(debuff.type)
    }
    return Array.from(types)
  }

  /**
   * 获取 shock debuff 的额外数据
   */
  getShockData(entityId: number): { chargeAmount: number; leakChance: number; sourceId: number } | null {
    const shock = this.getDebuff(entityId, DebuffType.SHOCK)
    if (!shock || !shock.data) return null

    return {
      chargeAmount: shock.data.chargeAmount ?? 0,
      leakChance: shock.data.leakChance ?? 0,
      sourceId: shock.data.sourceId ?? 0,
    }
  }

  /**
   * 获取 light echo debuff 的 DOT ID 列表
   */
  getLightEchoIds(entityId: number): string[] {
    const echoDebuffs = this.getDebuffsByType(entityId, DebuffType.LIGHT_ECHO)
    return echoDebuffs
      .map(d => d.data?.dotId)
      .filter((id): id is string => id !== undefined)
  }
}

// 全局单例
const debuffManager = new DebuffManager()
