/**
 * 游戏配置常量
 * 集中管理游戏中的魔法数字
 */

const GAME_CONFIG = {
  // ============= 游戏平衡 =============
  /** 初始金币 */
  INITIAL_MONEY: 500,
  /** 测试模式初始金币 */
  TEST_MODE_MONEY: 1e15,
  /** 初始生命值 */
  INITIAL_LIFE: 20,
  /** 测试模式初始生命值 */
  TEST_MODE_LIFE: 8e4,

  // ============= 渲染配置 =============
  /** 目标帧率 */
  TARGET_FPS: 60,
  /** 渲染更新周期（每N帧更新一次某些元素） */
  RENDER_UPDATE_TICK: 3,
  /** 宝石更新周期 */
  GEM_UPDATE_TICK: 5,
  /** 生命值更新周期 */
  LIFE_UPDATE_TICK: 61,

  // ============= 定时器配置 =============
  /** DOT 清理间隔（毫秒） */
  DOT_CLEANUP_INTERVAL: 60000,
  /** UI 刷新间隔（毫秒） */
  UI_REFRESH_INTERVAL: 50,

  // ============= 价格配置 =============
  /** 塔价格增长率 */
  TOWER_PRICE_GROWTH_RATE: 1.1,
  /** 最大塔等级 */
  MAX_TOWER_LEVEL: 180,

  // ============= 鼠标交互 =============
  /** 鼠标移动节流间隔（毫秒） */
  MOUSE_MOVE_THROTTLE: 34,
  /** 双击检测间隔（毫秒） */
  DOUBLE_CLICK_INTERVAL: 300,
  /** 长按触发时间（毫秒） */
  LONG_PRESS_DURATION: 300,
  /** 长按重复间隔（毫秒） */
  LONG_PRESS_INTERVAL: 100,

  // ============= 动画配置 =============
  /** 升级动画速度 */
  LEVEL_UP_ANIMATION_SPEED: 3,
  /** 爆炸动画速度 */
  EXPLOSION_ANIMATION_SPEED: 0.5,
} as const

// ============= 颜色配置 =============
const COLORS = {
  /** 危险/暴击红色 */
  CRITICAL_RED: '#F51818',
  /** 成功绿色 */
  SUCCESS_GREEN: '#94C27E',
  /** 信息灰色 */
  INFO_GRAY: '#909399',
  /** 文本深色 */
  TEXT_DARK: '#606266',
  /** 警告橙色 */
  WARNING_ORANGE: '#E6A23C',
  /** 主题蓝色 */
  PRIMARY_BLUE: '#409EFF',

  // 塔边框颜色
  TOWER_ARCHER: 'rgba(26,143,12,.5)',
  TOWER_CANNON: 'rgba(206,43,12,.7)',
  TOWER_FROST: 'rgba(26,143,212,.5)',
  TOWER_POISON: 'rgba(106,143,12,.5)',
  TOWER_TESLA: 'rgba(226,143,12,.5)',
  TOWER_MAGIC: 'rgba(126,43,112,.7)',
  TOWER_LASER: 'rgba(226,43,112,.7)',
  TOWER_CARRIER: 'rgba(26,43,212,.5)',
  TOWER_BLADE: 'rgba(26,13,112,.3)',
} as const

// ============= 塔升级描述 =============
const TOWER_DESCRIPTIONS = {
  ARCHER: {
    RANK_1: '\n+ [老兵] 射程增加 160',
    RANK_2: '\n+ [百战] 射程增加 200\n+ 攻速翻倍\n+ 获得破甲能力 15%',
    RANK_3: '\n+ [箭神] 获得燃烧效果\n+ 射出火焰弓箭',
  },
  CANNON: {
    RANK_1: '\n+ [老兵] 范围提升\n+ 使敌人燃烧',
    RANK_2: '\n+ [百战] 发射子母弹\n+ 燃烧效果提升',
    RANK_3: '\n+ [传奇] 子母弹分裂为更多碎片',
  },
} as const

// ============= 性能配置 =============
const PERFORMANCE_CONFIG = {
  /** 脏矩形最大数量（超过则全屏重绘） */
  MAX_DIRTY_RECTS: 50,
  /** 路径缓存最大条目数 */
  MAX_PATH_CACHE_ENTRIES: 1000,
  /** 对象池初始大小 */
  OBJECT_POOL_INITIAL_SIZE: 100,
} as const

