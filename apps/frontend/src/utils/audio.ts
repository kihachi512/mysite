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
  private sfxCache: Map<SoundEffect, HTMLAudioElement> = new Map()

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

  // Generate simple tones for sound effects using Web Audio API
  private generateTone(frequency: number, duration: number, type: OscillatorType = 'sine'): Promise<void> {
    return new Promise((resolve) => {
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
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
        
        oscillator.onended = () => {
          audioContext.close()
          resolve()
        }
      } catch (error) {
        logger.error('Failed to generate tone:', error)
        resolve()
      }
    })
  }

  // Generate complex sound effects
  private async generateComplexSound(type: SoundEffect): Promise<void> {
    if (this.isMuted) return

    try {
      switch (type) {
        case 'click':
          await this.generateTone(800, 0.1, 'square')
          break
        
        case 'success':
          await this.generateTone(523, 0.15) // C5
          await this.generateTone(659, 0.15) // E5
          await this.generateTone(784, 0.3)  // G5
          break
        
        case 'error':
          await this.generateTone(200, 0.2, 'sawtooth')
          await this.generateTone(150, 0.2, 'sawtooth')
          break
        
        case 'notification':
          await this.generateTone(1000, 0.1)
          await new Promise(resolve => setTimeout(resolve, 50))
          await this.generateTone(800, 0.1)
          break
        
        case 'coin':
          await this.generateTone(1319, 0.1) // E6
          await this.generateTone(1568, 0.15) // G6
          break
        
        case 'powerup':
          for (let i = 0; i < 5; i++) {
            await this.generateTone(400 + (i * 100), 0.08)
            await new Promise(resolve => setTimeout(resolve, 30))
          }
          break
        
        case 'achievement':
          const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
          for (const note of notes) {
            await this.generateTone(note, 0.2)
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          break
      }
    } catch (error) {
      logger.error('Failed to generate complex sound:', error)
    }
  }

  private preloadSounds(): void {
    // Preload sound effects
    const effects: SoundEffect[] = ['click', 'success', 'error', 'notification', 'coin', 'powerup', 'achievement']
    
    effects.forEach(effect => {
      // For now, we'll generate sounds on-demand rather than preload
      // This could be expanded to use actual audio files in the future
    })
  }

  // Generate simple background music loops
  private async generateBackgroundMusic(type: BackgroundMusic): Promise<HTMLAudioElement> {
    // For now, we'll create a simple looping tone
    // In a real implementation, this would load actual music files
    const audio = new Audio()
    
    // Create a data URL for a simple generated tone
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const duration = 4 // seconds
    const sampleRate = audioContext.sampleRate
    const frameCount = sampleRate * duration
    const arrayBuffer = audioContext.createBuffer(2, frameCount, sampleRate)
    
    for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
      const channelData = arrayBuffer.getChannelData(channel)
      
      for (let i = 0; i < frameCount; i++) {
        // Generate a simple ambient tone based on music type
        let frequency = 220 // Base A3
        
        switch (type) {
          case 'home':
          case 'peaceful':
            frequency = 220 + Math.sin(i / sampleRate * 2 * Math.PI) * 20
            break
          case 'games':
          case 'intense':
            frequency = 330 + Math.sin(i / sampleRate * 4 * Math.PI) * 30
            break
          case 'celebration':
            frequency = 440 + Math.sin(i / sampleRate * 8 * Math.PI) * 50
            break
          case 'menu':
            frequency = 260 + Math.sin(i / sampleRate * 1 * Math.PI) * 15
            break
        }
        
        channelData[i] = Math.sin(i / sampleRate * frequency * 2 * Math.PI) * 0.1
      }
    }
    
    // This is a simplified approach - in practice you'd use actual music files
    logger.debug(`Generated background music for ${type}`)
    
    return audio
  }

  // Public methods
  public async playSound(effect: SoundEffect): Promise<void> {
    if (this.isMuted) return
    
    try {
      await this.generateComplexSound(effect)
      logger.debug(`Played sound effect: ${effect}`)
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
      }
      
      // For now, we'll just log the BGM change
      // In a full implementation, this would play actual music files
      this.currentBgm = type
      logger.debug(`Changed background music to: ${type}`)
      
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

// Audio context helper for user gesture requirement
export const initializeAudio = () => {
  // Modern browsers require user interaction to play audio
  // This function can be called on first user interaction
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    logger.debug('Audio context initialized')
  } catch (error) {
    logger.error('Failed to initialize audio context:', error)
  }
}