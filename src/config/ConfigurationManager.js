/**
 * Configuration Manager for KhulnaSoft Development Space Engine
 *
 * Handles all configuration loading, validation, and management
 */

import fs from 'fs/promises'
import path from 'path'
import { Logger } from '../utils/Logger.js'

export class ConfigurationManager {
  constructor() {
    this.config = new Map()
    this.configFiles = [
      'khulnasoft-config.json',
      'khulnasoft-config.yaml',
      'khulnasoft-config.yml'
    ]
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) {
      Logger.warn('ConfigurationManager is already initialized')
      return
    }

    Logger.info('🔧 Initializing Configuration Manager...')

    try {
      // Load configuration from multiple sources
      await this._loadDefaultConfig()
      await this._loadEnvironmentVariables()
      await this._loadConfigFiles()
      await this._validateConfiguration()

      this.isInitialized = true
      Logger.info('✅ Configuration Manager initialized successfully')

    } catch (error) {
      Logger.error('❌ Failed to initialize Configuration Manager:', error)
      throw error
    }
  }

  get(key, defaultValue = null) {
    if (!this.isInitialized) {
      throw new Error('ConfigurationManager not initialized')
    }

    const keys = key.split('.')
    let value = this.config

    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        return defaultValue
      }
    }

    return value
  }

  set(key, value) {
    if (!this.isInitialized) {
      throw new Error('ConfigurationManager not initialized')
    }

    const keys = key.split('.')
    let config = this.config

    for (let i = 0; i < keys.length - 1; i++) {
      if (!config[keys[i]]) {
        config[keys[i]] = {}
      }
      config = config[keys[i]]
    }

    config[keys[keys.length - 1]] = value
  }

  async _loadDefaultConfig() {
    Logger.debug('📋 Loading default configuration...')

    const defaultConfig = {
      engine: {
        name: 'KhulnaSoft Development Space Engine',
        version: '1.0.0',
        environment: 'development',
        logLevel: 'info'
      },
      github: {
        organization: 'KhulnaSoft',
        token: process.env.GITHUB_TOKEN,
        apiUrl: 'https://api.github.com',
        webhookSecret: process.env.GITHUB_WEBHOOK_SECRET
      },
      ai: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        apiKey: process.env.OPENAI_API_KEY,
        services: {
          codeReview: {
            enabled: true,
            autoReview: false,
            minConfidence: 0.8
          },
          issueAnalysis: {
            enabled: true,
            autoLabel: true,
            autoAssign: false
          },
          prAnalysis: {
            enabled: true,
            autoMerge: false,
            requiredReviews: 1
          }
        }
      },
      repositories: {
        managedRepos: [],
        ignoredRepos: [],
        scanInterval: 300000, // 5 minutes
        autoDiscover: true
      },
      workflows: {
        enabled: true,
        maxConcurrency: 5,
        timeout: 300000, // 5 minutes
        retryAttempts: 3
      },
      monitoring: {
        enabled: true,
        metricsInterval: 60000, // 1 minute
        healthCheckInterval: 300000, // 5 minutes
        alertThresholds: {
          errorRate: 0.05,
          responseTime: 10000
        }
      },
      storage: {
        type: 'filesystem',
        path: './data',
        backup: {
          enabled: true,
          interval: 86400000, // 24 hours
          retention: 30 // days
        }
      }
    }

    this._mergeConfig(defaultConfig)
  }

  async _loadEnvironmentVariables() {
    Logger.debug('🌍 Loading environment variables...')

    // GitHub configuration
    if (process.env.GITHUB_TOKEN) {
      this.set('github.token', process.env.GITHUB_TOKEN)
    }
    if (process.env.GITHUB_ORG) {
      this.set('github.organization', process.env.GITHUB_ORG)
    }
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      this.set('github.webhookSecret', process.env.GITHUB_WEBHOOK_SECRET)
    }

    // AI configuration
    if (process.env.OPENAI_API_KEY) {
      this.set('ai.apiKey', process.env.OPENAI_API_KEY)
    }
    if (process.env.AI_PROVIDER) {
      this.set('ai.provider', process.env.AI_PROVIDER)
    }

    // Engine configuration
    if (process.env.ENGINE_ENVIRONMENT) {
      this.set('engine.environment', process.env.ENGINE_ENVIRONMENT)
    }
    if (process.env.LOG_LEVEL) {
      this.set('engine.logLevel', process.env.LOG_LEVEL)
    }
  }

  async _loadConfigFiles() {
    Logger.debug('📁 Loading configuration files...')

    for (const configFile of this.configFiles) {
      try {
        const configPath = path.resolve(configFile)
        const fileContent = await fs.readFile(configPath, 'utf-8')

        let fileConfig
        if (configFile.endsWith('.json')) {
          fileConfig = JSON.parse(fileContent)
        } else {
          // For YAML files, we would need a YAML parser
          // For now, assume JSON
          fileConfig = JSON.parse(fileContent)
        }

        this._mergeConfig(fileConfig)
        Logger.debug(`✅ Loaded configuration from ${configFile}`)

      } catch (error) {
        if (error.code === 'ENOENT') {
          Logger.debug(`Configuration file ${configFile} not found, skipping`)
        } else {
          Logger.warn(`⚠️ Failed to load configuration from ${configFile}:`, error.message)
        }
      }
    }
  }

  async _validateConfiguration() {
    Logger.debug('🔍 Validating configuration...')

    const requiredFields = [
      'github.token',
      'github.organization'
    ]

    const missingFields = []
    for (const field of requiredFields) {
      if (this.get(field) === null || this.get(field) === undefined) {
        missingFields.push(field)
      }
    }

    if (missingFields.length > 0) {
      throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`)
    }

    // Validate AI configuration if AI services are enabled
    if (this.get('ai.services.codeReview.enabled') && !this.get('ai.apiKey')) {
      throw new Error('AI API key is required when AI services are enabled')
    }

    Logger.debug('✅ Configuration validation completed')
  }

  _mergeConfig(sourceConfig) {
    this._deepMerge(this.config, sourceConfig)
  }

  _deepMerge(target, source) {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) {
          target[key] = {}
        }
        this._deepMerge(target[key], source[key])
      } else {
        target[key] = source[key]
      }
    }
  }

  // Get the entire configuration as an object
  toObject() {
    return JSON.parse(JSON.stringify(this.config))
  }

  // Save current configuration to file
  async saveToFile(filePath = 'khulnasoft-config.json') {
    const configObj = this.toObject()
    await fs.writeFile(filePath, JSON.stringify(configObj, null, 2))
    Logger.info(`💾 Configuration saved to ${filePath}`)
  }
}
