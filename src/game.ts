/// <reference path="./monster.ts" />
/// <reference path="./tower.ts" />
/// <reference path="./bullet.ts" />
/// <reference path="./image.ts" />
/// <reference path="./canvas.ts" />
/// <reference path="./event.ts" />

class Game extends Base {
  static updateGemPoint: number

  static callDiagonalLength(): number {
    throw new Error('Method not implemented.')
  }

  /**
   * 在[Animation]图层中绘制特效的便捷函数
   */
  static callAnimation: (name: string, pos: Position, w: number, h: number, speed?: number, delay?: number, waitFrame?: number, cb?: CallableFunction) => void

  /**
   * 获取位图的便捷函数
   */
  static callImageBitMap: (name: string) => Optional<ImageBitmap>

  /**
   * 获取图层上下文的便捷函数
   */
  static callCanvasContext: (name: string) => WrappedCanvasRenderingContext

  /**
   * 获取游戏区域的右下角坐标的便捷函数
   */
  static callBoundaryPosition: () => Position

  /**
   * 获取单元格边长的便捷函数
   */
  static callGridSideSize: () => number

  /**
   * 获取屏幕左右区域分割线x坐标的便捷函数
   */
  static callMidSplitLineX: () => number

  /**
   * 根据id获取DOM元素的便捷函数
   */
  static callElement = (id: string): Optional<Node | Node[]> => {
    const key = 'by_id_' + id
    if (Tools.Dom._cache.has(key)) {
      return Tools.Dom._cache.get(key)!
    } else {
      const targetEl = document.getElementById(id)
      if (targetEl) {
        Tools.Dom._cache.set(key, targetEl)
        return targetEl
      } else {
        return null
      }
    }
  }

  /**
   * 隐藏状态组件的便捷函数
   */
  static callHideStatusBlock = () => {
    document.getElementById('status_block')!.style.display = 'none'
    document.getElementById('gem_block')!.style.display = 'none'
  }

  /**
   * 获取金钱，提交变化
   */
  static callMoney: () => [number, typeof Game.prototype.emitMoney]

  static callRemoveTower: (t: TowerBase) => void

  static callTowerFactory: () => typeof _TowerManager.prototype.Factory

  static callTowerList: () => TowerBase[]

  static callIndependentTowerList: () => (TowerBase & {
    carrierTower: CarrierTower
  })[]

  static callMonsterList: () => MonsterBase[]

  static callOriginPosition: () => Position

  static callDestinationPosition: () => Position

  static callChangeF1Mode: (val: boolean) => void

  static callChangeCarrierWeaponMode: (mode: number) => void

  /**
   * - 右侧选择区的依赖注入
   * - Game无法获得所有塔的信息，只能从TowerManager对象中获取
   * - 并依次构建基类ItemBase，注入信息以在建造时获取正确信息
   * @param centerX 中心x坐标
   * @param centerY 中心y坐标
   * @param R 半径
   */
  static IOC(
    itm: IocItem,
    ctor: typeof towerCtors[0],
    _ctx: CanvasRenderingContext2D,
    _txt_fx: (text: string, bx: number, by: number, maxWidth: number, color: string, fSize: number) => void,
    centerX: number,
    centerY: number,
    R: number,
    price: number
  ) {
    itm.render(_ctx) // 绘制基础图标
    itm.__re_render_text = price => {
      // 注入价格重绘函数
      const color = price ? (price >= ctor.p[0]! ? '#111111' : '#F56C6C') : '#111111'
      _txt_fx(`$ ${ctor.p[0]}`, centerX - R * 0.55 - 2, centerY + R, R * 2, color, 10)
    }
    itm.__re_render_text(price) // 绘制价格
    itm.__dn = ctor.dn // 注入名称
    // itm.__des = ctor.d // 注入描述
    itm.__od = ctor.od // 注入序号
    itm.__inner_img_u = ctor.n // 注入图标
    itm.__inner_b_img_u = ctor.bn // 注入子弹图标
    itm.__init_price = ctor.p // 注入价格数组
    itm.__ctor_name = ctor.c // 注入构造函数名
    itm.__rng_lv0 = ctor.r(0) // 注入初始射程
    itm.__tlx = centerX - R - 3 // 注入中心点坐标
    itm.__tly = centerY - R - 3 // 注入中心点坐标
    itm.__re_render = width => {
      // 注入重绘函数
      itm.borderWidth = width
      _ctx.clearRect(itm.__tlx, itm.__tly, (R + 2) * 2, (R + 2) * 2)
      itm.render(_ctx)
    }
  }

  private bornStamp: number | undefined
  private setBornStamp = _.once(() => {
    this.bornStamp = performance.now()
  })

  private __testMode: boolean
  private __dummy_test_mode: boolean
  /**
   * 游戏每秒更新次数
   */
  private Tick = 60
  /**
   * 控制怪物升级的参数
   */
  private count: number
  /**
   * 控制怪物升级的步长
   */
  private stepDivide: number
  private updateTick = 0
  private renderTick = 0
  private gridX: number
  private gridY: number
  /**
   * 不考虑围墙的起点的方格坐标
   */
  private OriginGrid: PositionLike
  /**
   * - 考虑围墙后的终点的方格坐标
   * - x,y和canvas的x,y是颠倒的
   */
  private DestinationGrid: PositionLike
  private __inner_is_pausing = true
  private __inner_b_arr: number[][]
  private __update_speed_ratio = 1
  private money: number
  private life: number
  private towerForSelect: IocItem[] = []
  // /** 正处于鼠标位置的 Item */
  // private onMouseTower: IocItem = null
  /**
   * 目前选中的将要建造的 ItemBase 代理的 TowerBase
   */
  private selectedTowerTypeToBuild: Optional<IocItem> = null
  /**
   * 正在展示状态面板的 TowerBase
   */
  private statusBoardOnTower: Optional<TowerBase> = null

  private imageCtl: ImageManger
  private contextCtl: CanvasManager
  private evtCtl: EventManager
  private towerCtl: _TowerManager
  private monsterCtl: MonsterManager
  private bulletsCtl: BulletManager

  private ctxOffScreen!: WrappedCanvasRenderingContext2D
  private ctxMain!: WrappedCanvasRenderingContextOnScreen2D
  private ctxTower!: WrappedCanvasRenderingContextOnScreen2D
  private ctxMouse!: WrappedCanvasRenderingContextOnScreen2D
  private ctxBg!: WrappedCanvasRenderingContextOnScreen2D

  /**
   * - 传奇宝石 升级点数
   */
  private updateGemPoint: number

  private startAndPauseButton: Optional<ButtonOnDom> = null
  private speedControlButton: Optional<ButtonOnDom> = null

