# 📚 Monorepo 与 Turbo 完整使用教程

> 本教程基于实际项目 `snake-game-monorepo` 编写，包含完整的代码示例和最佳实践

## 📖 目录

1. [Monorepo 基础概念](#1-monorepo-基础概念)
2. [包管理器选择](#2-包管理器选择)
3. [Turbo 构建系统](#3-turbo-构建系统)
4. [实战：贪吃蛇项目](#4-实战贪吃蛇项目)
5. [高级技巧与最佳实践](#5-高级技巧与最佳实践)
6. [常见问题解决](#6-常见问题解决)

---

## 1. Monorepo 基础概念

### 什么是 Monorepo？

**Monorepo (Monolithic Repository)** 是一种将多个相关项目存储在同一个代码仓库中的开发模式。

```
传统多仓库 (Multi-Repo)          Monorepo (单仓库)
├── repo-a/                      ├── monorepo/
│   ├── package.json             ├── packages/
│   └── src/                     │   ├── package-a/
├── repo-b/                      │   │   ├── package.json
│   ├── package.json             │   │   └── src/
│   └── src/                     │   ├── package-b/
└── repo-c/                      │   │   ├── package.json
    ├── package.json             │   │   └── src/
    └── src/                     │   └── package-c/
                                 ├── package.json
                                 ├── pnpm-workspace.yaml
                                 └── turbo.json
```

### Monorepo 的优势

| 优势 | 说明 | 实际收益 |
|------|------|----------|
| **代码共享** | 包之间可以直接引用，无需发布 | 减少重复代码，统一逻辑 |
| **原子提交** | 跨包修改一次性提交 | 避免版本不一致 |
| **依赖管理** | 统一的依赖版本控制 | 减少依赖冲突 |
| **重构友好** | 全局搜索替换 | 大规模重构更容易 |
| **构建优化** | 缓存和并行构建 | 构建速度提升 10 倍+ |
| **统一工具链** | 共享配置、测试、Lint | 降低维护成本 |

### Monorepo 的挑战

- ❌ 仓库体积较大
- ❌ 权限管理复杂
- ❌ CI/CD 配置复杂
- ❌ 学习曲线陡峭

---

## 2. 包管理器选择

### 2.1 三种主流方案对比

| 特性 | npm | yarn | **pnpm** |
|------|-----|------|----------|
| **工作区支持** | ✅ | ✅ | ✅ |
| **磁盘效率** | ❌ (重复安装) | ❌ (重复安装) | ✅ (硬链接) |
| **安装速度** | 慢 | 中等 | **极快** |
| **锁文件稳定性** | 一般 | 较好 | **优秀** |
| **Monorepo 友好度** | 中等 | 良好 | **最佳** |
| **推荐指数** | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

### 2.2 为什么选择 pnpm？

#### 磁盘空间节省
```bash
# npm/yarn: 每个包都复制依赖
node_modules/
├── package-a/
│   └── node_modules/
│       └── lodash/  ← 重复
├── package-b/
│   └── node_modules/
│       └── lodash/  ← 重复

# pnpm: 全局存储 + 硬链接
.pnpm-store/          # 全局存储
├── lodash@4.17.21/
node_modules/
├── package-a -> .pnpm-store/lodash@4.17.21  # 硬链接
├── package-b -> .pnpm-store/lodash@4.17.21  # 硬链接
```

#### 严格的依赖隔离
```json
// package.json
{
  "dependencies": {
    "react": "^18.0.0"
  }
}

// ❌ npm/yarn: 可以意外访问到未声明的依赖
import _ from 'lodash' // 如果其他包安装了 lodash，可能侥幸成功

// ✅ pnpm: 只能访问声明的依赖
import _ from 'lodash' // 报错！lodash 未在 dependencies 中声明
```

### 2.3 pnpm 工作区配置

#### 根目录 `package.json`
```json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm -r dev",
    "build": "pnpm -r build"
  },
  "packageManager": "pnpm@9.15.0"
}
```

#### `pnpm-workspace.yaml`
```yaml
# 定义工作区包的位置
packages:
  - 'packages/*'              # packages 目录下所有子目录
  - 'apps/*'                  # apps 目录下所有子目录
  - 'plugins/*'               # plugins 目录下所有子目录
  - '!**/node_modules/**'     # 排除 node_modules
```

#### 包级别的 `package.json`
```json
{
  "name": "@myorg/utils",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

### 2.4 pnpm 常用命令

```bash
# 安装所有依赖
pnpm install

# 在所有包中运行命令
pnpm -r build          # 递归构建
pnpm -r --parallel dev # 并行运行 dev

# 过滤特定包
pnpm --filter @myorg/utils build
pnpm --filter "@myorg/**" test

# 添加依赖到特定包
pnpm --filter @myorg/utils add react

# 查看依赖树
pnpm list --depth=1

# 清理缓存
pnpm store prune
```

---

## 3. Turbo 构建系统

### 3.1 什么是 Turbo？

**Turbo** 是 Vercel 开发的高性能构建系统，专为 Monorepo 优化。

#### 核心特性
- ⚡ **增量构建**：只构建变更的代码
- 🔄 **智能缓存**：跨机器缓存构建结果
- 🎯 **任务管道**：定义任务依赖关系
- ⏱️ **并行执行**：最大化利用 CPU 核心
- 📊 **远程缓存**：团队共享构建缓存

### 3.2 Turbo 配置详解

#### 基础配置 `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    // 构建任务：依赖其他包的构建
    "build": {
      "dependsOn": ["^build"],  // ^ 表示依赖的包
      "outputs": ["dist/**", ".next/**"]
    },

    // 开发任务：不缓存，持久运行
    "dev": {
      "cache": false,
      "persistent": true
    },

    // 测试任务：无输出
    "test": {
      "outputs": []
    },

    // Lint 任务
    "lint": {
      "outputs": []
    },

    // 类型检查
    "type-check": {
      "outputs": []
    }
  }
}
```

#### 高级配置示例
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"],
      "cache": true,
      "env": ["NODE_ENV"]  // 环境变量影响缓存
    },

    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },

    "lint": {
      "dependsOn": [],
      "outputs": []
    },

    // 自定义任务
    "docs:build": {
      "dependsOn": ["^build"],
      "outputs": ["docs/**"]
    }
  }
}
```

### 3.3 Turbo 缓存机制

#### 缓存工作原理
```
1. 执行任务: pnpm build
   ↓
2. 检查输入文件哈希
   ↓
3. 查找缓存
   ├─ 本地缓存 (.turbo/cache)
   └─ 远程缓存 (Vercel)
   ↓
4. 命中缓存 → 恢复输出
   未命中 → 执行构建 → 保存缓存
```

#### 缓存配置
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],  // 定义哪些文件需要缓存
      "cache": true,           // 启用缓存
      "env": ["NODE_ENV"]      // 环境变量影响缓存键
    }
  }
}
```

#### 查看缓存状态
```bash
# 查看缓存信息
pnpm build --cache-dir=.turbo/cache

