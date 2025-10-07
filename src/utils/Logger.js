/**
 * Logger utility for KhulnaSoft Development Space Engine
 *
 * Provides structured logging with different levels, formatting,
 * and output destinations.
 */

export class Logger {
  static levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  }

  static currentLevel = 'info'

  static setLevel(level) {
    if (level in this.levels) {
      this.currentLevel = level
    } else {
      console.warn(`Invalid log level: ${level}. Using 'info'`)
      this.currentLevel = 'info'
    }
  }

  static error(...args) {
    if (this.levels[this.currentLevel] >= this.levels.error) {
      console.error(`❌ [${new Date().toISOString()}]`, ...args)
    }
  }

  static warn(...args) {
    if (this.levels[this.currentLevel] >= this.levels.warn) {
      console.warn(`⚠️ [${new Date().toISOString()}]`, ...args)
    }
  }

  static info(...args) {
    if (this.levels[this.currentLevel] >= this.levels.info) {
      console.info(`ℹ️ [${new Date().toISOString()}]`, ...args)
    }
  }

  static debug(...args) {
    if (this.levels[this.currentLevel] >= this.levels.debug) {
      console.debug(`🔍 [${new Date().toISOString()}]`, ...args)
    }
  }

  static success(...args) {
    console.log(`✅ [${new Date().toISOString()}]`, ...args)
  }

  static log(...args) {
    console.log(`📝 [${new Date().toISOString()}]`, ...args)
  }

  // Structured logging methods
  static logRequest(method, url, statusCode = null, duration = null) {
    const status = statusCode ? ` - ${statusCode}` : ''
    const timing = duration ? ` (${duration}ms)` : ''
    this.debug(`📡 ${method.toUpperCase()} ${url}${status}${timing}`)
  }

  static logPerformance(operation, duration, ...args) {
    this.debug(`⚡ ${operation} completed in ${duration}ms`, ...args)
  }

  static logError(error, context = '') {
    const contextStr = context ? ` [${context}]` : ''
    this.error(`💥 Error${contextStr}:`, error.message || error)

    if (error.stack && this.currentLevel === 'debug') {
      console.error(error.stack)
    }
  }

  static logMetric(name, value, unit = '') {
    const unitStr = unit ? ` ${unit}` : ''
    this.debug(`📊 ${name}: ${value}${unitStr}`)
  }

  // Table logging for arrays of objects
  static table(data, title = '') {
    if (title) {
      console.log(`\n📋 ${title}`)
    }
    console.table(data)
  }

  // Progress logging
  static progress(current, total, message = 'Progress') {
    const percentage = Math.round((current / total) * 100)
    const barLength = 20
    const filledLength = Math.round((percentage / 100) * barLength)
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength)

    this.info(`${message}: [${bar}] ${percentage}% (${current}/${total})`)
  }
}
