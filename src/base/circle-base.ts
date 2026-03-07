/// <reference path="../typedef.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../motion.ts" />
/// <reference path="./base.ts" />

/**
 * 所有[可用中心点和半径描述物体]的基类
 */
class CircleBase extends Base {
  /** 物体的位置，使用 moveTo 等方法改变位置 */
  public readonly position: Position
  /** 半径 */
  public radius: number
  /** 边框宽度 */
  public borderWidth: number
  /** 边线条描述符 */
  public borderStyle: Optional<string>

  constructor(position: Position, radius: number, borderWidth: number, borderStyle: Optional<string>) {
    super()

    this.position = position
    this.radius = radius
    this.borderWidth = borderWidth
    this.borderStyle = borderStyle
  }

  /**
   * Circle 的内切正方形边长
   */
  get inscribedSquareSideLength(): number {
    return (2 * this.radius) / Math.SQRT2
  }

  /**
   * 获取游戏上下文
   * 提供对游戏全局状态的访问
   */
  protected get gameContext(): IGameContext {
    return getGameContext()
  }

  /**
   * 对设计稿的度量值进行修正，得到正确的相对度量
   * @param r 基于设计稿的距离值 px
   */
  protected getRelativeRange(r: number): number {
    return (r * this.gameContext.getGridSideSize()) / ENTITY_CONFIG.DESIGN_GRID_SIZE
  }

  /**
   * 渲染边框
   */
  protected renderBorder(context: CanvasRenderingContext2D): void {
    if (this.borderWidth > 0) {
      context.save()
      if (this.borderStyle) context.strokeStyle = this.borderStyle
      context.lineWidth = this.borderWidth
      context.beginPath()
      context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, true)
      context.closePath()
      context.stroke()
      context.restore()
    }
  }
}
