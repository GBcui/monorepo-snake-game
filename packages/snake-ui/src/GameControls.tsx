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
        <h3 style={styles.title}>游戏控制</h3>
        <div style={styles.buttonGroup}>
          {(isIdle || isGameOver) && (
            <button onClick={onStart} style={styles.primaryButton}>
              开始游戏
            </button>
          )}
          {isRunning && (
            <button onClick={onPause} style={styles.warningButton}>
              暂停
            </button>
          )}
          {isPaused && (
            <button onClick={onResume} style={styles.successButton}>
              继续
            </button>
          )}
          {!isIdle && (
            <button onClick={onReset} style={styles.dangerButton}>
              重置
            </button>
          )}
        </div>
      </div>

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
          <p>🎮 使用方向键控制蛇的移动</p>
          <p>⏸️ 空格键可以暂停/继续游戏</p>
          <p>🍎 吃掉红色苹果增加分数</p>
          <p>⚡ 收集彩色道具获得特殊能力</p>
          <p>💀 避免撞墙或撞到自己</p>
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
    borderRadius: '8px',
    color: '#e2e8f0',
    minWidth: '280px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.2s'
  },
  successButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#22c55e',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.2s'
  },
  warningButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#f59e0b',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.2s'
  },
  dangerButton: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    flex: 1,
    transition: 'background-color 0.2s'
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
    transition: 'all 0.2s'
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
    fontSize: '13px'
  },
  instructions: {
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    padding: '12px',
    borderRadius: '6px'
  }
};