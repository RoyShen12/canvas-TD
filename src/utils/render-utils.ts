/// <reference path='../typedef.ts' />
/// <reference path='./math-utils.ts' />

/**
 * Canvas 渲染工具类
 * 提供常用的 Canvas 绑定图形
 */
class RenderUtils {
  /** 用于跟踪 renderStatistic 的初始化状态 */
  private static renderStatisticInitialized = new Set<string>()

  /**
   * 绘制扇形
   */
  static renderSector(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    angle1: number,
    angle2: number,
    antiClock: boolean
  ): CanvasRenderingContext2D {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.arc(x, y, r, angle1, angle2, antiClock)
    ctx.closePath()
    return ctx
  }

  /**
   * 绘制带圆角的矩形
   */
  static renderRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: BorderRadius | number,
    fill: boolean = false,
    stroke: boolean = true
  ): void {
    if (typeof radius === 'number') {
      radius = { tr: radius, tl: radius, br: radius, bl: radius }
    }

    const corners: BorderPosition[] = ['tr', 'tl', 'br', 'bl']
    corners.forEach(key => {
      (radius as BorderRadius)[key] = (radius as BorderRadius)[key] || 5
    })

    ctx.beginPath()
    ctx.moveTo(x + radius.tl, y)
    ctx.lineTo(x + width - radius.tr, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
    ctx.lineTo(x + width, y + height - radius.br)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height)
    ctx.lineTo(x + radius.bl, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
    ctx.lineTo(x, y + radius.tl)
    ctx.quadraticCurveTo(x, y, x + radius.tl, y)
    ctx.closePath()

    if (fill) {
      ctx.fill()
    }
    if (stroke) {
      ctx.stroke()
    }
  }

  /**
   * 渲染性能统计图表
   */
  static renderStatistic(
    name: string,
    ctx: CanvasRenderingContext2D,
    dataArr: TypedArray,
    positionTL: Position,
    width: number,
    height: number,
    maxV: number,
    warningV: number,
    dangerV: number,
    transparency?: number,
    goodColor?: string,
    warningColor?: string,
    dangerColor?: string
  ): void {
    transparency = transparency || RENDER_STATS_CONFIG.TRANSPARENCY
    goodColor = goodColor || `rgba(103,194,58,${transparency})`
    warningColor = warningColor || `rgba(255,241,184,${transparency})`
    dangerColor = dangerColor || `rgba(255,120,117,${transparency})`

    ctx.fillStyle = goodColor

    const horizonSpan = width / dataArr.length
    const drawHeight = height - 2

    if (!this.renderStatisticInitialized.has(name)) {
      console.log('renderStatistic initialized for:', name)

      ctx.save()
      ctx.textBaseline = 'middle'
      ctx.font = '8px SourceCodePro'

      ctx.fillStyle = 'rgb(255,0,0)'
      ctx.fillRect(positionTL.x + width, positionTL.y - 2, 4, 1)
      ctx.fillText(maxV + ' ms', positionTL.x + width + 6, positionTL.y)

      ctx.fillStyle = 'rgb(1,251,124)'
      ctx.fillRect(positionTL.x + width, positionTL.y + (drawHeight / 3) * 2 - 2, 4, 1)
      ctx.fillText(`${dangerV} ms`, positionTL.x + width + 6, positionTL.y + (drawHeight / 3) * 2)

      ctx.fillStyle = 'rgb(0,0,0)'
      ctx.fillRect(positionTL.x + width, positionTL.y + drawHeight - 2, 4, 1)
      ctx.fillText('0 ms', positionTL.x + width + 6, positionTL.y + drawHeight)
      ctx.restore()

      this.renderStatisticInitialized.add(name)
    }

    ctx.clearRect(positionTL.x, positionTL.y, width, drawHeight)

    dataArr.forEach((v: number, i: number) => {
      if (v === -1) return

      v = Math.min(v, RENDER_STATS_CONFIG.MAX_VALUE)
      const h = Math.round((drawHeight * v) / maxV)

      if (h === 0) return

      const x = Math.round(positionTL.x + i * horizonSpan)
      const y = Math.round(positionTL.y + drawHeight * (1 - v / maxV))

      if (v > dangerV) {
        if (ctx.fillStyle !== dangerColor && dangerColor) ctx.fillStyle = dangerColor
      } else if (v > warningV) {
        if (ctx.fillStyle !== warningColor && warningColor) ctx.fillStyle = warningColor
      } else if (ctx.fillStyle !== goodColor && goodColor) {
        ctx.fillStyle = goodColor
      }

      ctx.fillRect(x, y, 1, h)
    })
  }

  /**
   * 重置统计图表初始化状态
   */
  static resetStatisticState(name?: string): void {
    if (name) {
      this.renderStatisticInitialized.delete(name)
    } else {
      this.renderStatisticInitialized.clear()
    }
  }
}
