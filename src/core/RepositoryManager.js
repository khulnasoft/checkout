/**
 * Repository Manager for KhulnaSoft Development Space Engine
 *
 * Manages repository discovery, monitoring, and coordination across
 * all repositories in the KhulnaSoft organization.
 */

import { GitHubService } from './github/GitHubService.js'
import { Logger } from '../utils/Logger.js'

export class RepositoryManager {
  constructor(config, eventBus) {
    this.config = config
    this.eventBus = eventBus
    this.github = new GitHubService(config, eventBus)
    this.repositories = new Map()
    this.isInitialized = false
    this.scanInterval = null
  }

  async initialize() {
    if (this.isInitialized) {
      Logger.warn('RepositoryManager is already initialized')
      return
    }

    Logger.info('📁 Initializing Repository Manager...')

    try {
      // Initialize GitHub service
      await this.github.initialize()

      // Load managed repositories configuration
      await this._loadManagedRepositories()

      // Discover repositories if auto-discovery is enabled
      if (this.config.get('repositories.autoDiscover', true)) {
        await this.discoverRepositories()
      }

      this.isInitialized = true
      Logger.info('✅ Repository Manager initialized successfully')

    } catch (error) {
      Logger.error('❌ Failed to initialize Repository Manager:', error)
      throw error
    }
  }

  async start() {
    Logger.info('🚀 Starting Repository Manager...')

    // Start periodic repository scanning
    const scanInterval = this.config.get('repositories.scanInterval', 300000) // 5 minutes
    this.scanInterval = setInterval(async () => {
      try {
        await this._periodicScan()
      } catch (error) {
        Logger.error('❌ Periodic repository scan failed:', error)
      }
    }, scanInterval)

    Logger.info(`✅ Repository Manager started (scanning every ${scanInterval}ms)`)
  }

  async stop() {
    Logger.info('🛑 Stopping Repository Manager...')

    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }

    Logger.info('✅ Repository Manager stopped')
  }

  async discoverRepositories() {
    Logger.info('🔍 Discovering repositories...')

    try {
      const organization = this.config.get('github.organization')

      // Get all repositories from the organization
      const repos = await this.github.getOrganizationRepositories(organization)

      Logger.info(`📁 Found ${repos.length} repositories in organization ${organization}`)

      for (const repo of repos) {
        await this._processDiscoveredRepository(repo)
      }

      this.eventBus.emit('repositories:discovery:completed', {
        count: repos.length,
        timestamp: new Date()
      })

    } catch (error) {
      Logger.error('❌ Repository discovery failed:', error)
      throw error
    }
  }

  async getRepository(name) {
    return this.repositories.get(name)
  }

  async getAllRepositories() {
    return Array.from(this.repositories.values())
  }

  async updateRepository(name, updates) {
    const repo = this.repositories.get(name)
    if (!repo) {
      throw new Error(`Repository ${name} not found`)
    }

    try {
      // Update repository information
      const updatedRepo = { ...repo, ...updates, lastUpdated: new Date() }

      // Sync with GitHub if needed
      if (updates.needsSync) {
        await this._syncRepositoryWithGitHub(updatedRepo)
      }

      this.repositories.set(name, updatedRepo)

      this.eventBus.emit('repository:updated', {
        repository: updatedRepo,
        timestamp: new Date()
      })

      return updatedRepo

    } catch (error) {
      Logger.error(`❌ Failed to update repository ${name}:`, error)
      throw error
    }
  }

  async processWebhookEvent(eventType, payload) {
    Logger.debug(`🔗 Processing webhook event: ${eventType}`)

    try {
      switch (eventType) {
        case 'push':
          await this._handlePushEvent(payload)
          break
        case 'pull_request':
          await this._handlePullRequestEvent(payload)
          break
        case 'issues':
          await this._handleIssuesEvent(payload)
          break
        case 'release':
          await this._handleReleaseEvent(payload)
          break
        default:
          Logger.debug(`ℹ️ Unhandled webhook event type: ${eventType}`)
      }

    } catch (error) {
      Logger.error(`❌ Failed to process webhook event ${eventType}:`, error)
      throw error
    }
  }

  async healthCheck() {
    const health = {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      repositories: {
        total: this.repositories.size,
        lastScan: this.lastScan || null
      },
      github: await this.github.healthCheck()
    }

    return health
  }

  async _loadManagedRepositories() {
    const managedRepos = this.config.get('repositories.managedRepos', [])

    for (const repoName of managedRepos) {
      try {
        const repo = await this.github.getRepository(repoName)
        if (repo) {
          this.repositories.set(repoName, {
            ...repo,
            managed: true,
            lastUpdated: new Date()
          })
        }
      } catch (error) {
        Logger.warn(`⚠️ Failed to load managed repository ${repoName}:`, error.message)
      }
    }
  }

  async _processDiscoveredRepository(repo) {
    const repoName = repo.name

    // Skip ignored repositories
    const ignoredRepos = this.config.get('repositories.ignoredRepos', [])
    if (ignoredRepos.includes(repoName)) {
      Logger.debug(`⏭️ Skipping ignored repository: ${repoName}`)
      return
    }

    // Check if repository already exists
    const existingRepo = this.repositories.get(repoName)

    if (existingRepo) {
      // Update existing repository
      const updatedRepo = { ...existingRepo, ...repo, lastUpdated: new Date() }
      this.repositories.set(repoName, updatedRepo)

      this.eventBus.emit('repository:updated', {
        repository: updatedRepo,
        timestamp: new Date()
      })
    } else {
      // Add new repository
      const newRepo = {
        ...repo,
        managed: false,
        discoveredAt: new Date(),
        lastUpdated: new Date()
      }

      this.repositories.set(repoName, newRepo)

      this.eventBus.emit('repository:discovered', {
        repository: newRepo,
        timestamp: new Date()
      })
    }
  }

  async _periodicScan() {
    Logger.debug('🔄 Running periodic repository scan...')

    try {
      const repos = await this.github.getOrganizationRepositories(
        this.config.get('github.organization')
      )

      for (const repo of repos) {
        await this._processDiscoveredRepository(repo)
      }

      this.lastScan = new Date()
      Logger.debug(`✅ Periodic scan completed for ${repos.length} repositories`)

    } catch (error) {
      Logger.error('❌ Periodic repository scan failed:', error)
      throw error
    }
  }

  async _syncRepositoryWithGitHub(repo) {
    try {
      const latestRepo = await this.github.getRepository(repo.name)
      const syncedRepo = { ...repo, ...latestRepo, lastSynced: new Date() }
      this.repositories.set(repo.name, syncedRepo)
      return syncedRepo
    } catch (error) {
      Logger.error(`❌ Failed to sync repository ${repo.name} with GitHub:`, error)
      throw error
    }
  }

  async _handlePushEvent(payload) {
    const repoName = payload.repository.name
    const repo = this.repositories.get(repoName)

    if (repo) {
      // Update repository information
      await this.updateRepository(repoName, {
        lastPush: new Date(),
        lastCommit: payload.after
      })

      // Trigger any push-related workflows
      this.eventBus.emit('repository:push', {
        repository: repoName,
        branch: payload.ref.replace('refs/heads/', ''),
        commits: payload.commits.length,
        timestamp: new Date()
      })
    }
  }

  async _handlePullRequestEvent(payload) {
    const repoName = payload.repository.name
    const repo = this.repositories.get(repoName)

    if (repo) {
      // Update repository PR statistics
      await this.updateRepository(repoName, {
        lastPRActivity: new Date(),
        openPRs: payload.repository.open_issues // This includes PRs
      })

      // Emit PR event for workflow processing
      this.eventBus.emit('repository:pull_request', {
        repository: repoName,
        action: payload.action,
        number: payload.number,
        title: payload.pull_request.title,
        timestamp: new Date()
      })
    }
  }

  async _handleIssuesEvent(payload) {
    const repoName = payload.repository.name
    const repo = this.repositories.get(repoName)

    if (repo) {
      // Update repository issue statistics
      await this.updateRepository(repoName, {
        lastIssueActivity: new Date(),
        openIssues: payload.repository.open_issues
      })

      // Emit issue event for workflow processing
      this.eventBus.emit('repository:issue', {
        repository: repoName,
        action: payload.action,
        number: payload.issue.number,
        title: payload.issue.title,
        timestamp: new Date()
      })
    }
  }

  async _handleReleaseEvent(payload) {
    const repoName = payload.repository.name
    const repo = this.repositories.get(repoName)

    if (repo) {
      // Update repository release information
      await this.updateRepository(repoName, {
        lastRelease: new Date(),
        latestRelease: payload.release.tag_name
      })

      // Emit release event for workflow processing
      this.eventBus.emit('repository:release', {
        repository: repoName,
        action: payload.action,
        tag: payload.release.tag_name,
        timestamp: new Date()
      })
    }
  }
}
