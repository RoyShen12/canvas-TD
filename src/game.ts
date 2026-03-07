/// <reference path="./monster.ts" />
/// <reference path="./tower.ts" />
/// <reference path="./bullet.ts" />
/// <reference path="./image.ts" />
/// <reference path="./canvas.ts" />
/// <reference path="./event.ts" />
/// <reference path="./stage.ts" />
/// <reference path="./utils/dom-utils.ts" />
/// <reference path="./utils/math-utils.ts" />
/// <reference path="./game/GameTypes.ts" />
/// <reference path="./game/GamePathfinder.ts" />
/// <reference path="./game/GameRenderer.ts" />
/// <reference path="./game/GameEventHandler.ts" />
/// <reference path="./game/GameUIManager.ts" />
/// <reference path="./game/game-context.ts" />

/**
 * 游戏主控制器
 * 负责游戏生命周期管理、各模块协调和游戏循环
 */
class Game extends Base {
  // ============================================================================
  // 静态属性和便捷方法
  // ============================================================================

  /** 传奇宝石升级点数（静态访问器） */
  static updateGemPoint: number

  /**
   * 获取游戏区域对角线长度
   * @returns 左侧游戏区域的对角线长度（像素）
   */
  static callDiagonalLength: () => number

  /**
   * 在动画图层中绘制特效的便捷函数
   * @param name 动画名称
   * @param pos 位置
   * @param w 宽度
   * @param h 高度
   * @param speed 速度
   * @param delay 延迟
   * @param waitFrame 等待帧数
   * @param cb 回调函数
   */
  static callAnimation: (name: string, pos: Position, w: number, h: number, speed?: number, delay?: number, waitFrame?: number, cb?: CallableFunction) => void

  /**
   * 获取位图的便捷函数
   * @param name 图片名称
   * @returns ImageBitmap 或 null
   */
  static callImageBitMap: (name: string) => Optional<ImageBitmap>

  /**
   * 获取图层上下文的便捷函数
   * @param name 图层名称
   * @returns Canvas 上下文
   */
  static callCanvasContext: (name: string) => WrappedCanvasRenderingContext

  /**
   * 获取游戏区域的右下角坐标的便捷函数
   * @returns 边界位置
   */
  static callBoundaryPosition: () => Position

  /**
   * 获取单元格边长的便捷函数
   * @returns 网格大小（像素）
   */
  static callGridSideSize: () => number

  /**
   * 获取屏幕左右区域分割线 X 坐标的便捷函数
   * @returns 分割线 X 坐标
   */
  static callMidSplitLineX: () => number

  /**
   * 根据 ID 获取 DOM 元素的便捷函数（带缓存）
   * @param id 元素 ID
   * @returns DOM 节点
   */
  static callElement = (id: string): Optional<Node | Node[]> => {
    const key = 'by_id_' + id
    if (DomUtils._cache.has(key)) {
      return DomUtils._cache.get(key)!
    }
    const targetEl = document.getElementById(id)
    if (targetEl) {
      DomUtils._cache.set(key, targetEl)
      return targetEl
    }
    return null
  }

  /**
   * 隐藏状态组件的便捷函数
   */
  static callHideStatusBlock = (): void => {
    GameUIManager.hideStatusPanel()
  }

  /**
   * 获取金钱和更新函数
   * @returns [当前金钱, 更新金钱函数]
   */
  static callMoney: () => [number, typeof Game.prototype.updateMoney]

  /** 移除塔的便捷函数 */
  static callRemoveTower: (t: TowerBase) => void

  /** 获取塔工厂的便捷函数 */
  static callTowerFactory: () => typeof _TowerManager.prototype.Factory

  /** 获取塔列表的便捷函数 */
  static callTowerList: () => readonly TowerBase[]

  /** 获取独立塔列表的便捷函数 */
  static callIndependentTowerList: () => readonly (TowerBase & { carrierTower: CarrierTower })[]

  /** 获取怪物列表的便捷函数 */
  static callMonsterList: () => readonly MonsterBase[]

  /**
   * 生成怪物的便捷函数
   * @param monsterName 怪物类型名称
   * @param position 生成位置
   * @param level 怪物等级
   */
  static callMonsterSpawn: (monsterName: string, position: Position, level: number) => void

  /** 获取起点位置的便捷函数 */
  static callOriginPosition: () => Position

  /** 获取终点位置的便捷函数 */
  static callDestinationPosition: () => Position

  /** 更改 F1 模式的便捷函数 */
  static callChangeF1Mode: (val: boolean) => void

  /** 更改航母武器模式的便捷函数 */
  static callChangeCarrierWeaponMode: (mode: number) => void

