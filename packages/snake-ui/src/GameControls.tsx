import React from 'react';
import type { Difficulty, GameState } from '@snake/core';

interface GameControlsProps {
  state: GameState;
  difficulty: Difficulty;
  wrapWalls: boolean;
  powerUps: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onWrapWallsToggle: () => void;
  onPowerUpsToggle: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  state,
  difficulty,
  wrapWalls,
  powerUps,
  onStart,
  onPause,
  onResume,
  onReset,
  onDifficultyChange,
  onWrapWallsToggle,
  onPowerUpsToggle
}) => {
  const isRunning = state === 'RUNNING';
  const isPaused = state === 'PAUSED';
  const isIdle = state === 'IDLE';
  const isGameOver = state === 'GAME_OVER';

  const difficulties: Difficulty[] = ['EASY', 'MEDIUM', 'HARD', 'EXTREME'];

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h3 style={styles.title}>难度设置</h3>
        <div style={styles.difficultyGrid}>
          {difficulties.map((diff) => (
            <button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              style={{
                ...styles.difficultyButton,
                ...(difficulty === diff ? styles.difficultyActive : {}),
                ...(diff === 'EASY' ? { color: '#4ade80' } :
                    diff === 'MEDIUM' ? { color: '#fbbf24' } :
                    diff === 'HARD' ? { color: '#f87171' } :
                    { color: '#c026d3' })
              }}
              disabled={isRunning}
            >
              {diff === 'EASY' ? '简单' :
               diff === 'MEDIUM' ? '中等' :
               diff === 'HARD' ? '困难' : '极限'}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.title}>游戏选项</h3>
        <div style={styles.optionsContainer}>
          <label style={styles.optionLabel}>
            <input
              type="checkbox"
              checked={wrapWalls}
              onChange={onWrapWallsToggle}
              disabled={isRunning}
            />
            <span>穿墙模式</span>
          </label>
          <label style={styles.optionLabel}>
            <input
              type="checkbox"
              checked={powerUps}
              onChange={onPowerUpsToggle}
              disabled={isRunning}
            />
            <span>启用道具</span>
          </label>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.title}>操作说明</h3>
        <div style={styles.instructions}>
          <p>⌨️ 方向键/WASD - 移动</p>
          <p>⏸️ 空格键 - 暂停/继续</p>
          <p>👆 滑动屏幕 - 控制方向</p>
          <p>🖱️ 点击 - 暂停/继续</p>
        </div>
      </div>
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
    borderRadius: '12px',
    color: '#e2e8f0',
    minWidth: '280px',
    border: '1px solid #334155'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  title: {
    margin: 0,
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  difficultyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px'
  },
  difficultyButton: {
    padding: '8px 12px',
    border: '2px solid #334155',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '12px'
  },
  difficultyActive: {
    backgroundColor: '#334155',
    borderStyle: 'solid',
    transform: 'scale(1.05)'
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '6px 8px',
    borderRadius: '6px',
    backgroundColor: '#0f172a'
  },
  instructions: {
    fontSize: '11px',
    lineHeight: '1.8',
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    padding: '12px',
    borderRadius: '6px',
    fontFamily: 'monospace'
  }
};