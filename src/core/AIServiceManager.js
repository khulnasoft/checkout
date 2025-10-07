/**
 * AI Service Manager for KhulnaSoft Development Space Engine
 *
 * Manages all AI-powered services including code review, issue analysis,
 * PR analysis, and automated maintenance tasks.
 */

import { OpenAIService } from './providers/OpenAIService.js'
import { Logger } from '../utils/Logger.js'

export class AIServiceManager {
  constructor(config, eventBus) {
    this.config = config
    this.eventBus = eventBus
    this.providers = new Map()
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) {
      Logger.warn('AIServiceManager is already initialized')
      return
    }

    Logger.info('🤖 Initializing AI Service Manager...')

    try {
      // Initialize AI providers based on configuration
      await this._initializeProviders()

      this.isInitialized = true
      Logger.info('✅ AI Service Manager initialized successfully')

    } catch (error) {
      Logger.error('❌ Failed to initialize AI Service Manager:', error)
      throw error
    }
  }

  async start() {
    Logger.info('🚀 Starting AI services...')

    for (const [name, provider] of this.providers) {
      try {
        await provider.start()
        Logger.debug(`✅ AI provider ${name} started`)
      } catch (error) {
        Logger.error(`❌ Failed to start AI provider ${name}:`, error)
        throw error
      }
    }

    Logger.info('✅ All AI services started')
  }

  async stop() {
    Logger.info('🛑 Stopping AI services...')

    for (const [name, provider] of this.providers) {
      try {
        await provider.stop()
        Logger.debug(`✅ AI provider ${name} stopped`)
      } catch (error) {
        Logger.error(`❌ Error stopping AI provider ${name}:`, error)
      }
    }

    Logger.info('✅ All AI services stopped')
  }

  // Code Review Services
  async reviewCode(code, context = {}) {
    if (!this._isServiceEnabled('codeReview')) {
      return null
    }

    Logger.debug('🔍 Starting AI code review...')

    try {
      const provider = this._getProviderForService('codeReview')
      const review = await provider.reviewCode(code, context)

      this.eventBus.emit('ai:analysis:completed', {
        service: 'codeReview',
        target: context.filePath || 'unknown',
        timestamp: new Date()
      })

      return review

    } catch (error) {
      Logger.error('❌ Code review failed:', error)

      this.eventBus.emit('ai:analysis:failed', {
        service: 'codeReview',
        target: context.filePath || 'unknown',
        error: error.message,
        timestamp: new Date()
      })

      throw error
    }
  }

  // Issue Analysis Services
  async analyzeIssue(issue, context = {}) {
    if (!this._isServiceEnabled('issueAnalysis')) {
      return null
    }

    Logger.debug('🎯 Starting AI issue analysis...')

    try {
      const provider = this._getProviderForService('issueAnalysis')
      const analysis = await provider.analyzeIssue(issue, context)

      this.eventBus.emit('ai:analysis:completed', {
        service: 'issueAnalysis',
        target: `issue-${issue.number}`,
        timestamp: new Date()
      })

      return analysis

    } catch (error) {
      Logger.error('❌ Issue analysis failed:', error)

      this.eventBus.emit('ai:analysis:failed', {
        service: 'issueAnalysis',
        target: `issue-${issue.number}`,
        error: error.message,
        timestamp: new Date()
      })

      throw error
    }
  }

  // PR Analysis Services
  async analyzePR(pr, context = {}) {
    if (!this._isServiceEnabled('prAnalysis')) {
      return null
    }

    Logger.debug('🔄 Starting AI PR analysis...')

    try {
      const provider = this._getProviderForService('prAnalysis')
      const analysis = await provider.analyzePR(pr, context)

      this.eventBus.emit('ai:analysis:completed', {
        service: 'prAnalysis',
        target: `pr-${pr.number}`,
        timestamp: new Date()
      })

      return analysis

    } catch (error) {
      Logger.error('❌ PR analysis failed:', error)

      this.eventBus.emit('ai:analysis:failed', {
        service: 'prAnalysis',
        target: `pr-${pr.number}`,
        error: error.message,
        timestamp: new Date()
      })

      throw error
    }
  }

  // Automated Suggestions
  async generateSuggestions(type, data, context = {}) {
    Logger.debug(`💡 Generating AI suggestions for ${type}...`)

    try {
      const provider = this._getProviderForService('suggestions')
      const suggestions = await provider.generateSuggestions(type, data, context)

      return suggestions

    } catch (error) {
      Logger.error(`❌ Failed to generate suggestions for ${type}:`, error)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    const health = {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      providers: {}
    }

    for (const [name, provider] of this.providers) {
      health.providers[name] = await provider.healthCheck()
    }

    return health
  }

  async _initializeProviders() {
    const aiConfig = this.config.get('ai', {})

    // Initialize OpenAI provider if configured
    if (aiConfig.provider === 'openai' && aiConfig.apiKey) {
      const openaiProvider = new OpenAIService(aiConfig, this.eventBus)
      this.providers.set('openai', openaiProvider)
      Logger.debug('✅ OpenAI provider configured')
    }

    // Add more providers here as needed (Anthropic, Google, etc.)

    if (this.providers.size === 0) {
      Logger.warn('⚠️ No AI providers configured')
    }
  }

  _getProviderForService(serviceName) {
    // For now, use the first available provider
    // In the future, this could be enhanced to select providers based on service requirements
    const provider = this.providers.values().next().value

    if (!provider) {
      throw new Error(`No AI provider available for service: ${serviceName}`)
    }

    return provider
  }

  _isServiceEnabled(serviceName) {
    const services = this.config.get('ai.services', {})
    return services[serviceName]?.enabled || false
  }
}