  /**
   * 右侧选择区的依赖注入
   * Game 无法获得所有塔的信息，只能从 TowerManager 对象中获取
   * 并依次构建基类 ItemBase，注入信息以在建造时获取正确信息
   * @param itm IOC 项目
   * @param ctor 塔构造配置
   * @param _ctx Canvas 上下文
   * @param _txt_fx 文本绘制函数
   * @param centerX 中心 X 坐标
   * @param centerY 中心 Y 坐标
   * @param R 半径
   * @param price 当前金币
   */
  static IOC(
    itm: IocItem,
    ctor: (typeof towerCtors)[0],
    _ctx: CanvasRenderingContext2D,
    _txt_fx: (text: string, bx: number, by: number, maxWidth: number, color: string, fSize: number) => void,
    centerX: number,
    centerY: number,
    R: number,
    price: number
  ): void {
    itm.render(_ctx)
    itm.__re_render_text = currentPrice => {
      const color = currentPrice ? (currentPrice >= ctor.p[0]! ? '#111111' : '#F56C6C') : '#111111'
      _txt_fx(`$ ${ctor.p[0]}`, centerX - R * 0.55 - 2, centerY + R, R * 2, color, 10)
    }
    itm.__re_render_text(price)
    itm.__dn = ctor.dn
    itm.__od = ctor.od
    itm.__inner_img_u = ctor.n
    itm.__inner_b_img_u = ctor.bn
    itm.__init_price = ctor.p
    itm.__ctor_name = ctor.c
    itm.__rng_lv0 = ctor.r(0)
    itm.__tlx = centerX - R - 3
    itm.__tly = centerY - R - 3
    itm.__re_render = width => {
      itm.borderWidth = width
      _ctx.clearRect(itm.__tlx, itm.__tly, (R + 2) * 2, (R + 2) * 2)
      itm.render(_ctx)
    }
  }

  // ============================================================================
  // 私有属性
  // ============================================================================

  /** 游戏开始时间戳 */
  private _bornStamp: number | undefined

  /** 设置游戏开始时间戳（仅执行一次） */
  private _setBornStamp = _.once(() => {
    this._bornStamp = performance.now()
  })

  /** 是否测试模式 */
  private readonly _isTestMode: boolean

  /** 是否虚拟测试模式 */
  private _isDummyTestMode: boolean

  /** 游戏每秒更新次数 */
  private readonly _tickRate = GAME_TIMING.TICK_RATE

  /** 控制怪物升级的参数 */
  private _count: number

  /** 控制怪物升级的步长 */
  private _stepDivide: number

  /** 更新 tick 计数 */
  private _updateTick = 0

  /** 渲染 tick 计数 */
  private _renderTick = 0

  /** 塔层是否需要重绘（由 update() 计算，render() 使用） */
  private _towerNeedRender = true

  /** 网格列数 */
  private readonly _gridColumns: number

  /** 网格行数 */
  private readonly _gridRows: number

  /** 不考虑围墙的起点方格坐标 */
  private readonly _originGrid: PositionLike

  /** 考虑围墙后的终点方格坐标（x,y 和 canvas 的 x,y 是颠倒的） */
  private readonly _destinationGrid: PositionLike

  /** 是否暂停中 */
  private _isPausing = true

  /** 游戏是否结束 */
  private _isGameOver = false

  /** 游戏是否胜利 */
  private _isVictory = false

  /** 围墙边界数组 */
  private readonly _wallBoundary: number[][]

  /** 游戏速度倍率 */
  private _speedRatio = 1

  /** 当前金币 */
  private _money: number

  /** 当前生命值 */
  private _life: number

  /** 可选择的塔列表 */
  private _towerForSelect: IocItem[] = []

  /** 游戏网格（0=障碍，1=可通行） */
  private _grids: number[][] = []

  /** 路径缓存映射 */
  private _posPathMapping = new Map<string, PositionLike[]>()

  /** 左右区域分割线 X 坐标 */
  private _midSplitLineX = -1

  /** 传奇宝石升级点数 */
  private _gemPoints: number

  /** 速度循环数组 */
  private readonly _loopSpeeds: number[]

  /** 网格大小（像素） */
  private _gridSize!: number

  /** 左侧区域宽度 */
  private _leftAreaWidth!: number

  /** 左侧区域高度 */
  private _leftAreaHeight!: number

  /** 右侧区域宽度 */
  private _rightAreaWidth!: number

  /** 起点像素位置 */
  private _originPosition!: Position

  /** 终点像素位置 */
  private _destinationPosition!: Position

  // ============================================================================
  // 模块实例
  // ============================================================================

  /** 寻路管理器 */
  private _pathfinder!: GamePathfinder

  /** 渲染管理器 */
  private _renderer!: GameRenderer

  /** 事件处理器 */
  private _eventHandler!: GameEventHandler

  /** UI 管理器 */
  private _uiManager!: GameUIManager

  /** 波次 UI 管理器 */
  private _waveUIManager!: WaveUIManager

