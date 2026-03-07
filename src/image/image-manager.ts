/// <reference path='./animation-sprite.ts' />
/// <reference path='./image-data.ts' />

/**
 * Image and sprite manager
 * Handles loading, caching and playing of images and animation sprites
 */
class ImageManager {
  public bitmapMapping: Map<string, ImageBitmap> = new Map()
  public spriteMapping: Map<string, AnimationSprite> = new Map()
  public onPlaySprites: HostedAnimationSprite[] = []

  /**
   * Play all active hosted animation sprites
   */
  play(ctx: WrappedCanvasRenderingContext2D): void {
    this.onPlaySprites = this.onPlaySprites.filter(as => {
      if (!as.sp.isFinish) as.render(ctx as CanvasRenderingContext2D)
      return !as.sp.isFinish
    })
  }

  /**
   * Get a bitmap by name
   */
  getBitmap(name: string): ImageBitmap | undefined {
    return this.bitmapMapping.get(name)
  }

  /**
   * Get a bitmap by name (alias for getBitmap)
   * @deprecated Use getBitmap instead for clarity
   */
  getImage(name: string): ImageBitmap | undefined {
    return this.bitmapMapping.get(name)
  }

  /**
   * Get a sprite by name
   */
  getSprite(name: string): AnimationSprite | undefined {
    return this.spriteMapping.get(name)
  }

  /**
   * Load all bitmap images from BITMAP_CONFIGS
   */
  async loadImages(): Promise<void> {
    const loadTasks: Promise<[string, ImageBitmap]>[] = BITMAP_CONFIGS.map(({ name, url }) => {
      const prom: Promise<[string, ImageBitmap]> = new Promise(res => {
        const img = new Image()
        img.onload = () => {
          createImageBitmap(img).then(bitmap => {
            res([name, bitmap])
          })
        }
        img.src = url
      })
      return prom
    })

    const resArr = await Promise.all(loadTasks)
    resArr.forEach(res => {
      this.bitmapMapping.set(res[0], res[1])
    })
  }

  /**
   * Load all sprite sheets from SPRITE_SHEET_CONFIGS
   */
  async loadSpriteSheets(): Promise<void> {
    const loadTasks: Promise<[string, AnimationSprite]>[] = SPRITE_SHEET_CONFIGS.map(({ name, url, x, y }) => {
      const prom: Promise<[string, AnimationSprite]> = new Promise(res => {
        const img = new Image()
        img.onload = () => {
          createImageBitmap(img).then(bitmap => {
            const sprite = new AnimationSprite(bitmap, x, y)
            res([name, sprite])
          })
        }
        img.src = url
      })
      return prom
    })

    const resArr = await Promise.all(loadTasks)
    resArr.forEach(res => {
      this.spriteMapping.set(res[0], res[1])
    })
  }
}

// Legacy alias for backwards compatibility
// @deprecated Use ImageManager instead
const ImageManger = ImageManager
