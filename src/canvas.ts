/// <reference path="./typedef.ts" />

/**
 * Canvas 管理器
 * 负责创建和管理游戏中的多个 Canvas 图层
 */
class CanvasManager {
  // ============= 常量 =============

  private static readonly CONTEXT_2D = '2d' as const
  private static readonly CONTEXT_BITMAP = 'bitmaprenderer' as const
  private static readonly DEFAULT_FONT = 'lighter 7px Game'
  private static readonly DEFAULT_CONTEXT_ID = 'bg'

  // ============= 公共属性 =============

  public canvasElements: CanvasEle[] = []
  public canvasContextMapping: Map<string, WrappedCanvasRenderingContext> = new Map()
  public offscreenCanvasMapping: Map<string, CanvasEle> = new Map()

  // ============= 缓存 =============

  private _dpiCache: number | null = null
  private _offscreenSupport: boolean | null = null

  // ============= 缓存访问器 =============

  private get dpi(): number {
    return this._dpiCache ?? (this._dpiCache = window.devicePixelRatio)
  }

  private get supportsOffscreen(): boolean {
    return this._offscreenSupport ?? (this._offscreenSupport = 'OffscreenCanvas' in window)
  }

  // ============= 公共方法 =============

  /**
   * 获取已注册的 Canvas 上下文
   * @throws 如果 Canvas 不存在则抛出错误
   */
  getContext(id: string): WrappedCanvasRenderingContext {
    const ctx = this.canvasContextMapping.get(id)
    if (!ctx) {
      const available = Array.from(this.canvasContextMapping.keys()).join(', ')
      throw new Error(`Canvas "${id}" not found. Available: ${available || 'none'}`)
    }
    return ctx
  }

  /**
   * 创建 Canvas 实例
   * @param id 唯一标识符
   * @param style CSS 样式（仅屏幕 Canvas）
   * @param height 物理像素高度（默认窗口高度 * DPI）
   * @param width 物理像素宽度（默认窗口宽度 * DPI）
   * @param offDocument 是否创建离屏 Canvas
   * @param wiredEvent 事件处理函数（仅屏幕 Canvas）
   * @param paintingOffScreenRenderingContextId 绑定的离屏 Canvas ID（用于位图渲染）
   */
  createCanvasInstance(
    id: string,
    style: CSSStyleDeclaration | {} = {},
    height?: number,
    width?: number,
    offDocument?: boolean,
    wiredEvent: Optional<(ele: HTMLCanvasElement) => void> = null,
    paintingOffScreenRenderingContextId: Optional<string> = null
  ): WrappedCanvasRenderingContext {
    this._validateId(id)

    const dimensions = this._getDimensions(height, width)

    // 离屏 Canvas
    if (offDocument) {
      return this._createOffscreen(id, dimensions.width, dimensions.height)
    }

    // 屏幕 Canvas
    const canvas = this._createOnscreen(
      id,
      dimensions.width,
      dimensions.height,
      style || {},
      wiredEvent
    )

    let ctx: WrappedCanvasRenderingContext

    if (paintingOffScreenRenderingContextId) {
      // 位图渲染器模式
      ctx = this._setupBitmapRenderer(canvas, paintingOffScreenRenderingContextId)
    } else {
      // 标准 2D 上下文
      const rawCtx = canvas.getContext(CanvasManager.CONTEXT_2D) as CanvasRenderingContext2D
      ctx = this._augmentContext(rawCtx, canvas, { scale: true, font: true })
    }

    this.canvasElements.push(canvas)
    this.canvasContextMapping.set(id, ctx)

    return ctx
  }

  get towerLevelTextStyle(): string {
    return 'rgba(13,13,13,1)'
  }

  /**
   * 刷新文本渲染
   */
  refreshText(
    text: string,
    context: Optional<CanvasRenderingContext2D>,
    positionTL: Position,
    outerBoxPositionTL: Position,
    width: number,
    height: number,
    style: string,
    fillOrStroke: boolean = true,
    font: string
  ): void {
    const ctx = context ?? this._getDefaultContext()

    ctx.clearRect(outerBoxPositionTL.x, outerBoxPositionTL.y, width, height)

    if (__debug_show_refresh_rect) {
      ctx.save()
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255,0,0,.5)'
      ctx.strokeRect(outerBoxPositionTL.x + 1, outerBoxPositionTL.y + 1, width - 2, height - 2)
      ctx.restore()
    }

    if (style) {
      ctx.save()
      fillOrStroke ? (ctx.fillStyle = style) : (ctx.strokeStyle = style)
    }
    if (font) {
      if (!style) ctx.save()
      ctx.font = font
    }

    fillOrStroke
      ? ctx.fillText(text, positionTL.x, positionTL.y, width)
      : ctx.strokeText(text, positionTL.x, positionTL.y, width)

