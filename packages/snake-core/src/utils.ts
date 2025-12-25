/**
 * 工具函数
 */
import type { Point, Direction, Difficulty } from './types.js';

// 生成随机点
export function randomPoint(maxX: number, maxY: number, exclude: Point[] = []): Point {
  let point: Point;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    point = {
      x: Math.floor(Math.random() * maxX),
      y: Math.floor(Math.random() * maxY)
    };
    attempts++;
  } while (exclude.some(p => p.x === point.x && p.y === point.y) && attempts < maxAttempts);

  return point;
}

// 检查点是否相等
export function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

// 检查点是否在数组中
export function pointInArray(point: Point, array: Point[]): boolean {
  return array.some(p => pointsEqual(p, point));
}

// 获取反方向
export function oppositeDirection(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    'UP': 'DOWN',
    'DOWN': 'UP',
    'LEFT': 'RIGHT',
    'RIGHT': 'LEFT'
  };
  return opposites[dir];
}

// 根据难度获取速度
export function getSpeedByDifficulty(difficulty: Difficulty): number {
  const speeds: Record<Difficulty, number> = {
    'EASY': 200,
    'MEDIUM': 150,
    'HARD': 100,
    'EXTREME': 60
  };
  return speeds[difficulty];
}

// 获取难度颜色
export function getDifficultyColor(difficulty: Difficulty): string {
  const colors: Record<Difficulty, string> = {
    'EASY': '#4ade80',
    'MEDIUM': '#fbbf24',
    'HARD': '#f87171',
    'EXTREME': '#c026d3'
  };
  return colors[difficulty];
}

// 格式化时间
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 计算分数
export function calculateScore(basePoints: number, multiplier: number, combo: number = 1): number {
  return Math.floor(basePoints * multiplier * combo);
}

// 生成唯一ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}