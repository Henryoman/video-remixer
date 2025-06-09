// Parameter Randomizer and Config Printer
// Takes video metadata and generates randomized JSON config

class ParameterRandomizer {
  constructor(videoMetadata) {
    this.videoDuration = videoMetadata.duration || 30
    this.videoWidth = videoMetadata.width || 1080
    this.videoHeight = videoMetadata.height || 1920
  }

  // Generate randomized parameters based on video metadata
  generateConfig() {
    const config = {
      // Timing parameters
      startTimestamp: this.randomizeStartTimestamp(),
      length: this.randomizeLength(),

      // Visual effects
      blackAndWhiteFilter: this.randomizeBoolean(),
      brightness: this.randomizeRange(0.5, 1.5),
      contrast: this.randomizeRange(0.8, 1.2),
      saturation: this.randomizeRange(0.7, 1.3),

      // Speed and playback
      playbackSpeed: this.randomizePlaybackSpeed(),

      // Audio
      volumeLevel: this.randomizeRange(0.8, 1.0),
      audioFadeIn: this.randomizeBoolean(),
      audioFadeOut: this.randomizeBoolean(),

      // Transitions
      fadeInDuration: this.randomizeRange(0, 1),
      fadeOutDuration: this.randomizeRange(0, 1),

      // Metadata
      generatedAt: new Date().toISOString(),
      originalDuration: this.videoDuration,
    }

    // Ensure length doesn't exceed available time after start timestamp
    config.length = this.validateLength(config.startTimestamp, config.length)

    return config
  }

  // Randomize start timestamp (0 to 70% of video duration)
  randomizeStartTimestamp() {
    const maxStartTime = this.videoDuration * 0.7
    return Math.random() * maxStartTime
  }

  // Randomize clip length (3 seconds minimum, 95% of remaining time maximum)
  randomizeLength() {
    const minLength = 3
    const maxLength = this.videoDuration * 0.95
    return Math.max(minLength, Math.random() * maxLength)
  }

  // Validate that length doesn't exceed available time
  validateLength(startTimestamp, length) {
    const remainingTime = this.videoDuration - startTimestamp
    const maxAllowedLength = remainingTime * 0.95
    const minLength = 3

    return Math.max(minLength, Math.min(length, maxAllowedLength))
  }

  // Randomize boolean values (50/50 chance)
  randomizeBoolean() {
    return Math.random() < 0.5
  }

  // Randomize values within a range
  randomizeRange(min, max) {
    return Math.random() * (max - min) + min
  }

  // Randomize playback speed with common values
  randomizePlaybackSpeed() {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
    return speeds[Math.floor(Math.random() * speeds.length)]
  }

  // Print formatted JSON config
  printConfig(config) {
    console.log("=== Generated Video Config ===")
    console.log(JSON.stringify(config, null, 2))
    console.log("==============================")
    return config
  }
}

// Example usage and testing
function testParameterRandomizer() {
  console.log("Testing Parameter Randomizer...\n")

  // Test with different video metadata
  const testCases = [
    { duration: 15, width: 1080, height: 1920 },
    { duration: 30, width: 1080, height: 1920 },
    { duration: 8, width: 1080, height: 1920 },
  ]

  testCases.forEach((metadata, index) => {
    console.log(`Test Case ${index + 1}: ${metadata.duration}s video`)
    const randomizer = new ParameterRandomizer(metadata)
    const config = randomizer.generateConfig()
    randomizer.printConfig(config)
    console.log("\n")
  })
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ParameterRandomizer }
}

// Run tests
testParameterRandomizer()
