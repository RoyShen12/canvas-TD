/**
 * base.ts - 入口文件
 *
 * 这个文件作为所有基类的入口点，通过 reference 指令导入拆分后的各个模块。
 * 这种方式保持了与 TypeScript outFile 编译选项的兼容性。
 *
 * 拆分后的文件结构：
 * - base/base.ts         - Base 类（ID 生成）
 * - base/circle-base.ts  - CircleBase 类（圆形几何）
 * - base/item-base.ts    - ItemBase 类（可渲染实体）
 * - base/tower-base.ts   - TowerBase 类（塔基类）
 * - base/monster-base.ts - MonsterBase 类（怪物基类）
 * - base/bullet-base.ts  - BulletBase 类（子弹基类）
 * - base/rectangle-base.ts - RectangleBase 类（矩形几何，备用）
 *
 * 支持系统：
 * - types/debuff-types.ts    - Debuff 类型定义
 * - systems/debuff-manager.ts - Debuff 管理器
 * - ui/button-on-dom.ts      - DOM 按钮类
 */

// ==================== 依赖项 ====================
/// <reference path='./typedef.ts' />
/// <reference path='./debug.ts' />
/// <reference path='./constants.ts' />
/// <reference path='./timer-manager.ts' />
/// <reference path='./dirty-rect.ts' />
/// <reference path='./error-handler.ts' />
/// <reference path='./registry.ts' />
/// <reference path='./utils/math-utils.ts' />
/// <reference path='./utils/format-utils.ts' />
/// <reference path='./utils/ease-utils.ts' />
/// <reference path='./utils/object-utils.ts' />
/// <reference path='./utils/dom-utils.ts' />
/// <reference path='./utils/render-utils.ts' />
/// <reference path='./utils/dot-manager.ts' />
/// <reference path='./ui/status-board.ts' />
/// <reference path='./motion.ts' />
/// <reference path='./types/pathfinding-types.ts' />
/// <reference path='./legendary-gem.ts' />

// ==================== Debuff 系统 ====================
/// <reference path='./types/debuff-types.ts' />
/// <reference path='./systems/debuff-manager.ts' />

// ==================== 基类模块 ====================
/// <reference path='./base/base.ts' />
/// <reference path='./base/rectangle-base.ts' />
/// <reference path='./base/circle-base.ts' />
/// <reference path='./base/item-base.ts' />
/// <reference path='./base/tower-base.ts' />
/// <reference path='./base/monster-base.ts' />
/// <reference path='./base/bullet-base.ts' />

// ==================== UI 组件 ====================
/// <reference path='./ui/button-on-dom.ts' />
