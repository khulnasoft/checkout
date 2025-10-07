/**
 * Workflow Manager for KhulnaSoft Development Space Engine
 *
 * Manages and executes automated workflows for repository maintenance,
 * issue processing, PR handling, and other development tasks.
 */

import { Logger } from '../utils/Logger.js'

export class WorkflowManager {
  constructor(config, eventBus) {
    this.config = config
    this.eventBus = eventBus
    this.workflows = new Map()
    this.runningWorkflows = new Map()
    this.isInitialized = false
  }

  async initialize() {
    if (this.isInitialized) {
      Logger.warn('WorkflowManager is already initialized')
      return
    }

    Logger.info('⚡ Initializing Workflow Manager...')

    try {
      // Load built-in workflows
      await this._loadBuiltInWorkflows()

      // Load custom workflows from configuration
      await this._loadCustomWorkflows()

      this.isInitialized = true
      Logger.info('✅ Workflow Manager initialized successfully')

    } catch (error) {
      Logger.error('❌ Failed to initialize Workflow Manager:', error)
      throw error
    }
  }

  async start() {
    Logger.info('🚀 Starting Workflow Manager...')

    // Register event listeners for workflow triggers
    this._registerEventListeners()

    Logger.info('✅ Workflow Manager started')
  }

  async stop() {
    Logger.info('🛑 Stopping Workflow Manager...')

    // Cancel all running workflows
    for (const [id, workflow] of this.runningWorkflows) {
      try {
        await this._cancelWorkflow(id)
      } catch (error) {
        Logger.error(`❌ Failed to cancel workflow ${id}:`, error)
      }
    }

    this.runningWorkflows.clear()

    Logger.info('✅ Workflow Manager stopped')
  }

  async executeWorkflow(workflowName, context, options = {}) {
    const workflow = this.workflows.get(workflowName)
    if (!workflow) {
      throw new Error(`Workflow ${workflowName} not found`)
    }

    Logger.info(`⚡ Executing workflow: ${workflowName}`)

    const workflowId = this._generateWorkflowId()
    const workflowExecution = {
      id: workflowId,
      name: workflowName,
      status: 'running',
      startedAt: new Date(),
      context,
      options,
      steps: []
    }

    this.runningWorkflows.set(workflowId, workflowExecution)

    // Emit workflow started event
    this.eventBus.emit('workflow:started', {
      workflow: workflowExecution,
      timestamp: new Date()
    })

    try {
      // Execute the workflow
      const result = await this._executeWorkflowSteps(workflow, workflowExecution)

      // Update workflow execution status
      workflowExecution.status = 'completed'
      workflowExecution.completedAt = new Date()
      workflowExecution.result = result

      Logger.info(`✅ Workflow ${workflowName} completed successfully`)

      // Emit workflow completed event
      this.eventBus.emit('workflow:completed', {
        workflow: workflowExecution,
        timestamp: new Date()
      })

      return result

    } catch (error) {
      Logger.error(`❌ Workflow ${workflowName} failed:`, error)

      // Update workflow execution status
      workflowExecution.status = 'failed'
      workflowExecution.completedAt = new Date()
      workflowExecution.error = error.message

      // Emit workflow failed event
      this.eventBus.emit('workflow:failed', {
        workflow: workflowExecution,
        error: error.message,
        timestamp: new Date()
      })

      throw error
    } finally {
      // Clean up completed workflow
      setTimeout(() => {
        this.runningWorkflows.delete(workflowId)
      }, 300000) // Keep for 5 minutes for debugging
    }
  }

  async getRunningWorkflows() {
    return Array.from(this.runningWorkflows.values())
  }

  async cancelWorkflow(workflowId) {
    return await this._cancelWorkflow(workflowId)
  }

  async healthCheck() {
    const health = {
      status: this.isInitialized ? 'healthy' : 'not_initialized',
      workflows: {
        total: this.workflows.size,
        running: this.runningWorkflows.size
      }
    }

    return health
  }