# 强制重新构建（跳过缓存）
pnpm build --force

# 查看任务图
pnpm build --dry-run
```

### 3.4 Turbo 实战配置

#### 贪吃蛇项目配置
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    }
  }
}
```

#### 各包的构建脚本

**snake-core/package.json**
```json
{
  "name": "@snake/core",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit",
    "dev": "tsc --watch"
  }
}
```

**snake-ui/package.json**
```json
{
  "name": "@snake/ui",
  "scripts": {
    "build": "tsc",
    "type-check": "tsc --noEmit"
  }
}
```

**snake-game/package.json**
```json
{
  "name": "snake-game",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@snake/core": "workspace:*",
    "@snake/ui": "workspace:*"
  }
}
```

### 3.5 Turbo 命令实战

```bash
# 1. 开发模式（只启动主应用）
pnpm dev
# 等价于: pnpm --filter snake-game dev

# 2. 生产构建（自动处理依赖顺序）
pnpm build
# 执行顺序:
# 1. snake-core build
# 2. snake-ui build (依赖 snake-core)
# 3. snake-game build (依赖 snake-core, snake-ui)

# 3. 类型检查（所有包）
pnpm type-check
# 等价于: pnpm -r type-check

# 4. 并行 Lint
pnpm lint
# 等价于: pnpm -r --parallel lint

# 5. 只构建特定包及其依赖
pnpm --filter @snake/core build

# 6. 查看构建耗时
pnpm build --summarize
```

---

## 4. 实战：贪吃蛇项目

### 4.1 项目结构设计

```
snake-game-monorepo/
├── packages/
│   ├── snake-core/          # 核心逻辑层
│   │   ├── src/
│   │   │   ├── types.ts     # 类型定义
│   │   │   ├── utils.ts     # 工具函数
│   │   │   ├── audio.ts     # 音效管理
│   │   │   └── snake-game.ts # 游戏引擎
│   │   └── package.json
│   │
│   ├── snake-ui/            # UI 组件层
│   │   ├── src/
│   │   │   ├── GameCanvas.tsx
│   │   │   ├── GameStats.tsx
│   │   │   ├── GameControls.tsx
│   │   │   └── GameOverlay.tsx
│   │   └── package.json
│   │
│   └── snake-game/          # 应用层
│       ├── src/
│       │   ├── App.tsx
│       │   └── main.tsx
│       └── package.json
│
├── package.json             # 根配置
├── pnpm-workspace.yaml      # 工作区配置
├── turbo.json               # 构建配置
└── tsconfig.json            # TypeScript 配置
```

