// Simple Parameter Randomizer
// Generates a basic JSON config with minimal required parameters

/**
 * Simple config structure for randomization
 */
const DEFAULT_CONFIG = {
  // Required parameters
  timing: {
    enabled: true,
    startTimestamp: {
      min: 0,
      maxPercentage: 0.7, // 70% of video duration
    },
    length: {
      minSeconds: 3,
      maxPercentage: 0.95, // 95% of remaining video
    },
  },

  // Optional parameters
  blackAndWhite: {
    enabled: false, // Set to true to enable randomization
  },
  speed: {
    enabled: false,
    options: [0.75, 1.0, 1.25],
  },
}

/**
 * Generate random parameters based on video duration and a simple config
 * @param {number} videoDuration - Duration of the video in seconds
 * @param {Object} config - Optional configuration object
 * @returns {Object} - Simple JSON config with randomized parameters
 */
function randomizeParameters(videoDuration, config = DEFAULT_CONFIG) {
  // Start with empty result
  const result = {}

  // Always include timing parameters (required)
  if (config.timing.enabled) {
    // Random start timestamp
    const maxStartTime = videoDuration * config.timing.startTimestamp.maxPercentage
    result.startTimestamp = Math.random() * maxStartTime

    // Random length
    const startTime = result.startTimestamp || 0
    const remainingTime = videoDuration - startTime
    const minLength = config.timing.length.minSeconds
    const maxLength = remainingTime * config.timing.length.maxPercentage
    result.length = Math.max(minLength, Math.random() * maxLength)
  }

  // Optional: Black and white filter
  if (config.blackAndWhite && config.blackAndWhite.enabled) {
    result.blackAndWhite = Math.random() < 0.5 // 50% chance
  }

  // Optional: Speed adjustment
  if (config.speed && config.speed.enabled) {
    const speeds = config.speed.options
    result.speed = speeds[Math.floor(Math.random() * speeds.length)]
  }

  return result
}

// Test the randomizer with different durations
console.log("=== Simple Parameter Randomizer ===")

// Test with default config
const testDuration = 20 // 20 seconds video
const params = randomizeParameters(testDuration)
console.log("Default config result:")
console.log(JSON.stringify(params, null, 2))

// Test with custom config (with all options enabled)
const customConfig = {
  timing: {
    enabled: true,
    startTimestamp: {
      min: 0,
      maxPercentage: 0.5, // Only use first half of video
    },
    length: {
      minSeconds: 5, // Minimum 5 seconds
      maxPercentage: 0.8,
    },
  },
  blackAndWhite: {
    enabled: true,
  },
  speed: {
    enabled: true,
    options: [0.5, 1.0, 1.5],
  },
}

const customParams = randomizeParameters(testDuration, customConfig)
console.log("\nCustom config result:")
console.log(JSON.stringify(customConfig, null, 2))
console.log("\nGenerated parameters:")
console.log(JSON.stringify(customParams, null, 2))

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    randomizeParameters,
    DEFAULT_CONFIG,
  }
}
