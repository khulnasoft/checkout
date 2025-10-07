/**
 * Web Server for KhulnaSoft Development Space Engine
 *
 * Provides a web interface and REST API for interacting with
 * the KhulnaSoft development engine.
 */

import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { KhulnaSoftEngine } from '../src/core/KhulnaSoftEngine.js'
import { ConfigurationManager } from '../src/config/ConfigurationManager.js'
import { Logger } from '../src/utils/Logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class WebServer {
  constructor() {
    this.app = express()
    this.server = null
    this.port = process.env.PORT || 3000
    this.engine = null
    this.config = null
  }

  async start() {
    Logger.info('🌐 Starting KhulnaSoft Web Server...')

    try {
      // Initialize configuration
      this.config = new ConfigurationManager()
      await this.config.initialize()

      // Initialize the engine
      this.engine = new KhulnaSoftEngine(this.config)

      // Setup middleware
      this.setupMiddleware()

      // Setup routes
      this.setupRoutes()

      // Start the server
      this.server = this.app.listen(this.port, () => {
        Logger.info(`✅ KhulnaSoft Web Server running on http://localhost:${this.port}`)
        Logger.info(`🚀 Web interface available at http://localhost:${this.port}`)
      })

      // Handle graceful shutdown
      process.on('SIGINT', () => this.gracefulShutdown())
      process.on('SIGTERM', () => this.gracefulShutdown())

    } catch (error) {
      Logger.error('❌ Failed to start KhulnaSoft Web Server:', error)
      throw error
    }
  }

  async stop() {
    Logger.info('🛑 Stopping KhulnaSoft Web Server...')

    if (this.engine) {
      await this.engine.stop()
    }

    if (this.server) {
      this.server.close(() => {
        Logger.info('✅ KhulnaSoft Web Server stopped')
      })
    }
  }

  setupMiddleware() {
    // Enable CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')

      if (req.method === 'OPTIONS') {
        res.sendStatus(200)
      } else {
        next()
      }
    })

    // Parse JSON bodies
    this.app.use(express.json())

    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')))

    // Request logging
    this.app.use((req, res, next) => {
      Logger.debug(`📡 ${req.method} ${req.path}`)
      next()
    })
  }

  setupRoutes() {
    // Web interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'))
    })

    // API Routes
    this.setupAPIRoutes()
  }

  setupAPIRoutes() {
    const router = express.Router()
    this.app.use('/api', router)

    // Engine control endpoints
    router.post('/engine/start', async (req, res) => {
      try {
        await this.engine.start()
        res.json({ success: true, message: 'Engine started successfully' })
      } catch (error) {
        Logger.error('Failed to start engine:', error)
        res.status(500).json({ success: false, error: error.message })
      }
    })

    router.post('/engine/stop', async (req, res) => {
      try {
        await this.engine.stop()
        res.json({ success: true, message: 'Engine stopped successfully' })
      } catch (error) {
        Logger.error('Failed to stop engine:', error)
        res.status(500).json({ success: false, error: error.message })
      }
    })

    // Status endpoints
    router.get('/status', async (req, res) => {
      try {
        const status = {
          engine: await this.engine.healthCheck(),
          repositories: this.engine.getRepositoryManager()?.healthCheck(),
          ai: this.engine.getAIServiceManager()?.healthCheck(),
          workflows: this.engine.getWorkflowManager()?.healthCheck(),
          metrics: this.engine.getMetrics()?.getMetrics()
        }

        res.json(status)
      } catch (error) {
        Logger.error('Failed to get status:', error)
        res.status(500).json({ success: false, error: error.message })
      }
    })

    // Repository endpoints
    router.get('/repositories', async (req, res) => {
      try {
        const repoManager = this.engine.getRepositoryManager()
        if (!repoManager) {
          throw new Error('Repository manager not available')
        }

        const repositories = await repoManager.getAllRepositories()
        res.json({ repositories })
      } catch (error) {
        Logger.error('Failed to get repositories:', error)
        res.status(500).json({ success: false, error: error.message })
      }
    })

    // Logs endpoint
    router.get('/logs', async (req, res) => {
      try {
        // For now, return a simple message
        // In a real implementation, you would collect logs from the Logger
        res.json({
          logs: [
            {
              id: 1,
              level: 'info',
              message: 'KhulnaSoft Development Space Engine is ready',
              timestamp: new Date()
            }
          ]
        })
      } catch (error) {
        Logger.error('Failed to get logs:', error)
        res.status(500).json({ success: false, error: error.message })
      }
    })

    // Workflow endpoints
    router.post('/workflows/:name/execute', async (req, res) => {
      try {
        const workflowManager = this.engine.getWorkflowManager()
        if (!workflowManager) {
          throw new Error('Workflow manager not available')
        }

        const { name } = req.params
        const { context } = req.body

        const result = await workflowManager.executeWorkflow(name, context || {})
        res.json({ success: true, result })
      } catch (error) {
        Logger.error('Failed to execute workflow:', error)
        res.status(500).json({ success: false, error: error.message })
      }
    })

    // Health check endpoint
    router.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        version: this.config?.get('engine.version', '1.0.0')
      })
    })
  }

  async gracefulShutdown() {
    Logger.info('🛑 Received shutdown signal, stopping gracefully...')

    try {
      await this.stop()
      process.exit(0)
    } catch (error) {
      Logger.error('❌ Error during graceful shutdown:', error)
      process.exit(1)
    }
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new WebServer()
  server.start().catch((error) => {
    Logger.error('💥 Failed to start server:', error)
    process.exit(1)
  })
}
