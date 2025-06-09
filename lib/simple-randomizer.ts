// Simple TypeScript wrapper for the parameter randomizer

export interface SimpleConfig {
  timing: {
    enabled: boolean
    startTimestamp: {
      min: number
      maxPercentage: number
    }
    length: {
      minSeconds: number
      maxPercentage: number
    }
  }
  blackAndWhite?: {
    enabled: boolean
  }
  speed?: {
    enabled: boolean
    options: number[]
  }
}

export interface RandomizedParameters {
  startTimestamp: number
  length: number
  blackAndWhite?: boolean
  speed?: number
}

// Default simple configuration
export const DEFAULT_CONFIG: SimpleConfig = {
  timing: {
    enabled: true,
    startTimestamp: {
      min: 0,
      maxPercentage: 0.7,
    },
    length: {
      minSeconds: 3,
      maxPercentage: 0.95,
    },
  },
  blackAndWhite: {
    enabled: false,
  },
  speed: {
    enabled: false,
    options: [0.75, 1.0, 1.25],
  },
}

/**
 * Generate random parameters based on video duration
 */
export function randomizeParameters(
  videoDuration: number,
  config: SimpleConfig = DEFAULT_CONFIG,
): RandomizedParameters {
  const result: RandomizedParameters = {
    startTimestamp: 0,
    length: 0,
  }

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
  if (config.blackAndWhite?.enabled) {
    result.blackAndWhite = Math.random() < 0.5 // 50% chance
  }

  // Optional: Speed adjustment
  if (config.speed?.enabled) {
    const speeds = config.speed.options
    result.speed = speeds[Math.floor(Math.random() * speeds.length)]
  }

  return result
}