  async _loadBuiltInWorkflows() {
    Logger.debug('📋 Loading built-in workflows...')

    // Code Review Workflow
    this.workflows.set('code-review', {
      name: 'Code Review',
      description: 'Automated code review for pull requests',
      triggers: ['pull_request:opened', 'pull_request:synchronize'],
      steps: [
        {
          name: 'Analyze Changes',
          type: 'ai-analysis',
          service: 'prAnalysis',
          timeout: 30000
        },
        {
          name: 'Review Code Quality',
          type: 'ai-analysis',
          service: 'codeReview',
          timeout: 60000
        },
        {
          name: 'Add Review Comments',
          type: 'github-action',
          action: 'addPRComments',
          condition: 'hasIssues',
          timeout: 10000
        },
        {
          name: 'Set Review Status',
          type: 'github-action',
          action: 'setPRStatus',
          timeout: 5000
        }
      ]
    })

    // Issue Triage Workflow
    this.workflows.set('issue-triage', {
      name: 'Issue Triage',
      description: 'Automated issue categorization and labeling',
      triggers: ['issues:opened'],
      steps: [
        {
          name: 'Analyze Issue',
          type: 'ai-analysis',
          service: 'issueAnalysis',
          timeout: 30000
        },
        {
          name: 'Update Labels',
          type: 'github-action',
          action: 'updateIssueLabels',
          condition: 'hasSuggestedLabels',
          timeout: 10000
        },
        {
          name: 'Set Priority',
          type: 'github-action',
          action: 'setIssuePriority',
          condition: 'hasPriority',
          timeout: 5000
        }
      ]
    })

    // Dependency Update Workflow
    this.workflows.set('dependency-update', {
      name: 'Dependency Update',
      description: 'Check and update outdated dependencies',
      triggers: ['schedule:daily'],
      steps: [
        {
          name: 'Check Dependencies',
          type: 'dependency-check',
          timeout: 60000
        },
        {
          name: 'Create Update PRs',
          type: 'github-action',
          action: 'createDependencyPRs',
          condition: 'hasUpdates',
          timeout: 30000
        }
      ]
    })

    // Security Scan Workflow
    this.workflows.set('security-scan', {
      name: 'Security Scan',
      description: 'Automated security vulnerability scanning',
      triggers: ['push:main', 'schedule:weekly'],
      steps: [
        {
          name: 'Run Security Scan',
          type: 'security-scan',
          timeout: 300000 // 5 minutes
        },
        {
          name: 'Report Vulnerabilities',
          type: 'github-action',
          action: 'createSecurityIssue',
          condition: 'hasVulnerabilities',
          timeout: 10000
        }
      ]
    })

    Logger.debug(`✅ Loaded ${this.workflows.size} built-in workflows`)
  }

  async _loadCustomWorkflows() {
    Logger.debug('📋 Loading custom workflows...')

    // Load custom workflows from configuration
    const customWorkflows = this.config.get('workflows.custom', [])

    for (const workflow of customWorkflows) {
      this.workflows.set(workflow.name, workflow)
    }

    Logger.debug(`✅ Loaded ${customWorkflows.length} custom workflows`)
  }

  _registerEventListeners() {
    // Repository events
    this.eventBus.on('repository:pull_request', async (data) => {
      await this._triggerWorkflows('pull_request', data)
    })

    this.eventBus.on('repository:issue', async (data) => {
      await this._triggerWorkflows('issues', data)
    })

    this.eventBus.on('repository:push', async (data) => {
      await this._triggerWorkflows('push', data)
    })

    // Schedule events (for now, just trigger daily workflows)
    setInterval(async () => {
      await this._triggerScheduledWorkflows('daily')
    }, 86400000) // 24 hours

    setInterval(async () => {
      await this._triggerScheduledWorkflows('weekly')
    }, 604800000) // 7 days
  }

  async _triggerWorkflows(eventType, data) {
    Logger.debug(`🎯 Triggering workflows for event: ${eventType}`)

    for (const [name, workflow] of this.workflows) {
      if (this._shouldTriggerWorkflow(workflow, eventType, data)) {
        try {
          // Execute workflow in background
          this.executeWorkflow(name, data).catch(error => {
            Logger.error(`❌ Workflow ${name} execution failed:`, error)
          })
        } catch (error) {
          Logger.error(`❌ Failed to trigger workflow ${name}:`, error)
        }
      }
    }
  }

  async _triggerScheduledWorkflows(schedule) {
    Logger.debug(`⏰ Triggering scheduled workflows: ${schedule}`)

    const eventData = {
      schedule,
      timestamp: new Date()
    }

    await this._triggerWorkflows(`schedule:${schedule}`, eventData)
  }

