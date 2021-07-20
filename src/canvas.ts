/// <reference path="./typedef.ts" />

class CanvasManager {
  public canvasElements: CanvasEle[] = []
  public canvasContextMapping: Map<string, WrappedCanvasRenderingContext> = new Map()
  public offscreenCanvasMapping: Map<string, CanvasEle> = new Map()

  getContext(id: string): WrappedAllCanvasRenderingContext {
    return this.canvasContextMapping.get(id) as WrappedAllCanvasRenderingContext
  }

  /**
   * @param offDocument 指定创建挂载在dom的标准canvas还是脱离dom的离屏canvas
   * @param paintingOffScreenRenderingContextId 仅对标准canvas生效，指定渲染绑定离屏canvas，如果指定则将会开启ImageBitmapRenderingContext而不是CanvasRenderingContext2D
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
    style = style || {}

    const dpi = window.devicePixelRatio

    height = height || innerHeight * dpi
    width = width || innerWidth * dpi

    // 创建 离屏canvas元素
    // 离屏所以不考虑绑定事件和样式
    if (offDocument) {
      if ('OffscreenCanvas' in window) {
        // 此处使用了非常激进的 OffscreenCanvas + 2d-context 的API，仅支持 chrome >= 69
        const canvasOff = new OffscreenCanvas(width, height)
        const ctx = canvasOff.getContext('2d') as OffscreenCanvasRenderingContext2D & {
          manager: CanvasManager
          dom: CanvasEle
        }

        ctx.manager = this
        ctx.dom = canvasOff
        ctx.font = 'lighter 7px Game'

        this.canvasElements.push(canvasOff)
        this.canvasContextMapping.set(id, ctx)
        this.offscreenCanvasMapping.set(id, canvasOff)

        ctx.scale(dpi, dpi)

        return ctx
      } else {
        const canvasEle = document.createElement('canvas')

        canvasEle.width = width
        canvasEle.height = height
        canvasEle.id = id

        const ctx = canvasEle.getContext('2d') as CanvasRenderingContext2D & {
          manager: CanvasManager
          dom: CanvasEle
        }

        ctx.manager = this
        ctx.dom = canvasEle
        ctx.font = 'lighter 7px Game'

        this.canvasElements.push(canvasEle)
        this.canvasContextMapping.set(id, ctx)
        this.offscreenCanvasMapping.set(id, canvasEle)

        ctx.scale(dpi, dpi)

        return ctx
      }
    }
    // 创建 标准canvas元素
    else {
      const canvasEle = document.createElement('canvas')

      canvasEle.width = width
      canvasEle.height = height
      canvasEle.style.width = width / dpi + 'px'
      canvasEle.style.height = height / dpi + 'px'
      canvasEle.id = id

      if (wiredEvent && Object.prototype.toString.call(wiredEvent) === '[object Function]') {
        wiredEvent(canvasEle)
      }

      Object.assign(canvasEle.style, style)

      let ctx: WrappedCanvasRenderingContext

      if (paintingOffScreenRenderingContextId) {
        if ('OffscreenCanvas' in window) {
          // 此处使用了非常激进的 ImageBitmapRenderingContext + transferToImageBitmap + transferFromImageBitmap 的API
          // 仅支持 chrome >= 66, firefox >= 52
          ctx = canvasEle.getContext('bitmaprenderer') as unknown as WrappedCanvasRenderingContextBitmap

          const osc = this.offscreenCanvasMapping.get(paintingOffScreenRenderingContextId) as OffscreenCanvas

          ctx._off_screen_paint = function () {
            this.transferFromImageBitmap(osc.transferToImageBitmap())
          }
        } else {
          ctx = canvasEle.getContext('2d') as WrappedCanvasRenderingContext2D

          const osc = this.offscreenCanvasMapping.get(paintingOffScreenRenderingContextId)

          if (osc) {
            ctx._off_screen_paint = function () {
              this.clearRect(0, 0, osc.width, osc.height)
              this.drawImage(osc, 0, 0)
            }
          }
        }
      } else {
        ctx = canvasEle.getContext('2d') as WrappedCanvasRenderingContext2D
        ctx.font = 'lighter 7px Game'

        ctx.scale(dpi, dpi)
      }

      ctx.manager = this
      ctx.dom = canvasEle

      this.canvasElements.push(canvasEle)
      this.canvasContextMapping.set(id, ctx)

      document.body.appendChild(canvasEle)

      return ctx
    }
  }

  get towerLevelTextStyle() {
    return 'rgba(13,13,13,1)'
  }

  refreshText(
    text: string,
    context: CanvasRenderingContext2D,
    positionTL: Position,
    outerBoxPositionTL: Position,
    width: number,
    height: number,
    style: string,
    fillOrStroke: boolean = true,
    font: string
  ) {
    context = context || (this.getContext('bg') as CanvasRenderingContext2D)

    context.clearRect(outerBoxPositionTL.x, outerBoxPositionTL.y, width, height)

    if (__debug_show_refresh_rect) {
      context.save()
      context.lineWidth = 1
      context.strokeStyle = 'rgba(255,0,0,.5)'
      context.strokeRect(outerBoxPositionTL.x + 1, outerBoxPositionTL.y + 1, width - 2, height - 2)
      context.restore()
    }

    if (style) fillOrStroke ? (context.fillStyle = style) : (context.strokeStyle = style)
    if (font) context.font = font

    fillOrStroke ? context.fillText(text, positionTL.x, positionTL.y, width) : context.strokeText(text, positionTL.x, positionTL.y, width)
  }
}
