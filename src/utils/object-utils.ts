/// <reference path='../typedef.ts' />

/**
 * 对象操作工具类
 * 提供对象属性定义的安全方法
 */
class ObjectUtils {
  /**
   * 为源对象添加属性
   * 此属性不可删除，但可写
   */
  static addFinalProperty<T, K extends string>(Source: T, Key: K, Value: any): T {
    return Object.defineProperty(Source, Key, {
      configurable: false,
      enumerable: true,
      writable: true,
      value: Value
    })
  }

  /**
   * 为源对象添加只读属性
   * 此属性不可覆写，不可删除，不可修改
   */
  static addFinalReadonlyProperty<T, K extends string>(Source: T, Key: K, Value: any): T {
    return Object.defineProperty(Source, Key, {
      configurable: false,
      enumerable: true,
      writable: false,
      value: Value
    })
  }

  /**
   * 为源对象添加 Getter 属性
   * 此属性不可覆写，不可删除
   */
  static addFinalGetterProperty<T, K extends string>(Source: T, Key: K, Getter: () => any): T {
    return Object.defineProperty(Source, Key, {
      configurable: false,
      enumerable: true,
      get: Getter
    })
  }
}
