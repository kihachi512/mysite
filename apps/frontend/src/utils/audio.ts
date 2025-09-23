// Audio system for background music and sound effects
import { logger } from './logger'

export type SoundEffect = 'click' | 'success' | 'error' | 'notification' | 'coin' | 'powerup' | 'achievement'
export type BackgroundMusic = 'home' | 'games' | 'peaceful' | 'intense' | 'celebration' | 'menu'

class AudioManager {
  private bgmAudio: HTMLAudioElement | null = null
  private currentBgm: BackgroundMusic | null = null
  private isMuted: boolean = false
  private bgmVolume: number = 0.3
  private sfxVolume: number = 0.5
  // private sfxCache: Map<SoundEffect, HTMLAudioElement> = new Map() // 将来の拡張用

  constructor() {
    this.loadSettings()
    this.preloadSounds()
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('audio-settings')
      if (saved) {
        const settings = JSON.parse(saved)
        this.isMuted = settings.isMuted ?? false
        this.bgmVolume = Math.max(0, Math.min(1, settings.bgmVolume ?? 0.3))
        this.sfxVolume = Math.max(0, Math.min(1, settings.sfxVolume ?? 0.5))
      }
    } catch (error) {
      logger.error('Failed to load audio settings:', error)
    }
  }

  private saveSettings(): void {
    try {
      const settings = {
        isMuted: this.isMuted,
        bgmVolume: this.bgmVolume,
        sfxVolume: this.sfxVolume
      }
      localStorage.setItem('audio-settings', JSON.stringify(settings))
    } catch (error) {
      logger.error('Failed to save audio settings:', error)
    }
  }

  // 軽量な効果音生成（Audio Context の再利用）
  private audioContext: AudioContext | null = null
  
  private getOrCreateAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return this.audioContext
  }

  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    return new Promise((resolve) => {
      try {
        const audioContext = this.getOrCreateAudioContext()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
        oscillator.type = type
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.1, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + duration)
        
        oscillator.onended = () => resolve()
      } catch (error) {
        logger.error('Failed to generate tone:', error)
        resolve()
      }
    })
  }

  // 軽量化された効果音生成（シンプルな単音）
  private async generateSimpleSound(type: SoundEffect): Promise<void> {
    if (this.isMuted) return

    try {
      const soundConfig = {
        'click': { freq: 800, duration: 0.1, type: 'square' as OscillatorType },
        'success': { freq: 784, duration: 0.3, type: 'sine' as OscillatorType }, // G5
        'error': { freq: 200, duration: 0.2, type: 'sawtooth' as OscillatorType },
        'notification': { freq: 1000, duration: 0.15, type: 'sine' as OscillatorType },
        'coin': { freq: 1319, duration: 0.2, type: 'sine' as OscillatorType }, // E6
        'powerup': { freq: 800, duration: 0.25, type: 'square' as OscillatorType },
        'achievement': { freq: 1047, duration: 0.4, type: 'sine' as OscillatorType } // C6
      }

      const config = soundConfig[type]
      if (config) {
        await this.generateTone(config.freq, config.duration, config.type)
        logger.debug(`🔊 効果音再生: ${type} (${config.freq}Hz)`)
      }
    } catch (error) {
      logger.error('Failed to generate sound:', error)
    }
  }

  private preloadSounds(): void {
    // 将来の拡張用：現在は必要時に生成
    // const effects: SoundEffect[] = ['click', 'success', 'error', 'notification', 'coin', 'powerup', 'achievement']
    // 実際の音声ファイルを使用する場合はここで事前読み込み
  }

  // BGM管理（軽量化：実際の音楽ファイルがない場合はログのみ）
  private getBgmConfig(type: BackgroundMusic): { name: string; mood: string } {
    const configs = {
      'home': { name: '🏠 ホーム', mood: 'リラックス' },
      'games': { name: '🎮 ゲーム', mood: 'アップテンポ' },
      'peaceful': { name: '🌸 平和', mood: '穏やか' },
      'intense': { name: '⚡ 緊張', mood: 'ドラマティック' },
      'celebration': { name: '🎉 お祝い', mood: '楽しげ' },
      'menu': { name: '⚙️ メニュー', mood: 'ニュートラル' }
    }
    return configs[type] || { name: 'Unknown', mood: 'Default' }
  }

  // Public methods
  public async playSound(effect: SoundEffect): Promise<void> {
    if (this.isMuted) return
    
    try {
      await this.generateSimpleSound(effect)
    } catch (error) {
      logger.error('Failed to play sound effect:', error)
    }
  }

  public async playBackgroundMusic(type: BackgroundMusic): Promise<void> {
    if (this.currentBgm === type || this.isMuted) return
    
    try {
      // Stop current BGM
      if (this.bgmAudio) {
        this.bgmAudio.pause()
        this.bgmAudio.currentTime = 0
        this.bgmAudio = null
      }
      
      // 軽量化：実際の音楽ファイルは使わず、BGMの切り替えをログのみで表現
      // 実装時は音楽ファイルをロードする処理に置き換え可能
      const config = this.getBgmConfig(type)
      this.currentBgm = type
      
      logger.debug(`🎵 BGM切り替え: ${config.name} (${config.mood})`)
      
      // 将来的に音楽ファイルを使う場合の例：
      // this.bgmAudio = new Audio(`/audio/bgm/${type}.mp3`)
      // this.bgmAudio.volume = this.bgmVolume
      // this.bgmAudio.loop = true
      // await this.bgmAudio.play()
      
    } catch (error) {
      logger.error('Failed to play background music:', error)
    }
  }

  public stopBackgroundMusic(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause()
      this.bgmAudio.currentTime = 0
    }
    this.currentBgm = null
    logger.debug('Stopped background music')
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted
    
    if (muted && this.bgmAudio) {
      this.bgmAudio.pause()
    } else if (!muted && this.currentBgm) {
      // Resume BGM if not muted
      this.playBackgroundMusic(this.currentBgm)
    }
    
    this.saveSettings()
    logger.debug(`Audio muted: ${muted}`)
  }

  public setBgmVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume))
    
    if (this.bgmAudio) {
      this.bgmAudio.volume = this.bgmVolume
    }
    
    this.saveSettings()
    logger.debug(`BGM volume set to: ${this.bgmVolume}`)
  }

  public setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.saveSettings()
    logger.debug(`SFX volume set to: ${this.sfxVolume}`)
  }

  // Getters
  public get isMutedState(): boolean { return this.isMuted }
  public get bgmVolumeLevel(): number { return this.bgmVolume }
  public get sfxVolumeLevel(): number { return this.sfxVolume }
  public get currentBackgroundMusic(): BackgroundMusic | null { return this.currentBgm }

  // 初期化用パブリックメソッド
  public initializeAudioContext(): void {
    this.getOrCreateAudioContext()
  }
}

// Singleton instance
export const audioManager = new AudioManager()

// Convenient helper functions
export const playSound = (effect: SoundEffect) => audioManager.playSound(effect)
export const playBGM = (type: BackgroundMusic) => audioManager.playBackgroundMusic(type)
export const stopBGM = () => audioManager.stopBackgroundMusic()
export const setAudioMuted = (muted: boolean) => audioManager.setMuted(muted)
export const setBgmVolume = (volume: number) => audioManager.setBgmVolume(volume)
export const setSfxVolume = (volume: number) => audioManager.setSfxVolume(volume)

// Audio context helper for user gesture requirement (軽量化)
export const initializeAudio = () => {
  // Modern browsers require user interaction to play audio
  // This function can be called on first user interaction
  try {
    // AudioManagerのAudioContextを初期化
    audioManager.initializeAudioContext()
    logger.debug('🎵 Audio system initialized')
  } catch (error) {
    logger.error('Failed to initialize audio system:', error)
  }
}