### 4.2 核心包实现

#### `packages/snake-core/src/types.ts`
```typescript
// 游戏状态类型
export interface GameState {
  snake: Position[];
  direction: Direction;
  food: Position;
  score: number;
  isRunning: boolean;
  isPaused: boolean;
  difficulty: Difficulty;
  powerUps: PowerUp[];
  combo: number;
}

// 位置坐标
export interface Position {
  x: number;
  y: number;
}

// 方向
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 难度等级
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

// 道具类型
export type PowerUpType = 'SPEED' | 'SLOW' | 'DOUBLE' | 'SHIELD';

// 道具
export interface PowerUp {
  type: PowerUpType;
  position: Position;
  expiresAt: number;
}

// 游戏配置
export interface GameConfig {
  gridSize: number;
  difficulties: Record<Difficulty, number>; // 速度 (ms)
  powerUpChance: number; // 道具生成概率
  comboTimeout: number; // 连击超时
}
```

#### `packages/snake-core/src/snake-game.ts`
```typescript
import type { GameState, Position, Direction, GameConfig, PowerUp } from './types';
import { AudioService } from './audio';

export class SnakeGame {
  private state: GameState;
  private config: GameConfig;
  private audio: AudioService;
  private gameLoop: ReturnType<typeof setTimeout> | null = null;

  constructor(config: GameConfig) {
    this.config = config;
    this.audio = new AudioService();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      snake: [{ x: 10, y: 10 }],
      direction: 'RIGHT',
      food: this.generateFood(),
      score: 0,
      isRunning: false,
      isPaused: false,
      difficulty: 'MEDIUM',
      powerUps: [],
      combo: 0
    };
  }

  start(): void {
    if (this.state.isRunning) return;

    this.state.isRunning = true;
    this.state.isPaused = false;
    this.audio.playStart();
    this.runGameLoop();
  }

  private runGameLoop(): void {
    if (!this.state.isRunning || this.state.isPaused) return;

    const speed = this.config.difficulties[this.state.difficulty];

    this.gameLoop = setTimeout(() => {
      this.update();
      this.runGameLoop();
    }, speed);
  }

  private update(): void {
    // 移动蛇头
    const head = { ...this.state.snake[0] };

    switch (this.state.direction) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    // 碰撞检测
    if (this.checkCollision(head)) {
      this.gameOver();
      return;
    }

    // 移动蛇身
    this.state.snake.unshift(head);

    // 吃食物
    if (head.x === this.state.food.x && head.y === this.state.food.y) {
      this.eatFood();
    } else {
      // 吃道具
      const powerUpIndex = this.state.powerUps.findIndex(
        p => p.position.x === head.x && p.position.y === head.y
      );

      if (powerUpIndex !== -1) {
        this.eatPowerUp(powerUpIndex);
      } else {
        this.state.snake.pop();
      }
    }

    // 随机生成道具
    if (Math.random() < this.config.powerUpChance / 100) {
      this.spawnPowerUp();
    }

    // 更新连击
    this.updateCombo();
  }

  private eatFood(): void {
    // 计算分数
    let points = 10;
    if (this.state.combo > 0) {
      points *= Math.min(this.state.combo, 5); // 最高 5 倍
    }

    // 双倍道具
    if (this.state.powerUps.some(p => p.type === 'DOUBLE')) {
      points *= 2;
    }

    this.state.score += points;
    this.state.combo++;

    this.audio.playEat();
    this.vibrate(50);

    this.state.food = this.generateFood();
  }

  private eatPowerUp(index: number): void {
    const powerUp = this.state.powerUps[index];

    // 应用道具效果
    switch (powerUp.type) {
      case 'SPEED':
      case 'SLOW':
      case 'DOUBLE':
      case 'SHIELD':
        // 效果在 update 中通过检查实现
        break;
    }

    // 设置过期时间
    powerUp.expiresAt = Date.now() + 5000; // 5秒

    this.audio.playPowerUp();
    this.vibrate(100);

    this.state.powerUps.splice(index, 1);
    this.state.score += 50; // 道具奖励
  }

  private spawnPowerUp(): void {
    const types: PowerUpType[] = ['SPEED', 'SLOW', 'DOUBLE', 'SHIELD'];
    const type = types[Math.floor(Math.random() * types.length)];

    const position = this.generateFood(); // 复用生成逻辑

    this.state.powerUps.push({
      type,
      position,
      expiresAt: Date.now() + 10000 // 10秒后消失
    });
  }

  private generateFood(): Position {
    let position: Position;
    const gridSize = this.config.gridSize;

    do {
      position = {
        x: Math.floor(Math.random() * gridSize),
        y: Math.floor(Math.random() * gridSize)
      };
    } while (
      this.state.snake.some(s => s.x === position.x && s.y === position.y) ||
      this.state.powerUps.some(p => p.position.x === position.x && p.position.y === position.y)
    );

    return position;
  }

  private checkCollision(head: Position): boolean {
    const gridSize = this.config.gridSize;

    // 撞墙（除非有护盾）
    const hasShield = this.state.powerUps.some(p =>
      p.type === 'SHIELD' && p.expiresAt > Date.now()
    );

    if (!hasShield && (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize)) {
      return true;
    }

    // 撞自己
    return this.state.snake.some(segment =>
      segment.x === head.x && segment.y === head.y
    );
  }

  private updateCombo(): void {
    // 清理过期道具
    this.state.powerUps = this.state.powerUps.filter(p => p.expiresAt > Date.now());

    // 连击超时
    // 实际实现中需要记录最后吃食物的时间
  }

  private gameOver(): void {
    this.state.isRunning = false;
    this.audio.playGameOver();
    this.vibrate([100, 50, 100]);

    if (this.gameLoop) {
      clearTimeout(this.gameLoop);
      this.gameLoop = null;
    }
  }

  // 公共方法
  pause(): void {
    this.state.isPaused = true;
    this.audio.playPause();
  }

  resume(): void {
    this.state.isPaused = false;
    this.runGameLoop();
    this.audio.playResume();
  }

  changeDirection(newDirection: Direction): void {
    // 防止 180 度转向
    const opposite: Record<Direction, Direction> = {
      'UP': 'DOWN',
      'DOWN': 'UP',
      'LEFT': 'RIGHT',
      'RIGHT': 'LEFT'
    };

    if (this.state.direction !== opposite[newDirection]) {
      this.state.direction = newDirection;
    }
  }

  setDifficulty(difficulty: Difficulty): void {
    this.state.difficulty = difficulty;
  }

  getState(): GameState {
    return { ...this.state };
  }

  private vibrate(pattern: number | number[]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  destroy(): void {
    if (this.gameLoop) {
      clearTimeout(this.gameLoop);
    }
    this.audio.destroy();
  }
}
```