  _shouldTriggerWorkflow(workflow, eventType, data) {
    if (!workflow.triggers) return false

    return workflow.triggers.some(trigger => {
      if (trigger === eventType) return true
      if (trigger.includes(':') && trigger.includes(eventType)) return true

      // Check for specific conditions
      if (eventType === 'pull_request' && trigger === 'pull_request:opened' && data.action === 'opened') {
        return true
      }

      if (eventType === 'issues' && trigger === 'issues:opened' && data.action === 'opened') {
        return true
      }

      return false
    })
  }

  async _executeWorkflowSteps(workflow, execution) {
    const results = []

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i]

      // Check if step should be executed based on condition
      if (step.condition && !this._checkCondition(step.condition, execution)) {
        Logger.debug(`⏭️ Skipping step ${step.name} due to condition`)
        continue
      }

      const stepExecution = {
        index: i,
        name: step.name,
        type: step.type,
        status: 'running',
        startedAt: new Date()
      }

      execution.steps.push(stepExecution)

      try {
        const result = await this._executeStep(step, execution)
        stepExecution.status = 'completed'
        stepExecution.completedAt = new Date()
        stepExecution.result = result

        results.push(result)

        Logger.debug(`✅ Step ${step.name} completed`)

      } catch (error) {
        stepExecution.status = 'failed'
        stepExecution.completedAt = new Date()
        stepExecution.error = error.message

        Logger.error(`❌ Step ${step.name} failed:`, error)

        // Stop workflow execution on step failure
        throw error
      }
    }

    return results
  }

  async _executeStep(step, execution) {
    const timeout = step.timeout || 30000

    switch (step.type) {
      case 'ai-analysis':
        return await this._executeAIAnalysisStep(step, execution, timeout)

      case 'github-action':
        return await this._executeGitHubActionStep(step, execution, timeout)

      case 'dependency-check':
        return await this._executeDependencyCheckStep(step, execution, timeout)

      case 'security-scan':
        return await this._executeSecurityScanStep(step, execution, timeout)

      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  }

  async _executeAIAnalysisStep(step, execution, timeout) {
    const aiManager = execution.context.engine?.getAIServiceManager()
    if (!aiManager) {
      throw new Error('AI Service Manager not available')
    }

    const data = execution.context.data || {}

    switch (step.service) {
      case 'prAnalysis':
        return await aiManager.analyzePR(data, execution.context)

      case 'issueAnalysis':
        return await aiManager.analyzeIssue(data, execution.context)

      case 'codeReview':
        return await aiManager.reviewCode(data.code || data.diff, execution.context)

      default:
        throw new Error(`Unknown AI service: ${step.service}`)
    }
  }

  async _executeGitHubActionStep(step, execution, timeout) {
    // This would integrate with GitHub Actions or direct GitHub API calls
    // For now, we'll simulate the action
    Logger.debug(`🎭 Executing GitHub action: ${step.action}`)

    return {
      action: step.action,
      success: true,
      timestamp: new Date()
    }
  }

  async _executeDependencyCheckStep(step, execution, timeout) {
    // This would integrate with dependency checking tools like Dependabot
    Logger.debug('🔍 Executing dependency check')

    return {
      step: 'dependency-check',
      success: true,
      updates: [],
      timestamp: new Date()
    }
  }

  async _executeSecurityScanStep(step, execution, timeout) {
    // This would integrate with security scanning tools
    Logger.debug('🔒 Executing security scan')

    return {
      step: 'security-scan',
      success: true,
      vulnerabilities: [],
      timestamp: new Date()
    }
  }

  _checkCondition(condition, execution) {
    switch (condition) {
      case 'hasIssues':
        return execution.context.issues && execution.context.issues.length > 0

      case 'hasSuggestedLabels':
        return execution.context.suggestedLabels && execution.context.suggestedLabels.length > 0

      case 'hasPriority':
        return execution.context.priority !== undefined

      case 'hasUpdates':
        return execution.context.updates && execution.context.updates.length > 0

      case 'hasVulnerabilities':
        return execution.context.vulnerabilities && execution.context.vulnerabilities.length > 0

      default:
        return true
    }
  }

  async _cancelWorkflow(workflowId) {
    const workflow = this.runningWorkflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    workflow.status = 'cancelled'
    workflow.cancelledAt = new Date()

    Logger.info(`🛑 Cancelled workflow: ${workflow.name} (${workflowId})`)

    this.eventBus.emit('workflow:cancelled', {
      workflow: workflow,
      timestamp: new Date()
    })

    return workflow
  }

  _generateWorkflowId() {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
