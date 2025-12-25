/**
 * 音效管理器
 * 使用 Web Audio API 生成简单的音效
 */

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private vibrationEnabled: boolean = true;

  constructor() {
    // 检查浏览器支持
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // 启用/禁用音效
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  // 启用/禁用震动
  setVibrationEnabled(enabled: boolean): void {
    this.vibrationEnabled = enabled;
  }

  // 播放音效 - 吃食物
  playEat(): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);

    // 震动反馈
    this.vibrate(50);
  }

  // 播放音效 - 游戏结束
  playGameOver(): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);

    // 震动反馈
    this.vibrate([100, 50, 100]);
  }

  // 播放音效 - 收集道具
  playPowerUp(): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);

    // 震动反馈
    this.vibrate(80);
  }

  // 播放音效 - 暂停/继续
  playPause(): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // 播放音效 - 碰撞警告
  playWarning(): void {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);

    // 震动反馈
    this.vibrate(30);
  }

  // 震动反馈
  private vibrate(pattern: number | number[]): void {
    if (!this.vibrationEnabled || typeof navigator === 'undefined') return;

    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  // 检查是否支持
  isSupported(): boolean {
    return this.audioContext !== null;
  }

  // 检查震动支持
  isVibrationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }
}

// 单例实例
export const audioManager = new AudioManager();