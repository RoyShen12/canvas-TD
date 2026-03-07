/**
 * 类注册表系统 - 替代 eval() 的安全方案
 * 用于动态创建 Tower、Monster、Bullet 实例
 */

class ClassRegistry<T> {
  private registry = new Map<string, new (...args: any[]) => T>()

  /**
   * 注册一个类到注册表
   * @param name 类名（字符串标识符）
   * @param ctor 类构造函数
   */
  register(name: string, ctor: new (...args: any[]) => T): void {
    if (this.registry.has(name)) {
      console.warn(`ClassRegistry: Overwriting existing class "${name}"`)
    }
    this.registry.set(name, ctor)
  }

  /**
   * 获取类构造函数
   * @param name 类名
   * @returns 类构造函数，如果未找到则返回 undefined
   */
  get(name: string): (new (...args: any[]) => T) | undefined {
    return this.registry.get(name)
  }

  /**
   * 检查类是否已注册
   * @param name 类名
   */
  has(name: string): boolean {
    return this.registry.has(name)
  }

  /**
   * 获取类构造函数，如果未找到则抛出错误
   * @param name 类名
   * @throws Error 如果类未注册
   */
  getOrThrow(name: string): new (...args: any[]) => T {
    const ctor = this.registry.get(name)
    if (!ctor) {
      throw new Error(`ClassRegistry: Class not found: "${name}"`)
    }
    return ctor
  }

  /**
   * 获取所有已注册的类名
   */
  getRegisteredNames(): string[] {
    return Array.from(this.registry.keys())
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.registry.clear()
  }
}

// 全局注册表实例
const TowerRegistry = new ClassRegistry<TowerBase>()
const MonsterRegistry = new ClassRegistry<MonsterBase>()
const BulletRegistry = new ClassRegistry<BulletBase>()
