/// <reference path='../utils/format-utils.ts' />

/**
 * FontSize configuration interface for DamageTextBox
 */
interface FontSizeConfig {
  readonly max: number
  readonly min: number
  readonly sub: number
}

/**
 * Damage text display class
 * Renders animated damage numbers that float upward and fade out
 */
class DamageTextBox {
  private readonly fontSize: FontSizeConfig

  public damage: number
  private readonly speed: number
  private life: number
  private readonly maxLife: number
  private readonly position: Position
  private readonly width: number
  private readonly fontStyle: string
  /** 缓存的移动向量（避免每帧分配新 PolarVector） */
  private readonly moveVector: PolarVector

  /**
   * @param damage - The damage value to display
   * @param pos - The position to render at
   * @param width - Maximum text width (default: 120)
   * @param fontSize - Maximum font size
   * @param minFontSize - Minimum font size
   * @param fillStyle - Text color (default: 'rgb(0,0,0)')
   * @param speed - Float speed (default: 1.5)
   * @param lifeTicks - Lifetime in ticks (default: 60)
   */
  constructor(
    damage: number,
    pos: Position,
    width: number = 120,
    fontSize: number,
    minFontSize: number,
    fillStyle?: string,
    speed?: number,
    lifeTicks?: number
  ) {
    this.position = pos
    this.width = width
    this.damage = damage
    this.speed = speed ?? 1.5
    this.maxLife = this.life = lifeTicks ?? 60

    this.fontSize = {
      max: fontSize,
      min: minFontSize,
      sub: fontSize - minFontSize
    }

    this.fontStyle = fillStyle ?? 'rgb(0,0,0)'
    this.moveVector = new PolarVector(this.speed, 90)
  }

  private get font(): string {
    return `${(this.life / this.maxLife) * this.fontSize.sub + this.fontSize.min}px Game`
  }

  /**
   * Render and update the damage text
   * @returns true if animation is complete
   */
  run(ctx: CanvasRenderingContext2D): boolean {
    const prevFont = ctx.font
    const prevFillStyle = ctx.fillStyle

    ctx.font = this.font
    ctx.fillStyle = this.fontStyle

    ctx.fillText(FormatUtils.britishFormatter(this.damage, 1), this.position.x, this.position.y, this.width)

    ctx.font = prevFont
    ctx.fillStyle = prevFillStyle

    this.life--

    if (this.life >= 0) {
      this.position.move(this.moveVector)
      return false
    }
    return true
  }
}

/**
 * Scrolling container for health change hint texts
 * Manages multiple DamageTextBox instances with merge capability
 */
class HealthChangeHintScrollBox extends Base {
  public boxes: DamageTextBox[] = []

  private readonly masterPosition: Position
  private readonly width: number
  private readonly fontMax: number
  private readonly fontMin: number
  private readonly fill: string
  private readonly speed: number
  /** Threshold for merging consecutive damage values (ms) */
  private readonly needMergeItvMs: number
  private readonly life: number

  private lastPush: { time: DOMHighResTimeStamp; box: Optional<DamageTextBox> }

  constructor(
    pos: Position,
    width: number,
    fontMax: number,
    fontMin: number,
    fill: string,
    speed: number,
    life: number
  ) {
    super()

    this.masterPosition = pos

    this.width = width
    this.fontMax = fontMax
    this.fontMin = fontMin
    this.fill = fill
    this.speed = speed
    this.life = life

    this.needMergeItvMs = (fontMax / speed / 14) * 1000

    this.lastPush = {
      time: 0,
      box: null
    }
  }

  run(ctx: CanvasRenderingContext2D): void {
    this.boxes = this.boxes.filter(box => !box.run(ctx))
    // 清除对已移除文本框的引用，防止向幽灵对象合并伤害
    if (this.lastPush.box && !this.boxes.includes(this.lastPush.box)) {
      this.lastPush.box = null
    }
  }

  push(dmg: number): void {
    const now = performance.now()

    if (this.lastPush.box && now - this.lastPush.time < this.needMergeItvMs) {
      // Merge with previous damage text
      this.lastPush.box.damage += dmg
    } else {
      const newBox = new DamageTextBox(
        dmg,
        this.masterPosition.copy(),
        this.width,
        this.fontMax,
        this.fontMin,
        this.fill,
        this.speed,
        this.life
      )
      this.boxes.push(newBox)

      this.lastPush.time = now
      this.lastPush.box = newBox
    }
  }
}
