/**
 * Animation sprite class for sprite sheet animations
 * Handles frame-by-frame animation rendering
 */
class AnimationSprite extends Base {
  public readonly frameRepetition: number
  public readonly img: ImageBitmap
  private readonly columnCount: number
  private readonly rowCount: number
  public readonly totalFrame: number
  public nextFrameIndex: number
  private lastRAF: Optional<number>
  public isDead: boolean

  /**
   * @param img - The sprite sheet ImageBitmap
   * @param columnCount - Number of columns in sprite sheet
   * @param rowCount - Number of rows in sprite sheet
   * @param frameRepetition - Number of times each frame repeats (higher = slower animation). Default: 1
   */
  constructor(img: ImageBitmap, columnCount: number, rowCount: number, frameRepetition?: number) {
    super()

    this.frameRepetition = frameRepetition ?? 1
    this.img = img
    this.columnCount = columnCount
    this.rowCount = rowCount
    this.totalFrame = columnCount * rowCount
    this.nextFrameIndex = 0
    this.lastRAF = null
    this.isDead = false
  }

  get realNextFrameIndex(): number {
    return Math.floor(this.nextFrameIndex / this.frameRepetition)
  }

  get isFinish(): boolean {
    return this.isDead || this.realNextFrameIndex >= this.totalFrame
  }

  /**
   * Render a single frame of the animation
   * @param ctx - Canvas rendering context
   * @param positionTL - Top-left position
   * @param width - Target render width
   * @param height - Target render height
   * @param delay - Delay between frames
   * @param endless - Loop animation when finished
   * @param trusteeShippedClearing - Whether parent handles clearing
   * @param recirculation - Whether to self-loop via requestAnimationFrame
   * @param callback - Callback when animation completes
   */
  renderOneFrame(
    ctx: CanvasRenderingContext2D,
    positionTL: Position,
    width: number,
    height: number,
    delay: number,
    endless: boolean,
    trusteeShippedClearing: boolean,
    recirculation: boolean,
    callback?: CallableFunction
  ): void {
    if (this.isFinish) {
      if (endless) {
        this.nextFrameIndex = 0
      } else {
        setTimeout(() => {
          if (!trusteeShippedClearing) {
            ctx.clearRect(positionTL.x, positionTL.y, width, height)
            if (callback instanceof Function) {
              callback()
            }
          }
        }, delay)
        return
      }
    }

    const frameWidth = this.img.width / this.columnCount
    const frameHeight = this.img.height / this.rowCount
    const sourceX = (this.realNextFrameIndex % this.columnCount) * frameWidth
    const sourceY = Math.floor(this.realNextFrameIndex / this.columnCount) * frameHeight

    if (!trusteeShippedClearing) {
      ctx.clearRect(positionTL.x, positionTL.y, width, height)
    }

    ctx.drawImage(this.img, sourceX, sourceY, frameWidth, frameHeight, positionTL.x, positionTL.y, width, height)

    this.nextFrameIndex++

    if (recirculation) {
      this.lastRAF = requestAnimationFrame(() => {
        this.renderOneFrame(ctx, positionTL, width, height, delay, endless, trusteeShippedClearing, true)
      })
    }
  }

  /**
   * Play animation once and stop
   */
  render(
    ctx: CanvasRenderingContext2D,
    positionTL: Position,
    width: number,
    height: number,
    delay: number = 0,
    callback?: CallableFunction
  ): void {
    // BUG FIX: Changed || to && to correctly check if animation is in progress
    // Original: this.realNextFrameIndex !== 0 || this.realNextFrameIndex !== this.totalFrame (always true)
    // Fixed: Check if animation is actively playing (not at start AND not at end)
    if (this.nextFrameIndex !== 0 && this.realNextFrameIndex !== this.totalFrame) {
      if (this.lastRAF) cancelAnimationFrame(this.lastRAF)
    }

    this.nextFrameIndex = 0

    this.lastRAF = requestAnimationFrame(() => {
      this.renderOneFrame(ctx, positionTL, width, height, delay, false, false, true, callback)
    })
  }

  /**
   * Play animation in endless loop
   * @param trusteeShippedClearing - Whether parent handles clearing
   */
  renderLoop(
    ctx: CanvasRenderingContext2D,
    positionTL: Position,
    width: number,
    height: number,
    trusteeShippedClearing: boolean = false
  ): void {
    // BUG FIX: Same fix as render() method
    if (this.nextFrameIndex !== 0 && this.realNextFrameIndex !== this.totalFrame) {
      if (this.lastRAF) cancelAnimationFrame(this.lastRAF)
    }

    this.nextFrameIndex = 0

    this.lastRAF = requestAnimationFrame(() => {
      this.renderOneFrame(ctx, positionTL, width, height, 0, true, trusteeShippedClearing, true)
    })
  }

  terminateLoop(): void {
    if (this.lastRAF) cancelAnimationFrame(this.lastRAF)
    this.isDead = true
  }

  getClone(frameRepetition?: number): AnimationSprite {
    return new AnimationSprite(this.img, this.columnCount, this.rowCount, frameRepetition)
  }
}

/**
 * Hosted animation sprite that delegates rendering to parent context
 */
class HostedAnimationSprite extends Base {
  public readonly sp: AnimationSprite
  private waitFrame: number
  public render: (ctx: CanvasRenderingContext2D) => void

  constructor(
    sp: AnimationSprite,
    pos: Position,
    width: number,
    height: number,
    delay: number = 0,
    endless: boolean,
    waitFrame: number = 0
  ) {
    super()

    this.sp = sp
    this.waitFrame = waitFrame

    this.render = function (ctx: CanvasRenderingContext2D): void {
      if (this.waitFrame === 0) {
        this.sp.renderOneFrame(ctx, pos, width, height, delay, endless, true, false)
      } else {
        this.waitFrame--
      }
    }
  }
}