  private loopSpeeds: number[]
  private lastMouseMovePosition = Position.O
  private grids: number[][] = []
  private posPathMapping: Map<string, PositionLike[]> = new Map()
  private midSplitLineX = -1
  private detailFunctionKeyDown = false
  private useClassicRenderStyle: boolean
  // private averageFrameInterval = 0
  // private renderTimeStamps = new Float64Array(512).fill(-1)
  // private frameTimes = new Float64Array(128).fill(-1)
  private gridSize!: number
  private leftAreaWidth!: number
  private OriginPosition!: Position
  private DestinationPosition!: Position
  private leftAreaHeight!: number
  private rightAreaWidth!: number

  constructor(imageManager: ImageManger, GX = 36, GY = 24) {
    super()

    // debug only
    g = this

    this.__testMode = localStorage.getItem('debug_mode') === '1'
    this.__dummy_test_mode = false

    this.count = this.__testMode ? 50 : 0
    this.stepDivide = this.__testMode ? 2 : 8

    this.gridX = GX
    this.gridY = GY

    this.__inner_b_arr = [new Array(this.gridX + 2).fill(0)]

    this.OriginGrid = {
      x: 0,
      y: GY / 2 - 1
    }

    this.DestinationGrid = {
      x: GY / 2 + 1,
      y: GX
    }

    this.money = this.__testMode ? 1e15 : 5e2
    this.life = this.__testMode ? 8e4 : 20

    this.imageCtl = imageManager
    this.contextCtl = new CanvasManager()
    this.evtCtl = new EventManager()
    this.towerCtl = new TowerManager()
    this.monsterCtl = new MonsterManager()
    this.bulletsCtl = new BulletManager()

    this.updateGemPoint = this.__testMode ? 1e14 : 0

    this.loopSpeeds = this.__testMode ? [2, 3, 5, 10, 1] : [2, 3, 1]

    this.useClassicRenderStyle = 'OffscreenCanvas' in window ? false : true

    Object.defineProperty(Game, 'updateGemPoint', {
      get: () => this.updateGemPoint,
      set: v => {
        this.updateGemPoint = v
      },
      enumerable: true
    })

    Game.callTowerFactory = () => this.towerCtl.Factory.bind(this.towerCtl)
    Game.callTowerList = () => [...this.towerCtl.towers]
    Game.callIndependentTowerList = () =>
      [...this.towerCtl.independentTowers] as (TowerBase & {
        carrierTower: CarrierTower
      })[]
    Game.callMonsterList = () => [...this.monsterCtl.monsters]
    Game.callChangeF1Mode = v => {
      this.towerCtl.independentTowers.forEach(t => {
        ;(t as _Jet).actMode = v ? CarrierTower.Jet.JetActMode.f1 : CarrierTower.Jet.JetActMode.autonomous
      })
    }
    Game.callChangeCarrierWeaponMode = v => {
      this.towerCtl.independentTowers.forEach(t => {
        ;(t as _Jet).weaponMode = v
      })
    }
    Game.callCanvasContext = name => this.contextCtl.getContext(name)
    Game.callImageBitMap = name => this.imageCtl.getImage(name)
    Game.callMidSplitLineX = () => this.midSplitLineX
    Game.callMoney = () => [this.money, this.emitMoney.bind(this)]
    Game.callRemoveTower = t => this.removeTower(t)
  }

  private get objectCount() {
    return (
      this.imageCtl.onPlaySprites.length +
      this.towerCtl.towers.length +
      this.towerCtl.independentTowers.length +
      this.monsterCtl.monsters.length +
      _.sumBy(this.monsterCtl.monsters, mst => (mst.textScrollBox ? mst.textScrollBox.boxes.length : 0)) +
      this.bulletsCtl.bullets.length
    )
  }

  public set isPausing(v) {
    if (!v) this.setBornStamp()

    if (this.startAndPauseButton) this.startAndPauseButton.ele.textContent = v ? '开始' : '暂停'
    this.__inner_is_pausing = v
  }

  public get isPausing() {
    return this.__inner_is_pausing
  }

  private get gridsWithWall() {
    return this.__inner_b_arr.concat(this.grids.map(row => [0, ...row, 0]).concat(this.__inner_b_arr))
  }

  private get updateSpeedRatio() {
    return this.__update_speed_ratio
  }

  private set updateSpeedRatio(v: number) {
    this.__update_speed_ratio = v

    MainLoop.setSimulationTimestep(1000 / this.Tick / v)
  }

  private __debugFlipDummyMode() {
    if (!this.__dummy_test_mode) this.__dummy_test_mode = true
  }

  /**
   * - 新建一个用以寻路的带围墙的Graph
   */
  private makeGraph() {
    return new Astar.Graph(this.gridsWithWall)
  }

  /**
   * - 像素坐标转换到方格坐标
   */
  private coordinateToGridIndex(pos: PositionLike): [number, number] {
    const rubbed = [Math.round(pos.x), Math.round(pos.y)]
    return [Math.max(Math.floor(rubbed[1]! / this.gridSize), 0), Math.max(Math.floor(rubbed[0]! / this.gridSize), 0)]
  }

  /**
   * - 像素坐标转换到方格坐标
   * - 附带所在方格的中心点像素坐标
   * @returns inner grid index: ret[0], ret[1], pos-grid-center-fixed: ret[2], ret[3]
   */
  private whichGrid(pos: Position): [number, number, number, number] {
    if (pos.x > this.midSplitLineX) return [-1, -1, NaN, NaN]
    else {
      const [ix, iy] = this.coordinateToGridIndex(pos)
      // console.log(pos.toString(), '->', `<${ix}, ${iy}>`)
      return [ix, iy, (iy + 0.5) * this.gridSize, (ix + 0.5) * this.gridSize]
    }
  }

  /**
   * - (inner grid index): this.grids[gx][gy]
   */
  private removeOutdatedPath(newBdGX: number, newBdGY: number) {
    this.posPathMapping.forEach((v, k) => {
      if (
        v.some(pos => {
          const [posGX, posGY] = this.coordinateToGridIndex(pos)
          return newBdGX === posGX && newBdGY === posGY
        })
      ) {
        console.log(`detect G pos-path-map ${k} has been contaminated.`)
        this.posPathMapping.delete(k)
      }
    })
    // this.posPathMapping.clear()
  }

