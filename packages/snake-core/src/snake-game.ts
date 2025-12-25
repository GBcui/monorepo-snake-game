/**
 * 贪吃蛇游戏核心逻辑
 */
import type {
  GameState,
  Direction,
  Point,
  GameConfig,
  GameStats,
  GameStateData,
  PowerUp,
  PowerUpType
} from './types.js';
import { randomPoint, pointsEqual, oppositeDirection, getSpeedByDifficulty, calculateScore } from './utils.js';
import { audioManager } from './audio.js';

export class SnakeGame {
  private state: GameState = 'IDLE';
  private snake: Point[] = [];
  private direction: Direction = 'RIGHT';
  private nextDirection: Direction = 'RIGHT';
  private food: Point = { x: 0, y: 0 };
  private powerUp?: PowerUp;
  private stats: GameStats = {
    score: 0,
    highScore: 0,
    length: 0,
    timeElapsed: 0,
    applesEaten: 0,
    powerUpsCollected: 0
  };
  private config: GameConfig;
  private activeEffects: {
    speedBoost?: number;
    doublePoints?: number;
    shield?: number;
    slowDown?: number;
  } = {};

  private gameLoopId: ReturnType<typeof setTimeout> | null = null;
  private lastUpdateTime: number = 0;
  private startTime: number = 0;
  private combo: number = 1;

  constructor(config?: Partial<GameConfig>) {
    this.config = {
      gridSize: config?.gridSize || 20,
      speed: config?.speed || getSpeedByDifficulty(config?.difficulty || 'MEDIUM'),
      difficulty: config?.difficulty || 'MEDIUM',
      wrapWalls: config?.wrapWalls ?? false,
      powerUps: config?.powerUps ?? true
    };

    // 加载最高分
    this.loadHighScore();
  }

  // 初始化游戏
  init(): void {
    this.state = 'IDLE';
    this.snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.stats = {
      score: 0,
      highScore: this.stats.highScore,
      length: 3,
      timeElapsed: 0,
      applesEaten: 0,
      powerUpsCollected: 0
    };
    this.activeEffects = {};
    this.combo = 1;
    this.spawnFood();
    this.powerUp = undefined;
  }

  // 开始游戏
  start(): void {
    if (this.state === 'IDLE' || this.state === 'GAME_OVER') {
      this.init();
    }

    if (this.state === 'PAUSED') {
      this.resume();
      return;
    }

    this.state = 'RUNNING';
    this.startTime = Date.now();
    this.lastUpdateTime = Date.now();
    this.gameLoop();
  }

