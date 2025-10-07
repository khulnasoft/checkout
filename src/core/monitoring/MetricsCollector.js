/**
 * Metrics Collector for KhulnaSoft Development Space Engine
 *
 * Collects and aggregates metrics from all engine components
 * for monitoring, analytics, and performance tracking.
 */

import { Logger } from '../utils/Logger.js'

export class MetricsCollector {
  constructor() {
    this.metrics = new Map()
    this.counters = new Map()
    this.gauges = new Map()
    this.histograms = new Map()
    this.timers = new Map()
    this.startTime = Date.now()
    this.isCollecting = false
    this.collectionInterval = null
  }

  start() {
    if (this.isCollecting) {
      Logger.warn('Metrics collection is already running')
      return
    }

    Logger.info('📊 Starting metrics collection...')

    this.isCollecting = true

    // Collect metrics every minute
    this.collectionInterval = setInterval(() => {
      this._collectPeriodicMetrics()
    }, 60000)

    Logger.info('✅ Metrics collection started')
  }

  stop() {
    if (!this.isCollecting) {
      Logger.warn('Metrics collection is not running')
      return
    }

    Logger.info('🛑 Stopping metrics collection...')

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = null
    }

    this.isCollecting = false

    Logger.info('✅ Metrics collection stopped')
  }

  // Counter operations
  increment(name, value = 1, tags = {}) {
    const key = this._buildKey(name, tags)
    const current = this.counters.get(key) || 0
    this.counters.set(key, current + value)

    this._recordMetric('counter', name, current + value, tags)
  }

  // Gauge operations
  setGauge(name, value, tags = {}) {
    const key = this._buildKey(name, tags)
    this.gauges.set(key, value)

    this._recordMetric('gauge', name, value, tags)
  }

  // Histogram operations
  recordHistogram(name, value, tags = {}) {
    const key = this._buildKey(name, tags)
    if (!this.histograms.has(key)) {
      this.histograms.set(key, [])
    }

    const values = this.histograms.get(key)
    values.push(value)

    // Keep only last 1000 values to prevent memory issues
    if (values.length > 1000) {
      values.shift()
    }

    this._recordMetric('histogram', name, value, tags)
  }

  // Timer operations
  startTimer(name, tags = {}) {
    const key = this._buildKey(name, tags)
    const timer = {
      name,
      startTime: Date.now(),
      tags
    }

    this.timers.set(key, timer)
    return timer
  }

  endTimer(timer) {
    if (!timer || !timer.startTime) {
      return 0
    }

    const duration = Date.now() - timer.startTime
    const key = this._buildKey(timer.name, timer.tags)

    this.recordHistogram(`${timer.name}.duration`, duration, timer.tags)

    // Clean up timer
    this.timers.delete(key)

    return duration
  }

  // Get metrics data
  getMetrics() {
    return {
      counters: this._mapToObject(this.counters),
      gauges: this._mapToObject(this.gauges),
      histograms: this._mapToObject(this.histograms),
      uptime: Date.now() - this.startTime,
      collectionTime: new Date()
    }
  }

  // Get specific metric
  getMetric(name, tags = {}) {
    const key = this._buildKey(name, tags)

    return {
      counter: this.counters.get(key),
      gauge: this.gauges.get(key),
      histogram: this.histograms.get(key)
    }
  }

  // Reset all metrics
  reset() {
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
    this.timers.clear()
    this.metrics.clear()
    this.startTime = Date.now()

    Logger.info('🔄 Metrics reset')
  }

  // Export metrics in different formats
  exportPrometheus() {
    const lines = []

    // Add counters
    for (const [key, value] of this.counters) {
      lines.push(`# HELP ${key.replace(/[^a-zA-Z0-9_]/g, '_')} Counter metric`)
      lines.push(`# TYPE ${key.replace(/[^a-zA-Z0-9_]/g, '_')} counter`)
      lines.push(`${key.replace(/[^a-zA-Z0-9_]/g, '_')} ${value}`)
    }

    // Add gauges
    for (const [key, value] of this.gauges) {
      lines.push(`# HELP ${key.replace(/[^a-zA-Z0-9_]/g, '_')} Gauge metric`)
      lines.push(`# TYPE ${key.replace(/[^a-zA-Z0-9_]/g, '_')} gauge`)
      lines.push(`${key.replace(/[^a-zA-Z0-9_]/g, '_')} ${value}`)
    }

    return lines.join('\n')
  }

  _buildKey(name, tags) {
    const tagString = Object.keys(tags)
      .sort()
      .map(key => `${key}=${tags[key]}`)
      .join(',')

    return tagString ? `${name}{${tagString}}` : name
  }

  _recordMetric(type, name, value, tags) {
    const metric = {
      type,
      name,
      value,
      tags,
      timestamp: Date.now()
    }

    // Keep only last 100 metrics per type to prevent memory issues
    if (!this.metrics.has(type)) {
      this.metrics.set(type, [])
    }

    const metrics = this.metrics.get(type)
    metrics.push(metric)

    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  _collectPeriodicMetrics() {
    // Collect system metrics
    this.setGauge('system.uptime', Date.now() - this.startTime)
    this.setGauge('system.memory.heapUsed', process.memoryUsage().heapUsed)
    this.setGauge('system.memory.heapTotal', process.memoryUsage().heapTotal)

    // Collect metrics about metrics themselves
    this.setGauge('metrics.counters', this.counters.size)
    this.setGauge('metrics.gauges', this.gauges.size)
    this.setGauge('metrics.histograms', this.histograms.size)
    this.setGauge('metrics.timers', this.timers.size)
  }

  _mapToObject(map) {
    const obj = {}
    for (const [key, value] of map) {
      obj[key] = value
    }
    return obj
  }
}