  /**
   * - 对输入的起点进行寻路
   * - 终点为 grid[12][35]
   */
  public getPathToEnd(startPos: Position) {
    const wg = this.whichGrid(startPos)
    const key = `${wg[0]}|${wg[1]}`

    if (this.posPathMapping.has(key)) {
      return this.posPathMapping.get(key)!
    } else {
      // this.contextCtl.getContext('path_dbg').clearRect(0, 0, innerWidth, innerHeight)
      // this.contextCtl.getContext('path_dbg').strokeStyle = 'rgba(45,54,231,.3)'
      // this.contextCtl.getContext('path_dbg').lineWidth = 4
      // this.contextCtl.getContext('path_dbg').beginPath()

      const G = this.makeGraph()
      //console.log(G.grid)

      // wg.x和y 各加1（寻路时的围墙）
      //console.log(wg[0] + 1, wg[1] + 1)
      const path = Astar.astar.search(G, G.grid[wg[0] + 1]![wg[1] + 1]!, G.grid[this.DestinationGrid.x]![this.DestinationGrid.y]!).map((p, _idx) => {
        // 每一步的x和y都减去1来拆去围墙
        // 然后加上0.5来调整坐标至单元格的中央
        const y = (p.x - 0.5) * this.gridSize
        const x = (p.y - 0.5) * this.gridSize
        // idx === 0 ? this.contextCtl.getContext('path_dbg').moveTo(x, y, this.gridSize, this.gridSize) :
        // this.contextCtl.getContext('path_dbg').lineTo(x, y, this.gridSize, this.gridSize)
        return { x, y }
      })

      // this.contextCtl.getContext('path_dbg').closePath()
      // this.contextCtl.getContext('path_dbg').stroke()

      this.posPathMapping.set(key, path)
      return path
    }
  }

  private placeTower(pos: Position, ctorName: string, img: string | ImageBitmap | AnimationSprite, bImg: Optional<ImageBitmap>, price: number) {
    const wg = this.whichGrid(pos)
    // console.log('wg', wg)
    const tow = this.towerCtl.Factory(ctorName, new Position(wg[2], wg[3]), img, bImg, this.gridSize / 2 - 2)
    this.emitMoney(price)
    this.grids[wg[0]]![wg[1]]! = 0

    tow.__grid_ix = wg[0]

    tow.__grid_iy = wg[1]

    if (this.__testMode) {
      while (!tow.isMaxLevel && tow.price[tow.level + 1]! <= this.money) {
        this.emitMoney(-1 * tow.levelUp(this.money))
      }
    }
    // tow.inlayGem('GogokOfSwiftness')

    this.removeOutdatedPath(wg[0], wg[1])
  }

  private removeTower(tower: TowerBase) {
    tower.isSold = true

    if ('__grid_ix' in tower && '__grid_iy' in tower) {
      this.grids[tower.__grid_ix]![tower.__grid_iy]! = 1

      this.removeOutdatedPath(tower.__grid_ix, tower.__grid_iy)
    }
  }

  private placeMonster(level: number, pos: Position, ctorName: string) {
    const { imgName, sprSpd } = eval(ctorName)
    this.monsterCtl.Factory(
      ctorName,
      pos.dithering(this.gridSize / 3),
      imgName.indexOf('$spr::') !== -1 ? this.imageCtl.getSprite(imgName.substr(6))!.getClone(sprSpd || 1) : this.imageCtl.getImage(imgName)!,
      level
    )
  }

  public emitMoney(changing: number, _happenedPosition?: Position) {
    this.money += changing

    if (this.__testMode) this.money = 1e15

    // if (happenedPosition) {
    //   Game.callAnimation('gold_spin_small', happenedPosition.x, 22, 22, 1, 0)
    // }
  }

  public emitLife(changing: number) {
    this.life += changing
    if (this.life <= 0) {
      this.life = 0

      this.isPausing = true
    }
  }

  private leftClickHandler = (mousePos: Position) => {
    // 修建状态
    if (this.selectedTowerTypeToBuild) {
      const [mouseGPosX, mouseGPosY] = this.coordinateToGridIndex(mousePos)
      // 不在左侧区域
      if (mousePos.x > this.midSplitLineX) {
        return
      }
      // 区块内有怪物
      if (
        this.monsterCtl.monsters.some(mst => {
          const [mstGX, mstGY] = this.coordinateToGridIndex(mst.position)
          return mouseGPosX === mstGX && mstGY === mouseGPosY
        })
      ) {
        console.log('区块内有怪物')
        return
      }
      // 区块内已有塔
      if (
        this.towerCtl.towers.some(tow => {
          const [towGX, towGY] = this.coordinateToGridIndex(tow.position)
          return mouseGPosX === towGX && towGY === mouseGPosY
        })
      ) {
        console.log('区块内已有塔')
        return
      }
      // 此位置会阻断怪物的唯一path
      // 投入不渲染的临时怪物
      const tempMonsters: CircleBase[] = []
      this.grids.forEach((rowV, rowI) => {
        rowV.forEach((colV, colI) => {
          if (!(mouseGPosX === rowI && mouseGPosY === colI) && colV === 1 && !(rowI === this.DestinationGrid.x - 1 && colI === this.DestinationGrid.y - 1)) {
            const c = new CircleBase(new Position((colI + 0.5) * this.gridSize, (rowI + 0.5) * this.gridSize), 5, 1, 'rgba(12,12,12,1)')
            // c.grid = `${colI} ${rowI}`
            tempMonsters.push(c)
          }
        })
      })

      const fakeGrids = _.cloneDeep(this.grids)
      fakeGrids[mouseGPosX]![mouseGPosY]! = 0

      const tmp = [new Array(this.gridX + 2).fill(0)]
      const gww = tmp.concat(fakeGrids.map(row => [0, ...row, 0]).concat(tmp))
      const bindFx = Game.prototype.makeGraph.bind({ gridsWithWall: gww })

      if (
        tempMonsters.some(mst => {
          const fakeGraph = bindFx()
          const [wg0, wg1] = this.coordinateToGridIndex(mst.position)
          const path = Astar.astar.search(fakeGraph, fakeGraph.grid[wg0 + 1]![wg1 + 1]!, fakeGraph.grid[this.DestinationGrid.x]![this.DestinationGrid.y]!)
          return path.length === 0
        })
      ) {
        console.log('此位置会阻断怪物的唯一path')
        return
      }

      this.selectedTowerTypeToBuild.__re_render(0)

      if (this.money >= this.selectedTowerTypeToBuild.__init_price[0]!) {
        // 完成建造
        this.placeTower(
          mousePos,

          this.selectedTowerTypeToBuild.__ctor_name,

          this.imageCtl.getImage(this.selectedTowerTypeToBuild.__inner_img_u)!,

          this.imageCtl.getImage(this.selectedTowerTypeToBuild.__inner_b_img_u || ''),

          -this.selectedTowerTypeToBuild.__init_price[0]!
        )
      } else {
        console.log('金币不足')
        // to do
        // alert lacking of money
      }
      this.selectedTowerTypeToBuild = null // remove build status

      return
    }
    // 非修建状态
    if (mousePos.x > this.midSplitLineX) {
      const selectedT = this.towerForSelect.find(tfs => tfs.position.equal(mousePos, tfs.radius))
      // 选择建筑，进入修建状态
      if (selectedT) {
        this.selectedTowerTypeToBuild = selectedT
        Game.callHideStatusBlock()
        this.selectedTowerTypeToBuild.__re_render(2)
      }
    } else {
      const selectedT = this.towerCtl.towers.find(t => t.position.equal(mousePos, t.radius))
      // 升级
      if (selectedT) {
        // console.log(selectedT)
        this.emitMoney(-1 * selectedT.levelUp(this.money))
        this.ctxMouse.clearRect(0, 0, innerWidth, innerHeight)

        selectedT.renderRange(this.ctxMouse)
        selectedT.renderStatusBoard(0, this.midSplitLineX, 0, innerHeight, true, this.detailFunctionKeyDown)
      }
    }
  }

