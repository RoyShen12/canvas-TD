/// <reference path="../tower-constants.ts" />
/// <reference path="../../motion.ts" />
/// <reference path="../../utils/ease-utils.ts" />

/**
 * ColossusLaser - 激光射线辅助类
 * 负责激光塔的射线渲染逻辑
 */
class _ColossusLaser {
  /** 动画尺寸 */
  private static animationW = COLOSSUS_LASER_CONSTANTS.ANIMATION_WIDTH
  private static animationH = COLOSSUS_LASER_CONSTANTS.ANIMATION_HEIGHT
  private static animationName = COLOSSUS_LASER_CONSTANTS.ANIMATION_NAME
  private static animationSpeed = COLOSSUS_LASER_CONSTANTS.ANIMATION_SPEED

  /** 起点坐标 */
  private sx: number
  private sy: number

  /** 终点位置 */
  private ep: Position

  /** 扫射向量 */
  private swipeVector: PolarVector

  /** 线条宽度 */
  private lineWidth: number

  /** 外层线条样式 */
  private lineStylesOuter: string

  /** 内层线条样式 */
  private lineStylesInner: string

  /** 每次更新的距离 */
  private perUpdateDistance: number

  /** 当前步数 */
  private currentStep = 0

  /** 动画步进间隔 */
  private animationStepInterval: number

  /** 步进位置 (0-1) */
  private stepPosition = 0

  /** 缓动函数 */
  private easingFx: (x: number) => number

  /** 是否完成 */
  public fulfilled = false

  constructor(
    startPos: Position,
    endPos: Position,
    lineWidth: number,
    duration: number,
    swipeVector: PolarVector,
    easingFunc: (x: number) => number,
    lineStyleOuter: string,
    lineStyleInner: string
  ) {
    this.sx = startPos.x
    this.sy = startPos.y
    this.ep = endPos.copy()
    this.swipeVector = swipeVector.copy()
    this.lineWidth = lineWidth
    this.lineStylesOuter = lineStyleOuter
    this.lineStylesInner = lineStyleInner

    // 计算更新参数
    const updateTime = 1000 / 60
    const updateCount = duration / updateTime

    // 每次更新的步长 (0-1 范围内)
    this.perUpdateDistance = 1 / updateCount

    // 计算动画间隔
    const maxAnimationCount = Math.floor(
      this.swipeVector.r / (Math.max(_ColossusLaser.animationW, _ColossusLaser.animationH) + 1)
    )
    this.animationStepInterval = maxAnimationCount >= updateCount ? 1 : Math.ceil(updateTime / maxAnimationCount)

    this.easingFx = easingFunc || EaseFx.linear
  }

  /**
   * 获取当前步进位置
   */
  get step(): Position {
    if (this.stepPosition > 1) {
      this.fulfilled = true
    }

    this.stepPosition += this.perUpdateDistance
    this.currentStep++

    const step = this.swipeVector.r * this.easingFx(this.stepPosition)
    return this.ep.copy().move(this.swipeVector.copy().normalize().multiply(step))
  }

  /**
   * 是否可以播放动画
   */
  get canAnimate(): boolean {
    return this.currentStep % this.animationStepInterval === 0
  }

  /**
   * 渲染当前步
   */
  renderStep(ctx: CanvasRenderingContext2D): void {
    if (this.fulfilled) return

    const stepEndPos = this.step

    // 播放爆炸动画
    if (this.canAnimate) {
      Game.callAnimation(
        _ColossusLaser.animationName,
        stepEndPos,
        _ColossusLaser.animationW,
        _ColossusLaser.animationH,
        _ColossusLaser.animationSpeed,
        400
      )
    }

    // 绘制激光线条
    const path = new Path2D()
    path.moveTo(this.sx, this.sy)
    path.lineTo(stepEndPos.x, stepEndPos.y)
    path.closePath()

    const originalLineWidth = ctx.lineWidth

    // 绘制外层
    ctx.strokeStyle = this.lineStylesOuter
    ctx.lineWidth = this.lineWidth + 2
    ctx.stroke(path)

    // 绘制内层
    ctx.strokeStyle = this.lineStylesInner
    ctx.lineWidth = this.lineWidth - 2
    ctx.stroke(path)

    ctx.lineWidth = originalLineWidth
  }
}
