/// <reference path='./math-utils.ts' />

/**
 * 格式化工具类
 * 提供数字格式化和显示功能
 */
class FormatUtils {
  /** 美式数字格式化器 */
  static formatterUs = new Intl.NumberFormat('en-US')

  /** 中文数字格式化器 */
  static formatterCh = new Intl.NumberFormat('zh-u-nu-hanidec')

  /**
   * 英式简写格式化 (K, M, B, T)
   * @param num 要格式化的数字
   * @param precise 小数位数，默认为1
   */
  static britishFormatter(num: number, precise = 1): string {
    const thisAbs = Math.abs(num)
    if (thisAbs < 1e3) {
      return MathUtils.roundWithFixed(num, precise) + ''
    } else if (thisAbs < 1e6) {
      return MathUtils.roundWithFixed(num / 1e3, precise) + ' K'
    } else if (thisAbs < 1e9) {
      return MathUtils.roundWithFixed(num / 1e6, precise) + ' M'
    } else if (thisAbs < 1e12) {
      return MathUtils.roundWithFixed(num / 1e9, precise) + ' B'
    } else {
      return this.formatterUs.format(MathUtils.roundWithFixed(num / 1e12, precise)) + ' T'
    }
  }

  /**
   * 中文简写格式化 (万, 亿, 兆, 京, 垓)
   * @param num 要格式化的数字
   * @param precise 小数位数，默认为3
   * @param block 分隔符，默认为空
   */
  static chineseFormatter(num: number, precise = 3, block = ''): string {
    const thisAbs = Math.abs(num)
    if (thisAbs < 1e4) {
      return MathUtils.roundWithFixed(num, precise) + ''
    } else if (thisAbs < 1e8) {
      return MathUtils.roundWithFixed(num / 1e4, precise) + block + '万'
    } else if (thisAbs < 1e12) {
      return MathUtils.roundWithFixed(num / 1e8, precise) + block + '亿'
    } else if (thisAbs < 1e16) {
      return MathUtils.roundWithFixed(num / 1e12, precise) + block + '兆'
    } else if (thisAbs < 1e20) {
      return MathUtils.roundWithFixed(num / 1e16, precise) + block + '京'
    } else {
      return MathUtils.roundWithFixed(num / 1e20, precise) + block + '垓'
    }
  }
}