  private rightClickHandler = (() => {
    let lastRightClick = -1000

    return (mousePos: Position) => {
      if (performance.now() - lastRightClick < 300) {
        if (!this.selectedTowerTypeToBuild) {
          const selectedT = this.towerCtl.towers.find(t => t.position.equal(mousePos, t.radius * 0.75))
          if (selectedT) {
            this.removeTower(selectedT)
          }
        }
      } else {
        // 取消修建状态
        if (this.selectedTowerTypeToBuild) {
          this.selectedTowerTypeToBuild.__re_render(0)
          this.selectedTowerTypeToBuild = null
        }
      }
      lastRightClick = performance.now()
    }
  })()

  private mouseMoveHandler = _.throttle((e: MouseEvent) => {
    this.ctxMouse.clearRect(0, 0, innerWidth, innerHeight)

    const mousePos = new Position(e.offsetX, e.offsetY)

    // if (this.__testMode) console.log('mouse move : ' + mousePos)

    this.lastMouseMovePosition = mousePos

    if (this.selectedTowerTypeToBuild) {
      TowerBase.prototype.renderRange.call({ position: mousePos, Rng: this.selectedTowerTypeToBuild.__rng_lv0 }, this.ctxMouse)
      return
    }

    // 右侧菜单区域
    if (e.offsetX > this.midSplitLineX) {
      const selectedT = this.towerForSelect.find(tfs => tfs.position.equal(mousePos, tfs.radius))
      // 鼠标进入建筑
      if (selectedT) {
        // this.onMouseTower = selectedT
        let virtualTow = new (eval(selectedT.__ctor_name))()
        const descriptionChunked = _.cloneDeep(virtualTow.descriptionChunked)
        virtualTow.destroy()
        virtualTow = null
        TowerBase.prototype.renderStatusBoard.call(
          {
            position: mousePos,
            informationSeq: [[selectedT.__dn, '']],
            descriptionChunked: descriptionChunked,
            exploitsSeq: [['建造快捷键', `[${selectedT.__od}]`]],
            radius: selectedT.radius
          },
          0,
          this.midSplitLineX,
          0,
          innerHeight,
          false,
          false
        )
      } else {
        Game.callHideStatusBlock()
        // this.onMouseTower = null
      }
    }
    // 左侧方格区域
    else {
      // 给可操纵单位注入新位置
      this.towerCtl.independentTowers.forEach((t, _idx) => {
        ;(t as _Jet).destinationPosition = mousePos
        // if (idx === 0) t.destinationPosition = mousePos
        // else t.destinationPosition = this.towerCtl.independentTowers[idx - 1].position
      })

      const selectedT = this.towerCtl.towers.find(t => t.position.equal(mousePos, t.radius)) || this.towerCtl.independentTowers.find(t => t.position.equal(mousePos, t.radius))
      const selectedM = this.monsterCtl.monsters.find(m => m.position.equal(mousePos, m.radius))
      if (selectedT) {
        // @todo add delay
        // setTimeout(() => {

        // })
        this.statusBoardOnTower = selectedT

        selectedT.renderRange(this.ctxMouse)
        selectedT.renderStatusBoard(0, this.midSplitLineX, 0, innerHeight, true, this.detailFunctionKeyDown)
      } else if (selectedM) {
        selectedM.renderStatusBoard(0, this.midSplitLineX, 0, innerHeight, false, false)
      } else {
        Game.callHideStatusBlock()
        this.statusBoardOnTower = null
      }
    }
  }, 34)

  private keyDownHandler = (e: KeyboardEvent) => {
    if (Tools.isNumberSafe(e.key)) {
      this.selectedTowerTypeToBuild = this.towerForSelect[+e.key - 1]
      this.leftClickHandler(this.lastMouseMovePosition)
      this.selectedTowerTypeToBuild = null
      return
    }
    console.log('keyDownHandler: ' + e.key)
    switch (e.key) {
      case 'c':
        this.leftClickHandler(this.lastMouseMovePosition)
        break
      case ' ':
        if (this.startAndPauseButton) this.startAndPauseButton.onMouseClick()
        break
      // case 'ArrowUp':
      //   break
      // case 'ArrowDown':
      //   break
      // case 'a':
      //   break
      // case 'd':
      //   break
      case 'v':
        if (this.__testMode) {
          this.__debugFlipDummyMode()
          this.placeMonster(
            100,
            this.OriginPosition.copy()
              .move(new PolarVector(this.gridSize, 0))
              .dithering(this.gridSize, this.gridSize / 2),
            'Dummy'
          )
        }
        break
      case 'b':
        if (this.__testMode) {
          this.__debugFlipDummyMode()
          for (let i = 0; i < 100; i++) {
            this.placeMonster(
              100,
              this.OriginPosition.copy()
                .move(new PolarVector(this.gridSize, 0))
                .dithering(this.gridSize, this.gridSize / 2),
              'Dummy'
            )
          }
        }
        break
      case 'q':
        CarrierTower.WeaponMode = CarrierTower.WeaponMode === 1 ? 2 : 1
        break
      case 'F1':
        CarrierTower.F1Mode = !CarrierTower.F1Mode
        e.preventDefault()
        break
      case 'Control':
        this.detailFunctionKeyDown = !this.detailFunctionKeyDown
        if (this.statusBoardOnTower) {
          this.statusBoardOnTower.renderStatusBoard(0, this.midSplitLineX, 0, innerHeight, true, this.detailFunctionKeyDown)
        }
        break
      default:
        break
    }
  }