  // 暂停游戏
  pause(): void {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      if (this.gameLoopId) {
        clearTimeout(this.gameLoopId);
        this.gameLoopId = null;
      }
    }
  }

  // 恢复游戏
  resume(): void {
    if (this.state === 'PAUSED') {
      this.state = 'RUNNING';
      this.lastUpdateTime = Date.now();
      this.gameLoop();
    }
  }

  // 重置游戏
  reset(): void {
    if (this.gameLoopId) {
      clearTimeout(this.gameLoopId);
      this.gameLoopId = null;
    }
    this.init();
  }

  // 改变方向
  changeDirection(newDirection: Direction): void {
    // 防止180度转向
    if (oppositeDirection(this.direction) === newDirection) {
      return;
    }
    this.nextDirection = newDirection;
  }

  // 游戏主循环
  private gameLoop(): void {
    if (this.state !== 'RUNNING') return;

    const now = Date.now();
    const elapsed = now - this.lastUpdateTime;

    // 计算当前速度（考虑速度倍率效果）
    let currentSpeed = this.config.speed;
    if (this.activeEffects.speedBoost) {
      currentSpeed = currentSpeed / this.activeEffects.speedBoost;
    }
    if (this.activeEffects.slowDown) {
      currentSpeed = currentSpeed * this.activeEffects.slowDown;
    }

    if (elapsed >= currentSpeed) {
      this.update();
      this.lastUpdateTime = now;
    }

    // 更新游戏时间
    this.stats.timeElapsed = now - this.startTime;

    // 更新效果持续时间
    this.updateEffects(elapsed);

    this.gameLoopId = setTimeout(() => this.gameLoop(), 16); // ~60fps
  }

  // 更新游戏状态
  private update(): void {
    // 应用下一个方向
    this.direction = this.nextDirection;

    // 计算新头部位置
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case 'UP': head.y--; break;
      case 'DOWN': head.y++; break;
      case 'LEFT': head.x--; break;
      case 'RIGHT': head.x++; break;
    }

    // 墙壁碰撞检测
    if (this.config.wrapWalls) {
      // 穿墙模式
      if (head.x < 0) head.x = this.config.gridSize - 1;
      if (head.x >= this.config.gridSize) head.x = 0;
      if (head.y < 0) head.y = this.config.gridSize - 1;
      if (head.y >= this.config.gridSize) head.y = 0;
    } else {
      // 撞墙游戏结束
      if (head.x < 0 || head.x >= this.config.gridSize ||
          head.y < 0 || head.y >= this.config.gridSize) {
        if (!this.activeEffects.shield) {
          this.gameOver('撞墙了！');
          return;
        } else {
          // 护盾保护，弹回
          this.activeEffects.shield = undefined;
          this.direction = oppositeDirection(this.direction);
          this.nextDirection = this.direction;
          return;
        }
      }
    }

    // 自撞检测
    if (pointInArray(head, this.snake.slice(1))) {
      if (!this.activeEffects.shield) {
        this.gameOver('撞到自己了！');
        return;
      } else {
        // 护盾保护
        this.activeEffects.shield = undefined;
        return;
      }
    }

    // 移动蛇
    this.snake.unshift(head);

    // 检查是否吃到食物
    if (pointsEqual(head, this.food)) {
      this.eatFood();
    } else if (this.powerUp && pointsEqual(head, this.powerUp.position)) {
      // 检查是否吃到道具
      this.eatPowerUp();
      // 不移除尾部（道具不增加长度）
      this.snake.pop();
    } else {
      // 正常移动，移除尾部
      this.snake.pop();
    }

    // 随机生成道具
    if (this.config.powerUps && !this.powerUp && Math.random() < 0.05) {
      this.spawnPowerUp();
    }

    // 检查道具过期
    if (this.powerUp && Date.now() > this.powerUp.expiresAt) {
      this.powerUp = undefined;
    }
  }

  // 吃食物
  private eatFood(): void {
    // 计算分数
    const basePoints = 10;
    const multiplier = this.activeEffects.doublePoints ? 2 : 1;
    const points = calculateScore(basePoints, multiplier, this.combo);

    this.stats.score += points;
    this.stats.applesEaten++;
    this.stats.length = this.snake.length;

    // 更新最高分
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      this.saveHighScore();
    }

    // 增加连击
    this.combo = Math.min(this.combo + 0.1, 5);

    // 播放音效
    audioManager.playEat();

    // 生成新食物
    this.spawnFood();
  }

  // 吃道具
  private eatPowerUp(): void {
    if (!this.powerUp) return;

    this.stats.powerUpsCollected++;
    this.stats.score += 50; // 道具额外分数

    const type = this.powerUp.type;
    const duration = 5000; // 5秒

    switch (type) {
      case 'SPEED_BOOST':
        this.activeEffects.speedBoost = 1.5;
        setTimeout(() => { delete this.activeEffects.speedBoost; }, duration);
        break;
      case 'SLOW_DOWN':
        this.activeEffects.slowDown = 0.7;
        setTimeout(() => { delete this.activeEffects.slowDown; }, duration);
        break;
      case 'DOUBLE_POINTS':
        this.activeEffects.doublePoints = duration;
        setTimeout(() => { delete this.activeEffects.doublePoints; }, duration);
        break;
      case 'SHIELD':
        this.activeEffects.shield = duration;
        setTimeout(() => { delete this.activeEffects.shield; }, duration);
        break;
    }

    // 播放音效
    audioManager.playPowerUp();

    this.powerUp = undefined;
  }

  // 生成食物
  private spawnFood(): void {
    this.food = randomPoint(this.config.gridSize, this.config.gridSize, this.snake);
  }

  // 生成道具
  private spawnPowerUp(): void {
    const types: PowerUpType[] = ['SPEED_BOOST', 'SLOW_DOWN', 'DOUBLE_POINTS', 'SHIELD'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.powerUp = {
      type,
      position: randomPoint(this.config.gridSize, this.config.gridSize, [...this.snake, this.food]),
      expiresAt: Date.now() + 10000 // 10秒后过期
    };
  }

  // 更新效果
  private updateEffects(elapsed: number): void {
    // 减少连击值
    if (this.combo > 1) {
      this.combo = Math.max(1, this.combo - elapsed / 10000);
    }

    // 检查道具过期时间
    if (this.activeEffects.doublePoints && this.activeEffects.doublePoints <= 0) {
      delete this.activeEffects.doublePoints;
    }
    if (this.activeEffects.shield && this.activeEffects.shield <= 0) {
      delete this.activeEffects.shield;
    }
  }

  // 游戏结束
  private gameOver(reason: string): void {
    this.state = 'GAME_OVER';
    if (this.gameLoopId) {
      clearTimeout(this.gameLoopId);
      this.gameLoopId = null;
    }
    audioManager.playGameOver();
    console.log(`游戏结束: ${reason}`);
  }

  // 获取当前游戏状态
  getState(): GameStateData {
    return {
      snake: this.snake,
      direction: this.direction,
      nextDirection: this.nextDirection,
      food: this.food,
      powerUp: this.powerUp,
      state: this.state,
      stats: { ...this.stats },
      config: { ...this.config },
      activeEffects: { ...this.activeEffects }
    };
  }

  // 获取当前速度（考虑效果）
  getCurrentSpeed(): number {
    let speed = this.config.speed;
    if (this.activeEffects.speedBoost) {
      speed = speed / this.activeEffects.speedBoost;
    }
    if (this.activeEffects.slowDown) {
      speed = speed * this.activeEffects.slowDown;
    }
    return speed;
  }

  // 保存最高分
  private saveHighScore(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('snake_high_score', this.stats.highScore.toString());
    }
  }

  // 加载最高分
  private loadHighScore(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snake_high_score');
      if (saved) {
        this.stats.highScore = parseInt(saved, 10);
      }
    }
  }

  // 更新配置
  updateConfig(newConfig: Partial<GameConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.difficulty && !newConfig.speed) {
      this.config.speed = getSpeedByDifficulty(newConfig.difficulty);
    }
  }

  // 获取配置
  getConfig(): GameConfig {
    return { ...this.config };
  }

  // 销毁（清理）
  destroy(): void {
    if (this.gameLoopId) {
      clearTimeout(this.gameLoopId);
      this.gameLoopId = null;
    }
  }
}

// 辅助函数：检查点是否在数组中
function pointInArray(point: Point, array: Point[]): boolean {
  return array.some(p => pointsEqual(p, point));
}