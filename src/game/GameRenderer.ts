/// <reference path="../typedef.ts" />
/// <reference path="../motion.ts" />
/// <reference path="../constants.ts" />
/// <reference path="../canvas.ts" />
/// <reference path="../image.ts" />
/// <reference path="../utils/format-utils.ts" />
/// <reference path="../utils/math-utils.ts" />
/// <reference path="../utils/render-utils.ts" />
/// <reference path="./GameTypes.ts" />

/**
 * 游戏渲染管理器
 * 负责所有 Canvas 绑制操作，包括背景、实体、UI等
 */
class GameRenderer {
  /** Canvas 管理器 */
  private readonly _canvasManager: CanvasManager

  /** 图片管理器 */
  private readonly _imageManager: ImageManager

  /** 背景图层上下文 */
  private _backgroundCtx!: WrappedCanvasRenderingContextOnScreen2D

  /** 主渲染图层上下文 */
  private _mainCtx!: WrappedCanvasRenderingContextOnScreen2D

  /** 塔图层上下文 */
  private _towerCtx!: WrappedCanvasRenderingContextOnScreen2D

  /** 鼠标交互图层上下文 */
  private _mouseCtx!: WrappedCanvasRenderingContextOnScreen2D

  /** 离屏渲染上下文 */
  private _offscreenCtx!: WrappedCanvasRenderingContext2D

  /** 是否使用传统渲染模式（无 OffscreenCanvas 支持时） */
  private readonly _useClassicRenderStyle: boolean

  /**
   * 创建渲染管理器实例
   * @param canvasManager Canvas 管理器
   * @param imageManager 图片管理器
   */
  constructor(canvasManager: CanvasManager, imageManager: ImageManager) {
    this._canvasManager = canvasManager
    this._imageManager = imageManager
    this._useClassicRenderStyle = !('OffscreenCanvas' in window)
  }

  /**
   * 初始化所有 Canvas 图层
   * @param _leftAreaWidth 左侧区域宽度（预留参数）
   * @param _leftAreaHeight 左侧区域高度（预留参数）
   */
  public initCanvasLayers(_leftAreaWidth: number, _leftAreaHeight: number): void {
    // 离屏 canvas，高速预渲染
    this._canvasManager.createCanvasInstance('off_screen_render', undefined, undefined, undefined, true)
    this._offscreenCtx = this._canvasManager.getContext('off_screen_render') as WrappedCanvasRenderingContext2D

    // [60 FPS] 常更新主图层
    this._canvasManager.createCanvasInstance(
      'main',
      { zIndex: CANVAS_Z_INDEX.MAIN },
      undefined,
      undefined,
      false,
      null,
      'off_screen_render'
    )
    this._mainCtx = this._canvasManager.getContext('main') as WrappedCanvasRenderingContextOnScreen2D

    // [stasis] 用来绘制塔的图层，不经常更新
    this._canvasManager.createCanvasInstance('tower', { zIndex: CANVAS_Z_INDEX.TOWER })
    this._towerCtx = this._canvasManager.getContext('tower') as WrappedCanvasRenderingContextOnScreen2D

    // [on mouse] 用来绘制鼠标事件带来的悬浮信息等的图层
    this._canvasManager.createCanvasInstance('mouse', { zIndex: CANVAS_Z_INDEX.MOUSE })
    this._mouseCtx = this._canvasManager.getContext('mouse') as WrappedCanvasRenderingContextOnScreen2D

    // [stasis | partial: 60 FPS] 骨架图层
    this._canvasManager.createCanvasInstance('bg', { zIndex: CANVAS_Z_INDEX.BACKGROUND })
    this._backgroundCtx = this._canvasManager.getContext('bg') as WrappedCanvasRenderingContextOnScreen2D
  }

  /**
   * 获取背景图层上下文
   */
  public get backgroundCtx(): WrappedCanvasRenderingContextOnScreen2D {
    return this._backgroundCtx
  }

  /**
   * 获取主图层上下文
   */
  public get mainCtx(): WrappedCanvasRenderingContextOnScreen2D {
    return this._mainCtx
  }

  /**
   * 获取塔图层上下文
   */
  public get towerCtx(): WrappedCanvasRenderingContextOnScreen2D {
    return this._towerCtx
  }

  /**
   * 获取鼠标图层上下文
   */
  public get mouseCtx(): WrappedCanvasRenderingContextOnScreen2D {
    return this._mouseCtx
  }