// ============= 游戏时序配置 =============
const GAME_TIMING = {
  /** 鼠标移动节流间隔（毫秒） */
  MOUSE_THROTTLE_MS: 34,
  /** 双击检测间隔（毫秒） */
  DOUBLE_CLICK_MS: 300,
  /** 游戏每秒更新次数 */
  TICK_RATE: 60,
  /** 测试模式怪物生成间隔（tick） */
  TEST_SPAWN_INTERVAL: 10,
  /** 普通模式怪物生成间隔（tick） */
  NORMAL_SPAWN_INTERVAL: 100,
  /** 测试模式 Boss 生成间隔（tick） */
  BOSS_SPAWN_INTERVAL_TEST: 501,
  /** 普通模式 Boss 生成间隔（tick） */
  BOSS_SPAWN_INTERVAL_NORMAL: 1201,
} as const

// ============= 渲染间隔配置 =============
const RENDER_INTERVALS = {
  /** 金币渲染更新间隔（每N帧） */
  MONEY: 3,
  /** 宝石点数渲染更新间隔（每N帧） */
  GEM_POINT: 5,
  /** 生命值渲染更新间隔（每N帧） */
  LIFE: 61,
} as const

// ============= UI 布局配置 =============
const UI_LAYOUT = {
  /** 按钮行A顶部偏移乘数（gridSize * N） */
  BUTTON_TOP_MULTIPLIER_A: 7,
  /** 按钮行B顶部偏移乘数 */
  BUTTON_TOP_MULTIPLIER_B: 9,
  /** 按钮行C顶部偏移乘数 */
  BUTTON_TOP_MULTIPLIER_C: 11,
  /** 塔选择器左边距 */
  TOWER_SELECTOR_MARGIN: 30,
  /** 塔选择器顶部偏移 */
  TOWER_SELECTOR_TOP: 90,
  /** 塔选择器图标半径偏移 */
  TOWER_ICON_RADIUS_OFFSET: 5,
  /** 塔选择器图标间距 */
  TOWER_ICON_MARGIN: -2,
} as const

// ============= 网格配置 =============
const GRID_CONFIG = {
  /** 默认网格列数 */
  DEFAULT_COLUMNS: 36,
  /** 默认网格行数 */
  DEFAULT_ROWS: 24,
  /** 网格基础大小因子 */
  BASE_SIZE: 4,
  /** 网格纵横比乘数 */
  ASPECT_MULTIPLIER: 4,
} as const

// ============= Canvas 图层 Z-Index =============
const CANVAS_Z_INDEX = {
  /** 背景图层 */
  BACKGROUND: '-3',
  /** 塔图层 */
  TOWER: '0',
  /** 主渲染图层 */
  MAIN: '2',
  /** 鼠标交互图层 */
  MOUSE: '4',
  /** React 交互层 */
  REACT: '5',
  /** 按钮层 */
  BUTTON: '8',
} as const

// ============= 塔/怪物基础配置 =============
const ENTITY_CONFIG = {
  /** 塔售价比例 */
  TOWER_SELL_RATIO: 0.7,
  /** 设计稿网格尺寸（用于射程计算） */
  DESIGN_GRID_SIZE: 39,
  /** 升级获得的宝石点数 */
  LEVEL_UP_POINT_EARNINGS: 10,
  /** 击杀普通怪物获得的点数 */
  KILL_NORMAL_POINT_EARNINGS: 1,
  /** 击杀BOSS获得的点数 */
  KILL_BOSS_POINT_EARNINGS: 50,
  /** 伤害转点数比例（每1000伤害=1点） */
  DAMAGE_TO_POINT_DIVISOR: 1000,
  /** DPS 显示精度 */
  DPS_PRECISION: 3,
  /** 护甲抗性计算精度 */
  ARMOR_PRECISION: 3,
} as const

// ============= 渲染统计配置 =============
const RENDER_STATS_CONFIG = {
  /** 统计渲染最大值 (ms) */
  MAX_VALUE: 50,
  /** 警告阈值 (ms) */
  WARNING_THRESHOLD: 16,
  /** 危险阈值 (ms) */
  DANGER_THRESHOLD: 33,
  /** 透明度 */
  TRANSPARENCY: 0.5,
} as const

