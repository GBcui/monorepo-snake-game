/**
 * 游戏核心类型定义
 */

// 方向类型
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// 坐标点
export interface Point {
  x: number;
  y: number;
}

// 游戏状态
export type GameState = 'IDLE' | 'RUNNING' | 'PAUSED' | 'GAME_OVER';

// 难度级别
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';

// 游戏配置
export interface GameConfig {
  gridSize: number;        // 网格大小 (默认 20)
  speed: number;           // 初始速度 (ms)
  difficulty: Difficulty;  // 难度级别
  wrapWalls: boolean;      // 是否穿墙
  powerUps: boolean;       // 是否启用道具
}

// 游戏统计
export interface GameStats {
  score: number;
  highScore: number;
  length: number;
  timeElapsed: number;     // 游戏时间 (ms)
  applesEaten: number;
  powerUpsCollected: number;
}

// 游戏事件
export type GameEvent =
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' }
  | { type: 'MOVE'; direction: Direction }
  | { type: 'GAME_OVER'; reason: string };

// 道具类型
export type PowerUpType = 'SPEED_BOOST' | 'SLOW_DOWN' | 'DOUBLE_POINTS' | 'SHIELD';

// 道具对象
export interface PowerUp {
  type: PowerUpType;
  position: Point;
  expiresAt: number;
}

// 完整游戏状态
export interface GameStateData {
  snake: Point[];
  direction: Direction;
  nextDirection: Direction;
  food: Point;
  powerUp?: PowerUp;
  state: GameState;
  stats: GameStats;
  config: GameConfig;
  activeEffects: {
    speedBoost?: number;      // 速度倍率
    doublePoints?: number;    // 双倍分数剩余时间
    shield?: number;          // 护盾剩余时间
    slowDown?: number;        // 减速倍率
  };
}