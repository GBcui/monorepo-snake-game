import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SnakeGame, audioManager } from '@snake/core';
import type { GameStateData, Direction, Difficulty } from '@snake/core';
import { GameCanvas, GameStats, GameControls, TouchControls, GameOverlay } from '@snake/ui';

function App() {
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const gameRef = useRef<SnakeGame | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // 初始化游戏
  useEffect(() => {
    setIsMounted(true);
    const game = new SnakeGame({
      difficulty: 'MEDIUM',
      gridSize: 20,
      wrapWalls: false,
      powerUps: true
    });
    gameRef.current = game;
    game.init();
    setGameState(game.getState());

    // 从本地存储加载设置
    const savedAudio = localStorage.getItem('snake_audio_enabled');
    const savedVibration = localStorage.getItem('snake_vibration_enabled');

    if (savedAudio !== null) {
      const audioState = savedAudio === 'true';
      setAudioEnabled(audioState);
      audioManager.setEnabled(audioState);
    }

    if (savedVibration !== null) {
      const vibrationState = savedVibration === 'true';
      setVibrationEnabled(vibrationState);
      audioManager.setVibrationEnabled(vibrationState);
    }

    return () => {
      game.destroy();
    };
  }, []);

  // 游戏循环更新UI
  useEffect(() => {
    if (!gameRef.current || !isMounted) return;

    let animationId: number;
    const updateUI = () => {
      if (gameRef.current) {
        const newState = gameRef.current.getState();
        // 只在状态变化时更新，避免频繁重渲染
        if (JSON.stringify(newState) !== JSON.stringify(gameState)) {
          setGameState(newState);
        }
      }
      animationId = requestAnimationFrame(updateUI);
    };

    animationId = requestAnimationFrame(updateUI);
    return () => cancelAnimationFrame(animationId);
  }, [isMounted, gameState]);

  // 控制函数
  const handleStart = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.start();
      setGameState(gameRef.current.getState());
      audioManager.playPause();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.pause();
      setGameState(gameRef.current.getState());
      audioManager.playPause();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.resume();
      setGameState(gameRef.current.getState());
      audioManager.playPause();
    }
  }, []);

  const handleReset = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.reset();
      setGameState(gameRef.current.getState());
    }
  }, []);

  const handleDirectionChange = useCallback((direction: Direction) => {
    if (gameRef.current) {
      gameRef.current.changeDirection(direction);
      setGameState(gameRef.current.getState());
    }
  }, []);

  const handleTogglePause = useCallback(() => {
    if (!gameRef.current || !gameState) return;

    const current = gameState.state;
    if (current === 'RUNNING') {
      handlePause();
    } else if (current === 'PAUSED') {
      handleResume();
    } else if (current === 'IDLE' || current === 'GAME_OVER') {
      handleStart();
    }
  }, [gameState, handlePause, handleResume, handleStart]);

  const handleDifficultyChange = useCallback((difficulty: Difficulty) => {
    if (gameRef.current) {
      gameRef.current.updateConfig({ difficulty });
      setGameState(gameRef.current.getState());
    }
  }, []);

  const handleWrapWallsToggle = useCallback(() => {
    if (gameRef.current) {
      const current = gameRef.current.getConfig();
      gameRef.current.updateConfig({ wrapWalls: !current.wrapWalls });
      setGameState(gameRef.current.getState());
    }
  }, []);

  const handlePowerUpsToggle = useCallback(() => {
    if (gameRef.current) {
      const current = gameRef.current.getConfig();
      gameRef.current.updateConfig({ powerUps: !current.powerUps });
      setGameState(gameRef.current.getState());
    }
  }, []);

  // 设置相关函数
  const handleSettings = useCallback(() => {
    setShowSettings(true);
    audioManager.playPause();
  }, []);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
    audioManager.playPause();
  }, []);

  const handleToggleAudio = useCallback(() => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    audioManager.setEnabled(newState);
    localStorage.setItem('snake_audio_enabled', newState.toString());
    if (newState) audioManager.playPause();
  }, [audioEnabled]);

  const handleToggleVibration = useCallback(() => {
    const newState = !vibrationEnabled;
    setVibrationEnabled(newState);
    audioManager.setVibrationEnabled(newState);
    localStorage.setItem('snake_vibration_enabled', newState.toString());
  }, [vibrationEnabled]);

  if (!gameState) {
    return <div style={styles.loading}>加载中...</div>;
  }

  const currentSpeed = gameRef.current?.getCurrentSpeed() || gameState.config.speed;
  const isGameActive = gameState.state === 'RUNNING';

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🐍 高级贪吃蛇</h1>
        <p style={styles.subtitle}>
          {isGameActive ? '游戏中...' : '准备就绪'}
        </p>
      </header>

      <main style={styles.main}>
        <div style={styles.leftPanel}>
          <div style={styles.canvasContainer}>
            <GameCanvas
              gameState={gameState}
              cellSize={24}
            />
            {/* 触控层 - 仅在游戏运行时显示提示 */}
            <TouchControls
              onDirectionChange={handleDirectionChange}
              onTogglePause={handleTogglePause}
              disabled={!isGameActive}
            />
            {/* 游戏覆盖层 */}
            <GameOverlay
              state={gameState.state}
              difficulty={gameState.config.difficulty}
              score={gameState.stats.score}
              highScore={gameState.stats.highScore}
              onStart={handleStart}
              onReset={handleReset}
              onResume={handleResume}
              onSettings={handleSettings}
              showSettings={showSettings}
              onCloseSettings={handleCloseSettings}
              audioEnabled={audioEnabled}
              vibrationEnabled={vibrationEnabled}
              onToggleAudio={handleToggleAudio}
              onToggleVibration={handleToggleVibration}
            />
          </div>
        </div>

        <div style={styles.rightPanel}>
          <GameStats
            stats={gameState.stats}
            difficulty={gameState.config.difficulty}
            state={gameState.state}
            speed={currentSpeed}
            activeEffects={gameState.activeEffects}
          />

          <GameControls
            state={gameState.state}
            difficulty={gameState.config.difficulty}
            wrapWalls={gameState.config.wrapWalls}
            powerUps={gameState.config.powerUps}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onDifficultyChange={handleDifficultyChange}
            onWrapWallsToggle={handleWrapWallsToggle}
            onPowerUpsToggle={handlePowerUpsToggle}
          />
        </div>
      </main>

      <footer style={styles.footer}>
        <p>🎮 高级贪吃蛇游戏 v2.0 | React + Monorepo + pnpm</p>
        <p>⚡ 特性：音效系统、触控支持、道具系统、难度等级、连击系统、护盾保护</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #4ade80 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  subtitle: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  main: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '20px',
    alignItems: 'start',
    flex: 1
  },
  leftPanel: {
    display: 'flex',
    justifyContent: 'center',
    position: 'relative'
  },
  canvasContainer: {
    position: 'relative',
    display: 'inline-block'
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  footer: {
    textAlign: 'center',
    padding: '16px',
    background: 'rgba(15, 23, 42, 0.6)',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#64748b'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    fontSize: '18px',
    color: '#94a3b8'
  }
};

// 添加CSS动画
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export default App;