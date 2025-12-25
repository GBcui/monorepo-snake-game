import React from 'react';
import type { GameStats as GameStatsType, Difficulty, GameState } from '@snake/core';
import { formatTime, getDifficultyColor } from '@snake/core';

interface GameStatsProps {
  stats: GameStatsType;
  difficulty: Difficulty;
  state: GameState;
  speed: number;
  activeEffects: {
    speedBoost?: number;
    doublePoints?: number;
    shield?: number;
    slowDown?: number;
  };
}

export const GameStats: React.FC<GameStatsProps> = ({
  stats,
  difficulty,
  state,
  speed,
  activeEffects
}) => {
  const difficultyColor = getDifficultyColor(difficulty);

  const effects = Object.entries(activeEffects).filter(([_, value]) => value);

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.title}>游戏状态</h3>
        <div style={styles.statRow}>
          <span>状态:</span>
          <span style={{ ...styles.value, color: state === 'RUNNING' ? '#4ade80' : state === 'PAUSED' ? '#fbbf24' : '#f87171' }}>
            {state === 'RUNNING' ? '运行中' : state === 'PAUSED' ? '已暂停' : state === 'GAME_OVER' ? '游戏结束' : '准备就绪'}
          </span>
        </div>
        <div style={styles.statRow}>
          <span>难度:</span>
          <span style={{ ...styles.value, color: difficultyColor }}>{difficulty}</span>
        </div>
        <div style={styles.statRow}>
          <span>速度:</span>
          <span style={styles.value}>{speed}ms</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.title}>分数统计</h3>
        <div style={styles.statRow}>
          <span>当前分数:</span>
          <span style={{ ...styles.value, color: '#fbbf24', fontWeight: 'bold' }}>{stats.score}</span>
        </div>
        <div style={styles.statRow}>
          <span>最高分数:</span>
          <span style={{ ...styles.value, color: '#4ade80' }}>{stats.highScore}</span>
        </div>
        <div style={styles.statRow}>
          <span>蛇身长度:</span>
          <span style={styles.value}>{stats.length}</span>
        </div>
        <div style={styles.statRow}>
          <span>吃掉苹果:</span>
          <span style={styles.value}>{stats.applesEaten}</span>
        </div>
        <div style={styles.statRow}>
          <span>收集道具:</span>
          <span style={styles.value}>{stats.powerUpsCollected}</span>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.title}>游戏时间</h3>
        <div style={styles.statRow}>
          <span>已玩时间:</span>
          <span style={styles.value}>{formatTime(stats.timeElapsed)}</span>
        </div>
      </div>

      {effects.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.title}>活跃效果</h3>
          <div style={styles.effectsContainer}>
            {effects.map(([key, value]) => {
              let label = '';
              let color = '';

              switch (key) {
                case 'speedBoost':
                  label = '⚡ 加速';
                  color = '#3b82f6';
                  break;
                case 'doublePoints':
                  label = '2x 双倍';
                  color = '#eab308';
                  break;
                case 'shield':
                  label = '🛡️ 护盾';
                  color = '#06b6d4';
                  break;
                case 'slowDown':
                  label = '🐌 减速';
                  color = '#a855f7';
                  break;
              }

              return (
                <div key={key} style={{ ...styles.effectBadge, borderColor: color }}>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    color: '#e2e8f0',
    minWidth: '250px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '8px',
    backgroundColor: '#0f172a',
    borderRadius: '6px'
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    padding: '4px 0',
    borderBottom: '1px solid #1e293b'
  },
  value: {
    fontWeight: '600',
    fontFamily: 'monospace'
  },
  effectsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  effectBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '2px solid',
    backgroundColor: '#1e293b',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
};