  /**
   * @deprecated
   */
  // private keyUpHandler = (e: KeyboardEvent) => {
  //   switch (e.key) {
  //     case 'Control':
  //       this.detailFunctionKeyDown = false
  //       if (this.statusBoardOnTower) {
  //         this.statusBoardOnTower.renderStatusBoard(0, this.midSplitLineX, 0, innerHeight, true, this.detailFunctionKeyDown)
  //       }
  //       break
  //     default:
  //       break
  //   }
  // }

  private initButtons() {
    const buttonTopA = this.gridSize * 7 + 'px'
    const buttonTopB = this.gridSize * 9 + 'px'
    const buttonTopC = this.gridSize * 11 + 'px'

    this.startAndPauseButton = new ButtonOnDom({
      id: 'start_pause_btn',
      className: 'sp_btn',
      type: 'button',
      textContent: '开始',
      title: '快捷键 [空格]',
      style: {
        zIndex: '8',
        top: buttonTopA,
        left: this.leftAreaWidth + 30 + 'px'
      },
      onclick: () => {
        this.isPausing = !this.isPausing
        if (this.startAndPauseButton) this.startAndPauseButton.ele.textContent = this.isPausing ? '开始' : '暂停'
      }
    })

    let iterator = this.loopSpeeds[Symbol.iterator]()

    this.speedControlButton = new ButtonOnDom({
      id: 'speed_ctrl_btn',
      className: 'sc_btn',
      type: 'button',
      textContent: '1 倍速',

      style: {
        zIndex: '8',
        top: buttonTopA,
        left: this.leftAreaWidth + 150 + 'px'
      },
      onclick: () => {
        let next = iterator.next()
        if (next.done) {
          iterator = this.loopSpeeds[Symbol.iterator]()
          next = iterator.next()
        }
        this.updateSpeedRatio = next.value
        if (this.speedControlButton) this.speedControlButton.ele.textContent = `${this.updateSpeedRatio} 倍速`
      }
    })

    new ButtonOnDom({
      className: 'tm_btn',
      type: 'button',
      textContent: '以' + (this.__testMode ? '普通' : '测试') + '模式重启',
      style: {
        zIndex: '8',
        top: buttonTopA,
        right: 30 + 'px'
      },
      onclick: () => {
        localStorage.setItem('debug_mode', this.__testMode ? '0' : '1')
        window.location.reload()
      }
    })

    // ----------------------------------------------------- test only -----------------------------------------------------
    if (this.__testMode) {
      ///
      const ipt = Tools.Dom.__installOptionOnNode(document.createElement('input'), {
        type: 'range',
        min: '1',
        max: '30',
        step: '1',
        value: this.stepDivide,
        onchange: () => {
          this.stepDivide = +ipt.value
          spn.refresh()
        },
        style: {
          width: '50px'
        }
      }) as WithRefresh<HTMLInputElement>

      const spn = Tools.Dom.__installOptionOnNode(document.createElement('span'), {
        style: {
          marginLeft: '10px'
        },
        refresh: () => {
          spn.textContent = '升级步长 ' + this.stepDivide
        }
      }) as WithRefresh<HTMLSpanElement>
      spn.refresh()
      ///
      const spn2 = Tools.Dom.__installOptionOnNode(document.createElement('span'), {
        style: {
          marginLeft: '30px'
        },
        refresh: () => {
          spn2.textContent = '步数 ' + Tools.formatterUs.format(this.count)
        }
      }) as WithRefresh<HTMLSpanElement>
      spn2.refresh()
      setInterval(() => spn2.refresh(), 50)

      Tools.Dom.generateRow(
        document.body,
        null,
        {
          style: {
            position: 'fixed',
            top: buttonTopB,
            left: this.leftAreaWidth + 30 + 'px',
            lineHeight: '20px',
            zIndex: '8'
          }
        },
        [
          ipt,
          spn,
          spn2,
          Tools.Dom.__installOptionOnNode(document.createElement('button'), {
            type: 'button',
            textContent: '+100',
            style: {
              marginLeft: '10px'
            },
            onclick: () => {
              this.count += 100
            }
          }),
          Tools.Dom.__installOptionOnNode(document.createElement('button'), {
            type: 'button',
            textContent: '+1万',
            onclick: () => {
              this.count += 1e4
            }
          }),
          Tools.Dom.__installOptionOnNode(document.createElement('button'), {
            type: 'button',
            textContent: '+100万',
            onclick: () => {
              this.count += 1e6
            }
          }),
          Tools.Dom.__installOptionOnNode(document.createElement('button'), {
            type: 'button',
            textContent: '+1亿',
            onclick: () => {
              this.count += 1e8
            }
          })
        ]
      )
      // second row
      Tools.Dom.generateRow(
        document.body,
        null,
        {
          style: {
            position: 'fixed',
            top: buttonTopC,
            left: this.leftAreaWidth + 30 + 'px',
            lineHeight: '20px',
            zIndex: '8'
          }
        },
        [
          Tools.Dom.__installOptionOnNode(document.createElement('span'), {
            style: {
              marginRight: '10px'
            },
            textContent: '切换显示重绘边框'
          }),
          Tools.Dom.__installOptionOnNode(document.createElement('input'), {
            type: 'checkbox',
            value: 'on',

            onchange: (e: Event) => {
              __debug_show_refresh_rect = (e.target as any).checked
            }
          })
        ]
      )
    }
    // ----------------------------------------------------- end test -----------------------------------------------------
  }