#### `packages/snake-core/src/audio.ts`
```typescript
export class AudioService {
  private context: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // 延迟初始化，避免自动播放策略限制
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.enabled || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + duration);
  }

  playEat(): void {
    this.playTone(523.25, 0.1, 'square'); // C5
  }

  playPowerUp(): void {
    this.playTone(880, 0.15, 'sawtooth'); // A5
    setTimeout(() => this.playTone(1174.66, 0.15, 'sawtooth'), 100); // D6
  }

  playStart(): void {
    this.playTone(440, 0.1, 'triangle'); // A4
    setTimeout(() => this.playTone(554.37, 0.1, 'triangle'), 100); // C#5
  }

  playPause(): void {
    this.playTone(329.63, 0.1, 'sine'); // E4
  }

  playResume(): void {
    this.playTone(440, 0.1, 'sine'); // A4
  }

  playGameOver(): void {
    this.playTone(220, 0.2, 'sawtooth'); // A3
    setTimeout(() => this.playTone(196, 0.3, 'sawtooth'), 200); // G3
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  destroy(): void {
    if (this.context) {
      this.context.close();
    }
  }
}
```

### 4.3 UI 组件包实现

#### `packages/snake-ui/src/GameCanvas.tsx`
```tsx
import React, { useEffect, useRef } from 'react';
import type { GameState, Position, PowerUpType } from '@snake/core';

interface GameCanvasProps {
  state: GameState;
  gridSize: number;
  cellSize: number;
}

const POWER_UP_COLORS: Record<PowerUpType, string> = {
  SPEED: '#3b82f6',  // 蓝色
  SLOW: '#a855f7',  // 紫色
  DOUBLE: '#eab308', // 黄色
  SHIELD: '#06b6d4'  // 青色
};

export const GameCanvas: React.FC<GameCanvasProps> = ({ state, gridSize, cellSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制网格（可选）
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, gridSize * cellSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(gridSize * cellSize, i * cellSize);
      ctx.stroke();
    }

    // 绘制食物
    if (state.food) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(
        state.food.x * cellSize + cellSize / 2,
        state.food.y * cellSize + cellSize / 2,
        cellSize / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // 绘制道具
    state.powerUps.forEach(powerUp => {
      const color = POWER_UP_COLORS[powerUp.type];
      ctx.fillStyle = color;

      // 闪烁效果（即将消失）
      const timeLeft = powerUp.expiresAt - Date.now();
      const alpha = timeLeft < 2000 ? (Math.sin(Date.now() / 100) * 0.5 + 0.5) : 1;
      ctx.globalAlpha = alpha;

      ctx.fillRect(
        powerUp.position.x * cellSize + 2,
        powerUp.position.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );

      ctx.globalAlpha = 1;
    });

    // 绘制蛇
    state.snake.forEach((segment, index) => {
      const isHead = index === 0;

      if (isHead) {
        // 蛇头颜色
        ctx.fillStyle = '#22c55e';

        // 护盾效果
        const hasShield = state.powerUps.some(p =>
          p.type === 'SHIELD' && p.expiresAt > Date.now()
        );
        if (hasShield) {
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            segment.x * cellSize + 1,
            segment.y * cellSize + 1,
            cellSize - 2,
            cellSize - 2
          );
        }
      } else {
        // 蛇身颜色（渐变）
        const ratio = index / state.snake.length;
        const r = Math.floor(34 + (22 - 34) * ratio);
        const g = Math.floor(197 + (197 - 197) * ratio);
        const b = Math.floor(94 + (94 - 94) * ratio);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      }

      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );

      // 蛇头眼睛
      if (isHead) {
        ctx.fillStyle = '#ffffff';
        const eyeSize = 2;
        const eyeOffset = cellSize / 4;

        // 根据方向绘制眼睛位置
        switch (state.direction) {
          case 'UP':
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            break;
          case 'DOWN':
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
          case 'LEFT':
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + eyeOffset, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
          case 'RIGHT':
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(segment.x * cellSize + cellSize - eyeOffset - eyeSize, segment.y * cellSize + cellSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        }
      }
    });

    // 连击指示器
    if (state.combo > 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`COMBO x${state.combo}`, canvas.width / 2, 20);
    }

  }, [state, gridSize, cellSize]);

  return (
    <canvas
      ref={canvasRef}
      width={gridSize * cellSize}
      height={gridSize * cellSize}
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        backgroundColor: '#1a1a1a',
        display: 'block',
        margin: '0 auto'
      }}
    />
  );
};
```