  /**
   * 获取离屏渲染上下文
   */
  public get offscreenCtx(): WrappedCanvasRenderingContext2D {
    return this._offscreenCtx
  }

  /**
   * 渲染静态背景元素
   * @param config 背景渲染配置
   */
  public renderBackground(config: BackgroundRenderConfig): void {
    const ctx = this._backgroundCtx

    ctx.font = '12px Game'

    // 绘制边框
    ctx.strokeStyle = 'rgba(45,45,45,.5)'
    ctx.lineWidth = 1
    ctx.strokeRect(1, 1, config.leftAreaWidth, config.leftAreaHeight)

    // 绘制网格线
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(188,188,188,.1)'
    for (let i = config.gridSize; i < config.gridSize * config.gridRows; i += config.gridSize) {
      ctx.moveTo(1, i)
      ctx.lineTo(config.leftAreaWidth, i)
    }
    for (let i = config.gridSize; i < config.gridSize * config.gridColumns; i += config.gridSize) {
      ctx.moveTo(i, 1)
      ctx.lineTo(i, config.leftAreaHeight)
    }
    ctx.stroke()

    // 绘制起点（绿色）带标签
    const startX = 0
    const startY = (config.gridRows / 2 - 1) * config.gridSize
    ctx.fillStyle = 'rgba(103, 194, 58, 0.4)'
    ctx.fillRect(startX, startY, config.gridSize, config.gridSize)
    ctx.strokeStyle = 'rgba(103, 194, 58, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(startX + 1, startY + 1, config.gridSize - 2, config.gridSize - 2)

    // 起点箭头标记
    ctx.fillStyle = 'rgba(103, 194, 58, 0.9)'
    ctx.font = `bold ${Math.floor(config.gridSize * 0.5)}px Game`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('\u279C', startX + config.gridSize / 2, startY + config.gridSize / 2)

    // 绘制终点（红色）带标签
    const endX = (config.gridColumns - 1) * config.gridSize
    const endY = (config.gridRows / 2) * config.gridSize
    ctx.fillStyle = 'rgba(245, 108, 108, 0.4)'
    ctx.fillRect(endX, endY, config.gridSize, config.gridSize)
    ctx.strokeStyle = 'rgba(245, 108, 108, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(endX + 1, endY + 1, config.gridSize - 2, config.gridSize - 2)

    // 终点标记
    ctx.fillStyle = 'rgba(245, 108, 108, 0.9)'
    ctx.fillText('\u2716', endX + config.gridSize / 2, endY + config.gridSize / 2)
    ctx.textAlign = 'start'
    ctx.textBaseline = 'alphabetic'

    // 测试模式标签
    if (config.isTestMode) {
      this._canvasManager.refreshText(
        '[ Test Mode ]',
        null,
        new Position(10, 15),
        new Position(8, 15),
        120,
        26,
        'rgba(230,204,55,1)',
        true,
        '10px SourceCodePro'
      )
    }

    // 提示文本
    this._canvasManager.refreshText(
      '鼠标点击选取建造，连点两次鼠标右键出售已建造的塔',
      null,
      new Position(config.leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN, 30),
      new Position(config.leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN - 2, 10),
      config.rightAreaWidth,
      26,
      'rgba(24,24,24,1)',
      true,
      '14px Game'
    )
    this._canvasManager.refreshText(
      '出现详情时按[Ctrl]切换详细信息和说明',
      null,
      new Position(config.leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN, 70),
      new Position(config.leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN - 2, 50),
      config.rightAreaWidth,
      26,
      'rgba(24,24,24,1)',
      true,
      '14px Game'
    )
  }