  // ============================================================================
  // 管理器实例
  // ============================================================================

  /** 图片管理器 */
  private readonly _imageManager: ImageManager

  /** Canvas 管理器 */
  private readonly _canvasManager: CanvasManager

  /** 事件管理器 */
  private readonly _eventManager: EventManager

  /** 塔管理器 */
  private readonly _towerManager: _TowerManager

  /** 怪物管理器 */
  private readonly _monsterManager: MonsterManager

  /** 子弹管理器 */
  private readonly _bulletManager: BulletManager

  // ============================================================================
  // 构造函数
  // ============================================================================

  /**
   * 创建游戏实例
   * @param imageManager 图片管理器
   * @param GX 网格列数
   * @param GY 网格行数
   */
  constructor(imageManager: ImageManager, GX: number = GRID_CONFIG.DEFAULT_COLUMNS, GY: number = GRID_CONFIG.DEFAULT_ROWS) {
    super()

    // debug only
    g = this

    this._isTestMode = localStorage.getItem('debug_mode') === '1'
    this._isDummyTestMode = false

    this._count = this._isTestMode ? 50 : 0
    this._stepDivide = this._isTestMode ? 2 : 8

    this._gridColumns = GX
    this._gridRows = GY

    this._wallBoundary = [new Array(this._gridColumns + 2).fill(0)]

    this._originGrid = {
      x: 0,
      y: GY / 2 - 1
    }

    this._destinationGrid = {
      x: GY / 2 + 1,
      y: GX
    }

    this._money = this._isTestMode ? GAME_CONFIG.TEST_MODE_MONEY : GAME_CONFIG.INITIAL_MONEY
    this._life = this._isTestMode ? GAME_CONFIG.TEST_MODE_LIFE : GAME_CONFIG.INITIAL_LIFE

    this._imageManager = imageManager
    this._canvasManager = new CanvasManager()
    this._eventManager = new EventManager()
    this._towerManager = new TowerManager()
    this._monsterManager = new MonsterManager()
    this._bulletManager = new BulletManager()

    this._gemPoints = this._isTestMode ? 1e14 : 0
    this._loopSpeeds = this._isTestMode ? [2, 3, 5, 10, 1] : [2, 3, 1]

    this._initStaticAccessors()
  }

  // ============================================================================
  // Getter/Setter
  // ============================================================================

  /**
   * 获取当前对象总数
   */
  private get _objectCount(): number {
    return (
      this._imageManager.onPlaySprites.length +
      this._towerManager.towers.length +
      this._towerManager.independentTowers.length +
      this._monsterManager.monsters.length +
      _.sumBy(this._monsterManager.monsters, mst => (mst.textScrollBox ? mst.textScrollBox.boxes.length : 0)) +
      this._bulletManager.bullets.length
    )
  }

  /**
   * 设置暂停状态
   */
  public set isPausing(v: boolean) {
    if (!v) this._setBornStamp()
    this._uiManager?.updatePauseButton(v)
    this._isPausing = v

    // 显示/隐藏暂停覆盖层（不在游戏结束或胜利状态时显示）
    if (v && !this._isGameOver && !this._isVictory && this._bornStamp) {
      GameUIManager.showPauseOverlay(() => {
        this.isPausing = false
      })
    } else {
      GameUIManager.hidePauseOverlay()
    }
  }

  /**
   * 获取暂停状态
   */
  public get isPausing(): boolean {
    return this._isPausing
  }

  /**
   * 设置游戏速度倍率
   */
  private set _updateSpeedRatio(v: number) {
    this._speedRatio = v
    MainLoop.setSimulationTimestep(1000 / this._tickRate / v)
  }

  /**
   * 获取游戏速度倍率
   */
  private get _updateSpeedRatio(): number {
    return this._speedRatio
  }

  // ============================================================================
  // 初始化方法
  // ============================================================================

  /**
   * 初始化静态访问器
   */
  private _initStaticAccessors(): void {
    Object.defineProperty(Game, 'updateGemPoint', {
      get: () => this._gemPoints,
      set: v => {
        this._gemPoints = v
      },
      enumerable: true
    })

    Game.callTowerFactory = () => this._towerManager.Factory.bind(this._towerManager)
    Game.callTowerList = () => this._towerManager.towers as readonly TowerBase[]
    Game.callIndependentTowerList = () =>
      this._towerManager.independentTowers as unknown as readonly (TowerBase & {
        carrierTower: CarrierTower
      })[]
    Game.callMonsterList = () => this._monsterManager.monsters as readonly MonsterBase[]
    Game.callMonsterSpawn = (monsterName, position, level) => {
      this._spawnMonster(level, position, monsterName)
    }
    Game.callChangeF1Mode = v => {
      this._towerManager.independentTowers.forEach(t => {
        ;(t as _Jet).actMode = v ? CarrierTower.Jet.JetActMode.f1 : CarrierTower.Jet.JetActMode.autonomous
      })
    }
    Game.callChangeCarrierWeaponMode = v => {
      this._towerManager.independentTowers.forEach(t => {
        ;(t as _Jet).weaponMode = v
      })
    }
    Game.callCanvasContext = name => this._canvasManager.getContext(name)
    Game.callImageBitMap = name => this._imageManager.getImage(name)
    Game.callMidSplitLineX = () => this._midSplitLineX
    Game.callMoney = () => [this._money, this.updateMoney.bind(this)]
    Game.callRemoveTower = t => this._removeTower(t)
  }

