#!/usr/bin/env node

/**
 * KhulnaSoft Development Space Engine
 * AI-Driven Repository Management and Maintenance Platform
 *
 * This is the core engine that coordinates all AI-driven development activities
 * across the KhulnaSoft organization repositories.
 */

import { KhulnaSoftEngine } from './src/core/KhulnaSoftEngine.js'
import { ConfigurationManager } from './src/config/ConfigurationManager.js'
import { Logger } from './src/utils/Logger.js'

async function main() {
  try {
    Logger.info('🚀 Starting KhulnaSoft Development Space Engine...')

    // Initialize configuration
    const config = new ConfigurationManager()
    await config.initialize()

    // Initialize the main engine
    const engine = new KhulnaSoftEngine(config)

    // Start the engine
    await engine.start()

    Logger.info('✅ KhulnaSoft Development Space Engine is running')

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      Logger.info('🛑 Received SIGINT, shutting down gracefully...')
      await engine.stop()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      Logger.info('🛑 Received SIGTERM, shutting down gracefully...')
      await engine.stop()
      process.exit(0)
    })

  } catch (error) {
    Logger.error('❌ Failed to start KhulnaSoft Development Space Engine:', error)
    process.exit(1)
  }
}

// Run the engine
main().catch((error) => {
  Logger.error('💥 Unhandled error in main process:', error)
  process.exit(1)
})
