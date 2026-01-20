# Agent Cloud

> **AI-Powered Multi-Cloud Deployment Platform**

Deploy your applications to AWS, GCP, or Azure with intelligent AI agents that analyze your project, generate deployment plans, and execute real cloud deployments—all from a single CLI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Features

### AI-Powered Intelligence
- **Smart Project Analysis** - Automatically detects your tech stack and dependencies
- **Intelligent Planning** - AI generates optimal deployment strategies
- **Environment Validation** - Validates cloud credentials and configurations

### Multi-Cloud Support
Deploy to **3 major cloud providers** with **13 deployment targets**:

| Cloud | Container | Serverless | Static Sites | PaaS |
|-------|-----------|------------|--------------|------|
| **AWS** | ECS Fargate | Lambda | S3 | - |
| **GCP** | Cloud Run | Cloud Functions | Firebase + Storage | App Engine |
| **Azure** | Container Apps | Functions | Static Web Apps + Blob | App Service |

### Production-Ready
- **Comprehensive Logging** - Session-based logs with 5 levels
- **Error Handling** - Friendly messages with recovery suggestions
- **Deployment History** - Complete audit trail with analytics
- **Cost Tracking** - Estimated costs per deployment
- **Performance Monitoring** - Duration and success rate tracking

### Intelligent Workflows
- **Human-in-the-Loop** - Approval gates before deployment
- **Suspend/Resume** - Review plans before proceeding
- **Multi-Step Orchestration** - Automated multi-phase deployments

---

## Prerequisites

Before using Agent Cloud, ensure you have:

### Required
- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **pnpm** package manager ([Install](https://pnpm.io/installation))

### Cloud Provider CLIs (for the clouds you want to use)
- **AWS CLI** - For AWS deployments ([Install](https://aws.amazon.com/cli/))
- **gcloud CLI** - For GCP deployments ([Install](https://cloud.google.com/sdk/docs/install))
- **Azure CLI** - For Azure deployments ([Install](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli))

### API Keys (Choose one or both)
- **OpenAI API Key** - For AI agents ([Get Key](https://platform.openai.com/api-keys))
- **Google Gemini API Key** - Alternative AI provider ([Get Key](https://makersuite.google.com/app/apikey))

---

## Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/intojhanurag/agent-cloud.git
cd agent-cloud

# Install dependencies
pnpm install

# Build the project
pnpm build

# Make CLI globally available
pnpm link --global
```

### 2. Configure Cloud Provider

Choose your cloud provider and authenticate:

**For AWS:**
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

**For GCP:**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

**For Azure:**
```bash
az login
az account set --subscription YOUR_SUBSCRIPTION_ID
```

### 3. Set Environment Variables

Create a `.env` file in the project root:

```bash
# AI Provider (Choose one)
OPENAI_API_KEY=your_openai_api_key_here
# OR use Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Optional - Cloud configurations
AWS_REGION=us-east-1
GCLOUD_PROJECT=your-gcp-project
GCLOUD_REGION=us-central1
AZURE_RESOURCE_GROUP=agent-cloud-rg
AZURE_LOCATION=eastus
```

### 4. Your First Deployment

```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy to AWS (interactive mode)
cloud-agent deploy --cloud aws

# Review the deployment plan
# Approve when ready

# OR: Deploy with auto-approval
cloud-agent deploy --cloud aws --yes
```

**That's it!** Your application is now deployed to the cloud!

---

## Usage Guide

### Available Commands

```bash
# Deploy to cloud
cloud-agent deploy --cloud <aws|gcp|azure> [--yes]

# View deployment status
cloud-agent status

# List workflow history
cloud-agent workflows

# View help
cloud-agent --help
```

### Deployment Flow

When you run `cloud-agent deploy`, here's what happens:

```
Phase 1: Environment Validation
  - Validates cloud credentials
  - Checks CLI installation
  - Verifies network connectivity

Phase 2: Project Analysis
  - Detects project type (static, API, container)
  - Identifies runtime and framework
  - Analyzes dependencies

Phase 3: Deployment Planning
  - Generates cloud-specific plan
  - Estimates costs
  - Prepares deployment commands

Phase 4: Human Approval
  - Shows deployment plan
  - Waits for confirmation
  - (Skip with --yes flag)

Phase 5: Cloud Deployment
  - Authenticates with cloud provider
  - Creates cloud resources
  - Deploys your application
  - Returns deployment URL
```

---

## Cloud-Specific Guides

### AWS Deployments

**Static Sites - S3**
```bash
# Build your static site
npm run build

# Deploy to AWS S3
cloud-agent deploy --cloud aws --yes
```

**APIs/Containers - ECS Fargate**
```bash
# Deploy Node.js API
cloud-agent deploy --cloud aws --yes

# Your app will be containerized and deployed to ECS
```

**Required AWS Permissions:**
- ECS (Fargate)
- EC2 (VPC, Security Groups)
- S3 (for static sites)
- IAM (for service roles)

---

### GCP Deployments

**Static Sites - Firebase Hosting**
```bash
# Deploy to Firebase (best static hosting)
cloud-agent deploy --cloud gcp --yes
```

**APIs/Containers - Cloud Run**
```bash
# Deploy to Cloud Run (simplest container platform)
cloud-agent deploy --cloud gcp --yes
```

**Required GCP APIs:**
- Cloud Run API
- Cloud Build API
- Firebase Hosting API (for static sites)
- Cloud Storage API

---

### Azure Deployments

**Static Sites - Static Web Apps**
```bash
# Deploy to Azure Static Web Apps (with global CDN)
cloud-agent deploy --cloud azure --yes
```

**APIs/Containers - Container Apps**
```bash
# Deploy to Azure Container Apps
cloud-agent deploy --cloud azure --yes
```

**Required Azure Services:**
- Container Apps
- Container Registry
- Static Web Apps (for static sites)
- Resource Groups

---

## Deployment History & Analytics

Agent Cloud automatically tracks all deployments with detailed analytics.

### View Deployment History

```bash
# View logs from last deployment
cat .agent-cloud/logs/deployment-*.log

# View deployment history
cat .agent-cloud/config.json
```

### Configuration File

Your deployment history is stored in `.agent-cloud/config.json`:

```json
{
  "version": "1.0.0",
  "projectName": "my-app",
  "defaultCloud": "aws",
  "deployments": [
    {
      "id": "1737363780000",
      "timestamp": "2026-01-20T12:23:00.000Z",
      "cloud": "aws",
      "projectPath": "./",
      "success": true,
      "deploymentUrl": "https://my-app.aws.com",
      "resources": {
        "cluster": "my-cluster",
        "service": "my-service"
      },
      "cost": 45.00,
      "duration": 142500
    }
  ],
  "preferences": {
    "logLevel": "info",
    "region": {
      "aws": "us-east-1",
      "gcp": "us-central1",
      "azure": "eastus"
    }
  }
}
```

### Analytics

View deployment statistics programmatically:

```typescript
import { getConfigManager } from './src/utils/config.js';

const config = getConfigManager();
const stats = config.getStats();

console.log('Total Deployments:', stats.total);
console.log('Success Rate:', (stats.successful / stats.total * 100).toFixed(1) + '%');
console.log('Total Cost:', '$' + stats.totalCost.toFixed(2) + '/month');
console.log('Average Duration:', (stats.averageDuration / 1000).toFixed(1) + 's');
```

---

## Examples

### 📦 Complete Demo Application

Want to see a full working example? Check out our **[Simple Node.js API Demo](./examples/simple-nodejs-api/)**!

This complete example includes:
- ✅ Full REST API with CRUD operations
- ✅ Docker configuration for all cloud providers
- ✅ Comprehensive deployment instructions
- ✅ API testing scripts
- ✅ Step-by-step deployment guide

**Quick start:**
```bash
cd examples/simple-nodejs-api
npm install
npm start

# Then deploy to any cloud:
cloud-agent deploy --cloud aws
```

**[👉 Read the full example README →](./examples/simple-nodejs-api/README.md)**

---

### Example 1: Deploy React App to AWS

```bash
# In your React project
cd my-react-app

# Build the production bundle
npm run build

# Deploy to AWS S3
cloud-agent deploy --cloud aws --yes

# Output:
# Deployment to AWS completed successfully!
# URL: https://my-react-app.s3-website-us-east-1.amazonaws.com
# Duration: 45.2s
# Estimated Cost: $3.00/month
```

### Example 2: Deploy Node.js API to GCP

```bash
# In your Node.js API project
cd my-node-api

# Deploy to Cloud Run
cloud-agent deploy --cloud gcp --yes

# Output:
# Deployment to GCP completed successfully!
# URL: https://my-node-api-abc123.run.app
# Duration: 127.8s
# Estimated Cost: $25.00/month
```

### Example 3: Deploy Next.js App to Azure

```bash
# In your Next.js project
cd my-nextjs-app

# Build the app
npm run build

# Deploy to Azure Static Web Apps
cloud-agent deploy --cloud azure --yes

# Output:
# Deployment to Azure completed successfully!
# URL: https://my-nextjs-app.azurestaticapps.net
# Duration: 98.5s
# Estimated Cost: $0.00/month (Free tier)
```

---

## Configuration Options

### Environment Variables

```bash
# AI Configuration (Choose one)
OPENAI_API_KEY=sk-...                    # Option 1: OpenAI API key
GOOGLE_GENERATIVE_AI_API_KEY=...         # Option 2: Google Gemini API key

# AWS Configuration
AWS_REGION=us-east-1                     # Default: us-east-1
AWS_ACCESS_KEY_ID=AKIA...                # Optional: AWS credentials
AWS_SECRET_ACCESS_KEY=...                # Optional: AWS credentials

# GCP Configuration
GCLOUD_PROJECT=my-project                # Required for GCP
GCLOUD_REGION=us-central1                # Default: us-central1
GOOGLE_CLOUD_PROJECT=my-project          # Alternative to GCLOUD_PROJECT

# Azure Configuration
AZURE_SUBSCRIPTION_ID=...                # Required for Azure
AZURE_RESOURCE_GROUP=agent-cloud-rg      # Default: agent-cloud-rg
AZURE_LOCATION=eastus                    # Default: eastus
AZURE_TENANT_ID=...                      # Optional: Service principal
AZURE_CLIENT_ID=...                      # Optional: Service principal
AZURE_CLIENT_SECRET=...                  # Optional: Service principal

# Logging
LOG_LEVEL=info                           # Options: debug, info, success, warn, error
```

### User Preferences

You can set default preferences:

```typescript
import { getConfigManager } from './src/utils/config.js';

const config = getConfigManager();

// Set default cloud provider
config.setDefaultCloud('aws');

// Enable auto-approval (skip confirmation)
config.setAutoApprove(true);

// Set preferred regions
config.setPreferredRegion('aws', 'us-west-2');
config.setPreferredRegion('gcp', 'europe-west1');
config.setPreferredRegion('azure', 'westus2');
```

---

## Troubleshooting

### Common Issues

#### "Authentication Failed"

**AWS:**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Reconfigure
aws configure
```

**GCP:**
```bash
# Check authentication status
gcloud auth list

# Reauthenticate
gcloud auth login
```

**Azure:**
```bash
# Check login status
az account show

# Relogin
az login
```

#### "AI API Key Not Found"

Make sure you've set either the `OPENAI_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` environment variable:

```bash
# Option 1: Add OpenAI key to .env file
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# Option 2: Add Gemini key to .env file
echo "GOOGLE_GENERATIVE_AI_API_KEY=your-key-here" >> .env

# Or export temporarily
export OPENAI_API_KEY=sk-your-key-here
# OR
export GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
```

#### "Command Not Found: cloud-agent"

Ensure the package is linked globally:

```bash
cd /path/to/agent-cloud
pnpm link --global
```

#### Deployment Takes Too Long

This is normal! Cloud deployments can take 2-5 minutes depending on:
- Cloud provider
- Resource creation
- Container builds
- Network latency

Watch the logs for progress:
```bash
tail -f .agent-cloud/logs/deployment-*.log
```

---

## Project Structure

```
agent-cloud/
├── bin/
│   └── cli.ts                    # CLI entry point
├── src/
│   ├── cli/
│   │   ├── index.ts              # CLI commands
│   │   └── workflow-commands.ts  # Workflow commands
│   ├── mastra/
│   │   ├── agents/
│   │   │   └── index.ts          # AI agents (Validator, Analyzer, Deployment)
│   │   ├── workflows/
│   │   │   └── deployment.ts     # Deployment workflow
│   │   └── index.ts              # Mastra instance
│   ├── providers/
│   │   ├── aws/index.ts          # AWS provider
│   │   ├── gcp/index.ts          # GCP provider
│   │   └── azure/index.ts        # Azure provider
│   └── utils/
│       ├── logger.ts             # Logging system
│       ├── error-handler.ts      # Error handling
│       └── config.ts             # Configuration management
├── .agent-cloud/
│   ├── logs/                     # Deployment logs
│   └── config.json               # Configuration & history
├── .env                          # Environment variables
├── package.json
└── README.md
```

---

## Security Best Practices

1. **Never commit credentials** - Use environment variables
2. **Use IAM roles** - When deploying from CI/CD
3. **Rotate API keys** - Regularly update OpenAI and cloud keys
4. **Review logs** - Check `.agent-cloud/logs/` for sensitive data
5. **Use service principals** - For production Azure deployments
6. **Enable MFA** - On all cloud accounts

---

## Contributing

We welcome contributions! Here's how to get started:

```bash
# Fork the repository
# Clone your fork
git clone https://github.com/intojhanurag/agent-cloud.git

# Create a feature branch
git checkout -b feature/amazing-feature

# Make your changes and commit
git commit -m "Add amazing feature"

# Push to your fork
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Built with:
- [Mastra](https://mastra.ai/) - AI agent framework
- [OpenAI](https://openai.com/) - AI models
- [Google Gemini](https://ai.google.dev/) - AI models (alternative)
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Commander.js](https://github.com/tj/commander.js/) - CLI framework

---

## Support

- **Documentation**: [Read the docs](./docs/)
- **Issues**: [GitHub Issues](https://github.com/intojhanurag/agent-cloud/issues)
- **Discussions**: [GitHub Discussions](https://github.com/intojhanurag/agent-cloud/discussions)

---

## Roadmap

- [ ] Support for more cloud providers (DigitalOcean, Cloudflare)
- [ ] Rollback capabilities
- [ ] Multi-region deployments
- [ ] Database provisioning
- [ ] CI/CD integration templates
- [ ] Web UI dashboard
- [ ] Terraform export
- [ ] Cost optimization recommendations

---

<div align="center">

**Built with ❤️ by [ojha_verse](https://x.com/ojhaverse23)**

**Star us on GitHub if you find this useful!**

[Report Bug](https://github.com/intojhanurag/agent-cloud/issues) • [Request Feature](https://github.com/intojhanurag/agent-cloud/issues)

</div>
