/**
 * OpenAI Service Provider for KhulnaSoft Development Space Engine
 *
 * Provides AI-powered services using OpenAI's API for code review,
 * issue analysis, PR analysis, and automated suggestions.
 */

import { Logger } from '../utils/Logger.js'

export class OpenAIService {
  constructor(config, eventBus) {
    this.config = config
    this.eventBus = eventBus
    this.apiKey = config.apiKey
    this.model = config.model || 'gpt-4'
    this.temperature = config.temperature || 0.7
    this.maxTokens = config.maxTokens || 2000
    this.baseUrl = 'https://api.openai.com/v1'
    this.isRunning = false
  }

  async start() {
    Logger.info('🚀 Starting OpenAI service...')

    if (!this.apiKey) {
      throw new Error('OpenAI API key is required')
    }

    // Test the connection
    await this._testConnection()

    this.isRunning = true
    Logger.info('✅ OpenAI service started successfully')
  }

  async stop() {
    Logger.info('🛑 Stopping OpenAI service...')
    this.isRunning = false
    Logger.info('✅ OpenAI service stopped')
  }

  async reviewCode(code, context = {}) {
    const prompt = this._buildCodeReviewPrompt(code, context)

    try {
      const response = await this._makeRequest('chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer. Provide constructive feedback on code quality, potential bugs, security issues, and improvements.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })

      return this._parseCodeReviewResponse(response)

    } catch (error) {
      Logger.error('❌ OpenAI code review request failed:', error)
      throw error
    }
  }

  async analyzeIssue(issue, context = {}) {
    const prompt = this._buildIssueAnalysisPrompt(issue, context)

    try {
      const response = await this._makeRequest('chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer analyzing GitHub issues. Provide insights on issue categorization, priority assessment, and suggested solutions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })

      return this._parseIssueAnalysisResponse(response, issue)

    } catch (error) {
      Logger.error('❌ OpenAI issue analysis request failed:', error)
      throw error
    }
  }

  async analyzePR(pr, context = {}) {
    const prompt = this._buildPRAnalysisPrompt(pr, context)

    try {
      const response = await this._makeRequest('chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer reviewing pull requests. Analyze changes for correctness, potential issues, and adherence to best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })

      return this._parsePRAnalysisResponse(response, pr)

    } catch (error) {
      Logger.error('❌ OpenAI PR analysis request failed:', error)
      throw error
    }
  }

  async generateSuggestions(type, data, context = {}) {
    const prompt = this._buildSuggestionsPrompt(type, data, context)

    try {
      const response = await this._makeRequest('chat/completions', {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert software engineer providing helpful suggestions for code improvement, refactoring, and best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.temperature,
        max_tokens: this.maxTokens
      })

      return this._parseSuggestionsResponse(response)

    } catch (error) {
      Logger.error('❌ OpenAI suggestions request failed:', error)
      throw error
    }
  }

  async healthCheck() {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      provider: 'openai',
      model: this.model,
      lastUsed: this.lastUsed || null
    }
  }

  async _makeRequest(endpoint, data) {
    const url = `${this.baseUrl}/${endpoint}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    this.lastUsed = new Date()
    return response.json()
  }

  async _testConnection() {
    try {
      await this._makeRequest('models', {
        // Simple models list request to test connection
      })
      Logger.debug('✅ OpenAI connection test successful')
    } catch (error) {
      Logger.error('❌ OpenAI connection test failed:', error)
      throw error
    }
  }

  _buildCodeReviewPrompt(code, context) {
    return `
Please review the following code for:
1. Code quality and style issues
2. Potential bugs or errors
3. Security vulnerabilities
4. Performance concerns
5. Best practices violations

File: ${context.filePath || 'unknown'}
Language: ${context.language || 'unknown'}

Code:
${code}

Please provide specific suggestions for improvements with line references where applicable.
`
  }

  _buildIssueAnalysisPrompt(issue, context) {
    return `
Please analyze this GitHub issue:

Title: ${issue.title}
Body: ${issue.body}
Labels: ${issue.labels?.map(l => l.name).join(', ') || 'none'}
Repository: ${context.repository || 'unknown'}

Please provide:
1. Issue categorization (bug, feature, enhancement, etc.)
2. Priority assessment (low, medium, high, critical)
3. Suggested labels to add or remove
4. Potential solutions or next steps
5. Related issues or PRs to consider

Analysis should be based on the issue content and context.
`
  }

  _buildPRAnalysisPrompt(pr, context) {
    return `
Please analyze this pull request:

Title: ${pr.title}
Description: ${pr.body}
Files changed: ${pr.changedFiles || 'unknown'}
Additions: ${pr.additions || 0}
Deletions: ${pr.deletions || 0}
Repository: ${context.repository || 'unknown'}

Please provide:
1. Summary of changes
2. Code quality assessment
3. Potential issues or concerns
4. Security implications
5. Testing requirements
6. Overall recommendation (approve, request changes, etc.)

Focus on the technical aspects and provide specific feedback.
`
  }

  _buildSuggestionsPrompt(type, data, context) {
    return `
Please provide suggestions for improving the following ${type}:

${JSON.stringify(data, null, 2)}

Context:
${JSON.stringify(context, null, 2)}

Please provide specific, actionable suggestions for:
1. Code improvements
2. Performance optimizations
3. Security enhancements
4. Best practices adoption
5. Refactoring opportunities

Focus on practical, implementable suggestions.
`
  }

  _parseCodeReviewResponse(response) {
    const content = response.choices[0]?.message?.content || ''

    // Parse the response to extract structured feedback
    return {
      summary: this._extractSection(content, 'Summary'),
      issues: this._extractIssues(content),
      suggestions: this._extractSuggestions(content),
      security: this._extractSecurityIssues(content),
      performance: this._extractPerformanceIssues(content),
      overall: this._extractOverallAssessment(content),
      confidence: this._calculateConfidence(content)
    }
  }

  _parseIssueAnalysisResponse(response, issue) {
    const content = response.choices[0]?.message?.content || ''

    return {
      category: this._extractCategory(content),
      priority: this._extractPriority(content),
      suggestedLabels: this._extractSuggestedLabels(content),
      solutions: this._extractSolutions(content),
      relatedIssues: this._extractRelatedIssues(content),
      assignee: this._extractAssignee(content)
    }
  }

  _parsePRAnalysisResponse(response, pr) {
    const content = response.choices[0]?.message?.content || ''

    return {
      summary: this._extractPRSummary(content),
      approval: this._extractApprovalRecommendation(content),
      issues: this._extractPRIssues(content),
      testing: this._extractTestingRequirements(content),
      security: this._extractPRSecurity(content),
      breaking: this._extractBreakingChanges(content)
    }
  }

  _parseSuggestionsResponse(response) {
    const content = response.choices[0]?.message?.content || ''

    return {
      improvements: this._extractImprovements(content),
      optimizations: this._extractOptimizations(content),
      security: this._extractSecuritySuggestions(content),
      refactoring: this._extractRefactoring(content)
    }
  }

  // Helper methods for parsing responses
  _extractSection(content, sectionName) {
    const regex = new RegExp(`${sectionName}[:\\s]*\\n?(.*?)(?=\\n\\n|\\n[A-Z]|$)`, 'is')
    const match = content.match(regex)
    return match ? match[1].trim() : ''
  }

  _extractIssues(content) {
    const issues = []
    const issueRegex = /Issue.*?:(.*?)(?=\n\n|\n[A-Z]|$)/gis
    let match

    while ((match = issueRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        issues.push(match[1].trim())
      }
    }

    return issues
  }

  _extractSuggestions(content) {
    const suggestions = []
    const suggestionRegex = /Suggestion.*?:(.*?)(?=\n\n|\n[A-Z]|$)/gis
    let match

    while ((match = suggestionRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        suggestions.push(match[1].trim())
      }
    }

    return suggestions
  }

  _extractSecurityIssues(content) {
    const securitySection = this._extractSection(content, 'Security')
    return securitySection || 'No security issues identified'
  }

  _extractPerformanceIssues(content) {
    const performanceSection = this._extractSection(content, 'Performance')
    return performanceSection || 'No performance issues identified'
  }

  _extractOverallAssessment(content) {
    const overallSection = this._extractSection(content, 'Overall')
    return overallSection || 'Code review completed'
  }

  _calculateConfidence(content) {
    // Simple heuristic based on response length and detail
    const wordCount = content.split(/\s+/).length
    if (wordCount > 200) return 'high'
    if (wordCount > 100) return 'medium'
    return 'low'
  }

  _extractCategory(content) {
    const categoryMatch = content.match(/Category[:\s]*([^\n]+)/i)
    return categoryMatch ? categoryMatch[1].trim() : 'uncategorized'
  }

  _extractPriority(content) {
    const priorityMatch = content.match(/Priority[:\s]*([^\n]+)/i)
    if (priorityMatch) {
      const priority = priorityMatch[1].toLowerCase().trim()
      if (['low', 'medium', 'high', 'critical'].includes(priority)) {
        return priority
      }
    }
    return 'medium'
  }

  _extractSuggestedLabels(content) {
    const labels = []
    const labelRegex = /Labels?[:\s]*([^\n]+)/gi
    const match = content.match(labelRegex)
    if (match) {
      const labelString = match[1]
      const extractedLabels = labelString.split(/[,;]/).map(l => l.trim())
      labels.push(...extractedLabels)
    }
    return labels
  }

  _extractSolutions(content) {
    return this._extractSection(content, 'Solutions') ||
           this._extractSection(content, 'Solution') || []
  }

  _extractRelatedIssues(content) {
    const related = []
    const relatedRegex = /Related.*?[:\s]*([^\n]+)/gi
    const match = content.match(relatedRegex)
    if (match) {
      const relatedString = match[1]
      const extractedRelated = relatedString.split(/[,;]/).map(r => r.trim())
      related.push(...extractedRelated)
    }
    return related
  }

  _extractAssignee(content) {
    const assigneeMatch = content.match(/Assignee[:\s]*([^\n]+)/i)
    return assigneeMatch ? assigneeMatch[1].trim() : null
  }

  _extractPRSummary(content) {
    return this._extractSection(content, 'Summary') || 'PR analysis completed'
  }

  _extractApprovalRecommendation(content) {
    const approvalMatch = content.match(/Recommendation[:\s]*([^\n]+)/i)
    if (approvalMatch) {
      const recommendation = approvalMatch[1].toLowerCase().trim()
      if (recommendation.includes('approve')) return 'approve'
      if (recommendation.includes('changes')) return 'request_changes'
      if (recommendation.includes('reject')) return 'reject'
    }
    return 'comment'
  }

  _extractPRIssues(content) {
    return this._extractIssues(content)
  }

  _extractTestingRequirements(content) {
    return this._extractSection(content, 'Testing') || 'Standard testing procedures apply'
  }

  _extractPRSecurity(content) {
    return this._extractSection(content, 'Security') || 'No security concerns identified'
  }

  _extractBreakingChanges(content) {
    const breakingSection = this._extractSection(content, 'Breaking')
    return breakingSection || 'No breaking changes detected'
  }

  _extractImprovements(content) {
    return this._extractSuggestions(content)
  }

  _extractOptimizations(content) {
    const optimizations = []
    const optimizationRegex = /Optimization.*?:(.*?)(?=\n\n|\n[A-Z]|$)/gis
    let match

    while ((match = optimizationRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        optimizations.push(match[1].trim())
      }
    }

    return optimizations
  }

  _extractSecuritySuggestions(content) {
    return this._extractSecurityIssues(content)
  }

  _extractRefactoring(content) {
    const refactoring = []
    const refactoringRegex = /Refactor.*?:(.*?)(?=\n\n|\n[A-Z]|$)/gis
    let match

    while ((match = refactoringRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        refactoring.push(match[1].trim())
      }
    }

    return refactoring
  }
}