  /**
   * 初始化游戏
   * @returns this
   */
  public init(): this {
    this._gridSize = Math.floor(innerHeight / this._gridRows)

    this._originPosition = new Position((this._originGrid.x + 0.5) * this._gridSize, (this._originGrid.y + 0.5) * this._gridSize)

    this._destinationPosition = new Position((this._destinationGrid.y - 0.5) * this._gridSize, (this._destinationGrid.x - 0.5) * this._gridSize)

    Game.callOriginPosition = () => this._originPosition.copy()
    Game.callDestinationPosition = () => this._destinationPosition.copy()
    Game.callGridSideSize = () => this._gridSize

    this._leftAreaHeight = this._gridSize * this._gridRows
    this._leftAreaWidth = (this._leftAreaHeight * this._gridColumns) / this._gridRows

    const boundaryPos = Object.freeze(new Position(this._leftAreaWidth, this._leftAreaHeight))
    Game.callBoundaryPosition = () => boundaryPos as Position

    const diagonalLength = Math.sqrt(this._leftAreaWidth ** 2 + this._leftAreaHeight ** 2)
    Game.callDiagonalLength = () => diagonalLength

    this._midSplitLineX = this._leftAreaWidth + 2
    this._rightAreaWidth = innerWidth - this._midSplitLineX

    // 初始化网格
    for (let i = 0; i < this._gridRows; i++) {
      this._grids.push(new Array(this._gridColumns).fill(1))
    }

    // 初始化模块
    this._pathfinder = new GamePathfinder({
      gridColumns: this._gridColumns,
      gridRows: this._gridRows,
      gridSize: this._gridSize,
      destinationGrid: { gridX: this._destinationGrid.x, gridY: this._destinationGrid.y }
    })

    this._renderer = new GameRenderer(this._canvasManager, this._imageManager)
    this._renderer.initCanvasLayers(this._leftAreaWidth, this._leftAreaHeight)

    this._eventHandler = new GameEventHandler(this)
    this._uiManager = new GameUIManager()

    // 将暂停状态暴露给 DOT 管理器
    DOTManager.isPaused = () => this._isPausing

    this._initButtons()
    this._initEventBindings()
    this._renderOnce()

    Game.callAnimation = (name, pos, w, h, speed, delay, wait, _cb) => {
      this._imageManager.onPlaySprites.push(new HostedAnimationSprite(this._imageManager.getSprite(name)!.getClone(speed), pos, w, h, delay, false, wait))
    }

    // 初始化波次系统
    this._initWaveSystem()

    return this
  }

  /**
   * 初始化按钮
   */
  private _initButtons(): void {
    this._uiManager.initButtons({
      gridSize: this._gridSize,
      leftAreaWidth: this._leftAreaWidth,
      isTestMode: this._isTestMode,
      loopSpeeds: this._loopSpeeds,
      onPauseToggle: () => {
        this.isPausing = !this.isPausing
      },
      onSpeedChange: speed => {
        this._updateSpeedRatio = speed
        this._uiManager.updateSpeedButton(speed)
      }
    })

    if (this._isTestMode) {
      this._uiManager.initTestModeUI({
        gridSize: this._gridSize,
        leftAreaWidth: this._leftAreaWidth,
        stepDivide: this._stepDivide,
        count: this._count,
        onStepDivideChange: value => {
          this._stepDivide = value
        },
        onCountChange: delta => {
          this._count += delta
        },
        onDebugRectToggle: enabled => {
          __debug_show_refresh_rect = enabled
        }
      })
    }
  }

