/**
 * Event Bus for KhulnaSoft Development Space Engine
 *
 * Provides a centralized event system for component communication,
 * workflow triggering, and system coordination.
 */

import { Logger } from '../utils/Logger.js'

export class EventBus {
  constructor() {
    this.listeners = new Map()
    this.history = []
    this.maxHistorySize = 1000
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @param {Object} options - Options (once, priority)
   */
  on(event, callback, options = {}) {
    if (typeof callback !== 'function') {
      throw new Error('Event callback must be a function')
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    const listener = {
      callback,
      options,
      id: this._generateListenerId()
    }

    this.listeners.get(event).push(listener)

    // Sort by priority (higher priority first)
    this.listeners.get(event).sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0))

    Logger.debug(`📡 Registered listener for event: ${event}`)

    return listener.id
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {string} listenerId - Listener ID to remove
   */
  off(event, listenerId) {
    if (!this.listeners.has(event)) {
      return false
    }

    const listeners = this.listeners.get(event)
    const index = listeners.findIndex(l => l.id === listenerId)

    if (index === -1) {
      return false
    }

    listeners.splice(index, 1)

    if (listeners.length === 0) {
      this.listeners.delete(event)
    }

    Logger.debug(`📡 Removed listener for event: ${event}`)
    return true
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @param {Object} options - Options (priority)
   */
  once(event, callback, options = {}) {
    return this.on(event, callback, { ...options, once: true })
  }

  /**
   * Emit an event to all registered listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      Logger.debug(`📡 No listeners for event: ${event}`)
      return
    }

    const eventRecord = {
      event,
      data,
      timestamp: new Date(),
      id: this._generateEventId()
    }

    // Add to history
    this.history.push(eventRecord)
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }

    Logger.debug(`📡 Emitting event: ${event}`)

    // Execute listeners asynchronously to avoid blocking
    setImmediate(() => {
      this._executeListeners(event, eventRecord)
    })
  }

  /**
   * Get event history
   * @param {Object} options - Filter options
   * @returns {Array} Event history
   */
  getHistory(options = {}) {
    let history = [...this.history]

    if (options.event) {
      history = history.filter(record => record.event === options.event)
    }

    if (options.limit) {
      history = history.slice(-options.limit)
    }

    if (options.since) {
      history = history.filter(record => record.timestamp >= options.since)
    }

    return history
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.history = []
    Logger.debug('📡 Event history cleared')
  }

  /**
   * Get listener statistics
   */
  getStats() {
    const stats = {
      totalListeners: 0,
      events: {},
      historySize: this.history.length
    }

    for (const [event, listeners] of this.listeners) {
      stats.events[event] = listeners.length
      stats.totalListeners += listeners.length
    }

    return stats
  }

  _executeListeners(event, eventRecord) {
    const listeners = this.listeners.get(event) || []

    for (const listener of listeners) {
      try {
        // Execute the callback
        const result = listener.callback(eventRecord.data, eventRecord)

        // Remove one-time listeners
        if (listener.options.once) {
          this.off(event, listener.id)
        }

        // Handle promise returns
        if (result && typeof result.catch === 'function') {
          result.catch(error => {
            Logger.error(`❌ Error in event listener for ${event}:`, error)
          })
        }

      } catch (error) {
        Logger.error(`❌ Error in event listener for ${event}:`, error)
      }
    }
  }

  _generateListenerId() {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  _generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
