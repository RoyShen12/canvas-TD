/**
 * 游戏错误处理系统
 * 提供统一的错误捕获、记录和恢复机制
 */

interface ErrorLogEntry {
  timestamp: number
  error: Error
  context: string
  stack?: string
}

class GameErrorHandler {
  private errors: ErrorLogEntry[] = []
  private readonly maxLogSize: number

  constructor(maxLogSize = 100) {
    this.maxLogSize = maxLogSize
  }

  /**
   * 记录并处理错误
   * @param error 错误对象
   * @param context 错误发生的上下文描述
   */
  handle(error: Error, context: string): void {
    const entry: ErrorLogEntry = {
      timestamp: performance.now(),
      error,
      context,
      stack: error.stack
    }

    this.errors.push(entry)

    // 限制日志大小
    if (this.errors.length > this.maxLogSize) {
      this.errors.shift()
    }

    // 输出到控制台
    console.error(`[Game Error] ${context}:`, error)

    // 在调试模式下显示更多信息
    if (DEBUG_CONFIG.testMode) {
      console.error('Stack trace:', error.stack)
    }
  }

  /**
   * 包装函数调用，自动捕获错误
   * @param fn 要执行的函数
   * @param context 上下文描述
   * @param fallback 错误时的回退值
   */
  wrap<T>(fn: () => T, context: string, fallback?: T): T | undefined {
    try {
      return fn()
    } catch (error) {
      this.handle(error as Error, context)
      return fallback
    }
  }

  /**
   * 包装异步函数调用
   * @param fn 要执行的异步函数
   * @param context 上下文描述
   * @param fallback 错误时的回退值
   */
  async wrapAsync<T>(fn: () => Promise<T>, context: string, fallback?: T): Promise<T | undefined> {
    try {
      return await fn()
    } catch (error) {
      this.handle(error as Error, context)
      return fallback
    }
  }

  /**
   * 断言条件为真，否则抛出错误
   * @param condition 条件
   * @param message 错误消息
   * @param context 上下文
   */
  assert(condition: boolean, message: string, context: string): asserts condition {
    if (!condition) {
      const error = new Error(`Assertion failed: ${message}`)
      this.handle(error, context)
      throw error
    }
  }

  /**
   * 获取错误日志
   */
  getErrorLog(): readonly ErrorLogEntry[] {
    return [...this.errors]
  }

  /**
   * 获取最近的错误
   * @param count 要获取的数量
   */
  getRecentErrors(count = 10): ErrorLogEntry[] {
    return this.errors.slice(-count)
  }

  /**
   * 清空错误日志
   */
  clearLog(): void {
    this.errors = []
  }

  /**
   * 获取错误统计
   */
  getStats(): { total: number; byContext: Record<string, number> } {
    const byContext: Record<string, number> = {}

    this.errors.forEach(entry => {
      byContext[entry.context] = (byContext[entry.context] || 0) + 1
    })

    return {
      total: this.errors.length,
      byContext
    }
  }
}

// 全局错误处理器实例
const gameErrorHandler = new GameErrorHandler()

// 安装全局错误监听器
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    gameErrorHandler.handle(event.error || new Error(event.message), 'Global error handler')
  })

  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    gameErrorHandler.handle(error, 'Unhandled promise rejection')
  })
}
