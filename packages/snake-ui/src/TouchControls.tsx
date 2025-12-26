import React, { useState, useRef, useEffect } from 'react';
import type { Direction } from '@snake/core';

interface TouchControlsProps {
  onDirectionChange: (direction: Direction) => void;
  onTogglePause: () => void;
  disabled?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionChange,
  onTogglePause,
  disabled = false
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const swipeThreshold = 30; // 最小滑动距离
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (disabled || !touchStart) return;
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (disabled || !touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // 检测点击（小移动）
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      onTogglePause();
      setTouchStart(null);
      setTouchEnd(null);
      return;
    }

    // 检测滑动方向
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // 水平滑动
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          onDirectionChange('RIGHT');
        } else {
          onDirectionChange('LEFT');
        }
      }
    } else {
      // 垂直滑动
      if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) {
          onDirectionChange('DOWN');
        } else {
          onDirectionChange('UP');
        }
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // 键盘快捷键支持
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
        W: 'UP',
        S: 'DOWN',
        A: 'LEFT',
        D: 'RIGHT'
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        onDirectionChange(keyMap[e.key]);
      }

      if (e.key === ' ') {
        e.preventDefault();
        onTogglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onDirectionChange, onTogglePause]);

  return (
    <div
      ref={containerRef}
      style={{
        ...styles.container,
        ...(disabled ? styles.disabled : styles.enabled)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={(e) => {
        // 鼠标支持
        if (disabled) return;
        const mouseEvent = e as any;
        handleTouchStart({ touches: [{ clientX: mouseEvent.clientX, clientY: mouseEvent.clientY }] } as any);
      }}
      onMouseMove={(e) => {
        if (disabled || !touchStart) return;
        const mouseEvent = e as any;
        handleTouchMove({ touches: [{ clientX: mouseEvent.clientX, clientY: mouseEvent.clientY }] } as any);
      }}
      onMouseUp={handleTouchEnd}
    >
      <div style={styles.hint}>
        {disabled ? '🎮 游戏已结束' : '👆 滑动控制方向，点击暂停'}
      </div>
      {touchStart && touchEnd && !disabled && (
        <div style={styles.debug}>
          {Math.round(touchEnd.x - touchStart.x)}, {Math.round(touchEnd.y - touchStart.y)}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    touchAction: 'none',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    cursor: 'pointer',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    border: '2px solid transparent'
  },
  enabled: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3b82f6',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
  },
  disabled: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: '#64748b',
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  hint: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#e2e8f0',
    padding: '8px 16px',
    borderRadius: '6px',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'inline-block',
    pointerEvents: 'none'
  },
  debug: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontFamily: 'monospace',
    pointerEvents: 'none'
  }
};