  /**
   * 初始化事件绑定
   */
  private _initEventBindings(): void {
    this._eventManager.bindEvent(
      [
        {
          evtName: 'onkeydown',
          cb: (e: KeyboardEvent) => this._handleKeyDown(e)
        }
      ],
      document
    )

    const reactDivEle = this._uiManager.createReactLayer()

    const mouseMoveHandler = this._eventHandler.createMouseMoveHandler(
      this._midSplitLineX,
      this._towerForSelect,
      () => this._towerManager.towers,
      () => this._towerManager.independentTowers,
      () => this._monsterManager.monsters,
      this._renderer.mouseCtx,
      this._pathfinder,
      this._gridSize
    )

    this._eventManager.bindEvent(
      [
        {
          evtName: 'onmousedown',
          cb: (e: MouseEvent) => {
            const mousePos = new Position(e.offsetX, e.offsetY)
            switch (e.button) {
              case 0:
                this._handleLeftClick(mousePos)
                break
              case 2:
                this._handleRightClick(mousePos)
                break
            }
          }
        },
        {
          evtName: 'onmousemove',
          cb: mouseMoveHandler
        }
      ],
      reactDivEle
    )
  }

  // ============================================================================
  // 事件处理方法
  // ============================================================================

  /**
   * 处理左键点击
   */
  private _handleLeftClick(mousePos: Position): void {
    this._eventHandler.handleLeftClick(
      mousePos,
      this._midSplitLineX,
      this._towerForSelect,
      this._towerManager.towers,
      this._towerManager.independentTowers,
      this._money,
      this._gridSize,
      this._pathfinder,
      this._grids,
      this._wallBoundary,
      this._monsterManager.monsters,
      (pos, ctorName, imgName, bImgName, price) => this._buildTower(pos, ctorName, imgName, bImgName, price),
      delta => this.updateMoney(delta),
      this._renderer.mouseCtx
    )
  }

  /**
   * 处理右键点击
   */
  private _handleRightClick(mousePos: Position): void {
    this._eventHandler.handleRightClick(mousePos, this._towerManager.towers, tower => this._removeTower(tower))
  }

  /**
   * 处理键盘按下
   */
  private _handleKeyDown(e: KeyboardEvent): void {
    this._eventHandler.handleKeyDown(
      e,
      this._towerForSelect,
      this._isTestMode,
      this._uiManager.startPauseButton,
      () => this._spawnDummy(),
      () => this._spawnDummyBatch(),
      this._midSplitLineX,
      () => this._handleLeftClick(this._eventHandler.lastMouseMovePosition)
    )
  }

  // ============================================================================
  // 游戏逻辑方法
  // ============================================================================

  /**
   * 启用虚拟测试模式
   */
  private _enableDummyTestMode(): void {
    if (!this._isDummyTestMode) this._isDummyTestMode = true
  }

  /**
   * 生成测试怪物
   */
  private _spawnDummy(): void {
    this._enableDummyTestMode()
    this._spawnMonster(
      100,
      this._originPosition
        .copy()
        .move(new PolarVector(this._gridSize, 0))
        .dithering(this._gridSize, this._gridSize / 2),
      'Dummy'
    )
  }

  /**
   * 批量生成测试怪物
   */
  private _spawnDummyBatch(): void {
    this._enableDummyTestMode()
    for (let i = 0; i < 100; i++) {
      this._spawnMonster(
        100,
        this._originPosition
          .copy()
          .move(new PolarVector(this._gridSize, 0))
          .dithering(this._gridSize, this._gridSize / 2),
        'Dummy'
      )
    }
  }

  /**
   * 建造塔
   */
  private _buildTower(pos: Position, ctorName: string, imgName: string, bImgName: Optional<string>, price: number): void {
    const gridInfo = this._pathfinder.getGridInfoAtPosition(pos, this._midSplitLineX)
    if (!gridInfo) return

    const img = this._imageManager.getImage(imgName)
    if (!img) return

    const bImg = bImgName ? this._imageManager.getImage(bImgName) : null

    const tow = this._towerManager.Factory(ctorName, new Position(gridInfo.centerX, gridInfo.centerY), img, bImg, this._gridSize / 2 - 2)

    this.updateMoney(price)

    if (this._grids[gridInfo.gridX]) {
      this._grids[gridInfo.gridX]![gridInfo.gridY] = 0
    }

    tow._gridIx = gridInfo.gridX
    tow._gridIy = gridInfo.gridY

    if (this._isTestMode) {
      while (!tow.isMaxLevel && tow.price[tow.level + 1]! <= this._money) {
        this.updateMoney(-1 * tow.levelUp(this._money))
      }
    }

    this._pathfinder.invalidatePathsThrough(gridInfo.gridX, gridInfo.gridY)
    this._posPathMapping.clear()
  }

  /**
   * 移除塔
   */
  private _removeTower(tower: TowerBase): void {
    tower.isSold = true

    if ('_gridIx' in tower && '_gridIy' in tower) {
      if (this._grids[tower._gridIx]) {
        this._grids[tower._gridIx]![tower._gridIy] = 1
      }
      this._pathfinder.invalidatePathsThrough(tower._gridIx, tower._gridIy)
      this._posPathMapping.clear()
    }
  }

