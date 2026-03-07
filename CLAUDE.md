# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Canvas-TD is a browser-based Tower Defense game built with TypeScript and HTML5 Canvas. The game features multiple tower types, monster types, and bullet mechanics with Chinese language UI.

**Live demo**: https://royshen12.github.io/canvas-TD/

## Build Commands

```bash
# Install dependencies
pnpm install

# Build TypeScript (compiles all src/*.ts to dist/main.js)
pnpm build

# Start development server with live reload (runs tsc -w + live-server)
pnpm start

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

The project uses TypeScript's `outFile` option to concatenate all source files into a single `dist/main.js`. File ordering is controlled via `/// <reference path="..." />` directives.

## Architecture

### Modular File Structure

The codebase has been refactored into a modular structure:

```
src/
├── base.ts              # Entry point - imports all base modules via reference
├── tower.ts             # Entry point for tower system
├── monster.ts           # Entry point for monster system
├── bullet.ts            # Entry point for bullet system
├── game.ts              # Main game orchestration
├── base/                # Base class implementations
│   ├── base.ts          # Base class (ID generation)
│   ├── circle-base.ts   # CircleBase (circular geometry)
│   ├── item-base.ts     # ItemBase (renderable entities)
│   ├── tower-base.ts    # TowerBase
│   ├── monster-base.ts  # MonsterBase
│   └── bullet-base.ts   # BulletBase
├── towers/              # Tower implementations
│   ├── index.ts         # Tower module entry + registry
│   ├── tower-config.ts  # Tower stat configurations
│   ├── tower-manager.ts # TowerManager singleton
│   └── towers/          # Individual tower classes
├── monsters/            # Monster implementations
│   ├── index.ts         # Monster module entry
│   ├── monster-manager.ts
│   ├── normal/          # Regular monsters
│   └── bosses/          # Boss monsters
├── bullets/             # Bullet implementations
│   ├── index.ts         # Bullet module entry
│   └── bullet-manager.ts
├── game/                # Game subsystems
│   ├── GamePathfinder.ts
│   ├── GameRenderer.ts
│   ├── GameEventHandler.ts
│   └── GameUIManager.ts
├── utils/               # Utility functions
├── types/               # Type definitions
├── systems/             # Game systems (debuff-manager, etc.)
└── ui/                  # UI components
```

### Core Class Hierarchy

The game uses a class-based entity system with three main hierarchies:

1. **Towers** (extend `TowerBase`)
   - Registered via `TowerRegistry.register('ClassName', ClassName)`
   - Tower configurations defined in `src/towers/tower-config.ts`
   - Each tower type defines its bullet type via `bulletCtorName`

2. **Monsters** (extend `MonsterBase`)
   - Registered via `MonsterRegistry.register('ClassName', ClassName)`
   - Static properties define level scaling: `rwd`, `spd`, `hth`, `amr`

3. **Bullets** (extend `BulletBase`)
   - Registered via `BulletRegistry.register('ClassName', ClassName)`
   - Created by towers via `BulletManager.Factory()`

### Registry System (`src/registry.ts`)

The `ClassRegistry<T>` generic class provides type-safe dynamic instantiation. Three global registries:
- `TowerRegistry`, `MonsterRegistry`, `BulletRegistry`

To add a new entity, register it in the appropriate `index.ts` file:
```typescript
TowerRegistry.register('NewTower', NewTower)
```

### Game Loop (`src/game.ts`)

The `Game` class orchestrates:
- Canvas layer management (bg, tower, rapid/offscreen layers)
- Entity update cycles via `update()`
- Rendering via `render()`
- A* pathfinding integration
- UI events and tower placement

Static accessor pattern: `Game.callXxx()` functions provide global access to game state.

### Canvas System (`src/canvas.ts`)

`CanvasManager` handles multiple canvas layers:
- Background layer (static, rendered once)
- Tower layer (updates on tower changes)
- Offscreen/rapid layer (updated every frame)
- Mouse layer (interaction feedback)

Supports OffscreenCanvas and ImageBitmapRenderingContext for performance.

### Key Patterns

- **Level functions**: `(lvl: number) => value` for level-based stat scaling
- **Position class**: Coordinates with methods like `moveTo()`, `dithering()`, `copy()`
- **Reference directives**: File order is critical for `outFile` compilation
- **Debug mode**: `localStorage.getItem('debug_mode') === '1'` enables test features

### Constants (`src/constants.ts`)

All magic numbers are centralized:
- `GAME_CONFIG` - balance, timing, mouse interaction
- `GAME_TIMING` - tick rates, spawn intervals
- `GRID_CONFIG` - grid dimensions
- `ENTITY_CONFIG` - tower/monster parameters
- `COLORS` - color palette

### File Load Order (via reference paths)

1. `typedef.ts` - Type definitions
2. `constants.ts`, `timer-manager.ts`, `dirty-rect.ts`, `error-handler.ts`, `registry.ts`
3. `utils/*.ts` - Utility modules
4. `motion.ts`, `legendary-gem.ts` - Support systems
5. `base.ts` (loads all base/*.ts) - Base classes
6. `tower.ts`, `monster.ts`, `bullet.ts` - Entity systems (each loads their subdirectories)
7. `stage.ts` - Wave system (WaveManager, WaveFactory, WaveUIManager)
8. `game.ts` - Main game controller

### Wave System (`src/stage.ts`)

The wave system manages monster spawning through three classes:
- **`Wave`** - Single wave with ordered `SummonConfig` entries
- **`WaveManager`** (singleton) - State machine: IDLE → WAITING_FOR_START → SPAWNING → RESTING → COMPLETED
- **`WaveFactory`** - Creates standard (10 waves) and endless mode wave definitions
- **`WaveUIManager`** - DOM-based UI panel for wave progress, rest timer, and controls

After standard waves complete, endless mode can be activated to generate infinite waves with exponential difficulty scaling.

### UI Overlay System (`src/game/GameUIManager.ts`)

Static methods on `GameUIManager` provide:
- **Toast notifications** - `showToast(message, type, duration)` for in-game feedback
- **Game overlays** - Pause, Game Over, Victory screens with stats
- HTML elements defined in `index.html`, styled in `dist/global.css`

### Game State Flow

- **Pause**: Shows overlay, `_updateTick` freezes, scanSwipe still runs for cleanup
- **Game Over**: Life ≤ 0 triggers overlay with stats + restart button
- **Victory**: All waves complete + no monsters → overlay with endless mode option
- **Path validation**: `wouldBlockAllPaths()` prevents tower placement that blocks monster paths

### Testing (`tests/`)

Uses Vitest. Test files mock their own dependencies (not importing from source due to `outFile` architecture):
- `tests/monster.test.ts` - Monster scaling, damage, healing
- `tests/motion.test.ts` - Position, Vector, PolarVector
- `tests/bugfixes.test.ts` - Regression tests for critical bug fixes
