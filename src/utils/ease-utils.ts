/// <reference path='../typedef.ts' />

/**
 * 缓动函数集合
 * @reference https://github.com/gdsmith/jquery.easing/blob/master/jquery.easing.js
 * @reference https://easings.net/
 */
class EaseFx {
  // ============= 线性 =============
  static linear = (x: number): number => x

  // ============= 二次方 =============
  static easeInQuad = (x: number): number => x * x
  static easeOutQuad = (x: number): number => 1 - (1 - x) * (1 - x)
  static easeInOutQuad = (x: number): number => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)

  // ============= 三次方 =============
  static easeInCubic = (x: number): number => x * x * x
  static easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3)
  static easeInOutCubic = (x: number): number => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

  // ============= 四次方 =============
  static easeInQuart = (x: number): number => x * x * x * x
  static easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)
  static easeInOutQuart = (x: number): number => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2)

  // ============= 五次方 =============
  static easeInQuint = (x: number): number => x * x * x * x * x
  static easeOutQuint = (x: number): number => 1 - Math.pow(1 - x, 5)

  // ============= 正弦 =============
  static easeInSine = (x: number): number => 1 - Math.cos((x * Math.PI) / 2)
  static easeOutSine = (x: number): number => Math.sin((x * Math.PI) / 2)
  static easeInOutSine = (x: number): number => -(Math.cos(Math.PI * x) - 1) / 2

  // ============= 指数 =============
  static easeInExpo = (x: number): number => (x === 0 ? 0 : Math.pow(2, 10 * x - 10))
  static easeOutExpo = (x: number): number => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x))

  // ============= 圆形 =============
  static easeInCirc = (x: number): number => 1 - Math.sqrt(1 - Math.pow(x, 2))
  static easeOutCirc = (x: number): number => Math.sqrt(1 - Math.pow(x - 1, 2))
  static easeInOutCirc = (x: number): number =>
    x < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2
}
