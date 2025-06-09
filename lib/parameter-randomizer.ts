// TypeScript wrapper for the parameter randomizer

export interface VideoMetadata {
  duration: number
  width?: number
  height?: number
}

export interface VideoConfig {
  startTimestamp: number
  length: number
  blackAndWhiteFilter: boolean
  brightness: number
  contrast: number
  saturation: number
  playbackSpeed: number
  volumeLevel: number
  audioFadeIn: boolean
  audioFadeOut: boolean
  fadeInDuration: number
  fadeOutDuration: number
  generatedAt: string
  originalDuration: number
}

export class ParameterRandomizer {
  private videoDuration: number
  private videoWidth: number
  private videoHeight: number

  constructor(videoMetadata: VideoMetadata) {
    this.videoDuration = videoMetadata.duration || 30
    this.videoWidth = videoMetadata.width || 1080
    this.videoHeight = videoMetadata.height || 1920
  }

  generateConfig(): VideoConfig {
    const config: VideoConfig = {
      startTimestamp: this.randomizeStartTimestamp(),
      length: 0, // Will be set after validation
      blackAndWhiteFilter: this.randomizeBoolean(),
      brightness: this.randomizeRange(0.5, 1.5),
      contrast: this.randomizeRange(0.8, 1.2),
      saturation: this.randomizeRange(0.7, 1.3),
      playbackSpeed: this.randomizePlaybackSpeed(),
      volumeLevel: this.randomizeRange(0.8, 1.0),
      audioFadeIn: this.randomizeBoolean(),
      audioFadeOut: this.randomizeBoolean(),
      fadeInDuration: this.randomizeRange(0, 1),
      fadeOutDuration: this.randomizeRange(0, 1),
      generatedAt: new Date().toISOString(),
      originalDuration: this.videoDuration,
    }

    config.length = this.validateLength(config.startTimestamp, this.randomizeLength())

    return config
  }

  private randomizeStartTimestamp(): number {
    const maxStartTime = this.videoDuration * 0.7
    return Math.random() * maxStartTime
  }

  private randomizeLength(): number {
    const minLength = 3
    const maxLength = this.videoDuration * 0.95
    return Math.max(minLength, Math.random() * maxLength)
  }

  private validateLength(startTimestamp: number, length: number): number {
    const remainingTime = this.videoDuration - startTimestamp
    const maxAllowedLength = remainingTime * 0.95
    const minLength = 3

    return Math.max(minLength, Math.min(length, maxAllowedLength))
  }

  private randomizeBoolean(): boolean {
    return Math.random() < 0.5
  }

  private randomizeRange(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  private randomizePlaybackSpeed(): number {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
    return speeds[Math.floor(Math.random() * speeds.length)]
  }

  printConfig(config: VideoConfig): VideoConfig {
    console.log("=== Generated Video Config ===")
    console.log(JSON.stringify(config, null, 2))
    console.log("==============================")
    return config
  }
}
