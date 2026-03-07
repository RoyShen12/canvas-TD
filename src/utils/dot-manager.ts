/// <reference path='./math-utils.ts' />

/**
 * DOT（持续伤害）目标接口
 * 用于解耦 DOTManager 和 MonsterBase
 */
interface IDOTTarget {
  isDead: boolean
  health: number
  armorResistance: number
  /** 应用伤害的方法 */
  applyDamage(rawDamage: number): number
  /** 定时器ID列表（用于清理） */
  intervalTimers: number[]
}

/**
 * DOT 效果管理器
 * 处理持续伤害效果的安装和管理
 */
class DOTManager {
  /**
   * 安装 DOT 效果（不可叠加）
   * @param target 目标单位
   * @param dotDebuffName 效果标记名称（目标上的 boolean 属性）
   * @param duration 持续时间 (ms)
   * @param interval 跳伤间隔 (ms)
   * @param singleAttack 单次伤害
   * @param isIgnoreArmor 是否无视护甲
   * @param damageEmitter 伤害回调
   */
  static installDOT<T extends IDOTTarget>(
    target: T,
    dotDebuffName: string,
    duration: number,
    interval: number,
    singleAttack: number,
    isIgnoreArmor: boolean,
    damageEmitter: (target: T) => void
  ): void {
    const targetRecord = target as unknown as Record<string, boolean>

    if (typeof targetRecord[dotDebuffName] !== 'boolean') {
      console.log(target)
      throw new Error('target has no debuff mark as name ' + dotDebuffName)
    }

    if (targetRecord[dotDebuffName] || target.isDead) {
      return
    }

    if (singleAttack === 0 || duration === 0) {
      return
    }

    let dotCount = 0
    // 目标标记 debuff
    targetRecord[dotDebuffName] = true

    const itv = setInterval(() => {
      if (++dotCount > duration / interval) {
        // 效果结束、移除状态、结束计时器
        targetRecord[dotDebuffName] = false
        clearInterval(itv)
        return
      }
      if (target.health > 0) {
        // 跳 DOT
        const damage = singleAttack * (isIgnoreArmor ? 1 : 1 - target.armorResistance)
        target.applyDamage(damage)
        damageEmitter(target)
      } else {
        // 目标死亡，结束计时器
        clearInterval(itv)
      }
    }, interval)

    // 将定时器追踪到目标的清理列表
    target.intervalTimers.push(itv as unknown as number)
  }

  /**
   * 安装可叠加的 DOT 效果
   * @param target 目标单位
   * @param dotDebuffName 效果标记名称（目标上的 string[] 属性）
   * @param duration 持续时间 (ms)
   * @param interval 跳伤间隔 (ms)
   * @param singleAttack 单次伤害
   * @param isIgnoreArmor 是否无视护甲
   * @param damageEmitter 伤害回调
   */
  static installDotDuplicatable<T extends IDOTTarget>(
    target: T,
    dotDebuffName: string,
    duration: number,
    interval: number,
    singleAttack: number,
    isIgnoreArmor: boolean,
    damageEmitter: (target: T) => void
  ): void {
    const targetRecord = target as unknown as Record<string, string[]>

    if (!Array.isArray(targetRecord[dotDebuffName])) {
      console.log(target)
      throw new Error('target has no debuff mark as name ' + dotDebuffName)
    }

    if (target.isDead) {
      return
    }

    if (singleAttack === 0 || duration === 0) {
      return
    }

    let dotCount = 0
    const thisId = MathUtils.randomStr(8)

    targetRecord[dotDebuffName]!.push(thisId)

    const itv = setInterval(() => {
      if (++dotCount > duration / interval) {
        // 效果结束、结束计时器
        targetRecord[dotDebuffName] = targetRecord[dotDebuffName]!.filter(d => d !== thisId)
        clearInterval(itv)
        return
      }
      if (target.health > 0) {
        const dotD = singleAttack * (isIgnoreArmor ? 1 : 1 - target.armorResistance)
        target.applyDamage(dotD)
        damageEmitter(target)
      } else {
        clearInterval(itv)
      }
    }, interval)

    // 将定时器追踪到目标的清理列表
    target.intervalTimers.push(itv as unknown as number)
  }
}
