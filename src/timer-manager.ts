/**
 * 定时器管理器 - 统一管理 setInterval 和 setTimeout
 * 防止内存泄漏，确保定时器在对象销毁时正确清理
 */

class TimerManager {
  private intervals = new Set<number>()
  private timeouts = new Set<number>()

  /**
   * 创建一个可追踪的 setInterval
   * @param callback 回调函数
   * @param ms 间隔毫秒数
   * @returns 定时器 ID
   */
  setInterval(callback: () => void, ms: number): number {
    const id = window.setInterval(callback, ms)
    this.intervals.add(id)
    return id
  }

  /**
   * 创建一个可追踪的 setTimeout
   * @param callback 回调函数
   * @param ms 延迟毫秒数
   * @returns 定时器 ID
   */
  setTimeout(callback: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      callback()
      this.timeouts.delete(id)
    }, ms)
    this.timeouts.add(id)
    return id
  }

  /**
   * 清除一个 interval
   * @param id 定时器 ID
   */
  clearInterval(id: number): void {
    window.clearInterval(id)
    this.intervals.delete(id)
  }

  /**
   * 清除一个 timeout
   * @param id 定时器 ID
   */
  clearTimeout(id: number): void {
    window.clearTimeout(id)
    this.timeouts.delete(id)
  }

  /**
   * 清除所有管理的定时器
   */
  clearAll(): void {
    this.intervals.forEach(id => window.clearInterval(id))
    this.timeouts.forEach(id => window.clearTimeout(id))
    this.intervals.clear()
    this.timeouts.clear()
  }

  /**
   * 获取当前活动的定时器数量
   */
  get activeCount(): number {
    return this.intervals.size + this.timeouts.size
  }

  /**
   * 获取活动的 interval 数量
   */
  get intervalCount(): number {
    return this.intervals.size
  }

  /**
   * 获取活动的 timeout 数量
   */
  get timeoutCount(): number {
    return this.timeouts.size
  }
}

// 全局定时器管理器实例（用于游戏级别的定时器）
const globalTimerManager = new TimerManager()