  /**
   * 渲染金币、生命值、宝石点数等游戏信息区域的标签
   */
  public renderInfoLabels(): void {
    const ax0 = innerWidth - 236
    const ay0 = innerHeight - 10
    this._canvasManager.refreshText(
      '金币',
      null,
      new Position(ax0, ay0),
      new Position(ax0 - 4, ay0 - 20),
      160,
      26,
      'rgba(54,54,54,1)',
      true,
      '14px Game'
    )
    const goldSprite = this._imageManager.getSprite('gold_spin')
    if (goldSprite) {
      goldSprite
        .getClone(2)
        .renderLoop(this._backgroundCtx as unknown as CanvasRenderingContext2D, new Position(innerWidth - 190, innerHeight - 25), 18, 18)
    }

    const ax = innerWidth - 293
    const ay = innerHeight - 70
    this._canvasManager.refreshText(
      GemBase.gemName + '点数',
      null,
      new Position(ax, ay),
      new Position(ax - 4, ay - 20),
      160,
      26,
      'rgba(54,54,54,1)',
      true,
      '14px Game'
    )
    const sparkleSprite = this._imageManager.getSprite('sparkle')
    if (sparkleSprite) {
      sparkleSprite
        .getClone(10)
        .renderLoop(this._backgroundCtx as unknown as CanvasRenderingContext2D, new Position(innerWidth - 190, innerHeight - 85), 18, 18)
    }

    const ax2 = innerWidth - 250
    const ay2 = innerHeight - 40
    this._canvasManager.refreshText(
      '生命值',
      null,
      new Position(ax2, ay2),
      new Position(ax2 - 4, ay2 - 20),
      160,
      26,
      'rgba(54,54,54,1)',
      true,
      '14px Game'
    )

    const heartImage = this._imageManager.getImage('heart_px')
    if (heartImage) {
      this._backgroundCtx.drawImage(heartImage, innerWidth - 190, innerHeight - 54, 18, 18)
    }
  }

  /**
   * 渲染金币数值
   * @param money 当前金币
   */
  public renderMoney(money: number): void {
    const ax = innerWidth - 160
    const ay = innerHeight - 10
    this._canvasManager.refreshText(
      FormatUtils.formatterUs.format(money),
      null,
      new Position(ax, ay),
      new Position(ax - 4, ay - 20),
      160,
      26,
      'rgb(24,24,24)',
      true,
      '14px Game'
    )
  }

  /**
   * 渲染生命值
   * @param life 当前生命值
   */
  public renderLife(life: number): void {
    const ax = innerWidth - 160
    const ay = innerHeight - 40
    this._canvasManager.refreshText(
      life + '',
      null,
      new Position(ax, ay),
      new Position(ax - 4, ay - 20),
      160,
      26,
      'rgb(24,24,24)',
      true,
      '14px Game'
    )
  }

  /**
   * 渲染宝石点数
   * @param gemPoints 当前宝石点数
   */
  public renderGemPoint(gemPoints: number): void {
    const ax = innerWidth - 160
    const ay = innerHeight - 70
    this._canvasManager.refreshText(
      FormatUtils.formatterUs.format(gemPoints),
      null,
      new Position(ax, ay),
      new Position(ax - 4, ay - 20),
      160,
      26,
      'rgb(24,24,24)',
      true,
      '14px Game'
    )
  }

  /**
   * 渲染游戏统计信息（DPS、总伤害、总击杀）
   * @param stats 游戏统计
   * @param bornStamp 游戏开始时间戳
   */
  public renderGameStats(totalDamage: number, totalKill: number, bornStamp: number | undefined): void {
    const elapsed = bornStamp ? performance.now() - bornStamp : 0
    const DPS = elapsed > 100
      ? FormatUtils.chineseFormatter((totalDamage / elapsed) * 1000, 3, ' ')
      : 0
    const DMG = FormatUtils.chineseFormatter(totalDamage, 2, ' ')
    const TK = FormatUtils.chineseFormatter(totalKill, 2, ' ')

    const ax = innerWidth - 190
    const ay1 = innerHeight - 120
    const ay2 = ay1 - 30
    const ay3 = ay2 - 30

    this._canvasManager.refreshText(
      `DPS    ${DPS}`,
      null,
      new Position(ax, ay1),
      new Position(ax - 4, ay1 - 20),
      190,
      26,
      'rgb(24,24,24)',
      true,
      '14px Game'
    )

    this._canvasManager.refreshText(
      `总伤害    ${DMG}`,
      null,
      new Position(ax, ay2),
      new Position(ax - 4, ay2 - 20),
      190,
      26,
      'rgb(24,24,24)',
      true,
      '14px Game'
    )

    this._canvasManager.refreshText(
      `总击杀    ${TK}`,
      null,
      new Position(ax, ay3),
      new Position(ax - 4, ay3 - 20),
      190,
      26,
      'rgb(24,24,24)',
      true,
      '14px Game'
    )
  }