  public init() {
    this.gridSize = Math.floor(innerHeight / this.gridY)

    this.OriginPosition = new Position((this.OriginGrid.x + 0.5) * this.gridSize, (this.OriginGrid.y + 0.5) * this.gridSize)

    this.DestinationPosition = new Position((this.DestinationGrid.y - 0.5) * this.gridSize, (this.DestinationGrid.x - 0.5) * this.gridSize)

    Game.callOriginPosition = () => this.OriginPosition.copy()

    Game.callDestinationPosition = () => this.DestinationPosition.copy()

    Game.callGridSideSize = () => this.gridSize

    this.leftAreaHeight = this.gridSize * this.gridY
    this.leftAreaWidth = (this.leftAreaHeight * this.gridX) / this.gridY

    // const areaAspectRatio = this.leftAreaWidth / this.leftAreaHeight

    Game.callBoundaryPosition = () => new Position(this.leftAreaWidth, this.leftAreaHeight)

    this.midSplitLineX = this.leftAreaWidth + 2
    this.rightAreaWidth = innerWidth - this.midSplitLineX

    for (const _i of new Array(this.gridY)) {
      this.grids.push(new Array(this.gridX).fill(1))
    }

    // 离屏 canvas, 高速预渲染
    // this.contextCtl.createCanvasInstance('off_screen_render', null, innerHeight, Math.ceil(innerHeight * areaAspectRatio), true)
    this.contextCtl.createCanvasInstance('off_screen_render', undefined, undefined, undefined, true)
    this.ctxOffScreen = this.contextCtl.getContext('off_screen_render') as WrappedCanvasRenderingContext2D

    // [60 FPS] 常更新主图层
    this.contextCtl.createCanvasInstance('main', { zIndex: '2' }, undefined, undefined, false, null, 'off_screen_render')
    this.ctxMain = this.contextCtl.getContext('main') as WrappedCanvasRenderingContextOnScreen2D

    // [stasis] 用来绘制塔的图层，不经常更新
    this.contextCtl.createCanvasInstance('tower', { zIndex: '0' })
    this.ctxTower = this.contextCtl.getContext('tower') as WrappedCanvasRenderingContextOnScreen2D

    // [on mouse] 用来绘制鼠标事件带来的悬浮信息等的图层，随鼠标移动刷新
    this.contextCtl.createCanvasInstance('mouse', { zIndex: '4' })
    this.ctxMouse = this.contextCtl.getContext('mouse') as WrappedCanvasRenderingContextOnScreen2D

    // this.contextCtl.createCanvasInstance('path_dbg', { zIndex: '-3' })

    // [stasis | partial: 60 FPS] 骨架图层, 单次渲染, 局部如金币等信息长更新
    this.contextCtl.createCanvasInstance('bg', { zIndex: '-3' })
    this.ctxBg = this.contextCtl.getContext('bg') as WrappedCanvasRenderingContextOnScreen2D

    this.initButtons()

    this.evtCtl.bindEvent(
      [
        {
          evtName: 'onkeydown',
          cb: this.keyDownHandler
        }
        // {
        //   evtName: 'onkeyup',
        //   cb: this.keyUpHandler
        // }
      ],
      document
    )

    const reactDivEle = Tools.Dom.generateDiv(document.body, {
      id: 'react',
      style: {
        margin: '0',
        position: 'fixed',
        top: '0',
        left: '0',
        border: '0',
        zIndex: '5',
        width: '100%',
        height: '100%',
        opacity: '0'
      }
    })

    this.evtCtl.bindEvent(
      [
        {
          evtName: 'onmousedown',
          cb: e => {
            const mousePos = new Position(e.offsetX, e.offsetY)
            // if (this.__testMode) console.log('mouse down : ' + mousePos)
            switch (e.button) {
              // left click
              case 0:
                this.leftClickHandler(mousePos)
                break
              // right click
              case 2:
                this.rightClickHandler(mousePos)
                break
              default:
                break
            }
          }
        },
        {
          evtName: 'onmousemove',
          cb: this.mouseMoveHandler
        }
      ],
      reactDivEle
    )

    this.renderOnce()

    Game.callAnimation = (name, pos, w, h, speed, delay, wait, _cb) => {
      this.imageCtl.onPlaySprites.push(new HostedAnimationSprite(this.imageCtl.getSprite(name)!.getClone(speed), pos, w, h, delay, false, wait))
    }

    return this
  }

  private renderOnce() {
    this.ctxBg.font = '12px Game'

    this.ctxBg.strokeStyle = 'rgba(45,45,45,.5)'
    this.ctxBg.lineWidth = 1
    this.ctxBg.strokeRect(1, 1, this.leftAreaWidth, this.leftAreaHeight)

    this.ctxBg.strokeStyle = 'rgba(188,188,188,.1)'
    for (let i = this.gridSize; i < this.gridSize * this.gridY; i += this.gridSize) {
      this.ctxBg.moveTo(1, i)
      this.ctxBg.lineTo(this.leftAreaWidth, i)
    }
    for (let i = this.gridSize; i < this.gridSize * this.gridX; i += this.gridSize) {
      this.ctxBg.moveTo(i, 1)
      this.ctxBg.lineTo(i, this.leftAreaHeight)
    }
    this.ctxBg.stroke()

    this.ctxBg.fillStyle = 'rgba(141,241,123,.6)'
    this.ctxBg.fillRect(0, (this.gridY / 2 - 1) * this.gridSize, this.gridSize, this.gridSize)

    this.ctxBg.fillStyle = 'rgba(241,141,123,.8)'
    this.ctxBg.fillRect((this.gridX - 1) * this.gridSize, (this.gridY / 2) * this.gridSize, this.gridSize, this.gridSize)

    if (this.__testMode) {
      this.contextCtl.refreshText('[ Test Mode ]', null, new Position(10, 15), new Position(8, 15), 120, 26, 'rgba(230,204,55,1)', true, '10px SourceCodePro')
    }

    this.contextCtl.refreshText(
      '鼠标点击选取建造，连点两次鼠标右键出售已建造的塔',
      null,
      new Position(this.leftAreaWidth + 30, 30),
      new Position(this.leftAreaWidth + 28, 10),
      this.rightAreaWidth,
      26,
      'rgba(24,24,24,1)',
      true,
      '14px Game'
    )
    this.contextCtl.refreshText(
      '出现详情时按[Ctrl]切换详细信息和说明',
      null,
      new Position(this.leftAreaWidth + 30, 70),
      new Position(this.leftAreaWidth + 28, 50),
      this.rightAreaWidth,
      26,
      'rgba(24,24,24,1)',
      true,
      '14px Game'
    )

    const tsAreaRectTL = new Position(this.leftAreaWidth + 30, 90)
    const tsMargin = this.gridSize / 2 - 2
    const tsItemRadius = this.gridSize / 2 + 5

    const oneTsWidth = tsMargin + 2 * tsItemRadius
    const chunkSize = Math.floor((this.rightAreaWidth - tsItemRadius - 30) / oneTsWidth)
    const chunkedTowerCtors = _.chunk(TowerManager.towerCtors, chunkSize)
    const tsMarginBottom = this.gridSize / 2 + 6

    // console.log(`tsMargin=${tsMargin}, oneTsWidth=${oneTsWidth}, tsItemRadius=${tsItemRadius}, chunkSize=${chunkSize}, tsMarginBottom=${tsMarginBottom}`)

    chunkedTowerCtors.forEach((ctorRow, rowIdx) => {
      rowIdx > 0 ? tsAreaRectTL.move(new PolarVector(tsMarginBottom + tsItemRadius * 2, 270)) : void 0

      ctorRow.forEach((_t, idx) => {
        // const realIdx = rowIdx * chunkSize + idx

        const ax = tsAreaRectTL.x + oneTsWidth * idx + tsItemRadius
        const ay = tsAreaRectTL.y + tsItemRadius

        if (!_t.n.includes('$spr::')) {
          const temp = new ItemBase(new Position(ax, ay), tsItemRadius, 0, 'rgba(255,67,56,1)', this.imageCtl.getImage(_t.n)!) as IocItem
          Game.IOC(temp, _t, this.ctxBg as CanvasRenderingContext2D, this.renderStandardText.bind(this), ax, ay, tsItemRadius, this.money)
          this.towerForSelect.push(temp)
          this.towerForSelect.sort(Tools.compareProperties('__od'))
        } else {
          const spr_d = this.imageCtl.getSprite(_t.n.substr(6))!.getClone(6)

          const temp = new ItemBase(new Position(ax, ay), tsItemRadius, 0, 'rgba(255,67,56,1)', spr_d) as IocItem
          Game.IOC(temp, _t, this.ctxBg as CanvasRenderingContext2D, this.renderStandardText.bind(this), ax, ay, tsItemRadius, this.money)
          this.towerForSelect.push(temp)
          this.towerForSelect.sort(Tools.compareProperties('__od'))
        }
      })
    })

    const ax0 = innerWidth - 236
    const ay0 = innerHeight - 10
    this.contextCtl.refreshText('金币', null, new Position(ax0, ay0), new Position(ax0 - 4, ay0 - 20), 160, 26, 'rgba(54,54,54,1)', true, '14px Game')
    this.imageCtl
      .getSprite('gold_spin')!
      .getClone(2)
      .renderLoop(this.ctxBg as CanvasRenderingContext2D, new Position(innerWidth - 190, innerHeight - 25), 18, 18)

    const ax = innerWidth - 293
    const ay = innerHeight - 70
    this.contextCtl.refreshText(GemBase.gemName + '点数', null, new Position(ax, ay), new Position(ax - 4, ay - 20), 160, 26, 'rgba(54,54,54,1)', true, '14px Game')
    this.imageCtl
      .getSprite('sparkle')!
      .getClone(10)
      .renderLoop(this.ctxBg as CanvasRenderingContext2D, new Position(innerWidth - 190, innerHeight - 85), 18, 18)

    const ax2 = innerWidth - 250
    const ay2 = innerHeight - 40
    this.contextCtl.refreshText('生命值', null, new Position(ax2, ay2), new Position(ax2 - 4, ay2 - 20), 160, 26, 'rgba(54,54,54,1)', true, '14px Game')
    this.ctxBg.drawImage(this.imageCtl.getImage('heart_px')!, innerWidth - 190, innerHeight - 54, 18, 18)
  }

