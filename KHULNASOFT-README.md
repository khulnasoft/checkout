# KhulnaSoft Development Space Engine 🚀

An AI-driven repository management and maintenance platform that acts as an automated maintainer for your GitHub organization.

## Features

- 🤖 **AI-Powered Code Review**: Automated code analysis and suggestions
- 📁 **Multi-Repository Management**: Monitor and manage all repositories in your organization
- ⚡ **Automated Workflows**: Intelligent issue triage, PR handling, and maintenance tasks
- 🔍 **Real-time Monitoring**: Live dashboard and metrics collection
- 🌐 **Web Interface**: Beautiful web-based dashboard for easy management

## Quick Start

### Prerequisites

- Node.js 16+
- GitHub Personal Access Token with organization access
- OpenAI API Key (for AI features)

### Installation

1. **Clone and setup:**
   ```bash
   git clone https://github.com/KhulnaSoft/checkout.git
   cd checkout
   npm install
   ```

2. **Configure the engine:**
   ```bash
   cp khulnasoft-config.json khulnasoft-config.local.json
   ```

   Edit `khulnasoft-config.local.json`:
   ```json
   {
     "github": {
       "token": "your_github_token_here",
       "organization": "your-org-name"
     },
     "ai": {
       "apiKey": "your_openai_api_key_here"
     }
   }
   ```

3. **Start the engine:**
   ```bash
   npm run start
   ```

4. **Open the web interface:**
   Navigate to `http://localhost:3000` in your browser

### Available Scripts

```bash
npm start          # Start the development engine
npm run dev        # Start in development mode with auto-reload
npm run engine     # Run the core engine only
npm run build      # Build the project
npm run test       # Run tests
npm run lint       # Run linting
```

## Architecture

### Core Components

- **KhulnaSoftEngine**: Main orchestrator for all operations
- **RepositoryManager**: Handles multi-repository discovery and management
- **AIServiceManager**: Manages AI-powered services (OpenAI integration)
- **WorkflowManager**: Executes automated workflows and maintenance tasks
- **EventBus**: Centralized event system for component communication
- **MetricsCollector**: Performance monitoring and analytics

### AI Services

The engine integrates with OpenAI to provide:

- **Code Review**: Automated code quality analysis
- **Issue Analysis**: Smart issue categorization and labeling
- **PR Analysis**: Pull request review and suggestions
- **Automated Suggestions**: Context-aware improvement recommendations

### Workflows

Built-in workflows include:

- **Code Review Workflow**: Automatic PR code review
- **Issue Triage Workflow**: Intelligent issue categorization
- **Dependency Update Workflow**: Automated dependency management
- **Security Scan Workflow**: Vulnerability detection and reporting

## Configuration

### Environment Variables

```bash
GITHUB_TOKEN=your_github_token
GITHUB_ORG=your_organization_name
OPENAI_API_KEY=your_openai_api_key
ENGINE_ENVIRONMENT=development|production
LOG_LEVEL=error|warn|info|debug
```

### Configuration File

The `khulnasoft-config.json` file supports:

```json
{
  "engine": {
    "name": "KhulnaSoft Development Space Engine",
    "version": "1.0.0",
    "environment": "development",
    "logLevel": "info"
  },
  "github": {
    "organization": "your-org",
    "apiUrl": "https://api.github.com",
    "webhookSecret": "optional_webhook_secret"
  },
  "ai": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000,
    "services": {
      "codeReview": {
        "enabled": true,
        "autoReview": false,
        "minConfidence": 0.8
      }
    }
  },
  "repositories": {
    "managedRepos": ["repo1", "repo2"],
    "ignoredRepos": ["test-repo"],
    "scanInterval": 300000,
    "autoDiscover": true
  }
}
```

## Web Interface

The web dashboard provides:

- **Real-time Status**: Live engine and component health monitoring
- **Repository Overview**: Quick access to all managed repositories
- **Workflow Management**: Execute and monitor automated workflows
- **Activity Logs**: Real-time activity and system logs
- **Metrics Dashboard**: Performance analytics and insights

### API Endpoints

- `GET /api/status` - System status and health
- `GET /api/repositories` - List all repositories
- `GET /api/logs` - Recent activity logs
- `POST /api/engine/start` - Start the engine
- `POST /api/engine/stop` - Stop the engine
- `POST /api/workflows/:name/execute` - Execute a workflow

## Development

### Project Structure

```
├── src/
│   ├── core/                 # Core engine components
│   │   ├── AIServiceManager.ts
│   │   ├── KhulnaSoftEngine.ts
│   │   ├── RepositoryManager.ts
│   │   ├── WorkflowManager.ts
│   │   ├── events/
│   │   └── monitoring/
│   ├── config/              # Configuration management
│   └── utils/               # Utilities and helpers
├── web/                     # Web interface
├── khulnasoft-config.json   # Main configuration
└── package.json
```

### Adding New Features

1. **New AI Provider**: Implement in `src/core/providers/`
2. **Custom Workflow**: Add to `WorkflowManager.ts`
3. **Additional Metrics**: Extend `MetricsCollector.ts`
4. **Web Components**: Add to `web/index.html`

### Testing

```bash
npm test              # Run test suite
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting guide
- Review the configuration documentation

---

**Happy automating with KhulnaSoft Development Space Engine!** 🚀🤖
