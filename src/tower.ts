/**
 * Tower System - 塔系统入口
 *
 * 此文件已重构为模块化结构，所有实现已迁移到 src/towers/ 目录：
 *
 * - tower-constants.ts  - 常量定义
 * - tower-types.ts      - 类型定义
 * - tower-config.ts     - 塔配置数据
 * - tower-manager.ts    - 塔管理器
 * - level-up-config.ts  - 升级配置表
 * - helpers/            - 辅助类
 *   - colossus-laser.ts - 激光渲染类
 *   - jet.ts            - 载机类
 * - towers/             - 塔类实现
 *   - cannon-shooter.ts
 *   - maskman-tower.ts
 *   - frost-tower.ts
 *   - poison-tower.ts
 *   - tesla-tower.ts
 *   - black-magic-tower.ts
 *   - laser-tower.ts
 *   - carrier-tower.ts
 *   - eject-blade.ts
 *
 * 重构要点：
 * 1. 修复 CSS 颜色拼写错误 (rbga -> rgba)
 * 2. 修复 Object.defineProperty 滥用，改用计算属性
 * 3. 移除调试代码 (console.log)
 * 4. 提取魔法数字为命名常量
 * 5. 拆分为多文件结构便于维护
 */
/// <reference path="./towers/index.ts" />