    if (style || font) {
      ctx.restore()
    }
  }

  // ============= 私有方法 =============

  /**
   * 校验 Canvas ID 唯一性
   */
  private _validateId(id: string): void {
    if (this.canvasContextMapping.has(id)) {
      throw new Error(`Canvas ID "${id}" already exists`)
    }
  }

  /**
   * 计算 Canvas 尺寸
   */
  private _getDimensions(height?: number, width?: number): { width: number; height: number } {
    return {
      width: width ?? innerWidth * this.dpi,
      height: height ?? innerHeight * this.dpi
    }
  }

  /**
   * 增强 Canvas 上下文，添加管理器引用和 DOM 引用
   */
  private _augmentContext<T extends CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | ImageBitmapRenderingContext>(
    ctx: T,
    canvas: CanvasEle,
    options: { scale?: boolean; font?: boolean } = {}
  ): T & WrappedCanvasFx {
    const augmented = ctx as T & WrappedCanvasFx
    augmented.manager = this
    augmented.dom = canvas

    if (options.font !== false && 'font' in ctx) {
      ;(ctx as CanvasRenderingContext2D).font = CanvasManager.DEFAULT_FONT
    }
    if (options.scale !== false && 'scale' in ctx) {
      ;(ctx as CanvasRenderingContext2D).scale(this.dpi, this.dpi)
    }

    return augmented
  }

  /**
   * 创建离屏 Canvas
   */
  private _createOffscreen(id: string, width: number, height: number): WrappedCanvasRenderingContext2D {
    let canvas: CanvasEle

    if (this.supportsOffscreen) {
      canvas = new OffscreenCanvas(width, height)
    } else {
      const fallback = document.createElement('canvas')
      fallback.width = width
      fallback.height = height
      fallback.id = id
      canvas = fallback
    }

    const ctx = canvas.getContext(CanvasManager.CONTEXT_2D) as
      | OffscreenCanvasRenderingContext2D
      | CanvasRenderingContext2D
    const augmented = this._augmentContext(ctx, canvas, { scale: true, font: true })

    this.canvasElements.push(canvas)
    this.canvasContextMapping.set(id, augmented)
    this.offscreenCanvasMapping.set(id, canvas)

    return augmented
  }

  /**
   * 创建屏幕 Canvas 元素
   */
  private _createOnscreen(
    id: string,
    width: number,
    height: number,
    style: CSSStyleDeclaration | {},
    eventHandler?: ((ele: HTMLCanvasElement) => void) | null
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas')

    canvas.width = width
    canvas.height = height
    canvas.style.width = `${width / this.dpi}px`
    canvas.style.height = `${height / this.dpi}px`
    canvas.id = id

    Object.assign(canvas.style, style)

    if (typeof eventHandler === 'function') {
      eventHandler(canvas)
    }

    document.body.appendChild(canvas)

    return canvas
  }

  /**
   * 设置位图渲染器
   * @throws 如果离屏 Canvas 不存在则抛出错误
   */
  private _setupBitmapRenderer(
    canvas: HTMLCanvasElement,
    offscreenId: string
  ): WrappedCanvasRenderingContext {
    const offscreen = this.offscreenCanvasMapping.get(offscreenId)
    if (!offscreen) {
      throw new Error(`Offscreen canvas "${offscreenId}" not found. Create it first.`)
    }

    if (this.supportsOffscreen) {
      const ctx = canvas.getContext(CanvasManager.CONTEXT_BITMAP) as WrappedCanvasRenderingContextBitmap
      const osc = offscreen as OffscreenCanvas

      ctx._off_screen_paint = function () {
        this.transferFromImageBitmap(osc.transferToImageBitmap())
      }

      return this._augmentContext(ctx, canvas, { scale: false, font: false })
    } else {
      const ctx = canvas.getContext(CanvasManager.CONTEXT_2D) as WrappedCanvasRenderingContext2D

      ctx._off_screen_paint = function () {
        this.clearRect(0, 0, offscreen.width, offscreen.height)
        this.drawImage(offscreen, 0, 0)
      }

      return this._augmentContext(ctx, canvas, { scale: false, font: false })
    }
  }

  /**
   * 获取默认文本渲染上下文
   */
  private _getDefaultContext(): CanvasRenderingContext2D {
    if (!this.canvasContextMapping.has(CanvasManager.DEFAULT_CONTEXT_ID)) {
      throw new Error(
        `Default context "${CanvasManager.DEFAULT_CONTEXT_ID}" not found. Create the background canvas first.`
      )
    }
    return this.getContext(CanvasManager.DEFAULT_CONTEXT_ID) as CanvasRenderingContext2D
  }
}