#### `packages/snake-ui/src/GameStats.tsx`
```tsx
import React from 'react';
import type { GameState, Difficulty } from '@snake/core';

interface GameStatsProps {
  state: GameState;
  highScore: number;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
  EXTREME: '极限'
};

export const GameStats: React.FC<GameStatsProps> = ({ state, highScore }) => {
  const activePowerUps = state.powerUps.filter(p => p.expiresAt > Date.now());

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '16px',
      padding: '20px',
      backgroundColor: '#2a2a2a',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      {/* 分数 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>当前分数</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
          {state.score}
        </div>
      </div>

      {/* 最高分 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>最高分数</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>
          {highScore}
        </div>
      </div>

      {/* 难度 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>难度</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#60a5fa' }}>
          {DIFFICULTY_LABELS[state.difficulty]}
        </div>
      </div>

      {/* 连击 */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>连击</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: state.combo > 1 ? '#fbbf24' : '#666' }}>
          {state.combo > 0 ? `x${state.combo}` : '-'}
        </div>
      </div>

      {/* 活跃道具 */}
      {activePowerUps.length > 0 && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>活跃道具</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {activePowerUps.map((p, i) => {
              const timeLeft = Math.ceil((p.expiresAt - Date.now()) / 1000);
              const colors = {
                SPEED: '#3b82f6',
                SLOW: '#a855f7',
                DOUBLE: '#eab308',
                SHIELD: '#06b6d4'
              };
              const labels = {
                SPEED: '加速',
                SLOW: '减速',
                DOUBLE: '双倍',
                SHIELD: '护盾'
              };
              return (
                <span key={i} style={{
                  padding: '4px 8px',
                  backgroundColor: colors[p.type],
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {labels[p.type]} {timeLeft}s
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 4.4 主应用集成

#### `packages/snake-game/src/App.tsx`
```tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SnakeGame } from '@snake/core';
import type { GameState, Difficulty, Direction, GameConfig } from '@snake/core';
import { GameCanvas, GameStats } from '@snake/ui';