  private performanceWrapper(
    fn: () => void,
    metricsName: string,
    xAxis: number,
    yAxis: number,
    bufferLength: number = 120,
    height: number = 50,
    maxWidth: number = 120,
    maxV: number = 50,
    warningV: number = 12,
    dangerV: number = 16.667
  ) {
    const timeBuffer = new Float64Array(bufferLength).fill(-1)

    return () => {
      const runStart = performance.now()

      fn()

      const metrics = performance.now() - runStart

      this.renderStandardText(`[ ${metricsName} ${Tools.roundWithFixed(metrics, 3)} ms ]`, xAxis, yAxis, maxWidth)

      const actualLength = Tools.typedArrayPush(timeBuffer, metrics)
      if (actualLength === timeBuffer.length) {
        this.renderStandardText(`[ ${metricsName} avg ${Tools.roundWithFixed(timeBuffer.reduce((c, p) => c + p, 0) / actualLength, 3)} ms ]`, xAxis, yAxis + 20, maxWidth)
      } else {
        this.renderStandardText(`[ ${metricsName} avg - ms ]`, xAxis, yAxis + 20, maxWidth)
      }
      Tools.renderStatistic(metricsName, this.ctxBg as CanvasRenderingContext2D, timeBuffer, new Position(xAxis, yAxis + height), timeBuffer.length, height + 2, maxV, warningV, dangerV)
    }
  }

  public run() {
    // let flag = false
    // for (let i = 0; i < this.updateSpeedRatio; i++) {
    //   flag = flag || this.update()
    // }

    // this.render(flag)

    // requestAnimationFrame(
    //   this.__testMode
    //     ? this.performanceWrapper(() => {
    //         this.run()
    //       })
    //     : () => {
    //         this.run()
    //       }
    // )

    const update = this.__testMode ? this.performanceWrapper(() => this.update(), 'Update', 6, 120, 120, 50, 120, 16.667, 5, 12) : () => this.update()

    const draw = this.__testMode ? this.performanceWrapper(() => this.render(), 'Render', 6, 220, 120, 50, 120, 40, 10, 16.67) : () => this.render()

    MainLoop.setSimulationTimestep(1000 / this.Tick / this.updateSpeedRatio)
      .setUpdate(update)
      .setDraw(draw)
      .start()
  }

  /**
   * @returns Tower need update
   */
  public update() {
    this.updateTick++

    // ------------------ debug ---------------------
    if (!this.isPausing && !Reflect.get(window, '__d_stop_ms') && !this.__dummy_test_mode) {
      // if (this.updateTick === 101) {
      //   this.placeMonster(
      //     40000,
      //     this.OriginPosition.copy(),
      //     'Devil'
      //   )
      // }
      if (this.updateTick % (this.__testMode ? 10 : 100) === 0) {
        this.placeMonster(Math.floor(++this.count / this.stepDivide), this.OriginPosition.copy(), _.shuffle(['Swordman', 'Axeman', 'LionMan'])[0]!)
      }
      if (this.updateTick % (this.__testMode ? 501 : 1201) === 0) {
        this.placeMonster(Math.floor(++this.count / this.stepDivide + (this.__testMode ? 100 : 0)), this.OriginPosition.copy(), _.shuffle(['Devil', 'HighPriest'])[0]!)
      }
      // if (this.updateTick > 1000) Reflect.set(window, '__d_stop_ms', true)
    }
    // ------------------ end debug ---------------------

    if (!this.isPausing) {
      this.towerCtl.run(this.monsterCtl.monsters)
      this.bulletsCtl.run(this.monsterCtl.monsters)
      this.monsterCtl.run(this.getPathToEnd.bind(this), this.emitLife.bind(this), this.towerCtl.towers, this.monsterCtl.monsters)
    }

    this.bulletsCtl.scanSwipe()
    this.monsterCtl.scanSwipe(this.emitMoney.bind(this))
    return this.towerCtl.scanSwipe(this.emitMoney.bind(this))
  }

