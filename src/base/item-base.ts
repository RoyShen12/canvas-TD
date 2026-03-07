/// <reference path="../typedef.ts" />
/// <reference path="./circle-base.ts" />
/// <reference path="../image/animation-sprite.ts" />

/**
 * 所有[单位]的基类
 * 具有图像渲染能力
 */
class ItemBase extends CircleBase {
  /** Item 的图形描述符，可以是位图或动画 */
  public image: Optional<ImageBitmap | AnimationSprite>
  /** Item 的填充描述符（当没有图像时使用） */
  public fill?: string
  /** 定时器 ID 列表（用于清理） */
  public readonly intervalTimers: number[] = []
  /** 延时器 ID 列表（用于清理） */
  public readonly timeoutTimers: number[] = []
  /** 单位是否可控 */
  public controlable = false

  constructor(
    position: Position,
    radius: number,
    borderWidth: number,
    borderStyle: Optional<string>,
    image: string | ImageBitmap | AnimationSprite
  ) {
    super(position, radius, borderWidth, borderStyle)

    this.image = null

    if (typeof image === 'string') {
      this.fill = image
    } else {
      this.image = image
    }
  }

  /**
   * 绘制动画精灵
   */
  private renderSpriteFrame(context: CanvasRenderingContext2D, x: number, y: number): void {
    if (this.image instanceof AnimationSprite) {
      this.image.renderOneFrame(
        context,
        new Position(x, y),
        this.inscribedSquareSideLength,
        this.inscribedSquareSideLength,
        0,
        true,
        true,
        false
      )
    }
  }

  /**
   * 绘制图片或动画精灵
   */
  renderImage(context: CanvasRenderingContext2D): void {
    const x = this.position.x - this.inscribedSquareSideLength * 0.5
    const y = this.position.y - this.inscribedSquareSideLength * 0.5

    if (this.image instanceof ImageBitmap) {
      context.drawImage(
        this.image,
        0,
        0,
        this.image.width,
        this.image.height,
        x,
        y,
        this.inscribedSquareSideLength,
        this.inscribedSquareSideLength
      )
    } else if (this.image instanceof AnimationSprite) {
      this.renderSpriteFrame(context, x, y)
    }
  }

  /**
   * 绘制圆填充（当没有图像时）
   */
  private renderFilled(context: CanvasRenderingContext2D): void {
    if (this.fill) context.fillStyle = this.fill

    if (this.radius > 2) {
      context.beginPath()
      context.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, true)
      context.closePath()
      context.fill()
    } else {
      // 半径 <= 2, 回退为矩形以简化绘图
      const r = Math.round(this.radius) || 1
      context.fillRect(Math.floor(this.position.x), Math.floor(this.position.y), r, r)
    }
  }

  /**
   * 主绘图函数
   */
  render(context: CanvasRenderingContext2D, _imgCtrl?: ImageManager): void {
    super.renderBorder(context)

    if (this.image) {
      this.renderImage(context)
    } else if (this.fill) {
      this.renderFilled(context)
    }
  }

  /**
   * 使物体的图形旋转并返回一个恢复句柄
   * 用于让物体朝向目标方向
   */
  protected rotateForward(context: CanvasRenderingContext2D, targetPos: Position): { restore: () => void } {
    context.translate(this.position.x, this.position.y)

    let theta = Math.atan((this.position.y - targetPos.y) / (this.position.x - targetPos.x))
    if (this.position.x > targetPos.x) theta += Math.PI

    context.rotate(theta)

    // 捕获当前 DPI 以在恢复时使用
    const dpi = window.devicePixelRatio

    return {
      restore() {
        context.resetTransform()
        context.scale(dpi, dpi)
      },
    }
  }

  /**
   * 在物体被清理前做回收工作
   * 子类可重载此方法
   */
  destroy(): void {
    if (this.image instanceof AnimationSprite) {
      this.image.terminateLoop()
    }

    this.intervalTimers.forEach(t => clearInterval(t))
    this.timeoutTimers.forEach(t => clearTimeout(t))
    this.intervalTimers.length = 0
    this.timeoutTimers.length = 0
  }
}