const GAME_CONFIG: GameConfig = {
  gridSize: 20,
  difficulties: {
    EASY: 200,
    MEDIUM: 150,
    HARD: 100,
    EXTREME: 60
  },
  powerUpChance: 5,
  comboTimeout: 3000
};

const App: React.FC = () => {
  const [game] = useState(() => new SnakeGame(GAME_CONFIG));
  const [state, setState] = useState<GameState>(game.getState());
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('snake-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const gameRef = useRef(game);
  const animationFrameRef = useRef<number>();

  // 同步游戏状态
  const syncState = useCallback(() => {
    setState(game.getState());
  }, [game]);

  // 游戏循环（使用 requestAnimationFrame 保持 UI 更新）
  useEffect(() => {
    const loop = () => {
      syncState();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [syncState]);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          game.changeDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          game.changeDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          game.changeDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          game.changeDirection('RIGHT');
          break;
        case ' ':
          e.preventDefault();
          if (!state.isRunning) {
            game.start();
          } else if (state.isPaused) {
            game.resume();
          } else {
            game.pause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [game, state.isRunning, state.isPaused]);

  // 更新最高分
  useEffect(() => {
    if (state.score > highScore) {
      setHighScore(state.score);
      localStorage.setItem('snake-high-score', state.score.toString());
    }
  }, [state.score, highScore]);

  // 清理资源
  useEffect(() => {
    return () => {
      gameRef.current.destroy();
    };
  }, []);

  // 触摸控制
  const handleTouchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleTouchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!handleTouchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - handleTouchStart.current.x;
    const deltaY = touch.clientY - handleTouchStart.current.y;

    const threshold = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          game.changeDirection('RIGHT');
        } else {
          game.changeDirection('LEFT');
        }
      }
    } else {
      // 垂直滑动
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          game.changeDirection('DOWN');
        } else {
          game.changeDirection('UP');
        }
      }
    }

    // 点击（短滑动）= 暂停/继续
    if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
      if (!state.isRunning) {
        game.start();
      } else if (state.isPaused) {
        game.resume();
      } else {
        game.pause();
      }
    }

    handleTouchStart.current = null;
  };

  // 按钮处理
  const handleStart = () => game.start();
  const handlePause = () => game.pause();
  const handleResume = () => game.resume();

  const handleDifficulty = (difficulty: Difficulty) => {
    game.setDifficulty(difficulty);
    syncState();
  };

  const handleSoundToggle = () => {
    setIsSoundEnabled(prev => !prev);
    // AudioService 的 toggle 方法需要暴露，这里简化处理
  };

  // 游戏状态显示
  const getOverlayContent = () => {
    if (!state.isRunning) {
      return {
        title: '贪吃蛇',
        subtitle: '按空格键或点击开始',
        showStart: true
      };
    }

    if (state.isPaused) {
      return {
        title: '已暂停',
        subtitle: '按空格键或点击继续',
        showResume: true
      };
    }

    if (state.isRunning && state.snake.length === 0) {
      return {
        title: '游戏结束',
        subtitle: `最终得分: ${state.score}`,
        showStart: true
      };
    }

    return null;
  };

  const overlay = getOverlayContent();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#fff',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* 头部 */}
      <header style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', color: '#22c55e' }}>🐍 贪吃蛇</h1>
        <p style={{ margin: '8px 0 0', color: '#888', fontSize: '14px' }}>
          React + Monorepo + TypeScript
        </p>
      </header>

      {/* 统计面板 */}
      <GameStats state={state} highScore={highScore} />

      {/* 游戏画布容器 */}
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto',
          touchAction: 'none'
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <GameCanvas
          state={state}
          gridSize={GAME_CONFIG.gridSize}
          cellSize={25}
        />

        {/* 游戏覆盖层 */}
        {overlay && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '8px',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            <h2 style={{ fontSize: '36px', margin: '0 0 10px', color: '#22c55e' }}>
              {overlay.title}
            </h2>
            <p style={{ margin: '0 0 20px', color: '#aaa' }}>
              {overlay.subtitle}
            </p>

            {overlay.showStart && (
              <button
                onClick={handleStart}
                style={{
                  padding: '12px 32px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: '#22c55e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                开始游戏
              </button>
            )}

            {overlay.showResume && (
              <button
                onClick={handleResume}
                style={{
                  padding: '12px 32px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                继续游戏
              </button>
            )}
          </div>
        )}
      </div>

      {/* 控制面板 */}
      <div style={{
        marginTop: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        maxWidth: '600px',
        margin: '20px auto 0'
      }}>
        {/* 难度选择 */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['EASY', 'MEDIUM', 'HARD', 'EXTREME'] as Difficulty[]).map(diff => (
            <button
              key={diff}
              onClick={() => handleDifficulty(diff)}
              disabled={state.isRunning && !state.isPaused}
              style={{
                padding: '8px 12px',
                backgroundColor: state.difficulty === diff ? '#22c55e' : '#3a3a3a',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: (state.isRunning && !state.isPaused) ? 0.5 : 1,
                fontSize: '12px'
              }}
            >
              {diff === 'EASY' ? '简单' :
               diff === 'MEDIUM' ? '中等' :
               diff === 'HARD' ? '困难' : '极限'}
            </button>
          ))}
        </div>

        {/* 暂停/继续按钮 */}
        {state.isRunning && !state.isPaused && (
          <button
            onClick={handlePause}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f59e0b',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            暂停
          </button>
        )}

        {/* 音效开关 */}
        <button
          onClick={handleSoundToggle}
          style={{
            padding: '8px 16px',
            backgroundColor: isSoundEnabled ? '#10b981' : '#6b7280',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isSoundEnabled ? '🔊 音效开' : '🔇 音效关'}
        </button>
      </div>

      {/* 键盘提示 */}
      <div style={{
        marginTop: '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: '12px'
      }}>
        <p>键盘控制: ↑↓←→ 或 WASD | 空格键: 暂停/继续</p>
        <p>触控: 滑动控制方向 | 点击: 暂停/继续</p>
      </div>

      {/* 样式注入 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default App;
```

### 4.5 构建与运行

#### 安装依赖
```bash
# 在项目根目录
pnpm install
```

#### 开发模式
```bash
# 启动开发服务器
pnpm dev

# 或单独运行某个包
pnpm --filter snake-game dev
```

#### 生产构建
```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm --filter @snake/core build
```

#### 类型检查
```bash
pnpm type-check
```

---

## 5. 高级技巧与最佳实践

### 5.1 依赖管理策略

#### 使用 workspace 协议
```json
{
  "dependencies": {
    // 使用 workspace 协议，自动链接本地包
    "@snake/core": "workspace:*",
    "@snake/ui": "workspace:*",

    // 版本范围也可以
    "@snake/core": "workspace:^1.0.0"
  }
}
```

#### 内部 vs 外部依赖
```json
{
  "devDependencies": {
    // 工具类：所有包都需要
    "typescript": "^5.6.0",
    "eslint": "^8.0.0"
  },
  "dependencies": {
    // 包特定依赖
    "react": "^18.2.0"
  }
}
```

### 5.2 TypeScript 配置

#### 根目录 `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",

    "strict": true,
    "noEmit": true,

    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,

    "baseUrl": ".",
    "paths": {
      "@snake/*": ["./packages/*/src"]
    }
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### 包级 `tsconfig.json`
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.3 Git 工作流

#### `.gitignore`
```gitignore
# 依赖
node_modules/
.pnpm-store/

# 构建输出
dist/
build/
*.tsbuildinfo

# Turbo 缓存
.turbo/

# 环境变量
.env
.env.local

# IDE
.vscode/
.idea/

# 日志
*.log
```

#### 提交信息规范
```bash
# 使用 conventional commits
git commit -m "feat(core): 添加道具系统"

# 示例:
# feat: 新功能
# fix: Bug 修复
# refactor: 重构
# docs: 文档更新
# test: 测试相关
```

### 5.4 CI/CD 配置

#### GitHub Actions 示例
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.15.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Build
        run: pnpm build

      - name: Upload Turbo cache
        uses: actions/cache@v3
        with:
          path: .turbo/cache
          key: turbo-${{ runner.os }}-${{ github.sha }}
          restore-keys: |
            turbo-${{ runner.os }}-
```

### 5.5 性能优化

#### 1. 增量构建
```bash
# Turbo 自动缓存，只构建变更的包
pnpm build

# 强制重新构建（清除缓存）
pnpm build --force
```

#### 2. 并行执行
```json
{
  "pipeline": {
    "lint": {
      "parallel": true  // 显式声明并行
    }
  }
}
```

#### 3. 缓存策略
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true,
      "env": ["NODE_ENV", "VITE_*"]  // 环境变量影响缓存
    }
  }
}
```

#### 4. 代码分割
```typescript
// 动态导入减少初始包大小
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// 在路由或需要时加载
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 5.6 团队协作

#### 1. 统一开发环境
```json
// package.json
{
  "scripts": {
    "setup": "pnpm install && pnpm build",
    "dev": "pnpm --filter snake-game dev",
    "build": "pnpm -r build",
    "clean": "pnpm -r exec rm -rf dist .turbo && rm -rf node_modules"
  }
}
```

#### 2. 文档标准化
```
每个包应该包含:
- README.md: 包的用途、API 文档
- CHANGELOG.md: 版本变更记录
- src/index.ts: 主要导出入口
```

#### 3. 代码规范
```bash
# 根目录添加脚本
pnpm add -Dw eslint prettier @typescript-eslint/eslint-plugin

# 配置共享规则
# .eslintrc.js
module.exports = {
  extends: ['@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error'
  }
};
```

---

## 6. 常见问题解决

### 6.1 依赖问题

#### 问题：包之间循环依赖
```
A 依赖 B
B 依赖 A
```

**解决方案：**
```typescript
// 提取公共逻辑到 C 包
// packages/common/src/shared.ts

// A 和 B 都依赖 C
// A/package.json: { "dependencies": { "@snake/common": "workspace:*" } }
// B/package.json: { "dependencies": { "@snake/common": "workspace:*" } }
```

#### 问题：版本冲突
```bash
# 使用 pnpm why 查看依赖树
pnpm why react

# 强制统一版本
# 根目录 package.json
{
  "pnpm": {
    "overrides": {
      "react": "^18.2.0"
    }
  }
}
```

### 6.2 构建问题

#### 问题：TypeScript 找不到包
```
error TS2307: Cannot find module '@snake/core' or its corresponding type declarations.
```

**解决方案：**
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@snake/*": ["./packages/*/src"]
    }
  }
}
```

#### 问题：Vite 别名不工作
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@snake/core': path.resolve(__dirname, './packages/snake-core/src'),
      '@snake/ui': path.resolve(__dirname, './packages/snake-ui/src')
    }
  }
});
```

### 6.3 Turbo 缓存问题

#### 问题：缓存未命中
```bash
# 查看详细日志
pnpm build --verbosity=full

