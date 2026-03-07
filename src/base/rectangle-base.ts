/// <reference path="../typedef.ts" />
/// <reference path="./base.ts" />
/// <reference path="../utils/render-utils.ts" />

/**
 * 所有[可用左上和右下两个点描述物体]的基类
 * 备用类，目前在游戏中未使用
 */
abstract class RectangleBase extends Base {
  /** 左上角 */
  public cornerTL: Position
  /** 右下角 */
  public cornerBR: Position
  /** 宽度 */
  public width: number
  /** 高度 */
  public height: number
  /** 边框宽度 */
  public borderWidth: number
  /** 边线条描述符，能被 canvas 的线条样式所接受 */
  public borderStyle: string
  /** 填充描述符，能被 canvas 的填充样式所接受 */
  public fillStyle: string
  /** 边框圆角 */
  public borderRadius: BorderRadius | number

  constructor(
    positionTL: Position,
    positionBR: Position,
    borderWidth: number,
    borderStyle: string,
    fillStyle: string,
    borderRadius: BorderRadius | number
  ) {
    super()

    this.cornerTL = positionTL
    this.cornerBR = positionBR
    this.width = this.cornerBR.x - this.cornerTL.x
    this.height = this.cornerBR.y - this.cornerTL.y
    this.borderWidth = borderWidth
    this.borderStyle = borderStyle
    this.fillStyle = fillStyle
    this.borderRadius = borderRadius
  }

  /**
   * 渲染边框
   */
  renderBorder(context: CanvasRenderingContext2D): void {
    if (this.borderWidth > 0) {
      context.save()
      context.strokeStyle = this.borderStyle
      context.lineWidth = this.borderWidth
      RenderUtils.renderRoundRect(
        context,
        this.cornerTL.x,
        this.cornerTL.y,
        this.width,
        this.height,
        this.borderRadius,
        false,
        true
      )
      context.restore()
    }
  }

  /**
   * 渲染内部填充
   */
  renderInside(context: CanvasRenderingContext2D): void {
    context.save()
    context.fillStyle = this.fillStyle
    RenderUtils.renderRoundRect(
      context,
      this.cornerTL.x,
      this.cornerTL.y,
      this.width,
      this.height,
      this.borderRadius,
      true,
      false
    )
    context.restore()
  }
}