  /**
   * 生成怪物
   */
  private _spawnMonster(level: number, pos: Position, ctorName: string): void {
    // 验证生成位置是否在可通行格子上
    const gridInfo = this._pathfinder.getGridInfoAtPosition(pos, Infinity)
    if (gridInfo) {
      const isWalkable = this._grids[gridInfo.gridX]?.[gridInfo.gridY] === 1
      if (!isWalkable) {
        // 生成位置不可通行（例如有塔），回退到起点位置
        pos = this._originPosition.copy()
      }
    }

    const ctor = MonsterRegistry.getOrThrow(ctorName) as any
    const { imgName, sprSpd } = ctor
    this._monsterManager.Factory(
      ctorName,
      pos.dithering(this._gridSize / 3),
      imgName.indexOf('$spr::') !== -1 ? this._imageManager.getSprite(imgName.substr(6))!.getClone(sprSpd || 1) : this._imageManager.getImage(imgName)!,
      level
    )
  }

  /**
   * 初始化波次系统
   */
  private _initWaveSystem(): void {
    const waveManager = WaveManager.getInstance()

    // 设置怪物生成回调
    waveManager.setSpawnCallback((monsterName: string, level: number) => {
      this._spawnMonster(level, this._originPosition.copy(), monsterName)
    })

    // 设置奖励回调
    waveManager.setRewardCallback((amount: number) => {
      this.updateMoney(amount)
    })

    // 加载标准波次
    const waves = WaveFactory.createStandardWaves()
    waveManager.loadWaves(waves)

    // 初始化波次 UI
    this._waveUIManager = new WaveUIManager()
    this._waveUIManager.init()
  }

  /**
   * 开始无尽模式
   */
  private _startEndlessMode(): void {
    this._isVictory = false
    GameUIManager.hideAllOverlays()

    const waveManager = WaveManager.getInstance()
    const startWave = waveManager.getTotalWaves() + 1

    // 生成10波无尽模式波次
    const endlessWaves: Wave[] = []
    for (let i = 0; i < 10; i++) {
      const def = WaveFactory.createEndlessWaveDefinition(startWave + i)
      endlessWaves.push(WaveFactory.createWave(def))
    }
    waveManager.appendWaves(endlessWaves)

    // 更新波次 UI 的总数
    this._waveUIManager?.updateTotalWaves(waveManager.getTotalWaves())

    this.isPausing = false
    GameUIManager.showToast('无尽模式已开始！难度将持续增加', 'info')
  }

  /**
   * 更新金币
   * @param delta 变化量
   * @param _happenedPosition 发生位置（未使用）
   */
  public updateMoney(delta: number, _happenedPosition?: Position): void {
    this._money += delta
    if (this._isTestMode) this._money = GAME_CONFIG.TEST_MODE_MONEY
  }

  /**
   * 更新金币（别名，保持向后兼容）
   * @param delta 变化量
   * @param _happenedPosition 发生位置（未使用）
   */
  public emitMoney(delta: number, _happenedPosition?: Position): void {
    this.updateMoney(delta, _happenedPosition)
  }

  /**
   * 更新生命值
   * @param delta 变化量
   */
  public updateLife(delta: number): void {
    if (this._isGameOver) return

    this._life += delta
    if (this._life <= 0) {
      this._life = 0
      this._isGameOver = true
      this.isPausing = true
      GameUIManager.showGameOverOverlay(
        {
          totalDamage: this._towerManager.totalDamage,
          totalKill: this._towerManager.totalKill,
          wavesCleared: WaveManager.getInstance().waveNumber - 1,
          survivalTime: this._bornStamp ? performance.now() - this._bornStamp : 0
        },
        () => window.location.reload()
      )
    }
  }

  /**
   * 更新生命值（别名，保持向后兼容）
   * @param delta 变化量
   */
  public emitLife(delta: number): void {
    this.updateLife(delta)
  }

  /**
   * 获取从起点到终点的路径
   * @param startPos 起始位置
   * @returns 路径点数组
   */
  public getPathToEnd(startPos: Position): PositionLike[] {
    const gridInfo = this._pathfinder.getGridInfoAtPosition(startPos, Infinity)
    if (!gridInfo) return []

    const key = `${gridInfo.gridX}|${gridInfo.gridY}`

    if (this._posPathMapping.has(key)) {
      return this._posPathMapping.get(key)!
    }

    const path = this._pathfinder.findPath(startPos, this._grids, this._wallBoundary)
    this._posPathMapping.set(key, path)
    return path
  }

  // ============================================================================
  // 渲染方法
  // ============================================================================

  /**
   * 渲染一次性静态内容
   */
  private _renderOnce(): void {
    this._renderer.renderBackground({
      gridColumns: this._gridColumns,
      gridRows: this._gridRows,
      gridSize: this._gridSize,
      leftAreaWidth: this._leftAreaWidth,
      leftAreaHeight: this._leftAreaHeight,
      rightAreaWidth: this._rightAreaWidth,
      midSplitLineX: this._midSplitLineX,
      originPosition: this._originPosition,
      destinationPosition: this._destinationPosition,
      isTestMode: this._isTestMode
    })

    this._renderTowerSelector()
    this._renderer.renderInfoLabels()
  }