# 清除缓存重新尝试
pnpm build --force
rm -rf .turbo/cache
```

#### 问题：远程缓存未配置
```bash
# 登录 Vercel
pnpm login

# 启用远程缓存
pnpm turbo login

# 验证
pnpm turbo info
```

### 6.4 开发体验

#### 问题：热更新不工作
```bash
# 检查 vite 配置
# 确保在 vite.config.ts 中有:
export default defineConfig({
  server: {
    watch: {
      usePolling: true  // 某些系统需要
    }
  }
});
```

#### 问题：VS Code IntelliSense 不工作
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

---

## 7. 总结与最佳实践清单

### ✅ Monorepo 检查清单

- [ ] 使用 pnpm 作为包管理器
- [ ] 配置 `pnpm-workspace.yaml`
- [ ] 每个包有独立的 `package.json`
- [ ] 使用 workspace 协议引用内部包
- [ ] 根目录有统一的构建脚本

### ✅ Turbo 配置检查清单

- [ ] 配置 `turbo.json` 管道
- [ ] 正确定义任务依赖关系
- [ ] 配置缓存输出目录
- [ ] 使用环境变量影响缓存键
- [ ] 启用远程缓存（团队协作）

### ✅ 代码组织检查清单

- [ ] 清晰的包边界（核心/UI/应用）
- [ ] 共享类型定义
- [ ] 避免循环依赖
- [ ] 统一的 TypeScript 配置
- [ ] 适当的代码分割

### ✅ 开发体验检查清单

- [ ] 统一的开发命令
- [ ] 类型检查作为独立任务
- [ ] Lint 配置共享
- [ ] CI/CD 集成
- [ ] 文档完整

---

## 📚 附录：资源链接

### 官方文档
- [pnpm Workspace](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo/docs)
- [TypeScript Monorepo](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#workspace-folders)

### 工具推荐
- **Changesets**: 版本管理
- **Nx**: 替代 Turbo 的构建系统
- **Lerna**: 传统 Monorepo 工具（已集成 Nx）

### 实战项目
- [Turborepo Example](https://github.com/vercel/turbo/tree/main/examples)
- [pnpm Example](https://github.com/pnpm/pnpm/tree/main/examples)

---

**文档版本**: v1.0
**最后更新**: 2025-12-25
**基于项目**: snake-game-monorepo

> 💡 **提示**: 本教程包含完整的可运行代码示例，可以直接在你的项目中使用。建议先阅读理论部分，然后逐步实现代码。