// ============= 塔渲染偏移量配置 =============
const TOWER_RENDER_OFFSETS = {
  /** 等级文本 X 轴偏移（radius 倍数） */
  LEVEL_TEXT_X: 0.78,
  /** 等级文本 Y 轴偏移（radius 倍数） */
  LEVEL_TEXT_Y: -0.78,
  /** 段位星星 X 轴偏移（radius 倍数） */
  RANK_STAR_X: -0.68,
  /** 段位星星 Y 轴偏移（radius 倍数） */
  RANK_STAR_Y: -1.25,
  /** 小星星间距 (px) */
  STAR_SMALL_SPACING: 5,
  /** 大星星间距 (px) */
  STAR_LARGE_SPACING: 7,
  /** 星星尺寸 (px) */
  STAR_SIZE: 8,
} as const

// ============= 动画尺寸配置 =============
const ANIMATION_DIMENSIONS = {
  /** 升级动画 */
  LEVEL_UP: {
    WIDTH: 144,
    HEIGHT: 241,
    SCALE: 1.5,
  },
  /** 晋升动画 */
  RANK_UP: {
    WIDTH: 79,
    HEIGHT: 85,
    SCALE: 1.5,
    OFFSET_Y: 25,
  },
} as const

// ============= 怪物血条配置 =============
const MONSTER_HEALTH_BAR = {
  /** 血条高度 (px) */
  HEIGHT: 2,
  /** 血条 Y 轴偏移因子（inscribedSquareSideLength / N） */
  Y_OFFSET_DIVISOR: 1.5,
  /** 边框颜色 */
  BORDER_COLOR: 'rgba(45,244,34,1)',
  /** 填充颜色 */
  FILL_COLOR: 'rgba(245,44,34,1)',
  /** 文本颜色 */
  TEXT_COLOR: 'rgba(0,0,0,1)',
  /** 文本字体 */
  TEXT_FONT: '8px TimesNewRoman',
} as const

// ============= 子弹配置 =============
const BULLET_CONFIG = {
  /** 子弹越界容忍值 (px) */
  BOUNDARY_TOLERANCE: 50,
} as const

// ============= 波次系统配置 =============
const WAVE_CONFIG = {
  // 时序配置（单位：tick，60fps）
  /** 默认休息时间（tick） */
  DEFAULT_REST_TICKS: 300,
  /** 默认怪物生成间隔（tick） */
  DEFAULT_SPAWN_INTERVAL: 60,
  /** 快速生成间隔（tick） */
  FAST_SPAWN_INTERVAL: 30,
  /** Boss 波次休息时间（tick） */
  BOSS_WAVE_REST_TICKS: 600,

  // 波次进度配置
  /** Boss 波次间隔（每N波出现一次 Boss） */
  BOSS_WAVE_INTERVAL: 5,
  /** 基础怪物数量 */
  MONSTER_COUNT_BASE: 10,
  /** 每波怪物数量增量 */
  MONSTER_COUNT_INCREMENT: 2,
  /** 每波等级增量 */
  LEVEL_INCREMENT_PER_WAVE: 0.3,

  // 行为配置
  /** 默认是否自动开始下一波 */
  DEFAULT_AUTO_START: false,

  // 奖励配置
  /** 通关波次金币奖励 */
  WAVE_CLEAR_GOLD_BONUS: 100,
  /** 提前开始波次金币奖励 */
  EARLY_START_GOLD_BONUS: 50,
} as const

// ============= 怪物配置 =============
const MONSTER_CONFIG = {
  // 半径计算参数
  /** 普通怪物半径除数 */
  NORMAL_RADIUS_DIVISOR: 3,
  /** 普通怪物半径偏移 */
  NORMAL_RADIUS_OFFSET: 2,
  /** Boss 半径除数 */
  BOSS_RADIUS_DIVISOR: 2,
  /** Boss 半径偏移 */
  BOSS_RADIUS_OFFSET: 1,
  /** Devil 半径除数 */
  DEVIL_RADIUS_DIVISOR: 1.4,
  /** Devil 半径偏移 */
  DEVIL_RADIUS_OFFSET: 3,
  /** DemonSpawn 半径除数 */
  DEMON_SPAWN_RADIUS_DIVISOR: 4,

  // HighPriest 配置
  /** 治疗间隔波动范围 (ms) */
  HIGH_PRIEST_HEAL_INTERVAL_VARIANCE: 200,

  // Devil 召唤配置
  /** 召唤位置随机偏移范围 (px) */
  DEVIL_SUMMON_OFFSET_RANGE: 30,
  /** 召唤数量等级除数（每N级增加1只） */
  DEVIL_SUMMON_LEVEL_DIVISOR: 10,
} as const