  /**
   * 渲染塔选择器
   */
  private _renderTowerSelector(): void {
    const tsAreaRectTL = new Position(this._leftAreaWidth + UI_LAYOUT.TOWER_SELECTOR_MARGIN, UI_LAYOUT.TOWER_SELECTOR_TOP)
    const tsMargin = this._gridSize / 2 + UI_LAYOUT.TOWER_ICON_MARGIN
    const tsItemRadius = this._gridSize / 2 + UI_LAYOUT.TOWER_ICON_RADIUS_OFFSET

    const oneTsWidth = tsMargin + 2 * tsItemRadius
    const chunkSize = Math.floor((this._rightAreaWidth - tsItemRadius - 30) / oneTsWidth)
    const chunkedTowerCtors = _.chunk(TowerManager.towerCtors, chunkSize)
    const tsMarginBottom = this._gridSize / 2 + 6

    const bgCtx = this._renderer.backgroundCtx as unknown as CanvasRenderingContext2D

    chunkedTowerCtors.forEach((ctorRow, rowIdx) => {
      if (rowIdx > 0) {
        tsAreaRectTL.move(new PolarVector(tsMarginBottom + tsItemRadius * 2, 270))
      }

      ctorRow.forEach((_t, idx) => {
        const ax = tsAreaRectTL.x + oneTsWidth * idx + tsItemRadius
        const ay = tsAreaRectTL.y + tsItemRadius

        if (!_t.n.includes('$spr::')) {
          const temp = new ItemBase(new Position(ax, ay), tsItemRadius, 0, 'rgba(255,67,56,1)', this._imageManager.getImage(_t.n)!) as IocItem
          Game.IOC(temp, _t, bgCtx, this._renderer.renderStandardText.bind(this._renderer), ax, ay, tsItemRadius, this._money)
          this._towerForSelect.push(temp)
          this._towerForSelect.sort(MathUtils.compareProperties('__od'))
        } else {
          const spr_d = this._imageManager.getSprite(_t.n.substr(6))!.getClone(6)
          const temp = new ItemBase(new Position(ax, ay), tsItemRadius, 0, 'rgba(255,67,56,1)', spr_d) as IocItem
          Game.IOC(temp, _t, bgCtx, this._renderer.renderStandardText.bind(this._renderer), ax, ay, tsItemRadius, this._money)
          this._towerForSelect.push(temp)
          this._towerForSelect.sort(MathUtils.compareProperties('__od'))
        }
      })
    })
  }

  // ============================================================================
  // 游戏循环
  // ============================================================================

  /**
   * 启动游戏循环
   */
  public run(): void {
    const update = this._isTestMode ? this._renderer.createPerformanceWrapper(() => this.update(), 'Update', 6, 120, 120, 50, 120, 16.667, 5, 12) : () => this.update()

    const draw = this._isTestMode ? this._renderer.createPerformanceWrapper(() => this.render(), 'Render', 6, 220, 120, 50, 120, 40, 10, 16.67) : () => this.render()

    MainLoop.setSimulationTimestep(1000 / this._tickRate / this._updateSpeedRatio)
      .setUpdate(update)
      .setDraw(draw)
      .start()
  }

  /**
   * 更新游戏状态
   * @returns 塔是否需要重新渲染
   */
  public update(): boolean {
    if (this.isPausing) {
      // 暂停时仍然执行清理，但不递增 tick
      this._bulletManager.scanSwipe()
      this._monsterManager.scanSwipe(this.updateMoney.bind(this))
      const result = this._towerManager.scanSwipe(this.updateMoney.bind(this))
      this._towerNeedRender = this._towerNeedRender || result
      return result
    }

    this._updateTick++

    // 使用波次系统生成怪物
    if (!Reflect.get(window, '__d_stop_ms') && !this._isDummyTestMode) {
      WaveManager.getInstance().update(this._updateTick)
    }

    this._towerManager.run(this._monsterManager.monsters)
    this._bulletManager.run(this._monsterManager.monsters)
    this._monsterManager.run(this.getPathToEnd.bind(this), this.updateLife.bind(this), this._towerManager.towers, this._monsterManager.monsters)

    this._bulletManager.scanSwipe()
    this._monsterManager.scanSwipe(this.updateMoney.bind(this))
    const result = this._towerManager.scanSwipe(this.updateMoney.bind(this))
    this._towerNeedRender = this._towerNeedRender || result

    // 检查胜利条件：所有波次完成且场上无怪物
    if (!this._isVictory && !this._isGameOver && !this._isDummyTestMode) {
      const wm = WaveManager.getInstance()
      if (wm.getState() === WaveState.COMPLETED && this._monsterManager.monsters.length === 0) {
        this._isVictory = true
        this.isPausing = true
        GameUIManager.showVictoryOverlay(
          {
            totalDamage: this._towerManager.totalDamage,
            totalKill: this._towerManager.totalKill,
            survivalTime: this._bornStamp ? performance.now() - this._bornStamp : 0,
            lifeRemaining: this._life
          },
          () => this._startEndlessMode(),
          () => window.location.reload()
        )
      }
    }

    return result
  }