  public render(towerNeedRender = true) {
    if (this.renderTick === 0) {
      this.renderInformation()
      this.renderMoney()
      this.renderGemPoint()
      this.renderLife()
    }

    this.renderTick++

    if (this.__testMode) {
      this.renderStandardText(`[ R Tick ${this.renderTick} ]`, 6, 20, 120)
      this.renderStandardText(`[ U Tick ${this.updateTick} ]`, 6, 40, 120)

      this.renderStandardText(`[ OBJ ${this.objectCount} ]`, 6, 80, 120)

      this.renderStandardText(`[ DOM ${document.getElementsByTagName('*').length} ]`, 6, 100, 120)
    }

    if (this.renderTick % 3 === 0) {
      this.renderInformation()
      this.renderMoney()
    } else if (this.renderTick % 5 === 0) {
      this.renderGemPoint()
    } else if (this.renderTick % 61 === 0) {
      this.renderLife()
      this.towerForSelect.forEach(itm => itm.__re_render_text(this.money))
    }

    const offScreenCtx = this.ctxOffScreen

    if (this.useClassicRenderStyle) {
      offScreenCtx.clearRect(0, 0, offScreenCtx.dom.width, offScreenCtx.dom.height)
    }

    this.monsterCtl.render(offScreenCtx, this.imageCtl)
    this.bulletsCtl.render(offScreenCtx)
    this.imageCtl.play(offScreenCtx)
    this.towerCtl.rapidRender(offScreenCtx, this.monsterCtl.monsters)

    if (towerNeedRender) {
      this.ctxTower.clearRect(0, 0, innerWidth, innerHeight)
      this.towerCtl.render(this.ctxTower as WrappedCanvasRenderingContext2D)
    }

    if (this.ctxMain._off_screen_paint) this.ctxMain._off_screen_paint()
    else throw new Error('this.ctxMain._off_screen_paint is not a function')

    // -------------------------------------------------- ftp meter --------------------------------------------------
    if (this.__testMode) {
      // const now = performance.now()
      // const actualLength = Tools.typedArrayPush(this.renderTimeStamps, now)

      // if (actualLength < 60) {
      //   this.averageFrameInterval = (now - this.renderTimeStamps[0]!) / actualLength
      // } else {
      //   this.averageFrameInterval = (now - this.renderTimeStamps[actualLength - 60]!) / 60
      // }

      const fps = MainLoop.getFPS()

      this.renderStandardText(`[ Fps ${fps.toFixed(1)} ]`, 6, 60, 120, fps < 60 ? '#F56C6C' : 'rgb(2,2,2)')
    }
    // -------------------------------------------------- end ftp meter --------------------------------------------------
  }

  private renderMoney() {
    const ax = innerWidth - 160
    const ay = innerHeight - 10
    this.contextCtl.refreshText(Tools.formatterUs.format(this.money), null, new Position(ax, ay), new Position(ax - 4, ay - 20), 160, 26, 'rgb(24,24,24)', true, '14px Game')
  }

  private renderLife() {
    const ax = innerWidth - 160
    const ay = innerHeight - 40
    this.contextCtl.refreshText(this.life + '', null, new Position(ax, ay), new Position(ax - 4, ay - 20), 160, 26, 'rgb(24,24,24)', true, '14px Game')
  }

  private renderGemPoint() {
    const ax = innerWidth - 160
    const ay = innerHeight - 70
    this.contextCtl.refreshText(Tools.formatterUs.format(this.updateGemPoint), null, new Position(ax, ay), new Position(ax - 4, ay - 20), 160, 26, 'rgb(24,24,24)', true, '14px Game')
  }

  private renderInformation() {
    const DPS = this.bornStamp ? Tools.chineseFormatter((this.towerCtl.totalDamage / (performance.now() - this.bornStamp)) * 1000, 3, ' ') : 0
    const DMG = Tools.chineseFormatter(this.towerCtl.totalDamage, 2, ' ')
    const TK = Tools.chineseFormatter(this.towerCtl.totalKill, 2, ' ')

    const ax = innerWidth - 190
    const ay1 = innerHeight - 120
    const ay2 = ay1 - 30
    const ay3 = ay2 - 30
    // const ay4 = ay3 - 30

    // this.contextCtl.refreshText(`CH: ${Tools.chineseFormatter(this.monsterCtl.totalCurrentHealth, 2, ' ')}`, null, new Position(ax, ay1), new Position(ax - 4, ay1 - 20), 190, 26, 'rgb(24,24,24)', true, '14px Game')
    this.contextCtl.refreshText(`DPS    ${DPS}`, null, new Position(ax, ay1), new Position(ax - 4, ay1 - 20), 190, 26, 'rgb(24,24,24)', true, '14px Game')

    this.contextCtl.refreshText(`总伤害    ${DMG}`, null, new Position(ax, ay2), new Position(ax - 4, ay2 - 20), 190, 26, 'rgb(24,24,24)', true, '14px Game')

    this.contextCtl.refreshText(`总击杀    ${TK}`, null, new Position(ax, ay3), new Position(ax - 4, ay3 - 20), 190, 26, 'rgb(24,24,24)', true, '14px Game')
    // this.contextCtl.refreshText(`CH: ${Tools.chineseFormatter(this.monsterCtl.totalCurrentHealth, 2, ' ')}`, null, new Position(ax, ay4), new Position(ax - 4, ay4 - 20), 190, 26, 'rgb(24,24,24)', true, '14px Game')
  }

  private renderStandardText(text: string, bx: number, by: number, maxWidth: number, color?: string, fSize?: number) {
    color = color || 'rgb(2,2,2)'
    fSize = fSize || 10

    this.contextCtl.refreshText(text, null, new Position(bx + 4, by + fSize + 5), new Position(bx, by), maxWidth, 12 + fSize, color, true, `${fSize}px SourceCodePro`)
  }
}

async function run() {
  const text = document.getElementById('loading_text')!
  const mask = document.getElementById('loading_mask')!

  try {
    console.time('load font')

    text.textContent = '加载字体中'
    const resp = await fetch('game_font_1.ttf')
    const fontBuffer = await resp.arrayBuffer()

    //@ts-ignore
    const font = new FontFace('Game', fontBuffer)
    const resultFont = await font.load()

    //@ts-ignore
    document.fonts.add(resultFont)

    console.timeEnd('load font')
  } catch (error) {
    console.error(error)
  }

  try {
    console.time('load images')

    const imageCtrl = new ImageManger()

    text.textContent = '加载贴图'

    await imageCtrl.loadImages()
    text.textContent = '加载动画'
    await imageCtrl.loadSpriteSheets()

    console.timeEnd('load images')

    document.body.removeChild(mask)

    const gridSizeBase = 4

    const game = new Game(imageCtrl, gridSizeBase * 8, gridSizeBase * 4)
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