  /**
   * 渲染调试信息（仅测试模式）
   * @param metrics 调试指标
   */
  public renderDebugInfo(metrics: DebugMetrics): void {
    this.renderStandardText(`[ R Tick ${metrics.renderTick} ]`, 6, 20, 120)
    this.renderStandardText(`[ U Tick ${metrics.updateTick} ]`, 6, 40, 120)
    this.renderStandardText(`[ OBJ ${metrics.objectCount} ]`, 6, 80, 120)
    this.renderStandardText(`[ DOM ${metrics.domCount} ]`, 6, 100, 120)

    const fpsColor = metrics.fps < 60 ? '#F56C6C' : 'rgb(2,2,2)'
    this.renderStandardText(`[ Fps ${metrics.fps.toFixed(1)} ]`, 6, 60, 120, fpsColor)
  }

  /**
   * 渲染标准文本
   * @param text 文本内容
   * @param bx 左上角 X 坐标
   * @param by 左上角 Y 坐标
   * @param maxWidth 最大宽度
   * @param color 文本颜色
   * @param fSize 字体大小
   */
  public renderStandardText(
    text: string,
    bx: number,
    by: number,
    maxWidth: number,
    color = 'rgb(2,2,2)',
    fSize = 10
  ): void {
    this._canvasManager.refreshText(
      text,
      null,
      new Position(bx + 4, by + fSize + 5),
      new Position(bx, by),
      maxWidth,
      12 + fSize,
      color,
      true,
      `${fSize}px SourceCodePro`
    )
  }

  /**
   * 创建性能包装器（带耗时统计）
   * @param fn 要包装的函数
   * @param metricsName 指标名称
   * @param xAxis X 坐标
   * @param yAxis Y 坐标
   * @param bufferLength 缓冲区长度
   * @param height 图表高度
   * @param maxWidth 最大宽度
   * @param maxV 最大值
   * @param warningV 警告阈值
   * @param dangerV 危险阈值
   * @returns 包装后的函数
   */
  public createPerformanceWrapper(
    fn: () => void,
    metricsName: string,
    xAxis: number,
    yAxis: number,
    bufferLength = 120,
    height = 50,
    maxWidth = 120,
    maxV = 50,
    warningV = 12,
    dangerV = 16.667
  ): () => void {
    const timeBuffer = new Float64Array(bufferLength).fill(-1)

    return () => {
      const runStart = performance.now()

      fn()

      const metrics = performance.now() - runStart

      this.renderStandardText(
        `[ ${metricsName} ${MathUtils.roundWithFixed(metrics, 3)} ms ]`,
        xAxis,
        yAxis,
        maxWidth
      )

      const actualLength = MathUtils.typedArrayPush(timeBuffer, metrics)
      if (actualLength === timeBuffer.length) {
        this.renderStandardText(
          `[ ${metricsName} avg ${MathUtils.roundWithFixed(timeBuffer.reduce((c, p) => c + p, 0) / actualLength, 3)} ms ]`,
          xAxis,
          yAxis + 20,
          maxWidth
        )
      } else {
        this.renderStandardText(`[ ${metricsName} avg - ms ]`, xAxis, yAxis + 20, maxWidth)
      }

      RenderUtils.renderStatistic(
        metricsName,
        this._backgroundCtx as unknown as CanvasRenderingContext2D,
        timeBuffer,
        new Position(xAxis, yAxis + height),
        timeBuffer.length,
        height + 2,
        maxV,
        warningV,
        dangerV
      )
    }
  }

  /**
   * 清除鼠标图层
   */
  public clearMouseLayer(): void {
    this._mouseCtx.clearRect(0, 0, innerWidth, innerHeight)
  }

  /**
   * 清除塔图层
   */
  public clearTowerLayer(): void {
    this._towerCtx.clearRect(0, 0, innerWidth, innerHeight)
  }

  /**
   * 执行离屏渲染到主图层
   */
  public flushOffscreenToMain(): void {
    if (this._useClassicRenderStyle) {
      this._offscreenCtx.clearRect(0, 0, this._offscreenCtx.dom.width, this._offscreenCtx.dom.height)
    }
  }

  /**
   * 将离屏内容绘制到主图层
   */
  public paintOffscreenToMain(): void {
    if (this._mainCtx._off_screen_paint) {
      this._mainCtx._off_screen_paint()
    } else {
      throw new Error('this._mainCtx._off_screen_paint is not a function')
    }
  }

  /**
   * 是否使用传统渲染模式
   */
  public get useClassicRenderStyle(): boolean {
    return this._useClassicRenderStyle
  }
}