  /**
   * 渲染游戏画面
   * @param towerNeedRender 塔是否需要渲染
   */
  public render(): void {
    if (this._renderTick === 0) {
      this._renderer.renderGameStats(this._towerManager.totalDamage, this._towerManager.totalKill, this._bornStamp)
      this._renderer.renderMoney(this._money)
      this._renderer.renderGemPoint(this._gemPoints)
      this._renderer.renderLife(this._life)
    }

    this._renderTick++

    if (this._isTestMode) {
      this._renderer.renderDebugInfo({
        renderTick: this._renderTick,
        updateTick: this._updateTick,
        objectCount: this._objectCount,
        domCount: document.getElementsByTagName('*').length,
        fps: MainLoop.getFPS()
      })
    }

    if (this._renderTick % RENDER_INTERVALS.MONEY === 0) {
      this._renderer.renderGameStats(this._towerManager.totalDamage, this._towerManager.totalKill, this._bornStamp)
      this._renderer.renderMoney(this._money)
    }
    if (this._renderTick % RENDER_INTERVALS.GEM_POINT === 0) {
      this._renderer.renderGemPoint(this._gemPoints)
    }
    if (this._renderTick % RENDER_INTERVALS.LIFE === 0) {
      this._renderer.renderLife(this._life)
      this._towerForSelect.forEach(itm => itm.__re_render_text(this._money))
    }

    // 更新波次 UI（每 5 帧更新一次以节省性能）
    if (this._renderTick % 5 === 0) {
      this._waveUIManager?.update(this._updateTick)
    }

    const offScreenCtx = this._renderer.offscreenCtx

    if (this._renderer.useClassicRenderStyle) {
      offScreenCtx.clearRect(0, 0, offScreenCtx.dom.width, offScreenCtx.dom.height)
    }

    this._monsterManager.render(offScreenCtx, this._imageManager)
    this._bulletManager.render(offScreenCtx)
    this._imageManager.play(offScreenCtx)
    this._towerManager.rapidRender(offScreenCtx, this._monsterManager.monsters)

    if (this._towerNeedRender) {
      this._renderer.clearTowerLayer()
      this._towerManager.render(this._renderer.towerCtx as WrappedCanvasRenderingContext2D)
      this._towerNeedRender = false
    }

    this._renderer.paintOffscreenToMain()
  }
}

// ============================================================================
// 游戏启动函数
// ============================================================================

/**
 * 异步启动游戏
 */
async function run(): Promise<void> {
  const text = document.getElementById('loading_text')!
  const mask = document.getElementById('loading_mask')!
  const progressBar = document.getElementById('loading_progress')

  const setProgress = (percent: number) => {
    if (progressBar) progressBar.style.width = percent + '%'
  }

  try {
    console.time('load font')

    text.textContent = '加载字体中'
    setProgress(10)
    const resp = await fetch('game_font_1.ttf')
    const fontBuffer = await resp.arrayBuffer()

    // @ts-ignore
    const font = new FontFace('Game', fontBuffer)
    const resultFont = await font.load()

    // @ts-ignore
    document.fonts.add(resultFont)
    setProgress(30)

    console.timeEnd('load font')
  } catch (error) {
    console.error(error)
  }

  try {
    console.time('load images')

    const imageCtrl = new ImageManager()

    text.textContent = '加载贴图'
    setProgress(40)
    await imageCtrl.loadImages()
    setProgress(70)

    text.textContent = '加载动画'
    await imageCtrl.loadSpriteSheets()
    setProgress(100)

    console.timeEnd('load images')

    text.textContent = '准备就绪'

    // 淡出加载画面
    mask.style.opacity = '0'
    await new Promise(resolve => setTimeout(resolve, 300))
    document.body.removeChild(mask)

    const gridSizeBase = GRID_CONFIG.BASE_SIZE
    const gridYSize = GRID_CONFIG.ASPECT_MULTIPLIER

    const game = new Game(imageCtrl, gridSizeBase * (gridYSize * (Math.round(innerWidth / innerHeight) - 0.5)), gridSizeBase * gridYSize)
    game.init().run()

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) {
          game.isPausing = true
        }
      },
      false
    )
  } catch (error) {
    console.error(error)
  }
}
