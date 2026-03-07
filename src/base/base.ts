/// <reference path="../typedef.ts" />

/**
 * 所有[物体]的基类
 * 提供唯一 ID 生成
 */
abstract class Base {
  /** 全局 ID 计数器 */
  private static _idCounter = 0

  /** 实体唯一标识符 */
  public readonly id: number

  constructor() {
    this.id = Base._idCounter++
  }
}
