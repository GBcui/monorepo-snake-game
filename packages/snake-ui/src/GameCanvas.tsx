import React, { useEffect, useRef, memo } from 'react';
import type { GameStateData, Point, PowerUpType } from '@snake/core';

interface GameCanvasProps {
  gameState: GameStateData;
  cellSize: number;
}

const COLORS = {
  snake: '#4ade80',
  snakeHead: '#22c55e',
  food: '#ef4444',
  background: '#1e293b',
  grid: '#334155',
  powerUps: {
    SPEED_BOOST: '#3b82f6',
    SLOW_DOWN: '#a855f7',
    DOUBLE_POINTS: '#eab308',
    SHIELD: '#06b6d4'
  }
};

const POWER_UP_SYMBOLS: Record<PowerUpType, string> = {
  SPEED_BOOST: '⚡',
  SLOW_DOWN: '🐌',
  DOUBLE_POINTS: '2x',
  SHIELD: '🛡️'
};

export const GameCanvas: React.FC<GameCanvasProps> = memo(({ gameState, cellSize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { snake, food, powerUp, config } = gameState;
    const size = config.gridSize * cellSize;

    // 清空画布
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, size, size);

    // 绘制网格
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= config.gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    // 绘制食物
    if (food) {
      ctx.fillStyle = COLORS.food;
      ctx.beginPath();
      ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // 绘制道具
    if (powerUp) {
      const color = COLORS.powerUps[powerUp.type];
      ctx.fillStyle = color;
      ctx.fillRect(
        powerUp.position.x * cellSize + 2,
        powerUp.position.y * cellSize + 2,
        cellSize - 4,
        cellSize - 4
      );

      // 绘制道具符号
      ctx.fillStyle = '#fff';
      ctx.font = `${cellSize * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        POWER_UP_SYMBOLS[powerUp.type],
        powerUp.position.x * cellSize + cellSize / 2,
        powerUp.position.y * cellSize + cellSize / 2
      );
    }

    // 绘制蛇
    snake.forEach((segment: Point, index: number) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snake;

      const x = segment.x * cellSize + 1;
      const y = segment.y * cellSize + 1;
      const w = cellSize - 2;
      const h = cellSize - 2;

      // 圆角矩形
      const radius = 3;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + w - radius, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
      ctx.lineTo(x + w, y + h - radius);
      ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      ctx.lineTo(x + radius, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      // 蛇头眼睛
      if (isHead) {
        ctx.fillStyle = '#fff';
        const eyeSize = 2;
        const eyeOffset = cellSize / 4;

        // 根据方向调整眼睛位置
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

        switch (gameState.direction) {
          case 'UP':
            leftEyeX = x + eyeOffset;
            leftEyeY = y + eyeOffset;
            rightEyeX = x + w - eyeOffset;
            rightEyeY = y + eyeOffset;
            break;
          case 'DOWN':
            leftEyeX = x + eyeOffset;
            leftEyeY = y + h - eyeOffset;
            rightEyeX = x + w - eyeOffset;
            rightEyeY = y + h - eyeOffset;
            break;
          case 'LEFT':
            leftEyeX = x + eyeOffset;
            leftEyeY = y + eyeOffset;
            rightEyeX = x + eyeOffset;
            rightEyeY = y + h - eyeOffset;
            break;
          case 'RIGHT':
            leftEyeX = x + w - eyeOffset;
            leftEyeY = y + eyeOffset;
            rightEyeX = x + w - eyeOffset;
            rightEyeY = y + h - eyeOffset;
            break;
        }

        ctx.fillRect(leftEyeX - eyeSize/2, leftEyeY - eyeSize/2, eyeSize, eyeSize);
        ctx.fillRect(rightEyeX - eyeSize/2, rightEyeY - eyeSize/2, eyeSize, eyeSize);
      }
    });

    // 绘制护盾效果
    if (gameState.activeEffects.shield) {
      ctx.strokeStyle = COLORS.powerUps.SHIELD;
      ctx.lineWidth = 3;
      ctx.strokeRect(2, 2, size - 4, size - 4);
    }

  }, [gameState, cellSize]);

  const size = gameState.config.gridSize * cellSize;

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        border: '2px solid #475569',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        background: COLORS.background
      }}
    />
  );
});

GameCanvas.displayName = 'GameCanvas';