/**
 * GitHub Service for KhulnaSoft Development Space Engine
 *
 * Provides GitHub API integration for repository management,
 * issue tracking, PR management, and webhook processing.
 */

import { Logger } from '../utils/Logger.js'

export class GitHubService {
  constructor(config, eventBus) {
    this.config = config
    this.eventBus = eventBus
    this.baseUrl = config.get('github.apiUrl', 'https://api.github.com')
    this.token = config.get('github.token')
    this.organization = config.get('github.organization')
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) {
      Logger.warn('GitHubService is already initialized')
      return
    }

    Logger.info('🔗 Initializing GitHub Service...')

    if (!this.token) {
      throw new Error('GitHub token is required')
    }

    if (!this.organization) {
      throw new Error('GitHub organization is required')
    }

    // Test the connection
    await this._testConnection()

    this.isInitialized = true
    Logger.info('✅ GitHub Service initialized successfully')
  }

  async getOrganizationRepositories(organization) {
    try {
      const url = `${this.baseUrl}/orgs/${organization}/repos?per_page=100`
      const repos = await this._makeRequest(url)

      return repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        archived: repo.archived,
        disabled: repo.disabled,
        language: repo.language,
        defaultBranch: repo.default_branch,
        topics: repo.topics || [],
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        watchers: repo.watchers_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        size: repo.size,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url
      }))

    } catch (error) {
      Logger.error(`❌ Failed to get repositories for organization ${organization}:`, error)
      throw error
    }
  }

  async getRepository(repositoryName) {
    try {
      const url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}`
      const repo = await this._makeRequest(url)

      return {
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        fork: repo.fork,
        archived: repo.archived,
        disabled: repo.disabled,
        language: repo.language,
        defaultBranch: repo.default_branch,
        topics: repo.topics || [],
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        watchers: repo.watchers_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        size: repo.size,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url
      }

    } catch (error) {
      Logger.error(`❌ Failed to get repository ${repositoryName}:`, error)
      throw error
    }
  }

  async getRepositoryIssues(repositoryName, options = {}) {
    try {
      const { state = 'open', labels = '', assignee = '', perPage = 50, page = 1 } = options

      let url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}/issues?`
      url += `state=${state}&per_page=${perPage}&page=${page}`

      if (labels) url += `&labels=${labels}`
      if (assignee) url += `&assignee=${assignee}`

      const issues = await this._makeRequest(url)

      return issues.map(issue => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        labels: issue.labels.map(label => ({ name: label.name, color: label.color })),
        assignee: issue.assignee?.login,
        assignees: issue.assignees?.map(a => a.login) || [],
        milestone: issue.milestone?.title,
        author: issue.user.login,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        closedAt: issue.closed_at,
        url: issue.html_url,
        reactions: issue.reactions
      }))

    } catch (error) {
      Logger.error(`❌ Failed to get issues for repository ${repositoryName}:`, error)
      throw error
    }
  }

  async getRepositoryPullRequests(repositoryName, options = {}) {
    try {
      const { state = 'open', perPage = 50, page = 1 } = options

      let url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}/pulls?`
      url += `state=${state}&per_page=${perPage}&page=${page}`

      const prs = await this._makeRequest(url)

      return prs.map(pr => ({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        merged: pr.merged,
        draft: pr.draft,
        base: {
          ref: pr.base.ref,
          sha: pr.base.sha,
          repo: pr.base.repo.name
        },
        head: {
          ref: pr.head.ref,
          sha: pr.head.sha,
          repo: pr.head.repo.name
        },
        author: pr.user.login,
        assignees: pr.assignees?.map(a => a.login) || [],
        reviewers: pr.requested_reviewers?.map(r => r.login) || [],
        labels: pr.labels.map(label => ({ name: label.name, color: label.color })),
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
        url: pr.html_url,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files
      }))

    } catch (error) {
      Logger.error(`❌ Failed to get PRs for repository ${repositoryName}:`, error)
      throw error
    }
  }

  async getRepositoryReleases(repositoryName, options = {}) {
    try {
      const { perPage = 50, page = 1 } = options

      const url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}/releases?per_page=${perPage}&page=${page}`
      const releases = await this._makeRequest(url)

      return releases.map(release => ({
        id: release.id,
        tagName: release.tag_name,
        name: release.name,
        body: release.body,
        prerelease: release.prerelease,
        draft: release.draft,
        author: release.author.login,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        url: release.html_url,
        assets: release.assets.map(asset => ({
          name: asset.name,
          size: asset.size,
          downloadUrl: asset.browser_download_url,
          downloadCount: asset.download_count
        }))
      }))

    } catch (error) {
      Logger.error(`❌ Failed to get releases for repository ${repositoryName}:`, error)
      throw error
    }
  }

  async createIssueComment(repositoryName, issueNumber, body) {
    try {
      const url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}/issues/${issueNumber}/comments`
      const comment = await this._makeRequest(url, 'POST', { body })

      return {
        id: comment.id,
        body: comment.body,
        author: comment.user.login,
        createdAt: comment.created_at,
        url: comment.html_url
      }

    } catch (error) {
      Logger.error(`❌ Failed to create issue comment in ${repositoryName}#${issueNumber}:`, error)
      throw error
    }
  }

  async createPRComment(repositoryName, prNumber, body) {
    try {
      const url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}/pulls/${prNumber}/comments`
      const comment = await this._makeRequest(url, 'POST', { body })

      return {
        id: comment.id,
        body: comment.body,
        author: comment.user.login,
        createdAt: comment.created_at,
        url: comment.html_url
      }

    } catch (error) {
      Logger.error(`❌ Failed to create PR comment in ${repositoryName}#${prNumber}:`, error)
      throw error
    }
  }

  async addIssueLabels(repositoryName, issueNumber, labels) {
    try {
      const url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}/issues/${issueNumber}/labels`
      const response = await this._makeRequest(url, 'POST', { labels })

      return response.map(label => ({ name: label.name, color: label.color }))

    } catch (error) {
      Logger.error(`❌ Failed to add labels to ${repositoryName}#${issueNumber}:`, error)
      throw error
    }
  }

  async updateIssue(repositoryName, issueNumber, updates) {
    try {
      const url = `${this.baseUrl}/repos/${this.organization}/${repositoryName}/issues/${issueNumber}`
      const response = await this._makeRequest(url, 'PATCH', updates)

      return {
        number: response.number,
        title: response.title,
        state: response.state,
        labels: response.labels.map(label => ({ name: label.name, color: label.color }))
      }

    } catch (error) {
      Logger.error(`❌ Failed to update issue ${repositoryName}#${issueNumber}:`, error)
      throw error
    }
  }

  async healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      organization: this.organization,
      baseUrl: this.baseUrl,
      lastUsed: this.lastUsed || null
    }
  }

  async _makeRequest(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'KhulnaSoft-Development-Engine/1.0'
      }
    }

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.headers['Content-Type'] = 'application/json'
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`GitHub API error: ${response.status} - ${errorBody}`)
      }

      this.lastUsed = new Date()

      // Handle empty responses
      const contentLength = response.headers.get('content-length')
      if (contentLength === '0') {
        return null
      }

      return response.json()

    } catch (error) {
      Logger.error(`❌ GitHub API request failed: ${method} ${url}`, error)
      throw error
    }
  }

  async _testConnection() {
    try {
      // Test connection by getting user information
      await this._makeRequest(`${this.baseUrl}/user`)
      Logger.debug('✅ GitHub connection test successful')
    } catch (error) {
      Logger.error('❌ GitHub connection test failed:', error)
      throw error
    }
  }
}
