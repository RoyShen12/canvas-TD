/// <reference path='../typedef.ts' />

/**
 * 数学工具类
 * 提供通用数学运算和随机数生成功能
 */
class MathUtils {
  /**
   * 四舍五入到指定小数位
   */
  static roundWithFixed(num: number, fractionDigits: number): number {
    const t = 10 ** fractionDigits
    return Math.round(num * t) / t
  }

  /**
   * 生成指定位数的随机十六进制字符串
   */
  static randomStr(bits: number): string {
    return new Array(bits)
      .fill(1)
      .map(() => (((Math.random() * 16) | 0) & 0xf).toString(16))
      .join('')
  }

  /**
   * 随机返回 1 或 -1
   */
  static randomSig(): 1 | -1 {
    return Math.random() < 0.5 ? 1 : -1
  }

  /**
   * 检查值是否为有效数字
   */
  static isNumberSafe(numberLike: number | string): boolean {
    return numberLike !== '' && numberLike !== ' ' && !isNaN(numberLike as number)
  }

  /**
   * 将新值推入类型数组的尾部，如已满会抛弃最头部的一个值
   * @returns 数组的实际长度
   * @note 此方法认为所有连续 -1 值都来自初始化
   */
  static typedArrayPush(tArr: TypedArray, newValue: number): number {
    const zeroIndex = tArr.indexOf(-1)

    if (zeroIndex === -1) {
      // 数组已满，移除首元素，追加新值
      tArr.set(tArr.subarray(1))
      tArr.set([newValue], tArr.length - 1)
      return tArr.length
    } else {
      // 在空位插入
      tArr.set([newValue], zeroIndex)
      return zeroIndex + 1
    }
  }

  /**
   * 返回一个比较某个属性的比较函数
   * 通常用于作为 Array.sort() 的参数
   * @example A.sort(MathUtils.compareProperties('score'))
   */
  static compareProperties(
    properties: string,
    cFx?: (a: any, b: any) => number,
    ascend: boolean = true
  ): (a: any, b: any) => number {
    const compareFn = cFx ?? ((a, b) => a - b)
    return (a: any, b: any) => compareFn(a[properties], b[properties]) * (ascend ? 1 : -1)
  }

  /**
   * 异步延迟
   */
  static sleep = async (ms: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 数学函数生成器
 * 提供常用曲线函数的工厂方法
 */
class MathFx {
  /**
   * 双曲函数: a + b / (x + φ)
   */
  static curveFx = (a: number, b: number, phi = 0) => (x: number): number => a + b / (x + phi)

  /**
   * 自然对数函数: a + b * ln(x + c)
   */
  static naturalLogFx = (a: number, b: number, c = 1) => (x: number): number => a + b * Math.log(x + c)

  /**
   * 指数函数: a * e^(b * (x + φ))
   */
  static exponentialFx = (a: number, b: number, phi = 0) => (x: number): number => a * Math.pow(Math.E, b * (x + phi))

  /**
   * 幂函数: a * (x + φ)^b
   */
  static powerFx = (a: number, b: number, phi = 0) => (x: number): number => a * Math.pow(x + phi, b)

  /**
   * S-曲线函数 (Logistic): 1 / (a + b * e^(-(x + φ)))
   */
  static sCurveFx = (a: number, b: number, phi = 0) => (x: number): number => 1 / (a + b * Math.pow(Math.E, -(x + phi)))
}
