import React from 'react';
import type { GameState, Difficulty } from '@snake/core';
import { getDifficultyColor } from '@snake/core';

interface GameOverlayProps {
  state: GameState;
  difficulty: Difficulty;
  score: number;
  highScore: number;
  onStart: () => void;
  onReset: () => void;
  onResume: () => void;
  onSettings: () => void;
  showSettings: boolean;
  onCloseSettings: () => void;
  audioEnabled: boolean;
  vibrationEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVibration: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({
  state,
  difficulty,
  score,
  highScore,
  onStart,
  onReset,
  onResume,
  onSettings,
  showSettings,
  onCloseSettings,
  audioEnabled,
  vibrationEnabled,
  onToggleAudio,
  onToggleVibration
}) => {
  const isVisible = state === 'IDLE' || state === 'GAME_OVER' || state === 'PAUSED' || showSettings;

  if (!isVisible) return null;

  const difficultyColor = getDifficultyColor(difficulty);

  const getOverlayContent = () => {
    if (showSettings) {
      return {
        title: '⚙️ 游戏设置',
        subtitle: '自定义你的游戏体验',
        content: (
          <div style={styles.settingsContent}>
            <div style={styles.settingItem}>
              <span>🔊 音效</span>
              <button
                onClick={onToggleAudio}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: audioEnabled ? '#4ade80' : '#ef4444'
                }}
              >
                {audioEnabled ? '开启' : '关闭'}
              </button>
            </div>
            <div style={styles.settingItem}>
              <span>📳 震动</span>
              <button
                onClick={onToggleVibration}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: vibrationEnabled ? '#4ade80' : '#ef4444'
                }}
              >
                {vibrationEnabled ? '开启' : '关闭'}
              </button>
            </div>
            <button onClick={onCloseSettings} style={styles.primaryBtn}>
              返回
            </button>
          </div>
        )
      };
    }

    if (state === 'IDLE') {
      return {
        title: '🐍 贪吃蛇',
        subtitle: '经典游戏，全新体验',
        content: (
          <div style={styles.content}>
            <div style={styles.stats}>
              <div>最高分: <span style={{ color: '#4ade80' }}>{highScore}</span></div>
              <div>难度: <span style={{ color: difficultyColor }}>{difficulty}</span></div>
            </div>
            <div style={styles.buttonGroup}>
              <button onClick={onStart} style={styles.primaryBtn}>
                开始游戏
              </button>
              <button onClick={onSettings} style={styles.secondaryBtn}>
                设置
              </button>
            </div>
            <div style={styles.tips}>
              <p>🎯 准备开始游戏</p>
              <p>点击"开始游戏"按钮或按空格键</p>
            </div>
          </div>
        )
      };
    }

    if (state === 'GAME_OVER') {
      return {
        title: '💀 游戏结束',
        subtitle: `最终得分: ${score}`,
        content: (
          <div style={styles.content}>
            <div style={styles.stats}>
              <div>本局得分: <span style={{ color: '#fbbf24' }}>{score}</span></div>
              <div>最高记录: <span style={{ color: '#4ade80' }}>{highScore}</span></div>
              {score >= highScore && score > 0 && (
                <div style={{ color: '#4ade80', fontWeight: 'bold', marginTop: '8px' }}>
                  🎉 新纪录！
                </div>
              )}
            </div>
            <div style={styles.buttonGroup}>
              <button onClick={onReset} style={styles.primaryBtn}>
                再来一局
              </button>
              <button onClick={onStart} style={styles.secondaryBtn}>
                返回主页
              </button>
            </div>
          </div>
        )
      };
    }

    if (state === 'PAUSED') {
      return {
        title: '⏸️ 已暂停',
        subtitle: '休息一下，马上继续',
        content: (
          <div style={styles.content}>
            <div style={styles.stats}>
              <div>当前得分: <span style={{ color: '#fbbf24' }}>{score}</span></div>
              <div>难度: <span style={{ color: difficultyColor }}>{difficulty}</span></div>
            </div>
            <div style={styles.buttonGroup}>
              <button onClick={onResume} style={styles.primaryBtn}>
                继续游戏
              </button>
              <button onClick={onReset} style={styles.dangerBtn}>
                重新开始
              </button>
            </div>
            <button onClick={onSettings} style={styles.linkBtn}>
              设置
            </button>
          </div>
        )
      };
    }

    return { title: '', subtitle: '', content: null };
  };

  const { title, subtitle, content } = getOverlayContent();

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h1 style={styles.title}>{title}</h1>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        {content}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.3s ease'
  },
  modal: {
    backgroundColor: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    border: '2px solid #334155',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    animation: 'scaleIn 0.3s ease'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #334155',
    paddingBottom: '16px'
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #4ade80 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '16px',
    color: '#94a3b8'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px'
  },
  secondaryBtn: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#475569',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px'
  },
  dangerBtn: {
    flex: 1,
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#ef4444',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px'
  },
  linkBtn: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '14px',
    textDecoration: 'underline'
  },
  tips: {
    padding: '12px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600'
  },
  settingsContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#0f172a',
    borderRadius: '8px'
  },
  toggleBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '60px'
  }
};